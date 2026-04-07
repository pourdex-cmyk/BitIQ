"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Shield,
  Calendar,
  Phone,
  Mail,
  Award,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContractorWithProfile } from "@/types";
import type { Bid } from "@/types";

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ScoreColor(score: number | null | undefined) {
  if (!score) return "var(--text-secondary)";
  if (score >= 80) return "var(--teal-400)";
  if (score >= 60) return "var(--amber-500)";
  return "var(--red-400)";
}

interface AnimatedScoreBarProps {
  label: string;
  value: number | null | undefined;
  color: string;
  delay?: number;
  description?: string;
}

function AnimatedScoreBar({ label, value, color, delay = 0, description }: AnimatedScoreBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const score = value ?? 0;

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
          {description && (
            <div className="text-[10px] text-[var(--text-secondary)]">{description}</div>
          )}
        </div>
        <span
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-dm-serif)", color: score > 0 ? color : "var(--text-secondary)" }}
        >
          {score > 0 ? Math.round(score) : "—"}
        </span>
      </div>
      <div className="h-2.5 bg-[var(--surface-border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.min(100, score)}%` } : { width: 0 }}
          transition={{ duration: 0.7, delay, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "scores", label: "Score Breakdown" },
  { key: "bids", label: "Bid History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ContractorProfileClientProps {
  contractor: ContractorWithProfile;
}

export function ContractorProfileClient({ contractor }: ContractorProfileClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const profile = contractor.contractorProfile;
  const score = profile?.overallScore ?? null;

  const bids = (contractor.submittedBids ?? []) as (Bid & {
    totalBidAmount?: number | null;
    submittedAt?: Date | null;
    status: string;
  })[];

  const totalValue = bids.reduce((s, b) => s + (b.totalBidAmount ?? 0), 0);
  const selectedBids = bids.filter((b) => b.status === "SELECTED");

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
      {/* Back */}
      <Link
        href="/contractors"
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--teal-400)] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        All Contractors
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden border border-[var(--surface-border)]"
        style={{
          background: "linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 50%, #0C1E38 100%)",
        }}
      >
        {/* Decorative orb */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${score ? ScoreColor(score) : "var(--teal-400)"}, transparent 70%)` }}
        />
        <div className="relative p-8">
          <div className="flex items-start gap-6">
            {/* Avatar ring */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 border-2"
              style={{
                background: `linear-gradient(135deg, ${score ? ScoreColor(score) : "var(--teal-600)"}, var(--navy-800))`,
                borderColor: score ? ScoreColor(score) : "var(--teal-600)",
              }}
            >
              {(profile?.companyName ?? contractor.name)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1
                    className="text-3xl font-bold text-[var(--text-primary)] mb-1"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    {profile?.companyName ?? contractor.name}
                  </h1>
                  <p className="text-[var(--text-secondary)] mb-2">{contractor.name}</p>
                  {profile?.primaryTrade && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[rgba(127,119,221,0.2)] text-[var(--purple-400)] border border-[rgba(127,119,221,0.3)]">
                      {profile.primaryTrade}
                    </span>
                  )}
                </div>
                {/* Score ring */}
                {score !== null && (
                  <div className="flex flex-col items-center">
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(${ScoreColor(score)} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                      }}
                    >
                      <div className="absolute bg-[var(--navy-900)] rounded-full w-[74px] h-[74px] flex flex-col items-center justify-center">
                        <span
                          className="text-2xl font-bold leading-none"
                          style={{ fontFamily: "var(--font-dm-serif)", color: ScoreColor(score) }}
                        >
                          {Math.round(score)}
                        </span>
                        <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                          Score
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            {[
              { label: "Total Bids", value: bids.length.toString(), color: "var(--teal-400)" },
              { label: "Selected", value: selectedBids.length.toString(), color: "var(--teal-400)" },
              {
                label: "Total Value",
                value: totalValue > 0 ? fmt(totalValue) : "—",
                color: "var(--text-primary)",
              },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  {s.label}
                </div>
                <div
                  className="text-xl font-bold font-mono"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--surface-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === t.key
                ? "border-[var(--teal-400)] text-[var(--teal-400)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Contact info */}
          <div className="card-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Contact Information
            </h3>
            <div className="space-y-3">
              {[
                { icon: Mail, label: "Email", value: contractor.email },
                { icon: Phone, label: "Phone", value: contractor.phone },
              ].map(({ icon: Icon, label, value }) =>
                value ? (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[var(--teal-400)]" />
                    <div>
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                        {label}
                      </div>
                      <div className="text-sm text-[var(--text-primary)]">{value}</div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* License & Insurance */}
          <div className="card-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              License & Insurance
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Award className="w-4 h-4 text-[var(--teal-400)] mt-0.5" />
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                    License
                  </div>
                  <div className="text-sm text-[var(--text-primary)] font-mono">
                    {profile.licenseNumber}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {profile.licenseState}
                    {profile.licenseExpiry && (
                      <span
                        className={cn(
                          "ml-2",
                          new Date(profile.licenseExpiry) < new Date()
                            ? "text-[var(--red-400)]"
                            : "text-[var(--teal-400)]"
                        )}
                      >
                        Exp: {format(new Date(profile.licenseExpiry), "MM/yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-[var(--teal-400)] mt-0.5" />
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                    Insurance
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.insuranceCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal-400)]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[var(--red-400)]" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        profile.insuranceCurrent
                          ? "text-[var(--teal-400)]"
                          : "text-[var(--red-400)]"
                      )}
                    >
                      {profile.insuranceCurrent ? "Current" : "Not Current"}
                    </span>
                  </div>
                  {profile.insuranceExpiry && (
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Exp: {format(new Date(profile.insuranceExpiry), "MM/dd/yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business details */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Business Details
            </h3>
            {[
              ["Years in Business", profile.yearsInBusiness.toString()],
              ["Primary Trade", profile.primaryTrade],
              ["Specialties", profile.specialties?.join(", ") || "—"],
              ["Service Area", profile.serviceArea?.join(", ") || "—"],
              ["Beantown Projects", profile.totalProjectsWithBeantown.toString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="text-[var(--text-primary)] text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          {/* Calendar joined */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Network Activity
            </h3>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[var(--teal-400)]" />
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                  Joined
                </div>
                <div className="text-sm text-[var(--text-primary)]">
                  {format(new Date(contractor.createdAt), "MMMM d, yyyy")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-[var(--teal-400)]" />
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                  Total Project Value
                </div>
                <div className="text-sm font-mono font-bold text-[var(--teal-400)]">
                  {profile.totalProjectValue > 0
                    ? fmt(profile.totalProjectValue)
                    : "No completed projects"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scores" && profile && (
        <div className="space-y-5">
          {/* Score overview */}
          <div className="card-surface p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-5" style={{ fontFamily: "var(--font-dm-serif)" }}>
              AI Score Dimensions
            </h3>
            <div className="space-y-5">
              <AnimatedScoreBar
                label="Overall Score"
                value={profile.overallScore}
                color={ScoreColor(profile.overallScore)}
                delay={0}
                description="Composite score across all dimensions"
              />
              <AnimatedScoreBar
                label="Bid Accuracy"
                value={profile.bidAccuracyScore}
                color="var(--teal-400)"
                delay={0.1}
                description="How closely bids match final project costs"
              />
              <AnimatedScoreBar
                label="On-Time Performance"
                value={profile.onTimeScore}
                color="var(--teal-500)"
                delay={0.2}
                description="Project completion vs. estimated timeline"
              />
              <AnimatedScoreBar
                label="Quality Score"
                value={profile.qualityScore}
                color="var(--purple-400)"
                delay={0.3}
                description="Work quality and inspection results"
              />
              <AnimatedScoreBar
                label="Change Order Rate"
                value={profile.changeOrderScore}
                color="var(--amber-500)"
                delay={0.4}
                description="Frequency and magnitude of change orders"
              />
            </div>
          </div>

          {/* Rationale placeholder */}
          <div className="card-surface p-5 border-l-4 border-[var(--purple-600)] bg-[rgba(83,74,183,0.04)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--purple-400)] ai-pulse" />
              <span className="text-xs font-semibold text-[var(--purple-400)] uppercase tracking-wider">
                AI Score Rationale
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {profile.overallScore
                ? `This contractor has demonstrated consistent performance across ${bids.length} bids with Beantown Companies. Their bid accuracy and on-time completion rates are ${profile.bidAccuracyScore && profile.bidAccuracyScore >= 75 ? "above average" : "developing"}. Continued monitoring recommended for complex projects.`
                : "Scores will be generated after the contractor submits and completes their first project with Beantown Companies."}
            </p>
          </div>
        </div>
      )}

      {activeTab === "bids" && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-[var(--surface-border)]">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Bid History ({bids.length})
            </h3>
          </div>
          {bids.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
              <p className="text-[var(--text-secondary)]">No bids submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--surface-border)]">
                    {["Project", "Amount", "AI Score", "Status", "Submitted"].map((h) => (
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
                  {bids.map((bid) => {
                    const b = bid as Bid & {
                      totalBidAmount?: number | null;
                      aiOverallScore?: number | null;
                      submittedAt?: Date | null;
                    };
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-[var(--surface-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        <td className="p-3 font-medium text-[var(--text-primary)]">
                          {b.projectId.slice(0, 8)}…
                        </td>
                        <td className="p-3 font-mono font-semibold text-[var(--text-primary)]">
                          {b.totalBidAmount ? fmt(b.totalBidAmount) : "—"}
                        </td>
                        <td className="p-3">
                          {b.aiOverallScore ? (
                            <span
                              className="font-mono font-bold"
                              style={{ color: ScoreColor(b.aiOverallScore) }}
                            >
                              {Math.round(b.aiOverallScore)}
                            </span>
                          ) : (
                            <span className="text-[var(--text-secondary)]">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded font-mono",
                              b.status === "SELECTED"
                                ? "bg-[rgba(93,202,165,0.12)] text-[var(--teal-400)]"
                                : b.status === "AI_SCORED"
                                ? "bg-[rgba(127,119,221,0.12)] text-[var(--purple-400)]"
                                : "bg-[rgba(139,163,196,0.1)] text-[var(--text-secondary)]"
                            )}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-[var(--text-secondary)]">
                          {b.submittedAt
                            ? formatDistanceToNow(new Date(b.submittedAt), { addSuffix: true })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
