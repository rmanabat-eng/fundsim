"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { STAGES } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { rollYearEvent } from "@/lib/simulate";
import { exitProceeds, formatDollars, ownershipAfterRounds } from "@/lib/fund-math";
import {
  ACQUISITION_CHANCE,
  BRIDGE_CHANCE,
  BRIDGE_FUNDED_QUALITY_BOOST,
  BRIDGE_REFUSED_QUALITY_HIT,
  CEO_REPLACED_QUALITY_BOOST,
  CEO_REPLACEMENT_CHANCE,
  DEALS_PER_YEAR,
  EXIT_ROUTE_CHANCE,
  EXIT_ROUTE_MIN_POST,
  FUND_SECONDARY_CHANCE,
  FUND_SECONDARY_MIN_POST,
  GAME_YEARS,
  INVESTMENT_PERIOD_YEARS,
  PIVOT_BACKED_VARIANCE_MULT,
  PIVOT_CHANCE,
  PIVOT_FOCUS_QUALITY_BOOST,
  PIVOT_FOCUS_VARIANCE_MULT,
  PIVOT_UNSUPPORTED_QUALITY_HIT,
  TERM_SHEET_HIGH_PRICE_QUALITY_HIT,
  TERM_SHEET_TOP_TIER_QUALITY_BOOST,
  campaignOdds,
  dateInWindow,
  generateDeal,
  founderKeptOutcome,
  ipoResult,
  buildAcquisitionOffer,
  buildBridgeRequest,
  buildExitRoute,
  buildFundSecondaryOffer,
  maybePayToPlay,
  maybeTermSheet,
  pivotOutcome,
  rollMarket,
  yearWindow,
  type ExitRoutePayload,
  type FundSecondaryOffer,
  type Market,
  type PayToPlayPayload,
} from "@/lib/campaign";
import {
  derivePerformance,
  parseDynState,
  pickScenario,
  serializeDynState,
  type CompanyDynState,
  type ScenarioDef,
} from "@/lib/scenario-pool";

export type FormState = { error: string } | null;

// Decision payloads, by type. Stored as JSON strings on the Decision row.
export type ProRataPayload = {
  roundId: string;
  stage: string;
  raised: number;
  postMoney: number;
};
export type AcquisitionPayload = { offerValue: number; exitDate: string };
export type BridgePayload = {
  amount: number;
  postMoney: number;
  stage: string;
  date: string;
};
export type FundSecondaryPayload = FundSecondaryOffer;
// Two competing term sheets the founder asks you to pick between.
export type TermSheetPayload = {
  stage: string;
  raised: number;
  topTierPost: number;
  highPricePost: number;
  date: string;
};
// A pivot request carries no numbers — the whole decision is a judgment call.
export type PivotPayload = Record<string, never>;
// Nor does the board's move on a founder-CEO.
export type CeoReplacementPayload = Record<string, never>;
// ExitRoutePayload and PayToPlayPayload live in @/lib/campaign — a "use server"
// module can only export async functions, so they aren't re-exported here.

// ---- Scenario pools ----
// Two pools per company-year: which "quiet year" decision fires (bridge,
// pivot, ceo vote), and which "offer" fires (exit route, acquisition, fund
// secondary). Eligibility gates on stage/postMoney/performance so, e.g., a
// seed company never draws a Series B secondary; weight starts from the old
// flat per-year chance and is nudged by market, performance, and the
// company's chaining state (CompanyDynState).

const QUIET_POOL: ScenarioDef[] = [
  {
    type: "bridge",
    eligible: (ctx) => !ctx.state.removed,
    weight: (ctx) =>
      (BRIDGE_CHANCE[ctx.market] + (ctx.macroShock ? 0.15 : 0)) *
      (ctx.company.performance === "down" ? 1.5 : 1) *
      ctx.state.varianceMultiplier *
      100,
  },
  {
    type: "pivot",
    eligible: (ctx) => !ctx.state.removed,
    weight: (ctx) => PIVOT_CHANCE * (ctx.company.performance === "down" ? 1.3 : 1) * 100,
  },
  {
    type: "ceo_replacement",
    eligible: (ctx) =>
      !ctx.state.removed && ctx.company.stage !== "PRE_SEED" && ctx.company.stage !== "SEED",
    weight: () => CEO_REPLACEMENT_CHANCE * 100,
  },
];

