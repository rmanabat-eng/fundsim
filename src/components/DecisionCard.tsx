"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  acceptAcquisition,
  acceptFundSecondary,
  declineDecision,
  fundBridge,
  fundProRata,
  resolveCeoReplacement,
  resolveExitRoute,
  resolvePayToPlay,
  resolvePivot,
  resolveTermSheet,
} from "@/app/play/actions";
import { formatDollars, formatPercent } from "@/lib/fund-math";
import { StageBadge } from "@/components/StageBadge";
import { inputClasses } from "@/components/RoundFields";
import { Term } from "@/components/Term";
import { toast } from "@/components/toast";
import { prefersReducedMotion } from "@/lib/motion";

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

function ProRataCard({ d }: { d: Extract<DecisionView, { type: "pro_rata" }> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState(String(d.proRataCheck));
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
      const res = await fundProRata(d.id, null, data);
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else if (checkNumber > 0)
        toast(`Backed ${d.companyName}'s round — ${formatDollars(checkNumber)}`);
      else toast(`Sat out ${d.companyName}'s round`, "info");
    });
  }

  function sitOut() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("decline");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, DECLINE_EXIT_MS));
      await declineDecision(d.id);
      toast(`Sat out ${d.companyName}'s round`, "info");
    });
  }

  return (
    <DecisionShell stamp="Follow-on" exitStyle={commitDeclineExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        📈 <CompanyName id={d.companyId} name={d.companyName} /> is raising a{" "}
        <StageBadge stage={d.stage} />: {formatDollars(d.raised)} at a{" "}
        {formatDollars(d.postMoney)} post-money.
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
            Defend it
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
        Your {formatPercent(d.ownedBefore)} is being{" "}
        <Term def="New rounds create new shares, so everyone who doesn't buy in owns a smaller slice: your stake × (post-money − raised) ÷ post-money.">
          diluted
        </Term>{" "}
        unless you{" "}
        <Term def="Funding your pro-rata means investing enough of the new round to keep your ownership percentage where it was.">
          fund your pro-rata
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
            max={d.raised}
            step={25000}
            value={check}
            onChange={(e) => setCheck(e.target.value)}
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
      {bought > 0 && (
        <p className="text-xs text-white/60">
          {formatDollars(checkNumber)} buys back {bought.toFixed(2)} points →{" "}
          {formatPercent(d.ownedNow + bought)} after the round.
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
      await acceptAcquisition(d.id);
      toast(`Took the exit on ${d.companyName} — ${formatDollars(d.yourShare)}`);
    });
  }

  function hold() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("hold");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, HOLD_EXIT_MS));
      await declineDecision(d.id);
      toast(`Held ${d.companyName} — passed on the offer`, "info");
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
          Your stake returns
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
            on {formatDollars(d.invested)} invested
          </p>
        )}
      </div>

      <p className="text-sm text-white/70">
        Cash now, or hold for{" "}
        <Term def="In venture, a handful of huge winners return more than everything else combined. Selling a potential winner early caps the outcome that pays for the whole fund.">
          the power law
        </Term>
        ? Declined offers don&apos;t come back — and neither do dead companies.
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
      await acceptFundSecondary(d.id);
      toast(`Sold your stake in ${d.companyName} — ${formatDollars(d.yourShare)}`);
    });
  }

  function hold() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("decline");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, DECLINE_EXIT_MS));
      await declineDecision(d.id);
      toast(`Held ${d.companyName} — kept the position`, "info");
    });
  }

  return (
    <DecisionShell stamp="Secondary offer" exitStyle={commitDeclineExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        💰 A buyer wants only your stake in{" "}
        <CompanyName id={d.companyId} name={d.companyName} /> — {formatDollars(d.offerValue)}
        , the company itself carries on without you.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="max-chip-box rounded-lg px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          Your stake returns
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
            on {formatDollars(d.invested)} invested
          </p>
        )}
      </div>

      <p className="text-sm text-white/70">
        A capped return today, or hold your position for{" "}
        <Term def="In venture, a handful of huge winners return more than everything else combined. Selling a potential winner early caps the outcome that pays for the whole fund.">
          the power law
        </Term>
        .
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
      const res = await fundBridge(d.id);
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(`Bridged ${d.companyName} — ${formatDollars(d.amount)}`);
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
      await declineDecision(d.id);
      toast(`Refused the bridge for ${d.companyName}`, "info");
    });
  }

  return (
    <DecisionShell stamp="SOS" exitStyle={bridgeExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🆘 <CompanyName id={d.companyId} name={d.companyName} /> is nearly out of
        cash and asking you for a {formatDollars(d.amount)}{" "}
        <Term def="A small round at flat-to-down pricing meant to keep a struggling company alive until it can raise properly. Insiders fund it — or nobody does.">
          bridge
        </Term>{" "}
        at a{" "}
        <Term def="The company's valuation with the new money already counted in. Your ownership is simply your check ÷ post-money.">
          {formatDollars(d.postMoney)} post-money
        </Term>
        .
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
        Fund it and they get runway to recover. Refuse and they probably
        don&apos;t make it — but bridges to nowhere are how funds bleed out.
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
      await resolveTermSheet(d.id, "top_tier");
      toast(`Advised ${d.companyName}: signed the top-tier lead`);
    });
  }

  function takeHighPrice() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("high_price");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, HIGH_PRICE_EXIT_MS));
      await resolveTermSheet(d.id, "high_price");
      toast(`Advised ${d.companyName}: took the higher price`);
    });
  }

  return (
    <DecisionShell stamp="Term sheets" exitStyle={termSheetExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🖊️ <CompanyName id={d.companyId} name={d.companyName} /> has two term sheets
        for its <StageBadge stage={d.stage} />, both raising{" "}
        {formatDollars(d.raised)} — and the founder is asking you which to sign.
      </p>

      <PitchNotes signals={d.signals} />

      {/* Side by side, since the whole decision is a comparison. */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🏦 Top-tier lead
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatDollars(d.topTierPost)}{" "}
            <Term def="The company's valuation with the new money already counted in. A lower post-money means the same check buys more of the company — everyone gets diluted more.">
              post
            </Term>
          </p>
          <p className="text-xs text-white/60">
            you&apos;d hold {formatPercent(d.ownedTopTier)}
          </p>
        </div>
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🎈 Hype fund
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatDollars(d.highPricePost)} post
          </p>
          <p className="text-xs text-white/60">
            you&apos;d hold {formatPercent(d.ownedHighPrice)}
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        Price is one round&apos;s vanity;{" "}
        <Term def="A strong lead investor helps recruit, opens doors, and anchors the next round. That support shifts the company's odds every year after — worth more than a flattering valuation.">
          the partner compounds
        </Term>
        . The higher price keeps more ownership and a bigger paper mark today.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={signTopTier} className={primaryButton}>
          {pending ? "Advising..." : "🏦 Sign the top-tier lead"}
        </button>
        <button type="button" disabled={pending} onClick={takeHighPrice} className={secondaryButton}>
          🎈 Take the higher price
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
      await resolvePivot(d.id, "back");
      toast(`Advised ${d.companyName}: backed the pivot`);
    });
  }

  function urgeFocus() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("focus");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, PIVOT_FOCUS_EXIT_MS));
      await resolvePivot(d.id, "focus");
      toast(`Advised ${d.companyName}: urged focus`);
    });
  }

  return (
    <DecisionShell stamp="Crossroads" exitStyle={pivotExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🧭 Growth has stalled at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />. The founder wants to{" "}
        <Term def="Change the product or market while keeping the team and the money already raised. Most pivots fizzle; a famous few (Slack, Instagram) found the real business.">
          pivot
        </Term>{" "}
        into an adjacent market and is asking for your blessing before betting the
        rest of the runway.
      </p>

      <PitchNotes signals={d.signals} />

      <p className="text-sm text-white/70">
        Backing the pivot is a high-variance reroll of the company&apos;s odds.
        Urging focus is the safe, small win. Either answer beats silence — an
        unsupported founder pivots anyway, half-hearted.
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
      const res = await resolveExitRoute(d.id, choice);
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(`${d.companyName}: ${label}`);
      }
    });
  }

  return (
    <DecisionShell stamp="Exit strategy" exitStyle={exitRouteExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🚪 <CompanyName id={d.companyId} name={d.companyName} /> has grown into real
        options and the board wants your vote on how to get liquid. It last priced
        at {formatDollars(d.postMoney)}.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="max-chip-box rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
            🔔 IPO
          </p>
          <p className="mt-0.5 font-bold text-white">
            {formatDollars(share(d.ipoLow))}–{formatDollars(share(d.ipoHigh))}
          </p>
          <p className="text-xs text-[color:var(--max-orange)]">
            {Math.round(d.ipoPullChance * 100)}% chance it&apos;s pulled
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
            at a discount
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        The IPO has the highest ceiling and can still be shelved.{" "}
        <Term def="Selling your position to another investor rather than waiting for the company to exit. You get cash now; the company carries on without you — and buyers of a private stake expect a discount for the trouble.">
          A secondary
        </Term>{" "}
        takes the risk off your books without forcing a sale.
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
      await resolveCeoReplacement(d.id, "replace");
      toast(`Voted out the founder of ${d.companyName}`, "error");
    });
  }

  function keep() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("keep");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, KEEP_EXIT_MS));
      await resolveCeoReplacement(d.id, "keep");
      toast(`Backed the founder at ${d.companyName}`);
    });
  }

  return (
    <DecisionShell stamp="Board vote" exitStyle={ceoReplacementExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        🪑 The board at <CompanyName id={d.companyId} name={d.companyName} /> wants
        to replace the founder-CEO with a professional operator, and your vote
        decides it.
      </p>

      <PitchNotes signals={d.signals} />

      <p className="text-sm text-white/70">
        An experienced operator usually steadies a company — and founders talk.
        Ousting one costs you more standing than any single no, and the reputation
        you spend here is the deal flow you see later.
      </p>

      <DecisionActions>
        <button type="button" disabled={pending} onClick={replace} className={primaryButton}>
          {pending ? "Voting..." : "🪑 Bring in an operator"}
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
      const res = await resolvePayToPlay(d.id, choice);
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(`${d.companyName}: ${label}`, choice === "pay" ? "success" : "info");
      }
    });
  }

  return (
    <DecisionShell stamp="Pay-to-play" exitStyle={payToPlayExitStyle(exiting)}>
      <p className="text-sm text-white/85">
        ⚖️ <CompanyName id={d.companyId} name={d.companyName} /> is raising a down
        round — <StageBadge stage={d.stage} /> {formatDollars(d.raised)} at{" "}
        {formatDollars(d.postMoney)} — and the insiders have imposed{" "}
        <Term def="A down-round rule: existing investors must put in their full share or their preferred shares convert to common, losing their protections. It's designed to force insiders to keep funding the company.">
          pay-to-play
        </Term>
        . Write your share or your stake converts.
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
            converted, costs nothing
          </p>
        </div>
      </div>

      <p className="text-sm text-white/70">
        You hold {formatPercent(d.ownedNow)} today. Good money after bad is a real
        risk — but this is the rule that wipes out investors who stop showing up.
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
          onClick={() => choose("decline", "you sat out the recap")}
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

export function DecisionCard({ decision }: { decision: DecisionView }) {
  if (decision.type === "pro_rata") return <ProRataCard d={decision} />;
  if (decision.type === "acquisition") return <AcquisitionCard d={decision} />;
  if (decision.type === "fund_secondary") return <FundSecondaryCard d={decision} />;
  if (decision.type === "term_sheet") return <TermSheetCard d={decision} />;
  if (decision.type === "pivot") return <PivotCard d={decision} />;
  if (decision.type === "exit_route") return <ExitRouteCard d={decision} />;
  if (decision.type === "ceo_replacement") return <CeoReplacementCard d={decision} />;
  if (decision.type === "pay_to_play") return <PayToPlayCard d={decision} />;
  return <BridgeCard d={decision} />;
}
