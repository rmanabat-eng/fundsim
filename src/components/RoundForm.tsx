"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { RoundFields, type RoundDefaults } from "@/components/RoundFields";
import { generateRandomFollowOn } from "@/lib/random-startup";
import type { FormState } from "@/app/actions";

export function RoundForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
  checkOptional,
  randomizeFrom,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: RoundDefaults;
  submitLabel: string;
  cancelHref: string;
  checkOptional: boolean;
  // Latest round of the company, when offering a randomized follow-on.
  randomizeFrom?: { stage: string; postMoney: number; date: string };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [random, setRandom] = useState<{
    values: RoundDefaults;
    nonce: number;
  } | null>(null);

  return (
    <form
      action={formAction}
      className="max-card space-y-4 max-w-lg rounded-2xl p-6"
      style={{ "--max-card-border": "var(--max-magenta)" } as React.CSSProperties}
    >
      {randomizeFrom && (
        <div>
          <button
            type="button"
            onClick={() =>
              setRandom({
                values: generateRandomFollowOn(randomizeFrom),
                nonce: Date.now(),
              })
            }
            className="max-chip-box rounded-xl border-2 border-white/15 px-4 py-2 text-sm font-bold text-white/75 transition-all hover:border-[color:var(--max-yellow)] hover:text-[color:var(--max-yellow)]"
          >
            🎲 Randomize a follow-on round
          </button>
          {random && (
            <p className="mt-2 text-xs text-white/40">
              Rolled{" "}
              <strong className="text-[color:var(--max-yellow)]">
                {random.values.yourCheck === 0
                  ? "a round you sat out"
                  : "a round you follow on in"}
              </strong>{" "}
              — click again for a new one, or tweak the fields below.
            </p>
          )}
        </div>
      )}

      <RoundFields
        key={random ? `random-${random.nonce}` : "default"}
        defaults={random?.values ?? defaultValues}
        checkOptional={checkOptional}
      />

      {state?.error && (
        <p
          className="rounded-lg border-2 border-[color:var(--max-orange)] bg-[color:var(--max-orange)]/15 px-3 py-2 text-sm text-[color:var(--max-orange)]"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