const OFFER_POOL: ScenarioDef[] = [
  {
    type: "fund_secondary",
    eligible: (ctx) =>
      !ctx.state.removed && ctx.company.postMoney >= FUND_SECONDARY_MIN_POST,
    weight: (ctx) =>
      FUND_SECONDARY_CHANCE * (ctx.macroShock ? 0.5 : 1) * ctx.state.varianceMultiplier * 100,
  },
  {
    type: "exit_route",
    eligible: (ctx) =>
      !ctx.state.removed && ctx.company.postMoney >= EXIT_ROUTE_MIN_POST,
    weight: (ctx) =>
      EXIT_ROUTE_CHANCE * (ctx.macroShock ? 0.6 : 1) * ctx.state.varianceMultiplier * 100,
  },
  {
    type: "acquisition",
    eligible: (ctx) => !ctx.state.removed,
    weight: (ctx) =>
      ACQUISITION_CHANCE[ctx.market] *
      (ctx.macroShock ? 0.6 : 1) *
      ctx.state.varianceMultiplier *
      100,
  },
];

async function deployed(): Promise<number> {
  const rounds = await prisma.round.findMany({ select: { yourCheck: true } });
  return rounds.reduce((sum, r) => sum + r.yourCheck, 0);
}

async function remainingCapital(): Promise<number> {
  const settings = await getSettings();
  return settings.fundSize - (await deployed());
}

function clampQuality(q: number): number {
  return Math.min(Math.max(q, -1), 1);
}

async function updateDynState(
  companyId: string,
  raw: string,
  patch: Partial<CompanyDynState>
) {
  const next: CompanyDynState = { ...parseDynState(raw), ...patch };
  await prisma.company.update({
    where: { id: companyId },
    data: { scenarioState: serializeDynState(next) },
  });
}

async function dealFlow(year: number) {
  for (let i = 0; i < DEALS_PER_YEAR; i++) {
    const deal = generateDeal();
    await prisma.deal.create({
      data: {
        year,
        name: deal.name,
        sector: deal.sector,
        stage: deal.stage as (typeof STAGES)[number],
        raised: deal.raised,
        postMoney: deal.postMoney,
        description: deal.description,
        signals: JSON.stringify(deal.signals),
        quality: deal.quality,
      },
    });
  }
}

// Wipes the portfolio and starts a fresh 10-year fund at year 1.
export async function startCampaign() {
  await prisma.company.deleteMany(); // cascades rounds and decisions
  await prisma.deal.deleteMany();
  await prisma.game.deleteMany();

  await prisma.game.create({ data: { id: 1, market: rollMarket() } });
  await dealFlow(1);

  revalidatePath("/play");
  revalidatePath("/");
}

