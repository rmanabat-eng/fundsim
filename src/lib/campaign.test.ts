import { describe, expect, it } from "vitest";
import {
  SIGNALS,
  campaignOdds,
  dateInWindow,
  generateDeal,
  gradeFund,
  maybeAcquisitionOffer,
  maybeBridgeRequest,
  maybeTermSheet,
  pivotOutcome,
  PIVOT_BACKED_MAX,
  PIVOT_BACKED_MIN,
  reputation,
  rollMarket,
  yearWindow,
} from "./campaign";

const weightOf = new Map(SIGNALS.map((s) => [s.text, s.weight]));

describe("generateDeal", () => {
  it("produces valid pitches with hidden quality in range", () => {
    for (let i = 0; i < 200; i++) {
      const deal = generateDeal();
      expect(deal.raised).toBeGreaterThan(0);
      expect(deal.postMoney).toBeGreaterThan(deal.raised);
      expect(deal.signals).toHaveLength(3);
      expect(new Set(deal.signals).size).toBe(3);
      for (const s of deal.signals) expect(weightOf.has(s)).toBe(true);
      expect(deal.quality).toBeGreaterThanOrEqual(-1);
      expect(deal.quality).toBeLessThanOrEqual(1);
    }
  });

  it("signals correlate with quality (noisily, but over many deals)", () => {
    const strong: number[] = [];
    const weak: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const deal = generateDeal();
      const sum = deal.signals.reduce((acc, s) => acc + (weightOf.get(s) ?? 0), 0);
      if (sum > 0.3) strong.push(deal.quality);
      if (sum < -0.3) weak.push(deal.quality);
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(strong.length).toBeGreaterThan(20);
    expect(weak.length).toBeGreaterThan(20);
    expect(mean(strong)).toBeGreaterThan(mean(weak) + 0.4);
  });
});

describe("campaignOdds", () => {
  it("keeps probabilities valid for every quality and market", () => {
    for (const market of ["bull", "normal", "bear"] as const) {
      for (let q = -1; q <= 1; q += 0.25) {
        const odds = campaignOdds(q, market);
        expect(odds.pDie + odds.pExit + odds.pRaise).toBeLessThanOrEqual(1);
        for (const p of [odds.pDie, odds.pExit, odds.pRaise, odds.downRoundChance, odds.homeRunChance]) {
          expect(p).toBeGreaterThan(0);
          expect(p).toBeLessThan(1);
        }
        expect(odds.valuationScale).toBeGreaterThan(0);
      }
    }
  });

  it("rewards quality and punishes bear markets", () => {
    const good = campaignOdds(1, "normal");
    const bad = campaignOdds(-1, "normal");
    expect(good.pDie).toBeLessThan(bad.pDie);
    expect(good.pRaise).toBeGreaterThan(bad.pRaise);
    expect(good.downRoundChance).toBeLessThan(bad.downRoundChance);
    expect(good.homeRunChance).toBeGreaterThan(bad.homeRunChance);

    const bear = campaignOdds(0, "bear");
    const bull = campaignOdds(0, "bull");
    expect(bear.pDie).toBeGreaterThan(bull.pDie);
    expect(bear.valuationScale).toBeLessThan(1);
    expect(bull.valuationScale).toBeGreaterThan(1);
  });
});

describe("year windows and dates", () => {
  const startedAt = "2030-03-15T00:00:00.000Z";

  it("year windows are consecutive 1-year spans", () => {
    const y1 = yearWindow(startedAt, 1);
    const y2 = yearWindow(startedAt, 2);
    expect(y1.start.toISOString()).toBe(startedAt);
    expect(y1.end.getTime()).toBe(y2.start.getTime());
  });

  it("dates land inside the window and after notBefore", () => {
    const window = yearWindow(startedAt, 3);
    for (let i = 0; i < 100; i++) {
      const d = new Date(dateInWindow(window, "2032-08-01")).getTime();
      expect(d).toBeGreaterThan(new Date("2032-08-01").getTime());
      expect(d).toBeLessThanOrEqual(window.end.getTime());
    }
  });
});

describe("decision generators", () => {
  const company = { stage: "SEED", postMoney: 20_000_000, lastDate: "2030-06-01" };
  const window = yearWindow("2030-03-15", 1);

  it("acquisition offers price above zero and respect round validation", () => {
    let seen = 0;
    for (let i = 0; i < 500 && seen < 10; i++) {
      const offer = maybeAcquisitionOffer(company, "bull", window);
      if (!offer) continue;
      seen++;
      expect(offer.offerValue).toBeGreaterThan(0);
      expect(new Date(offer.exitDate).getTime()).toBeGreaterThan(
        new Date(company.lastDate).getTime()
      );
    }
    expect(seen).toBe(10);
  });

  it("bridge terms satisfy the same invariants the round form enforces", () => {
    let seen = 0;
    for (let i = 0; i < 500 && seen < 20; i++) {
      const bridge = maybeBridgeRequest(company, "bear", window);
      if (!bridge) continue;
      seen++;
      expect(bridge.amount).toBeGreaterThan(0);
      expect(bridge.postMoney).toBeGreaterThan(bridge.amount);
      expect(bridge.stage).toBe("SEED"); // bridges don't advance the stage
    }
    expect(seen).toBe(20);
  });
});

