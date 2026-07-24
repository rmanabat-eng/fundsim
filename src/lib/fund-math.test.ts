import { describe, expect, it } from "vitest";
import {
  fundMetrics,
  ownershipPercent,
  ownershipAfterRounds,
  ownershipTimeline,
  currentValue,
  valueTimeline,
  exitProceeds,
  xirr,
  companyCashFlows,
  companyIrr,
  fundTimeline,
  formatDollars,
  formatMultiple,
  formatPercent,
} from "./fund-math";

// The canonical example from the README: a $250k check at an $8M post-money.
describe("ownershipPercent", () => {
  it("is check ÷ post-money", () => {
    expect(ownershipPercent(250_000, 8_000_000)).toBeCloseTo(3.125);
  });

  it("returns 0 for a non-positive valuation", () => {
    expect(ownershipPercent(250_000, 0)).toBe(0);
  });
});

const seed = {
  date: "2030-01-01",
  raised: 2_000_000,
  postMoney: 20_000_000,
  yourCheck: 500_000, // 2.5%
};
const seriesASatOut = {
  date: "2031-01-01",
  raised: 30_000_000,
  postMoney: 150_000_000,
  yourCheck: 0, // dilution factor (150-30)/150 = 0.8
};
const seriesAFollowOn = { ...seriesASatOut, yourCheck: 1_500_000 }; // +1%

describe("ownershipAfterRounds", () => {
  it("is check ÷ post-money after one round", () => {
    expect(ownershipAfterRounds([seed])).toBeCloseTo(2.5);
  });

  it("dilutes a sat-out round by (post − raised) ÷ post", () => {
    expect(ownershipAfterRounds([seed, seriesASatOut])).toBeCloseTo(2.0);
  });

  it("adds check ÷ post-money back on a follow-on", () => {
    expect(ownershipAfterRounds([seed, seriesAFollowOn])).toBeCloseTo(3.0);
  });

  it("orders rounds by date, not input order", () => {
    expect(ownershipAfterRounds([seriesASatOut, seed])).toBeCloseTo(2.0);
  });
});

describe("ownershipTimeline", () => {
  it("reports the stake after each round", () => {
    const t = ownershipTimeline([seed, seriesASatOut]);
    expect(t).toHaveLength(2);
    expect(t[0]).toBeCloseTo(2.5);
    expect(t[1]).toBeCloseTo(2.0);
  });
});

describe("currentValue / valueTimeline", () => {
  it("marks ownership at the latest post-money", () => {
    // 2.0% of $150M
    expect(currentValue([seed, seriesASatOut])).toBeCloseTo(3_000_000);
  });

  it("equals cost right after a single entry round", () => {
    expect(currentValue([seed])).toBeCloseTo(500_000);
  });

  it("tracks the markup round by round", () => {
    const t = valueTimeline([seed, seriesASatOut]);
    expect(t[0]).toBeCloseTo(500_000);
    expect(t[1]).toBeCloseTo(3_000_000);
  });
});

describe("exitProceeds", () => {
  it("is ownership at exit × exit valuation", () => {
    // 2.5% of $50M
    expect(exitProceeds([seed], 50_000_000)).toBeCloseTo(1_250_000);
  });

  it("is 0 for a write-off", () => {
    expect(exitProceeds([seed], 0)).toBe(0);
  });
});

describe("xirr", () => {
  it("finds ~100% for a double in one year", () => {
    const r = xirr([
      { date: "2025-01-01", amount: -100 },
      { date: "2026-01-01", amount: 200 },
    ]);
    expect(r).toBeCloseTo(1.0, 2);
  });

  it("finds ~41.4% for a double in two years", () => {
    const r = xirr([
      { date: "2024-01-01", amount: -100 },
      { date: "2026-01-01", amount: 200 },
    ]);
    expect(r).toBeCloseTo(Math.SQRT2 - 1, 2);
  });

  it("finds −50% for losing half in one year", () => {
    const r = xirr([
      { date: "2025-01-01", amount: -100 },
      { date: "2026-01-01", amount: 50 },
    ]);
    expect(r).toBeCloseTo(-0.5, 2);
  });

  it("solves multi-flow schedules", () => {
    // -100 at t0, -100 at 1y, +250 at 2y → 250x² − 100x − 100 = 0 → r ≈ 15.83%
    const r = xirr([
      { date: "2024-01-01", amount: -100 },
      { date: "2025-01-01", amount: -100 },
      { date: "2026-01-01", amount: 250 },
    ]);
    expect(r).toBeCloseTo(0.1583, 2);
  });

  it("returns null for degenerate inputs", () => {
    // same-day flows: no elapsed time
    expect(
      xirr([
        { date: "2025-01-01", amount: -100 },
        { date: "2025-01-01", amount: 120 },
      ])
    ).toBeNull();
    // one-sided: money only ever goes out
    expect(
      xirr([
        { date: "2025-01-01", amount: -100 },
        { date: "2026-01-01", amount: -50 },
      ])
    ).toBeNull();
    // total loss: the 0 flow is dropped, leaving one flow
    expect(
      xirr([
        { date: "2025-01-01", amount: -100 },
        { date: "2026-01-01", amount: 0 },
      ])
    ).toBeNull();
  });
});

