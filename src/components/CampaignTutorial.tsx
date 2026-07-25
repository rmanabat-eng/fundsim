"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

// A first-run coach-mark tour: it spotlights the real year-1 UI rather than
// describing it in the abstract. Steps whose target isn't on the page (no
// deals dealt, say) drop out, so the tour never points at nothing.

const STORAGE_KEY = "fundsim-tutorial-seen";

type Step = {
  target: string | null; // data-tour value; null renders centered
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    target: null,
    title: "👋 You're the GP",
    body: "You run this fund for 10 years: write checks, back your winners, and get graded like a real venture capitalist at the end. Quick tour of your desk?",
  },
  {
    target: "year-pips",
    title: "⏳ The 10-year clock",
    body: "One pip per year. New pitches only come during years 1–5 — the investment period. After that the checkbook closes to new names and you just manage what you own.",
  },
  {
    target: "market",
    title: "🌤️ This year's weather",
    body: "The market mood shifts each year. Bull markets lift valuations and exits; bear markets push them down and kill weak companies faster. Same weather for everyone — you just play it.",
  },
  {
    target: "hud",
    title: "📊 Your fund at a glance",
    body: "Dry powder is what's left to deploy — exits don't refill it. Reputation tracks how founders talk about you. Any label with a dotted underline explains itself when you hover or tab to it.",
  },
  {
    target: "deal-signals",
    title: "🔎 Read the signals",
    body: "Every pitch shows three clues. Some genuinely predict success, some are noise, some are red flags — and the link is deliberately fuzzy, so a great-looking pitch still busts sometimes. The patterns only show up across several runs.",
  },
  {
    target: "deal-check",
    title: "💸 Size your check",
    body: "Drag to set your check. The percentage is what that buys you — your check ÷ the post-money valuation. Bigger checks mean more ownership but fewer bets, and you only get one fund.",
  },
  {
    target: "advance-year",
    title: "⏩ Roll the year",
    body: "When you're done, advance. The world rolls: companies raise, exit, or die. Anything you left unanswered expires — and ignoring founders costs you reputation, more than a straight no would.",
  },
  {
    target: null,
    title: "🚀 That's the game",
    body: "Deploy carefully, keep some powder dry for follow-ons, and answer your desk. Good luck — you can read the full strategy guide any time from the home page.",
  },
];

// Read the "already seen" flag through an external store rather than an
// effect, so the server render ("unknown" → render nothing) hydrates cleanly.
function subscribeSeen(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
const readSeen = () =>
  window.localStorage.getItem(STORAGE_KEY) === "1" ? "seen" : "unseen";
const readSeenOnServer = () => "unknown" as const;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function CampaignTutorial() {
  const seen = useSyncExternalStore(subscribeSeen, readSeen, readSeenOnServer);
  // Skip/replay override what storage says, for this page view.
  const [override, setOverride] = useState<"running" | "dismissed" | null>(null);
  const status =
    override ??
    (seen === "unknown" ? "loading" : seen === "seen" ? "dismissed" : "running");
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardH, setCardH] = useState(230);

  // Only keep steps whose target actually rendered this year.
  const steps = useMemo(() => {
    if (status === "loading") return STEPS;
    return STEPS.filter(
      (s) => s.target === null || document.querySelector(`[data-tour="${s.target}"]`)
    );
  }, [status]);

  const step = steps[Math.min(index, steps.length - 1)];

  const finish = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOverride("dismissed");
  }, []);

  const replay = useCallback(() => {
    setIndex(0);
    setOverride("running");
  }, []);

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Bring the target into view, then measure once it's settled.
  useEffect(() => {
    if (status !== "running") return;
    if (step?.target) {
      document
        .querySelector(`[data-tour="${step.target}"]`)
        ?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "center",
        });
    } else {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    const id = window.setTimeout(measure, prefersReducedMotion() ? 0 : 320);
    return () => window.clearTimeout(id);
  }, [status, step, measure]);

  useEffect(() => {
    if (status !== "running") return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [status, measure]);

  const last = index >= steps.length - 1;
  const next = useCallback(() => {
    if (last) finish();
    else setIndex((i) => i + 1);
  }, [last, finish]);

  useEffect(() => {
    if (status !== "running") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, finish, next]);

  if (status === "dismissed") {
    return (
      <button
        type="button"
        onClick={replay}
        className="fixed bottom-4 right-4 z-40 rounded-full border-2 border-slate-900/10 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-lg backdrop-blur outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:text-white"
      >
        ↻ Tutorial
      </button>
    );
  }
  if (status === "loading" || !step) return null;

  // Place the card below the spotlight when there's room, otherwise above —
  // then clamp it into the viewport so the buttons are never cut off.
  const margin = 12;
  const cardW = 320;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const below = !rect || rect.bottom + cardH + margin < vh;
  const rawTop = rect ? (below ? rect.bottom + margin : rect.top - margin - cardH) : 0;
  const top = Math.min(Math.max(rawTop, margin), Math.max(vh - cardH - margin, margin));
  const left = rect
    ? Math.min(
        Math.max(rect.left + rect.width / 2 - cardW / 2, margin),
        Math.max(vw - cardW - margin, margin)
      )
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Campaign tutorial"
      className="fixed inset-0 z-50"
    >
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            // One shadow does both jobs: the amber ring and the page dimmer.
            // (A Tailwind `ring-*` would be overridden by this inline value.)
            boxShadow:
              "0 0 0 3px #fbbf24, 0 0 0 9999px rgba(2, 6, 23, 0.72)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-slate-950/75" />
      )}

      <div
        ref={(el) => {
          if (el && el.offsetHeight && el.offsetHeight !== cardH) setCardH(el.offsetHeight);
        }}
        className="absolute w-[320px] rounded-2xl border-2 border-slate-900/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900"
        style={
          rect
            ? { top, left }
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
      >
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500 dark:text-violet-400">
          Step {index + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 outline-none hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:text-slate-200"
          >
            Skip tutorial
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="rounded-lg border-2 border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700 dark:text-slate-300"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              autoFocus
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {last ? "Let's go" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
