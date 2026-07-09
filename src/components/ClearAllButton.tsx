"use client";

import { useState, useTransition } from "react";
import { deleteAllCompanies } from "@/app/actions";

export function ClearAllButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          Delete every company and round? This can&apos;t be undone.
        </span>
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteAllCompanies();
              setConfirming(false);
            })
          }
          disabled={pending}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
        >
          {pending ? "Clearing..." : "Yes, clear all"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
    >
      Clear all
    </button>
  );
}
