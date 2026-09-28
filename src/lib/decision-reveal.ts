import { getReputationScore } from "@/app/play/actions";

// Measures the real reputation swing a decision's resolution caused, by
// diffing the DB-derived score before/after — not a hardcoded per-type
// guess, since some outcomes (e.g. a "costly" refusal) depend on hidden
// state the player never sees.
export async function withRepDelta<T>(fn: () => Promise<T>): Promise<{ result: T; delta: number }> {
  const before = await getReputationScore();
  const result = await fn();
  const after = await getReputationScore();
  return { result, delta: after - before };
}

export function repSuffix(delta: number): string {
  if (delta === 0) return " — reputation unchanged";
  return ` — reputation ${delta > 0 ? "+" : ""}${delta}`;
}
