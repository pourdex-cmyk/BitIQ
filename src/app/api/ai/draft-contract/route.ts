import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL } from "@/lib/ai/claude";
import { DRAFT_CONTRACT_SYSTEM, buildDraftContractPrompt } from "@/lib/ai/prompts/draftContract";
import { draftContractSchema } from "@/lib/validations";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, bidId } = draftContractSchema.parse(body);

    const [project, bid] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          property: true,
          scopeOfWork: { include: { lineItems: true } },
        },
      }),
      prisma.bid.findUnique({
        where: { id: bidId },
        include: { lineItems: true },
      }),
    ]);

    if (!project || !bid) {
      return NextResponse.json({ data: null, error: "Project or bid not found" }, { status: 404 });
    }

    const prompt = buildDraftContractPrompt({
      propertyAddress: `${project.property.address}, ${project.property.city}, ${project.property.state} ${project.property.zip}`,
      contractorName: bid.contractorName,
      contractorCompany: bid.contractorCompany,
      totalAmount: bid.totalBidAmount ?? 0,
      startDate: bid.proposedStartDate?.toISOString().split("T")[0],
      estimatedDays: bid.estimatedDays ?? undefined,
      scopeSummary: project.scopeOfWork?.summary ?? project.description ?? "Full renovation",
      lineItems: bid.lineItems.map((li) => ({
        category: li.category,
        totalCost: li.totalCost,
      })),
      paymentTerms: bid.paymentTerms ?? undefined,
    });

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 6000,
      system: DRAFT_CONTRACT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const contractText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Create or update contract record
    const contract = await prisma.contract.upsert({
      where: { projectId },
      create: {
        projectId,
        bidId,
        status: "DRAFT",
        contractorCompany: bid.contractorCompany,
        contractorName: bid.contractorName,
        totalAmount: bid.totalBidAmount ?? 0,
        startDate: bid.proposedStartDate,
        completionDate: bid.proposedStartDate && bid.estimatedDays
          ? new Date(
              bid.proposedStartDate.getTime() +
                bid.estimatedDays * 24 * 60 * 60 * 1000
            )
          : undefined,
        paymentTerms: bid.paymentTerms,
        aiDrafted: true,
        documentUrl: contractText, // stored as markdown
        milestones: {
          create: [
            {
              sortOrder: 1,
              name: "Contract Signing / Mobilization",
              description: "Initial deposit upon contract execution",
              amount: Math.round((bid.totalBidAmount ?? 0) * 0.1),
            },
            {
              sortOrder: 2,
              name: "Rough-In Complete",
              description: "Framing, plumbing, electrical rough-in inspected",
              amount: Math.round((bid.totalBidAmount ?? 0) * 0.35),
            },
            {
              sortOrder: 3,
              name: "Substantial Completion",
              description: "All major work complete, punch list issued",
              amount: Math.round((bid.totalBidAmount ?? 0) * 0.45),
            },
            {
              sortOrder: 4,
              name: "Final Completion",
              description: "All punch list items resolved, lien waivers received",
              amount: Math.round((bid.totalBidAmount ?? 0) * 0.1),
            },
          ],
        },
      },
      update: {
        bidId,
        contractorCompany: bid.contractorCompany,
        contractorName: bid.contractorName,
        totalAmount: bid.totalBidAmount ?? 0,
        startDate: bid.proposedStartDate,
        aiDrafted: true,
        documentUrl: contractText,
        updatedAt: new Date(),
      },
      include: { milestones: { orderBy: { sortOrder: "asc" } } },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "CONTRACTING" },
    });

    return NextResponse.json({ data: { contract, contractText }, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/ai/draft-contract", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
