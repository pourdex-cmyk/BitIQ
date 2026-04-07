import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bidFormSchema } from "@/lib/validations";
import { sendBidSubmittedConfirmation, sendBidReceivedNotification } from "@/lib/email/resend";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await prisma.bidInvitation.findUnique({
      where: { token },
      include: {
        project: {
          include: {
            property: { include: { photos: true } },
            scopeOfWork: { include: { lineItems: { orderBy: { sortOrder: "asc" } } } },
          },
        },
        bid: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ data: null, error: "Invalid invitation token" }, { status: 404 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ data: null, error: "Invitation has expired" }, { status: 410 });
    }

    // Mark as viewed if not already
    if (!invitation.viewedAt) {
      await prisma.bidInvitation.update({
        where: { token },
        data: { viewedAt: new Date(), status: "VIEWED" },
      });
    }

    return NextResponse.json({ data: invitation, error: null });
  } catch (error) {
    console.error("GET /api/bids/submit/[token]", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await prisma.bidInvitation.findUnique({
      where: { token },
      include: {
        project: { include: { owner: true } },
        bid: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ data: null, error: "Invalid invitation token" }, { status: 404 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ data: null, error: "Invitation has expired" }, { status: 410 });
    }

    const body = await request.json();
    const isDraft = body.draft === true;

    if (!isDraft) {
      const validated = bidFormSchema.parse(body);

      const totalLaborCost = validated.lineItems.reduce(
        (sum, item) => sum + (item.laborCost ?? 0),
        0
      );
      const totalMaterialCost = validated.lineItems.reduce(
        (sum, item) => sum + (item.materialCost ?? 0),
        0
      );
      const totalBidAmount = validated.lineItems.reduce(
        (sum, item) => sum + (item.totalCost ?? (item.laborCost ?? 0) + (item.materialCost ?? 0)),
        0
      );

      // Upsert bid
      const bid = await prisma.bid.upsert({
        where: { invitationId: invitation.id },
        create: {
          projectId: invitation.projectId,
          invitationId: invitation.id,
          status: "SUBMITTED",
          contractorCompany: validated.contractorCompany,
          contractorName: validated.contractorName,
          contractorEmail: validated.contractorEmail,
          contractorPhone: validated.contractorPhone,
          licenseNumber: validated.licenseNumber,
          yearsExperience: validated.yearsExperience,
          primaryTrade: validated.primaryTrade,
          insuranceOnFile: validated.insuranceOnFile,
          totalLaborCost,
          totalMaterialCost,
          totalBidAmount,
          proposedStartDate: validated.proposedStartDate
            ? new Date(validated.proposedStartDate)
            : undefined,
          estimatedDays: validated.estimatedDays,
          paymentTerms: validated.paymentTerms,
          bidValidUntil: validated.bidValidUntil ? new Date(validated.bidValidUntil) : undefined,
          exclusions: validated.exclusions,
          allowances: validated.allowances,
          assumptions: validated.assumptions,
          notes: validated.notes,
          submittedAt: new Date(),
          lineItems: {
            create: validated.lineItems.map((item) => ({
              sowLineItemId: item.sowLineItemId,
              sortOrder: item.sortOrder,
              category: item.category,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              laborCost: item.laborCost,
              materialCost: item.materialCost,
              totalCost:
                item.totalCost ?? (item.laborCost ?? 0) + (item.materialCost ?? 0),
              estimatedDays: item.estimatedDays,
              subcontracted: item.subcontracted,
              subcontractorName: item.subcontractorName,
              notes: item.notes,
            })),
          },
        },
        update: {
          status: "SUBMITTED",
          contractorCompany: validated.contractorCompany,
          contractorName: validated.contractorName,
          contractorEmail: validated.contractorEmail,
          contractorPhone: validated.contractorPhone,
          licenseNumber: validated.licenseNumber,
          yearsExperience: validated.yearsExperience,
          primaryTrade: validated.primaryTrade,
          insuranceOnFile: validated.insuranceOnFile,
          totalLaborCost,
          totalMaterialCost,
          totalBidAmount,
          proposedStartDate: validated.proposedStartDate
            ? new Date(validated.proposedStartDate)
            : undefined,
          estimatedDays: validated.estimatedDays,
          paymentTerms: validated.paymentTerms,
          bidValidUntil: validated.bidValidUntil ? new Date(validated.bidValidUntil) : undefined,
          exclusions: validated.exclusions,
          allowances: validated.allowances,
          assumptions: validated.assumptions,
          notes: validated.notes,
          submittedAt: new Date(),
        },
        include: {
          lineItems: true,
          project: { include: { owner: true } },
        },
      });

      // Update invitation status
      await prisma.bidInvitation.update({
        where: { token },
        data: { status: "BID_SUBMITTED", respondedAt: new Date() },
      });

      // Send emails (non-blocking)
      Promise.all([
        sendBidSubmittedConfirmation({
          contractorEmail: validated.contractorEmail,
          contractorName: validated.contractorName,
          projectName: invitation.project.name,
          totalAmount: totalBidAmount,
        }).catch(console.error),
        sendBidReceivedNotification({
          pmEmail: invitation.project.owner.email,
          pmName: invitation.project.owner.name,
          contractorCompany: validated.contractorCompany,
          projectName: invitation.project.name,
          totalAmount: totalBidAmount,
          projectId: invitation.projectId,
        }).catch(console.error),
      ]);

      return NextResponse.json({ data: bid, error: null }, { status: 201 });
    } else {
      // Save draft
      const draftData = {
        projectId: invitation.projectId,
        invitationId: invitation.id,
        status: "DRAFT" as const,
        contractorCompany: body.contractorCompany ?? invitation.contractorName,
        contractorName: body.contractorName ?? invitation.contractorName,
        contractorEmail: body.contractorEmail ?? invitation.contractorEmail,
        contractorPhone: body.contractorPhone,
        notes: body.notes,
      };

      const draft = await prisma.bid.upsert({
        where: { invitationId: invitation.id },
        create: draftData,
        update: { ...draftData },
      });

      return NextResponse.json({ data: draft, error: null });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/bids/submit/[token]", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
