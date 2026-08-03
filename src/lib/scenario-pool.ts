import type { Market } from "@/lib/campaign";

// Weighted event pools keyed off portfolio-company attributes, plus a small
// per-company memory that past decisions write and future weighting reads.
// See CLAUDE campaign notes / PR description for the design writeup.

export type Performance = "up" | "flat" | "down";

export type CompanyAttrs = {
  stage: string;
  sector: string;
  postMoney: number;
  performance: Performance; // derived from the last two rounds' postMoney
};

// Dynamic, per-company chaining state — separate from the static attributes
// above and from `quality` (which still drives the base raise/die/exit odds
// in campaignOdds). Only the scenario pool reads/writes this.
export type CompanyDynState = {
  varianceMultiplier: number; // 1 = normal; widened by a backed pivot, narrowed by urging focus
  bridgesFunded: number;
  bridgesRefused: number;
  removed: boolean; // dropped a bridge and never recovered — out of every future pool
  // How many of this company's asks you've come through on: bridges funded,
  // follow-ons defended, a pivot backed, a top-tier lead signed, a founder
  // kept on as CEO. A reusable "has this relationship earned trust" signal —
  // read by campaign.ts to scale the reputation cost of refusing this
  // company (isEstablishedFounder) and to gate founder referrals
  // (rollsReferral). Only ever incremented; refusing an ask doesn't erase a
  // founder's own history.
  trackRecord: number;
};

export const DEFAULT_DYN_STATE: CompanyDynState = {
  varianceMultiplier: 1,
  bridgesFunded: 0,
  bridgesRefused: 0,
  removed: false,
  trackRecord: 0,
};

export function parseDynState(raw: string): CompanyDynState {
  try {
    return { ...DEFAULT_DYN_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DYN_STATE };
  }
}

export function serializeDynState(state: CompanyDynState): string {
  return JSON.stringify(state);
}

// "Up" needs a >5% markup and "down" a >5% cut so noise near flat pricing
// doesn't flip the label year to year.
export function derivePerformance(rounds: { postMoney: number }[]): Performance {
  if (rounds.length < 2) return "flat";
  const prev = rounds[rounds.length - 2].postMoney;
  const latest = rounds[rounds.length - 1].postMoney;
  if (latest > prev * 1.05) return "up";
  if (latest < prev * 0.95) return "down";
  return "flat";
}

export type ScenarioCtx = {
  company: CompanyAttrs;
  state: CompanyDynState;
  market: Market;
  macroShock: boolean; // this-year-only reweight toward distress
};

export type ScenarioDef = {
  type: string;
  // Hard gate: attribute/state combinations that can never fire this scenario
  // (a seed company can't trigger a Series B secondary).
  eligible: (ctx: ScenarioCtx) => boolean;
  // Relative odds among eligible scenarios for this company-year. Read
  // alongside a "nothing happens" weight, so higher numbers make an event
  // more likely without guaranteeing one fires at all.
  weight: (ctx: ScenarioCtx) => number;
};

// Picks at most one scenario for a company-year: draws from the eligible,
// positively-weighted defs plus an implicit "quiet" slice. Pure function of
// its inputs, so it's the same call whether one company or the whole
// portfolio is rolled per year.
export function pickScenario(
  defs: ScenarioDef[],
  ctx: ScenarioCtx,
  quietWeight: number
): ScenarioDef | null {
  const pool = defs
    .filter((d) => d.eligible(ctx))
    .map((d) => ({ def: d, weight: Math.max(d.weight(ctx), 0) }))
    .filter((p) => p.weight > 0);

  const total = pool.reduce((sum, p) => sum + p.weight, quietWeight);
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const p of pool) {
    if (roll < p.weight) return p.def;
    roll -= p.weight;
  }
  return null; // landed on the quiet slice
}
