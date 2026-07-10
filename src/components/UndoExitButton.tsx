"use client";

import { useState, useTransition } from "react";
import { undoExit } from "@/app/actions";

export function UndoExitButton({ companyId }: { companyId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          Reopen this position?
        </span>
        <button
          onClick={() => startTransition(() => undoExit(companyId))}
          disabled={pending}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
        >
          {pending ? "Undoing..." : "Confirm"}
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
      Undo exit
    </button>
  );
}
