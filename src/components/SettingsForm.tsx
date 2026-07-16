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
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
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
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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
          {pending ? "Saving..." : "Save settings"}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
