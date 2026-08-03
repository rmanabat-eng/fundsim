"use client";

import { useState, useTransition } from "react";
import { deleteRound } from "@/app/actions";

export function DeleteRoundButton({
  roundId,
  companyId,
  isOnlyRound,
}: {
  roundId: string;
  companyId: string;
  isOnlyRound: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <span className="text-xs text-white/60">
          {isOnlyRound ? "Only round — deletes the company too." : "Delete this round?"}
        </span>
        <button
          onClick={() => startTransition(() => deleteRound(roundId, companyId))}
          disabled={pending}
          className="text-xs font-bold text-[color:var(--max-orange)] hover:underline disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-bold text-white/60 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-bold text-[color:var(--max-orange)] hover:underline"
    >
      Delete
    </button>
  );
}
