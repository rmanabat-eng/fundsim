import {
  DEALS_PER_YEAR,
  GAME_YEARS,
  INVESTMENT_PERIOD_YEARS,
} from "@/lib/campaign";

// Tactical advice for the turn you're actually playing — distinct from the
// one-time tutorial (onboarding) and the guide (theory). A collapsed <details>
// keeps it out of the way and needs no client JS or dismissal state.

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
  return (
    // Collapsed, this is just a small pill — a full-width bar left a long
    // empty band across the top of the page.
    <details className="group">
      <summary className="inline-flex w-fit cursor-pointer select-none list-none items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-amber-900 shadow-[3px_3px_0_rgba(245,158,11,0.35)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-amber-500 motion-safe:hover:-translate-y-0.5 dark:border-amber-600/70 dark:bg-amber-950/40 dark:text-amber-200 dark:shadow-[3px_3px_0_rgba(0,0,0,0.45)] [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-sm">
          💡
        </span>
        Tips for playing
        <span
          aria-hidden
          className="text-[10px] transition-transform group-open:rotate-180"
        >
          ▼
        </span>
      </summary>

      {/* Each group gets its own box: uneven tip counts would otherwise leave
          ragged gaps where a short section meets a tall one in the grid. */}
      <div className="mt-3 grid gap-4 rounded-2xl border-2 border-slate-900/10 bg-white p-5 shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)] sm:grid-cols-2">
        {GROUPS.map((g) => (
          <section
            key={g.heading}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40"
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
              {g.heading}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {g.tips.map((t) => (
                <li key={t.lead} className="text-sm leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {t.lead}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {" "}
                    — {t.body}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
