"use client";

import { useTransition } from "react";
import { undoInvestment } from "@/app/play/actions";
import { formatDollars } from "@/lib/fund-math";
import { toast } from "@/components/toast";

// A chip for a first check made this year. Clicking it reverses the
// investment (the pitch returns to the deck) until the year advances.
export function UndoInvestmentButton({
  id,
  name,
  check,
}: {
  id: string;
  name: string;
  check: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await undoInvestment(id);
          toast(`Undid your check in ${name} — pitch is back in the deck`, "info");
        })
      }
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none hover:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-700"
    >
      <span aria-hidden>↩</span>
      <span>
        {pending ? "Undoing…" : "Undo"} {name}
      </span>
      <span className="tabular-nums text-slate-400 dark:text-slate-500">
        {formatDollars(check)}
      </span>
    </button>
  );
}
