"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissScorecard } from "@/app/play/actions";

// Leaving an ended run's scorecard should reset what the homepage offers
// (back to "Start your fund" instead of "See your scorecard"), so this
// swaps in for the plain "← Home" link only on the ended scorecard —
// same useTransition-driven action pattern as EndCampaignButton /
// StartCampaignButton, just navigating home afterward instead of
// re-rendering in place.
export function DismissAndHomeLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await dismissScorecard();
          router.push("/");
        })
      }
      className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white disabled:opacity-50"
    >
      ← Home
    </button>
  );
}
