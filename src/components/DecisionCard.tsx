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
function DecisionShell({
  stamp,
  children,
}: {
  stamp: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cardClasses} style={cardStyle}>
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

  const checkNumber = Number(check);
  const bought =
    Number.isFinite(checkNumber) && checkNumber > 0
      ? (checkNumber / d.postMoney) * 100
      : 0;

  function writeCheck() {
    setError(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("check", check);
      const res = await fundProRata(d.id, null, data);
      if (res?.error) setError(res.error);
      else if (checkNumber > 0)
        toast(`Backed ${d.companyName}'s round — ${formatDollars(checkNumber)}`);
      else toast(`Sat out ${d.companyName}'s round`, "info");
    });
  }

  function sitOut() {
    startTransition(async () => {
      await declineDecision(d.id);
      toast(`Sat out ${d.companyName}'s round`, "info");
    });
  }

  return (
    <DecisionShell stamp="Follow-on">
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
  const multiple = d.invested > 0 ? d.yourShare / d.invested : 0;

  return (
    <DecisionShell stamp="Exit offer">
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
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await acceptAcquisition(d.id);
              toast(`Took the exit on ${d.companyName} — ${formatDollars(d.yourShare)}`);
            })
          }
          className={primaryButton}
        >
          {pending ? "Signing..." : "Take the exit"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await declineDecision(d.id);
              toast(`Held ${d.companyName} — passed on the offer`, "info");
            })
          }
          className={secondaryButton}
        >
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
  const multiple = d.invested > 0 ? d.yourShare / d.invested : 0;

  return (
    <DecisionShell stamp="Secondary offer">
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
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await acceptFundSecondary(d.id);
              toast(`Sold your stake in ${d.companyName} — ${formatDollars(d.yourShare)}`);
            })
          }
          className={primaryButton}
        >
          {pending ? "Signing..." : "Sell the stake"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await declineDecision(d.id);
              toast(`Held ${d.companyName} — kept the position`, "info");
            })
          }
          className={secondaryButton}
        >
          Hold
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function BridgeCard({ d }: { d: Extract<DecisionView, { type: "bridge" }> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <DecisionShell stamp="SOS">
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
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await fundBridge(d.id);
              if (res?.error) setError(res.error);
              else toast(`Bridged ${d.companyName} — ${formatDollars(d.amount)}`);
            })
          }
          className={primaryButton}
        >
          {pending ? "Wiring..." : `Fund the bridge`}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await declineDecision(d.id);
              toast(`Refused the bridge for ${d.companyName}`, "info");
            })
          }
          className={secondaryButton}
        >
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

  return (
    <DecisionShell stamp="Term sheets">
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
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolveTermSheet(d.id, "top_tier");
              toast(`Advised ${d.companyName}: signed the top-tier lead`);
            })
          }
          className={primaryButton}
        >
          {pending ? "Advising..." : "🏦 Sign the top-tier lead"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolveTermSheet(d.id, "high_price");
              toast(`Advised ${d.companyName}: took the higher price`);
            })
          }
          className={secondaryButton}
        >
          🎈 Take the higher price
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function PivotCard({ d }: { d: Extract<DecisionView, { type: "pivot" }> }) {
  const [pending, startTransition] = useTransition();

  return (
    <DecisionShell stamp="Crossroads">
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
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolvePivot(d.id, "back");
              toast(`Advised ${d.companyName}: backed the pivot`);
            })
          }
          className={primaryButton}
        >
          {pending ? "Advising..." : "🎲 Back the pivot"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolvePivot(d.id, "focus");
              toast(`Advised ${d.companyName}: urged focus`);
            })
          }
          className={secondaryButton}
        >
          🎯 Urge focus
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function ExitRouteCard({ d }: { d: Extract<DecisionView, { type: "exit_route" }> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const share = (valuation: number) => (d.owned / 100) * valuation;

  function choose(choice: "ipo" | "acquire" | "secondary", label: string) {
    setError(null);
    startTransition(async () => {
      const res = await resolveExitRoute(d.id, choice);
      if (res?.error) setError(res.error);
      else toast(`${d.companyName}: ${label}`);
    });
  }

  return (
    <DecisionShell stamp="Exit strategy">
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

  return (
    <DecisionShell stamp="Board vote">
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
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolveCeoReplacement(d.id, "replace");
              toast(`Voted out the founder of ${d.companyName}`, "error");
            })
          }
          className={primaryButton}
        >
          {pending ? "Voting..." : "🪑 Bring in an operator"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resolveCeoReplacement(d.id, "keep");
              toast(`Backed the founder at ${d.companyName}`);
            })
          }
          className={secondaryButton}
        >
          🤝 Back the founder
        </button>
      </DecisionActions>
    </DecisionShell>
  );
}

function PayToPlayCard({ d }: { d: Extract<DecisionView, { type: "pay_to_play" }> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(choice: "pay" | "decline", label: string) {
    setError(null);
    startTransition(async () => {
      const res = await resolvePayToPlay(d.id, choice);
      if (res?.error) setError(res.error);
      else toast(`${d.companyName}: ${label}`, choice === "pay" ? "success" : "info");
    });
  }

  return (
    <DecisionShell stamp="Pay-to-play">
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
