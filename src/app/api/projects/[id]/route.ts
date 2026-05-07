import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";
import type { ProjectStatus } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        property: { include: { photos: true } },
        owner: true,
        scopeOfWork: { include: { lineItems: { orderBy: { sortOrder: "asc" } } } },
        bids: {
          include: {
            lineItems: { orderBy: { sortOrder: "asc" } },
            contractor: true,
            contractorProfile: true,
            invitation: true,
          },
          orderBy: { submittedAt: "desc" },
        },
        invitations: { orderBy: { sentAt: "desc" } },
        contract: { include: { milestones: { orderBy: { sortOrder: "asc" } } } },
      },
    });

    if (!project) {
      return NextResponse.json({ data: null, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data: project, error: null });
  } catch (error) {
    console.error("GET /api/projects/[id]", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

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

    // Build a safe update payload — only allow known updatable fields
    type UpdateData = {
      status?: ProjectStatus;
      bidDeadline?: string | null;
      bidOpenedAt?: string | null;
      bidClosedAt?: string | null;
      selectedBidId?: string | null;
      selectedAt?: string | null;
      name?: string;
      description?: string | null;
      budgetTarget?: number | null;
    };

    const updateData: UpdateData = {};

    // Handle named actions
    if (body.action === "close_bidding") {
      updateData.status = "BIDDING_CLOSED" as ProjectStatus;
      updateData.bidClosedAt = new Date().toISOString();
    } else if (body.action === "open_bidding") {
      updateData.status = "BIDDING_OPEN" as ProjectStatus;
      updateData.bidOpenedAt = new Date().toISOString();
    } else {
      // Direct field updates — only allow safe fields
      const allowed: (keyof UpdateData)[] = [
        "status", "bidDeadline", "bidOpenedAt", "bidClosedAt",
        "selectedBidId", "selectedAt", "name", "description", "budgetTarget",
      ];
      for (const key of allowed) {
        if (key in body) (updateData as Record<string, unknown>)[key] = body[key];
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        property: { include: { photos: true } },
        owner: true,
        scopeOfWork: { include: { lineItems: true } },
        bids: true,
        invitations: true,
        contract: true,
      },
    });

    return NextResponse.json({ data: project, error: null });
  } catch (error) {
    console.error("PATCH /api/projects/[id]", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ data: { id }, error: null });
  } catch (error) {
    console.error("DELETE /api/projects/[id]", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
