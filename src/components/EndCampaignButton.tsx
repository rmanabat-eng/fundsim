"use client";

import { useState, useTransition } from "react";
import { endCampaign } from "@/app/play/actions";

// Ending the run early is a real decision (you lose the quartile grade,
// which is calibrated to a full-length fund), so it gets the same inline
// confirm step as the other destructive buttons.
export function EndCampaignButton({ year }: { year: number }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        End the fund now at Year {year}? You&apos;ll see your results, but no
        quartile grade since the run didn&apos;t finish.
        <button
          onClick={() => startTransition(() => endCampaign())}
          disabled={pending}
          className="font-bold text-[color:var(--max-orange)] hover:underline disabled:opacity-50"
        >
          {pending ? "Ending..." : "Confirm"}
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
      className="max-btn-outline rounded-full border-4 border-[color:var(--max-orange)] bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold uppercase tracking-wide text-[color:var(--max-orange)] hover:bg-[color:var(--max-orange)]/10"
    >
      End campaign
    </button>
  );
}
