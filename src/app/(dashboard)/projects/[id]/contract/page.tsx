export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ContractPage } from "@/components/compare/ContractPage";
import type { ProjectWithRelations } from "@/types";

async function getProject(id: string): Promise<ProjectWithRelations | null> {
  return prisma.project.findUnique({
    where: { id },
    include: {
      property: { include: { photos: true } },
      owner: true,
      scopeOfWork: { include: { lineItems: true } },
      bids: {
        include: {
          lineItems: true,
          contractor: true,
          contractorProfile: true,
          invitation: true,
        },
      },
      invitations: true,
      contract: {
        include: { milestones: { orderBy: { sortOrder: "asc" } } },
      },
    },
  }) as Promise<ProjectWithRelations | null>;
}

export default async function ContractPageRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getProject(id);

  if (!raw) {
    notFound();
  }

  const project = JSON.parse(JSON.stringify(raw)) as ProjectWithRelations;
  return <ContractPage project={project} />;
}