export async function investInDeal(
  dealId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const [game, deal, settings] = await Promise.all([
    prisma.game.findUnique({ where: { id: 1 } }),
    prisma.deal.findUnique({ where: { id: dealId } }),
    getSettings(),
  ]);
  if (!game || game.status !== "active") return { error: "No active campaign." };
  if (!deal || deal.status !== "open") return { error: "This deal is gone." };

  const check = Number(formData.get("check"));
  if (!Number.isFinite(check) || check <= 0)
    return { error: "Your check must be greater than 0." };
  if (check > deal.raised)
    return { error: "Your check can't exceed the round's total raised." };

  const remaining = await remainingCapital();
  if (check > remaining)
    return {
      error: `Only ${formatDollars(remaining)} left to deploy.`,
    };
  const companyCount = await prisma.company.count();
  if (companyCount >= settings.maxCompanies)
    return { error: `Maximum of ${settings.maxCompanies} companies reached.` };

  const window = yearWindow(game.startedAt, game.year);
  await prisma.company.create({
    data: {
      name: deal.name,
      sector: deal.sector,
      quality: deal.quality,
      dealId, // link back to the pitch so this first check can be undone
      rounds: {
        create: {
          stage: deal.stage,
          date: new Date(dateInWindow(window)),
          raised: deal.raised,
          postMoney: deal.postMoney,
          yourCheck: check,
        },
      },
    },
  });
  await prisma.deal.update({ where: { id: dealId }, data: { status: "invested" } });

  revalidatePath("/play");
  revalidatePath("/");
  return null;
}

// Reverse a first check made this year: delete the company (its round cascades)
// and put the pitch back in the deck. Only current-year, un-exited investments
// straight from a deal qualify — follow-ons and decisions aren't undoable here.
export async function undoInvestment(companyId: string) {
  const [company, game] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, include: { deal: true } }),
    prisma.game.findUnique({ where: { id: 1 } }),
  ]);
  if (!company || !company.deal || !game) return;
  if (game.status !== "active") return;
  if (company.deal.year !== game.year) return; // only this year's checks
  if (company.exitValue !== null) return;

  await prisma.deal.update({
    where: { id: company.deal.id },
    data: { status: "open" },
  });
  await prisma.company.delete({ where: { id: companyId } });

  revalidatePath("/play");
  revalidatePath("/");
}

export async function passDeal(dealId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { status: "passed" } });
  revalidatePath("/play");
}

// Sets your check on the already-created round. check = 0 means sitting the
// round out on purpose (still resolves the decision).
export async function fundProRata(
  decisionId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending" || decision.type !== "pro_rata")
    return { error: "This decision is gone." };
  if (decision.company.exitValue !== null)
    return { error: "This company has exited — its cap table is frozen." };
  const payload: ProRataPayload = JSON.parse(decision.payload);

  const check = Number(formData.get("check"));
  if (!Number.isFinite(check) || check < 0)
    return { error: "Your check can't be negative." };
  if (check > payload.raised)
    return { error: "Your check can't exceed the round's total raised." };
  const remaining = await remainingCapital();
  if (check > remaining)
    return { error: `Only ${formatDollars(remaining)} left to deploy.` };

  if (check > 0) {
    await prisma.round.update({
      where: { id: payload.roundId },
      data: { yourCheck: check },
    });
  }
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });

  revalidatePath("/play");
  revalidatePath("/");
  return null;
}

