import { SECTORS, STAGES } from "@/lib/constants";

const NAME_PREFIXES = [
  "Nimbus", "Quanta", "Hyper", "Loop", "Verdant", "Pulse", "Atlas", "Ember",
  "Drift", "Nova", "Zephyr", "Mint", "Forge", "Cobalt", "Lumen", "Solstice",
  "Vector", "Halo", "Onyx", "Aurora",
];

const NAME_SUFFIXES = [
  "Labs", "AI", "Flow", "Stack", "Works", "Grid", "Metrics", "Base",
  "Sense", "Hub", "Pilot", "Layer", "Signal", "Path", "Forge",
];

// Only generate stages a fund would enter at.
const ENTRY_STAGES = ["PRE_SEED", "SEED", "SERIES_A"] as const;

// Plausible deal ranges per stage:
// [min post, max post, min check, max check, min raised, max raised]
const STAGE_RANGES: Record<
  (typeof ENTRY_STAGES)[number],
  [number, number, number, number, number, number]
> = {
  PRE_SEED: [2_000_000, 8_000_000, 50_000, 250_000, 500_000, 1_500_000],
  SEED: [8_000_000, 30_000_000, 200_000, 750_000, 2_000_000, 6_000_000],
  SERIES_A: [25_000_000, 80_000_000, 500_000, 1_500_000, 8_000_000, 18_000_000],
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number, roundTo: number): number {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / roundTo) * roundTo;
}

export function generateRandomStartup() {
  const prefix = pick(NAME_PREFIXES);
  let suffix = pick(NAME_SUFFIXES);
  while (suffix.toLowerCase() === prefix.toLowerCase()) {
    suffix = pick(NAME_SUFFIXES);
  }

  const stage = pick(ENTRY_STAGES);
  const [minPost, maxPost, minCheck, maxCheck, minRaised, maxRaised] =
    STAGE_RANGES[stage];
  const postMoneyValuation = randomBetween(minPost, maxPost, 500_000);
  const checkSize = randomBetween(minCheck, maxCheck, 25_000);
  const raised = Math.max(
    randomBetween(minRaised, maxRaised, 100_000),
    checkSize
  );

  // Random date within the past 2 years
  const daysAgo = Math.floor(Math.random() * 730);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return {
    companyName: `${prefix}${suffix}`,
    sector: pick(SECTORS) as string,
    stage,
    raised,
    checkSize,
    postMoneyValuation,
    investmentDate: date.toISOString().slice(0, 10),
  };
}

// A plausible next round for a company that already raised: usually the next
// stage at a marked-up valuation, occasionally a down round, and a coin flip
// on whether your fund follows on or sits out and takes the dilution.
export function generateRandomFollowOn(latest: {
  stage: string;
  postMoney: number;
  date: Date | string;
}) {
  const stageIndex = STAGES.indexOf(latest.stage as (typeof STAGES)[number]);
  const stage = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];

  // 1 in 5 rounds is a down round (0.5×–0.9×); the rest mark up 1.5×–4×.
  const multiplier =
    Math.random() < 0.2 ? 0.5 + Math.random() * 0.4 : 1.5 + Math.random() * 2.5;
  const postMoney = Math.max(
    Math.round((latest.postMoney * multiplier) / 500_000) * 500_000,
    1_000_000
  );

  // New investors typically buy 15–30% of the company in a round.
  const raised = Math.min(
    Math.max(randomBetween(postMoney * 0.15, postMoney * 0.3, 100_000), 100_000),
    postMoney - 500_000
  );

  // Coin flip: sit out (watch the dilution) or defend with a follow-on check.
  const yourCheck =
    Math.random() < 0.5
      ? 0
      : Math.min(randomBetween(100_000, 1_000_000, 25_000), raised);

  // 9–24 months after the previous round.
  const date = new Date(latest.date);
  date.setDate(date.getDate() + 270 + Math.floor(Math.random() * 456));

  return {
    stage: stage as string,
    raised,
    postMoney,
    yourCheck,
    date: date.toISOString().slice(0, 10),
  };
}

// A plausible outcome for a company, anchored to its last round price.
// Venture returns are power-law: most companies die or exit sideways, and a
// few return the fund.
export function generateRandomExit(latest: {
  postMoney: number;
  date: Date | string;
}) {
  const roll = Math.random();
  let writeOff = false;
  let multiplier = 0;
  if (roll < 0.3) {
    writeOff = true; // shut down
  } else if (roll < 0.75) {
    multiplier = 0.5 + Math.random() * 1.5; // modest: 0.5×–2× the last round
  } else {
    multiplier = 2 + Math.random() * 8; // home run: 2×–10×
  }
  const exitValue = writeOff
    ? 0
    : Math.max(
        Math.round((latest.postMoney * multiplier) / 500_000) * 500_000,
        500_000
      );

  // 1–4 years after the last round.
  const date = new Date(latest.date);
  date.setDate(date.getDate() + 365 + Math.floor(Math.random() * 1096));

  return { writeOff, exitValue, exitDate: date.toISOString().slice(0, 10) };
}
