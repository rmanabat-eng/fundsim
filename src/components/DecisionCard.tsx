"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  acceptAcquihire,
  acceptAcquisition,
  acceptFundSecondary,
  declineDecision,
  fundBridge,
  fundProRata,
  resolveCeoReplacement,
  resolveExitRoute,
  resolveFounderSplit,
  resolvePayToPlay,
  resolvePivot,
  resolveTermConcession,
  resolveTermSheet,
} from "@/app/play/actions";
import { formatDollars, formatPercent } from "@/lib/fund-math";
import { StageBadge } from "@/components/StageBadge";
import { inputClasses } from "@/components/RoundFields";
import { Term } from "@/components/Term";
import { celebrateExit } from "@/components/Celebration";
import { toast } from "@/components/toast";
import { prefersReducedMotion } from "@/lib/motion";
import { withRepDelta, repSuffix } from "@/lib/decision-reveal";

// Everything the card needs is computed server-side in the play page —
// ownership math stays in one place (fund-math) and the card just renders.
// Every decision carries the company's original pitch signals, so you can see
// what you liked about them without leaving the page.
type Common = {
  id: string;
  companyId: string;
  companyName: string;
  signals: string[];
};

export type DecisionView =
  | (Common & {
      type: "pro_rata";
      stage: string;
      raised: number;
      postMoney: number;
      ownedBefore: number; // % before this round's dilution
      ownedNow: number; // % after it, with no check written
      proRataCheck: number; // the check that would defend ownedBefore
    })
  | (Common & {
      type: "acquisition";
      offerValue: number;
      yourShare: number; // ownership × offer
      invested: number; // total checks into this company so far
    })
  | (Common & {
      type: "acquihire";
      offerValue: number;
      yourShare: number; // ownership × offer
      invested: number; // total checks into this company so far
    })
  | (Common & {
      type: "fund_secondary";
      offerValue: number;
      yourShare: number; // ownership × offer
      invested: number; // total checks into this company so far
    })
  | (Common & {
      type: "bridge";
      amount: number;
      postMoney: number;
      ownedNow: number; // % before the bridge
      ownedAfter: number; // % if you fund the whole thing
    })
  | (Common & {
      type: "term_sheet";
      stage: string;
      raised: number;
      topTierPost: number;
      highPricePost: number;
      ownedTopTier: number; // your % after signing the top-tier sheet
      ownedHighPrice: number; // your % after signing the high-price sheet
    })
  | (Common & {
      type: "term_concession";
      stage: string;
      raised: number; // the whole round
      postMoney: number; // the founder's price
      heldPostMoney: number; // the lower price if you push and it lands
      check: number; // what the founder asks you to invest
      heldCheck: number; // your smaller check if you push on amount
      ownedNow: number; // your % before the round
      walkRisk: number; // chance the founder walks if you push on price
    })
  | (Common & {
      type: "pivot";
    })
  | (Common & {
      type: "exit_route";
      stage: string;
      postMoney: number;
      ipoLow: number;
      ipoHigh: number;
      ipoPullChance: number;
      acquisitionOffer: number;
      secondaryValuation: number;
      owned: number; // your % — every route pays out on this
    })
  | (Common & {
      type: "ceo_replacement";
    })
  | (Common & {
      type: "founder_split";
    })
  | (Common & {
      type: "pay_to_play";
      stage: string;
      raised: number;
      postMoney: number;
      requiredCheck: number;
      ownedNow: number; // % before the round
      ownedIfPay: number; // % if you participate
      ownedIfDecline: number; // % after converting at the recap price
    });

// group (not lift+tilt like DealCard) — a decision awaits you, it doesn't
// invite browsing, so the hover reads as attention drawn to something
// stationary: a border glow here, plus a distinct stamp reaction in
// EventStamp/globals.css. transition-shadow stays active regardless of
// motion preference; only the glow itself is motion-safe-gated, same
// pattern as DealCard's hover.
const cardClasses =
  "max-card-flat group relative h-full rounded-2xl p-5 transition-shadow duration-[var(--max-hover-duration)] ease-[var(--max-hover-ease)] hover:z-30 focus-within:z-30 motion-safe:hover:shadow-[0_0_18px_var(--max-card-border)]";
const cardStyle = { "--max-card-border": "var(--max-yellow)" } as React.CSSProperties;
const primaryButton =
  "max-btn-primary shrink-0 rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50";
const secondaryButton =
  "max-btn-outline shrink-0 rounded-full border-4 border-white/30 bg-[#2d1b4e]/60 px-3 py-2 text-sm font-bold text-white/80 disabled:opacity-50";

// ---- Decision-card exit motions ----
// Decisions resolve in place (no lateral travel off-screen the way DealCard's
// deals do) — they should feel like something being settled, not discarded.
// Each card below holds itself (via local `exiting` state) through one of
// these before the real mutation fires, same mechanism as DealCard's
// invest()/pass(): set `exiting` synchronously so the render picks up the
// exit style immediately, hold for the matching duration (skipped entirely
// under reduced motion), then call the action. See the four @keyframes in
// globals.css (decision-exit-*) for the ones that need more than a single
// transition.
const EXIT_PURPLE = "var(--max-purple)";
const EXIT_CORAL = "var(--max-orange)";
const EXIT_TEAL = "var(--max-cyan)";
const EXIT_RED = "#ef4444";
const EXIT_GREEN = "#22c55e";
const EXIT_BLUE = "#3b82f6";
const EXIT_AMBER = "#f59e0b";
const EXIT_GRAY = "#6b7280";

// pro_rata (and fund_secondary, which isn't its own numbered case — it's the
// same commit/decline shape, so it reuses this pair).
const FUND_EXIT_MS = 700; // glow + double-pulse + settle/dissolve
const DECLINE_EXIT_MS = 440; // shake + fade — faster and flatter than fund

// term_sheet — equal-energy, different direction/color.
const TOP_TIER_EXIT_MS = 380; // settles down, calm, moderate speed
const HIGH_PRICE_EXIT_MS = 260; // pops up, quicker, higher-energy

// exit_route — direction/color reflect what's happening, not a size ranking.
const IPO_EXIT_MS = 420; // launches upward, biggest motion
const ACQUIRE_EXIT_MS = 300; // solid pop in place, no lateral travel
const SECONDARY_EXIT_MS = 300; // slides sideways and off — the one exception
// to "resolves in place," since this option means exiting the position

