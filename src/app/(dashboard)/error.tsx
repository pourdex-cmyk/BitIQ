"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-primary)]">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <pre className="text-xs text-red-400 bg-[var(--navy-800)] p-4 rounded-lg max-w-2xl overflow-auto whitespace-pre-wrap">
        {error.message}
        {error.digest ? `\nDigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[var(--teal-600)] text-white rounded-lg text-sm"
      >
        Try again
      </button>
    </div>
  );
}
