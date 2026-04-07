"use client";

import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AIBadge } from "@/components/shared/AIProcessingIndicator";

const insights = [
  {
    icon: TrendingUp,
    color: "text-[var(--teal-400)]",
    text: "Summit General Contracting has won 3 of the last 4 competitive bids — their pricing is tracking 8% below market average this quarter.",
  },
  {
    icon: AlertTriangle,
    color: "text-[var(--amber-500)]",
    text: "HVAC bids across the Hartford portfolio are running 18% above CT benchmarks. Consider negotiating bulk rates or expanding your contractor pool.",
  },
  {
    icon: CheckCircle2,
    color: "text-[var(--teal-400)]",
    text: "AI-recommended bids were accepted on 4 of 5 completed projects this month, saving an estimated $42,000 vs. next-lowest bid.",
  },
  {
    icon: TrendingUp,
    color: "text-[var(--purple-400)]",
    text: "3 contractors haven't responded to open invitations on Riverbend Drive. Deadline is in 4 days — consider sending a reminder.",
  },
];

export function AIInsightsWidget() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--purple-400)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">AI Portfolio Insights</h3>
          <AIBadge />
        </div>
        <span className="text-xs text-[var(--text-secondary)] font-mono">Last 30 days</span>
      </div>

      <div className="divide-y divide-[var(--surface-border)]">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div
              key={i}
              className="flex gap-3 px-5 py-4 group hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            >
              <div className="mt-0.5 flex-shrink-0">
                <Icon className={`w-4 h-4 ${insight.color}`} />
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
