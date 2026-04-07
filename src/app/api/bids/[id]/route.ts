import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["select"]).optional(),
  status: z.enum(["SUBMITTED", "AI_PROCESSING", "AI_SCORED", "UNDER_REVIEW", "SELECTED", "REJECTED", "WITHDRAWN"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.action === "select") {
      const bid = await prisma.bid.findUnique({ where: { id } });
      if (!bid) {
        return NextResponse.json({ data: null, error: "Bid not found" }, { status: 404 });
      }

      // Reject all other bids for this project
      await prisma.bid.updateMany({
        where: { projectId: bid.projectId, id: { not: id } },
        data: { status: "REJECTED" },
      });

      // Select this bid
      const updatedBid = await prisma.bid.update({
        where: { id },
        data: { status: "SELECTED" },
      });

      // Update project status
      await prisma.project.update({
        where: { id: bid.projectId },
        data: {
          status: "BID_SELECTED",
          selectedBidId: id,
          selectedAt: new Date(),
        },
      });

      return NextResponse.json({ data: updatedBid, error: null });
    }

    const validated = patchSchema.parse(body);
    const bid = await prisma.bid.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ data: bid, error: null });
  } catch (error) {
    console.error("PATCH /api/bids/[id]", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
