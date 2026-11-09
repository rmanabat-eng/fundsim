import { describe, expect, it } from "vitest";
import { rollYearEvent, STEP_UP, ROUND_DILUTION } from "./simulate";
import { generateRandomStartup } from "./random-startup";

// The roll is random, so test invariants over many rolls rather than values.
describe("rollYearEvent", () => {
  const company = {
    stage: "SEED",
    postMoney: 20_000_000,
    lastDate: "2030-01-01",
  };
  const simNow = "2030-06-01";

  it("always produces valid, in-window events", () => {
    const windowStart = new Date(simNow).getTime();
    const windowEnd = windowStart + 366 * 24 * 60 * 60 * 1000;
    const seen = new Set<string>();

    for (let i = 0; i < 200; i++) {
      const e = rollYearEvent(company, simNow);
      seen.add(e.kind);

      if (e.kind === "quiet") continue;

      const when = new Date(e.kind === "round" ? e.date : e.exitDate).getTime();
      expect(when).toBeGreaterThan(new Date(company.lastDate).getTime());
      expect(when).toBeGreaterThanOrEqual(windowStart);
      expect(when).toBeLessThanOrEqual(windowEnd);

      if (e.kind === "round") {
        // Same invariants the form validation enforces.
        expect(e.raised).toBeGreaterThan(0);
        expect(e.postMoney).toBeGreaterThan(e.raised);
        expect(e.yourCheck).toBe(0);
        expect(e.stage).toBe("SERIES_A"); // next stage after seed
      }
      if (e.kind === "exit") {
        expect(e.exitValue).toBeGreaterThan(0);
      }
    }

    // 200 rolls at these probabilities: seeing all four kinds is
    // overwhelmingly likely (each miss chance < 1e-14).
    expect(seen).toEqual(new Set(["round", "exit", "writeOff", "quiet"]));
  });

  it("never advances past the last stage", () => {
    for (let i = 0; i < 100; i++) {
      const e = rollYearEvent({ ...company, stage: "SERIES_C" }, simNow);
      if (e.kind === "round") expect(e.stage).toBe("SERIES_C");
    }
  });
});

// Forces an up round every roll so the step-up range can be checked directly.
const ALWAYS_UP = {
  pDie: 0,
  pExit: 0,
  pRaise: 1,
  downRoundChance: 0,
  homeRunChance: 0,
  valuationScale: 1,
};

describe("round realism", () => {
  it("steps valuations up by the stage's range, smaller as companies mature", () => {
    for (const stage of ["SEED", "SERIES_A", "SERIES_C"] as const) {
      const [lo, hi] = STEP_UP[stage];
      const post = 200_000_000; // large, so 500k rounding barely moves the ratio
      for (let i = 0; i < 200; i++) {
        const e = rollYearEvent({ stage, postMoney: post, lastDate: "2030-01-01" }, "2030-06-01", ALWAYS_UP);
        if (e.kind !== "round") throw new Error("expected a round");
        expect(e.postMoney / post).toBeGreaterThanOrEqual(lo - 0.01);
        expect(e.postMoney / post).toBeLessThanOrEqual(hi + 0.01);
        expect(e.raised / e.postMoney).toBeLessThanOrEqual(ROUND_DILUTION[1] + 0.01);
      }
    }
    expect(STEP_UP.SERIES_C[1]).toBeLessThan(STEP_UP.SEED[1]);
  });

  it("never deals an entry round that sells most of the company", () => {
    for (let i = 0; i < 2000; i++) {
      const d = generateRandomStartup();
      const sold = d.raised / d.postMoneyValuation;
      // ROUND_DILUTION, plus slack for 50k rounding and the check-size floor.
      expect(sold).toBeGreaterThanOrEqual(0.1);
      expect(sold).toBeLessThanOrEqual(0.27);
    }
  });
});
