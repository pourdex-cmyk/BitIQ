"use client";

import { cn } from "@/lib/utils";

interface AIProcessingIndicatorProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AIProcessingIndicator({
  label = "AI Processing",
  size = "md",
  className,
}: AIProcessingIndicatorProps) {
  const ringSize = size === "sm" ? 24 : size === "md" ? 40 : 56;
  const dotSize = size === "sm" ? 8 : size === "md" ? 14 : 20;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
        {/* Pulse rings */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[var(--teal-400)] ai-ring"
          style={{ opacity: 0.7 }}
        />
        <div
          className="absolute inset-0 rounded-full border border-[var(--teal-400)] ai-ring"
          style={{ opacity: 0.4, animationDelay: "0.3s" }}
        />
        {/* Center dot */}
        <div
          className="rounded-full bg-[var(--teal-400)] ai-pulse"
          style={{ width: dotSize, height: dotSize }}
        />
      </div>
      {label && (
        <span
          className="text-[var(--teal-400)] font-mono text-sm font-medium tracking-wide"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function AIBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium font-mono",
        "bg-[var(--purple-800)] text-[var(--purple-400)] border border-[var(--purple-600)]",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple-400)] ai-pulse inline-block" />
      AI
    </span>
  );
}
