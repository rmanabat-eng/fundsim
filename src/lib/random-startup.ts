import { SECTORS, STAGES } from "@/lib/constants";

type Sector = (typeof SECTORS)[number];
type RealisticDescription = { what: string; who: string };

// Cosmetic flavor text only — never affects `quality` or any game math.
// 60% of generated startups draw from REALISTIC, 40% from FUN.
const REALISTIC_DESCRIPTIONS: Record<Sector, RealisticDescription[]> = {
  "Water Tech": [
    { what: "sensors that detect pipe leaks before they flood", who: "municipal utilities" },
    { what: "solar-powered desalination units", who: "coastal communities" },
    { what: "recycles industrial wastewater into drinking-grade water", who: "factories cutting waste" },
    { what: "modular filtration systems", who: "off-grid villages" },
    { what: "smart irrigation systems that cut water use", who: "large farms" },
    { what: "real-time reservoir monitoring", who: "regional water authorities" },
    { what: "affordable rainwater harvesting kits", who: "drought-prone regions" },
    { what: "AI models predicting water main failures", who: "city infrastructure teams" },
    { what: "compact water purification units", who: "disaster relief orgs" },
    { what: "membrane tech for cheaper desalination", who: "water-scarce nations" },
    { what: "leak-detection software", who: "property managers" },
    { what: "portable filtration devices", who: "remote field workers" },
  ],
  Climate: [
    { what: "real-time corporate emissions tracking", who: "sustainability teams" },
    { what: "CO2-to-building-materials", who: "construction" },
    { what: "climate risk pricing software", who: "insurers" },
    { what: "batteries from recycled EV packs", who: "grid storage" },
    { what: "satellite deforestation monitoring", who: "conservation nonprofits" },
    { what: "direct-air-capture units", who: "industrial emitters" },
    { what: "drought-resistant crop seeds", who: "farmers" },
    { what: "supply chain carbon accounting", who: "manufacturers" },
    { what: "low-carbon cement", who: "construction" },
    { what: "flood-risk prediction", who: "municipal planners" },
    { what: "community solar subscriptions", who: "renters" },
    { what: "landfill methane capture", who: "waste management" },
  ],
  SaaS: [
    { what: "invoice reconciliation automation", who: "finance teams" },
    { what: "AI support copilot", who: "customer service" },
    { what: "spreadsheet-to-dashboard tool", who: "ops managers" },
    { what: "field service scheduling", who: "logistics" },
    { what: "compliance tracking", who: "healthcare admins" },
    { what: "onboarding automation", who: "HR" },
    { what: "no-code workflow tools", who: "small businesses" },
    { what: "inventory management", who: "e-commerce" },
    { what: "real-time collaboration tools", who: "engineering teams" },
    { what: "contract review automation", who: "legal" },
    { what: "marketing analytics dashboards", who: "growth teams" },
    { what: "API monitoring", who: "DevOps" },
  ],
  Fintech: [
    { what: "same-day payouts for small businesses", who: "underbanked merchants" },
    { what: "embedded lending", who: "marketplace sellers" },
    { what: "expense report automation", who: "mid-size companies" },
    { what: "instant invoice-to-cash", who: "gig workers" },
    { what: "fraud detection", who: "e-commerce" },
    { what: "automated small-business tax filing", who: "solo entrepreneurs" },
    { what: "global payroll infrastructure", who: "remote teams" },
    { what: "credit scoring for thin-file borrowers", who: "emerging markets" },
    { what: "accounts payable automation", who: "finance teams" },
    { what: "round-up savings app", who: "young professionals" },
    { what: "embedded checkout insurance", who: "retailers" },
    { what: "treasury management", who: "startups" },
  ],
  Health: [
    { what: "video specialist access", who: "rural patients" },
    { what: "AI drug-interaction alerts", who: "hospital pharmacies" },
    { what: "remote monitoring wearables", who: "chronic illness patients" },
    { what: "prior-auth paperwork automation", who: "clinic staff" },
    { what: "hospital scheduling software", who: "admins" },
    { what: "AI-assisted diagnostic imaging", who: "radiologists" },
    { what: "teletherapy platforms", who: "underserved communities" },
    { what: "medication adherence tracking", who: "elderly patients" },
    { what: "clinical trial matching", who: "cancer patients" },
    { what: "at-home diagnostic kits", who: "primary care" },
    { what: "EHR interoperability tools", who: "hospital IT" },
    { what: "postpartum care coordination", who: "new parents" },
  ],
  Other: [
    { what: "niche collectibles marketplace", who: "hobbyist collectors" },
    { what: "warehouse-picking robotics", who: "logistics companies" },
    { what: "specialty coffee subscription box", who: "coffee enthusiasts" },
    { what: "tools for indie game developers", who: "solo studios" },
    { what: "last-mile delivery logistics software", who: "regional couriers" },
    { what: "freelance creative marketplace infrastructure", who: "agencies" },
    { what: "modular apartment furniture", who: "urban renters" },
    { what: "gym/studio scheduling software", who: "fitness businesses" },
    { what: "property management software", who: "small landlords" },
    { what: "event ticketing tools", who: "independent venues" },
  ],
};

