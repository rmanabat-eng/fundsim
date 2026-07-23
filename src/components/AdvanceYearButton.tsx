"use client";

import { useState, useTransition } from "react";
import { advanceYear, type YearSummary } from "@/app/play/actions";
import { GAME_YEARS, MARKET_LABELS } from "@/lib/campaign";
import { formatDollars } from "@/lib/fund-math";

// The turn crank. Warns about what's still on the table — advancing expires
// every open deal and pending decision, and that pressure is the point.
export function AdvanceYearButton({
  year,
  openDeals,
  pendingDecisions,
}: {
  year: number;
  openDeals: number;
  pendingDecisions: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState<YearSummary | null>(null);
  const [pending, startTransition] = useTransition();

  const closing = year >= GAME_YEARS;
  const leftovers = [
    openDeals > 0 && `${openDeals} open ${openDeals === 1 ? "deal" : "deals"}`,
    pendingDecisions > 0 &&
      `${pendingDecisions} pending ${pendingDecisions === 1 ? "decision" : "decisions"}`,
  ].filter(Boolean);

  function run() {
    setConfirming(false);
    startTransition(async () => {
      setSummary(await advanceYear());
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {confirming ? (
        <span className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-600 dark:text-slate-400">
          {leftovers.length > 0
            ? `${leftovers.join(" and ")} will expire — unanswered bridges count as refusals.`
            : closing
              ? "Close the fund and see your final grade?"
              : "Roll a year of events across the portfolio?"}
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
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
        >
          {pending
            ? "Rolling..."
            : closing
              ? "🏁 Close the fund"
              : `⏩ Advance to year ${year + 1}`}
        </button>
      )}
      {summary && !pending && !summary.closed && (
        <p className="max-w-md text-right text-xs text-slate-500 dark:text-slate-400">
          {MARKET_LABELS[summary.market]}. This year:{" "}
          <strong>{summary.raised}</strong> raised, <strong>{summary.exited}</strong>{" "}
          exited
          {summary.distributions > 0 && <> ({formatDollars(summary.distributions)} back)</>}
          , <strong>{summary.writtenOff}</strong> shut down,{" "}
          <strong>{summary.quiet}</strong> quiet.
          {summary.expiredDeals + summary.expiredDecisions > 0 && (
            <> {summary.expiredDeals + summary.expiredDecisions} expired unanswered.</>
          )}
        </p>
      )}
    </div>
  );
}
