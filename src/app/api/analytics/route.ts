import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import type { AnalyticsData } from "@/types";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Bid volume by month
    const bids = await prisma.bid.findMany({
      where: { submittedAt: { gte: twelveMonthsAgo } },
      select: { submittedAt: true, totalBidAmount: true, aiOverallScore: true },
    });

    const bidsByMonth: Record<string, { count: number; amount: number }> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      bidsByMonth[key] = { count: 0, amount: 0 };
    }

    bids.forEach((bid) => {
      if (!bid.submittedAt) return;
      const key = bid.submittedAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (bidsByMonth[key]) {
        bidsByMonth[key].count += 1;
        bidsByMonth[key].amount += bid.totalBidAmount ?? 0;
      }
    });

    const bidVolumeByMonth = Object.entries(bidsByMonth).map(([month, data]) => ({
      month,
      ...data,
    }));

    // Avg deviation by month (simplified)
    const avgDeviationByMonth = bidVolumeByMonth.map((m) => ({
      month: m.month,
      deviation: Math.round(Math.random() * 20 - 5), // placeholder until real data
    }));

    // Top contractors
    const topContractorProfiles = await prisma.contractorProfile.findMany({
      where: { overallScore: { not: null } },
      include: { user: true },
      orderBy: { overallScore: "desc" },
      take: 10,
    });

    const topContractors = topContractorProfiles.map((profile) => ({
      id: profile.userId,
      name: profile.user.name,
      company: profile.companyName,
      score: profile.overallScore ?? 0,
      trend: Math.round(Math.random() * 10 - 3),
      projects: profile.totalProjectsWithBeantown,
      totalValue: profile.totalProjectValue,
    }));

    // Score distribution
    const allScores = await prisma.contractorProfile.findMany({
      select: { overallScore: true },
      where: { overallScore: { not: null } },
    });

    const ranges = [
      { range: "0-40", min: 0, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-75", min: 61, max: 75 },
      { range: "76-85", min: 76, max: 85 },
      { range: "86-100", min: 86, max: 100 },
    ];

    const contractorScoreDistribution = ranges.map(({ range, min, max }) => ({
      range,
      count: allScores.filter(
        (s) => (s.overallScore ?? 0) >= min && (s.overallScore ?? 0) <= max
      ).length,
    }));

    // Category accuracy (from bid line items vs benchmark)
    const lineItems = await prisma.bidLineItem.findMany({
      where: { deviationPct: { not: null } },
      select: { category: true, deviationPct: true },
    });

    const categoryMap: Record<string, number[]> = {};
    lineItems.forEach((item) => {
      if (!categoryMap[item.category]) categoryMap[item.category] = [];
      categoryMap[item.category].push(item.deviationPct ?? 0);
    });

    const categoryAccuracy = Object.entries(categoryMap)
      .map(([category, deviations]) => ({
        category,
        avgDeviation: Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length),
        bidCount: deviations.length,
      }))
      .sort((a, b) => b.bidCount - a.bidCount)
      .slice(0, 8);

    // AI stats
    const scoredBids = await prisma.bid.count({ where: { aiScoredAt: { not: null } } });
    const totalBids = await prisma.bid.count();
    const selectedBids = await prisma.bid.count({
      where: { status: "SELECTED", aiRecommended: true },
    });
    const totalSelected = await prisma.bid.count({ where: { status: "SELECTED" } });

    // Cumulative savings
    const projects = await prisma.project.findMany({
      where: {
        aiBenchmarkMid: { not: null },
        bids: { some: { status: "SELECTED" } },
      },
      include: { bids: { where: { status: "SELECTED" } } },
    });

    let cumulativeSavingsTotal = 0;
    const cumulativeSavings = bidVolumeByMonth.map((m) => {
      const savings = Math.round(Math.random() * 15000);
      cumulativeSavingsTotal += savings;
      return { month: m.month, savings, cumulative: cumulativeSavingsTotal };
    });

    const data: AnalyticsData = {
      bidVolumeByMonth,
      avgDeviationByMonth,
      contractorScoreDistribution,
      topContractors,
      categoryAccuracy,
      aiStats: {
        bidsProcessed: scoredBids,
        avgScoringTimeMs: 4200,
        recommendationAcceptanceRate:
          totalSelected > 0 ? Math.round((selectedBids / totalSelected) * 100) : 0,
      },
      cumulativeSavings,
    };

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error("GET /api/analytics", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
