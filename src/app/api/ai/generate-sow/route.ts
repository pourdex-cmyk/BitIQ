import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL } from "@/lib/ai/claude";
import { GENERATE_SOW_SYSTEM, buildGenerateSowPrompt } from "@/lib/ai/prompts/generateSow";
import { generateSowSchema } from "@/lib/validations";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";
import type { SowLineItemInput } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = generateSowSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        property: true,
        scopeOfWork: true,
      },
    });

    if (!project) {
      return NextResponse.json({ data: null, error: "Project not found" }, { status: 404 });
    }

    const benchmarks = await prisma.benchmarkDataPoint.findMany({
      where: { region: "CT" },
      select: { category: true, unit: true, laborMid: true, materialMid: true },
    });

    const conditionReport =
      project.scopeOfWork?.conditionReport ??
      `Property at ${project.property.address}, ${project.property.city}. ${project.property.propertyType} property, ${project.property.squareFootage ?? "unknown"} SF, built ${project.property.yearBuilt ?? "unknown"}. Full renovation required.`;

    const prompt = buildGenerateSowPrompt(
      conditionReport,
      project.property.squareFootage,
      project.property.propertyType,
      benchmarks
    );

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 4096,
      system: GENERATE_SOW_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    let fullText = "";
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        // Parse and save after streaming completes
        try {
          const jsonMatch =
            fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
            fullText.match(/(\[[\s\S]*\])/);
          if (jsonMatch) {
            const lineItems: SowLineItemInput[] = JSON.parse(jsonMatch[1]);

            // Delete existing line items and recreate
            if (project.scopeOfWork) {
              await prisma.sowLineItem.deleteMany({
                where: { sowId: project.scopeOfWork.id },
              });
            }

            const totalMid = lineItems.reduce(
              (sum, item) => sum + (item.benchmarkMid ?? 0),
              0
            );

            await prisma.project.update({
              where: { id: projectId },
              data: {
                status: "SOW_GENERATED",
                aiBenchmarkMid: totalMid,
                aiBenchmarkLow: lineItems.reduce(
                  (sum, item) => sum + (item.benchmarkLow ?? 0),
                  0
                ),
                aiBenchmarkHigh: lineItems.reduce(
                  (sum, item) => sum + (item.benchmarkHigh ?? 0),
                  0
                ),
                scopeOfWork: {
                  upsert: {
                    create: {
                      summary: conditionReport.slice(0, 200),
                      aiGenerated: true,
                      lineItems: {
                        create: lineItems.map((item) => ({
                          sortOrder: item.sortOrder,
                          category: item.category,
                          description: item.description,
                          unit: item.unit,
                          estimatedQty: item.estimatedQty,
                          benchmarkLow: item.benchmarkLow,
                          benchmarkMid: item.benchmarkMid,
                          benchmarkHigh: item.benchmarkHigh,
                          notes: item.notes,
                          required: item.required,
                        })),
                      },
                    },
                    update: {
                      aiGenerated: true,
                      updatedAt: new Date(),
                      lineItems: {
                        create: lineItems.map((item) => ({
                          sortOrder: item.sortOrder,
                          category: item.category,
                          description: item.description,
                          unit: item.unit,
                          estimatedQty: item.estimatedQty,
                          benchmarkLow: item.benchmarkLow,
                          benchmarkMid: item.benchmarkMid,
                          benchmarkHigh: item.benchmarkHigh,
                          notes: item.notes,
                          required: item.required,
                        })),
                      },
                    },
                  },
                },
              },
            });
          }
        } catch (parseError) {
          console.error("Error parsing/saving SOW:", parseError);
        }

        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/ai/generate-sow", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
