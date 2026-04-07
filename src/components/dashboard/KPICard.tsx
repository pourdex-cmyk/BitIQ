"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  format?: "number" | "currency" | "score" | "text";
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  accent?: "teal" | "purple" | "amber" | "red";
  className?: string;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function formatValue(value: number, format: KPICardProps["format"]): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
        notation: value >= 1000000 ? "compact" : "standard",
      }).format(value);
    case "score":
      return value.toFixed(1);
    default:
      return value.toLocaleString();
  }
}

const accentColors = {
  teal: {
    text: "text-[var(--teal-400)]",
    bg: "bg-[rgba(93,202,165,0.08)]",
    border: "border-[var(--teal-600)]",
  },
  purple: {
    text: "text-[var(--purple-400)]",
    bg: "bg-[rgba(127,119,221,0.08)]",
    border: "border-[var(--purple-600)]",
  },
  amber: {
    text: "text-[var(--amber-500)]",
    bg: "bg-[rgba(186,117,23,0.08)]",
    border: "border-[var(--amber-600)]",
  },
  red: {
    text: "text-[var(--red-400)]",
    bg: "bg-[rgba(226,75,74,0.08)]",
    border: "border-[var(--red-600)]",
  },
};

export function KPICard({
  title,
  value,
  format = "number",
  trend,
  trendLabel,
  icon,
  accent = "teal",
  className,
}: KPICardProps) {
  const numericValue = typeof value === "number" ? value : 0;
  const animated = useCountUp(numericValue);
  const colors = accentColors[accent];

  const displayValue =
    typeof value === "string" ? value : formatValue(animated, format);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("card-surface p-5", className)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg)}>
            <span className={colors.text}>{icon}</span>
          </div>
        )}
      </div>

      <div
        className={cn("text-3xl font-bold mb-2", colors.text)}
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        {displayValue}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-[var(--teal-400)]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-[var(--red-400)]" />
          )}
          <span
            className={cn(
              "text-xs font-mono font-medium",
              trend >= 0 ? "text-[var(--teal-400)]" : "text-[var(--red-400)]"
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
          {trendLabel && (
            <span className="text-xs text-[var(--text-secondary)]">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
