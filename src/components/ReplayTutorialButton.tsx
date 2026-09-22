"use client";

// Lives in the "⋯ More" menu; CampaignTutorial listens for this event so the
// running tour (a fixed full-screen overlay) can stay mounted at the page's
// top level instead of nested inside a collapsible that might be closed.
export function ReplayTutorialButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("fundsim:replay-tutorial"))}
      className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-white/80 hover:bg-white/5"
    >
      ↻ Replay tutorial
    </button>
  );
}
