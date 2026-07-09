export const FUND_SIZE = 10_000_000;

export const SECTORS = [
  "Water Tech",
  "Climate",
  "SaaS",
  "Fintech",
  "Health",
  "Other",
] as const;

export const STAGES = ["PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "SERIES_C"] as const;

export const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  PRE_SEED: "Pre-Seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
};