// ceo_replacement — weighted, not equal-energy (toast already tags replace
// as an error).
const REPLACE_EXIT_MS = 150; // one hard, fast, decisive thud, no overshoot
const KEEP_EXIT_MS = 500; // slower, warmer settle, no hard edges

// pivot — risky option (back) gets the wobble.
const PIVOT_BACK_EXIT_MS = 600; // wobble, then settles fully
const PIVOT_FOCUS_EXIT_MS = 260; // contained, grounded settle, no wobble

// founder_split — INVERSE of pivot: here the safe option is the one you
// actively choose (broker), and doing nothing (ignore) is the blind roll, so
// ignore gets the wobble instead of the backing option.
const BROKER_EXIT_MS = 320; // contained, grounded settle, no wobble
const IGNORE_EXIT_MS = 600; // wobble, then settles fully

// acquisition — INVERSE of pivot: the risky option here is holding, not
// accepting, so hold gets the (longer) wobble instead.
const ACCEPT_EXIT_MS = 220; // quick pop that locks solid, no lingering motion
const HOLD_EXIT_MS = 800; // wobbles longer than pivot's, doesn't fully lock

// bridge — "let it die" is a real negative outcome, not a neutral decline.
const FUND_BRIDGE_EXIT_MS = 380; // lifts upward, like pulling back from the edge
const LET_DIE_EXIT_MS = 950; // slow sink and fade, deliberately the longest exit here

// pay_to_play — "stay out" is a real cram-down, not a neutral pass.
const PAY_EXIT_MS = 480; // braces, then holds firm with an overshooting settle
const STAY_OUT_EXIT_MS = 800; // visibly compresses to ~0.6 while fading

// Case 1 (pro_rata + fund_secondary): commit = glow + double-pulse + settle/
// dissolve; decline = shake + fade. Shared since fund_secondary isn't its
// own numbered case — same commit/decline shape, so it reuses this pair.
function commitDeclineExitStyle(
  exiting: "fund" | "decline" | null
): Record<string, string | number> {
  if (exiting === "fund") {
    return {
      animation: `decision-exit-pulse ${FUND_EXIT_MS}ms ease-out forwards`,
      boxShadow: "0 0 24px var(--max-card-border)",
    };
  }
  if (exiting === "decline") {
    return { animation: `decision-exit-shake ${DECLINE_EXIT_MS}ms ease-out forwards` };
  }
  return {};
}

// Case 2 (term_sheet): equal energy, different direction/color — neither
// should look like the "loser."
function termSheetExitStyle(
  exiting: "top_tier" | "high_price" | null
): Record<string, string | number> {
  if (exiting === "top_tier") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${TOP_TIER_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "translateY(0.6rem)",
      opacity: 0,
      "--max-card-border": EXIT_PURPLE,
    };
  }
  if (exiting === "high_price") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${HIGH_PRICE_EXIT_MS}ms`,
      transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      transform: "translateY(-0.6rem) scale(1.05)",
      opacity: 0,
      "--max-card-border": EXIT_CORAL,
    };
  }
  return {};
}

// Case 3 (exit_route): direction/color reflect what's actually happening,
// not a size ranking.
function exitRouteExitStyle(
  exiting: "ipo" | "acquire" | "secondary" | null
): Record<string, string | number> {
  if (exiting === "ipo") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${IPO_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "translateY(-2rem)",
      opacity: 0,
      "--max-card-border": EXIT_TEAL,
    };
  }
  if (exiting === "acquire") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${ACQUIRE_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "scale(1.08)",
      opacity: 0,
      "--max-card-border": EXIT_PURPLE,
    };
  }
  if (exiting === "secondary") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${SECONDARY_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "translateX(2rem)",
      opacity: 0,
      "--max-card-border": EXIT_CORAL,
    };
  }
  return {};
}

// Case 4 (ceo_replacement): weighted, not equal-energy — the toast already
// tags "replace" as an error variant, so the motion matches.
function ceoReplacementExitStyle(
  exiting: "replace" | "keep" | null
): Record<string, string | number> {
  if (exiting === "replace") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${REPLACE_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "translateY(0.3rem)",
      opacity: 0,
      "--max-card-border": EXIT_RED,
    };
  }
  if (exiting === "keep") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${KEEP_EXIT_MS}ms`,
      transitionTimingFunction: "ease-in-out",
      transform: "translateY(0.5rem)",
      opacity: 0,
      "--max-card-border": EXIT_GREEN,
    };
  }
  return {};
}

