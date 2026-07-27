"use client";

import { useState, useTransition } from "react";
import { advanceYear, type YearSummary } from "@/app/play/actions";
import { GAME_YEARS, MARKET_LABELS } from "@/lib/campaign";
import { formatDollars } from "@/lib/fund-math";
import { toast } from "@/components/toast";

// The turn crank. Warns about what's still on the table — advancing expires
// every open deal and pending decision, and that pressure is the point.
export function AdvanceYearButton({
  year,
  openDeals,
  pendingDecisions,
  heading,
}: {
  year: number;
  openDeals: number;
  pendingDecisions: number;
  heading?: React.ReactNode; // sits in the same row as the button
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
      const result = await advanceYear();
      setSummary(result);
      // Deaths are easy to miss in a wall of results, so they also get a toast.
      if (result && result.writtenOff > 0) {
        toast(
          `${result.writtenOff} ${result.writtenOff === 1 ? "company" : "companies"} went bankrupt this year`,
          "error"
        );
      }
    });
  }

  return (
    // The component owns the whole row — the heading included — so the year's
    // results can sit full width underneath instead of being squeezed into a
    // column beside it.
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {heading}
        <div className="ml-auto">
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
              data-tour="advance-year"
              onClick={() => setConfirming(true)}
              disabled={pending}
              className="btn-arcade rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
            >
              {pending
                ? "Rolling..."
                : closing
                  ? "🏁 Close the fund"
                  : `⏩ Advance to year ${year + 1}`}
            </button>
          )}
        </div>
      </div>

      {summary && !pending && !summary.closed && (
        <div
          role="status"
          className="mt-4 w-full rounded-2xl border-2 border-slate-900/10 bg-white p-4 text-left shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Year {summary.year} results
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {MARKET_LABELS[summary.market]}
            </p>
          </div>

          {/* A company dying is the thing you most need to notice. */}
          {summary.writtenOff > 0 && (
            <p className="mt-3 rounded-lg border-2 border-rose-400 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              💀 {summary.writtenOff}{" "}
              {summary.writtenOff === 1 ? "company" : "companies"} went bankrupt this
              year
            </p>
          )}

          {/* Spread across the width rather than stacking in a narrow column. */}
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
            <li>📈 {summary.raised} raised again</li>
            <li>
              🏆 {summary.exited} exited
              {summary.distributions > 0 && (
                <> — {formatDollars(summary.distributions)} back to the fund</>
              )}
            </li>
            <li>😴 {summary.quiet} had a quiet year</li>
            {summary.expiredDeals + summary.expiredDecisions > 0 && (
              <li className="text-amber-600 dark:text-amber-500">
                ⌛ {summary.expiredDeals + summary.expiredDecisions} expired unanswered
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
