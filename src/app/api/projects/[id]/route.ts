import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

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

    const project = await prisma.project.update({
      where: { id },
      data: body,
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
