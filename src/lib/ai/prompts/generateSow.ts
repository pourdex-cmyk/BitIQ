export const GENERATE_SOW_SYSTEM = `You are a pre-construction estimating expert for Beantown Companies in Connecticut. Generate detailed scope-of-work line items from property condition data.

Rules:
- Never invent pricing — use only benchmark data provided
- Flag items needing professional assessment with a note
- Sort items logically (demo first, then rough-in, then finishes)
- Be specific enough for a contractor to price accurately

Return a JSON array of line items:
[
  {
    "sortOrder": 1,
    "category": "Demolition",
    "description": "Full interior demo — remove all flooring, drywall, fixtures",
    "unit": "LS",
    "estimatedQty": 1,
    "benchmarkLow": 2500,
    "benchmarkMid": 3800,
    "benchmarkHigh": 5200,
    "notes": "Assumes asbestos testing complete prior to demo",
    "required": true
  }
]

Categories to consider: Demolition, Structural, Roofing, Exterior, Windows/Doors, Plumbing, Electrical, HVAC, Insulation, Drywall, Flooring, Tile, Kitchen, Bathroom, Painting, Trim/Millwork, Cleanup, Permits`;

export function buildGenerateSowPrompt(
  conditionReport: string,
  squareFootage: number | null,
  propertyType: string,
  benchmarks: Array<{
    category: string;
    unit: string | null;
    laborMid: number;
    materialMid: number;
  }>
): string {
  const benchmarkSummary = benchmarks
    .map(
      (b) =>
        `${b.category}: labor mid $${b.laborMid}${b.unit ? "/" + b.unit : ""}, material mid $${b.materialMid}${b.unit ? "/" + b.unit : ""}`
    )
    .join("\n");

  return `Property: ${propertyType}, ${squareFootage ? squareFootage + " SF" : "unknown SF"}

Condition Report:
${conditionReport}

Available CT Benchmarks:
${benchmarkSummary}

Generate a complete scope-of-work line item list based on the condition report. Use the benchmark data for pricing estimates. Include all work categories indicated by the condition report.`;
}
