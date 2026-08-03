import { describe, expect, it } from "vitest";
import { FACT_POOL, SENTIMENT_WEIGHT } from "@/lib/fact-card";
import {
  campaignOdds,
  dateInWindow,
  dealQualityNoise,
  generateDeal,
  gradeFund,
  buildAcquisitionOffer,
  buildBridgeRequest,
  isEstablishedFounder,
  maybeTermSheet,
  pivotOutcome,
  PIVOT_BACKED_MAX,
  campaignLog,
  PIVOT_BACKED_MIN,
  reputation,
  REFERRAL_QUALITY_NOISE,
  REFERRAL_TRACK_RECORD_THRESHOLD,
  GOOD_TRACK_RECORD_THRESHOLD,
  REFUSAL_REPUTATION_HIT,
  COSTLY_REFUSAL_REPUTATION_HIT,
  FLATTERING_TERM_SHEET_REPUTATION_BOOST,
  TERM_SHEET_TOP_TIER_QUALITY_BOOST,
  TERM_SHEET_HIGH_PRICE_QUALITY_HIT,
  rollMarket,
  rollsReferral,
  yearWindow,
  CEO_KEPT_MAX,
  CEO_KEPT_MIN,
  PAY_TO_PLAY_RECAP_FACTOR,
  SECONDARY_DISCOUNT,
  founderKeptOutcome,
  ipoResult,
  buildExitRoute,
  EXIT_ROUTE_MIN_POST,
  maybePayToPlay,
} from "./campaign";

// Facts substitute numbers into their template, so match by the static
// prefix (text before the first "{...}") rather than exact text.
const staticPrefix = (template: string) => template.split("{")[0];
const weightOfPrefix = new Map(
  FACT_POOL.map((f) => [staticPrefix(f.text_template), SENTIMENT_WEIGHT[f.sentiment_tag]])
);
function weightOfSignal(signal: string): number {
  for (const [prefix, weight] of weightOfPrefix) {
    if (signal.startsWith(prefix)) return weight;
  }
  throw new Error(`no fact matches signal: ${signal}`);
}

