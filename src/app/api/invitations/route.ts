import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inviteContractorSchema } from "@/lib/validations";
import { sendBidInvitation } from "@/lib/email/resend";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, contractors } = inviteContractorSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { property: true },
    });

    if (!project) {
      return NextResponse.json({ data: null, error: "Project not found" }, { status: 404 });
    }

    const expiresAt = project.bidDeadline ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const invitations = await Promise.all(
      contractors.map(async (contractor) => {
        const invitation = await prisma.bidInvitation.create({
          data: {
            projectId,
            contractorEmail: contractor.email,
            contractorName: contractor.name,
            expiresAt,
          },
        });

        // Send email (non-blocking)
        sendBidInvitation({
          contractorName: contractor.name,
          contractorEmail: contractor.email,
          projectName: project.name,
          projectAddress: `${project.property.address}, ${project.property.city}, ${project.property.state}`,
          deadline: expiresAt,
          token: invitation.token,
        }).catch(console.error);

        return invitation;
      })
    );

    // Update project status if it's in DRAFT or SOW_GENERATED
    if (project.status === "DRAFT" || project.status === "SOW_GENERATED") {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "BIDDING_OPEN", bidOpenedAt: new Date() },
      });
    }

    return NextResponse.json({ data: invitations, error: null }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/invitations", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
