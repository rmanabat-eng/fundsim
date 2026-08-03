"use client";

import { useState, useTransition } from "react";
import { quitCampaign } from "@/app/play/actions";

// Quitting wipes the run same as starting a new one, so it gets the same
// inline confirm step as the other destructive buttons.
export function QuitCampaignButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        End this run for good?
        <button
          onClick={() => startTransition(() => quitCampaign())}
          disabled={pending}
          className="font-bold text-[color:var(--max-orange)] hover:underline disabled:opacity-50"
        >
          {pending ? "Quitting..." : "Confirm"}
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
      className="rounded-full border-2 border-[color:var(--max-orange)]/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--max-orange)] hover:bg-[color:var(--max-orange)]/10"
    >
      Quit campaign
    </button>
  );
}
