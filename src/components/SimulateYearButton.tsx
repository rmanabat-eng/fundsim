"use client";

import { useState, useTransition } from "react";
import { simulateYear, type SimulationSummary } from "@/app/actions";
import { formatDollars } from "@/lib/fund-math";

// Batch-mutates the whole portfolio, so it gets an inline confirm step like
// the other destructive buttons.
export function SimulateYearButton({ activeCount }: { activeCount: number }) {
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setConfirming(false);
    startTransition(async () => {
      setSummary(await simulateYear());
    });
  }

  return (
    <div className="flex items-center gap-3">
      {summary && !pending && (
        <p className="text-xs text-white/60">
          This year: <strong className="text-white">{summary.raised}</strong> raised,{" "}
          <strong className="text-white">{summary.exited}</strong> exited
          {summary.distributions > 0 && (
            <> ({formatDollars(summary.distributions)} back)</>
          )}
          , <strong className="text-white">{summary.writtenOff}</strong> shut down,{" "}
          <strong className="text-white">{summary.quiet}</strong> quiet.
        </p>
      )}
      {confirming ? (
        <span className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          Roll a year of events across {activeCount} active{" "}
          {activeCount === 1 ? "company" : "companies"}?
          <button
            onClick={run}
            className="font-bold text-[color:var(--max-cyan)] hover:underline"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="font-bold text-white/60 hover:underline"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending || activeCount === 0}
          className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85 disabled:opacity-50"
        >
          {pending ? "Simulating..." : "⏩ Simulate a year"}
        </button>
      )}
    </div>
  );
}
