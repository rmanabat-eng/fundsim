"use client";

import { useState, useTransition } from "react";
import { deleteAllInvestments } from "@/app/actions";

export function ClearAllButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600">
          Delete every investment? This can&apos;t be undone.
        </span>
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteAllInvestments();
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
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
    >
      Clear all
    </button>
  );
}