export async function acceptAcquisition(decisionId: string) {
  const decision = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (!decision || decision.status !== "pending" || decision.type !== "acquisition")
    return;
  const payload: AcquisitionPayload = JSON.parse(decision.payload);

  await prisma.company.update({
    where: { id: decision.companyId },
    data: { exitValue: payload.offerValue, exitDate: new Date(payload.exitDate) },
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  // The exit freezes the cap table, so any other decision about this company
  // (a pro-rata, a bridge, a founder call) is moot — clear it off the desk.
  // "moot" is its own status so it neither costs reputation like "expired"
  // nor earns it like "resolved".
  await prisma.decision.updateMany({
    where: { companyId: decision.companyId, status: "pending" },
    data: { status: "moot" },
  });
  revalidatePath("/play");
  revalidatePath("/");
}

// A buyer wants only your stake in a winner — capped return now, no more
// power-law upside on this one. The company itself is untouched, so unlike
// acquisition/exit_route this doesn't close out the company or its rounds.
export async function acceptFundSecondary(decisionId: string) {
  const decision = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (!decision || decision.status !== "pending" || decision.type !== "fund_secondary")
    return;
  const payload: FundSecondaryPayload = JSON.parse(decision.payload);

  await prisma.company.update({
    where: { id: decision.companyId },
    data: { exitValue: payload.offerValue, exitDate: new Date(payload.exitDate) },
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  await prisma.decision.updateMany({
    where: { companyId: decision.companyId, status: "pending" },
    data: { status: "moot" },
  });
  revalidatePath("/play");
  revalidatePath("/");
}

export async function fundBridge(decisionId: string): Promise<FormState> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending" || decision.type !== "bridge")
    return { error: "This decision is gone." };
  if (decision.company.exitValue !== null)
    return { error: "This company has exited — its cap table is frozen." };
  const payload: BridgePayload = JSON.parse(decision.payload);

  const remaining = await remainingCapital();
  if (payload.amount > remaining)
    return { error: `Only ${formatDollars(remaining)} left to deploy.` };

  await prisma.round.create({
    data: {
      companyId: decision.companyId,
      stage: payload.stage as (typeof STAGES)[number],
      date: new Date(payload.date),
      raised: payload.amount,
      postMoney: payload.postMoney,
      yourCheck: payload.amount,
    },
  });
  await prisma.company.update({
    where: { id: decision.companyId },
    data: {
      quality: clampQuality(decision.company.quality + BRIDGE_FUNDED_QUALITY_BOOST),
    },
  });
  const dynState = parseDynState(decision.company.scenarioState);
  await updateDynState(decision.companyId, decision.company.scenarioState, {
    bridgesFunded: dynState.bridgesFunded + 1,
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  revalidatePath("/play");
  revalidatePath("/");
  return null;
}

// Decline any pending decision. Refusing a bridge leaves the company
// struggling and unfunded — its quality takes a hit. Recorded as "declined"
// (not "resolved") so the end-of-fund reputation can tell a deliberate no
// apart from money wired. A struggling company that doesn't recover (quality
// stays deep negative after the hit) is dropped from every future scenario
// pool — it's done asking.
export async function declineDecision(decisionId: string) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending") return;

  if (decision.type === "bridge") {
    const nextQuality = clampQuality(
      decision.company.quality + BRIDGE_REFUSED_QUALITY_HIT
    );
    await prisma.company.update({
      where: { id: decision.companyId },
      data: { quality: nextQuality },
    });
    const dynState = parseDynState(decision.company.scenarioState);
    await updateDynState(decision.companyId, decision.company.scenarioState, {
      bridgesRefused: dynState.bridgesRefused + 1,
      removed: dynState.removed || nextQuality < -0.5,
    });
  }
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "declined" },
  });
  revalidatePath("/play");
}

// The founder signs whichever term sheet you recommend. The top-tier lead
// prices lower (more dilution for you) but strengthens the company; the high
// price flatters today's mark and weakens every later roll.
export async function resolveTermSheet(
  decisionId: string,
  choice: "top_tier" | "high_price"
) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending" || decision.type !== "term_sheet")
    return;
  if (decision.company.exitValue !== null) return;
  const payload: TermSheetPayload = JSON.parse(decision.payload);

  await prisma.round.create({
    data: {
      companyId: decision.companyId,
      stage: payload.stage as (typeof STAGES)[number],
      date: new Date(payload.date),
      raised: payload.raised,
      postMoney: choice === "top_tier" ? payload.topTierPost : payload.highPricePost,
      yourCheck: 0,
    },
  });
  await prisma.company.update({
    where: { id: decision.companyId },
    data: {
      quality: clampQuality(
        decision.company.quality +
          (choice === "top_tier"
            ? TERM_SHEET_TOP_TIER_QUALITY_BOOST
            : TERM_SHEET_HIGH_PRICE_QUALITY_HIT)
      ),
    },
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  revalidatePath("/play");
  revalidatePath("/");
}

// Bless the pivot (a high-variance quality reroll) or urge focus (a small,
// safe boost). Either way the founder got an answer.
export async function resolvePivot(decisionId: string, choice: "back" | "focus") {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending" || decision.type !== "pivot") return;
  if (decision.company.exitValue !== null) return;

  await prisma.company.update({
    where: { id: decision.companyId },
    data: {
      quality: clampQuality(
        decision.company.quality +
          (choice === "back" ? pivotOutcome() : PIVOT_FOCUS_QUALITY_BOOST)
      ),
    },
  });
  const dynState = parseDynState(decision.company.scenarioState);
  await updateDynState(decision.companyId, decision.company.scenarioState, {
    varianceMultiplier:
      dynState.varianceMultiplier *
      (choice === "back" ? PIVOT_BACKED_VARIANCE_MULT : PIVOT_FOCUS_VARIANCE_MULT),
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  revalidatePath("/play");
  revalidatePath("/");
}

// ---- Exit route: go public, sell the company, or sell your stake ----
// Any of them closes your position. An IPO or sale exits the company outright;
// a secondary sells only your slice — the company carries on without you, which
// this model records the same way, since it only ever tracks your position.
export async function resolveExitRoute(
  decisionId: string,
  choice: "ipo" | "acquire" | "secondary"
): Promise<FormState> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending" || decision.type !== "exit_route")
    return { error: "This decision is gone." };
  if (decision.company.exitValue !== null)
    return { error: "This company has exited — its cap table is frozen." };
  const payload: ExitRoutePayload = JSON.parse(decision.payload);

  let exitValue: number;
  if (choice === "ipo") {
    const result = ipoResult(payload);
    if (result.pulled) {
      // The window shut before it priced. No exit, and the scramble leaves a mark.
      await prisma.company.update({
        where: { id: decision.companyId },
        data: { quality: clampQuality(decision.company.quality - 0.1) },
      });
      await prisma.decision.update({
        where: { id: decisionId },
        data: { status: "resolved" },
      });
      revalidatePath("/play");
      revalidatePath("/");
      return { error: "The IPO was pulled — the window shut before it priced." };
    }
    exitValue = Math.round(result.valuation);
  } else if (choice === "acquire") {
    exitValue = payload.acquisitionOffer;
  } else {
    exitValue = payload.secondaryValuation;
  }

  await prisma.company.update({
    where: { id: decision.companyId },
    data: { exitValue, exitDate: new Date(payload.date) },
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  // The position is closed, so anything else pending on this company is moot.
  await prisma.decision.updateMany({
    where: { companyId: decision.companyId, status: "pending" },
    data: { status: "moot" },
  });
  revalidatePath("/play");
  revalidatePath("/");
  return null;
}

// ---- Replacing the founder-CEO ----
// The operator steadies the company; backing the founder is the higher-variance
// answer. Only one of them costs you with founders.
export async function resolveCeoReplacement(
  decisionId: string,
  choice: "replace" | "keep"
) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (
    !decision ||
    decision.status !== "pending" ||
    decision.type !== "ceo_replacement"
  )
    return;
  if (decision.company.exitValue !== null) return;

  await prisma.company.update({
    where: { id: decision.companyId },
    data: {
      quality: clampQuality(
        decision.company.quality +
          (choice === "replace" ? CEO_REPLACED_QUALITY_BOOST : founderKeptOutcome())
      ),
    },
  });
  // "ousted" is its own status so reputation can price it apart from simply
  // having answered the founder.
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: choice === "replace" ? "ousted" : "resolved" },
  });
  revalidatePath("/play");
  revalidatePath("/");
}

// ---- Pay-to-play ----
// Participate and you take the down round like everyone else. Sit out and your
// stake converts at a punishing recap price — this model's stand-in for
// preferred converting to common.
export async function resolvePayToPlay(
  decisionId: string,
  choice: "pay" | "decline"
): Promise<FormState> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending" || decision.type !== "pay_to_play")
    return { error: "This decision is gone." };
  if (decision.company.exitValue !== null)
    return { error: "This company has exited — its cap table is frozen." };
  const payload: PayToPlayPayload = JSON.parse(decision.payload);

  if (choice === "pay") {
    const remaining = await remainingCapital();
    if (payload.requiredCheck > remaining)
      return { error: `Only ${formatDollars(remaining)} left to deploy.` };
  }

  await prisma.round.create({
    data: {
      companyId: decision.companyId,
      stage: payload.stage as (typeof STAGES)[number],
      date: new Date(payload.date),
      raised: payload.raised,
      postMoney: choice === "pay" ? payload.postMoney : payload.recapPostMoney,
      yourCheck: choice === "pay" ? payload.requiredCheck : 0,
    },
  });
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: choice === "pay" ? "resolved" : "declined" },
  });
  revalidatePath("/play");
  revalidatePath("/");
  return null;
}

