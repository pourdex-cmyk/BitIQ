import { prisma } from "@/lib/prisma";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActiveProjectsWidget } from "@/components/dashboard/ActiveProjectsWidget";
import { AIInsightsWidget } from "@/components/dashboard/AIInsightsWidget";
import {
  FolderOpen,
  FileText,
  Star,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { ProjectWithRelations } from "@/types";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    activeProjects,
    bidsThisMonth,
    bidsLastMonth,
    allScoredBids,
    recentBids,
    projects,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        status: {
          in: [
            "BIDDING_OPEN",
            "BIDDING_CLOSED",
            "BID_SELECTED",
            "CONTRACTING",
            "IN_PROGRESS",
          ],
        },
      },
    }),
    prisma.bid.count({
      where: { submittedAt: { gte: startOfMonth }, status: { not: "DRAFT" } },
    }),
    prisma.bid.count({
      where: {
        submittedAt: { gte: lastMonth, lt: startOfMonth },
        status: { not: "DRAFT" },
      },
    }),
    prisma.bid.findMany({
      where: { aiOverallScore: { not: null } },
      select: { aiOverallScore: true },
    }),
    prisma.bid.findMany({
      where: { status: { not: "DRAFT" } },
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: {
        project: { include: { property: true } },
        contractorProfile: true,
      },
    }),
    prisma.project.findMany({
      include: {
        property: { include: { photos: true } },
        owner: true,
        scopeOfWork: { include: { lineItems: true } },
        bids: {
          include: {
            lineItems: true,
            contractor: true,
            contractorProfile: true,
            invitation: true,
          },
        },
        invitations: true,
        contract: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const avgAiScore =
    allScoredBids.length > 0
      ? allScoredBids.reduce((sum, b) => sum + (b.aiOverallScore ?? 0), 0) /
        allScoredBids.length
      : 0;

  const bidsMonthTrend =
    bidsLastMonth > 0
      ? Math.round(((bidsThisMonth - bidsLastMonth) / bidsLastMonth) * 100)
      : 0;

  return {
    activeProjects,
    bidsThisMonth,
    bidsMonthTrend,
    avgAiScore,
    savedVsBenchmark: 127400, // would compute from real data
    recentBids,
    projects: projects as ProjectWithRelations[],
  };
}

const bidStatusColors: Record<string, string> = {
  SUBMITTED: "text-[var(--navy-300)] bg-[rgba(133,183,235,0.15)]",
  AI_PROCESSING: "text-[var(--purple-400)] bg-[rgba(127,119,221,0.15)]",
  AI_SCORED: "text-[var(--teal-400)] bg-[rgba(93,202,165,0.15)]",
  UNDER_REVIEW: "text-[var(--amber-500)] bg-[rgba(186,117,23,0.15)]",
  SELECTED: "text-[var(--teal-400)] bg-[rgba(93,202,165,0.15)]",
  REJECTED: "text-[var(--red-400)] bg-[rgba(226,75,74,0.15)]",
  DRAFT: "text-[var(--text-secondary)] bg-[rgba(139,163,196,0.1)]",
  WITHDRAWN: "text-[var(--text-secondary)] bg-[rgba(139,163,196,0.1)]",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Projects"
          value={data.activeProjects}
          trend={12}
          trendLabel="vs last month"
          accent="teal"
          icon={<FolderOpen className="w-4 h-4" />}
        />
        <KPICard
          title="Bids This Month"
          value={data.bidsThisMonth}
          trend={data.bidsMonthTrend}
          trendLabel="vs last month"
          accent="purple"
          icon={<FileText className="w-4 h-4" />}
        />
        <KPICard
          title="Avg AI Score"
          value={Math.round(data.avgAiScore * 10) / 10}
          format="score"
          trend={2}
          trendLabel="vs last month"
          accent="amber"
          icon={<Star className="w-4 h-4" />}
        />
        <KPICard
          title="Saved vs. Benchmark"
          value={data.savedVsBenchmark}
          format="currency"
          trend={8}
          trendLabel="vs last month"
          accent="teal"
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left col */}
        <div className="space-y-6">
          <ActiveProjectsWidget projects={data.projects} />

          {/* Recent Bids Table */}
          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-border)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Recent Bids</h3>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-xs text-[var(--teal-400)] hover:text-[var(--teal-300)] transition-colors"
              >
                View projects
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="text-left px-5 py-3 border-b border-[var(--surface-border)]">
                      Contractor
                    </th>
                    <th className="text-left px-5 py-3 border-b border-[var(--surface-border)]">
                      Project
                    </th>
                    <th className="text-right px-5 py-3 border-b border-[var(--surface-border)]">
                      Amount
                    </th>
                    <th className="text-right px-5 py-3 border-b border-[var(--surface-border)]">
                      AI Score
                    </th>
                    <th className="text-left px-5 py-3 border-b border-[var(--surface-border)]">
                      Status
                    </th>
                    <th className="text-right px-5 py-3 border-b border-[var(--surface-border)]">
                      Received
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {data.recentBids.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sm text-[var(--text-secondary)]">
                        No bids received yet
                      </td>
                    </tr>
                  ) : (
                    data.recentBids.map((bid) => (
                      <tr
                        key={bid.id}
                        className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {bid.contractorCompany}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {bid.contractorName}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/projects/${bid.projectId}`}
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--teal-400)] transition-colors truncate max-w-[160px] block"
                          >
                            {bid.project.property.address}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                            {bid.totalBidAmount
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  maximumFractionDigits: 0,
                                }).format(bid.totalBidAmount)
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {bid.aiOverallScore ? (
                            <span
                              className={`text-sm font-mono font-bold ${
                                bid.aiOverallScore >= 85
                                  ? "text-[var(--teal-400)]"
                                  : bid.aiOverallScore >= 70
                                  ? "text-[var(--amber-500)]"
                                  : "text-[var(--red-400)]"
                              }`}
                            >
                              {bid.aiOverallScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-secondary)]">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                              bidStatusColors[bid.status] ?? "text-[var(--text-secondary)]"
                            }`}
                          >
                            {bid.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {bid.submittedAt
                              ? formatDistanceToNow(bid.submittedAt, { addSuffix: true })
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col */}
        <AIInsightsWidget />
      </div>
    </div>
  );
}
