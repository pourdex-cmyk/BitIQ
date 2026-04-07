import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJson } from "@/lib/ai/claude";
import { SCORE_BIDS_SYSTEM, buildScoreBidsPrompt } from "@/lib/ai/prompts/scoreBids";
import { scoreBidsSchema } from "@/lib/validations";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";
import type { ScoredBid } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = scoreBidsSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scopeOfWork: { include: { lineItems: true } },
        bids: {
          where: { status: { in: ["SUBMITTED", "DRAFT"] } },
          include: {
            lineItems: true,
            contractorProfile: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ data: null, error: "Project not found" }, { status: 404 });
    }

    if (!project.scopeOfWork) {
      return NextResponse.json(
        { data: null, error: "Project has no scope of work" },
        { status: 400 }
      );
    }

    if (project.bids.length === 0) {
      return NextResponse.json({ data: null, error: "No submitted bids to score" }, { status: 400 });
    }

    // Mark all bids as AI_PROCESSING
    await prisma.bid.updateMany({
      where: { projectId, status: { in: ["SUBMITTED"] } },
      data: { status: "AI_PROCESSING" },
    });

    const sowItems = project.scopeOfWork.lineItems.map((item) => ({
      id: item.id,
      category: item.category,
      description: item.description,
      benchmarkMid: item.benchmarkMid,
    }));

    const bidsToScore = project.bids.map((bid) => ({
      id: bid.id,
      contractorCompany: bid.contractorCompany,
      contractorName: bid.contractorName,
      totalBidAmount: bid.totalBidAmount,
      yearsExperience: bid.yearsExperience,
      lineItems: bid.lineItems.map((li) => ({
        sowLineItemId: li.sowLineItemId,
        category: li.category,
        description: li.description,
        totalCost: li.totalCost,
      })),
      contractorProfile: bid.contractorProfile
        ? {
            overallScore: bid.contractorProfile.overallScore,
            bidAccuracyScore: bid.contractorProfile.bidAccuracyScore,
            onTimeScore: bid.contractorProfile.onTimeScore,
            qualityScore: bid.contractorProfile.qualityScore,
            changeOrderScore: bid.contractorProfile.changeOrderScore,
            totalProjectsWithBeantown: bid.contractorProfile.totalProjectsWithBeantown,
          }
        : null,
    }));

    const prompt = buildScoreBidsPrompt(sowItems, bidsToScore);

    const result = await generateJson<{
      scoredBids: ScoredBid[];
      overallRecommendation: string;
    }>(SCORE_BIDS_SYSTEM, prompt);

    // Update each bid with scores
    await Promise.all(
      result.scoredBids.map(async (scored) => {
        // Update line item flags
        await Promise.all(
          scored.lineItemFlags.map(async (flag) => {
            await prisma.bidLineItem.updateMany({
              where: { bidId: scored.bidId, sowLineItemId: flag.sowLineItemId },
              data: {
                aiFlag: flag.flag,
                aiFlagReason: flag.reason,
                deviationPct: flag.deviationPct,
              },
            });
          })
        );

        await prisma.bid.update({
          where: { id: scored.bidId },
          data: {
            status: "AI_SCORED",
            aiOverallScore: scored.compositeScore,
            aiBidVsBenchmark: scored.aiBidVsBenchmark,
            aiHistoricalScore: scored.aiHistoricalScore,
            aiRiskScore: scored.aiRiskScore,
            aiRecommended: scored.isRecommended,
            aiRationale: scored.rationale,
            aiScoredAt: new Date(),
          },
        });
      })
    );

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "BIDDING_CLOSED", bidClosedAt: new Date() },
    });

    return NextResponse.json({
      data: {
        scoredBids: result.scoredBids,
        overallRecommendation: result.overallRecommendation,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/ai/score-bids", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
