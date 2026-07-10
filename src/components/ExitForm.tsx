"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { inputClasses, labelClasses } from "@/components/RoundFields";
import type { FormState } from "@/app/actions";

export function ExitForm({
  action,
  cancelHref,
  defaultValues,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  defaultValues?: { exitValue?: number; exitDate?: string };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [writeOff, setWriteOff] = useState(defaultValues?.exitValue === 0);

  return (
    <form
      action={formAction}
      className="space-y-4 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
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
            defaultValue={defaultValues?.exitValue || undefined}
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
          defaultValue={defaultValues?.exitDate}
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
