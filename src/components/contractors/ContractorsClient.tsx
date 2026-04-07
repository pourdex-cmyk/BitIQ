"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  Grid3X3,
  List,
  Trophy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContractorWithProfile } from "@/types";

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function ScoreColor(score: number | null | undefined) {
  if (!score) return "text-[var(--text-secondary)]";
  if (score >= 80) return "text-[var(--teal-400)]";
  if (score >= 60) return "text-[var(--amber-500)]";
  return "text-[var(--red-400)]";
}

interface MiniScoreBarsProps {
  profile: NonNullable<ContractorWithProfile["contractorProfile"]>;
}

function MiniScoreBars({ profile }: MiniScoreBarsProps) {
  const dims = [
    { label: "Bid Accuracy", value: profile.bidAccuracyScore ?? 0, color: "var(--teal-400)" },
    { label: "On-Time", value: profile.onTimeScore ?? 0, color: "var(--teal-500)" },
    { label: "Quality", value: profile.qualityScore ?? 0, color: "var(--purple-400)" },
    { label: "Change Orders", value: profile.changeOrderScore ?? 0, color: "var(--amber-500)" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-3">
      {dims.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-[var(--text-secondary)]">{d.label}</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: d.color }}>
              {d.value > 0 ? Math.round(d.value) : "—"}
            </span>
          </div>
          <div className="h-1 bg-[var(--surface-border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, d.value)}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContractorRowProps {
  contractor: ContractorWithProfile;
  rank?: number;
  showTrend?: boolean;
}

function ContractorRow({ contractor, rank, showTrend }: ContractorRowProps) {
  const [expanded, setExpanded] = useState(false);
  const profile = contractor.contractorProfile;
  const score = profile?.overallScore ?? null;
  const projects = contractor.submittedBids.length;
  const totalValue = contractor.submittedBids.reduce(
    (s, b) => s + ((b as { totalBidAmount?: number | null }).totalBidAmount ?? 0),
    0
  );
  const lastBid = contractor.submittedBids
    .filter((b) => (b as { submittedAt?: Date | null }).submittedAt)
    .sort(
      (a, b) =>
        new Date((b as { submittedAt?: Date | null }).submittedAt!).getTime() -
        new Date((a as { submittedAt?: Date | null }).submittedAt!).getTime()
    )[0];

  // Mock trend for demo
  const trend = rank !== undefined ? (rank % 3 === 0 ? 3.2 : rank % 3 === 1 ? -1.5 : 0) : null;

  return (
    <>
      <tr
        className={cn(
          "border-b border-[var(--surface-border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer",
          expanded && "bg-[rgba(255,255,255,0.02)]"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {rank !== undefined && (
          <td className="p-3 text-center">
            <span
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold",
                rank === 0
                  ? "bg-[rgba(186,117,23,0.2)] text-[var(--amber-500)]"
                  : rank === 1
                  ? "bg-[rgba(139,163,196,0.15)] text-[var(--text-secondary)]"
                  : rank === 2
                  ? "bg-[rgba(93,202,165,0.1)] text-[var(--teal-400)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]"
              )}
            >
              {rank + 1}
            </span>
          </td>
        )}
        <td className="p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                score && score >= 80
                  ? "bg-[var(--teal-600)] text-white"
                  : "bg-[var(--navy-800)] text-[var(--text-secondary)]"
              )}
            >
              {(profile?.companyName ?? contractor.name)[0].toUpperCase()}
            </div>
            <div>
              <Link
                href={`/contractors/${contractor.id}`}
                className="font-semibold text-[var(--text-primary)] hover:text-[var(--teal-400)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {contractor.name}
              </Link>
              <div className="text-xs text-[var(--text-secondary)]">
                {profile?.companyName ?? contractor.company ?? "—"}
              </div>
            </div>
          </div>
        </td>
        <td className="p-3 text-sm text-[var(--text-secondary)]">
          {profile?.primaryTrade ?? "—"}
        </td>
        <td className="p-3">
          {score !== null ? (
            <span className={cn("font-mono font-bold text-base", ScoreColor(score))}>
              {Math.round(score)}
            </span>
          ) : (
            <span className="text-[var(--text-secondary)] font-mono">—</span>
          )}
          {showTrend && trend !== null && (
            <span
              className={cn(
                "ml-2 text-xs font-mono",
                trend > 0
                  ? "text-[var(--teal-400)]"
                  : trend < 0
                  ? "text-[var(--red-400)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="inline w-3 h-3 mr-0.5" />
              ) : trend < 0 ? (
                <TrendingDown className="inline w-3 h-3 mr-0.5" />
              ) : (
                <Minus className="inline w-3 h-3 mr-0.5" />
              )}
              {Math.abs(trend)}
            </span>
          )}
        </td>
        <td className="p-3 text-sm font-mono text-[var(--text-primary)]">{projects}</td>
        <td className="p-3 text-sm font-mono text-[var(--text-primary)]">
          {totalValue > 0 ? fmt(totalValue) : "—"}
        </td>
        <td className="p-3 text-xs text-[var(--text-secondary)]">
          {lastBid
            ? formatDistanceToNow(
                new Date((lastBid as { submittedAt?: Date | null }).submittedAt!),
                { addSuffix: true }
              )
            : "—"}
        </td>
        <td className="p-3">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </td>
      </tr>
      {expanded && profile && (
        <tr className="border-b border-[var(--surface-border)] bg-[rgba(255,255,255,0.01)]">
          <td colSpan={rank !== undefined ? 8 : 7} className="px-12 pb-3">
            <MiniScoreBars profile={profile} />
          </td>
        </tr>
      )}
    </>
  );
}

function ContractorCard({ contractor }: { contractor: ContractorWithProfile }) {
  const profile = contractor.contractorProfile;
  const score = profile?.overallScore ?? null;

  return (
    <Link href={`/contractors/${contractor.id}`}>
      <motion.div
        className="card-surface p-5 hover:border-[rgba(255,255,255,0.14)] transition-all cursor-pointer h-full flex flex-col gap-4"
        whileHover={{ y: -2 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                score && score >= 80
                  ? "bg-[var(--teal-600)] text-white"
                  : "bg-[var(--navy-800)] text-[var(--text-secondary)]"
              )}
            >
              {(profile?.companyName ?? contractor.name)[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)]">{contractor.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">
                {profile?.companyName}
              </div>
            </div>
          </div>
          {score !== null && (
            <div className="text-right">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">
                Score
              </div>
              <span className={cn("text-2xl font-bold", ScoreColor(score))}>
                {Math.round(score)}
              </span>
            </div>
          )}
        </div>

        {profile && (
          <div className="space-y-2">
            {[
              { label: "Bid Accuracy", value: profile.bidAccuracyScore, color: "var(--teal-400)" },
              { label: "On-Time", value: profile.onTimeScore, color: "var(--purple-400)" },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-[var(--text-secondary)]">{d.label}</span>
                  <span className="text-[10px] font-mono" style={{ color: d.color }}>
                    {d.value ? Math.round(d.value) : "—"}
                  </span>
                </div>
                <div className="h-1 bg-[var(--surface-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, d.value ?? 0)}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-[var(--surface-border)] flex justify-between text-xs">
          <div>
            <div className="text-[var(--text-secondary)]">Projects</div>
            <div className="font-mono font-semibold text-[var(--text-primary)]">
              {contractor.submittedBids.length}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-secondary)]">Trade</div>
            <div className="font-medium text-[var(--text-primary)]">
              {profile?.primaryTrade ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-secondary)]">State</div>
            <div className="font-medium text-[var(--text-primary)]">
              {profile?.licenseState ?? "—"}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

interface ContractorsClientProps {
  contractors: ContractorWithProfile[];
  initialView: "table" | "card";
  initialTab: "all" | "leaderboard";
  initialSearch: string;
}

export function ContractorsClient({
  contractors,
  initialView,
  initialTab,
  initialSearch,
}: ContractorsClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "card">(initialView);
  const [tab, setTab] = useState<"all" | "leaderboard">(initialTab);
  const [search, setSearch] = useState(initialSearch);

  const filtered = contractors.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contractorProfile?.companyName ?? "").toLowerCase().includes(q) ||
      (c.contractorProfile?.primaryTrade ?? "").toLowerCase().includes(q)
    );
  });

  const leaderboard = [...contractors]
    .filter((c) => c.contractorProfile?.overallScore != null)
    .sort(
      (a, b) =>
        (b.contractorProfile?.overallScore ?? 0) - (a.contractorProfile?.overallScore ?? 0)
    )
    .slice(0, 10);

  function handleSearch(val: string) {
    setSearch(val);
    const params = new URLSearchParams();
    if (val) params.set("search", val);
    if (view !== "table") params.set("view", view);
    router.push(`/contractors?${params.toString()}`, { scroll: false });
  }

  const tableHeaders = ["Contractor", "Trade", "Score", "Projects", "Total Value", "Last Active", ""];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Contractors
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {contractors.length} contractors in network
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] p-1 gap-1">
          {(["all", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                tab === t
                  ? "bg-[var(--teal-600)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {t === "leaderboard" && <Trophy className="w-3.5 h-3.5" />}
              {t === "all" ? "All Contractors" : "Leaderboard"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search contractors…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors"
          />
        </div>

        {/* View toggle */}
        {tab === "all" && (
          <div className="flex rounded-xl bg-[var(--surface-raised)] border border-[var(--surface-border)] p-1 gap-1">
            <button
              onClick={() => setView("table")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                view === "table"
                  ? "bg-[var(--teal-600)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("card")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                view === "card"
                  ? "bg-[var(--teal-600)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "leaderboard" ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="card-surface overflow-hidden">
              <div className="p-4 border-b border-[var(--surface-border)] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[var(--amber-500)]" />
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Top 10 Contractors by AI Score
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--surface-border)]">
                      <th className="text-center p-3 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider w-12">
                        Rank
                      </th>
                      {tableHeaders.map((h) => (
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
                    {leaderboard.map((c, idx) => (
                      <ContractorRow
                        key={c.id}
                        contractor={c}
                        rank={idx}
                        showTrend
                      />
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-[var(--text-secondary)]">
                          No scored contractors yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : view === "table" ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="card-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--surface-border)]">
                      {tableHeaders.map((h) => (
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
                    {filtered.map((c) => (
                      <ContractorRow key={c.id} contractor={c} />
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-[var(--text-secondary)]">
                          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p>No contractors found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((c) => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full card-surface p-12 text-center">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
                <p className="text-[var(--text-secondary)]">No contractors found.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Contractors",
            value: contractors.length.toString(),
            icon: Building2,
            color: "var(--teal-400)",
          },
          {
            label: "Scored",
            value: contractors
              .filter((c) => c.contractorProfile?.overallScore != null)
              .length.toString(),
            icon: Star,
            color: "var(--purple-400)",
          },
          {
            label: "Active (30d)",
            value: contractors
              .filter((c) =>
                c.submittedBids.some(
                  (b) =>
                    (b as { submittedAt?: Date | null }).submittedAt &&
                    new Date((b as { submittedAt?: Date | null }).submittedAt!).getTime() >
                      Date.now() - 30 * 24 * 60 * 60 * 1000
                )
              )
              .length.toString(),
            icon: TrendingUp,
            color: "var(--amber-500)",
          },
          {
            label: "Avg Score",
            value: (() => {
              const scored = contractors.filter((c) => c.contractorProfile?.overallScore);
              if (!scored.length) return "—";
              return Math.round(
                scored.reduce((s, c) => s + (c.contractorProfile?.overallScore ?? 0), 0) /
                  scored.length
              ).toString();
            })(),
            icon: Trophy,
            color: "var(--teal-400)",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-surface p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
