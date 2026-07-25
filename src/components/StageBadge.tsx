import { STAGE_LABELS } from "@/lib/constants";
import { STAGE_STYLES } from "@/lib/badges";

// The colored stage chip — shared so pitch cards and decision cards always
// render a round's stage the same way.
export function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-bold ring-1 ring-inset ${STAGE_STYLES[stage] ?? ""}`}
    >
      {STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}
    </span>
  );
}
