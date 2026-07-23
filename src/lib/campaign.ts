import { generateRandomStartup } from "@/lib/random-startup";
import { DEFAULT_ODDS, type SimCompanyState, type YearOdds } from "@/lib/simulate";

// Campaign mode: a 10-year fund with dealt pitches, forced decisions, and
// market swings. Everything here is pure — the server actions in
// src/app/play/actions.ts do the database work.

export const GAME_YEARS = 10;
export const DEALS_PER_YEAR = 4;

export type Market = "bull" | "normal" | "bear";

export const MARKET_LABELS: Record<Market, string> = {
  bull: "🐂 Bull market — prices are up and everyone is raising",
  normal: "😐 Normal market",
  bear: "🐻 Bear market — valuations down, weak companies dying",
};

// Each pitch card shows a few of these. The weights are the game's hidden
// truth: signals nudge the company's quality score, which tilts every later
// roll. The player never sees weights or quality — only outcomes, run after
// run, until the pattern sinks in.
type Signal = { text: string; weight: number };

export const SIGNALS: readonly Signal[] = [
  { text: "Founders sold their last startup for nine figures", weight: 0.25 },
  { text: "Revenue tripled over the last 12 months", weight: 0.25 },
  { text: "Customers arrived organically — zero ad spend so far", weight: 0.2 },
  { text: "Waitlist has grown 40% month over month", weight: 0.15 },
  { text: "A top-tier fund is co-investing in this round", weight: 0.15 },
  { text: "The team ships product updates weekly", weight: 0.1 },
  { text: "Featured in a big tech publication last month", weight: 0.05 },
  { text: "Based in a second-tier startup hub", weight: 0 },
  { text: "Product is still pre-launch", weight: -0.05 },
  { text: "Growth is entirely from paid ads", weight: -0.15 },
  { text: "Crowded market with well-funded competitors", weight: -0.15 },
  { text: "A single customer is 80% of revenue", weight: -0.2 },
  { text: "Under 8 months of runway at the current burn", weight: -0.2 },
  { text: "The CEO is on their third pivot in two years", weight: -0.2 },
  { text: "The two co-founders disagree about direction", weight: -0.25 },
] as const;

const SIGNALS_PER_DEAL = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export type GeneratedDeal = {
  name: string;
  sector: string;
  stage: string;
  raised: number;
  postMoney: number;
  signals: string[]; // what the pitch card shows
  quality: number; // hidden -1..1
};

