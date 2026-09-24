"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

// A first-run coach-mark tour: it spotlights the real year-1 UI rather than
// describing it in the abstract. Steps whose target isn't on the page (no
// deals dealt, say) drop out, so the tour never points at nothing.

type Step = {
  target: string | null; // data-tour value; null renders centered
  title: string;
  body: string;
  waitFor?: "invest" | "portfolio-open"; // gates the step on a real action instead of Next
  // Pin the coach card to a screen corner instead of the usual
  // below/above-the-spotlight placement — for a target near a button the
  // player needs to click (the spotlighted deal's Invest), so the card
  // itself never ends up sitting on top of it.
  cardCorner?: boolean;
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
    body: "Every pitch shows four clues. Some genuinely predict success, some are noise, some are red flags — and the link is deliberately fuzzy, so a great-looking pitch still busts sometimes. The patterns only show up across several runs.",
  },
  {
    // data-tour repeats across every deal card, so this rings whichever one
    // rendered first — fine for showing what the slider looks like. The
    // card is corner-pinned (not the usual spot right below the ring) so it
    // doesn't sit on that card's Invest button underneath.
    target: "deal-check",
    cardCorner: true,
    title: "💸 Size your check",
    body: "Drag to set your check. The percentage is what that buys you — your check ÷ the post-money valuation. Bigger checks mean more ownership but fewer bets, and you only get one fund.",
  },
  {
    target: "deal-invest",
    cardCorner: true,
    title: "👉 Your turn",
    body: "Look at this deal and hit Invest — any check size is fine. I'll pick it up the moment you do.",
    waitFor: "invest",
  },
  {
    target: "portfolio-button",
    title: "📁 Your portfolio, any time",
    body: "Go ahead and click it — take a look at the Snapshot, History, and Chart tabs. Close it whenever you're done; I'll be here.",
    waitFor: "portfolio-open",
  },
  {
    target: "bar-status",
    title: "📋 What's still open",
    body: "Deals open and decisions pending — this is what's still on your desk for the year. Advancing expires anything left here, so check it before you roll.",
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

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Whether a step's target actually rendered this year. The first and last
// steps (target: null) are always eligible, which is also what guarantees
// the search loop below terminates.
function stepEligible(s: Step): boolean {
  return s.target === null || !!document.querySelector(`[data-tour="${s.target}"]`);
}

// The tour's position is tracked as an index into the fixed STEPS array,
// not into a filtered list — deals get backed over the course of the tour
// itself, which can make earlier steps (the slider/invest ones, once no
// deal cards are left) ineligible mid-tour. A filtered-list index breaks
// the moment membership shrinks from the middle: positions after the
// removed steps silently shift, and the raw index no longer points at the
// step it did a render ago. Indexing into the stable array and skipping
// ineligible entries at read time sidesteps that entirely.
function nearestEligibleIndex(from: number, dir: 1 | -1): number {
  let i = Math.max(0, Math.min(from, STEPS.length - 1));
  while (i > 0 && i < STEPS.length - 1 && !stepEligible(STEPS[i])) i += dir;
  return i;
}

export function CampaignTutorial({ gameId }: { gameId: string }) {
  const storageKey = `fundsim-tutorial-seen-${gameId}`;
  const readSeen = useCallback(
    () => (window.localStorage.getItem(storageKey) === "1" ? "seen" : "unseen"),
    [storageKey]
  );
  const readSeenOnServer = useCallback(() => "unknown" as const, []);
  const seen = useSyncExternalStore(subscribeSeen, readSeen, readSeenOnServer);
  // Skip/replay override what storage says, for this page view.
  const [override, setOverride] = useState<"running" | "dismissed" | null>(null);
  const status =
    override ??
    (seen === "unknown" ? "loading" : seen === "seen" ? "dismissed" : "running");
  const [rawIndex, setRawIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardH, setCardH] = useState(230);

  const step = STEPS[rawIndex];

  // For the "Step X of Y" display only — how many steps are eligible right
  // now, and where the current one falls among them. Recomputed on every
  // step change so a target that (dis)appears mid-tour (a deal running out,
  // the portfolio button showing up) is reflected immediately.
  const displayTotal = useMemo(() => {
    if (status === "loading") return STEPS.length;
    return STEPS.filter(stepEligible).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, rawIndex]);
  const displayIndex = useMemo(() => {
    if (status === "loading") return rawIndex + 1;
    return STEPS.slice(0, rawIndex + 1).filter(stepEligible).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, rawIndex]);

  const finish = useCallback(() => {
    window.localStorage.setItem(storageKey, "1");
    setOverride("dismissed");
  }, [storageKey]);

  const replay = useCallback(() => {
    setRawIndex(0);
    setOverride("running");
  }, []);

  // The trigger lives in the "⋯ More" menu now, outside this component (the
  // running tour is a fixed full-screen overlay — nesting it inside a
  // collapsible <details> would hide it if the menu ever closed). The menu
  // item just dispatches this event instead.
  useEffect(() => {
    window.addEventListener("fundsim:replay-tutorial", replay);
    return () => window.removeEventListener("fundsim:replay-tutorial", replay);
  }, [replay]);

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

  const last = rawIndex >= STEPS.length - 1;
  const next = useCallback(() => {
    if (rawIndex >= STEPS.length - 1) finish();
    else setRawIndex((i) => nearestEligibleIndex(i + 1, 1));
  }, [rawIndex, finish]);
  const back = useCallback(() => {
    setRawIndex((i) => nearestEligibleIndex(Math.max(0, i - 1), -1));
  }, []);

  // Gated steps advance themselves the moment the real action happens,
  // instead of waiting for a Next click — the point is doing it, not
  // reading about it. Guarded with a ref (not just effect cleanup) against
  // firing twice for one real action — the event can otherwise reach two
  // overlapping listener registrations (e.g. React Strict Mode's dev-mode
  // double effect-invocation) and advance the index by two, skipping the
  // very step this was gating toward.
  const WAIT_EVENTS = {
    invest: "fundsim:invested",
    "portfolio-open": "fundsim:portfolio-opened",
  } as const;
  const advancedRef = useRef(false);
  useEffect(() => {
    advancedRef.current = false;
  }, [step]);
  useEffect(() => {
    if (status !== "running" || !step?.waitFor) return;
    function onAction() {
      if (advancedRef.current) return;
      advancedRef.current = true;
      // The event fires as soon as the action resolves, but a step whose
      // target depends on it (the portfolio button appearing after a first
      // investment) only exists once Next.js has committed the revalidated
      // page — not guaranteed to have landed yet in this same tick. A short
      // delay avoids a race where the next step's target check runs against
      // the stale DOM and gets silently filtered out again.
      window.setTimeout(next, 200);
    }
    const eventName = WAIT_EVENTS[step.waitFor];
    window.addEventListener(eventName, onAction);
    return () => window.removeEventListener(eventName, onAction);
  }, [status, step, next]);

  useEffect(() => {
    if (status !== "running") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" && !step?.waitFor) next();
      if (e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, finish, next, back, step]);

  if (status === "dismissed" || status === "loading" || !step) return null;

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
      // Every other step blocks the page so Next/Back are the only way
      // through. Gated steps need the opposite: clicks have to reach the
      // real element they're waiting on (an Invest button, the portfolio
      // trigger), not just inside the small spotlighted rect around it.
      className={`fixed inset-0 z-50 ${step.waitFor ? "pointer-events-none" : ""}`}
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
            boxShadow: "0 0 0 3px #ffe600, 0 0 0 9999px rgba(13, 13, 26, 0.82)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[#0d0d1a]/85" />
      )}

      <div
        ref={(el) => {
          if (el && el.offsetHeight && el.offsetHeight !== cardH) setCardH(el.offsetHeight);
        }}
        className="max-card pointer-events-auto absolute w-[320px] rounded-2xl p-5"
        style={
          {
            "--max-card-border": "var(--max-magenta)",
            ...(step.cardCorner
              ? // Cleared of the sticky advance bar (fixed to the same
                // bottom edge), not just the margin — independent of where
                // the spotlighted card ends up, so it never lands on top of
                // the Invest button just below the ring.
                { bottom: 90, right: margin + 16 }
              : rect
                ? { top, left }
                : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }),
          } as unknown as React.CSSProperties
        }
      >
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[color:var(--max-cyan)]">
          Step {displayIndex} of {displayTotal}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg px-2 py-1 text-xs font-bold text-white/50 outline-none hover:text-white/80 focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)]"
          >
            Skip tutorial
          </button>
          <div className="flex items-center gap-2">
            {rawIndex > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-full border-2 border-white/25 px-3 py-1.5 text-xs font-bold text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)]"
              >
                Back
              </button>
            )}
            {step.waitFor ? (
              <span className="game-blink rounded-full border-2 border-dashed border-white/25 px-3 py-1.5 text-xs font-bold text-white/50">
                {step.waitFor === "invest"
                  ? "Waiting for you to invest…"
                  : "Waiting for you to open it…"}
              </span>
            ) : (
              <button
                type="button"
                onClick={next}
                autoFocus
                className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)]"
              >
                {last ? "Let's go" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