// Case 5 (pivot): risky option (back) gets the wobble.
function pivotExitStyle(
  exiting: "back" | "focus" | null
): Record<string, string | number> {
  if (exiting === "back") {
    return {
      animation: `decision-exit-wobble ${PIVOT_BACK_EXIT_MS}ms ease-out forwards`,
      transitionProperty: "opacity",
      transitionDuration: `${PIVOT_BACK_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      opacity: 0,
      "--wobble-amp": "5deg",
      "--wobble-end": "0deg",
    };
  }
  if (exiting === "focus") {
    return {
      transitionProperty: "transform, opacity",
      transitionDuration: `${PIVOT_FOCUS_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "scale(1.04)",
      opacity: 0,
    };
  }
  return {};
}

// Case 5b (founder_split): INVERSE of pivot — ignore is the blind roll here,
// so it gets the wobble instead of the backed option.
function founderSplitExitStyle(
  exiting: "broker" | "ignore" | null
): Record<string, string | number> {
  if (exiting === "broker") {
    return {
      transitionProperty: "transform, opacity",
      transitionDuration: `${BROKER_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "scale(1.04)",
      opacity: 0,
    };
  }
  if (exiting === "ignore") {
    return {
      animation: `decision-exit-wobble ${IGNORE_EXIT_MS}ms ease-out forwards`,
      transitionProperty: "opacity",
      transitionDuration: `${IGNORE_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      opacity: 0,
      "--wobble-amp": "5deg",
      "--wobble-end": "0deg",
    };
  }
  return {};
}

// Case 6 (acquisition): INVERSE of pivot — hold (not accept) is the risky
// option here, so hold gets the (longer) wobble instead of accept.
function acquisitionExitStyle(
  exiting: "accept" | "hold" | null
): Record<string, string | number> {
  if (exiting === "accept") {
    return {
      transitionProperty: "transform, opacity",
      transitionDuration: `${ACCEPT_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "scale(1.05)",
      opacity: 0,
    };
  }
  if (exiting === "hold") {
    return {
      animation: `decision-exit-wobble ${HOLD_EXIT_MS}ms ease-out forwards`,
      transitionProperty: "opacity",
      transitionDuration: `${HOLD_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      opacity: 0,
      "--wobble-amp": "8deg",
      "--wobble-end": "3deg",
    };
  }
  return {};
}

// Case 7 (bridge): "let it die" is a real negative outcome, not a neutral
// decline.
function bridgeExitStyle(
  exiting: "fund" | "letDie" | null
): Record<string, string | number> {
  if (exiting === "fund") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${FUND_BRIDGE_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "translateY(-1rem)",
      opacity: 0,
      "--max-card-border": EXIT_TEAL,
    };
  }
  if (exiting === "letDie") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${LET_DIE_EXIT_MS}ms`,
      transitionTimingFunction: "ease-in-out",
      transform: "translateY(1.5rem)",
      opacity: 0,
      "--max-card-border": EXIT_GRAY,
    };
  }
  return {};
}

// Case 8 (pay_to_play): "stay out" is a real cram-down, not a neutral pass —
// the most severe compression of any decline motion here.
function payToPlayExitStyle(
  exiting: "pay" | "stayOut" | null
): Record<string, string | number> {
  if (exiting === "pay") {
    return {
      animation: `decision-exit-brace ${PAY_EXIT_MS}ms ease-out forwards`,
      transitionProperty: "opacity, border-color",
      transitionDuration: `${PAY_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      opacity: 0,
      "--max-card-border": EXIT_BLUE,
    };
  }
  if (exiting === "stayOut") {
    return {
      transitionProperty: "transform, opacity, border-color",
      transitionDuration: `${STAY_OUT_EXIT_MS}ms`,
      transitionTimingFunction: "ease-out",
      transform: "scale(0.6)",
      opacity: 0,
      "--max-card-border": EXIT_AMBER,
    };
  }
  return {};
}

// The "EVENT!" stamp naming the situation. It sits on its own line rather than
// floating, so the copy underneath doesn't have to wrap around it.
function EventStamp({ label }: { label: string }) {
  return (
    <span className="max-stamp px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
      {label}
    </span>
  );
}

// One rhythm for every decision type: stamp, then evenly spaced blocks, with
// the actions separated by a rule so the ask reads apart from the context.
//
// exitStyle is merged in on top of cardStyle the same way DealCard merges
// its exitStyle: inline, so it reliably wins over the hover glow/stamp
// rules regardless of lingering :hover state. Empty ({}) whenever nothing
// is resolving, so the merge is a no-op most of the time.
// One plain sentence per decision type (keyed by its stamp), shown until the
// player dismisses it once — so a rare card like pay-to-play arriving in year
// 6 still gets an introduction, without the tutorial front-loading all twelve.
const FIRST_TIME: Record<string, string> = {
  "Follow-on":
    "A company you own part of is raising more money. Invest again to keep your share, or skip it and own a bit less.",
  "Exit offer":
    "Someone wants to buy the whole company. Say yes and you get cash for your shares — and this investment is over.",
  "Acqui-hire":
    "A struggling company has a small offer for its team. Taking it gets a little of your money back and ends the investment.",
  "Offer for your shares":
    "Someone wants to buy just your shares. You get cash now and give up any later gains.",
  SOS: "A company you backed is about to run out of money and is asking you to rescue it.",
  "Two offers":
    "A company you backed is choosing between two investors. You don't put in money — you only advise which offer to take.",
  Negotiation:
    "A company you backed wants you to invest again, and the terms are still open. Accept them, or ask for a better deal.",
  Crossroads:
    "A founder wants your advice on a big change of direction. No money involved — your answer changes the company's chances.",
  "Founder split":
    "The founders are breaking up and want your help. No money involved — your answer changes the company's chances.",
  "Exit strategy":
    "A successful company is ready to turn shares into cash. You vote on how, and each way pays differently.",
  "Board vote":
    "The board is deciding whether to replace the CEO, and yours is the deciding vote. No money involved.",
  "Pay-to-play":
    "A struggling company is raising money on harsh terms: investors who don't put in more get punished.",
};

// Same storage-as-external-store approach as CampaignTutorial's seen flag, so
// the server render (treated as "seen") hydrates cleanly.
function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function FirstTimeNote({ stamp }: { stamp: string }) {
  const key = `fundsim-decision-seen-${stamp}`;
  const seen = useSyncExternalStore(
    subscribeStorage,
    () => window.localStorage.getItem(key) === "1",
    () => true
  );
  if (seen || !FIRST_TIME[stamp]) return null;
  return (
    <div className="max-chip-box mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed text-white/80">
      <span className="font-black uppercase tracking-widest text-[color:var(--max-cyan)]">
        👋 New:
      </span>{" "}
      {FIRST_TIME[stamp]}{" "}
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

function DecisionShell({
  stamp,
  exitStyle,
  children,
}: {
  stamp: string;
  // Loosely typed (not React.CSSProperties) because the exit styles below
  // set --max-card-border/--wobble-* custom properties, which TS's DOM
  // types don't recognize as valid CSSProperties keys — cast once here at
  // the merge point instead of in every exit-style helper.
  exitStyle?: Record<string, string | number>;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cardClasses}
      style={{ ...cardStyle, ...exitStyle } as React.CSSProperties}
    >
      <EventStamp label={stamp} />
      <FirstTimeNote stamp={stamp} />
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function DecisionActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t-2 border-white/15 pt-3">
      {children}
    </div>
  );
}

function CompanyName({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/companies/${id}`}
      className="font-semibold text-white underline-offset-2 hover:underline"
    >
      {name}
    </Link>
  );
}

// The pitch notes sit inline rather than behind a hover: they're input to the
// decision you're making, and hover is unreachable on touch. Jargon (Term)
// stays hidden — you only need that if you don't know the word.
function PitchNotes({ signals }: { signals: string[] }) {
  if (!signals.length) return null;
  return (
    <div className="max-chip-box rounded-lg px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
        From the pitch
      </p>
      <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-white/65">
        {signals.map((s) => (
          <li key={s}>🔎 {s}</li>
        ))}
      </ul>
    </div>
  );
}

function ProRataCard({
  d,
  budget,
}: {
  d: Extract<DecisionView, { type: "pro_rata" }>;
  budget: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Never more than the round or the fund's remaining dry powder — the
  // spinner stops there and typed amounts are pulled back to it.
  const cap = Math.max(0, Math.min(d.raised, budget));
  const [check, setCheck] = useState(String(Math.min(d.proRataCheck, cap)));
  const [exiting, setExiting] = useState<"fund" | "decline" | null>(null);

  const checkNumber = Number(check);
  const bought =
    Number.isFinite(checkNumber) && checkNumber > 0
      ? (checkNumber / d.postMoney) * 100
      : 0;

  function writeCheck() {
    setError(null);
    // The submit button can resolve either way depending on the typed
    // amount, so the motion follows the actual outcome, not the button.
    const kind = checkNumber > 0 ? "fund" : "decline";
    const ms = checkNumber > 0 ? FUND_EXIT_MS : DECLINE_EXIT_MS;
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting(kind);
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, ms));
      const data = new FormData();
      data.set("check", check);
      const { result: res, delta } = await withRepDelta(() => fundProRata(d.id, null, data));
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else if (checkNumber > 0)
        toast(`Backed ${d.companyName}'s round — ${formatDollars(checkNumber)}${repSuffix(delta)}`);
      else toast(`Sat out ${d.companyName}'s round${repSuffix(delta)}`, "info");
    });
  }

  function sitOut() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("decline");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, DECLINE_EXIT_MS));
      const { delta } = await withRepDelta(() => declineDecision(d.id));
      toast(`Sat out ${d.companyName}'s round${repSuffix(delta)}`, "info");
    });
  }

  return (
    <DecisionShell stamp="Follow-on" exitStyle={commitDeclineExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        📈 <CompanyName id={d.companyId} name={d.companyName} /> is raising more
        money: a <StageBadge stage={d.stage} /> of {formatDollars(d.raised)} that
        values the company at {formatDollars(d.postMoney)}.
      </p>

      <PitchNotes signals={d.signals} />

      {/* The trade-off as a two-column comparison — easier to weigh than prose. */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Sit out
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatPercent(d.ownedNow)}
          </p>
          <p className="text-xs text-white/60">
            {formatDollars((d.ownedNow / 100) * d.postMoney)} · costs nothing
          </p>
        </div>
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Keep your share
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatPercent(d.ownedBefore)}
          </p>
          <p className="text-xs text-white/60">
            {formatDollars((d.ownedBefore / 100) * d.postMoney)} · costs{" "}
            {formatDollars(d.proRataCheck)}
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        The company is making new shares for the new investors, so your{" "}
        {formatPercent(d.ownedBefore)} slice{" "}
        <Term def="This is called dilution. Your shares don't go away — there are just more shares in total, so yours are a smaller part of the company.">
          shrinks
        </Term>{" "}
        to {formatPercent(d.ownedNow)} unless you buy some too.{" "}
        {formatDollars(d.proRataCheck)} keeps your share where it was — that
        amount is called your{" "}
        <Term def="Your right, as an existing investor, to put money into a new round so your percentage doesn't shrink.">
          pro-rata
        </Term>
        .
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          writeCheck();
        }}
        className="flex flex-wrap items-center gap-2 border-t-2 border-white/15 pt-3"
      >
        {/* Boxed so the field stays compact beside the buttons — the shared
            input style is w-full and would otherwise take the whole row. */}
        <div className="w-36 shrink-0">
          <input
            name="check"
            type="number"
            min={0}
            max={cap}
            step={25000}
            value={check}
            onChange={(e) =>
              setCheck(Number(e.target.value) > cap ? String(cap) : e.target.value)
            }
            className={inputClasses}
            aria-label="Follow-on check"
          />
        </div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Wiring..." : "Write the check"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={sitOut}
          className={secondaryButton}
        >
          Sit out
        </button>
      </form>
      {d.proRataCheck > cap && (
        <p className="text-xs text-[color:var(--max-yellow)]">
          Only {formatDollars(cap)} left to deploy — not enough for your full{" "}
          {formatDollars(d.proRataCheck)} pro-rata.
        </p>
      )}
      {bought > 0 && (
        <p className="text-xs text-white/60">
          {formatDollars(checkNumber)} buys {bought.toFixed(2)}% more of the
          company — you&apos;d own {formatPercent(d.ownedNow + bought)} after the
          round.
        </p>
      )}
      {error && (
        <p className="text-xs text-[color:var(--max-orange)]" role="alert">
          {error}
        </p>
      )}
    </DecisionShell>
  );
}

