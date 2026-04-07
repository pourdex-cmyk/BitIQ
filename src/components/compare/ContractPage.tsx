"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Send,
  RefreshCw,
  Loader2,
  CheckCircle2,
  DollarSign,
  Calendar,
  Building2,
  Sparkles,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIProcessingIndicator } from "@/components/shared/AIProcessingIndicator";
import type { ProjectWithRelations, Contract, ContractMilestone } from "@/types";

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

type ProjectWithContract = ProjectWithRelations & {
  contract: (Contract & { milestones: ContractMilestone[] }) | null;
};

interface ContractPageProps {
  project: ProjectWithRelations;
}

export function ContractPage({ project }: ContractPageProps) {
  const proj = project as ProjectWithContract;
  const contract = proj.contract;
  const selectedBid = project.bids.find(
    (b) => b.id === contract?.bidId || b.status === "SELECTED"
  );

  const [drafting, setDrafting] = useState(false);
  const [sendingSignature, setSendingSignature] = useState(false);
  const [syncingYardi, setSyncingYardi] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>(contract?.documentUrl ?? "");
  const [milestones, setMilestones] = useState<ContractMilestone[]>(
    contract?.milestones ?? []
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleDraftContract = useCallback(async () => {
    if (!selectedBid) return;
    setDrafting(true);
    try {
      const res = await fetch("/api/ai/draft-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, bidId: selectedBid.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocumentText(data.documentText ?? data.document ?? "");
        showToast("Contract drafted successfully!");
      } else {
        showToast("Failed to draft contract. Please try again.");
      }
    } finally {
      setDrafting(false);
    }
  }, [project.id, selectedBid]);

  async function handleSendSignature() {
    setSendingSignature(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      showToast("Contract sent for signature via DocuSign.");
    } finally {
      setSendingSignature(false);
    }
  }

  async function handleSyncYardi() {
    setSyncingYardi(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      showToast("Synced to Yardi successfully.");
    } finally {
      setSyncingYardi(false);
    }
  }

  const totalMilestoneAmount = milestones.reduce((s, m) => s + m.amount, 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--teal-400)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>
        <div className="w-px h-4 bg-[var(--surface-border)]" />
        <h1
          className="text-xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Contract
        </h1>
        {contract && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
              contract.status === "DRAFT"
                ? "bg-[rgba(139,163,196,0.1)] text-[var(--text-secondary)] border-[rgba(139,163,196,0.2)]"
                : contract.status === "SIGNED"
                ? "bg-[rgba(93,202,165,0.12)] text-[var(--teal-400)] border-[var(--teal-600)]"
                : "bg-[rgba(186,117,23,0.12)] text-[var(--amber-500)] border-[var(--amber-600)]"
            )}
          >
            {contract.status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contractor info */}
          {selectedBid && (
            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-[var(--teal-400)]" />
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Selected Contractor
                </h3>
              </div>
              <div
                className="text-lg font-bold text-[var(--text-primary)] mb-1"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {selectedBid.contractorCompany}
              </div>
              <div className="text-sm text-[var(--text-secondary)] mb-4">{selectedBid.contractorName}</div>
              <div className="space-y-2 text-sm">
                {[
                  ["Email", selectedBid.contractorEmail],
                  ["Phone", selectedBid.contractorPhone],
                  ["License", selectedBid.licenseNumber],
                  ["Trade", selectedBid.primaryTrade],
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
          )}

          {/* Contract value */}
          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[var(--teal-400)]" />
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Contract Value
              </h3>
            </div>
            <div
              className="text-3xl font-bold text-[var(--text-primary)] mb-1"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              {contract?.totalAmount
                ? fmt(contract.totalAmount)
                : selectedBid?.totalBidAmount
                ? fmt(selectedBid.totalBidAmount)
                : "—"}
            </div>
            {contract?.paymentTerms && (
              <p className="text-xs text-[var(--text-secondary)]">{contract.paymentTerms}</p>
            )}
          </div>

          {/* Milestones */}
          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[var(--teal-400)]" />
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Payment Milestones
              </h3>
            </div>
            {milestones.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Draft the contract to generate milestones.
              </p>
            ) : (
              <div className="space-y-2">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--surface-border)]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--navy-800)] flex items-center justify-center text-[10px] font-mono text-[var(--text-secondary)] flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {m.name}
                      </div>
                      {m.dueDate && (
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          Due: {format(new Date(m.dueDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-mono font-semibold text-[var(--teal-400)] flex-shrink-0">
                      {fmt(m.amount)}
                    </div>
                    {m.completedAt && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--teal-400)] flex-shrink-0" />
                    )}
                  </div>
                ))}
                {totalMilestoneAmount > 0 && (
                  <div className="flex justify-between pt-2 border-t border-[var(--surface-border)]">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase">Total</span>
                    <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                      {fmt(totalMilestoneAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleDraftContract}
              disabled={drafting || !selectedBid}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--purple-600)] hover:bg-[var(--purple-400)] text-white font-semibold transition-colors disabled:opacity-50"
            >
              {drafting ? (
                <AIProcessingIndicator label="Drafting with AI…" size="sm" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Draft with AI
                </>
              )}
            </button>

            {documentText && (
              <>
                <button
                  onClick={handleDraftContract}
                  disabled={drafting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.15)] font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-4 h-4", drafting && "animate-spin")} />
                  Regenerate
                </button>
                <button
                  onClick={handleSendSignature}
                  disabled={sendingSignature}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {sendingSignature ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingSignature ? "Sending…" : "Send for Signature"}
                </button>
                <button
                  onClick={handleSyncYardi}
                  disabled={syncingYardi}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--amber-500)] hover:border-[var(--amber-600)] font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {syncingYardi ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  {syncingYardi ? "Syncing…" : "Sync to Yardi"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right panel - Document preview */}
        <div className="lg:col-span-3">
          <div className="card-surface h-full min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-[var(--surface-border)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Contract Document
              </span>
              {contract?.aiDrafted && (
                <span className="ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(127,119,221,0.15)] text-[var(--purple-400)] border border-[rgba(127,119,221,0.25)] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple-400)] ai-pulse" />
                  AI Drafted
                </span>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {drafting ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <AIProcessingIndicator label="Drafting Contract with AI…" size="lg" />
                  <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
                    Analyzing bid details, scope of work, and legal requirements to generate your contract.
                  </p>
                </div>
              ) : documentText ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  {documentText.split("\n").map((line, i) => {
                    if (line.startsWith("# ")) {
                      return (
                        <h1
                          key={i}
                          className="text-2xl font-bold text-[var(--text-primary)] mb-4 mt-6 first:mt-0"
                          style={{ fontFamily: "var(--font-dm-serif)" }}
                        >
                          {line.slice(2)}
                        </h1>
                      );
                    }
                    if (line.startsWith("## ")) {
                      return (
                        <h2
                          key={i}
                          className="text-lg font-bold text-[var(--text-primary)] mb-3 mt-5"
                          style={{ fontFamily: "var(--font-dm-serif)" }}
                        >
                          {line.slice(3)}
                        </h2>
                      );
                    }
                    if (line.startsWith("### ")) {
                      return (
                        <h3
                          key={i}
                          className="text-base font-semibold text-[var(--text-primary)] mb-2 mt-4"
                        >
                          {line.slice(4)}
                        </h3>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <li
                          key={i}
                          className="text-sm text-[var(--text-primary)] leading-relaxed ml-4 mb-1"
                        >
                          {line.slice(2)}
                        </li>
                      );
                    }
                    if (line === "") {
                      return <div key={i} className="h-3" />;
                    }
                    return (
                      <p
                        key={i}
                        className="text-sm text-[var(--text-primary)] leading-relaxed mb-2"
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(127,119,221,0.1)] border border-[rgba(127,119,221,0.2)] flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[var(--purple-400)]" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold text-[var(--text-primary)] mb-2"
                      style={{ fontFamily: "var(--font-dm-serif)" }}
                    >
                      No Contract Yet
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                      Click "Draft with AI" to automatically generate a professional contract from the selected bid and scope of work.
                    </p>
                  </div>
                  <button
                    onClick={handleDraftContract}
                    disabled={drafting || !selectedBid}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--purple-600)] hover:bg-[var(--purple-400)] text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    Draft with AI
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[var(--navy-800)] border border-[var(--surface-border)] text-[var(--text-primary)] shadow-2xl text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-[var(--teal-400)]" />
          {toast}
        </motion.div>
      )}
    </div>
  );
}
