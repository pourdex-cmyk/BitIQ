"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  Calendar,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BidInvitation, Project, Property, PropertyPhoto, ScopeOfWork, SowLineItem } from "@/types";

type ProjectWithDetails = Project & {
  property: Property & { photos: PropertyPhoto[] };
  scopeOfWork: (ScopeOfWork & { lineItems: SowLineItem[] }) | null;
};

interface BidPortalFormProps {
  token: string;
  invitation: BidInvitation;
  project: ProjectWithDetails;
  sowLineItems: SowLineItem[];
}

const lineItemSchema = z.object({
  sowLineItemId: z.string().optional(),
  sortOrder: z.number(),
  category: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  unit: z.string().optional(),
  quantity: z.coerce.number().optional(),
  laborCost: z.coerce.number().min(0).optional(),
  materialCost: z.coerce.number().min(0).optional(),
  estimatedDays: z.coerce.number().min(0).optional(),
  subcontracted: z.boolean().default(false),
  notes: z.string().optional(),
});

const bidSchema = z.object({
  contractorCompany: z.string().min(1, "Company name is required"),
  contractorName: z.string().min(1, "Contact name is required"),
  contractorEmail: z.string().email("Valid email required"),
  contractorPhone: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.coerce.number().min(0).optional(),
  primaryTrade: z.string().optional(),
  insuranceOnFile: z.boolean().default(false),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
  proposedStartDate: z.string().optional(),
  estimatedDays: z.coerce.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  bidValidUntil: z.string().optional(),
  exclusions: z.string().optional(),
  allowances: z.string().optional(),
  assumptions: z.string().optional(),
  notes: z.string().optional(),
});

type BidFormValues = z.infer<typeof bidSchema>;

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function CountdownTimer({ deadline }: { deadline: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        days > 0
          ? `${days}d ${hours}h ${mins}m ${secs}s`
          : `${hours}h ${mins}m ${secs}s`
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const diff = deadline.getTime() - Date.now();
  const isUrgent = diff < 24 * 60 * 60 * 1000;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-semibold border",
        isUrgent
          ? "bg-[rgba(226,75,74,0.15)] text-[var(--red-400)] border-[var(--red-600)]"
          : "bg-[rgba(93,202,165,0.12)] text-[var(--teal-400)] border-[var(--teal-600)]"
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      {timeLeft}
    </div>
  );
}

