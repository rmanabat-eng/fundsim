// Real startups with approximate numbers from their actual early rounds.
// Valuations are illustrative teaching examples, not exact cap-table data.
export type StartupPreset = {
  companyName: string;
  sector: string;
  stage: "PRE_SEED" | "SEED" | "SERIES_A";
  raised: number; // total size of the round
  checkSize: number; // your fund's check
  postMoneyValuation: number;
  blurb: string;
};

export const STARTUP_PRESETS: StartupPreset[] = [
  {
    companyName: "Stripe",
    sector: "Fintech",
    stage: "SEED",
    raised: 2_000_000,
    checkSize: 500_000,
    postMoneyValuation: 20_000_000,
    blurb: "Payments infrastructure — 2010 seed round",
  },
  {
    companyName: "Figma",
    sector: "SaaS",
    stage: "SEED",
    raised: 3_800_000,
    checkSize: 400_000,
    postMoneyValuation: 15_000_000,
    blurb: "Collaborative design tool — 2013 seed round",
  },
  {
    companyName: "Airbnb",
    sector: "Other",
    stage: "PRE_SEED",
    raised: 600_000,
    checkSize: 100_000,
    postMoneyValuation: 2_400_000,
    blurb: "Home-sharing marketplace — 2009 Y Combinator era",
  },
  {
    companyName: "Coinbase",
    sector: "Fintech",
    stage: "PRE_SEED",
    raised: 600_000,
    checkSize: 150_000,
    postMoneyValuation: 8_000_000,
    blurb: "Crypto exchange — 2012 pre-seed round",
  },
  {
    companyName: "Watershed",
    sector: "Climate",
    stage: "SEED",
    raised: 5_000_000,
    checkSize: 500_000,
    postMoneyValuation: 25_000_000,
    blurb: "Enterprise carbon accounting — 2020 seed round",
  },
  {
    companyName: "Source Global",
    sector: "Water Tech",
    stage: "SERIES_A",
    raised: 10_000_000,
    checkSize: 750_000,
    postMoneyValuation: 50_000_000,
    blurb: "Solar-powered drinking water panels — Series A",
  },
  {
    companyName: "Hims & Hers",
    sector: "Health",
    stage: "SEED",
    raised: 7_000_000,
    checkSize: 500_000,
    postMoneyValuation: 30_000_000,
    blurb: "Telehealth and wellness — 2017 seed round",
  },
  {
    companyName: "Notion",
    sector: "SaaS",
    stage: "SEED",
    raised: 2_000_000,
    checkSize: 300_000,
    postMoneyValuation: 10_000_000,
    blurb: "All-in-one workspace — 2013 seed round",
  },
];