function AcquisitionCard({
  d,
}: {
  d: Extract<DecisionView, { type: "acquisition" }>;
}) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"accept" | "hold" | null>(null);
  const multiple = d.invested > 0 ? d.yourShare / d.invested : 0;

  // Case 6 — inverse of pivot: here the risky choice is holding (staying
  // exposed to the power law), not accepting, so hold gets the wobble.
  function accept() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("accept");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, ACCEPT_EXIT_MS));
      const { delta } = await withRepDelta(() => acceptAcquisition(d.id));
      toast(`Took the exit on ${d.companyName} — ${formatDollars(d.yourShare)}${repSuffix(delta)}`, "success", null);
      celebrateExit(d.companyName, multiple);
    });
  }

  function hold() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("hold");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, HOLD_EXIT_MS));
      const { delta } = await withRepDelta(() => declineDecision(d.id));
      toast(`Held ${d.companyName} — passed on the offer${repSuffix(delta)}`, "info");
    });
  }

  return (
    <DecisionShell stamp="Exit offer" exitStyle={acquisitionExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🤝 An acquirer is offering {formatDollars(d.offerValue)} for{" "}
        <CompanyName id={d.companyId} name={d.companyName} />.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="max-chip-box rounded-lg px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          You&apos;d get
        </p>
        <p className="mt-0.5 text-base font-black text-white">
          {formatDollars(d.yourShare)}
          {d.invested > 0 && (
            <span className="ml-2 text-sm font-bold text-[color:var(--max-cyan)]">
              {multiple.toFixed(1)}×
            </span>
          )}
        </p>
        {d.invested > 0 && (
          <p className="text-xs text-white/60">
            for the {formatDollars(d.invested)} you put in
          </p>
        )}
      </div>

      <p className="text-sm text-white/70">
        Take the sure cash now, or hold and hope it grows into something much
        bigger? Most of a fund&apos;s profit comes from{" "}
        <Term def="This is called the power law: a few huge winners earn more than all your other investments combined. Selling a future giant early gives up the win that pays for the whole fund.">
          one or two huge winners
        </Term>
        , so selling one early is costly. But this offer won&apos;t come back, and
        the company could still fail.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={accept} className={primaryButton}>
          {pending ? "Signing..." : "Take the exit"}
        </button>
        <button type="button" disabled={pending} onClick={hold} className={secondaryButton}>
          Hold
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

// The exit itself is bad news here — usually below what's been put in. Same
// accept/hold shape (and motion) as AcquisitionCard, since holding is still
// the riskier call either way, just framed around ending the pain instead
// of cashing in a winner.
function AcquihireCard({
  d,
}: {
  d: Extract<DecisionView, { type: "acquihire" }>;
}) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"accept" | "hold" | null>(null);
  const multiple = d.invested > 0 ? d.yourShare / d.invested : 0;

  function accept() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("accept");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, ACCEPT_EXIT_MS));
      const { delta } = await withRepDelta(() => acceptAcquihire(d.id));
      toast(`Took the acqui-hire on ${d.companyName} — ${formatDollars(d.yourShare)}${repSuffix(delta)}`, "success", null);
      celebrateExit(d.companyName, multiple);
    });
  }

  function hold() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("hold");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, HOLD_EXIT_MS));
      const { delta } = await withRepDelta(() => declineDecision(d.id));
      toast(`Held ${d.companyName} — passed on the acqui-hire${repSuffix(delta)}`, "info");
    });
  }

  return (
    <DecisionShell stamp="Acqui-hire" exitStyle={acquisitionExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🩹 A buyer wants the team and tech at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />
        {" "}— not the business. They&apos;re offering{" "}
        {formatDollars(d.offerValue)}, all in.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="max-chip-box rounded-lg px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          You&apos;d get
        </p>
        <p className="mt-0.5 text-base font-black text-white">
          {formatDollars(d.yourShare)}
          {d.invested > 0 && (
            <span className="ml-2 text-sm font-bold text-[color:var(--max-orange)]">
              {multiple.toFixed(1)}×
            </span>
          )}
        </p>
        {d.invested > 0 && (
          <p className="text-xs text-white/60">
            for the {formatDollars(d.invested)} you put in
          </p>
        )}
      </div>

      <p className="text-sm text-white/70">
        This is a rescue, not a win — you&apos;d likely get back less than you
        put in. If you hold, the company keeps going, but a team that just lost
        its buyout offer often falls apart before it can prove you right.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={accept} className={primaryButton}>
          {pending ? "Signing..." : "🩹 Take the acqui-hire"}
        </button>
        <button type="button" disabled={pending} onClick={hold} className={secondaryButton}>
          Hold
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function FundSecondaryCard({
  d,
}: {
  d: Extract<DecisionView, { type: "fund_secondary" }>;
}) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"fund" | "decline" | null>(null);
  const multiple = d.invested > 0 ? d.yourShare / d.invested : 0;

  // Not its own numbered case — same commit/decline shape as pro_rata, so
  // it reuses that pair's motion (see commitDeclineExitStyle).
  function sell() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("fund");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, FUND_EXIT_MS));
      const { delta } = await withRepDelta(() => acceptFundSecondary(d.id));
      toast(`Sold your stake in ${d.companyName} — ${formatDollars(d.yourShare)}${repSuffix(delta)}`, "success", null);
      celebrateExit(d.companyName, multiple);
    });
  }

  function hold() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("decline");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, DECLINE_EXIT_MS));
      const { delta } = await withRepDelta(() => declineDecision(d.id));
      toast(`Held ${d.companyName} — kept the position${repSuffix(delta)}`, "info");
    });
  }

  return (
    <DecisionShell stamp="Offer for your shares" exitStyle={commitDeclineExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        💰 Another investor wants to buy your shares in{" "}
        <CompanyName id={d.companyId} name={d.companyName} />, at a price that
        values the whole company at {formatDollars(d.offerValue)}. The company
        keeps going — you&apos;d just no longer own a piece of it.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="max-chip-box rounded-lg px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          You&apos;d get
        </p>
        <p className="mt-0.5 text-base font-black text-white">
          {formatDollars(d.yourShare)}
          {d.invested > 0 && (
            <span className="ml-2 text-sm font-bold text-[color:var(--max-cyan)]">
              {multiple.toFixed(1)}×
            </span>
          )}
        </p>
        {d.invested > 0 && (
          <p className="text-xs text-white/60">
            for the {formatDollars(d.invested)} you put in
          </p>
        )}
      </div>

      <p className="text-sm text-white/70">
        Sure cash today, or keep your shares in case this becomes one of the{" "}
        <Term def="This is called the power law: a few huge winners earn more than all your other investments combined. Selling a future giant early gives up the win that pays for the whole fund.">
          huge winners
        </Term>{" "}
        that pay for the whole fund?
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={sell} className={primaryButton}>
          {pending ? "Signing..." : "Sell the stake"}
        </button>
        <button type="button" disabled={pending} onClick={hold} className={secondaryButton}>
          Hold
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function BridgeCard({ d }: { d: Extract<DecisionView, { type: "bridge" }> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"fund" | "letDie" | null>(null);

  function fund() {
    setError(null);
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("fund");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, FUND_BRIDGE_EXIT_MS));
      const { result: res, delta } = await withRepDelta(() => fundBridge(d.id));
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(`Bridged ${d.companyName} — ${formatDollars(d.amount)}${repSuffix(delta)}`);
      }
    });
  }

  // "Let it die" is a real negative outcome, not a neutral decline — this
  // exit is deliberately the slowest of any decline motion (~950ms).
  function refuse() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("letDie");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, LET_DIE_EXIT_MS));
      const { delta } = await withRepDelta(() => declineDecision(d.id));
      toast(`Refused the bridge for ${d.companyName}${repSuffix(delta)}`, "info");
    });
  }

  return (
    <DecisionShell stamp="SOS" exitStyle={bridgeExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🆘 <CompanyName id={d.companyId} name={d.companyName} /> is nearly out of
        cash and asking you for {formatDollars(d.amount)} to keep going — a{" "}
        <Term def="A small emergency round that keeps a struggling company alive until it can raise money properly. Usually only its existing investors will pay for one.">
          bridge
        </Term>
        . The deal values the company at {formatDollars(d.postMoney)}.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="max-chip-box rounded-lg px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          If you fund it
        </p>
        <p className="mt-0.5 text-sm font-bold text-white">
          {formatPercent(d.ownedNow)} → {formatPercent(d.ownedAfter)}
        </p>
        <p className="text-xs text-white/60">
          worth {formatDollars((d.ownedAfter / 100) * d.postMoney)} at this price
        </p>
      </div>

      <p className="text-sm text-white/70">
        Fund it and they get time to recover. Refuse and they probably shut
        down. But rescuing every struggling company is a fast way to run out of
        money.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={fund} className={primaryButton}>
          {pending ? "Wiring..." : `Fund the bridge`}
        </button>
        <button type="button" disabled={pending} onClick={refuse} className={secondaryButton}>
          Refuse
        </button>
      </DecisionActions>
      {error && (
        <p className="text-xs text-[color:var(--max-orange)]" role="alert">
          {error}
        </p>
      )}
    </DecisionShell>
  );
}

