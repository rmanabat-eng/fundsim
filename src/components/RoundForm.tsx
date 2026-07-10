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
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
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
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-fuchsia-300 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-fuchsia-700"
          >
            🎲 Randomize a follow-on round
          </button>
          {random && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Rolled{" "}
              <strong className="text-fuchsia-600">
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
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