// Deal a pitch: plausible pricing from the free-play generator, plus signals
// whose weights (noisily) set the hidden quality. The noise matters — a
// great-looking pitch can still be a dud, just less often.
export function generateDeal(): GeneratedDeal {
  const base = generateRandomStartup();

  const pool = [...SIGNALS];
  const drawn: Signal[] = [];
  for (let i = 0; i < SIGNALS_PER_DEAL; i++) {
    drawn.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  const signalSum = drawn.reduce((sum, s) => sum + s.weight, 0);
  const noise = (Math.random() * 2 - 1) * 0.35;
  const quality = clamp(signalSum + noise, -1, 1);

  return {
    name: base.companyName,
    sector: base.sector,
    stage: base.stage,
    raised: base.raised,
    postMoney: base.postMoneyValuation,
    signals: drawn.map((s) => s.text),
    quality,
  };
}

// 25% bull, 50% normal, 25% bear.
export function rollMarket(): Market {
  const roll = Math.random();
  if (roll < 0.25) return "bull";
  if (roll < 0.75) return "normal";
  return "bear";
}

// Tilt the default year odds by company quality (-1..1) and the market.
// Good companies die less, raise more, and price higher; bear markets do the
// opposite to everyone at once.
export function campaignOdds(quality: number, market: Market): YearOdds {
  const marketShift = {
    bull: { die: -0.03, raise: 0.1, exit: 0.05, down: -0.1, scale: 1.35 },
    normal: { die: 0, raise: 0, exit: 0, down: 0, scale: 1 },
    bear: { die: 0.08, raise: -0.15, exit: -0.05, down: 0.3, scale: 0.65 },
  }[market];

  return {
    pDie: clamp(DEFAULT_ODDS.pDie - 0.12 * quality + marketShift.die, 0.02, 0.45),
    pExit: clamp(DEFAULT_ODDS.pExit + 0.05 * quality + marketShift.exit, 0.02, 0.3),
    pRaise: clamp(DEFAULT_ODDS.pRaise + 0.15 * quality + marketShift.raise, 0.1, 0.75),
    downRoundChance: clamp(
      DEFAULT_ODDS.downRoundChance - 0.15 * quality + marketShift.down,
      0.05,
      0.8
    ),
    homeRunChance: clamp(DEFAULT_ODDS.homeRunChance + 0.2 * quality, 0.1, 0.7),
    valuationScale: marketShift.scale,
  };
}

// The calendar window for one campaign year (year is 1-based).
export function yearWindow(startedAt: Date | string, year: number) {
  const start = new Date(startedAt);
  start.setFullYear(start.getFullYear() + (year - 1));
  const end = new Date(startedAt);
  end.setFullYear(end.getFullYear() + year);
  return { start, end };
}

// A random date inside a year window, always after `notBefore` (round and
// exit validation both require dates to move forward).
export function dateInWindow(
  window: { start: Date; end: Date },
  notBefore?: Date | string
): string {
  const floor = Math.max(
    window.start.getTime(),
    notBefore ? new Date(notBefore).getTime() + 24 * 60 * 60 * 1000 : 0
  );
  const span = Math.max(window.end.getTime() - floor, 24 * 60 * 60 * 1000);
  return new Date(floor + Math.random() * span).toISOString().slice(0, 10);
}

export type AcquisitionOffer = { offerValue: number; exitDate: string };

// Roughly 1 year in 12 an acquirer comes knocking (more in a bull market).
// The offer anchors to the last round: usually 1.5×–3×, and the player has
// to weigh cash-now against the power law.
export function maybeAcquisitionOffer(
  company: SimCompanyState,
  market: Market,
  window: { start: Date; end: Date }
): AcquisitionOffer | null {
  const chance = market === "bull" ? 0.12 : market === "bear" ? 0.05 : 0.08;
  if (Math.random() >= chance) return null;

  const scale = market === "bull" ? 1.35 : market === "bear" ? 0.65 : 1;
  const offerValue = Math.max(
    Math.round((company.postMoney * (1.5 + Math.random() * 1.5) * scale) / 500_000) *
      500_000,
    500_000
  );
  return {
    offerValue,
    exitDate: dateInWindow(window, company.lastDate),
  };
}

export type BridgeRequest = {
  amount: number; // what they're asking you for
  postMoney: number; // flat-to-down pricing on the bridge
  stage: string; // bridges don't advance the stage
  date: string;
};

// A company that had a quiet year sometimes comes back asking for a bridge
// — a small round at flat-to-down pricing to keep the lights on. Chance is
// higher in a bear market, when other investors have closed their wallets.
export function maybeBridgeRequest(
  company: SimCompanyState,
  market: Market,
  window: { start: Date; end: Date }
): BridgeRequest | null {
  const chance = market === "bear" ? 0.4 : 0.25;
  if (Math.random() >= chance) return null;

  const postMoney = Math.max(
    Math.round((company.postMoney * (0.6 + Math.random() * 0.4)) / 500_000) * 500_000,
    1_000_000
  );
  const amount = clamp(
    Math.round((postMoney * (0.08 + Math.random() * 0.07)) / 50_000) * 50_000,
    100_000,
    postMoney - 500_000
  );
  return {
    amount,
    postMoney,
    stage: company.stage,
    date: dateInWindow(window, company.lastDate),
  };
}

// How much quality shifts when a bridge is funded or refused. Fresh money
// buys runway; a refused struggling company usually doesn't recover.
export const BRIDGE_FUNDED_QUALITY_BOOST = 0.15;
export const BRIDGE_REFUSED_QUALITY_HIT = -0.35;

export type FundGrade = {
  label: string;
  blurb: string;
  tone: "great" | "good" | "ok" | "bad";
};

// Benchmarks are venture-ish: LPs call ~1.85× TVPI median for a fund, 2.5×+
// top quartile, 3.5×+ top decile. Below 1× the fund lost money.
export function gradeFund(tvpi: number | null): FundGrade {
  if (tvpi === null || tvpi < 1) {
    return {
      label: "Bottom quartile",
      blurb:
        "The fund returned less than it deployed. Your LPs would have done better in an index fund — and they'll remember that next time you raise.",
      tone: "bad",
    };
  }
  if (tvpi < 1.85) {
    return {
      label: "Third quartile",
      blurb:
        "Money back plus a little — but below the venture median. LPs take this risk for outliers, not savings-account returns.",
      tone: "ok",
    };
  }
  if (tvpi < 2.5) {
    return {
      label: "Second quartile",
      blurb:
        "A solid fund, around the industry median. Respectable — but you'll need to show a path to outliers to raise Fund II easily.",
      tone: "good",
    };
  }
  if (tvpi < 3.5) {
    return {
      label: "Top quartile",
      blurb:
        "This is the business venture LPs sign up for. Fund II is oversubscribed.",
      tone: "great",
    };
  }
  return {
    label: "Top decile",
    blurb:
      "A legendary vintage. Somewhere in this portfolio you caught a power-law winner and held on. They'll teach this fund in business school.",
    tone: "great",
  };
}
