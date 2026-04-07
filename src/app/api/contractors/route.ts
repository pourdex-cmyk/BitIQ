import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get("search");

    const contractors = await prisma.user.findMany({
      where: {
        role: "CONTRACTOR",
        contractorProfile: { isNot: null },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { contractorProfile: { companyName: { contains: search, mode: "insensitive" } } },
                {
                  contractorProfile: {
                    primaryTrade: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        contractorProfile: true,
        submittedBids: {
          where: { status: { in: ["SUBMITTED", "AI_SCORED", "SELECTED", "REJECTED"] } },
          orderBy: { submittedAt: "desc" },
          take: 10,
        },
      },
      orderBy: { contractorProfile: { overallScore: "desc" } },
    });

    return NextResponse.json({ data: contractors, error: null });
  } catch (error) {
    console.error("GET /api/contractors", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
