"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  acceptAcquisition,
  declineDecision,
  fundBridge,
  fundProRata,
  resolvePivot,
  resolveTermSheet,
} from "@/app/play/actions";
import { formatDollars, formatPercent } from "@/lib/fund-math";
import { STAGE_LABELS } from "@/lib/constants";
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
    });

const cardClasses =
  "h-full rounded-2xl border-2 border-amber-400 bg-amber-50/70 p-5 shadow-[5px_5px_0_rgba(245,158,11,0.3)] dark:border-amber-600/70 dark:bg-amber-950/20 dark:shadow-[5px_5px_0_rgba(0,0,0,0.5)]";
const primaryButton =
  "btn-arcade shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50";
const secondaryButton =
  "btn-arcade shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300";

// The "EVENT!" stamp naming the situation. It sits on its own line rather than
// floating, so the copy underneath doesn't have to wrap around it.
function EventStamp({ label }: { label: string }) {
  return (
    <span className="inline-block -rotate-2 rounded-lg border-2 border-amber-500 bg-amber-400/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-950">
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
    <div className={cardClasses}>
      <EventStamp label={stamp} />
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function DecisionActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-amber-300/70 pt-3 dark:border-amber-700/40">
      {children}
    </div>
  );
}

function CompanyName({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/companies/${id}`}
      className="font-semibold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
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
    <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        From the pitch
      </p>
      <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        📈 <CompanyName id={d.companyId} name={d.companyName} /> is raising a{" "}
        {STAGE_LABELS[d.stage as keyof typeof STAGE_LABELS] ?? d.stage}:{" "}
        {formatDollars(d.raised)} at a {formatDollars(d.postMoney)} post-money.
      </p>

      <PitchNotes signals={d.signals} />

      {/* The trade-off as a two-column comparison — easier to weigh than prose. */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Sit out
          </p>
          <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
            {formatPercent(d.ownedNow)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDollars((d.ownedNow / 100) * d.postMoney)} · costs nothing
          </p>
        </div>
        <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Defend it
          </p>
          <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
            {formatPercent(d.ownedBefore)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDollars((d.ownedBefore / 100) * d.postMoney)} · costs{" "}
            {formatDollars(d.proRataCheck)}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
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
        className="flex flex-wrap items-center gap-2 border-t border-amber-300/70 pt-3 dark:border-amber-700/40"
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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatDollars(checkNumber)} buys back {bought.toFixed(2)} points →{" "}
          {formatPercent(d.ownedNow + bought)} after the round.
        </p>
      )}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🤝 An acquirer is offering {formatDollars(d.offerValue)} for{" "}
        <CompanyName id={d.companyId} name={d.companyName} />.
      </p>

      <PitchNotes signals={d.signals} />

      <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Your stake returns
        </p>
        <p className="mt-0.5 text-base font-black text-slate-900 dark:text-slate-100">
          {formatDollars(d.yourShare)}
          {d.invested > 0 && (
            <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {multiple.toFixed(1)}×
            </span>
          )}
        </p>
        {d.invested > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            on {formatDollars(d.invested)} invested
          </p>
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
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

function BridgeCard({ d }: { d: Extract<DecisionView, { type: "bridge" }> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <DecisionShell stamp="SOS">
      <p className="text-sm text-slate-700 dark:text-slate-300">
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

      <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          If you fund it
        </p>
        <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
          {formatPercent(d.ownedNow)} → {formatPercent(d.ownedAfter)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          worth {formatDollars((d.ownedAfter / 100) * d.postMoney)} at this price
        </p>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
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
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🖊️ <CompanyName id={d.companyId} name={d.companyName} /> has two term sheets
        for its {STAGE_LABELS[d.stage as keyof typeof STAGE_LABELS] ?? d.stage}, both
        raising {formatDollars(d.raised)} — and the founder is asking you which to
        sign.
      </p>

      <PitchNotes signals={d.signals} />

      {/* Side by side, since the whole decision is a comparison. */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            🏦 Top-tier lead
          </p>
          <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
            {formatDollars(d.topTierPost)}{" "}
            <Term def="The company's valuation with the new money already counted in. A lower post-money means the same check buys more of the company — everyone gets diluted more.">
              post
            </Term>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            you&apos;d hold {formatPercent(d.ownedTopTier)}
          </p>
        </div>
        <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            🎈 Hype fund
          </p>
          <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
            {formatDollars(d.highPricePost)} post
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            you&apos;d hold {formatPercent(d.ownedHighPrice)}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🧭 Growth has stalled at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />. The founder wants to{" "}
        <Term def="Change the product or market while keeping the team and the money already raised. Most pivots fizzle; a famous few (Slack, Instagram) found the real business.">
          pivot
        </Term>{" "}
        into an adjacent market and is asking for your blessing before betting the
        rest of the runway.
      </p>

      <PitchNotes signals={d.signals} />

      <p className="text-sm text-slate-600 dark:text-slate-400">
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

export function DecisionCard({ decision }: { decision: DecisionView }) {
  if (decision.type === "pro_rata") return <ProRataCard d={decision} />;
  if (decision.type === "acquisition") return <AcquisitionCard d={decision} />;
  if (decision.type === "term_sheet") return <TermSheetCard d={decision} />;
  if (decision.type === "pivot") return <PivotCard d={decision} />;
  return <BridgeCard d={decision} />;
}
