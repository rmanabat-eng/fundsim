"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SECTORS } from "@/lib/constants";
import { RoundFields, inputClasses, labelClasses, type RoundDefaults } from "@/components/RoundFields";
import type { FormState } from "@/app/actions";

export type CompanyFormValues = RoundDefaults & {
  companyName?: string;
  sector?: string;
};

export function CompanyForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: CompanyFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <label className={labelClasses} htmlFor="companyName">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          defaultValue={defaultValues?.companyName}
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="sector">
          Sector
        </label>
        <select
          id="sector"
          name="sector"
          required
          defaultValue={defaultValues?.sector ?? ""}
          className={inputClasses}
        >
          <option value="" disabled>
            Select a sector
          </option>
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Your first round
      </p>

      <RoundFields defaults={defaultValues} checkOptional={false} />

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
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