const FUN_DESCRIPTIONS: Record<Sector, string[]> = {
  "Water Tech": [
    "judgmental smart water bottle",
    "peer-pressure-powered desalination",
    "texting houseplants",
    "water cooler gossip as energy source",
    "shower head that requires singing in tune",
    "complaining gutters",
    "roommate dish-duty peace treaties",
    "rainwater with tasting notes",
    "motivational-speech sprinklers",
    "forgetful lawn moisture sensors",
    "encouraging humidifier",
    "leak-detection leaderboard",
    "passive-aggressive floating gardens",
    "guilt-based car wash pricing",
    "apology-note ice cubes",
    "\"told you so\" rain gauge",
  ],
  Climate: [
    "carbon-certificate pigeons",
    "guilt-tripping thermostat",
    "Instagramming compost bins",
    "tree-hugging carbon credits",
    "only-good-news weather app",
    "kindness-charged solar panels",
    "recycling-shaming app",
    "song-humming wind turbines",
    "vague carbon calculator",
    "ex-named tree planting",
    "landlord-negotiating thermostat",
    "guilt-trip reusable straws",
    "cart-shaming shopping app",
    "symbolic glacier adoption subscription",
    "idea-composting AI",
    "reporting solar garden gnomes",
  ],
  SaaS: [
    "blame-assigning project tool",
    "deadline-excuse generator",
    "vibes-only auto-reply",
    "passive-aggressive calendar",
    "\"per my last message\" bot",
    "grudge-holding CRM",
    "unwanted-meeting scheduler",
    "jargon translator",
    "real-time shame time-tracker",
    "infinitely patient answerless helpdesk",
    "vibes-based KPI dashboard",
    "unprompted LinkedIn thought leadership",
    "charge-by-tangent meetings",
    "drama-predicting org chart",
    "lie-flagging email client",
    "guilt-spiral to-do list",
  ],
  Fintech: [
    "vending-machine micro-investing",
    "appetizer-based bill splitting",
    "tip-based credit score",
    "compliment-repaid microloans",
    "mom-texting budgeting app",
    "proof-of-adulting savings account",
    "ex-billing Venmo requests",
    "vibes-backed crypto",
    "unsolicited-advice rewards card",
    "coffee-roasting expense tracker",
    "guilt-based checkout donations",
    "apology-contingent overdraft protection",
    "\"buy the dip forever\" robo-advisor",
    "dish-duty rent splitter",
    "houseplant-cosigned loans",
    "spending-live-tweeting piggy bank",
  ],
  Health: [
    "vegetable-pushing AI nutritionist",
    "relentless stand-up nagging smartwatch",
    "hypochondriac walking buddy matcher",
    "overconfident-intern telehealth",
    "dream-rating pillow",
    "disappointed-parent meditation app",
    "worst-case AI symptom checker",
    "honesty-judging toothbrush",
    "snack-step fitness tracker",
    "3am insomniac accountability texts",
    "interpretive-dance therapy",
    "supportive-metaphor scale",
    "optimism vitamins",
    "blink-reminder app",
    "lo-fi beat stethoscope",
    "aggressively marketed nap retreat",
  ],
  Other: [
    "AI agents arguing with your other AI agents",
    "dog dating app matched by walk schedule",
    "AI that quits your job politely",
    "emotional support animal rentals",
    "livestreamed goldfish speed-dating",
    "houseplant social network",
    "guilt-feeling AI proxy",
    "mystery leftovers subscription box",
    "audiobook-matched trucker network",
    "cat \"likes\" via keyboard walking",
    "AI apology note generator",
    "parking-dispute-negotiating AI",
    "houseplant dating app",
    "group-chat AI impersonator",
    "professional napper rental service",
    "compliment-conditional laundry robot",
    "pigeon-to-park-bench matcher",
    "consensual embarrassing childhood photo NFTs",
  ],
};

function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

// 60% realistic (what + who, one sentence), 40% fun (standalone one-liner).
export function randomDescription(sector: string): string {
  const realistic = REALISTIC_DESCRIPTIONS[sector as Sector];
  const fun = FUN_DESCRIPTIONS[sector as Sector];
  if (Math.random() < 0.6) {
    const d = pick(realistic);
    return `${capitalize(d.what)}, for ${d.who}.`;
  }
  return `${capitalize(pick(fun))}.`;
}

const NAME_PREFIXES = [
  "Nimbus", "Quanta", "Hyper", "Loop", "Verdant", "Pulse", "Atlas", "Ember",
  "Drift", "Nova", "Zephyr", "Mint", "Forge", "Cobalt", "Lumen", "Solstice",
  "Vector", "Halo", "Onyx", "Aurora", "Cinder", "Basalt", "Wren", "Fathom",
  "Amber", "Kestrel", "Tundra", "Slate", "Ridge", "Marrow", "Quill", "Echo",
  "Copper", "Thistle", "Granite", "Falcon", "Delta", "Ion", "Prism", "Rove",
  "Meadow", "Harbor", "Summit", "Cascade", "Orbit", "Frostline",
];

const NAME_SUFFIXES = [
  "Labs", "AI", "Flow", "Stack", "Works", "Grid", "Metrics", "Base",
  "Sense", "Hub", "Pilot", "Layer", "Signal", "Path", "Forge", "Bridge",
  "Field", "Loop", "Node", "Systems", "Robotics", "Dynamics", "Wave",
  "Point", "Vault", "Chain", "Depot", "Circuit", "Beacon", "Anchor",
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

  const sector = pick(SECTORS) as string;

  return {
    companyName: `${prefix}${suffix}`,
    sector,
    stage,
    raised,
    checkSize,
    postMoneyValuation,
    investmentDate: date.toISOString().slice(0, 10),
    description: randomDescription(sector),
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
