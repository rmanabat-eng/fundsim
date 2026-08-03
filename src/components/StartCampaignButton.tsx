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
      <span className="flex flex-wrap items-center gap-2 text-sm text-white/75">
        {hasPortfolio
          ? "This clears your current portfolio and deals a fresh fund. Ready?"
          : "Deal the first year's pitches?"}
        <button
          onClick={run}
          className="font-bold text-[color:var(--max-cyan)] hover:underline"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="font-bold text-white/60 hover:underline"
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
      className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-6 py-3 text-base font-black uppercase tracking-wide text-white disabled:opacity-50"
    >
      {pending ? "Dealing..." : label}
    </button>
  );
}
