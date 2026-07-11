import { STAGES } from "@/lib/constants";

// One simulated year for one active company. Probabilities are venture-ish:
// most years a company either raises or nothing happens; a slice of the
// portfolio dies; a smaller slice exits.
//
//   15% shuts down (write-off)
//   10% exits (power-law valuation anchored to the last round)
//   45% raises the next round (markup, or occasionally a down round)
//   30% quiet year
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
  simNow: Date | string
): SimEvent {
  const roll = Math.random();

  if (roll < 0.15) {
    return { kind: "writeOff", exitDate: dateInYear(company, simNow) };
  }

  if (roll < 0.25) {
    // Exit: mostly modest, occasionally a home run.
    const multiplier =
      Math.random() < 0.6 ? 0.5 + Math.random() * 1.5 : 2 + Math.random() * 8;
    const exitValue = Math.max(
      Math.round((company.postMoney * multiplier) / 500_000) * 500_000,
      500_000
    );
    return { kind: "exit", exitValue, exitDate: dateInYear(company, simNow) };
  }

  if (roll < 0.7) {
    // Next round: usually a markup, 1 in 5 a down round.
    const stageIndex = STAGES.indexOf(company.stage as (typeof STAGES)[number]);
    const stage = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
    const multiplier =
      Math.random() < 0.2 ? 0.5 + Math.random() * 0.4 : 1.5 + Math.random() * 2.5;
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
