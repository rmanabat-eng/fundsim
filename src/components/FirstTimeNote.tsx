"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// A one-time explanation shown where it's needed, until the player clicks
// "Got it" — the just-in-time half of the tutorial. Same storage-as-external-
// store approach as CampaignTutorial's seen flag, so the server render
// (treated as "seen") hydrates cleanly.
function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function FirstTimeNote({ id, children }: { id: string; children: ReactNode }) {
  const key = `fundsim-seen-${id}`;
  const seen = useSyncExternalStore(
    subscribeStorage,
    () => window.localStorage.getItem(key) === "1",
    () => true
  );
  if (seen) return null;
  return (
    <div className="max-chip-box mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed text-white/80">
      <span className="font-black uppercase tracking-widest text-[color:var(--max-cyan)]">
        👋 New:
      </span>{" "}
      {children}{" "}
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(key, "1");
          // "storage" only fires in other tabs on its own; nudge this one.
          window.dispatchEvent(new Event("storage"));
        }}
        className="font-bold text-white underline underline-offset-2"
      >
        Got it
      </button>
    </div>
  );
}
