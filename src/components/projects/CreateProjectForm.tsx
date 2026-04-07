"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AIProcessingIndicator, AIBadge } from "@/components/shared/AIProcessingIndicator";
import {
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiPhotoAnalysis, SowLineItemInput } from "@/types";

const STEPS = [
  { id: 1, label: "Property" },
  { id: 2, label: "AI Analysis" },
  { id: 3, label: "Scope of Work" },
  { id: 4, label: "Bid Settings" },
];

type PropertyType =
  | "single-family"
  | "multi-family"
  | "commercial"
  | "condo"
  | "mixed-use";

interface FormData {
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType | "";
  squareFootage: string;
  yearBuilt: string;
  purchasePrice: string;
  name: string;
  description: string;
  budgetTarget: string;
  bidDeadline: string;
  inviteEmails: string;
}

interface UploadedPhoto {
  url: string;
  storagePath: string;
  file: File;
  preview: string;
}

export function CreateProjectForm() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [generatingSow, setGeneratingSow] = useState(false);
  const [sowText, setSowText] = useState("");

  const [formData, setFormData] = useState<FormData>({
    address: "",
    city: "",
    state: "CT",
    zip: "",
    propertyType: "",
    squareFootage: "",
    yearBuilt: "",
    purchasePrice: "",
    name: "",
    description: "",
    budgetTarget: "",
    bidDeadline: "",
    inviteEmails: "",
  });

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photoAnalysis, setPhotoAnalysis] = useState<AiPhotoAnalysis | null>(null);
  const [sowItems, setSowItems] = useState<SowLineItemInput[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [inviteRows, setInviteRows] = useState([{ name: "", email: "" }]);

  const update = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Photo upload
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newPhotos: UploadedPhoto[] = [];
      for (const file of acceptedFiles) {
        const path = `property-photos/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("property-photos")
          .upload(path, file, { upsert: true });
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        const { data: urlData } = supabase.storage
          .from("property-photos")
          .getPublicUrl(data.path);
        newPhotos.push({
          url: urlData.publicUrl,
          storagePath: data.path,
          file,
          preview: URL.createObjectURL(file),
        });
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
    },
    [supabase]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 20,
  });

  // Step 1: Create project + upload photos
  const handleStep1 = async () => {
    if (!formData.address || !formData.city || !formData.zip || !formData.propertyType) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          propertyType: formData.propertyType,
          squareFootage: formData.squareFootage ? Number(formData.squareFootage) : undefined,
          yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
          purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
          name: formData.name || `${formData.address} Renovation`,
          description: formData.description,
          budgetTarget: formData.budgetTarget ? Number(formData.budgetTarget) : undefined,
          bidDeadline: formData.bidDeadline,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setProjectId(json.data.id);

      // Upload photo records to DB
      if (photos.length > 0) {
        for (const photo of photos) {
          await supabase.from("PropertyPhoto").insert({
            propertyId: json.data.propertyId,
            url: photo.url,
            storagePath: photo.storagePath,
          });
        }
      }

      setStep(2);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: AI photo analysis
  const handleAnalyzePhotos = async () => {
    if (!projectId || photos.length === 0) {
      toast.error("Please upload at least one photo first");
      return;
    }
    setAiAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          photoUrls: photos.map((p) => p.url),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setPhotoAnalysis(json.data);
      toast.success("AI analysis complete!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Step 3: Generate SOW
  const handleGenerateSow = async () => {
    if (!projectId) return;
    setGeneratingSow(true);
    setSowText("");
    try {
      const response = await fetch("/api/ai/generate-sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setSowText(fullText);
      }

      // Parse the JSON items from the streamed text
      const jsonMatch =
        fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
        fullText.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        const items: SowLineItemInput[] = JSON.parse(jsonMatch[1]);
        setSowItems(items);
      }
      toast.success("Scope of work generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "SOW generation failed");
    } finally {
      setGeneratingSow(false);
    }
  };

  // Step 4: Open bidding
  const handleOpenBidding = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const emailRows = inviteRows.filter((r) => r.email.trim() && r.name.trim());
      if (emailRows.length === 0) {
        toast.error("Add at least one contractor to invite");
        setLoading(false);
        return;
      }

      // Update project deadline
      if (formData.bidDeadline) {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bidDeadline: new Date(formData.bidDeadline).toISOString() }),
        });
      }

      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, contractors: emailRows }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success(`Invitations sent to ${emailRows.length} contractor(s)!`);
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to open bidding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                step > s.id && "opacity-70"
              )}
              onClick={() => step > s.id && setStep(s.id)}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 border",
                  step === s.id
                    ? "bg-[var(--teal-600)] border-[var(--teal-400)] text-white"
                    : step > s.id
                    ? "bg-[var(--teal-600)] border-[var(--teal-600)] text-white"
                    : "bg-[var(--navy-800)] border-[var(--surface-border)] text-[var(--text-secondary)]"
                )}
              >
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:block",
                  step === s.id
                    ? "text-[var(--text-primary)]"
                    : step > s.id
                    ? "text-[var(--teal-400)]"
                    : "text-[var(--text-secondary)]"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-3",
                  step > s.id
                    ? "bg-[var(--teal-600)]"
                    : "bg-[var(--surface-border)]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="card-surface p-6 space-y-5"
        >
          {/* STEP 1: Property */}
          {step === 1 && (
            <>
              <div>
                <h2
                  className="text-xl font-bold text-[var(--text-primary)] mb-1"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  Property Details
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Tell us about the property you're renovating
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <InputField
                  label="Street Address *"
                  value={formData.address}
                  onChange={(v) => update("address", v)}
                  placeholder="14 Maple Avenue"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <InputField
                      label="City *"
                      value={formData.city}
                      onChange={(v) => update("city", v)}
                      placeholder="Glastonbury"
                    />
                  </div>
                  <InputField
                    label="ZIP *"
                    value={formData.zip}
                    onChange={(v) => update("zip", v)}
                    placeholder="06033"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    Property Type *
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => update("propertyType", e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)]"
                  >
                    <option value="">Select type...</option>
                    <option value="single-family">Single Family</option>
                    <option value="multi-family">Multi-Family</option>
                    <option value="condo">Condo / Townhouse</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed-use">Mixed Use</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InputField
                    label="Sq. Footage"
                    type="number"
                    value={formData.squareFootage}
                    onChange={(v) => update("squareFootage", v)}
                    placeholder="1850"
                  />
                  <InputField
                    label="Year Built"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(v) => update("yearBuilt", v)}
                    placeholder="1965"
                  />
                  <InputField
                    label="Purchase Price"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(v) => update("purchasePrice", v)}
                    placeholder="285000"
                    prefix="$"
                  />
                </div>
                <InputField
                  label="Project Name"
                  value={formData.name}
                  onChange={(v) => update("name", v)}
                  placeholder="Full Renovation — 14 Maple"
                />
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={2}
                    placeholder="Any additional context for contractors..."
                    className="w-full px-3 py-2.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] resize-none"
                  />
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                  Property Photos (for AI analysis)
                </label>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    isDragActive
                      ? "border-[var(--teal-400)] bg-[rgba(93,202,165,0.06)]"
                      : "border-[var(--surface-border)] hover:border-[rgba(255,255,255,0.2)]"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-primary)] font-medium">
                    {isDragActive ? "Drop photos here" : "Drag & drop property photos"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    or click to browse · JPG, PNG, WebP · Max 20 photos
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleStep1}
                  disabled={loading}
                  className="bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white border-0"
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* STEP 2: AI Photo Analysis */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3">
                <div>
                  <h2
                    className="text-xl font-bold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    AI Photo Analysis
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    Claude will assess property condition from your photos
                  </p>
                </div>
                <AIBadge className="ml-auto" />
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    No photos uploaded. Skip or go back to add photos.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {photoAnalysis?.photos[i] && (
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-mono",
                                photoAnalysis.photos[i].severity === "high"
                                  ? "bg-[var(--red-600)] text-red-200"
                                  : photoAnalysis.photos[i].severity === "medium"
                                  ? "bg-[var(--amber-600)] text-amber-200"
                                  : "bg-[var(--green-600)] text-green-200"
                              )}
                            >
                              {photoAnalysis.photos[i].severity}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!photoAnalysis && !aiAnalyzing && (
                    <Button
                      onClick={handleAnalyzePhotos}
                      className="w-full bg-[var(--purple-600)] hover:bg-[var(--purple-800)] text-white border-0"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </Button>
                  )}

                  {aiAnalyzing && (
                    <div className="flex items-center justify-center py-6">
                      <AIProcessingIndicator label="Analyzing property photos..." size="lg" />
                    </div>
                  )}

                  {photoAnalysis && (
                    <div className="space-y-4">
                      <div
                        className={cn(
                          "p-4 rounded-xl border",
                          photoAnalysis.overallCondition === "poor"
                            ? "bg-[rgba(163,45,45,0.1)] border-[var(--red-600)]"
                            : photoAnalysis.overallCondition === "fair"
                            ? "bg-[rgba(133,79,11,0.1)] border-[var(--amber-600)]"
                            : "bg-[rgba(15,110,86,0.1)] border-[var(--teal-600)]"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            Overall Condition
                          </span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded font-mono font-bold uppercase",
                              photoAnalysis.overallCondition === "poor"
                                ? "text-[var(--red-400)]"
                                : photoAnalysis.overallCondition === "fair"
                                ? "text-[var(--amber-500)]"
                                : "text-[var(--teal-400)]"
                            )}
                          >
                            {photoAnalysis.overallCondition}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">
                          {photoAnalysis.overallSummary}
                        </p>
                      </div>

                      {photoAnalysis.priorityItems.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Priority Items
                          </p>
                          <ul className="space-y-1">
                            {photoAnalysis.priorityItems.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-400)] flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                          Scope Categories Identified
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {photoAnalysis.estimatedScopeCategories.map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded text-xs text-[var(--text-secondary)]"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-[var(--surface-border)] text-[var(--text-secondary)]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white border-0"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: Scope of Work */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3">
                <div>
                  <h2
                    className="text-xl font-bold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-dm-serif)" }}
                  >
                    Scope of Work
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    AI generates line items from property analysis
                  </p>
                </div>
                <AIBadge className="ml-auto" />
              </div>

              {!generatingSow && sowItems.length === 0 && !sowText && (
                <Button
                  onClick={handleGenerateSow}
                  className="w-full bg-[var(--purple-600)] hover:bg-[var(--purple-800)] text-white border-0 py-3"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate AI Scope of Work
                </Button>
              )}

              {generatingSow && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-4">
                    <AIProcessingIndicator label="Generating scope of work..." size="lg" />
                  </div>
                  {sowText && (
                    <div className="bg-[var(--navy-800)] rounded-xl p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                        {sowText}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {sowItems.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--surface-border)]">
                        <th className="text-left py-2 pr-3">#</th>
                        <th className="text-left py-2 pr-3">Category</th>
                        <th className="text-left py-2 pr-3">Description</th>
                        <th className="text-right py-2 pr-3">Unit</th>
                        <th className="text-right py-2 pr-3">Qty</th>
                        <th className="text-right py-2 pr-3">Low</th>
                        <th className="text-right py-2 pr-3">Mid</th>
                        <th className="text-right py-2">High</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-border)]">
                      {sowItems.map((item, i) => (
                        <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)]">
                          <td className="py-2 pr-3 font-mono text-xs text-[var(--text-secondary)]">
                            {i + 1}
                          </td>
                          <td className="py-2 pr-3">
                            <span className="text-xs px-1.5 py-0.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded text-[var(--text-secondary)]">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-[var(--text-primary)] max-w-[200px]">
                            {item.description}
                          </td>
                          <td className="py-2 pr-3 text-right text-[var(--text-secondary)]">
                            {item.unit ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-[var(--text-secondary)]">
                            {item.estimatedQty ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-[var(--green-500)]">
                            {item.benchmarkLow
                              ? `$${item.benchmarkLow.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-[var(--text-primary)]">
                            {item.benchmarkMid
                              ? `$${item.benchmarkMid.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="py-2 text-right font-mono text-[var(--amber-500)]">
                            {item.benchmarkHigh
                              ? `$${item.benchmarkHigh.toLocaleString()}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--surface-border)] font-bold">
                        <td colSpan={5} className="py-3 text-sm text-[var(--text-secondary)]">
                          Total Benchmark
                        </td>
                        <td className="py-3 text-right font-mono text-sm text-[var(--green-500)]">
                          ${sowItems.reduce((s, i) => s + (i.benchmarkLow ?? 0), 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono text-sm text-[var(--text-primary)]">
                          ${sowItems.reduce((s, i) => s + (i.benchmarkMid ?? 0), 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono text-sm text-[var(--amber-500)]">
                          ${sowItems.reduce((s, i) => s + (i.benchmarkHigh ?? 0), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-[var(--surface-border)] text-[var(--text-secondary)]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white border-0"
                >
                  Finalize SOW <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* STEP 4: Bid Settings */}
          {step === 4 && (
            <>
              <div>
                <h2
                  className="text-xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  Bid Settings
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Set deadline and invite contractors to bid
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                      Bid Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.bidDeadline}
                      onChange={(e) => update("bidDeadline", e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)]"
                    />
                  </div>
                  <InputField
                    label="Budget Target"
                    type="number"
                    value={formData.budgetTarget}
                    onChange={(v) => update("budgetTarget", v)}
                    placeholder="50000"
                    prefix="$"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Invite Contractors
                    </label>
                    <button
                      type="button"
                      onClick={() => setInviteRows((r) => [...r, { name: "", email: "" }])}
                      className="flex items-center gap-1 text-xs text-[var(--teal-400)] hover:text-[var(--teal-300)]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add contractor
                    </button>
                  </div>
                  <div className="space-y-2">
                    {inviteRows.map((row, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={row.name}
                          onChange={(e) => {
                            const next = [...inviteRows];
                            next[i].name = e.target.value;
                            setInviteRows(next);
                          }}
                          className="flex-1 px-3 py-2 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)]"
                        />
                        <input
                          type="email"
                          placeholder="email@company.com"
                          value={row.email}
                          onChange={(e) => {
                            const next = [...inviteRows];
                            next[i].email = e.target.value;
                            setInviteRows(next);
                          }}
                          className="flex-1 px-3 py-2 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)]"
                        />
                        {inviteRows.length > 1 && (
                          <button
                            onClick={() => setInviteRows((r) => r.filter((_, j) => j !== i))}
                            className="text-[var(--text-secondary)] hover:text-[var(--red-400)]"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="border-[var(--surface-border)] text-[var(--text-secondary)]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleOpenBidding}
                  disabled={loading}
                  className="bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white border-0"
                >
                  {loading ? (
                    "Opening bidding..."
                  ) : (
                    <>
                      Open Bidding <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full py-2.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] transition-colors",
            prefix ? "pl-7 pr-4" : "px-3"
          )}
        />
      </div>
    </div>
  );
}
