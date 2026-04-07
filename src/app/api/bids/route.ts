import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get("projectId");

    const bids = await prisma.bid.findMany({
      where: projectId ? { projectId } : {},
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
        contractor: true,
        contractorProfile: true,
        invitation: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ data: bids, error: null });
  } catch (error) {
    console.error("GET /api/bids", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
