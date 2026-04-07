export const DRAFT_CONTRACT_SYSTEM = `You are a contract drafting assistant for Beantown Companies. Generate professional Connecticut construction contracts in Markdown format.

Required sections (include all):
1. PARTIES — Beantown Companies LLC (Owner) and contractor
2. PROJECT DESCRIPTION — property address, scope summary
3. SCOPE OF WORK — reference attached SOW, list major categories
4. CONTRACT PRICE — total amount, breakdown by category if available
5. PAYMENT SCHEDULE — 3-4 milestone-based payments (not time-based)
6. TIMELINE — start date, substantial completion date, final completion
7. CHANGE ORDER PROCEDURE — written approval required; changes >10% of contract value require board approval
8. INSURANCE REQUIREMENTS — $1M General Liability, $500K Workers' Comp, Beantown named additional insured
9. LIEN WAIVERS — conditional on each payment, unconditional on final payment
10. WARRANTY — 1 year labor warranty from substantial completion
11. TERMINATION — 10-day written cure period before termination for cause
12. DISPUTE RESOLUTION — mediation first, then binding arbitration (AAA rules), Connecticut venue
13. GOVERNING LAW — State of Connecticut
14. SIGNATURES — Owner (Beantown Companies LLC) and Contractor

Format as professional legal document with section headers. Use [BRACKETED] placeholders for items needing manual completion.`;

export function buildDraftContractPrompt(data: {
  propertyAddress: string;
  contractorName: string;
  contractorCompany: string;
  totalAmount: number;
  startDate?: string;
  estimatedDays?: number;
  scopeSummary: string;
  lineItems: Array<{ category: string; totalCost: number | null }>;
  paymentTerms?: string;
}): string {
  const completionDate = data.startDate && data.estimatedDays
    ? new Date(
        new Date(data.startDate).getTime() +
          data.estimatedDays * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "[TO BE DETERMINED]";

  const categoryBreakdown = data.lineItems
    .reduce(
      (acc, item) => {
        const existing = acc.find((a) => a.category === item.category);
        if (existing) {
          existing.total += item.totalCost ?? 0;
        } else {
          acc.push({ category: item.category, total: item.totalCost ?? 0 });
        }
        return acc;
      },
      [] as Array<{ category: string; total: number }>
    )
    .sort((a, b) => b.total - a.total);

  return `Draft a Connecticut construction contract for:

PROPERTY: ${data.propertyAddress}
CONTRACTOR: ${data.contractorName}, ${data.contractorCompany}
TOTAL CONTRACT AMOUNT: $${data.totalAmount.toLocaleString()}
START DATE: ${data.startDate ?? "[TO BE CONFIRMED]"}
ESTIMATED COMPLETION: ${completionDate}
PAYMENT TERMS: ${data.paymentTerms ?? "Net 15 on milestone completion"}

SCOPE SUMMARY:
${data.scopeSummary}

COST BREAKDOWN BY CATEGORY:
${categoryBreakdown.map((c) => `- ${c.category}: $${c.total.toLocaleString()}`).join("\n")}

Generate the full contract document now.`;
}
