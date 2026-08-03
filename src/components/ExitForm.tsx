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
      className="max-card space-y-4 max-w-lg rounded-2xl p-6"
      style={{ "--max-card-border": "var(--max-orange)" } as React.CSSProperties}
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
            className="max-chip-box rounded-xl border-2 border-white/15 px-4 py-2 text-sm font-bold text-white/75 transition-all hover:border-[color:var(--max-yellow)] hover:text-[color:var(--max-yellow)]"
          >
            🎲 Randomize an outcome
          </button>
          {random && (
            <p className="mt-2 text-xs text-white/40">
              Rolled{" "}
              <strong className="text-[color:var(--max-yellow)]">
                {writeOff ? "a shutdown" : "an exit"}
              </strong>{" "}
              — click again for a new one, or tweak the fields below.
            </p>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm font-bold text-white/75">
        <input
          type="checkbox"
          name="writeOff"
          value="true"
          checked={writeOff}
          onChange={(e) => setWriteOff(e.target.checked)}
          className="h-4 w-4 rounded border-2 border-white/30 bg-white/5 text-[color:var(--max-magenta)] focus:ring-[color:var(--max-cyan)]"
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
          {pending ? "Saving..." : writeOff ? "Write off company" : "Record exit"}
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
