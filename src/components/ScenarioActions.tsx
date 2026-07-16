"use client";

import { useState, useTransition } from "react";
import { loadScenario, deleteScenario } from "@/app/actions";

export function ScenarioActions({ id }: { id: string }) {
  const [confirming, setConfirming] = useState<"load" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {confirming === "load"
            ? "Replace your current portfolio with this snapshot?"
            : "Delete this scenario?"}
        </span>
        <button
          onClick={() =>
            startTransition(() =>
              confirming === "load" ? loadScenario(id) : deleteScenario(id)
            )
          }
          disabled={pending}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
        >
          {pending ? "Working..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(null)}
          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={() => setConfirming("load")}
        className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        Load
      </button>
      <button
        onClick={() => setConfirming("delete")}
        className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}