export type YearSummary = {
  year: number; // the year just entered (or GAME_YEARS+... when closed)
  market: Market;
  closed: boolean; // true when the fund just ended
  expiredDeals: number;
  expiredDecisions: number;
  raised: number;
  exited: number;
  writtenOff: number;
  quiet: number;
  distributions: number;
  newDecisions: number;
  macroShock: boolean; // this year's whole portfolio was reweighted toward distress
  reservesScarce: boolean; // this year's fresh asks outrun what's left to deploy
};

// A macro shock hits ~1 year in 10 and temporarily reweights every company's
// scenario pool toward distress (more bridges/down offers, fewer clean exits)
// for that year only — it isn't its own decision, just a portfolio-wide mood.
const MACRO_SHOCK_CHANCE = 0.1;

// The turn crank. Expires anything left on the table (that's the deadline
// pressure), rolls a year of quality-weighted events across the portfolio,
// deals next year's pitches, and creates the new decisions. At year 10 it
// closes the fund instead.
export async function advanceYear(): Promise<YearSummary | null> {
  const game = await prisma.game.findUnique({ where: { id: 1 } });
  if (!game || game.status !== "active") return null;

  // Anything you didn't act on is gone. Unanswered bridges count as refusals.
  const expiredDeals = await prisma.deal.updateMany({
    where: { status: "open" },
    data: { status: "expired" },
  });
  const pendingDecisions = await prisma.decision.findMany({
    where: { status: "pending" },
    include: { company: true },
  });
  for (const d of pendingDecisions) {
    if (d.type === "bridge") {
      await prisma.company.update({
        where: { id: d.companyId },
        data: {
          quality: clampQuality(d.company.quality + BRIDGE_REFUSED_QUALITY_HIT),
        },
      });
    } else if (d.type === "pivot") {
      // Ignored, the founder pivots anyway — half-hearted, without your help.
      await prisma.company.update({
        where: { id: d.companyId },
        data: {
          quality: clampQuality(d.company.quality + PIVOT_UNSUPPORTED_QUALITY_HIT),
        },
      });
    } else if (d.type === "term_sheet") {
      // No answer from you, so the founder signs the flattering price alone.
      const payload: TermSheetPayload = JSON.parse(d.payload);
      await prisma.round.create({
        data: {
          companyId: d.companyId,
          stage: payload.stage as (typeof STAGES)[number],
          date: new Date(payload.date),
          raised: payload.raised,
          postMoney: payload.highPricePost,
          yourCheck: 0,
        },
      });
      await prisma.company.update({
        where: { id: d.companyId },
        data: {
          quality: clampQuality(d.company.quality + TERM_SHEET_HIGH_PRICE_QUALITY_HIT),
        },
      });
    }
    await prisma.decision.update({ where: { id: d.id }, data: { status: "expired" } });
  }

  if (game.year >= GAME_YEARS) {
    await prisma.game.update({ where: { id: 1 }, data: { status: "ended" } });
    revalidatePath("/play");
    revalidatePath("/");
    return {
      year: game.year,
      market: game.market as Market,
      closed: true,
      expiredDeals: expiredDeals.count,
      expiredDecisions: pendingDecisions.length,
      raised: 0,
      exited: 0,
      writtenOff: 0,
      quiet: 0,
      distributions: 0,
      newDecisions: 0,
      macroShock: false,
      reservesScarce: false,
    };
  }

  const year = game.year + 1;
  const market = rollMarket();
  const macroShock = Math.random() < MACRO_SHOCK_CHANCE;
  const window = yearWindow(game.startedAt, year);

  const summary: YearSummary = {
    year,
    market,
    closed: false,
    expiredDeals: expiredDeals.count,
    expiredDecisions: pendingDecisions.length,
    raised: 0,
    exited: 0,
    writtenOff: 0,
    quiet: 0,
    distributions: 0,
    newDecisions: 0,
    macroShock,
    reservesScarce: false,
  };

  const companies = await prisma.company.findMany({
    include: { rounds: { orderBy: { date: "asc" } } },
  });

  // Sum of this year's fixed-amount follow-on asks (bridges, pay-to-play
  // checks) — feeds the reserves-scarcity flag below.
  let pendingAsks = 0;

  for (const company of companies) {
    if (company.exitValue !== null || company.rounds.length === 0) continue;
    const latest = company.rounds[company.rounds.length - 1];
    const state = {
      stage: latest.stage,
      postMoney: latest.postMoney,
      lastDate: latest.date,
    };
    const event = rollYearEvent(
      state,
      window.start,
      campaignOdds(company.quality, market)
    );

    if (event.kind === "round") {
      // Sometimes the round arrives as two competing term sheets instead of a
      // done deal — the founder wants your call before anything is signed.
      const sheet = maybeTermSheet(event);
      if (sheet) {
        await prisma.decision.create({
          data: {
            year,
            type: "term_sheet",
            companyId: company.id,
            payload: JSON.stringify(sheet satisfies TermSheetPayload),
          },
        });
        summary.newDecisions++;
        continue; // nothing is signed yet — no round, no offers
      }
      // A hard down round is where insiders impose pay-to-play. The round
      // isn't booked yet — its terms depend on whether you participate.
      const payToPlay = maybePayToPlay(
        event,
        latest.postMoney,
        ownershipAfterRounds(company.rounds)
      );
      if (payToPlay) {
        await prisma.decision.create({
          data: {
            year,
            type: "pay_to_play",
            companyId: company.id,
            payload: JSON.stringify(payToPlay satisfies PayToPlayPayload),
          },
        });
        summary.newDecisions++;
        pendingAsks += payToPlay.requiredCheck;
        continue;
      }
      const round = await prisma.round.create({
        data: {
          companyId: company.id,
          stage: event.stage as (typeof STAGES)[number],
          date: new Date(event.date),
          raised: event.raised,
          postMoney: event.postMoney,
          yourCheck: 0,
        },
      });
      const payload: ProRataPayload = {
        roundId: round.id,
        stage: event.stage,
        raised: event.raised,
        postMoney: event.postMoney,
      };
      await prisma.decision.create({
        data: {
          year,
          type: "pro_rata",
          companyId: company.id,
          payload: JSON.stringify(payload),
        },
      });
      summary.raised++;
      summary.newDecisions++;
    } else if (event.kind === "exit" || event.kind === "writeOff") {
      const exitValue = event.kind === "exit" ? event.exitValue : 0;
      await prisma.company.update({
        where: { id: company.id },
        data: { exitValue, exitDate: new Date(event.exitDate) },
      });
      if (event.kind === "exit") {
        summary.exited++;
        summary.distributions += exitProceeds(company.rounds, exitValue);
      } else {
        summary.writtenOff++;
      }
      continue; // exited companies get no offers
    } else {
      summary.quiet++;
      const dynState = parseDynState(company.scenarioState);
      const ctx = {
        company: {
          stage: state.stage,
          sector: company.sector,
          postMoney: state.postMoney,
          performance: derivePerformance(company.rounds),
        },
        state: dynState,
        market,
        macroShock,
      };
      const picked = pickScenario(QUIET_POOL, ctx, 100);

      if (picked?.type === "bridge") {
        const bridge = buildBridgeRequest(state, market, window);
        await prisma.decision.create({
          data: {
            year,
            type: "bridge",
            companyId: company.id,
            payload: JSON.stringify(bridge satisfies BridgePayload),
          },
        });
        summary.newDecisions++;
        pendingAsks += bridge.amount;
        continue; // a company asking for a bridge isn't fielding acquirers
      }
      if (picked?.type === "pivot") {
        await prisma.decision.create({
          data: {
            year,
            type: "pivot",
            companyId: company.id,
            payload: JSON.stringify({} satisfies PivotPayload),
          },
        });
        summary.newDecisions++;
        continue; // a founder mid-soul-search isn't fielding acquirers either
      }
      if (picked?.type === "ceo_replacement") {
        await prisma.decision.create({
          data: {
            year,
            type: "ceo_replacement",
            companyId: company.id,
            payload: JSON.stringify({} satisfies CeoReplacementPayload),
          },
        });
        summary.newDecisions++;
        continue; // a company mid-succession isn't fielding acquirers either
      }
    }

    // Anchor any offer to the latest state — including a round created just
    // above — so the offer prices off (and postdates) the newest round.
    const anchored =
      event.kind === "round"
        ? { stage: event.stage, postMoney: event.postMoney, lastDate: event.date }
        : state;

    const offerCtx = {
      company: {
        stage: anchored.stage,
        sector: company.sector,
        postMoney: anchored.postMoney,
        performance: derivePerformance(company.rounds),
      },
      state: parseDynState(company.scenarioState),
      market,
      macroShock,
    };
    const offerPick = pickScenario(OFFER_POOL, offerCtx, 100);

    // A company that has grown up doesn't just get bought — it can go public,
    // sell, or let you take money off the table. That supersedes a plain offer.
    if (offerPick?.type === "exit_route") {
      const route = buildExitRoute(anchored, market, window);
      await prisma.decision.create({
        data: {
          year,
          type: "exit_route",
          companyId: company.id,
          payload: JSON.stringify(route satisfies ExitRoutePayload),
        },
      });
      summary.newDecisions++;
      continue;
    }

    // Or a buyer wants only the fund's stake in a winner, not the company.
    if (offerPick?.type === "fund_secondary") {
      const secondary = buildFundSecondaryOffer(anchored, market, window);
      await prisma.decision.create({
        data: {
          year,
          type: "fund_secondary",
          companyId: company.id,
          payload: JSON.stringify(secondary satisfies FundSecondaryPayload),
        },
      });
      summary.newDecisions++;
      continue;
    }

    if (offerPick?.type === "acquisition") {
      const offer = buildAcquisitionOffer(anchored, market, window);
      await prisma.decision.create({
        data: {
          year,
          type: "acquisition",
          companyId: company.id,
          payload: JSON.stringify(offer satisfies AcquisitionPayload),
        },
      });
      summary.newDecisions++;
    }
  }

  // Reserves scarcity: this year's fresh follow-on asks (bridges + pay-to-play
  // checks) outrun what's left to deploy. There's no separate decision card —
  // the existing per-decision "only $X left" guard already forces the player
  // to pick and choose; this just flags the shortfall on the summary so the
  // UI can call it out.
  const remaining = await remainingCapital();
  summary.reservesScarce = pendingAsks > remaining;

  await prisma.game.update({ where: { id: 1 }, data: { year, market } });
  // The checkbook closes for new names after the investment period — from
  // then on it's pro-ratas, bridges, founder calls, and exits only.
  if (year <= INVESTMENT_PERIOD_YEARS) await dealFlow(year);

  revalidatePath("/play");
  revalidatePath("/");
  return summary;
}
