import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL } from "@/lib/ai/claude";
import { ANALYZE_PHOTOS_SYSTEM } from "@/lib/ai/prompts/analyzePhotos";
import { analyzePhotosSchema } from "@/lib/validations";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";
import type { AiPhotoAnalysis } from "@/types";
import type { ImageBlockParam } from "@anthropic-ai/sdk/resources/messages";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, photoUrls } = analyzePhotosSchema.parse(body);

    // Build vision message content
    const imageContent: ImageBlockParam[] = photoUrls.map((url) => ({
      type: "image",
      source: { type: "url", url },
    }));

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: ANALYZE_PHOTOS_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `Analyze these ${photoUrls.length} property photo(s) for Beantown Companies. Return the structured JSON assessment.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error("No JSON in AI response");
    }

    const analysis: AiPhotoAnalysis = JSON.parse(jsonMatch[1]);

    // Update property photos with AI tags
    const photos = await prisma.propertyPhoto.findMany({ where: { property: { projects: { some: { id: projectId } } } } });

    await Promise.all(
      photos.map(async (photo, index) => {
        const photoAnalysis = analysis.photos[index];
        if (photoAnalysis) {
          await prisma.propertyPhoto.update({
            where: { id: photo.id },
            data: {
              aiTags: photoAnalysis.tags,
              aiAnalysis: photoAnalysis.observation,
            },
          });
        }
      })
    );

    // Update project scope of work condition report
    const conditionReport = `${analysis.overallSummary}\n\nPriority Items:\n${analysis.priorityItems.map((i) => `• ${i}`).join("\n")}\n\nEstimated Scope Categories: ${analysis.estimatedScopeCategories.join(", ")}`;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        scopeOfWork: {
          upsert: {
            create: {
              summary: analysis.overallSummary,
              conditionReport,
              aiGenerated: true,
            },
            update: {
              conditionReport,
            },
          },
        },
      },
    });

    return NextResponse.json({ data: analysis, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/ai/analyze-photos", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
