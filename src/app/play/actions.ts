"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { STAGES } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { rollYearEvent } from "@/lib/simulate";
import { exitProceeds, formatDollars } from "@/lib/fund-math";
import {
  BRIDGE_FUNDED_QUALITY_BOOST,
  BRIDGE_REFUSED_QUALITY_HIT,
  DEALS_PER_YEAR,
  GAME_YEARS,
  campaignOdds,
  dateInWindow,
  generateDeal,
  maybeAcquisitionOffer,
  maybeBridgeRequest,
  rollMarket,
  yearWindow,
  type Market,
} from "@/lib/campaign";

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
  // (a pro-rata, a bridge) is moot — clear it off the desk.
  await prisma.decision.updateMany({
    where: { companyId: decision.companyId, status: "pending" },
    data: { status: "expired" },
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
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  revalidatePath("/play");
  revalidatePath("/");
  return null;
}

// Decline any pending decision. Refusing a bridge leaves the company
// struggling and unfunded — its quality takes a hit.
export async function declineDecision(decisionId: string) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { company: true },
  });
  if (!decision || decision.status !== "pending") return;

  if (decision.type === "bridge") {
    await prisma.company.update({
      where: { id: decision.companyId },
      data: {
        quality: clampQuality(decision.company.quality + BRIDGE_REFUSED_QUALITY_HIT),
      },
    });
  }
  await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "resolved" },
  });
  revalidatePath("/play");
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
};

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
    };
  }

  const year = game.year + 1;
  const market = rollMarket();
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
  };

  const companies = await prisma.company.findMany({
    include: { rounds: { orderBy: { date: "asc" } } },
  });

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
      const bridge = maybeBridgeRequest(state, market, window);
      if (bridge) {
        await prisma.decision.create({
          data: {
            year,
            type: "bridge",
            companyId: company.id,
            payload: JSON.stringify(bridge satisfies BridgePayload),
          },
        });
        summary.newDecisions++;
        continue; // a company asking for a bridge isn't fielding acquirers
      }
    }

    // Anchor any offer to the latest state — including a round created just
    // above — so the offer prices off (and postdates) the newest round.
    const offer = maybeAcquisitionOffer(
      event.kind === "round"
        ? { stage: event.stage, postMoney: event.postMoney, lastDate: event.date }
        : state,
      market,
      window
    );
    if (offer) {
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

  await prisma.game.update({ where: { id: 1 }, data: { year, market } });
  await dealFlow(year);

  revalidatePath("/play");
  revalidatePath("/");
  return summary;
}