function TermSheetCard({ d }: { d: Extract<DecisionView, { type: "term_sheet" }> }) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"top_tier" | "high_price" | null>(null);

  // Both are legitimate outcomes — equal energy, different direction/color,
  // neither should read as the "loser."
  function signTopTier() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("top_tier");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, TOP_TIER_EXIT_MS));
      const { delta } = await withRepDelta(() => resolveTermSheet(d.id, "top_tier"));
      toast(`Advised ${d.companyName}: took the famous investor${repSuffix(delta)}`);
    });
  }

  function takeHighPrice() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("high_price");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, HIGH_PRICE_EXIT_MS));
      const { delta } = await withRepDelta(() => resolveTermSheet(d.id, "high_price"));
      toast(`Advised ${d.companyName}: took the higher price${repSuffix(delta)}`);
    });
  }

  return (
    <DecisionShell stamp="Two offers" exitStyle={termSheetExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🖊️ Two investors want to fund the <StageBadge stage={d.stage} /> at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />. Both{" "}
        <Term def="An investor's written offer is called a term sheet: how much they'll invest and what they think the company is worth.">
          offers
        </Term>{" "}
        put in {formatDollars(d.raised)}, and the founder is asking you which one
        to take.
      </p>

      <PitchNotes signals={d.signals} />

      {/* Side by side, since the whole decision is a comparison. */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🏦 Famous investor
          </p>
          <p className="mt-0.5 font-bold text-white">
            values it at {formatDollars(d.topTierPost)}
          </p>
          <p className="text-xs text-white/60">
            you&apos;d own {formatPercent(d.ownedTopTier)}
          </p>
        </div>
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🎈 Highest bidder
          </p>
          <p className="mt-0.5 font-bold text-white">
            values it at {formatDollars(d.highPricePost)}
          </p>
          <p className="text-xs text-white/60">
            you&apos;d own {formatPercent(d.ownedHighPrice)}
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        The famous investor offers a lower price, but{" "}
        <Term def="A top investor helps hire, makes introductions, and makes the next round easier to raise. That improves the company's chances every year after.">
          their help
        </Term>{" "}
        makes the company more likely to succeed. The highest bidder leaves you
        with a bigger share that looks more valuable today — and that&apos;s all
        they bring.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={signTopTier} className={primaryButton}>
          {pending ? "Advising..." : "🏦 Take the famous investor"}
        </button>
        <button type="button" disabled={pending} onClick={takeHighPrice} className={secondaryButton}>
          🎈 Take the higher price
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

const CONCESSION_EXIT_MS = 400;

function TermConcessionCard({
  d,
}: {
  d: Extract<DecisionView, { type: "term_concession" }>;
}) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState(false);
  const [holdValuation, setHoldValuation] = useState(false);
  const [holdAmount, setHoldAmount] = useState(false);

  function send() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting(true);
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, CONCESSION_EXIT_MS));
      const { result, delta } = await withRepDelta(() =>
        resolveTermConcession(d.id, { holdValuation, holdAmount })
      );
      if (result?.walked)
        toast(`The founder of ${d.companyName} walked away — no deal${repSuffix(delta)}`, "error");
      else
        toast(
          (check > 0
            ? `Invested ${formatDollars(check)} in ${d.companyName}${holdValuation ? " at the lower price" : ""}`
            : `${d.companyName} closed its round without you`) + repSuffix(delta)
        );
    });
  }

  // What the two checkboxes add up to: the rest of the round shrinks your
  // old slice, then your own check buys some back at the agreed price.
  const post = holdValuation ? d.heldPostMoney : d.postMoney;
  const check = holdAmount ? d.heldCheck : d.check;
  const owned = (d.ownedNow * (post - d.raised)) / post + (check / post) * 100;

  return (
    <DecisionShell
      stamp="Negotiation"
      exitStyle={
        exiting
          ? { animation: `decision-exit-pulse ${CONCESSION_EXIT_MS}ms ease-out forwards` }
          : {}
      }
    >
      <p className="text-sm text-white/85">
        🤝 <CompanyName id={d.companyId} name={d.companyName} /> is raising a{" "}
        <StageBadge stage={d.stage} /> of {formatDollars(d.raised)}{" "}
        and wants you
        to invest. Accept the founder&apos;s terms as they are, or push back
        before you sign.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="max-chip-box rounded-lg px-3 py-2 text-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          💰 The price
        </p>
        <p className="mt-0.5 text-white/70">
          The founder values the company at {formatDollars(d.postMoney)}. Push
          for {formatDollars(d.heldPostMoney)}{" "}
          and the same money buys you a
          bigger share — but founders care a lot about price, and there&apos;s
          about a {Math.round(d.walkRisk * 100)}% chance this one{" "}
          <Term def="The founder takes the money from someone else. You don't invest, you lose reputation, and this deal never comes back.">
            walks away
          </Term>
          .
        </p>
        <label className="mt-2 flex items-center gap-2 text-xs font-bold text-white/80">
          <input
            type="checkbox"
            checked={holdValuation}
            onChange={(e) => setHoldValuation(e.target.checked)}
          />
          Push for the lower price
        </label>
      </div>

      {d.heldCheck < d.check && (
        <div className="max-chip-box rounded-lg px-3 py-2 text-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🧾 Your check
          </p>
          <p className="mt-0.5 text-white/70">
            The founder wants {formatDollars(d.check)} from you. Offer{" "}
            {formatDollars(d.heldCheck)} instead and you keep more cash for
            other deals. Founders rarely fight over this — no risk.
          </p>
          <label className="mt-2 flex items-center gap-2 text-xs font-bold text-white/80">
            <input
              type="checkbox"
              checked={holdAmount}
              onChange={(e) => setHoldAmount(e.target.checked)}
            />
            Offer the smaller check
          </label>
        </div>
      )}

      <p className="text-sm text-white/70">
        {check > 0 ? (
          <>
            With these terms you invest{" "}
            <span className="font-bold text-white">{formatDollars(check)}</span>{" "}
            and end up owning{" "}
            <span className="font-bold text-white">{formatPercent(owned)}</span>
          </>
        ) : (
          <>
            You have no cash left to invest, so you&apos;d end up owning{" "}
            <span className="font-bold text-white">{formatPercent(owned)}</span>
          </>
        )}{" "}
        (you own {formatPercent(d.ownedNow)} today).
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={send} className={primaryButton}>
          {pending ? "Sending..." : "🤝 Send your terms"}
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function PivotCard({ d }: { d: Extract<DecisionView, { type: "pivot" }> }) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"back" | "focus" | null>(null);

  // The risky option (back) gets the wobble — see acquisitionExitStyle for
  // the inverse case where the risky choice is the other button.
  function backPivot() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("back");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, PIVOT_BACK_EXIT_MS));
      const { delta } = await withRepDelta(() => resolvePivot(d.id, "back"));
      toast(`Advised ${d.companyName}: backed the pivot${repSuffix(delta)}`);
    });
  }

  function urgeFocus() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("focus");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, PIVOT_FOCUS_EXIT_MS));
      const { delta } = await withRepDelta(() => resolvePivot(d.id, "focus"));
      toast(`Advised ${d.companyName}: urged focus${repSuffix(delta)}`);
    });
  }

  return (
    <DecisionShell stamp="Crossroads" exitStyle={pivotExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🧭 Growth has stalled at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />. The founder wants to{" "}
        <Term def="Same team, same money, new plan. Most pivots fail; a famous few (Slack, Instagram) turned into the real business.">
          pivot
        </Term>{" "}
        — switch to a different product or market — and is asking for your
        support before spending the money they have left on it.
      </p>

      <PitchNotes signals={d.signals} />

      <p className="text-sm text-white/70">
        Backing the pivot is a gamble: the company could end up much better or
        much worse. Urging them to stay focused is the safe choice with a small
        upside. Either answer beats no answer — an ignored founder pivots
        anyway, without your help.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={backPivot} className={primaryButton}>
          {pending ? "Advising..." : "🎲 Back the pivot"}
        </button>
        <button type="button" disabled={pending} onClick={urgeFocus} className={secondaryButton}>
          🎯 Urge focus
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function FounderSplitCard({
  d,
}: {
  d: Extract<DecisionView, { type: "founder_split" }>;
}) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"broker" | "ignore" | null>(null);

  function broker() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("broker");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, BROKER_EXIT_MS));
      const { delta } = await withRepDelta(() => resolveFounderSplit(d.id, "broker"));
      toast(`Brokered the split at ${d.companyName}${repSuffix(delta)}`);
    });
  }

  // Staying out is the risky option here — you find out who mattered only
  // after the fact — so it gets the wobble, same shape as pivot's "back".
  function ignore() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("ignore");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, IGNORE_EXIT_MS));
      const { delta } = await withRepDelta(() => resolveFounderSplit(d.id, "ignore"));
      toast(`Stayed out of the split at ${d.companyName}${repSuffix(delta)}`, "info");
    });
  }

  return (
    <DecisionShell stamp="Founder split" exitStyle={founderSplitExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        💔 The co-founders at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />{" "}
        are splitting up — one wants to leave. They&apos;re asking you to help
        them part ways calmly before it turns into a fight over who owns what.
      </p>

      <PitchNotes signals={d.signals} />

      <p className="text-sm text-white/70">
        You can&apos;t tell from here which of them the company really depends
        on. Helping them split cleanly is the safe choice with a small upside.
        Staying out costs nothing today, but it&apos;s a blind gamble on who
        mattered more — and it&apos;s often the one who left.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={broker} className={primaryButton}>
          {pending ? "Helping..." : "🤝 Help them split cleanly"}
        </button>
        <button type="button" disabled={pending} onClick={ignore} className={secondaryButton}>
          🎲 Stay out of it
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

const EXIT_ROUTE_MS: Record<"ipo" | "acquire" | "secondary", number> = {
  ipo: IPO_EXIT_MS,
  acquire: ACQUIRE_EXIT_MS,
  secondary: SECONDARY_EXIT_MS,
};

function ExitRouteCard({ d }: { d: Extract<DecisionView, { type: "exit_route" }> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exiting, setExiting] = useState<"ipo" | "acquire" | "secondary" | null>(null);
  const share = (valuation: number) => (d.owned / 100) * valuation;

  function choose(choice: "ipo" | "acquire" | "secondary", label: string) {
    setError(null);
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting(choice);
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, EXIT_ROUTE_MS[choice]));
      const { result: res, delta } = await withRepDelta(() => resolveExitRoute(d.id, choice));
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(`${d.companyName}: ${label}${repSuffix(delta)}`, "success", null);
        celebrateExit(d.companyName, 0); // the IPO's price isn't known here, so just the fanfare
      }
    });
  }

  return (
    <DecisionShell stamp="Exit strategy" exitStyle={exitRouteExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🚪 <CompanyName id={d.companyId} name={d.companyName} /> has grown big
        enough for investors to cash out, and the board wants your vote on how.
        It was last valued at {formatDollars(d.postMoney)}. Each box shows what
        you&apos;d get.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🔔 Go public
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatDollars(share(d.ipoLow))}–{formatDollars(share(d.ipoHigh))}
          </p>
          <p className="text-xs text-[color:var(--max-orange)]">
            {Math.round(d.ipoPullChance * 100)}% chance it&apos;s cancelled
          </p>
        </div>
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🤝 Sell the company
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatDollars(share(d.acquisitionOffer))}
          </p>
          <p className="text-xs text-white/60">certain, today</p>
        </div>
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            💵 Sell your stake
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatDollars(share(d.secondaryValuation))}
          </p>
          <p className="text-xs text-white/60">
            certain, but a lower price
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        Going public (an IPO — selling shares on the stock market) can pay the
        most, but it might get cancelled. Selling the company is sure money
        today.{" "}
        <Term def="This is called a secondary sale: another investor buys your shares and the company carries on without you. Buyers pay less than full price because private shares are hard to resell.">
          Selling just your stake
        </Term>{" "}
        gets you cash at a lower price without the company having to sell.
      </p>

      <DecisionActions>
        <button
          type="button"
          disabled={pending}
          onClick={() => choose("ipo", "filed to go public")}
          className={primaryButton}
        >
          {pending ? "Working..." : "🔔 Go public"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => choose("acquire", "sold to an acquirer")}
          className={secondaryButton}
        >
          🤝 Sell the company
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => choose("secondary", "you sold your stake")}
          className={secondaryButton}
        >
          💵 Sell your stake
        </button>
      </DecisionActions>
      {error && (
        <p className="text-xs text-[color:var(--max-orange)]" role="alert">
          {error}
        </p>
      )}
    </DecisionShell>
  );
}

