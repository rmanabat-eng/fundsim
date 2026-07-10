"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { inputClasses, labelClasses } from "@/components/RoundFields";
import { generateRandomExit } from "@/lib/random-startup";
import type { FormState } from "@/app/actions";

export function ExitForm({
  action,
  cancelHref,
  defaultValues,
  randomizeFrom,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  defaultValues?: { exitValue?: number; exitDate?: string };
  // The company's last round, when offering a randomized outcome.
  randomizeFrom?: { postMoney: number; date: string };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [writeOff, setWriteOff] = useState(defaultValues?.exitValue === 0);
  const [random, setRandom] = useState<{
    values: { exitValue: number; exitDate: string };
    nonce: number;
  } | null>(null);

  const fieldDefaults = random?.values ?? defaultValues;

  return (
    <form
      action={formAction}
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {randomizeFrom && (
        <div>
          <button
            type="button"
            onClick={() => {
              const r = generateRandomExit(randomizeFrom);
              setWriteOff(r.writeOff);
              setRandom({
                values: { exitValue: r.exitValue, exitDate: r.exitDate },
                nonce: Date.now(),
              });
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-fuchsia-300 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-fuchsia-700"
          >
            🎲 Randomize an outcome
          </button>
          {random && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Rolled{" "}
              <strong className="text-fuchsia-600">
                {writeOff ? "a shutdown" : "an exit"}
              </strong>{" "}
              — click again for a new one, or tweak the fields below.
            </p>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="writeOff"
          value="true"
          checked={writeOff}
          onChange={(e) => setWriteOff(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        />
        Write-off — the company shut down and the stake is worth $0
      </label>

      <div key={random ? `random-${random.nonce}` : "default"} className="space-y-4">
        {!writeOff && (
          <div>
            <label className={labelClasses} htmlFor="exitValue">
              Exit valuation (USD) — what the whole company sold or IPO&apos;d for
            </label>
            <input
              id="exitValue"
              name="exitValue"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={fieldDefaults?.exitValue || undefined}
              className={inputClasses}
            />
          </div>
        )}

        <div>
          <label className={labelClasses} htmlFor="exitDate">
            Exit date
          </label>
          <input
            id="exitDate"
            name="exitDate"
            type="date"
            required
            defaultValue={fieldDefaults?.exitDate}
            className={inputClasses}
          />
        </div>
      </div>

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
          {pending ? "Saving..." : writeOff ? "Write off company" : "Record exit"}
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