describe("companyCashFlows", () => {
  it("emits checks out and current value in for an active company", () => {
    const flows = companyCashFlows([seed, seriesAFollowOn], null, "2032-01-01");
    expect(flows).toEqual([
      { date: "2030-01-01", amount: -500_000 },
      { date: "2031-01-01", amount: -1_500_000 },
      { date: "2032-01-01", amount: expect.closeTo(4_500_000, 0) }, // 3% of $150M
    ]);
  });

  it("emits exit proceeds instead of a mark for an exited company", () => {
    const flows = companyCashFlows(
      [seed],
      { value: 50_000_000, date: "2031-06-01" },
      "2032-01-01"
    );
    expect(flows).toEqual([
      { date: "2030-01-01", amount: -500_000 },
      { date: "2031-06-01", amount: expect.closeTo(1_250_000, 0) },
    ]);
  });

  it("skips sat-out rounds (no check, no flow)", () => {
    const flows = companyCashFlows([seed, seriesASatOut], null, "2032-01-01");
    expect(flows).toHaveLength(2); // one check, one mark
  });
});

describe("fundTimeline", () => {
  // Future dates keep the test deterministic: no "today" point gets appended.
  const companyA = {
    rounds: [seed, seriesASatOut],
    exitValue: null,
    exitDate: null,
  };
  const companyB = {
    rounds: [
      { date: "2030-06-01", raised: 1_000_000, postMoney: 10_000_000, yourCheck: 250_000 },
    ],
    exitValue: 40_000_000, // 2.5% → $1M back
    exitDate: "2031-06-01",
  };

  it("replays deployed, value, and distributions at each event", () => {
    const t = fundTimeline([companyA, companyB]);
    expect(t.map((p) => p.date.toISOString().slice(0, 10))).toEqual([
      "2030-01-01", // A seed
      "2030-06-01", // B seed
      "2031-01-01", // A series A
      "2031-06-01", // B exits
    ]);

    // After A's seed: $500k in, marked at cost.
    expect(t[0].deployed).toBeCloseTo(500_000);
    expect(t[0].value).toBeCloseTo(500_000);
    expect(t[0].distributions).toBe(0);

    // After B's seed: both at cost.
    expect(t[1].deployed).toBeCloseTo(750_000);
    expect(t[1].value).toBeCloseTo(750_000);

    // A marks up to $3M; B still at cost.
    expect(t[2].value).toBeCloseTo(3_250_000);
    expect(t[2].distributions).toBe(0);

    // B exits: its $250k mark becomes $1M of cash.
    expect(t[3].deployed).toBeCloseTo(750_000);
    expect(t[3].value).toBeCloseTo(3_000_000);
    expect(t[3].distributions).toBeCloseTo(1_000_000);
  });

  it("returns an empty timeline for no companies", () => {
    expect(fundTimeline([])).toEqual([]);
  });
});

describe("fundMetrics", () => {
  it("aggregates deployed, value, distributions, and the multiples", () => {
    const m = fundMetrics([
      { rounds: [seed, seriesASatOut], exitValue: null, exitDate: null }, // $3M mark
      {
        rounds: [
          { date: "2030-06-01", raised: 1_000_000, postMoney: 10_000_000, yourCheck: 250_000 },
        ],
        exitValue: 40_000_000, // 2.5% → $1M back
        exitDate: "2031-06-01",
      },
    ]);
    expect(m.deployed).toBeCloseTo(750_000);
    expect(m.portfolioValue).toBeCloseTo(3_000_000);
    expect(m.distributions).toBeCloseTo(1_000_000);
    expect(m.dpi).toBeCloseTo(1_000_000 / 750_000);
    expect(m.tvpi).toBeCloseTo(4_000_000 / 750_000);
    expect(m.irr).not.toBeNull();
  });

  it("returns null multiples for an empty fund", () => {
    const m = fundMetrics([]);
    expect(m.deployed).toBe(0);
    expect(m.dpi).toBeNull();
    expect(m.tvpi).toBeNull();
    expect(m.irr).toBeNull();
  });
});

describe("companyIrr", () => {
  it("annualizes a dated exit exactly (2× in one year ≈ 100%)", () => {
    const irr = companyIrr({
      rounds: [seed], // 2.5% for $500k
      exitValue: 40_000_000, // 2.5% → $1M back
      exitDate: "2031-01-01", // one year after the check
    });
    expect(irr).toBeCloseTo(1.0, 2);
  });

  it("marks an active stake as of the latest round, never discounting backwards", () => {
    // Future-dated rounds: the as-of clock must land on the series A date,
    // not today, or the mark would sit before the last check.
    const irr = companyIrr({
      rounds: [seed, seriesAFollowOn],
      exitValue: null,
      exitDate: null,
    });
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0);
  });

  it("returns null for a write-off (no positive flow)", () => {
    expect(
      companyIrr({ rounds: [seed], exitValue: 0, exitDate: "2031-01-01" })
    ).toBeNull();
  });
});

describe("formatters", () => {
  it("formats whole dollars", () => {
    expect(formatDollars(1_234_567.89)).toBe("$1,234,568");
  });

  it("formats multiples and percents to two decimals", () => {
    expect(formatMultiple(2)).toBe("2.00×");
    expect(formatPercent(3.125)).toBe("3.13%");
  });
});
