import { prisma } from "@/lib/prisma";
import { ContractorsClient } from "@/components/contractors/ContractorsClient";
import type { ContractorWithProfile } from "@/types";

async function getContractors(search?: string): Promise<ContractorWithProfile[]> {
  return prisma.user.findMany({
    where: {
      role: "CONTRACTOR",
      contractorProfile: { isNot: null },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              {
                contractorProfile: {
                  companyName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      contractorProfile: true,
      submittedBids: {
        where: { status: { notIn: ["DRAFT", "WITHDRAWN"] } },
        select: { id: true, totalBidAmount: true, status: true, submittedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }) as unknown as ContractorWithProfile[];
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; view?: string; tab?: string }>;
}) {
  const { search, view, tab } = await searchParams;
  const contractors = JSON.parse(JSON.stringify(await getContractors(search))) as ContractorWithProfile[];

  return (
    <ContractorsClient
      contractors={contractors}
      initialView={(view as "table" | "card") ?? "table"}
      initialTab={(tab as "all" | "leaderboard") ?? "all"}
      initialSearch={search ?? ""}
    />
  );
}
