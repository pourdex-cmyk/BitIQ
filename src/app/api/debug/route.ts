import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function connInfo() {
  const candidates: Record<string, string | undefined> = {
    DIRECT_URL: process.env.DIRECT_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
  };
  const info: Record<string, string> = {};
  for (const [k, v] of Object.entries(candidates)) {
    if (v) {
      try {
        const u = new URL(v);
        info[k] = `${u.hostname}:${u.port || 5432}`;
      } catch {
        info[k] = "set (unparseable)";
      }
    } else {
      info[k] = "NOT SET";
    }
  }
  return info;
}

export async function GET() {
  const results: Record<string, unknown> = {
    connInfo: connInfo(),
  };

  try {
    results.projectCount = await prisma.project.count();
  } catch(e) { results.projectCountError = (e as Error).message; }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [activeProjects, bidsThisMonth, bidsLastMonth, allScoredBids, recentBids] = await Promise.all([
      prisma.project.count({ where: { status: { in: ["BIDDING_OPEN","BIDDING_CLOSED","BID_SELECTED","CONTRACTING","IN_PROGRESS"] } } }),
      prisma.bid.count({ where: { submittedAt: { gte: startOfMonth }, status: { not: "DRAFT" } } }),
      prisma.bid.count({ where: { submittedAt: { gte: lastMonth, lt: startOfMonth }, status: { not: "DRAFT" } } }),
      prisma.bid.findMany({ where: { aiOverallScore: { not: null } }, select: { aiOverallScore: true } }),
      prisma.bid.findMany({
        where: { status: { not: "DRAFT" } },
        orderBy: { submittedAt: "desc" },
        take: 8,
        include: { project: { include: { property: true } }, contractorProfile: true },
      }),
    ]);
    results.dashboardData = { activeProjects, bidsThisMonth, bidsLastMonth, scoredBidsCount: allScoredBids.length, recentBidsCount: recentBids.length };
  } catch(e) { results.dashboardDataError = (e as Error).message; }

  try {
    const projects = await prisma.project.findMany({
      include: {
        property: { include: { photos: true } },
        owner: true,
        scopeOfWork: { include: { lineItems: true } },
        bids: { include: { lineItems: true, contractor: true, contractorProfile: true, invitation: true } },
        invitations: true,
        contract: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    results.allProjectsCount = projects.length;
  } catch(e) { results.allProjectsError = (e as Error).message; }

  return NextResponse.json(results);
}
