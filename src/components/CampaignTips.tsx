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
    ],
  },
];

export function CampaignTips() {
  return (
    <details className="group rounded-2xl border-2 border-slate-900/10 bg-white shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-5 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
        <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          💡 Tips for playing
        </span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>

      <div className="grid gap-6 border-t border-slate-100 p-5 dark:border-slate-800 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.heading}>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
              {g.heading}
            </h3>
            <ul className="mt-2 space-y-2.5">
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
