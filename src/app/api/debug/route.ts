import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.project.count();
    const bid = await prisma.bid.findFirst({
      include: {
        project: { include: { property: true } },
        contractorProfile: true,
      },
    });
    return NextResponse.json({ ok: true, projects: count, sampleBid: bid?.id ?? null });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5) : null,
    }, { status: 500 });
  }
}