describe("generateDeal", () => {
  it("produces valid pitches with hidden quality in range", () => {
    for (let i = 0; i < 200; i++) {
      const deal = generateDeal();
      expect(deal.description.length).toBeGreaterThan(0);
      expect(deal.raised).toBeGreaterThan(0);
      expect(deal.postMoney).toBeGreaterThan(deal.raised);
      expect(deal.signals.length).toBeGreaterThanOrEqual(3);
      expect(deal.signals.length).toBeLessThanOrEqual(5);
      expect(new Set(deal.signals).size).toBe(deal.signals.length);
      for (const s of deal.signals) expect(() => weightOfSignal(s)).not.toThrow();
      expect(deal.quality).toBeGreaterThanOrEqual(-1);
      expect(deal.quality).toBeLessThanOrEqual(1);
    }
  });

  it("signals correlate with quality (noisily, but over many deals)", () => {
    const strong: number[] = [];
    const weak: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const deal = generateDeal();
      const sum = deal.signals.reduce((acc, s) => acc + weightOfSignal(s), 0);
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
    for (let i = 0; i < 20; i++) {
      const offer = buildAcquisitionOffer(company, "bull", window);
      expect(offer.offerValue).toBeGreaterThan(0);
      expect(new Date(offer.exitDate).getTime()).toBeGreaterThan(
        new Date(company.lastDate).getTime()
      );
    }
  });

  it("bridge terms satisfy the same invariants the round form enforces", () => {
    for (let i = 0; i < 20; i++) {
      const bridge = buildBridgeRequest(company, "bear", window);
      expect(bridge.amount).toBeGreaterThan(0);
      expect(bridge.postMoney).toBeGreaterThan(bridge.amount);
      expect(bridge.stage).toBe("SEED"); // bridges don't advance the stage
    }
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
    costlyRefusals: 0,
    proRataBacked: 0,
    flatteringTermSheetsBacked: 0,
    adviceGiven: 0,
    decisionsExpired: 0,
    dealsExpired: 0,
    foundersOusted: 0,
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

  it("credits founder calls answered — pivots and CEO votes", () => {
    expect(reputation({ ...nobody, adviceGiven: 5 }).score).toBe(85);
  });

  it("charges refusing an established founder more than refusing an unproven one", () => {
    const shakyRefusal = reputation({ ...nobody, bridgesRefused: 1 });
    const establishedRefusal = reputation({ ...nobody, costlyRefusals: 1 });
    expect(establishedRefusal.score).toBeLessThan(shakyRefusal.score);
    expect(shakyRefusal.score).toBe(70 - REFUSAL_REPUTATION_HIT);
    expect(establishedRefusal.score).toBe(70 - COSTLY_REFUSAL_REPUTATION_HIT);
  });

  it("credits backing the flattering term sheet; the disciplined lead earns nothing extra", () => {
    const backedFlattering = reputation({ ...nobody, flatteringTermSheetsBacked: 1 });
    const backedTopTier = reputation(nobody); // top-tier resolutions aren't counted anywhere
    expect(backedFlattering.score).toBeGreaterThan(backedTopTier.score);
    expect(backedFlattering.score).toBe(70 + FLATTERING_TERM_SHEET_REPUTATION_BOOST);
  });
});

describe("isEstablishedFounder", () => {
  it("is false below the threshold and true at or above it", () => {
    expect(isEstablishedFounder(GOOD_TRACK_RECORD_THRESHOLD - 1)).toBe(false);
    expect(isEstablishedFounder(GOOD_TRACK_RECORD_THRESHOLD)).toBe(true);
    expect(isEstablishedFounder(GOOD_TRACK_RECORD_THRESHOLD + 10)).toBe(true);
  });
});

describe("backing the flattering term sheet vs. the disciplined lead", () => {
  it("is reputation-positive but financially worse in expectation", () => {
    // Financially: the top-tier lead's quality boost beats the flattering
    // price's hit — backing the founder's preferred option costs you.
    expect(TERM_SHEET_TOP_TIER_QUALITY_BOOST).toBeGreaterThan(
      TERM_SHEET_HIGH_PRICE_QUALITY_HIT
    );
    // Reputation-wise it's the reverse: only the flattering choice earns
    // anything, and it's strictly positive.
    expect(FLATTERING_TERM_SHEET_REPUTATION_BOOST).toBeGreaterThan(0);
  });
});

describe("rollsReferral", () => {
  it("never fires below the track-record threshold, no matter how many times you roll", () => {
    // A company that's had one or two bridges funded — nowhere near the
    // sustained history the threshold demands — should never cross it.
    for (let i = 0; i < 200; i++) {
      expect(rollsReferral(1)).toBe(false);
      expect(rollsReferral(2)).toBe(false);
      expect(rollsReferral(REFERRAL_TRACK_RECORD_THRESHOLD - 1)).toBe(false);
    }
  });

  it("is markedly harder to reach than the refusal-cost threshold", () => {
    // A founder should be worth feeling bad about disappointing well before
    // they're worth referring you a deal.
    expect(REFERRAL_TRACK_RECORD_THRESHOLD).toBeGreaterThan(GOOD_TRACK_RECORD_THRESHOLD);
  });

  it("can fire once the threshold is met", () => {
    let fired = false;
    for (let i = 0; i < 500 && !fired; i++) {
      fired = rollsReferral(REFERRAL_TRACK_RECORD_THRESHOLD);
    }
    expect(fired).toBe(true);
  });
});

describe("referred deals", () => {
  it("read with measurably lower noise than a cold pitch", () => {
    const cold = Array.from({ length: 500 }, () => Math.abs(dealQualityNoise()));
    const referred = Array.from({ length: 500 }, () =>
      Math.abs(dealQualityNoise(REFERRAL_QUALITY_NOISE))
    );
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(referred)).toBeLessThan(avg(cold));
    // And every referred sample stays within the tighter amplitude — the
    // noise shrinks, it isn't just "usually" smaller.
    for (const n of referred) expect(n).toBeLessThanOrEqual(REFERRAL_QUALITY_NOISE);
  });

  it("are not guaranteed to be good — low quality is still reachable with the referral's tighter noise", () => {
    // Referral eligibility (rollsReferral) only reads trackRecord, never the
    // referring company's own quality, and generateDeal draws a brand-new
    // company from scratch either way — so a referred deal can read clean
    // and still turn out to be a dud, same as any cold pitch.
    let sawLowQuality = false;
    for (let i = 0; i < 500 && !sawLowQuality; i++) {
      const deal = generateDeal({ noiseAmplitude: REFERRAL_QUALITY_NOISE });
      if (deal.quality < -0.2) sawLowQuality = true;
    }
    expect(sawLowQuality).toBe(true);
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

describe("campaignLog", () => {
  const START = "2026-01-01";
  // Year 1 = 2026, year 2 = 2027, year 3 = 2028.
  const company = (
    name: string,
    roundDates: string[],
    exitValue: number | null = null,
    exitDate: string | null = null
  ) => ({
    name,
    sector: "SaaS",
    exitValue,
    exitDate,
    rounds: roundDates.map((d) => ({ date: d })),
  });
  const ref = (name: string) => ({ name, sector: "SaaS" });

  it("files the first round as backed and later rounds as raised", () => {
    const log = campaignLog(
      [company("Acme", ["2026-03-01", "2027-06-01"])],
      START,
      3
    );
    expect(log[0].backed).toEqual([ref("Acme")]);
    expect(log[0].raised).toEqual([]);
    expect(log[1].backed).toEqual([]);
    expect(log[1].raised).toEqual([ref("Acme")]);
    expect(log[2].backed).toEqual([]);
  });

  it("separates exits from write-offs by exit value", () => {
    const log = campaignLog(
      [
        company("Winner", ["2026-03-01"], 30_000_000, "2028-02-01"),
        company("Dud", ["2026-04-01"], 0, "2027-05-01"),
      ],
      START,
      3
    );
    expect(log[1].writtenOff).toEqual([ref("Dud")]);
    expect(log[1].exited).toEqual([]);
    expect(log[2].exited).toEqual([{ ...ref("Winner"), value: 30_000_000 }]);
    expect(log[2].writtenOff).toEqual([]);
  });

  it("ignores companies that are still active", () => {
    const log = campaignLog([company("Alive", ["2026-03-01"])], START, 2);
    expect(log.every((e) => e.exited.length === 0 && e.writtenOff.length === 0)).toBe(
      true
    );
  });

  it("returns one entry per year up to the year asked for", () => {
    const log = campaignLog([], START, 4);
    expect(log.map((e) => e.year)).toEqual([1, 2, 3, 4]);
  });
});

describe("buildExitRoute", () => {
  // Eligibility (postMoney >= EXIT_ROUTE_MIN_POST) now lives in the scenario
  // pool (src/lib/scenario-pool.ts + actions.ts OFFER_POOL) — this builder is
  // pure payload construction, called only once a route has been picked.
  const window = yearWindow("2026-01-01", 1);
  const mature = { stage: "SERIES_C", postMoney: 200_000_000, lastDate: "2026-01-02" };

  it("only makes sense once a company has grown up", () => {
    expect(mature.postMoney).toBeGreaterThanOrEqual(EXIT_ROUTE_MIN_POST);
  });

  it("prices the secondary below the last round — that's the discount", () => {
    for (let i = 0; i < 200; i++) {
      const r = buildExitRoute(mature, "normal", window);
      expect(r.secondaryValuation).toBeLessThan(r.postMoney);
      expect(r.secondaryValuation).toBeCloseTo(r.postMoney * SECONDARY_DISCOUNT, -6);
    }
  });

  it("gives the IPO a higher ceiling than the sale, and more risk in a bear", () => {
    let bull = 0;
    let bear = 0;
    for (let i = 0; i < 20; i++) {
      const b = buildExitRoute(mature, "bull", window);
      expect(b.ipoHigh).toBeGreaterThan(b.acquisitionOffer);
      bull = b.ipoPullChance;
      const r = buildExitRoute(mature, "bear", window);
      bear = r.ipoPullChance;
    }
    expect(bear).toBeGreaterThan(bull);
  });
});

describe("ipoResult", () => {
  const payload = {
    stage: "SERIES_C",
    postMoney: 100_000_000,
    ipoLow: 90_000_000,
    ipoHigh: 320_000_000,
    ipoPullChance: 0.25,
    acquisitionOffer: 180_000_000,
    secondaryValuation: 75_000_000,
    date: "2026-06-01",
  };

  it("prices inside the range when it isn't pulled", () => {
    for (let i = 0; i < 300; i++) {
      const r = ipoResult(payload);
      if (r.pulled) continue;
      expect(r.valuation).toBeGreaterThanOrEqual(payload.ipoLow);
      expect(r.valuation).toBeLessThanOrEqual(payload.ipoHigh);
    }
  });

  it("gets pulled roughly as often as the payload says", () => {
    let pulled = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) if (ipoResult(payload).pulled) pulled++;
    expect(pulled / n).toBeGreaterThan(0.2);
    expect(pulled / n).toBeLessThan(0.3);
  });

  it("never gets pulled when the chance is zero", () => {
    for (let i = 0; i < 200; i++) {
      expect(ipoResult({ ...payload, ipoPullChance: 0 }).pulled).toBe(false);
    }
  });
});

describe("maybePayToPlay", () => {
  const round = {
    stage: "SERIES_A",
    raised: 10_000_000,
    postMoney: 20_000_000,
    date: "2026-06-01",
  };

  it("only fires on a down round", () => {
    for (let i = 0; i < 200; i++) {
      // previous price below the new one is an up round — never pay-to-play
      expect(maybePayToPlay(round, 10_000_000, 10)).toBeNull();
    }
  });

  it("recaps non-participants well below the round price", () => {
    for (let i = 0; i < 200; i++) {
      const p = maybePayToPlay(round, 60_000_000, 10);
      if (!p) continue;
      expect(p.recapPostMoney).toBeLessThan(p.postMoney);
      expect(p.recapPostMoney).toBeGreaterThan(p.raised); // still a sane price
    }
  });

  it("asks for roughly your pro-rata share of the round", () => {
    for (let i = 0; i < 200; i++) {
      const p = maybePayToPlay(round, 60_000_000, 10);
      if (!p) continue;
      // 10% of a $10M round ≈ $1M, rounded to the nearest $25k
      expect(p.requiredCheck).toBeGreaterThanOrEqual(975_000);
      expect(p.requiredCheck).toBeLessThanOrEqual(1_025_000);
      expect(p.requiredCheck).toBeLessThanOrEqual(p.raised);
    }
  });

  it("keeps the recap factor punishing", () => {
    expect(PAY_TO_PLAY_RECAP_FACTOR).toBeLessThan(0.5);
  });
});

describe("founderKeptOutcome", () => {
  it("stays inside its band and can cut both ways", () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 2000; i++) {
      const d = founderKeptOutcome();
      expect(d).toBeGreaterThanOrEqual(CEO_KEPT_MIN);
      expect(d).toBeLessThanOrEqual(CEO_KEPT_MAX);
      min = Math.min(min, d);
      max = Math.max(max, d);
    }
    expect(min).toBeLessThan(0); // backing a founder can go badly
    expect(max).toBeGreaterThan(0);
  });
});

describe("reputation — ousting founders", () => {
  const nobody = {
    bridgesFunded: 0,
    bridgesRefused: 0,
    costlyRefusals: 0,
    proRataBacked: 0,
    flatteringTermSheetsBacked: 0,
    adviceGiven: 0,
    decisionsExpired: 0,
    dealsExpired: 0,
    foundersOusted: 0,
  };

  it("costs more than refusing a bridge", () => {
    const ousted = reputation({ ...nobody, foundersOusted: 1 }).score;
    const refused = reputation({ ...nobody, bridgesRefused: 1 }).score;
    expect(ousted).toBeLessThan(refused);
  });

  it("stacks with each founder shown the door", () => {
    expect(reputation({ ...nobody, foundersOusted: 2 }).score).toBeLessThan(
      reputation({ ...nobody, foundersOusted: 1 }).score
    );
  });
});
