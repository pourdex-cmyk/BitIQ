"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Loader2, CheckCircle2, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const contractorRowSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
});

const formSchema = z.object({
  contractors: z.array(contractorRowSchema).min(1, "Add at least one contractor"),
});

type FormValues = z.infer<typeof formSchema>;

interface ExistingContractor {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

interface InviteContractorModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteContractorModal({
  projectId,
  open,
  onClose,
  onSuccess,
}: InviteContractorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingContractor[]>([]);
  const [searching, setSearching] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractors: [{ name: "", email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contractors" });

  // Search existing contractors
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/contractors/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data ?? []);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function addExistingContractor(contractor: ExistingContractor) {
    const current = watch("contractors");
    const alreadyAdded = current.some((c) => c.email === contractor.email);
    if (!alreadyAdded) {
      // Fill the last empty row or append
      const emptyIdx = current.findIndex((c) => !c.email && !c.name);
      if (emptyIdx >= 0) {
        setValue(`contractors.${emptyIdx}.name`, contractor.name);
        setValue(`contractors.${emptyIdx}.email`, contractor.email);
      } else {
        append({ name: contractor.name, email: contractor.email });
      }
    }
    setSearchQuery("");
    setSearchResults([]);
  }

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, contractors: data.contractors }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Failed to send invitations");
      }
      setSuccess(true);
      setTimeout(() => {
        reset();
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invitations");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    reset();
    setSuccess(false);
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-[var(--surface-raised)] border border-[var(--surface-border)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--teal-400)]" />
                <h2
                  className="text-lg font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  Invite Contractors
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {success ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[rgba(93,202,165,0.15)] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[var(--teal-400)]" />
                  </div>
                  <h3
                    className="text-lg font-bold text-[var(--text-primary)] mb-2"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    Invitations Sent!
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Contractors will receive an email with their unique bid portal link.
                  </p>
                </div>
              ) : (
                <>
                  {/* Search existing */}
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Search Existing Contractors
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        placeholder="Search by name, company, or email…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] animate-spin" />
                      )}
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-[var(--surface-border)] rounded-xl overflow-hidden">
                        {searchResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addExistingContractor(c)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[var(--surface-border)] last:border-0 text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-[var(--navy-800)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] flex-shrink-0">
                              {c.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[var(--text-primary)]">
                                {c.name}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] truncate">
                                {c.email}
                                {c.company && ` · ${c.company}`}
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-[var(--teal-400)] flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--surface-border)]" />

                  {/* Manual entries */}
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      Invite by Name & Email
                    </label>
                    <div className="space-y-3">
                      {fields.map((field, idx) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <input
                                {...register(`contractors.${idx}.name`)}
                                placeholder="Full name"
                                className={cn(
                                  "w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none transition-colors",
                                  errors.contractors?.[idx]?.name
                                    ? "border-[var(--red-400)]"
                                    : "border-[var(--surface-border)] focus:border-[var(--teal-600)]"
                                )}
                              />
                            </div>
                            <div>
                              <input
                                {...register(`contractors.${idx}.email`)}
                                type="email"
                                placeholder="Email address"
                                className={cn(
                                  "w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none transition-colors",
                                  errors.contractors?.[idx]?.email
                                    ? "border-[var(--red-400)]"
                                    : "border-[var(--surface-border)] focus:border-[var(--teal-600)]"
                                )}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => fields.length > 1 && remove(idx)}
                            disabled={fields.length === 1}
                            className="p-2 rounded-lg hover:bg-[rgba(226,75,74,0.1)] text-[var(--text-secondary)] hover:text-[var(--red-400)] transition-colors disabled:opacity-30 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => append({ name: "", email: "" })}
                      className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--teal-600)] text-[var(--teal-400)] text-sm hover:bg-[rgba(93,202,165,0.05)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.2)] text-[var(--red-400)] text-sm">
                      <X className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="px-6 py-4 border-t border-[var(--surface-border)] flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--surface-border)] text-[var(--text-secondary)] text-sm font-medium hover:border-[rgba(255,255,255,0.15)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {submitting ? "Sending…" : `Send ${fields.length} Invitation${fields.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
