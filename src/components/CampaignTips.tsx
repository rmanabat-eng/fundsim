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
        body: "Noise outweighs any single signal. Net the good against the bad.",
      },
      {
        lead: "Founders matter most",
        body: "A proven team is the biggest plus; feuding co-founders the biggest minus.",
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
        lead: "Hold reserves",
        body: "Defending your ownership costs more at every markup.",
      },
      {
        lead: "Take enough bets",
        body: "One winner usually pays for the fund — you need shots at it.",
      },
      {
        lead: "Dry powder wins downturns",
        body: "Bear years price cheap; bull years exit rich.",
      },
    ],
  },
  {
    heading: "⚡ Working your desk",
    tips: [
      {
        lead: "Top-tier lead beats a high price",
        body: "A strong lead lifts the company's odds every year after.",
      },
      {
        lead: "Bridges cut both ways",
        body: "Refusing hurts them and you — but don't bridge every casualty.",
      },
      {
        lead: "Backing a pivot is the risky play",
        body: "Urging focus is the small, safe nudge.",
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
        lead: "Doubling your money is below median",
        body: `2.5× is top quartile at year ${GAME_YEARS}; under 1× means you lost money.`,
      },
      {
        lead: "Don't sell the fund-maker",
        body: "A 3× exit still loses you the run.",
      },
      {
        lead: "One run is one sample",
        body: "There's a lot of luck in a single fund. Replay to see the pattern.",
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
        className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
      >
        💡 Tips
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
