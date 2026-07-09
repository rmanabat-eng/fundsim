"use client";

import { useActionState } from "react";
import Link from "next/link";
import { RoundFields, type RoundDefaults } from "@/components/RoundFields";
import type { FormState } from "@/app/actions";

export function RoundForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
  checkOptional,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: RoundDefaults;
  submitLabel: string;
  cancelHref: string;
  checkOptional: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <RoundFields defaults={defaultValues} checkOptional={checkOptional} />

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