function CeoReplacementCard({
  d,
}: {
  d: Extract<DecisionView, { type: "ceo_replacement" }>;
}) {
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<"replace" | "keep" | null>(null);

  // Weighted, not equal-energy — the toast already tags "replace" as an
  // error variant, so the motion matches: hard/fast/red vs. slow/warm/green.
  function replace() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("replace");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, REPLACE_EXIT_MS));
      const { delta } = await withRepDelta(() => resolveCeoReplacement(d.id, "replace"));
      toast(`Voted out the founder of ${d.companyName}${repSuffix(delta)}`, "error");
    });
  }

  function keep() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("keep");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, KEEP_EXIT_MS));
      const { delta } = await withRepDelta(() => resolveCeoReplacement(d.id, "keep"));
      toast(`Backed the founder at ${d.companyName}${repSuffix(delta)}`);
    });
  }

  return (
    <DecisionShell stamp="Board vote" exitStyle={ceoReplacementExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🪑 The board at <CompanyName id={d.companyId} name={d.companyName} /> wants
        to replace the founder as CEO with an experienced outside executive, and
        your vote decides it.
      </p>

      <PitchNotes signals={d.signals} />

      <p className="text-sm text-white/70">
        An experienced CEO usually makes a company steadier. But founders talk
        to each other: voting one out hurts your reputation more than saying no
        to them ever does, and a worse reputation means fewer good pitches
        later.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={replace} className={primaryButton}>
          {pending ? "Voting..." : "🪑 Replace the CEO"}
        </button>
        <button type="button" disabled={pending} onClick={keep} className={secondaryButton}>
          🤝 Back the founder
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function PayToPlayCard({ d }: { d: Extract<DecisionView, { type: "pay_to_play" }> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exiting, setExiting] = useState<"pay" | "stayOut" | null>(null);

  // "Stay out" causes a real cram-down, not a neutral pass — see
  // payToPlayExitStyle for why it's the most severe compression here.
  function choose(choice: "pay" | "decline", label: string) {
    setError(null);
    const kind = choice === "pay" ? "pay" : "stayOut";
    const ms = choice === "pay" ? PAY_EXIT_MS : STAY_OUT_EXIT_MS;
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting(kind);
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, ms));
      const { result: res, delta } = await withRepDelta(() => resolvePayToPlay(d.id, choice));
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(`${d.companyName}: ${label}${repSuffix(delta)}`, choice === "pay" ? "success" : "info");
      }
    });
  }

  return (
    <DecisionShell stamp="Pay-to-play" exitStyle={payToPlayExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        ⚖️ <CompanyName id={d.companyId} name={d.companyName} /> is struggling. Its{" "}
        <StageBadge stage={d.stage} /> raises {formatDollars(d.raised)} at a{" "}
        <Term def="This is called a down round: the company is now priced below its last round, so everyone's shares are worth less than before.">
          lower valuation than last time
        </Term>{" "}
        ({formatDollars(d.postMoney)}), and it comes with a{" "}
        <Term def="A rule that punishes existing investors who don't put more money in: their shares are swapped for a weaker kind and their stake is cut. It exists to push investors to keep funding the company.">
          pay-to-play
        </Term>{" "}
        rule: put in your share of the round, or your stake gets cut.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Pay your share
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatPercent(d.ownedIfPay)}
          </p>
          <p className="text-xs text-white/60">
            costs {formatDollars(d.requiredCheck)}
          </p>
        </div>
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Sit it out
          </p>
          <p className="mt-0.5 font-bold text-[color:var(--max-orange)]">
            {formatPercent(d.ownedIfDecline)}
          </p>
          <p className="text-xs text-white/60">
            stake cut, costs nothing
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        You own {formatPercent(d.ownedNow)}{" "}
        today. Paying means putting more
        money into a company that&apos;s struggling. Not paying means giving up
        part of what you already own.
      </p>

      <DecisionActions>
        <button
          type="button"
          disabled={pending}
          onClick={() => choose("pay", "you paid to play")}
          className={primaryButton}
        >
          {pending ? "Wiring..." : "⚖️ Pay your share"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => choose("decline", "you sat out the round")}
          className={secondaryButton}
        >
          Sit it out
        </button>
      </DecisionActions>
      {error && (
        <p className="text-xs text-[color:var(--max-orange)]" role="alert">
          {error}
        </p>
      )}
    </DecisionShell>
  );
}

// `budget` is the fund's remaining dry powder, for the one decision with a
// free-form amount (pro-rata); the rest ask for fixed sums the server checks.
export function DecisionCard({ decision, budget }: { decision: DecisionView; budget: number }) {
  if (decision.type === "pro_rata") return <ProRataCard d={decision} budget={budget} />;
  if (decision.type === "acquisition") return <AcquisitionCard d={decision} />;
  if (decision.type === "acquihire") return <AcquihireCard d={decision} />;
  if (decision.type === "fund_secondary") return <FundSecondaryCard d={decision} />;
  if (decision.type === "term_sheet") return <TermSheetCard d={decision} />;
  if (decision.type === "term_concession") return <TermConcessionCard d={decision} />;
  if (decision.type === "pivot") return <PivotCard d={decision} />;
  if (decision.type === "exit_route") return <ExitRouteCard d={decision} />;
  if (decision.type === "ceo_replacement") return <CeoReplacementCard d={decision} />;
  if (decision.type === "founder_split") return <FounderSplitCard d={decision} />;
  if (decision.type === "pay_to_play") return <PayToPlayCard d={decision} />;
  return <BridgeCard d={decision} />;
}
