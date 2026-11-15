import { STAGE_LABELS } from "@/lib/constants";
import { Term } from "@/components/Term";

// The colored stage chip on the campaign screen's pitch and decision cards.
// Only used there (company pages read STAGE_STYLES directly for their own
// light-themed chip), so it's free to commit fully to the maximalist accents
// instead of sharing that palette.
const MAX_STAGE_STYLES: Record<string, string> = {
  PRE_SEED: "bg-[color:var(--max-yellow)]/20 text-[color:var(--max-yellow)] ring-[color:var(--max-yellow)]",
  SEED: "bg-[color:var(--max-cyan)]/20 text-[color:var(--max-cyan)] ring-[color:var(--max-cyan)]",
  SERIES_A: "bg-[color:var(--max-purple)]/20 text-[color:var(--max-purple)] ring-[color:var(--max-purple)]",
  SERIES_B: "bg-[color:var(--max-magenta)]/20 text-[color:var(--max-magenta)] ring-[color:var(--max-magenta)]",
  SERIES_C: "bg-[color:var(--max-orange)]/20 text-[color:var(--max-orange)] ring-[color:var(--max-orange)]",
};

// What each stage means for someone who has never seen the names before.
const STAGE_HINTS: Record<string, string> = {
  PRE_SEED:
    "Pre-seed: the very first money in — often just founders and an idea. Cheapest to buy into, and the riskiest.",
  SEED: "Seed: an early company with a first product and few customers. Still cheap, still very risky.",
  SERIES_A:
    "Series A: the product works and customers are paying. Now the company has to prove it can grow.",
  SERIES_B:
    "Series B: a growing business raising money to get much bigger. Costs more to buy into, and is less risky.",
  SERIES_C:
    "Series C: a large, established startup, often heading toward being sold or going public.",
};

// The colored stage chip — shared so pitch cards and decision cards always
// render a round's stage the same way. Hover, focus or tap explains the stage.
export function StageBadge({ stage }: { stage: string }) {
  const chip = (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-bold ring-1 ring-inset ${MAX_STAGE_STYLES[stage] ?? "bg-white/10 text-white ring-white/30"}`}
    >
      {STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}
    </span>
  );
  return STAGE_HINTS[stage] ? <Term def={STAGE_HINTS[stage]}>{chip}</Term> : chip;
}
