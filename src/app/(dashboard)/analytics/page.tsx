"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  DollarSign,
  Zap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/types";

const CHART_COLORS = {
  teal: "#5DCAA5",
  tealDim: "rgba(93,202,165,0.15)",
  purple: "#7F77DD",
  purpleDim: "rgba(127,119,221,0.15)",
  amber: "#BA7517",
  grid: "rgba(255,255,255,0.05)",
  text: "#8BA3C4",
};

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--navy-900)] border border-[var(--surface-border)] rounded-xl p-3 shadow-2xl text-xs">
      <div className="text-[var(--text-secondary)] mb-2">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[var(--text-secondary)] capitalize">{entry.name}:</span>
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            {typeof entry.value === "number" &&
            (entry.name.includes("amount") || entry.name.includes("saving"))
              ? fmt(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const EMPTY_DATA: AnalyticsData = {
  bidVolumeByMonth: [],
  avgDeviationByMonth: [],
  contractorScoreDistribution: [],
  topContractors: [],
  categoryAccuracy: [],
  aiStats: { bidsProcessed: 0, avgScoringTimeMs: 0, recommendationAcceptanceRate: 0 },
  cumulativeSavings: [],
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d.data ?? EMPTY_DATA))
      .catch(() => setData(EMPTY_DATA))
      .finally(() => setLoading(false));
  }, []);

  const aiStats = data.aiStats;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Analytics
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          AI-powered insights across all projects and contractors
        </p>
      </div>

      {/* AI Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Bids Processed",
            value: aiStats.bidsProcessed.toString(),
            icon: Activity,
            color: "var(--teal-400)",
            trend: null,
          },
          {
            label: "Avg Scoring Time",
            value: `${(aiStats.avgScoringTimeMs / 1000).toFixed(1)}s`,
            icon: Zap,
            color: "var(--purple-400)",
            trend: null,
          },
          {
            label: "Rec. Acceptance",
            value: `${Math.round(aiStats.recommendationAcceptanceRate * 100)}%`,
            icon: TrendingUp,
            color: "var(--teal-400)",
            trend: 5.2,
          },
          {
            label: "Active Contractors",
            value: data.topContractors.length.toString(),
            icon: Users,
            color: "var(--amber-500)",
            trend: null,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                {stat.trend !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-mono",
                      stat.trend > 0 ? "text-[var(--teal-400)]" : "text-[var(--red-400)]"
                    )}
                  >
                    {stat.trend > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(stat.trend)}%
                  </span>
                )}
              </div>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-dm-serif)", color: stat.color }}
              >
                {loading ? "…" : stat.value}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Row 1: Bid volume + Deviation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bid Volume */}
        <div className="card-surface p-5">
          <h3
            className="text-base font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Bid Volume — 12 Months
          </h3>
          <div className="h-56">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-[var(--text-secondary)] text-sm">Loading…</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.bidVolumeByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.teal}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS.teal, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: CHART_COLORS.teal }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={CHART_COLORS.purple}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[var(--teal-400)] rounded" />
              <span className="text-xs text-[var(--text-secondary)]">Count</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[var(--purple-400)] rounded" style={{ borderTop: "2px dashed" }} />
              <span className="text-xs text-[var(--text-secondary)]">Amount</span>
            </div>
          </div>
        </div>

        {/* Avg Deviation */}
        <div className="card-surface p-5">
          <h3
            className="text-base font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Avg Deviation from Benchmark
          </h3>
          <div className="h-56">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-[var(--text-secondary)] text-sm">Loading…</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.avgDeviationByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="deviation"
                    fill={CHART_COLORS.teal}
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Score distribution + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Score distribution */}
        <div className="card-surface p-5">
          <h3
            className="text-base font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Contractor Score Distribution
          </h3>
          <div className="h-56">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-[var(--text-secondary)] text-sm">Loading…</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.contractorScoreDistribution}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.purple}
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cumulative savings */}
        <div className="card-surface p-5">
          <h3
            className="text-base font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Cumulative Savings vs Benchmark
          </h3>
          <div className="h-56">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-[var(--text-secondary)] text-sm">Loading…</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.cumulativeSavings}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={(v) => fmt(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke={CHART_COLORS.teal}
                    strokeWidth={2.5}
                    fill="url(#savingsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-[var(--surface-border)]">
          <h3
            className="text-base font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Top Contractors
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)]">
                {["Rank", "Contractor", "Company", "Score", "Trend", "Projects", "Total Value"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left p-3 text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && data.topContractors.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                    No data available yet.
                  </td>
                </tr>
              )}
              {data.topContractors.map((c, idx) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--surface-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold",
                        idx === 0
                          ? "bg-[rgba(186,117,23,0.2)] text-[var(--amber-500)]"
                          : idx === 1
                          ? "bg-[rgba(139,163,196,0.15)] text-[var(--text-secondary)]"
                          : "bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]"
                      )}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{c.company}</td>
                  <td className="p-3">
                    <span
                      className="font-mono font-bold text-base"
                      style={{
                        color:
                          c.score >= 80
                            ? "var(--teal-400)"
                            : c.score >= 60
                            ? "var(--amber-500)"
                            : "var(--red-400)",
                      }}
                    >
                      {Math.round(c.score)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-mono",
                        c.trend > 0
                          ? "text-[var(--teal-400)]"
                          : c.trend < 0
                          ? "text-[var(--red-400)]"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      {c.trend > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : c.trend < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      {c.trend !== 0 ? Math.abs(c.trend).toFixed(1) : "—"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[var(--text-primary)]">{c.projects}</td>
                  <td className="p-3 font-mono text-[var(--teal-400)] font-semibold">
                    {c.totalValue > 0 ? fmt(c.totalValue) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Accuracy */}
      {data.categoryAccuracy.length > 0 && (
        <div className="card-surface p-5">
          <h3
            className="text-base font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Avg Deviation by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.categoryAccuracy}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="avgDeviation"
                  fill={CHART_COLORS.amber}
                  radius={[0, 4, 4, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
