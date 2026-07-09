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

// Plausible deal ranges per stage: [min post-money, max post-money, min check, max check]
const STAGE_RANGES: Record<(typeof STAGES)[number], [number, number, number, number]> = {
  PRE_SEED: [2_000_000, 8_000_000, 50_000, 250_000],
  SEED: [8_000_000, 30_000_000, 200_000, 750_000],
  SERIES_A: [25_000_000, 80_000_000, 500_000, 1_500_000],
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number, roundTo: number): number {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / roundTo) * roundTo;
}

export function generateRandomStartup() {
  let prefix = pick(NAME_PREFIXES);
  let suffix = pick(NAME_SUFFIXES);
  while (suffix.toLowerCase() === prefix.toLowerCase()) {
    suffix = pick(NAME_SUFFIXES);
  }

  const stage = pick(STAGES);
  const [minPost, maxPost, minCheck, maxCheck] = STAGE_RANGES[stage];
  const postMoneyValuation = randomBetween(minPost, maxPost, 500_000);
  const checkSize = randomBetween(minCheck, maxCheck, 25_000);

  // Random date within the past 2 years
  const daysAgo = Math.floor(Math.random() * 730);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return {
    companyName: `${prefix}${suffix}`,
    sector: pick(SECTORS) as string,
    stage,
    checkSize,
    postMoneyValuation,
    investmentDate: date.toISOString().slice(0, 10),
  };
}
