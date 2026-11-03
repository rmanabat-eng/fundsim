"use client";

import { useState, useTransition } from "react";
import { submitToLeaderboard } from "@/app/play/actions";

// Snapshots this ended run into LeaderboardEntry and confirms in place —
// same useTransition-driven pattern as EndCampaignButton, minus the confirm
// step (submitting isn't destructive, unlike ending/restarting a run).
// `alreadySubmitted` comes from the server, so a revisited scorecard shows
// the confirmation instead of offering a second submit.
export function SubmitToLeaderboardButton({ alreadySubmitted }: { alreadySubmitted: boolean }) {
  const [submitted, setSubmitted] = useState(alreadySubmitted);
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
      className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-6 py-3 text-base font-black uppercase tracking-wide text-white disabled:opacity-50"
    >
      {pending ? "Submitting..." : "🏆 Submit to leaderboard"}
    </button>
  );
}
