export const SCORE_BIDS_SYSTEM = `You are a bid analysis engine for Beantown Companies. Score and rank contractor bids against each other and benchmark data.

SCORING WEIGHTS:
- Bid vs. Benchmark: 30% (lower deviation = higher score; exact benchmark = 100, 25%+ over = 50, 50%+ over = 0)
- Historical Cost Accuracy: 25% (from contractor profile; use 70 if new contractor)
- Historical On-Time: 20% (from contractor profile; use 70 if new contractor)
- Historical Quality: 15% (from contractor profile; use 70 if new contractor)
- Change Order History: 10% (from contractor profile; use 70 if new contractor)

FLAG THRESHOLDS (per line item):
- GREEN: ≤10% over benchmark mid
- AMBER: 10–25% over benchmark mid
- RED: 25%+ over benchmark mid
- MISSING: item not included in bid

Return JSON:
{
  "scoredBids": [
    {
      "bidId": "...",
      "compositeScore": 87.3,
      "aiBidVsBenchmark": 91.0,
      "aiHistoricalScore": 84.0,
      "aiRiskScore": 88.0,
      "isRecommended": true,
      "rationale": "Summit General is recommended because...",
      "lineItemFlags": [
        {
          "sowLineItemId": "...",
          "flag": "GREEN",
          "deviationPct": 4.2,
          "reason": "4.2% above CT benchmark mid — competitive pricing"
        }
      ]
    }
  ],
  "overallRecommendation": "Summit General Contracting presents the strongest overall bid..."
}

Only one bid should have isRecommended: true. Rank by compositeScore descending.`;

export function buildScoreBidsPrompt(
  sowItems: Array<{
    id: string;
    category: string;
    description: string;
    benchmarkMid: number | null;
  }>,
  bids: Array<{
    id: string;
    contractorCompany: string;
    contractorName: string;
    totalBidAmount: number | null;
    yearsExperience: number | null;
    lineItems: Array<{
      sowLineItemId: string | null;
      category: string;
      description: string;
      totalCost: number | null;
    }>;
    contractorProfile: {
      overallScore: number | null;
      bidAccuracyScore: number | null;
      onTimeScore: number | null;
      qualityScore: number | null;
      changeOrderScore: number | null;
      totalProjectsWithBeantown: number;
    } | null;
  }>
): string {
  return `SCOPE OF WORK (${sowItems.length} items):
${sowItems.map((item) => `- [${item.id}] ${item.category}: ${item.description} | Benchmark Mid: $${item.benchmarkMid ?? "N/A"}`).join("\n")}

BIDS TO SCORE (${bids.length} bids):
${bids
  .map(
    (bid) => `
Bid ID: ${bid.id}
Contractor: ${bid.contractorCompany} (${bid.contractorName})
Total Amount: $${bid.totalBidAmount?.toLocaleString() ?? "N/A"}
Years Experience: ${bid.yearsExperience ?? "Unknown"}
Historical Profile: ${
      bid.contractorProfile
        ? `Accuracy: ${bid.contractorProfile.bidAccuracyScore ?? "N/A"}, On-Time: ${bid.contractorProfile.onTimeScore ?? "N/A"}, Quality: ${bid.contractorProfile.qualityScore ?? "N/A"}, Change Orders: ${bid.contractorProfile.changeOrderScore ?? "N/A"}, Projects with Beantown: ${bid.contractorProfile.totalProjectsWithBeantown}`
        : "New contractor — use default 70 for all historical scores"
    }
Line Items:
${bid.lineItems.map((li) => `  - [SOW: ${li.sowLineItemId ?? "custom"}] ${li.category}: ${li.description} = $${li.totalCost?.toLocaleString() ?? "N/A"}`).join("\n")}
`
  )
  .join("\n---\n")}

Score all bids and provide recommendations.`;
}
