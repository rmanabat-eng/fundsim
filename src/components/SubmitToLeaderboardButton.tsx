"use client";

import { useState, useTransition } from "react";
import { submitToLeaderboard } from "@/app/play/actions";

// Snapshots this ended run into LeaderboardEntry. No leaderboard UI exists
// yet to navigate to, so this just confirms in place — same
// useTransition-driven pattern as EndCampaignButton, minus the confirm step
// (submitting isn't destructive, unlike ending/restarting a run).
//
// Known gap: nothing here stops a second submission if this scorecard is
// reached again before being dismissed (e.g. back button) — this component
// only tracks "submitted" for its own mounted lifetime, not durably.
export function SubmitToLeaderboardButton() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (submitted) {
    return (
      <span className="max-btn-outline inline-flex items-center gap-2 rounded-full border-4 border-[color:var(--max-cyan)] bg-[#2d1b4e]/60 px-6 py-3 text-base font-bold uppercase tracking-wide text-[color:var(--max-cyan)]">
        ✅ Submitted!
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await submitToLeaderboard();
          setSubmitted(true);
        })
      }
      className="max-btn-outline rounded-full border-4 border-[color:var(--max-cyan)] bg-[#2d1b4e]/60 px-6 py-3 text-base font-bold uppercase tracking-wide text-[color:var(--max-cyan)] hover:bg-[color:var(--max-cyan)]/10 disabled:opacity-50"
    >
      {pending ? "Submitting..." : "🏆 Submit to leaderboard"}
    </button>
  );
}
