"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWithRelations, BidWithRelations, SowLineItem } from "@/types";

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

const SCORE_DIMENSIONS = [
  { key: "aiOverallScore" as const, label: "Overall Score", color: "var(--teal-400)" },
  { key: "aiBidVsBenchmark" as const, label: "Benchmark Fit", color: "var(--teal-500)" },
  { key: "aiHistoricalScore" as const, label: "Track Record", color: "var(--purple-400)" },
  { key: "aiRiskScore" as const, label: "Risk Score", color: "var(--amber-500)" },
];

interface AnimatedBarProps {
  value: number;
  color: string;
  delay?: number;
}

function AnimatedBar({ value, color, delay = 0 }: AnimatedBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="h-1.5 bg-[var(--surface-border)] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={isInView ? { width: `${Math.max(0, Math.min(100, value))}%` } : { width: 0 }}
        transition={{ duration: 0.6, delay, ease: [0.34, 1.56, 0.64, 1] }}
      />
    </div>
  );
}

interface ScoreRingProps {
  score: number;
  size?: number;
}

function ScoreRing({ score, size = 80 }: ScoreRingProps) {
  const color =
    score >= 80
      ? "var(--teal-400)"
      : score >= 60
      ? "var(--amber-500)"
      : "var(--red-400)";
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, var(--surface-border) 0deg)`,
      }}
    >
      <div
        className="absolute bg-[var(--surface-raised)] rounded-full flex items-center justify-center"
        style={{ width: size - 16, height: size - 16 }}
      >
        <span
          className="font-bold"
          style={{
            fontFamily: "var(--font-dm-serif)",
            fontSize: size * 0.28,
            color,
          }}
        >
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  contractorName: string;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDialog({ contractorName, amount, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative bg-[var(--surface-raised)] border border-[var(--surface-border)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(93,202,165,0.15)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[var(--teal-400)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-dm-serif)" }}>
              Select This Contractor?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              You are selecting <strong className="text-[var(--text-primary)]">{contractorName}</strong> for{" "}
              <strong className="text-[var(--teal-400)] font-mono">{fmt(amount)}</strong>.
              This will initiate the contract drafting process.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-[var(--surface-border)] text-[var(--text-secondary)] text-sm font-medium hover:border-[rgba(255,255,255,0.15)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? "Selecting…" : "Confirm Selection"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ContractorCardProps {
  bid: BidWithRelations;
  rank: number;
  onSelect: () => void;
  projectId: string;
}

function ContractorCard({ bid, rank, onSelect }: ContractorCardProps) {
  const isRecommended = bid.aiRecommended;
  const score = bid.aiOverallScore ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.4 }}
      className={cn(
        "card-surface p-5 flex flex-col gap-4 min-w-[280px] flex-shrink-0",
        isRecommended && "border-[var(--teal-400)] border-2 relative overflow-visible"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--teal-600)] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
          <Star className="w-3 h-3 fill-white" />
          AI Recommended
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">
            Rank #{rank + 1}
          </div>
          <h3
            className="text-base font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            {bid.contractorCompany}
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">{bid.contractorName}</p>
          {bid.primaryTrade && (
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-[rgba(127,119,221,0.15)] text-[var(--purple-400)] font-mono">
              {bid.primaryTrade}
            </span>
          )}
        </div>
        {score > 0 && <ScoreRing score={score} size={70} />}
      </div>

      {/* Total amount */}
      <div>
        <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Total Bid</div>
        <div
          className="text-2xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          {bid.totalBidAmount ? fmt(bid.totalBidAmount) : "—"}
        </div>
      </div>

      {/* Score dimensions */}
      <div className="space-y-2.5">
        {SCORE_DIMENSIONS.map((dim, i) => {
          const val = (bid[dim.key] ?? 0) as number;
          return (
            <div key={dim.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                  {dim.label}
                </span>
                <span className="text-xs font-mono font-semibold" style={{ color: dim.color }}>
                  {val > 0 ? Math.round(val) : "—"}
                </span>
              </div>
              <AnimatedBar value={val} color={dim.color} delay={i * 0.08} />
            </div>
          );
        })}
      </div>

      {/* Footer details */}
      <div className="pt-2 border-t border-[var(--surface-border)] space-y-1.5">
        {[
          ["Start Date", bid.proposedStartDate ? format(new Date(bid.proposedStartDate), "MMM d, yyyy") : null],
          ["Duration", bid.estimatedDays ? `${bid.estimatedDays} days` : null],
          ["Experience", bid.yearsExperience ? `${bid.yearsExperience} yrs` : null],
        ].map(([label, val]) =>
          val ? (
            <div key={label as string} className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="text-[var(--text-primary)] font-mono">{val as string}</span>
            </div>
          ) : null
        )}
      </div>

      <button
        onClick={onSelect}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-auto",
          isRecommended
            ? "bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white shadow-md shadow-teal-900/20"
            : "border border-[var(--surface-border)] text-[var(--text-secondary)] hover:border-[var(--teal-600)] hover:text-[var(--teal-400)]"
        )}
      >
        Select This Contractor
      </button>
    </motion.div>
  );
}

function getFlagClass(flag: string | null | undefined) {
  if (flag === "GREEN") return "flag-green";
  if (flag === "AMBER") return "flag-amber";
  if (flag === "RED") return "flag-red";
  return "flag-gray";
}

function CellTooltip({
  lineItem,
  benchmark,
}: {
  lineItem: { totalCost?: number | null; deviationPct?: number | null; aiFlag?: string | null };
  benchmark: number | null;
}) {
  const [show, setShow] = useState(false);
  const flagClass = getFlagClass(lineItem.aiFlag);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className={cn("inline-block px-2 py-1 rounded text-xs font-mono border cursor-default", flagClass)}>
        {lineItem.totalCost ? fmt(lineItem.totalCost) : "—"}
      </div>
      {show && (lineItem.deviationPct != null || benchmark != null) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-44 bg-[var(--navy-900)] border border-[var(--surface-border)] rounded-lg p-3 shadow-xl text-xs pointer-events-none">
          {benchmark && (
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-secondary)]">Benchmark</span>
              <span className="text-[var(--text-primary)] font-mono">{fmt(benchmark)}</span>
            </div>
          )}
          {lineItem.deviationPct != null && (
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Deviation</span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  lineItem.deviationPct <= 10
                    ? "text-[var(--teal-400)]"
                    : lineItem.deviationPct <= 25
                    ? "text-[var(--amber-500)]"
                    : "text-[var(--red-400)]"
                )}
              >
                {pct(lineItem.deviationPct)}
              </span>
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--surface-border)]" />
        </div>
      )}
    </div>
  );
}

interface ComparisonDashboardProps {
  project: ProjectWithRelations;
}

export function ComparisonDashboard({ project }: ComparisonDashboardProps) {
  const router = useRouter();
  const [rationaleExpanded, setRationaleExpanded] = useState(false);
  const [confirmBid, setConfirmBid] = useState<BidWithRelations | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [successBid, setSuccessBid] = useState<string | null>(null);

  const scoredBids = project.bids.filter(
    (b) => b.status !== "DRAFT" && b.status !== "WITHDRAWN"
  );
  const recommendedBid = scoredBids.find((b) => b.aiRecommended);
  const sowItems = project.scopeOfWork?.lineItems ?? [];

  async function handleSelectConfirm() {
    if (!confirmBid) return;
    setSelectingId(confirmBid.id);
    try {
      const res = await fetch(`/api/bids/${confirmBid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select" }),
      });
      if (res.ok) {
        setSuccessBid(confirmBid.id);
        setConfirmBid(null);
        setTimeout(() => {
          router.push(`/projects/${project.id}/contract`);
        }, 1500);
      }
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--teal-400)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-4 bg-[var(--surface-border)]" />
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {project.property.address}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[rgba(127,119,221,0.15)] text-[var(--purple-400)] border border-[rgba(127,119,221,0.3)]">
                AI Scored
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {project.property.city}, {project.property.state} ·{" "}
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {scoredBids.length}
              </span>{" "}
              bids received
            </p>
          </div>
        </div>
        {recommendedBid && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(93,202,165,0.08)] border border-[rgba(93,202,165,0.2)]">
            <Star className="w-4 h-4 text-[var(--teal-400)] fill-[var(--teal-400)]" />
            <span className="text-sm text-[var(--teal-400)]">
              AI recommends{" "}
              <strong>{recommendedBid.contractorCompany}</strong>
            </span>
          </div>
        )}
      </div>

      {/* AI Recommendation Panel */}
      {recommendedBid?.aiRationale && (
        <div className="card-surface border-l-4 border-[var(--purple-600)] bg-[rgba(83,74,183,0.05)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-[rgba(127,119,221,0.2)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[var(--purple-400)] ai-pulse" />
                </div>
                <span className="text-xs font-semibold text-[var(--purple-400)] uppercase tracking-wider">
                  AI Recommendation
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {rationaleExpanded
                  ? recommendedBid.aiRationale
                  : recommendedBid.aiRationale.slice(0, 220) +
                    (recommendedBid.aiRationale.length > 220 ? "…" : "")}
              </p>
            </div>
          </div>
          {recommendedBid.aiRationale.length > 220 && (
            <button
              onClick={() => setRationaleExpanded(!rationaleExpanded)}
              className="mt-3 flex items-center gap-1 text-xs text-[var(--purple-400)] hover:text-[var(--text-primary)] transition-colors font-medium"
            >
              {rationaleExpanded ? (
                <>
                  Show Less <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Full Rationale <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Contractor Cards */}
      <div>
        <h2
          className="text-lg font-bold text-[var(--text-primary)] mb-4"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Contractor Scores
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {scoredBids.length === 0 && (
            <div className="card-surface p-12 text-center w-full">
              <AlertCircle className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)]">No bids to compare yet.</p>
            </div>
          )}
          {scoredBids.map((bid, idx) => (
            <ContractorCard
              key={bid.id}
              bid={bid}
              rank={idx}
              projectId={project.id}
              onSelect={() => setConfirmBid(bid)}
            />
          ))}
        </div>
      </div>

      {/* Line Item Comparison Table */}
      {sowItems.length > 0 && scoredBids.length > 0 && (
        <div>
          <h2
            className="text-lg font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Line Item Comparison
          </h2>
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--surface-border)]">
                    <th className="sticky left-0 bg-[var(--surface-raised)] z-10 text-left p-3 text-[var(--text-secondary)] font-medium uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                      Scope Item
                    </th>
                    <th className="text-center p-3 text-[var(--text-secondary)] font-medium uppercase tracking-wider whitespace-nowrap bg-[rgba(93,202,165,0.05)]">
                      Benchmark Mid
                    </th>
                    {scoredBids.map((bid) => (
                      <th
                        key={bid.id}
                        className={cn(
                          "text-center p-3 font-medium uppercase tracking-wider whitespace-nowrap",
                          bid.aiRecommended
                            ? "text-[var(--teal-400)]"
                            : "text-[var(--text-secondary)]"
                        )}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          {bid.aiRecommended && (
                            <Star className="w-3 h-3 fill-[var(--teal-400)] text-[var(--teal-400)]" />
                          )}
                          <span>{bid.contractorCompany}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sowItems
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((sowItem: SowLineItem) => (
                      <tr
                        key={sowItem.id}
                        className="border-b border-[var(--surface-border)] last:border-0 hover:bg-[rgba(255,255,255,0.015)] transition-colors"
                      >
                        <td className="sticky left-0 bg-[var(--surface-raised)] z-10 p-3">
                          <div className="font-medium text-[var(--text-primary)]">
                            {sowItem.description}
                          </div>
                          <div className="text-[var(--text-secondary)] text-[10px] mt-0.5">
                            {sowItem.category}
                            {sowItem.unit && ` · ${sowItem.unit}`}
                          </div>
                        </td>
                        <td className="p-3 text-center bg-[rgba(93,202,165,0.03)]">
                          <span className="font-mono text-[var(--teal-400)] font-semibold">
                            {sowItem.benchmarkMid ? fmt(sowItem.benchmarkMid) : "—"}
                          </span>
                        </td>
                        {scoredBids.map((bid) => {
                          const item = bid.lineItems.find(
                            (li) => li.sowLineItemId === sowItem.id
                          );
                          return (
                            <td key={bid.id} className="p-3 text-center">
                              {item ? (
                                <CellTooltip
                                  lineItem={item}
                                  benchmark={sowItem.benchmarkMid ?? null}
                                />
                              ) : (
                                <span className="flag-gray inline-block px-2 py-1 rounded text-xs font-mono border">
                                  Missing
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--surface-border)] bg-[rgba(255,255,255,0.02)]">
                    <td className="sticky left-0 bg-[rgba(12,30,56,0.98)] z-10 p-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Total
                    </td>
                    <td className="p-3 text-center bg-[rgba(93,202,165,0.03)]">
                      <span className="font-mono text-[var(--teal-400)] font-bold text-sm">
                        {fmt(sowItems.reduce((s, i) => s + (i.benchmarkMid ?? 0), 0))}
                      </span>
                    </td>
                    {scoredBids.map((bid) => (
                      <td key={bid.id} className="p-3 text-center">
                        <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                          {bid.totalBidAmount ? fmt(bid.totalBidAmount) : "—"}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-[var(--text-secondary)]">Flag legend:</span>
            {[
              { cls: "flag-green", label: "≤10% over" },
              { cls: "flag-amber", label: "10–25% over" },
              { cls: "flag-red", label: "25%+ over" },
              { cls: "flag-gray", label: "Not included" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn("inline-block w-3 h-3 rounded border", cls)} />
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success banner */}
      {successBid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--teal-600)] text-white shadow-2xl"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">Contractor selected! Redirecting to contract…</span>
        </motion.div>
      )}

      {/* Confirm dialog */}
      {confirmBid && (
        <ConfirmDialog
          contractorName={confirmBid.contractorCompany}
          amount={confirmBid.totalBidAmount ?? 0}
          onConfirm={handleSelectConfirm}
          onCancel={() => setConfirmBid(null)}
          loading={selectingId === confirmBid.id}
        />
      )}
    </div>
  );
}
