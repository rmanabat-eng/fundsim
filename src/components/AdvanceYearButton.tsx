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
            <span className="flex flex-wrap items-center justify-end gap-2 text-sm text-white/75">
              {leftovers.length > 0
                ? `${leftovers.join(" and ")} will expire — unanswered bridges count as refusals.`
                : closing
                  ? "Close the fund and see your final grade?"
                  : "Roll a year of events across the portfolio?"}
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
              data-tour="advance-year"
              onClick={() => setConfirming(true)}
              disabled={pending}
              className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
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
          className="max-card mt-4 w-full rounded-2xl p-4 text-left"
          style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
              Year {summary.year} results
            </p>
            <p className="text-sm font-semibold text-white/90">
              {MARKET_LABELS[summary.market]}
            </p>
          </div>

          {/* A company dying is the thing you most need to notice. */}
          {summary.writtenOff > 0 && (
            <p className="mt-3 rounded-lg border-4 border-[color:var(--max-orange)] bg-[color:var(--max-orange)]/15 px-3 py-2 text-sm font-bold text-[color:var(--max-orange)]">
              💀 {summary.writtenOff}{" "}
              {summary.writtenOff === 1 ? "company" : "companies"} went bankrupt this
              year
            </p>
          )}

          {/* Spread across the width rather than stacking in a narrow column. */}
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm text-white/70 sm:grid-cols-2">
            <li>📈 {summary.raised} raised again</li>
            <li>
              🏆 {summary.exited} exited
              {summary.distributions > 0 && (
                <> — {formatDollars(summary.distributions)} back to the fund</>
              )}
            </li>
            <li>😴 {summary.quiet} had a quiet year</li>
            {summary.expiredDeals + summary.expiredDecisions > 0 && (
              <li className="text-[color:var(--max-yellow)]">
                ⌛ {summary.expiredDeals + summary.expiredDecisions} expired unanswered
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
