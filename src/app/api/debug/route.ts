import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    results.projectCount = await prisma.project.count();
  } catch(e) { results.projectCountError = (e as Error).message; }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    results.bidsThisMonth = await prisma.bid.count({
      where: { submittedAt: { gte: startOfMonth }, status: { not: "DRAFT" } },
    });
  } catch(e) { results.bidsThisMonthError = (e as Error).message; }

  try {
    results.recentBids = await prisma.bid.findMany({
      where: { status: { not: "DRAFT" } },
      orderBy: { submittedAt: "desc" },
      take: 3,
      include: {
        project: { include: { property: true } },
        contractorProfile: true,
      },
    });
  } catch(e) { results.recentBidsError = (e as Error).message; }

  try {
    results.projects = await prisma.project.findMany({
      take: 2,
      include: {
        property: { include: { photos: true } },
        owner: true,
        scopeOfWork: { include: { lineItems: true } },
        bids: {
          include: { lineItems: true, contractor: true, contractorProfile: true, invitation: true },
        },
        invitations: true,
        contract: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch(e) { results.projectsError = (e as Error).message; }

  return NextResponse.json(results);
}
