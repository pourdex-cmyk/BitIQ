"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Calendar, Users, TrendingUp, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ProjectWithRelations, ProjectStatus } from "@/types";

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "text-[var(--text-secondary)]", bg: "bg-[rgba(139,163,196,0.12)]" },
  SOW_GENERATED: { label: "SOW Ready", color: "text-[var(--navy-300)]", bg: "bg-[rgba(133,183,235,0.12)]" },
  BIDDING_OPEN: { label: "Bidding Open", color: "text-[var(--teal-400)]", bg: "bg-[rgba(93,202,165,0.12)]" },
  BIDDING_CLOSED: { label: "AI Scoring", color: "text-[var(--purple-400)]", bg: "bg-[rgba(127,119,221,0.12)]" },
  BID_SELECTED: { label: "Bid Selected", color: "text-[var(--teal-400)]", bg: "bg-[rgba(93,202,165,0.12)]" },
  CONTRACTING: { label: "Contracting", color: "text-[var(--amber-500)]", bg: "bg-[rgba(186,117,23,0.12)]" },
  IN_PROGRESS: { label: "In Progress", color: "text-[var(--navy-300)]", bg: "bg-[rgba(133,183,235,0.12)]" },
  COMPLETE: { label: "Complete", color: "text-[var(--teal-400)]", bg: "bg-[rgba(93,202,165,0.12)]" },
  CANCELLED: { label: "Cancelled", color: "text-[var(--red-400)]", bg: "bg-[rgba(226,75,74,0.12)]" },
};

interface ProjectCardProps {
  project: ProjectWithRelations;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const config = statusConfig[project.status];
  const submittedBids = project.bids.filter(
    (b) => b.status !== "DRAFT" && b.status !== "WITHDRAWN"
  );
  const recommendedBid = submittedBids.find((b) => b.aiRecommended);
  const hasBenchmark = !!project.aiBenchmarkMid;
  const lowestBid = submittedBids
    .filter((b) => b.totalBidAmount)
    .sort((a, b) => (a.totalBidAmount ?? 0) - (b.totalBidAmount ?? 0))[0];

  const benchmarkDiff =
    hasBenchmark && lowestBid?.totalBidAmount
      ? Math.round(
          ((lowestBid.totalBidAmount - (project.aiBenchmarkMid ?? 0)) /
            (project.aiBenchmarkMid ?? 1)) *
            100
        )
      : null;

  const photo = project.property.photos[0];

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card-surface overflow-hidden hover:border-[rgba(255,255,255,0.14)] transition-all duration-200 group cursor-pointer h-full flex flex-col">
        {/* Photo / header */}
        <div className="h-36 relative overflow-hidden bg-[var(--navy-800)] flex-shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt={project.property.address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🏠</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={cn("text-xs px-2 py-1 rounded-md font-mono font-medium", config.bg, config.color)}>
              {config.label}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          {/* Address */}
          <h3
            className="text-base font-bold text-[var(--text-primary)] mb-0.5 group-hover:text-[var(--teal-400)] transition-colors"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            {project.property.address}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            {project.property.city}, {project.property.state} · {project.name}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4 flex-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  {submittedBids.length}
                </span>{" "}
                bids
              </span>
            </div>
            {project.bidDeadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatDistanceToNow(new Date(project.bidDeadline!), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          {/* Budget vs benchmark */}
          {(hasBenchmark || lowestBid) && (
            <div className="flex items-center justify-between pt-3 border-t border-[var(--surface-border)]">
              {project.aiBenchmarkMid && (
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                    AI Benchmark
                  </div>
                  <div className="text-sm font-mono font-bold text-[var(--text-primary)]">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(project.aiBenchmarkMid)}
                  </div>
                </div>
              )}
              {benchmarkDiff !== null && (
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={cn(
                      "w-3.5 h-3.5",
                      benchmarkDiff <= 5
                        ? "text-[var(--teal-400)]"
                        : benchmarkDiff <= 20
                        ? "text-[var(--amber-500)]"
                        : "text-[var(--red-400)]"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-mono font-bold",
                      benchmarkDiff <= 5
                        ? "text-[var(--teal-400)]"
                        : benchmarkDiff <= 20
                        ? "text-[var(--amber-500)]"
                        : "text-[var(--red-400)]"
                    )}
                  >
                    {benchmarkDiff >= 0 ? "+" : ""}
                    {benchmarkDiff}%
                  </span>
                </div>
              )}
              {recommendedBid && (
                <div className="text-right">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                    Recommended
                  </div>
                  <div className="text-xs font-medium text-[var(--teal-400)]">
                    {recommendedBid.contractorCompany}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Arrow */}
          <div className="flex justify-end mt-2">
            <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--teal-400)] group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}
