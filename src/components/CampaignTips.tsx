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
      <summary className="max-btn-outline inline-flex w-fit cursor-pointer select-none list-none items-center gap-2 rounded-full border-4 border-[color:var(--max-yellow)] bg-[#2d1b4e]/60 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[color:var(--max-yellow)] [&::-webkit-details-marker]:hidden">
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
      <div
        className="max-card mt-3 grid gap-4 rounded-2xl p-5 sm:grid-cols-2"
        style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
      >
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
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              {g.heading}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {g.tips.map((t) => (
                <li key={t.lead} className="text-sm leading-relaxed">
                  <span className="font-semibold text-white/90">
                    {t.lead}
                  </span>
                  <span className="text-white/65">
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
