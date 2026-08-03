import facts from "@/lib/facts.json";

export type Category =
  | "Team & Founders"
  | "Market & Competition"
  | "Product & Tech"
  | "Financials & Traction"
  | "Legal & Governance"
  | "Culture & Ops";

export type NumberType = "none" | "range" | "tiered_list";

export type RangeConfig = { min: number; max: number; unit: string; step?: number };
export type TieredListConfig = { options: Record<string, string | number>[] };

export type Fact = {
  id: string;
  category: Category;
  text_template: string;
  number_type: NumberType;
  number_config?: RangeConfig | TieredListConfig;
  sentiment_tag: "positive" | "negative" | "neutral_ambiguous";
};

export const FACT_POOL: Fact[] = facts as Fact[];

// Pairs of fact ids that should never appear together on the same card
// because one contradicts or implies the negation of the other. Add more
// pairs here as new facts are added to the pool.
export const EXCLUSION_PAIRS: [string, string][] = [
  ["fin-no-revenue", "fin-unit-economics-scale"],
  ["fin-no-revenue", "fin-valuation-jump-flat-revenue"],
  ["team-first-time-founders", "team-repeat-founder-exits"],
];

function conflicts(chosen: Fact[], candidate: Fact): boolean {
  return EXCLUSION_PAIRS.some(
    ([a, b]) =>
      (a === candidate.id && chosen.some((f) => f.id === b)) ||
      (b === candidate.id && chosen.some((f) => f.id === a))
  );
}

export function fillTemplate(fact: Fact): string {
  if (fact.number_type === "none" || !fact.number_config) return fact.text_template;

  const values: Record<string, string | number> = {};
  if (fact.number_type === "range") {
    const { min, max, unit, step = 1 } = fact.number_config as RangeConfig;
    const steps = Math.floor((max - min) / step);
    const n = min + step * Math.floor(Math.random() * (steps + 1));
    values.n = unit ? `${round1(n)}` : `${round1(n)}`;
  } else {
    const { options } = fact.number_config as TieredListConfig;
    Object.assign(values, options[Math.floor(Math.random() * options.length)]);
  }

  return fact.text_template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// 3 (20%), 4 (50%), 5 (30%)
function pickFactCount(): number {
  const roll = Math.random();
  if (roll < 0.2) return 3;
  if (roll < 0.7) return 4;
  return 5;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Draw a random set of non-contradictory facts (3-5, weighted per
// pickFactCount) without filling in their templates yet — callers that need
// the underlying Fact (e.g. campaign.ts, to derive hidden quality from
// sentiment_tag) use this; generateCard() below is the text-only shortcut.
export function drawFacts(pool: Fact[] = FACT_POOL): Fact[] {
  const count = pickFactCount();
  const shuffled = shuffle(pool);
  const chosen: Fact[] = [];

  for (const fact of shuffled) {
    if (chosen.length >= count) break;
    if (conflicts(chosen, fact)) continue;
    chosen.push(fact);
  }

  return chosen;
}

export const SENTIMENT_WEIGHT: Record<Fact["sentiment_tag"], number> = {
  positive: 0.2,
  negative: -0.2,
  neutral_ambiguous: 0,
};

export function generateCard(pool: Fact[] = FACT_POOL): string[] {
  return drawFacts(pool).map(fillTemplate);
}
