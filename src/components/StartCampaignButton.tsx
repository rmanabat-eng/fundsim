"use client";

import { useState, useTransition } from "react";
import { startCampaign } from "@/app/play/actions";

// Starting (or restarting) a campaign wipes the whole portfolio, so it gets
// the same inline confirm step as the other destructive buttons.
export function StartCampaignButton({
  label,
  hasPortfolio,
}: {
  label: string;
  hasPortfolio: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    setConfirming(false);
    startTransition(() => startCampaign());
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        {hasPortfolio
          ? "This clears your current portfolio and deals a fresh fund. Ready?"
          : "Deal the first year's pitches?"}
        <button
          onClick={run}
          className="font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="font-medium text-slate-600 hover:underline dark:text-slate-400"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={pending}
      className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
    >
      {pending ? "Dealing..." : label}
    </button>
  );
}
