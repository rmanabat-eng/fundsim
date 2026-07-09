import { SECTORS } from "@/lib/constants";

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
