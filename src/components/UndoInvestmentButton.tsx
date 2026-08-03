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
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[color:var(--max-magenta)]/50 bg-[#2d1b4e]/50 px-3 py-1 text-xs font-semibold text-white/85 outline-none backdrop-blur-sm hover:border-[color:var(--max-orange)] focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)] disabled:opacity-50"
    >
      <span aria-hidden>↩</span>
      <span>
        {pending ? "Undoing…" : "Undo"} {name}
      </span>
      <span className="tabular-nums text-white/50">
        {formatDollars(check)}
      </span>
    </button>
  );
}
