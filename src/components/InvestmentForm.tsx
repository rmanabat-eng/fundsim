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
    <form action={formAction} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="companyName">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          defaultValue={defaultValues?.companyName}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="sector">
          Sector
        </label>
        <select
          id="sector"
          name="sector"
          required
          defaultValue={defaultValues?.sector ?? ""}
          className="w-full rounded border border-gray-300 px-3 py-2"
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
        <label className="block text-sm font-medium mb-1" htmlFor="stage">
          Stage
        </label>
        <select
          id="stage"
          name="stage"
          required
          defaultValue={defaultValues?.stage ?? ""}
          className="w-full rounded border border-gray-300 px-3 py-2"
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
        <label className="block text-sm font-medium mb-1" htmlFor="checkSize">
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
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="postMoneyValuation">
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
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="investmentDate">
          Investment date
        </label>
        <input
          id="investmentDate"
          name="investmentDate"
          type="date"
          required
          defaultValue={defaultValues?.investmentDate}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          href="/"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
