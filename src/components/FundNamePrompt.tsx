"use client";

import { useEffect, useState, useTransition } from "react";
import { updateFundName } from "@/app/play/actions";

// A one-time nudge to name the fund, shown right after a fresh campaign
// starts (year 1, still on the default name). Modeled on CampaignTutorial's
// dismissible overlay — same fixed, dimmed, role="dialog" treatment — but
// with no tour steps to track, just a single dismiss-on-save flag kept in
// sessionStorage so it doesn't nag again this tab session. Reappearing after
// a hard refresh is an accepted edge case.
export function FundNamePrompt({ gameId }: { gameId: string }) {
  const STORAGE_KEY = `fundsim-fund-name-prompted-${gameId}`;
  const [dismissed, setDismissed] = useState(true);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function dismiss() {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  function save() {
    startTransition(() => updateFundName(name));
    dismiss();
  }

  if (dismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Name your fund"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div aria-hidden className="absolute inset-0 bg-[#0d0d1a]/85" onClick={dismiss} />
      <div
        className="max-card relative w-full max-w-sm rounded-2xl p-5"
        style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
      >
        <h3 className="font-display text-lg font-bold text-white">
          🚀 Name your fund
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your fund..."
          autoFocus
          className="mt-3 w-full rounded-full border-2 border-white/25 bg-[#2d1b4e]/60 px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--max-cyan)] focus:outline-none"
        />
        <p className="mt-2 text-xs text-white/50">
          This name may show up on the public leaderboard if you choose to
          submit your score at the end of the run.
        </p>
        <div className="mt-4 flex justify-end gap-3 text-sm">
          <button
            onClick={dismiss}
            className="font-bold text-white/60 hover:underline"
          >
            Skip
          </button>
          <button
            onClick={save}
            disabled={pending}
            className="font-bold text-[color:var(--max-cyan)] hover:underline disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
