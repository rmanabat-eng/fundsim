"use client";

import { useState, useTransition } from "react";
import { startCampaign } from "@/app/play/actions";

// Starting (or restarting) a campaign wipes the whole portfolio, so it gets
// the same inline confirm step as the other destructive buttons.
//
// variant controls only the resting-state button's visual weight:
// "primary" (default) is the one-big-payoff-CTA treatment used on the title
// screen and the scorecard. "outline" matches it to a same-weight sibling
// button elsewhere (e.g. End Campaign in the active-run header) instead of
// dominating the screen as a second hero button.
export function StartCampaignButton({
  label,
  hasPortfolio,
  variant = "primary",
}: {
  label: string;
  hasPortfolio: boolean;
  variant?: "primary" | "outline";
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
      className={
        variant === "outline"
          ? "max-btn-outline rounded-full border-4 border-[color:var(--max-magenta)] bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[color:var(--max-magenta)] hover:bg-[color:var(--max-magenta)]/10 disabled:opacity-50"
          : "max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-6 py-3 text-base font-black uppercase tracking-wide text-white disabled:opacity-50"
      }
    >
      {pending ? "Dealing..." : label}
    </button>
  );
}
