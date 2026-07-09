"use client";

import { useState, useTransition } from "react";
import { deleteInvestment } from "@/app/actions";

export function DeleteInvestmentButton({
  id,
  companyName,
}: {
  id: string;
  companyName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-slate-600 dark:text-slate-400">Delete {companyName}?</span>
        <button
          onClick={() => startTransition(() => deleteInvestment(id))}
          disabled={pending}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
    >
      Delete
    </button>
  );
}
