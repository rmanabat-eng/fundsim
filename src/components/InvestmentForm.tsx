"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SECTORS, STAGES, STAGE_LABELS } from "@/lib/constants";
import type { FormState } from "@/app/actions";

type InvestmentFormValues = {
  companyName: string;
  sector: string;
  stage: string;
  checkSize: number;
  postMoneyValuation: number;
  investmentDate: string;
};

const inputClasses =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-violet-900";

export function InvestmentForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: InvestmentFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="companyName">
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
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="sector">
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

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="stage">
          Stage
        </label>
        <select
          id="stage"
          name="stage"
          required
          defaultValue={defaultValues?.stage ?? ""}
          className={inputClasses}
        >
          <option value="" disabled>
            Select a stage
          </option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300" htmlFor="checkSize">
          Check size (USD)
        </label>
        <input
          id="checkSize"
          name="checkSize"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={defaultValues?.checkSize}
          className={inputClasses}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
          htmlFor="postMoneyValuation"
        >
          Post-money valuation (USD)
        </label>
        <input
          id="postMoneyValuation"
          name="postMoneyValuation"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={defaultValues?.postMoneyValuation}
          className={inputClasses}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
          htmlFor="investmentDate"
        >
          Investment date
        </label>
        <input
          id="investmentDate"
          name="investmentDate"
          type="date"
          required
          defaultValue={defaultValues?.investmentDate}
          className={inputClasses}
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300" role="alert">
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
