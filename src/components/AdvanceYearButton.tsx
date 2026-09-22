"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { advanceYear, type YearSummary } from "@/app/play/actions";
import { GAME_YEARS, MARKET_LABELS } from "@/lib/campaign";
import { formatDollars } from "@/lib/fund-math";
import { toast } from "@/components/toast";

// The turn crank. Warns about what's still on the table — advancing expires
// every open deal and pending decision, and that pressure is the point.
//
// Split into a Provider (owns the state), a Button (lives in the header,
// next to the year pips) and a Results panel (lives under the HUD strip,
// in the main content) — they need to render in two different places in
// the tree but share one advance action, so state lives in context instead
// of one component owning both pieces of UI.

type Ctx = {
  closing: boolean;
  openDeals: number;
  pendingDecisions: number;
  leftovers: string[];
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  pending: boolean;
  run: () => void;
  summary: YearSummary | null;
  nextYear: number;
};

const AdvanceYearContext = createContext<Ctx | null>(null);

function useAdvanceYear() {
  const ctx = useContext(AdvanceYearContext);
  if (!ctx) throw new Error("AdvanceYearButton/Results must be inside AdvanceYearProvider");
  return ctx;
}

export function AdvanceYearProvider({
  year,
  openDeals,
  pendingDecisions,
  children,
}: {
  year: number;
  openDeals: number;
  pendingDecisions: number;
  children: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState<YearSummary | null>(null);
  const [pending, startTransition] = useTransition();

  const closing = year >= GAME_YEARS;
  const leftovers = [
    openDeals > 0 && `${openDeals} open ${openDeals === 1 ? "deal" : "deals"}`,
    pendingDecisions > 0 &&
      `${pendingDecisions} pending ${pendingDecisions === 1 ? "decision" : "decisions"}`,
  ].filter((x): x is string => Boolean(x));

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
    <AdvanceYearContext.Provider
      value={{
        closing,
        openDeals,
        pendingDecisions,
        leftovers,
        confirming,
        setConfirming,
        pending,
        run,
        summary,
        nextYear: year + 1,
      }}
    >
      {children}
    </AdvanceYearContext.Provider>
  );
}

function AdvanceYearTrigger() {
  const { closing, pending, nextYear, setConfirming } = useAdvanceYear();
  return (
    <button
      type="button"
      data-tour="advance-year"
      onClick={() => setConfirming(true)}
      disabled={pending}
      className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
    >
      {pending ? "Rolling..." : closing ? "🏁 Close the fund" : `⏩ Advance to year ${nextYear}`}
    </button>
  );
}

// A bar pinned to the viewport (not the page), so it's reachable from
// anywhere without scrolling back up — the one control every year ends
// with, plus a quick portfolio glance, sharing space with nothing else.
// Renders only for an active, in-progress run (Shell passes null year for
// the title/scorecard screens).
export function AdvanceYearBar({ portfolio }: { portfolio?: React.ReactNode }) {
  const { closing, openDeals, pendingDecisions, leftovers, confirming, setConfirming, run } =
    useAdvanceYear();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[color:var(--max-magenta)] bg-[#151528]/95 px-6 py-3.5 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        {confirming ? (
          <>
            <span className="text-sm text-white/75">
              {leftovers.length > 0
                ? `${leftovers.join(" and ")} will expire — unanswered bridges count as refusals.`
                : closing
                  ? "Close the fund and see your final grade?"
                  : "Roll a year of events across the portfolio?"}
            </span>
            <span className="flex items-center gap-4 text-sm">
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
          </>
        ) : (
          <>
            <span className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                {openDeals > 0 || pendingDecisions > 0
                  ? `${openDeals} ${openDeals === 1 ? "deal" : "deals"} open · ${pendingDecisions} ${pendingDecisions === 1 ? "decision" : "decisions"} pending`
                  : "Desk clear for this year"}
              </span>
              {portfolio}
            </span>
            <AdvanceYearTrigger />
          </>
        )}
      </div>
    </div>
  );
}

export function AdvanceYearResults() {
  const { summary, pending } = useAdvanceYear();
  if (!summary || pending || summary.closed) return null;

  return (
    <div
      role="status"
      className="max-card-flat mt-6 rounded-2xl p-4 text-left"
      style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          Year {summary.year} results
        </p>
        <p className="text-sm font-semibold text-white/90">{MARKET_LABELS[summary.market]}</p>
      </div>

      {summary.macroShock && (
        <p className="mt-3 rounded-lg border-4 border-[color:var(--max-orange)] bg-[color:var(--max-orange)]/15 px-3 py-2 text-sm font-bold text-[color:var(--max-orange)]">
          ⚡ Macro shock — the whole portfolio leaned distressed this year
        </p>
      )}
      {summary.reservesScarce && (
        <p className="mt-3 rounded-lg border-4 border-[color:var(--max-yellow)] bg-[color:var(--max-yellow)]/15 px-3 py-2 text-sm font-bold text-[color:var(--max-yellow)]">
          💸 Reserves are scarce — this year&apos;s asks outrun what&apos;s left to deploy.
          Pick your spots.
        </p>
      )}

      {/* A company dying is the thing you most need to notice. */}
      {summary.writtenOff > 0 && (
        <p className="mt-3 rounded-lg border-4 border-[color:var(--max-orange)] bg-[color:var(--max-orange)]/15 px-3 py-2 text-sm font-bold text-[color:var(--max-orange)]">
          💀 {summary.writtenOff} {summary.writtenOff === 1 ? "company" : "companies"} went
          bankrupt this year
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
  );
}
