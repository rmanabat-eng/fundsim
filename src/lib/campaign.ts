import { generateRandomStartup } from "@/lib/random-startup";
import { DEFAULT_ODDS, type SimCompanyState, type YearOdds } from "@/lib/simulate";

// Campaign mode: a 10-year fund with dealt pitches, forced decisions, and
// market swings. Everything here is pure — the server actions in
// src/app/play/actions.ts do the database work.

export const GAME_YEARS = 10;
export const DEALS_PER_YEAR = 4;
// Real funds only write first checks during an investment period — after
// that, remaining capital is reserved for the existing portfolio. Years 1-5
// deal fresh pitches; years 6-10 are pure portfolio management.
export const INVESTMENT_PERIOD_YEARS = 5;

export type Market = "bull" | "normal" | "bear";

export const MARKET_LABELS: Record<Market, string> = {
  bull: "🐂 Bull market — prices are up and everyone is raising",
  normal: "😐 Normal market — steady, average pricing and outcomes",
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

// Base per-year chance an acquirer comes knocking, by market — now read as a
// scenario-pool weight (src/lib/scenario-pool.ts) rather than rolled here.
export const ACQUISITION_CHANCE: Record<Market, number> = {
  bull: 0.12,
  normal: 0.08,
  bear: 0.05,
};

// The offer anchors to the last round: usually 1.5×–3×, and the player has
// to weigh cash-now against the power law. Eligibility/odds are decided by
// the scenario pool; this just builds the payload once picked.
export function buildAcquisitionOffer(
  company: SimCompanyState,
  market: Market,
  window: { start: Date; end: Date }
): AcquisitionOffer {
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

// Base per-year chance a quiet company asks for a bridge, by market — read as
// a scenario-pool weight now. Higher in a bear market, when other investors
// have closed their wallets.
export const BRIDGE_CHANCE: Record<Market, number> = {
  bull: 0.25,
  normal: 0.25,
  bear: 0.4,
};

// A small round at flat-to-down pricing to keep the lights on. Eligibility/
// odds are decided by the scenario pool; this just builds the payload.
export function buildBridgeRequest(
  company: SimCompanyState,
  market: Market,
  window: { start: Date; end: Date }
): BridgeRequest {
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

// ---- Founder calls: decisions where the founder asks for your advice ----

export type TermSheetChoice = {
  stage: string;
  raised: number;
  topTierPost: number; // the stronger lead prices lower
  highPricePost: number; // the hype fund flatters today's mark
  date: string;
};

const TERM_SHEET_CHANCE = 0.35;
// The lesson: partner quality compounds, price is one round's vanity. The
// top-tier lead dilutes you more today but tilts every later roll; the high
// price does the opposite.
export const TERM_SHEET_TOP_TIER_QUALITY_BOOST = 0.15;
export const TERM_SHEET_HIGH_PRICE_QUALITY_HIT = -0.12;

function roundTo500k(value: number): number {
  return Math.round(value / 500_000) * 500_000;
}

// Sometimes a company that would have quietly closed its round instead comes
// to you with two competing term sheets and asks which to sign.
export function maybeTermSheet(round: {
  stage: string;
  raised: number;
  postMoney: number;
  date: string;
}): TermSheetChoice | null {
  if (Math.random() >= TERM_SHEET_CHANCE) return null;

  const floor = round.raised + 500_000; // keep every option a sane up-round
  return {
    stage: round.stage,
    raised: round.raised,
    topTierPost: Math.max(roundTo500k(round.postMoney * 0.8), floor),
    highPricePost: Math.max(roundTo500k(round.postMoney * 1.15), floor + 500_000),
    date: round.date,
  };
}

// Base per-year chance a quiet company's founder calls asking to pivot — read
// as a scenario-pool weight now.
export const PIVOT_CHANCE = 0.18;
// Backing a pivot is a high-variance reroll: most fizzle, some find the real
// business. Urging focus is the safe, small win. A founder who pivots without
// your support does it half-hearted.
export const PIVOT_FOCUS_QUALITY_BOOST = 0.05;
export const PIVOT_UNSUPPORTED_QUALITY_HIT = -0.2;
export const PIVOT_BACKED_MIN = -0.15;
export const PIVOT_BACKED_MAX = 0.45;
// A backed pivot widens the range of a company's future rolls; urging focus
// narrows it. Multiplies CompanyDynState.varianceMultiplier.
export const PIVOT_BACKED_VARIANCE_MULT = 1.4;
export const PIVOT_FOCUS_VARIANCE_MULT = 0.8;

// The quality swing of a backed pivot — upside-tilted, but no sure thing.
export function pivotOutcome(): number {
  return PIVOT_BACKED_MIN + Math.random() * (PIVOT_BACKED_MAX - PIVOT_BACKED_MIN);
}

// ---- Exit routes ----
// A company that has grown into real options doesn't just get bought: it can
// go public, sell itself, or let you take money off the table while it carries
// on. The lesson is liquidity vs. upside — and that certainty has a price.

// Base per-year chance a grown-up company's board asks for your vote on an
// exit route — read as a scenario-pool weight now.
export const EXIT_ROUTE_CHANCE = 0.16;
export const EXIT_ROUTE_MIN_POST = 40_000_000; // only grown-up companies have choices
export const SECONDARY_DISCOUNT = 0.75; // buyers of your stake want a bargain

export type ExitRoutePayload = {
  stage: string;
  postMoney: number;
  ipoHigh: number; // if the window is open
  ipoLow: number; // if it prices badly
  ipoPullChance: number; // odds the offering is shelved entirely
  acquisitionOffer: number; // certain, today
  secondaryValuation: number; // implied price for your stake alone
  date: string;
};

export function buildExitRoute(
  company: SimCompanyState,
  market: Market,
  window: { start: Date; end: Date }
): ExitRoutePayload {
  const scale = market === "bull" ? 1.35 : market === "bear" ? 0.7 : 1;
  const post = company.postMoney;
  return {
    stage: company.stage,
    postMoney: post,
    ipoHigh: roundTo500k(post * 3.2 * scale),
    ipoLow: roundTo500k(post * 0.9 * scale),
    ipoPullChance: market === "bear" ? 0.4 : market === "bull" ? 0.1 : 0.22,
    acquisitionOffer: roundTo500k(post * (1.6 + Math.random() * 0.6) * scale),
    secondaryValuation: roundTo500k(post * SECONDARY_DISCOUNT),
    date: dateInWindow(window, company.lastDate),
  };
}

export type IpoResult = { pulled: boolean; valuation: number };

// The IPO is the only route whose outcome isn't known when you choose it.
export function ipoResult(payload: ExitRoutePayload): IpoResult {
  if (Math.random() < payload.ipoPullChance) return { pulled: true, valuation: 0 };
  return {
    pulled: false,
    valuation: payload.ipoLow + Math.random() * (payload.ipoHigh - payload.ipoLow),
  };
}

// ---- Secondary offer on the fund's own stake ----
// Mirrors an acquisition offer, but a buyer wants only YOUR position in a
// winner — the company itself carries on. Trading a capped return now for
// the power-law upside of staying in. Only eligible for grown-up companies
// (gated in the scenario pool), so it competes with exit_route/acquisition
// rather than ever appearing for a seed-stage company.
export const FUND_SECONDARY_CHANCE = 0.06;
export const FUND_SECONDARY_MIN_POST = 100_000_000; // reserved for real winners

export type FundSecondaryOffer = { offerValue: number; exitDate: string };

export function buildFundSecondaryOffer(
  company: SimCompanyState,
  market: Market,
  window: { start: Date; end: Date }
): FundSecondaryOffer {
  const scale = market === "bull" ? 1.35 : market === "bear" ? 0.65 : 1;
  const offerValue = Math.max(
    Math.round(
      (company.postMoney * SECONDARY_DISCOUNT * (2.2 + Math.random() * 1.3) * scale) /
        500_000
    ) * 500_000,
    500_000
  );
  return { offerValue, exitDate: dateInWindow(window, company.lastDate) };
}

// ---- Replacing the founder-CEO ----
// The board wants a professional operator. It usually does steady the company
// — and it costs you with every founder who hears about it.

// Base per-year chance the board raises a CEO vote — read as a scenario-pool
// weight now.
export const CEO_REPLACEMENT_CHANCE = 0.12;
export const CEO_REPLACED_QUALITY_BOOST = 0.18;
export const CEO_KEPT_MIN = -0.08;
export const CEO_KEPT_MAX = 0.22;

// Standing by the founder is the higher-variance answer.
export function founderKeptOutcome(): number {
  return CEO_KEPT_MIN + Math.random() * (CEO_KEPT_MAX - CEO_KEPT_MIN);
}

// ---- Pay-to-play ----
// In a hard down round the insiders write a rule: participate pro-rata or your
// preferred converts to common. This model has no preference stack, so a
// non-participant is instead recapped at a punishing price — same lesson, which
// is that sitting out a pay-to-play is how a stake gets wiped out.

const PAY_TO_PLAY_CHANCE = 0.55; // of the down rounds that qualify
export const PAY_TO_PLAY_RECAP_FACTOR = 0.3;

export type PayToPlayPayload = {
  stage: string;
  raised: number;
  postMoney: number;
  requiredCheck: number; // your pro-rata share of the round
  recapPostMoney: number; // the price your stake converts at if you sit out
  date: string;
};

export function maybePayToPlay(
  round: { stage: string; raised: number; postMoney: number; date: string },
  previousPostMoney: number,
  ownershipPct: number
): PayToPlayPayload | null {
  if (round.postMoney >= previousPostMoney) return null; // only down rounds
  if (Math.random() >= PAY_TO_PLAY_CHANCE) return null;

  const requiredCheck = clamp(
    Math.round(((ownershipPct / 100) * round.raised) / 25_000) * 25_000,
    25_000,
    round.raised
  );
  return {
    stage: round.stage,
    raised: round.raised,
    postMoney: round.postMoney,
    requiredCheck,
    recapPostMoney: Math.max(
      roundTo500k(round.postMoney * PAY_TO_PLAY_RECAP_FACTOR),
      round.raised + 500_000
    ),
    date: round.date,
  };
}

export type ReputationCounts = {
  bridgesFunded: number; // showed up when a founder was drowning
  bridgesRefused: number; // said no — a real answer, founders can live with it
  proRataBacked: number; // answered a follow-on round (a deliberate 0 counts)
  adviceGiven: number; // term sheets and pivots you weighed in on
  decisionsExpired: number; // ghosted a founder waiting on you
  dealsExpired: number; // pitches that never got a yes or a no
  foundersOusted: number; // voted a founder out of their own company
};

export type Reputation = {
  score: number; // 0..100, starts at a neutral 70
  label: string;
  blurb: string;
  tone: "great" | "good" | "ok" | "bad";
};

// Founders talk. What moves your reputation isn't which bets paid off — it's
// how you treated the people asking: wiring when it mattered helps a lot, a
// timely "no" costs almost nothing, and silence costs the most.
export function reputation(c: ReputationCounts): Reputation {
  const score = clamp(
    70 +
      8 * c.bridgesFunded +
      4 * c.proRataBacked +
      3 * c.adviceGiven -
      2 * c.bridgesRefused -
      10 * c.decisionsExpired -
      4 * c.dealsExpired -
      // Ousting a founder is the efficient call and the expensive one: it
      // travels further in founder circles than any single no.
      12 * c.foundersOusted,
    0,
    100
  );

  if (score >= 85) {
    return {
      score,
      label: "Founder favorite",
      blurb:
        "You wired when it mattered and answered every call. The best founders now pitch you first — which is where the next fund's winners come from.",
      tone: "great",
    };
  }
  if (score >= 65) {
    return {
      score,
      label: "Straight shooter",
      blurb:
        "Founders got timely answers, even when the answer was no. They don't love every call you made, but they'd take your money again.",
      tone: "good",
    };
  }
  if (score >= 40) {
    return {
      score,
      label: "Hard to read",
      blurb:
        "Some founders got answers, some got silence. Word spreads — the strongest rounds start going to investors who reliably show up.",
      tone: "ok",
    };
  }
  return {
    score,
    label: "Ghost",
    blurb:
      "Ignored pitches and unanswered calls travel fast in founder group chats. The hot deals stopped inviting you a long time ago.",
    tone: "bad",
  };
}

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

// ---- The year-by-year log ----
// Derived from the portfolio rather than stored: every event already leaves a
// dated trace (a round's date, an exit's date), so replaying them by year
// window can't drift out of sync with the actual data.

export type LogCompany = {
  name: string;
  sector: string;
  exitValue: number | null;
  exitDate: Date | string | null;
  rounds: { date: Date | string }[];
};

// Names aren't unique (the generator can deal the same one twice), so log
// entries carry the sector along rather than being looked up by name later.
export type LogCompanyRef = { name: string; sector: string };

export type CampaignLogEntry = {
  year: number;
  backed: LogCompanyRef[]; // first checks you wrote this year
  raised: LogCompanyRef[]; // portfolio companies that raised again
  exited: (LogCompanyRef & { value: number })[];
  writtenOff: LogCompanyRef[];
};

function inWindow(date: Date | string, w: { start: Date; end: Date }): boolean {
  const t = new Date(date).getTime();
  return t >= w.start.getTime() && t < w.end.getTime();
}

export function campaignLog(
  companies: LogCompany[],
  startedAt: Date | string,
  throughYear: number
): CampaignLogEntry[] {
  const entries: CampaignLogEntry[] = [];

  for (let year = 1; year <= throughYear; year++) {
    const w = yearWindow(startedAt, year);
    const entry: CampaignLogEntry = {
      year,
      backed: [],
      raised: [],
      exited: [],
      writtenOff: [],
    };

    for (const c of companies) {
      const ref: LogCompanyRef = { name: c.name, sector: c.sector };
      const sorted = [...c.rounds].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      sorted.forEach((r, i) => {
        if (!inWindow(r.date, w)) return;
        // The first round is the check that got you in; later ones are the
        // company raising again.
        if (i === 0) entry.backed.push(ref);
        else entry.raised.push(ref);
      });

      if (c.exitValue !== null && c.exitDate && inWindow(c.exitDate, w)) {
        if (c.exitValue === 0) entry.writtenOff.push(ref);
        else entry.exited.push({ ...ref, value: c.exitValue });
      }
    }

    entries.push(entry);
  }

  return entries;
}
