import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ComparisonDashboard } from "@/components/compare/ComparisonDashboard";
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
        orderBy: [{ aiOverallScore: "desc" }, { totalBidAmount: "asc" }],
      },
      invitations: true,
      contract: true,
    },
  }) as Promise<ProjectWithRelations | null>;
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <ComparisonDashboard project={project} />;
}