describe("rollMarket", () => {
  it("produces every mood over many rolls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(rollMarket());
    expect(seen).toEqual(new Set(["bull", "normal", "bear"]));
  });
});

describe("gradeFund", () => {
  it("maps TVPI to the right quartile", () => {
    expect(gradeFund(null).tone).toBe("bad");
    expect(gradeFund(0.6).tone).toBe("bad");
    expect(gradeFund(1.2).label).toBe("Third quartile");
    expect(gradeFund(2.0).label).toBe("Second quartile");
    expect(gradeFund(3.0).label).toBe("Top quartile");
    expect(gradeFund(5).label).toBe("Top decile");
  });
});

describe("reputation", () => {
  const nobody = {
    bridgesFunded: 0,
    bridgesRefused: 0,
    proRataBacked: 0,
    adviceGiven: 0,
    decisionsExpired: 0,
    dealsExpired: 0,
  };

  it("starts neutral when nothing founder-facing ever happened", () => {
    const rep = reputation(nobody);
    expect(rep.score).toBe(70);
    expect(rep.tone).toBe("good");
  });

  it("rewards showing up: bridges and answered follow-ons", () => {
    const rep = reputation({ ...nobody, bridgesFunded: 2, proRataBacked: 1 });
    expect(rep.score).toBe(90);
    expect(rep.label).toBe("Founder favorite");
  });

  it("charges a deliberate no far less than silence", () => {
    const refused = reputation({ ...nobody, bridgesRefused: 4 });
    const ghosted = reputation({ ...nobody, decisionsExpired: 4 });
    expect(refused.score).toBeGreaterThan(ghosted.score);
    expect(refused.tone).toBe("ok");
    expect(ghosted.tone).toBe("bad");
    expect(ghosted.label).toBe("Ghost");
  });

  it("dings unanswered pitches and clamps to 0..100", () => {
    expect(reputation({ ...nobody, dealsExpired: 2 }).score).toBe(62);
    expect(reputation({ ...nobody, dealsExpired: 40 }).score).toBe(0);
    expect(reputation({ ...nobody, bridgesFunded: 40 }).score).toBe(100);
  });

  it("credits founder calls answered — term sheets and pivots", () => {
    expect(reputation({ ...nobody, adviceGiven: 5 }).score).toBe(85);
  });
});

describe("maybeTermSheet", () => {
  const round = {
    stage: "SERIES_A",
    raised: 5_000_000,
    postMoney: 20_000_000,
    date: "2031-06-01",
  };

  it("prices the top-tier lead below the round and the hype fund above it", () => {
    let seen = 0;
    for (let i = 0; i < 400 && seen < 20; i++) {
      const sheet = maybeTermSheet(round);
      if (!sheet) continue;
      seen++;
      expect(sheet.topTierPost).toBeLessThan(round.postMoney);
      expect(sheet.highPricePost).toBeGreaterThan(round.postMoney);
      expect(sheet.topTierPost).toBeGreaterThan(sheet.raised);
      expect(sheet.topTierPost % 500_000).toBe(0);
      expect(sheet.highPricePost % 500_000).toBe(0);
      expect(sheet.stage).toBe(round.stage);
      expect(sheet.date).toBe(round.date);
    }
    expect(seen).toBe(20); // fires often enough to actually show up in games
  });

  it("keeps every option an up-round even for tightly priced rounds", () => {
    const tight = { ...round, raised: 18_000_000 };
    for (let i = 0; i < 400; i++) {
      const sheet = maybeTermSheet(tight);
      if (!sheet) continue;
      expect(sheet.topTierPost).toBeGreaterThan(tight.raised);
      expect(sheet.highPricePost).toBeGreaterThan(sheet.topTierPost);
    }
  });
});

describe("pivotOutcome", () => {
  it("stays inside the documented swing and tilts positive on average", () => {
    let sum = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) {
      const delta = pivotOutcome();
      expect(delta).toBeGreaterThanOrEqual(PIVOT_BACKED_MIN);
      expect(delta).toBeLessThanOrEqual(PIVOT_BACKED_MAX);
      sum += delta;
    }
    expect(sum / n).toBeGreaterThan(0); // expected value ≈ +0.15
  });
});
