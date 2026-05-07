export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ContractorsClient } from "@/components/contractors/ContractorsClient";
import type { ContractorWithProfile } from "@/types";
import { DiagnosticBoundary } from "@/components/shared/DiagnosticBoundary";

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
  let search: string | undefined;
  let view: string | undefined;
  let tab: string | undefined;
  let contractors: ContractorWithProfile[] = [];
  let pageError: string | null = null;

  try {
    ({ search, view, tab } = await searchParams);
    contractors = JSON.parse(JSON.stringify(await getContractors(search))) as ContractorWithProfile[];
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    console.error("ContractorsPage render error:", msg);
    pageError = msg;
  }

  if (pageError) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold text-red-400 mb-2">Contractors Error (debug)</h2>
        <pre className="text-xs text-[var(--text-secondary)] bg-[var(--navy-800)] p-4 rounded-lg overflow-auto whitespace-pre-wrap max-w-2xl">
          {pageError}
        </pre>
      </div>
    );
  }

  return (
    <DiagnosticBoundary label="Contractors">
      <ContractorsClient
        contractors={contractors}
        initialView={(view as "table" | "card") ?? "table"}
        initialTab={(tab as "all" | "leaderboard") ?? "all"}
        initialSearch={search ?? ""}
      />
    </DiagnosticBoundary>
  );
}
