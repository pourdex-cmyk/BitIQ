import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ContractorProfileClient } from "@/components/contractors/ContractorProfileClient";
import type { ContractorWithProfile } from "@/types";
import type { Bid, BidLineItem, BidInvitation, ContractorProfile } from "@/types";

type FullContractor = ContractorWithProfile & {
  contractorProfile: ContractorProfile | null;
  submittedBids: (Bid & {
    lineItems: BidLineItem[];
    invitation: BidInvitation | null;
  })[];
};

async function getContractor(id: string): Promise<FullContractor | null> {
  return prisma.user.findUnique({
    where: { id, role: "CONTRACTOR" },
    include: {
      contractorProfile: true,
      submittedBids: {
        include: {
          lineItems: true,
          invitation: true,
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  }) as unknown as Promise<FullContractor | null>;
}

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractor = await getContractor(id);

  if (!contractor) {
    notFound();
  }

  return <ContractorProfileClient contractor={contractor as unknown as ContractorWithProfile} />;
}
