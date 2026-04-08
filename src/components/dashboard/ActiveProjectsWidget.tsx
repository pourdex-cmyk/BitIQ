"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ProjectWithRelations, ProjectStatus } from "@/types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "text-[var(--text-secondary)]", bg: "bg-[rgba(139,163,196,0.15)]" },
  SOW_GENERATED: { label: "SOW Ready", color: "text-[var(--navy-300)]", bg: "bg-[rgba(133,183,235,0.15)]" },
  BIDDING_OPEN: { label: "Bidding Open", color: "text-[var(--teal-400)]", bg: "bg-[rgba(93,202,165,0.15)]" },
  BIDDING_CLOSED: { label: "Scoring", color: "text-[var(--purple-400)]", bg: "bg-[rgba(127,119,221,0.15)]" },
  BID_SELECTED: { label: "Bid Selected", color: "text-[var(--teal-400)]", bg: "bg-[rgba(93,202,165,0.15)]" },
  CONTRACTING: { label: "Contracting", color: "text-[var(--amber-500)]", bg: "bg-[rgba(186,117,23,0.15)]" },
  IN_PROGRESS: { label: "In Progress", color: "text-[var(--navy-300)]", bg: "bg-[rgba(133,183,235,0.15)]" },
  COMPLETE: { label: "Complete", color: "text-[var(--teal-400)]", bg: "bg-[rgba(93,202,165,0.15)]" },
  CANCELLED: { label: "Cancelled", color: "text-[var(--red-400)]", bg: "bg-[rgba(226,75,74,0.15)]" },
};

interface ActiveProjectsWidgetProps {
  projects: ProjectWithRelations[];
}

export function ActiveProjectsWidget({ projects }: ActiveProjectsWidgetProps) {
  const active = projects
    .filter((p) =>
      ["DRAFT", "SOW_GENERATED", "BIDDING_OPEN", "BIDDING_CLOSED", "BID_SELECTED", "CONTRACTING", "IN_PROGRESS"].includes(
        p.status
      )
    )
    .slice(0, 6);

  return (
    <div className="card-surface flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Active Projects</h3>
        <Link
          href="/projects"
          className="flex items-center gap-1 text-xs text-[var(--teal-400)] hover:text-[var(--teal-300)] transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 divide-y divide-[var(--surface-border)]">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(93,202,165,0.1)] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[var(--teal-400)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No active projects</p>
            <Link
              href="/projects/new"
              className="mt-2 text-xs text-[var(--teal-400)] hover:text-[var(--teal-300)]"
            >
              Create your first project →
            </Link>
          </div>
        ) : (
          active.map((project) => {
            const config = statusConfig[project.status];
            const submittedBids = project.bids.filter(
              (b) => b.status !== "DRAFT" && b.status !== "WITHDRAWN"
            ).length;
            const deadlineDist = project.bidDeadline
              ? formatDistanceToNow(new Date(project.bidDeadline), { addSuffix: true })
              : null;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-mono font-medium",
                        config.bg,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p
                    className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--teal-400)] transition-colors"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {project.property.address}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                    {project.name}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <div className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                      {submittedBids}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">bids</div>
                  </div>
                  {deadlineDist && (
                    <div className="hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Clock className="w-3 h-3" />
                        {deadlineDist}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
