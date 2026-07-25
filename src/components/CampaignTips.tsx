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
        lead: "Weigh the whole card, not its best line",
        body: "Signals are deliberately noisy — the random swing on any company is bigger than any single clue is worth. Net the good against the bad instead of buying for one exciting bullet.",
      },
      {
        lead: "Founder signals carry the most weight",
        body: "A proven founding team is the strongest positive on the board; co-founders who disagree about direction are the strongest negative. Serial pivoting is close behind.",
      },
      {
        lead: "A pass is free — silence is not",
        body: "Passing on a pitch costs you nothing. Letting it sit until the year rolls is recorded as ghosting the founder and costs reputation. Decide, don't drift.",
      },
    ],
  },
  {
    heading: "💰 Pacing the fund",
    tips: [
      {
        lead: `Budget across all ${INVESTMENT_PERIOD_YEARS} investing years`,
        body: `You see about ${DEALS_PER_YEAR} pitches a year and none after year ${INVESTMENT_PERIOD_YEARS}. Spend everything early and you'll watch better companies go by with an empty chequebook.`,
      },
      {
        lead: "Hold reserves for follow-ons",
        body: "Your winners raise again, and defending your ownership costs more at every markup. Real funds keep roughly half their capital back for exactly this.",
      },
      {
        lead: "Enough bets to catch an outlier",
        body: "One or two companies is a coin flip. The whole fund usually comes from a single winner, so you need enough shots for one of them to be it.",
      },
      {
        lead: "Dry powder is worth most in a downturn",
        body: "Bear years price companies cheaply and bull years exit them richly. Capital left over when the market turns is an advantage, not a mistake.",
      },
    ],
  },
  {
    heading: "⚡ Working your desk",
    tips: [
      {
        lead: "Back the top-tier lead over the higher price",
        body: "A strong lead investor improves the company's odds every year afterwards. The flattering valuation gives you a better paper mark today and a weaker company later.",
      },
      {
        lead: "Bridges cut both ways",
        body: "Funding one meaningfully improves a struggling company's chances; refusing hurts it badly and dents your reputation. But bridging every casualty is how a fund bleeds out — pick the ones worth saving.",
      },
      {
        lead: "Backing a pivot is the high-variance play",
        body: "It's a genuine reroll — it can go a little worse or a lot better. Urging focus is a small, safe nudge. On a company you can afford to lose, variance is your friend.",
      },
      {
        lead: "Undo is available until you advance",
        body: "A first check written this year can be reversed from the “Backed this year” strip, and the pitch goes back in the deck. Once the year rolls, it's permanent.",
      },
    ],
  },
  {
    heading: "🏁 Playing for the grade",
    tips: [
      {
        lead: "Doubling your money is below median",
        body: `You're scored on TVPI at year ${GAME_YEARS}: 2.5× is top quartile and 3.5× is top decile, but under 1× means you returned less than you deployed. LPs take this risk for outliers.`,
      },
      {
        lead: "Don't sell the company that pays for the fund",
        body: "A 3× acquisition looks great next to a write-off and still loses you the run. Declined offers never come back — but neither does the outlier you cashed out early.",
      },
    ],
  },
];

export function CampaignTips() {
  return (
    <details className="group mt-8 rounded-2xl border-2 border-slate-900/10 bg-white shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
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