interface SectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function Section({ number, title, children, collapsible, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-surface overflow-hidden">
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-3 p-5 text-left",
          collapsible && "hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        )}
        onClick={() => collapsible && setOpen(!open)}
        disabled={!collapsible}
      >
        <div className="w-7 h-7 rounded-full bg-[var(--teal-600)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {number}
        </div>
        <h2
          className="text-base font-bold text-[var(--text-primary)] flex-1"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          {title}
        </h2>
        {collapsible && (
          open ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

type SuccessData = {
  contractorCompany: string;
  totalAmount: number;
  lineItemCount: number;
};

function SuccessScreen({ data }: { data: SuccessData }) {
  return (
    <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        {/* Success icon */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[rgba(93,202,165,0.15)] border border-[var(--teal-600)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-[var(--teal-400)]" />
          </div>
          <h1
            className="text-3xl font-bold text-[var(--text-primary)] mb-2"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Bid Submitted ✓
          </h1>
          <p className="text-[var(--text-secondary)]">
            Your bid from <strong className="text-[var(--text-primary)]">{data.contractorCompany}</strong> has been received.
          </p>
        </div>

        {/* Summary */}
        <div className="card-surface p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Submission Summary
          </h3>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Total Amount</span>
            <span className="font-mono font-bold text-[var(--teal-400)]">
              {fmt(data.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Line Items</span>
            <span className="font-mono text-[var(--text-primary)]">{data.lineItemCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Submitted</span>
            <span className="font-mono text-[var(--text-primary)]">
              {format(new Date(), "MMM d, yyyy h:mm a")}
            </span>
          </div>
        </div>

        {/* What happens next */}
        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            What Happens Next
          </h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "AI Review",
                desc: "BidIQ's AI will analyze your bid against the scope of work and benchmark data within minutes.",
              },
              {
                step: 2,
                title: "Comparison",
                desc: "Your bid will be compared alongside other submitted bids by the Beantown team.",
              },
              {
                step: 3,
                title: "Decision",
                desc: "You will receive an email notification once a decision has been made — typically within 2–5 business days.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--teal-600)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BidPortalForm({
  token,
  invitation,
  project,
  sowLineItems,
}: BidPortalFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const defaultLineItems = sowLineItems.map((item, idx) => ({
    sowLineItemId: item.id,
    sortOrder: idx,
    category: item.category,
    description: item.description,
    unit: item.unit ?? "",
    quantity: item.estimatedQty ?? undefined,
    laborCost: undefined as number | undefined,
    materialCost: undefined as number | undefined,
    estimatedDays: undefined as number | undefined,
    subcontracted: false,
    notes: "",
  }));

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BidFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bidSchema) as any,
    defaultValues: {
      contractorCompany: "",
      contractorName: invitation.contractorName,
      contractorEmail: invitation.contractorEmail,
      contractorPhone: "",
      licenseNumber: "",
      yearsExperience: undefined,
      primaryTrade: "",
      insuranceOnFile: false,
      lineItems: defaultLineItems,
      proposedStartDate: "",
      estimatedDays: undefined,
      paymentTerms: "Net 30",
      bidValidUntil: "",
      exclusions: "",
      allowances: "",
      assumptions: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const watchedItems = watch("lineItems");

  const runningTotal = (watchedItems ?? []).reduce((sum, item) => {
    const labor = Number(item.laborCost) || 0;
    const material = Number(item.materialCost) || 0;
    return sum + labor + material;
  }, 0);

  async function submitBid(data: BidFormValues, isDraft: boolean) {
    const items = data.lineItems.map((item) => ({
      ...item,
      totalCost: (Number(item.laborCost) || 0) + (Number(item.materialCost) || 0),
    }));

    const payload = {
      ...data,
      lineItems: items,
      draft: isDraft,
    };

    const res = await fetch(`/api/bids/submit/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? "Submission failed");
    }
    return res.json();
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    setSubmitError(null);
    try {
      const data = watch();
      await submitBid(data as BidFormValues, true);
      // Show brief success
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  const onSubmit = useCallback(
    async (data: BidFormValues) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await submitBid(data, false);
        setSuccessData({
          contractorCompany: data.contractorCompany,
          totalAmount: runningTotal,
          lineItemCount: data.lineItems.length,
        });
        setSubmitted(true);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Submission failed. Please try again.");
      } finally {
        setSubmitting(false);
        setShowConfirm(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runningTotal, token]
  );

  if (submitted && successData) {
    return <SuccessScreen data={successData} />;
  }

  const property = project.property;

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--surface-raised)] border-b border-[var(--surface-border)] backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="text-lg font-bold text-[var(--teal-400)]"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              BidIQ
            </div>
            <div className="w-px h-5 bg-[var(--surface-border)]" />
            <div className="text-sm text-[var(--text-secondary)] hidden sm:block">
              Invited: <span className="text-[var(--text-primary)] font-medium">{invitation.contractorName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {project.bidDeadline && (
              <CountdownTimer deadline={new Date(project.bidDeadline)} />
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(() => setShowConfirm(true))} className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Section 1: Property Overview (read-only) */}
        <Section number={1} title="Property Overview" collapsible defaultOpen={true}>
          <div className="space-y-4">
            {/* Photos */}
            {property.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {property.photos.slice(0, 5).map((photo: PropertyPhoto) => (
                  <div
                    key={photo.id}
                    className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-[var(--navy-800)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? "Property"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Address</div>
                <div className="text-[var(--text-primary)] font-medium">
                  {property.address}, {property.city}, {property.state} {property.zip}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Property Type</div>
                <div className="text-[var(--text-primary)]">{property.propertyType}</div>
              </div>
              {property.squareFootage && (
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Sq Footage</div>
                  <div className="text-[var(--text-primary)] font-mono">{property.squareFootage.toLocaleString()} sf</div>
                </div>
              )}
              {project.scopeOfWork?.summary && (
                <div className="col-span-2">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">Scope Summary</div>
                  <div className="text-[var(--text-primary)] text-sm leading-relaxed">
                    {project.scopeOfWork.summary}
                  </div>
                </div>
              )}
            </div>
            {project.bidDeadline && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(186,117,23,0.1)] border border-[rgba(186,117,23,0.2)]">
                <Calendar className="w-4 h-4 text-[var(--amber-500)]" />
                <span className="text-sm text-[var(--amber-500)]">
                  Bid deadline: <strong>{format(new Date(project.bidDeadline), "MMMM d, yyyy h:mm a")}</strong>
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* Section 2: Contractor Info */}
        <Section number={2} title="Contractor Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "contractorCompany" as const, label: "Company Name", placeholder: "ABC Construction LLC", required: true },
              { name: "contractorName" as const, label: "Contact Name", placeholder: "John Smith", required: true },
              { name: "contractorEmail" as const, label: "Email", placeholder: "john@abc.com", required: true },
              { name: "contractorPhone" as const, label: "Phone", placeholder: "(617) 555-0000" },
              { name: "licenseNumber" as const, label: "License Number", placeholder: "MA-12345" },
              { name: "primaryTrade" as const, label: "Primary Trade", placeholder: "General Contractor" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  {field.label} {field.required && <span className="text-[var(--red-400)]">*</span>}
                </label>
                <input
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none transition-colors",
                    errors[field.name]
                      ? "border-[var(--red-400)] focus:border-[var(--red-400)]"
                      : "border-[var(--surface-border)] focus:border-[var(--teal-600)]"
                  )}
                />
                {errors[field.name] && (
                  <p className="text-[10px] text-[var(--red-400)] mt-1">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Years Experience
              </label>
              <input
                {...register("yearsExperience")}
                type="number"
                min={0}
                placeholder="10"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 pt-3">
              <Controller
                control={control}
                name="insuranceOnFile"
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "w-11 h-6 rounded-full border-2 transition-all relative flex-shrink-0",
                      field.value
                        ? "bg-[var(--teal-600)] border-[var(--teal-400)]"
                        : "bg-[var(--navy-800)] border-[var(--surface-border)]"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        field.value ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                )}
              />
              <div>
                <div className="text-sm text-[var(--text-primary)]">Insurance on file</div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Confirm you have valid liability insurance
                </div>
              </div>
              <Shield className="w-4 h-4 text-[var(--teal-400)] ml-auto" />
            </div>
          </div>
        </Section>

        {/* Section 3: Line Item Bid Table */}
        <Section number={3} title="Line Item Pricing">
          <div className="space-y-4">
            {/* Running total */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(93,202,165,0.08)] border border-[rgba(93,202,165,0.2)]">
              <span className="text-sm font-medium text-[var(--teal-400)]">Running Total</span>
              <span
                className="text-xl font-bold text-[var(--teal-400)]"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                {fmt(runningTotal)}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--surface-border)]">
                    {["Description", "Labor ($)", "Material ($)", "Total", "Days", "Sub", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left p-2 text-[var(--text-secondary)] font-medium uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, idx) => {
                    const labor = Number(watchedItems?.[idx]?.laborCost) || 0;
                    const material = Number(watchedItems?.[idx]?.materialCost) || 0;
                    const total = labor + material;
                    return (
                      <tr
                        key={field.id}
                        className="border-b border-[var(--surface-border)] last:border-0"
                      >
                        <td className="p-2 min-w-[160px]">
                          <div className="font-medium text-[var(--text-primary)]">
                            {field.description}
                          </div>
                          <div className="text-[var(--text-secondary)] text-[10px]">
                            {field.category}
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            {...register(`lineItems.${idx}.laborCost`)}
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            className="w-24 px-2 py-1.5 rounded bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--teal-600)] font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            {...register(`lineItems.${idx}.materialCost`)}
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            className="w-24 px-2 py-1.5 rounded bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--teal-600)] font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <span className="font-mono font-semibold text-[var(--text-primary)]">
                            {total > 0 ? fmt(total) : "—"}
                          </span>
                        </td>
                        <td className="p-2">
                          <input
                            {...register(`lineItems.${idx}.estimatedDays`)}
                            type="number"
                            min={0}
                            placeholder="0"
                            className="w-16 px-2 py-1.5 rounded bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--teal-600)] font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Controller
                            control={control}
                            name={`lineItems.${idx}.subcontracted`}
                            render={({ field: f }) => (
                              <button
                                type="button"
                                onClick={() => f.onChange(!f.value)}
                                className={cn(
                                  "w-8 h-5 rounded-full border transition-all relative",
                                  f.value
                                    ? "bg-[var(--teal-600)] border-[var(--teal-400)]"
                                    : "bg-[var(--navy-800)] border-[var(--surface-border)]"
                                )}
                              >
                                <div
                                  className={cn(
                                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                                    f.value ? "translate-x-3.5" : "translate-x-0.5"
                                  )}
                                />
                              </button>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          {idx >= sowLineItems.length && (
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              className="p-1 rounded hover:bg-[rgba(226,75,74,0.1)] text-[var(--text-secondary)] hover:text-[var(--red-400)] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--surface-border)]">
                    <td colSpan={3} className="p-2 text-xs font-semibold text-[var(--text-secondary)] uppercase">
                      Total
                    </td>
                    <td className="p-2 font-mono font-bold text-[var(--teal-400)]">
                      {fmt(runningTotal)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add custom row */}
            <button
              type="button"
              onClick={() =>
                append({
                  sortOrder: fields.length,
                  category: "Other",
                  description: "",
                  subcontracted: false,
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--teal-600)] text-[var(--teal-400)] text-sm hover:bg-[rgba(93,202,165,0.05)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Line Item
            </button>
          </div>
        </Section>

        {/* Section 4: Schedule */}
        <Section number={4} title="Schedule & Terms" collapsible defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Proposed Start Date
              </label>
              <input
                {...register("proposedStartDate")}
                type="date"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Estimated Completion Days
              </label>
              <input
                {...register("estimatedDays")}
                type="number"
                min={1}
                placeholder="30"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Payment Terms
              </label>
              <input
                {...register("paymentTerms")}
                placeholder="Net 30, milestone-based, etc."
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Bid Valid Until
              </label>
              <input
                {...register("bidValidUntil")}
                type="date"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Section 5: Notes */}
        <Section number={5} title="Notes & Qualifications" collapsible defaultOpen={true}>
          <div className="space-y-4">
            {[
              { name: "exclusions" as const, label: "Exclusions", placeholder: "Items not included in this bid…" },
              { name: "allowances" as const, label: "Allowances", placeholder: "Material allowances included…" },
              { name: "assumptions" as const, label: "Assumptions", placeholder: "This bid assumes…" },
              { name: "notes" as const, label: "General Notes", placeholder: "Any additional information…" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  {label}
                </label>
                <textarea
                  {...register(name)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--navy-800)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--teal-600)] transition-colors resize-none"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(226,75,74,0.1)] border border-[rgba(226,75,74,0.2)] text-[var(--red-400)] text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 sticky bottom-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex-1 py-3 rounded-xl border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.15)] font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-[var(--surface-raised)]"
          >
            {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {savingDraft ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Submit Bid"}
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-[var(--surface-raised)] border border-[var(--surface-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3
              className="text-lg font-bold text-[var(--text-primary)] mb-2"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              Submit Bid?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              You are submitting a bid of{" "}
              <strong className="text-[var(--teal-400)] font-mono">{fmt(runningTotal)}</strong> for{" "}
              <strong className="text-[var(--text-primary)]">{property.address}</strong>.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-5">
              Once submitted, your bid cannot be changed. Make sure all information is accurate.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--surface-border)] text-[var(--text-secondary)] text-sm font-medium hover:border-[rgba(255,255,255,0.15)] transition-colors"
              >
                Review Again
              </button>
              <button
                onClick={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? "Submitting…" : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
