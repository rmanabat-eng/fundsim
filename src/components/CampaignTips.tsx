"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DEALS_PER_YEAR,
  GAME_YEARS,
  INVESTMENT_PERIOD_YEARS,
} from "@/lib/campaign";

// Tactical advice for the turn you're actually playing — distinct from the
// one-time tutorial (onboarding) and the guide (theory). A popup modal
// (FundNamePrompt's dialog pattern) instead of an inline <details> block:
// the tip list is long enough that expanding it in place pushed the deal
// feed down every time someone opened it.

type Tip = { lead: string; body: string };
type Group = { heading: string; tips: Tip[] };

const GROUPS: Group[] = [
  {
    heading: "🃏 Reading the deals",
    tips: [
      {
        lead: "Weigh the whole card",
        body: "No single clue decides it. Add up the good and the bad.",
      },
      {
        lead: "Founders matter most",
        body: "A proven team is the best sign; co-founders who fight is the worst.",
      },
      {
        lead: "A pass is free, silence isn't",
        body: "Letting a pitch expire costs reputation. Passing costs nothing.",
      },
    ],
  },
  {
    heading: "💰 Pacing the fund",
    tips: [
      {
        lead: "Don't spend it all early",
        body: `About ${DEALS_PER_YEAR} pitches a year, and none after year ${INVESTMENT_PERIOD_YEARS}.`,
      },
      {
        lead: "Save money for later rounds",
        body: "Keeping your share of a winner costs more every time its price goes up.",
      },
      {
        lead: "Back enough companies",
        body: "One big winner usually pays for the whole fund — you need enough chances to find it.",
      },
      {
        lead: "Keep cash for bad years",
        body: "In a bad market, deals are cheaper. In a good one, companies sell for more.",
      },
    ],
  },
  {
    heading: "⚡ Working your desk",
    tips: [
      {
        lead: "Famous investor beats highest bidder",
        body: "A top investor's help improves the company's chances every year after.",
      },
      {
        lead: "Rescues cut both ways",
        body: "Refusing hurts the company and your reputation — but don't rescue every failing one.",
      },
      {
        lead: "Backing a pivot is a gamble",
        body: "It can go much better or much worse. Urging focus is the safe, small gain.",
      },
      {
        lead: "Pushing on price is risky",
        body: "A lower price buys you more, but the founder may walk away. Offering a smaller check is safe.",
      },
      {
        lead: "Undo works until you advance",
        body: "First checks are reversible from the “Backed this year” strip.",
      },
    ],
  },
  {
    heading: "🏁 Playing for the grade",
    tips: [
      {
        lead: "Doubling your money isn't enough",
        body: `2.5× puts you in the top quarter of funds at year ${GAME_YEARS}; under 1× means you lost money.`,
      },
      {
        lead: "Don't sell your best company early",
        body: "A quick 3× feels good, but your biggest winner is what makes the fund.",
      },
      {
        lead: "One game is mostly luck",
        body: "Play again to see what really works.",
      },
    ],
  },
];

export function CampaignTips() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tips for playing"
        className="whitespace-nowrap text-lg font-bold uppercase tracking-widest text-white/60 hover:text-white sm:text-xs"
      >
        💡<span className="hidden sm:inline"> Tips</span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tips for playing"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[#0d0d1a]/85"
              onClick={() => setOpen(false)}
            />
            <div
              className="max-card-solid relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 shadow-[6px_6px_0_var(--max-cyan)] sm:p-6"
              style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-lg font-bold text-white">
                  💡 Tips for playing
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="shrink-0 text-xl leading-none text-white/50 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {GROUPS.map((g, i) => (
                  <section
                    key={g.heading}
                    className="max-chip-box rounded-xl p-4"
                    style={
                      {
                        borderColor: [
                          "var(--max-magenta)",
                          "var(--max-cyan)",
                          "var(--max-orange)",
                          "var(--max-purple)",
                        ][i % 4],
                      } as React.CSSProperties
                    }
                  >
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">
                      {g.heading}
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                      {g.tips.map((t) => (
                        <li key={t.lead} className="text-sm leading-relaxed">
                          <span className="font-semibold text-white/90">{t.lead}</span>
                          <span className="text-white/65"> — {t.body}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
