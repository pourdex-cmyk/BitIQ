"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWithRelations, BidWithRelations, ProjectStatus } from "@/types";

const STATUS_STEPS: { key: ProjectStatus; label: string }[] = [
  { key: "DRAFT", label: "Draft" },
  { key: "SOW_GENERATED", label: "SOW Ready" },
  { key: "BIDDING_OPEN", label: "Bidding Open" },
  { key: "BIDDING_CLOSED", label: "Bids Closed" },
  { key: "BID_SELECTED", label: "Bid Selected" },
  { key: "CONTRACTING", label: "Contracting" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETE", label: "Complete" },
];

const STATUS_ORDER: Record<ProjectStatus, number> = {
  DRAFT: 0,
  SOW_GENERATED: 1,
  BIDDING_OPEN: 2,
  BIDDING_CLOSED: 3,
  BID_SELECTED: 4,
  CONTRACTING: 5,
  IN_PROGRESS: 6,
  COMPLETE: 7,
  CANCELLED: 8,
};

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ScoreFlag({ flag }: { flag: string | null }) {
  const cls =
    flag === "GREEN"
      ? "flag-green"
      : flag === "AMBER"
      ? "flag-amber"
      : flag === "RED"
      ? "flag-red"
      : "flag-gray";
  const label =
    flag === "GREEN" ? "On Budget" : flag === "AMBER" ? "Over" : flag === "RED" ? "High" : "—";
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold border",
        cls
      )}
    >
      {label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--text-secondary)] font-mono">—</span>;
  const color =
    score >= 80
      ? "text-[var(--teal-400)]"
      : score >= 60
      ? "text-[var(--amber-500)]"
      : "text-[var(--red-400)]";
  return (
    <span className={cn("font-mono font-bold text-base", color)}>{Math.round(score)}</span>
  );
}

function BidStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-[rgba(139,163,196,0.1)] text-[var(--text-secondary)]" },
    SUBMITTED: { label: "Submitted", cls: "bg-[rgba(133,183,235,0.12)] text-[var(--navy-300)]" },
    AI_PROCESSING: { label: "Scoring…", cls: "bg-[rgba(127,119,221,0.12)] text-[var(--purple-400)]" },
    AI_SCORED: { label: "Scored", cls: "bg-[rgba(93,202,165,0.12)] text-[var(--teal-400)]" },
    UNDER_REVIEW: { label: "Under Review", cls: "bg-[rgba(186,117,23,0.12)] text-[var(--amber-500)]" },
    SELECTED: { label: "Selected ✓", cls: "bg-[rgba(93,202,165,0.12)] text-[var(--teal-400)] border border-[var(--teal-600)]" },
    REJECTED: { label: "Rejected", cls: "bg-[rgba(163,45,45,0.12)] text-[var(--red-400)]" },
    WITHDRAWN: { label: "Withdrawn", cls: "bg-[rgba(139,163,196,0.1)] text-[var(--text-secondary)]" },
  };
  const c = config[status] ?? config["DRAFT"];
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded font-mono font-medium", c.cls)}>
      {c.label}
    </span>
  );
}

interface BidSheetProps {
  bid: BidWithRelations;
  onClose: () => void;
  projectStatus: ProjectStatus;
  projectId: string;
}

