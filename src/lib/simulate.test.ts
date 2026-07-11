import { describe, expect, it } from "vitest";
import { rollYearEvent } from "./simulate";

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
