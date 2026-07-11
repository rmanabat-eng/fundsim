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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This year: <strong>{summary.raised}</strong> raised,{" "}
          <strong>{summary.exited}</strong> exited
          {summary.distributions > 0 && (
            <> ({formatDollars(summary.distributions)} back)</>
          )}
          , <strong>{summary.writtenOff}</strong> shut down,{" "}
          <strong>{summary.quiet}</strong> quiet.
        </p>
      )}
      {confirming ? (
        <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          Roll a year of events across {activeCount} active{" "}
          {activeCount === 1 ? "company" : "companies"}?
          <button
            onClick={run}
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="font-medium text-slate-600 hover:underline dark:text-slate-400"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending || activeCount === 0}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {pending ? "Simulating..." : "⏩ Simulate a year"}
        </button>
      )}
    </div>
  );
}
