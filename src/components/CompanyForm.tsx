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
      className="max-card-flat space-y-4 max-w-lg rounded-2xl p-6"
      style={{ "--max-card-border": "var(--max-magenta)" } as React.CSSProperties}
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

      <p className="pt-2 text-xs font-black uppercase tracking-widest text-white/50">
        Your first round
      </p>

      <RoundFields defaults={defaultValues} checkOptional={false} />

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
          href="/"
          className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
