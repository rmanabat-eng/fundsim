"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inputClasses, labelClasses } from "@/components/RoundFields";
import { updateSettings } from "@/app/actions";

export function SettingsForm({
  fundSize,
  maxCompanies,
}: {
  fundSize: number;
  maxCompanies: number;
}) {
  const [state, formAction, pending] = useActionState(updateSettings, null);

  return (
    <form
      action={formAction}
      className="max-card space-y-4 max-w-lg rounded-2xl p-6"
      style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
    >
      <div>
        <label className={labelClasses} htmlFor="fundSize">
          Fund size (USD) — total committed capital
        </label>
        <input
          id="fundSize"
          name="fundSize"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={fundSize}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-white/40">
          Can&apos;t go below what you&apos;ve already deployed.
        </p>
      </div>

      <div>
        <label className={labelClasses} htmlFor="maxCompanies">
          Max companies — how many bets the fund can make
        </label>
        <input
          id="maxCompanies"
          name="maxCompanies"
          type="number"
          min="1"
          max="50"
          step="1"
          required
          defaultValue={maxCompanies}
          className={inputClasses}
        />
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
          {pending ? "Saving..." : "Save settings"}
        </button>
        <Link
          href="/"
          className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