function BidSheet({ bid, onClose, projectStatus, projectId }: BidSheetProps) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  async function handleCloseBidding() {
    setClosing(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close_bidding" }),
      });
      router.refresh();
      onClose();
    } finally {
      setClosing(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Panel */}
        <motion.div
          className="relative ml-auto w-full max-w-2xl h-full bg-[var(--surface-raised)] border-l border-[var(--surface-border)] overflow-y-auto flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[var(--surface-raised)] border-b border-[var(--surface-border)] px-6 py-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-dm-serif)" }}>
                {bid.contractorCompany}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">{bid.contractorName}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="flex-1 px-6 py-5 space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-surface p-3 text-center">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Bid</div>
                <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                  {bid.totalBidAmount ? fmt(bid.totalBidAmount) : "—"}
                </div>
              </div>
              <div className="card-surface p-3 text-center">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">AI Score</div>
                <div className="text-lg">
                  <ScoreBadge score={bid.aiOverallScore ?? null} />
                </div>
              </div>
              <div className="card-surface p-3 text-center">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Status</div>
                <div className="mt-0.5">
                  <BidStatusBadge status={bid.status} />
                </div>
              </div>
            </div>

            {/* Contractor Info */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Contractor Info
              </h3>
              <div className="card-surface p-4 space-y-2 text-sm">
                {[
                  ["Email", bid.contractorEmail],
                  ["Phone", bid.contractorPhone],
                  ["License", bid.licenseNumber],
                  ["Trade", bid.primaryTrade],
                  ["Experience", bid.yearsExperience ? `${bid.yearsExperience} years` : null],
                  ["Insurance", bid.insuranceOnFile ? "On File ✓" : "Not on file"],
                ].map(([label, val]) =>
                  val ? (
                    <div key={label as string} className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{label}</span>
                      <span className="text-[var(--text-primary)] font-mono text-xs">{val as string}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Line Items */}
            {bid.lineItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Line Items
                </h3>
                <div className="card-surface overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--surface-border)]">
                        <th className="text-left p-3 text-[var(--text-secondary)] font-medium">Description</th>
                        <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Total</th>
                        <th className="text-center p-3 text-[var(--text-secondary)] font-medium">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bid.lineItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[var(--surface-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]"
                        >
                          <td className="p-3 text-[var(--text-primary)]">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-[var(--text-secondary)] text-[10px]">{item.category}</div>
                          </td>
                          <td className="p-3 text-right font-mono text-[var(--text-primary)]">
                            {item.totalCost ? fmt(item.totalCost) : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <ScoreFlag flag={item.aiFlag ?? null} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Rationale */}
            {bid.aiRationale && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  AI Rationale
                </h3>
                <div className="card-surface p-4 border-l-2 border-[var(--purple-600)]">
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{bid.aiRationale}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {(bid.exclusions || bid.allowances || bid.notes) && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Contractor Notes
                </h3>
                <div className="space-y-2">
                  {bid.exclusions && (
                    <div className="card-surface p-3">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Exclusions</div>
                      <p className="text-sm text-[var(--text-primary)]">{bid.exclusions}</p>
                    </div>
                  )}
                  {bid.allowances && (
                    <div className="card-surface p-3">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Allowances</div>
                      <p className="text-sm text-[var(--text-primary)]">{bid.allowances}</p>
                    </div>
                  )}
                  {bid.notes && (
                    <div className="card-surface p-3">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Notes</div>
                      <p className="text-sm text-[var(--text-primary)]">{bid.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[var(--surface-raised)] border-t border-[var(--surface-border)] px-6 py-4 flex gap-3">
            {projectStatus === "BIDDING_OPEN" && (
              <button
                onClick={handleCloseBidding}
                disabled={closing}
                className="flex-1 py-2.5 rounded-lg bg-[var(--purple-600)] hover:bg-[var(--purple-400)] text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {closing ? "Closing…" : "Close Bidding & Score"}
              </button>
            )}
            <Link
              href={`/projects/${projectId}/compare`}
              className="flex-1 py-2.5 rounded-lg bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white text-sm font-semibold transition-colors text-center"
            >
              Compare All Bids →
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "sow", label: "Scope of Work", icon: FileText },
  { key: "bids", label: "Bids", icon: Users },
  { key: "compare", label: "Compare", icon: ChevronRight },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ProjectDetailClientProps {
  project: ProjectWithRelations;
}

export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedBid, setSelectedBid] = useState<BidWithRelations | null>(null);
  const router = useRouter();

  const statusIndex = STATUS_ORDER[project.status] ?? 0;
  const submittedBids = project.bids.filter((b) => b.status !== "DRAFT" && b.status !== "WITHDRAWN");

  function handleTabClick(key: TabKey) {
    if (key === "compare") {
      router.push(`/projects/${project.id}/compare`);
      return;
    }
    setActiveTab(key);
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Back link + title */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--teal-400)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Projects
        </Link>
        <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
        <span className="text-sm text-[var(--text-primary)] font-medium truncate">
          {project.property.address}
        </span>
      </div>

      {/* Hero header */}
      <div className="card-surface overflow-hidden">
        <div className="h-48 relative">
          {project.property.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.property.photos[0].url}
              alt={project.property.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[var(--navy-800)] flex items-center justify-center">
              <span className="text-5xl">🏠</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-raised)] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <h1
              className="text-2xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              {project.property.address}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {project.property.city}, {project.property.state} {project.property.zip} · {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--surface-border)] pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key && tab.key !== "compare";
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-[var(--teal-400)] text-[var(--teal-400)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === "bids" && submittedBids.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[var(--teal-600)] text-white">
                  {submittedBids.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab project={project} statusIndex={statusIndex} />
          )}
          {activeTab === "sow" && <SowTab project={project} />}
          {activeTab === "bids" && (
            <BidsTab
              project={project}
              onSelectBid={setSelectedBid}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bid Sheet */}
      {selectedBid && (
        <BidSheet
          bid={selectedBid}
          onClose={() => setSelectedBid(null)}
          projectStatus={project.status}
          projectId={project.id}
        />
      )}
    </div>
  );
}

function OverviewTab({
  project,
  statusIndex,
}: {
  project: ProjectWithRelations;
  statusIndex: number;
}) {
  const photos = project.property.photos;
  const benchmark = project.aiBenchmarkMid;
  const budget = project.budgetTarget;
  const submittedBids = project.bids.filter(
    (b) => b.status !== "DRAFT" && b.status !== "WITHDRAWN"
  );
  const lowestBid = submittedBids
    .filter((b) => b.totalBidAmount)
    .sort((a, b) => (a.totalBidAmount ?? 0) - (b.totalBidAmount ?? 0))[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left col */}
      <div className="lg:col-span-2 space-y-5">
        {/* Photo carousel */}
        {photos.length > 0 && (
          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Property Photos
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex-shrink-0 w-36 h-24 rounded-lg overflow-hidden bg-[var(--navy-800)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? "Property photo"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status timeline */}
        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Project Status
          </h3>
          <div className="relative">
            {/* Track line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--surface-border)]" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-[var(--teal-400)] transition-all duration-700"
              style={{
                width: `${Math.min(
                  100,
                  (statusIndex / (STATUS_STEPS.length - 1)) * 100
                )}%`,
              }}
            />
            <div className="relative flex justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx < statusIndex;
                const current = idx === statusIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 bg-[var(--surface-raised)]",
                        done
                          ? "border-[var(--teal-400)] bg-[var(--teal-600)]"
                          : current
                          ? "border-[var(--teal-400)] ring-2 ring-[var(--teal-400)]/30"
                          : "border-[var(--surface-border)]"
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--teal-400)]" />
                      ) : current ? (
                        <div className="w-2 h-2 rounded-full bg-[var(--teal-400)] ai-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[var(--surface-border)]" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-medium text-center leading-tight max-w-[56px]",
                        current
                          ? "text-[var(--teal-400)]"
                          : done
                          ? "text-[var(--text-secondary)]"
                          : "text-[var(--surface-border)]"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Project Description
            </h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>

      {/* Right col */}
      <div className="space-y-4">
        {/* Key dates */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Key Dates
          </h3>
          {[
            {
              label: "Created",
              value: format(new Date(project.createdAt), "MMM d, yyyy"),
              icon: Calendar,
            },
            project.bidOpenedAt
              ? {
                  label: "Bidding Opened",
                  value: format(new Date(project.bidOpenedAt), "MMM d, yyyy"),
                  icon: Clock,
                }
              : null,
            project.bidDeadline
              ? {
                  label: "Bid Deadline",
                  value: format(new Date(project.bidDeadline), "MMM d, yyyy h:mm a"),
                  icon: AlertCircle,
                }
              : null,
          ]
            .filter(Boolean)
            .map((item) => {
              const ItemIcon = item!.icon;
              return (
                <div key={item!.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[rgba(93,202,165,0.1)] flex items-center justify-center flex-shrink-0">
                    <ItemIcon className="w-3.5 h-3.5 text-[var(--teal-400)]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                      {item!.label}
                    </div>
                    <div className="text-sm text-[var(--text-primary)] font-mono">{item!.value}</div>
                  </div>
                </div>
              );
            })}
          {project.bidDeadline && new Date(project.bidDeadline) > new Date() && (
            <div className="pt-2 border-t border-[var(--surface-border)]">
              <div className="text-[10px] text-[var(--amber-500)] uppercase tracking-wider mb-1">
                Time Remaining
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--amber-500)]">
                {formatDistanceToNow(new Date(project.bidDeadline))}
              </div>
            </div>
          )}
        </div>

        {/* Budget vs Benchmark */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Budget Analysis
          </h3>
          {benchmark && (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    AI Benchmark
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[var(--text-secondary)]">Low</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">
                      {fmt(project.aiBenchmarkLow ?? 0)}
                    </span>
                  </div>
                  <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                    {fmt(benchmark)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[var(--text-secondary)]">High</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">
                      {fmt(project.aiBenchmarkHigh ?? 0)}
                    </span>
                  </div>
                </div>
                {lowestBid?.totalBidAmount && (
                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Lowest Bid
                    </div>
                    <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                      {fmt(lowestBid.totalBidAmount)}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-mono font-semibold",
                        lowestBid.totalBidAmount <= benchmark * 1.1
                          ? "text-[var(--teal-400)]"
                          : lowestBid.totalBidAmount <= benchmark * 1.25
                          ? "text-[var(--amber-500)]"
                          : "text-[var(--red-400)]"
                      )}
                    >
                      {lowestBid.totalBidAmount >= benchmark ? "+" : ""}
                      {Math.round(((lowestBid.totalBidAmount - benchmark) / benchmark) * 100)}%
                    </div>
                  </div>
                )}
              </div>
              {/* Bar */}
              {lowestBid?.totalBidAmount && (
                <div className="h-2 bg-[var(--surface-border)] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      lowestBid.totalBidAmount <= benchmark * 1.1
                        ? "bg-[var(--teal-400)]"
                        : lowestBid.totalBidAmount <= benchmark * 1.25
                        ? "bg-[var(--amber-500)]"
                        : "bg-[var(--red-400)]"
                    )}
                    style={{
                      width: `${Math.min(100, (lowestBid.totalBidAmount / (benchmark * 1.5)) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {budget && (
            <div className="pt-2 border-t border-[var(--surface-border)]">
              <div className="flex justify-between">
                <div className="text-xs text-[var(--text-secondary)]">Budget Target</div>
                <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                  {fmt(budget)}
                </div>
              </div>
            </div>
          )}
          {!benchmark && !budget && (
            <p className="text-sm text-[var(--text-secondary)]">
              No benchmark data yet. Generate SOW to get AI estimates.
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="card-surface p-4 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <Link
            href={`/projects/${project.id}/compare`}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white text-sm font-medium transition-colors"
          >
            <span>Compare Bids</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
          {project.contract && (
            <Link
              href={`/projects/${project.id}/contract`}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] hover:bg-[var(--navy-600)] text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--surface-border)]"
            >
              <span>View Contract</span>
              <FileText className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SowTab({ project }: { project: ProjectWithRelations }) {
  const sow = project.scopeOfWork;
  const router = useRouter();

  if (!sow) {
    return (
      <div className="card-surface p-12 text-center">
        <FileText className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No Scope of Work Yet
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
          Generate an AI-powered scope of work from the property photos and condition report.
        </p>
        <button
          onClick={() => router.push(`/projects/${project.id}/sow/new`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate SOW
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary & condition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-surface p-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Summary
          </h3>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">{sow.summary}</p>
        </div>
        {sow.conditionReport && (
          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Condition Report
            </h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{sow.conditionReport}</p>
          </div>
        )}
      </div>

      {/* Line items table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-[var(--surface-border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Line Items ({sow.lineItems.length})
          </h3>
          <div className="text-xs text-[var(--text-secondary)]">
            Generated {format(new Date(sow.generatedAt), "MMM d, yyyy")}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)]">
                {["Category", "Description", "Unit", "Qty", "Low", "Mid", "High"].map((h) => (
                  <th
                    key={h}
                    className="text-left p-3 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sow.lineItems
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--surface-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(93,202,165,0.1)] text-[var(--teal-400)]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-primary)] max-w-xs">
                      <div className="font-medium">{item.description}</div>
                      {item.notes && (
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{item.notes}</div>
                      )}
                    </td>
                    <td className="p-3 text-[var(--text-secondary)] font-mono text-xs">
                      {item.unit ?? "—"}
                    </td>
                    <td className="p-3 text-[var(--text-secondary)] font-mono text-xs">
                      {item.estimatedQty ?? "—"}
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--teal-400)]">
                      {item.benchmarkLow ? fmt(item.benchmarkLow) : "—"}
                    </td>
                    <td className="p-3 font-mono text-xs font-semibold text-[var(--text-primary)]">
                      {item.benchmarkMid ? fmt(item.benchmarkMid) : "—"}
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--text-secondary)]">
                      {item.benchmarkHigh ? fmt(item.benchmarkHigh) : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
            {/* Totals */}
            <tfoot>
              <tr className="border-t-2 border-[var(--surface-border)] bg-[rgba(255,255,255,0.02)]">
                <td colSpan={4} className="p-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Total Benchmark
                </td>
                <td className="p-3 font-mono text-xs text-[var(--teal-400)] font-semibold">
                  {fmt(sow.lineItems.reduce((s, i) => s + (i.benchmarkLow ?? 0), 0))}
                </td>
                <td className="p-3 font-mono text-xs font-bold text-[var(--text-primary)]">
                  {fmt(sow.lineItems.reduce((s, i) => s + (i.benchmarkMid ?? 0), 0))}
                </td>
                <td className="p-3 font-mono text-xs text-[var(--text-secondary)] font-semibold">
                  {fmt(sow.lineItems.reduce((s, i) => s + (i.benchmarkHigh ?? 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function BidsTab({
  project,
  onSelectBid,
}: {
  project: ProjectWithRelations;
  onSelectBid: (bid: BidWithRelations) => void;
}) {
  const visibleBids = project.bids.filter(
    (b) => b.status !== "DRAFT" && b.status !== "WITHDRAWN"
  );

  if (visibleBids.length === 0) {
    return (
      <div className="card-surface p-12 text-center">
        <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Bids Yet</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {project.status === "BIDDING_OPEN"
            ? "Contractors have been invited. Waiting for submissions."
            : "Open bidding to start receiving bids from contractors."}
        </p>
        {project.status === "BIDDING_OPEN" && (
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-[var(--teal-400)] ai-pulse" />
            <span className="text-sm text-[var(--teal-400)]">Bidding is open</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="p-4 border-b border-[var(--surface-border)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Submitted Bids ({visibleBids.length})
        </h3>
        <Link
          href={`/projects/${project.id}/compare`}
          className="flex items-center gap-1.5 text-xs text-[var(--teal-400)] hover:underline"
        >
          Compare All
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)]">
              {["Contractor", "Total", "AI Score", "Status", "Submitted"].map((h) => (
                <th
                  key={h}
                  className="text-left p-3 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleBids.map((bid) => (
              <tr
                key={bid.id}
                onClick={() => onSelectBid(bid)}
                className={cn(
                  "border-b border-[var(--surface-border)] last:border-0 cursor-pointer transition-colors",
                  bid.aiRecommended
                    ? "hover:bg-[rgba(93,202,165,0.04)] bg-[rgba(93,202,165,0.02)]"
                    : "hover:bg-[rgba(255,255,255,0.02)]"
                )}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        bid.aiRecommended
                          ? "bg-[var(--teal-600)] text-white"
                          : "bg-[var(--navy-800)] text-[var(--text-secondary)]"
                      )}
                    >
                      {(bid.contractorCompany ?? bid.contractorName)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {bid.contractorCompany}
                        {bid.aiRecommended && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--teal-600)] text-white font-mono">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">{bid.contractorName}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono font-semibold text-[var(--text-primary)]">
                  {bid.totalBidAmount ? fmt(bid.totalBidAmount) : "—"}
                </td>
                <td className="p-3">
                  <ScoreBadge score={bid.aiOverallScore ?? null} />
                </td>
                <td className="p-3">
                  <BidStatusBadge status={bid.status} />
                </td>
                <td className="p-3 text-xs text-[var(--text-secondary)] font-mono">
                  {bid.submittedAt
                    ? formatDistanceToNow(new Date(bid.submittedAt), { addSuffix: true })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
