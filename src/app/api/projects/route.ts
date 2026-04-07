import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";
import { getUser } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const projects = await prisma.project.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { property: { address: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
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

    return NextResponse.json({ data: projects, error: null });
  } catch (error) {
    console.error("GET /api/projects", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = projectSchema.parse(body);

    // Create property first, then project
    const property = await prisma.property.create({
      data: {
        address: validated.address,
        city: validated.city,
        state: validated.state,
        zip: validated.zip,
        propertyType: validated.propertyType,
        squareFootage: validated.squareFootage ?? null,
        yearBuilt: validated.yearBuilt ?? null,
        purchasePrice: validated.purchasePrice ?? null,
      },
    });

    const project = await prisma.project.create({
      data: {
        name: validated.name ?? `${validated.address} Renovation`,
        description: validated.description ?? null,
        budgetTarget: validated.budgetTarget ?? null,
        bidDeadline: validated.bidDeadline ? new Date(validated.bidDeadline) : null,
        ownerId: dbUser.id,
        propertyId: property.id,
      },
      include: {
        property: { include: { photos: true } },
        owner: true,
        scopeOfWork: { include: { lineItems: true } },
        bids: true,
        invitations: true,
        contract: true,
      },
    });

    return NextResponse.json({ data: project, error: null }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: error.issues[0]?.message ?? error.message }, { status: 400 });
    }
    console.error("POST /api/projects", error);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
