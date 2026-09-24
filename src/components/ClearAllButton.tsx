"use client";

import { useState, useTransition } from "react";
import { deleteAllCompanies } from "@/app/actions";

// variant controls only the resting-state button's visual weight: "outline"
// (default) is the loud pill. "menu" is a plain text row for the quiet
// "⋯ More" dropdown — this is a rare, destructive action, not something
// that needs equal billing with "Back a company" every visit.
export function ClearAllButton({ variant = "outline" }: { variant?: "outline" | "menu" }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-white/70">
          Delete every company and round? This can&apos;t be undone.
        </span>
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteAllCompanies();
              setConfirming(false);
            })
          }
          disabled={pending}
          className="rounded-full border-2 border-[color:var(--max-orange)] bg-[color:var(--max-orange)] px-3 py-1.5 text-xs font-black uppercase text-[#0d0d1a] transition-transform hover:scale-105 disabled:opacity-50"
        >
          {pending ? "Clearing..." : "Yes, clear all"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full border-2 border-white/25 px-3 py-1.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={
        variant === "menu"
          ? "w-full rounded-md px-3 py-2 text-left text-xs font-bold text-[color:var(--max-orange)] hover:bg-white/5"
          : "rounded-full border-2 border-[color:var(--max-orange)]/60 px-3 py-1.5 text-xs font-bold text-[color:var(--max-orange)] transition-colors hover:bg-[color:var(--max-orange)]/10"
      }
    >
      Clear all
    </button>
  );
}
