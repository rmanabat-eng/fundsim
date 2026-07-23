import { STAGES } from "@/lib/constants";

// One simulated year for one active company. Default probabilities are
// venture-ish: most years a company either raises or nothing happens; a
// slice of the portfolio dies; a smaller slice exits.
//
//   15% shuts down (write-off)
//   10% exits (power-law valuation anchored to the last round)
//   45% raises the next round (markup, or occasionally a down round)
//   30% quiet year
//
// Campaign mode passes its own odds (tilted by company quality and market
// conditions); free-play uses the defaults.
//
// Simulated rounds always have yourCheck = 0 — the sim never spends the
// fund's money. Edit the round afterwards to write a follow-on check.
export type SimEvent =
  | {
      kind: "round";
      stage: string;
      date: string; // yyyy-mm-dd
      raised: number;
      postMoney: number;
      yourCheck: 0;
    }
  | { kind: "exit"; exitValue: number; exitDate: string }
  | { kind: "writeOff"; exitDate: string }
  | { kind: "quiet" };

export type SimCompanyState = {
  stage: string;
  postMoney: number; // last round's post-money
  lastDate: Date | string; // last round date
};

// The dials on a year roll. pDie + pExit + pRaise must be ≤ 1; the rest of
// the probability mass is a quiet year.
export type YearOdds = {
  pDie: number;
  pExit: number;
  pRaise: number;
  downRoundChance: number; // chance a raise prices below the last round
  homeRunChance: number; // chance an exit is a 2×–10× rather than modest
  valuationScale: number; // multiplies raise/exit pricing (market mood)
};

export const DEFAULT_ODDS: YearOdds = {
  pDie: 0.15,
  pExit: 0.1,
  pRaise: 0.45,
  downRoundChance: 0.2,
  homeRunChance: 0.4,
  valuationScale: 1,
};

function randomBetween(min: number, max: number, roundTo: number): number {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / roundTo) * roundTo;
}

// A date 1–12 months into the simulated year, always after the company's
// last round (round and exit validation both require that).
function dateInYear(company: SimCompanyState, simNow: Date | string): string {
  const start = Math.max(
    new Date(simNow).getTime(),
    new Date(company.lastDate).getTime()
  );
  const d = new Date(start);
  d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 335));
  return d.toISOString().slice(0, 10);
}

export function rollYearEvent(
  company: SimCompanyState,
  simNow: Date | string,
  odds: YearOdds = DEFAULT_ODDS
): SimEvent {
  const roll = Math.random();

  if (roll < odds.pDie) {
    return { kind: "writeOff", exitDate: dateInYear(company, simNow) };
  }

  if (roll < odds.pDie + odds.pExit) {
    // Exit: mostly modest, occasionally a home run.
    const multiplier =
      (Math.random() < odds.homeRunChance
        ? 2 + Math.random() * 8
        : 0.5 + Math.random() * 1.5) * odds.valuationScale;
    const exitValue = Math.max(
      Math.round((company.postMoney * multiplier) / 500_000) * 500_000,
      500_000
    );
    return { kind: "exit", exitValue, exitDate: dateInYear(company, simNow) };
  }

  if (roll < odds.pDie + odds.pExit + odds.pRaise) {
    // Next round: usually a markup, occasionally a down round.
    const stageIndex = STAGES.indexOf(company.stage as (typeof STAGES)[number]);
    const stage = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
    const multiplier =
      (Math.random() < odds.downRoundChance
        ? 0.5 + Math.random() * 0.4
        : 1.5 + Math.random() * 2.5) * odds.valuationScale;
    const postMoney = Math.max(
      Math.round((company.postMoney * multiplier) / 500_000) * 500_000,
      1_000_000
    );
    const raised = Math.min(
      Math.max(randomBetween(postMoney * 0.15, postMoney * 0.3, 100_000), 100_000),
      postMoney - 500_000
    );
    return {
      kind: "round",
      stage,
      date: dateInYear(company, simNow),
      raised,
      postMoney,
      yourCheck: 0,
    };
  }

  return { kind: "quiet" };
}
