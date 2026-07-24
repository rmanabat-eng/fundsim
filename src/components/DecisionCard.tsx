"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  acceptAcquisition,
  declineDecision,
  fundBridge,
  fundProRata,
  resolvePivot,
  resolveTermSheet,
  type FormState,
} from "@/app/play/actions";
import { formatDollars, formatPercent } from "@/lib/fund-math";
import { STAGE_LABELS } from "@/lib/constants";
import { inputClasses } from "@/components/RoundFields";
import { Term } from "@/components/Term";

// Everything the card needs is computed server-side in the play page —
// ownership math stays in one place (fund-math) and the card just renders.
export type DecisionView =
  | {
      id: string;
      type: "pro_rata";
      companyId: string;
      companyName: string;
      stage: string;
      raised: number;
      postMoney: number;
      ownedBefore: number; // % before this round's dilution
      ownedNow: number; // % after it, with no check written
      proRataCheck: number; // the check that would defend ownedBefore
    }
  | {
      id: string;
      type: "acquisition";
      companyId: string;
      companyName: string;
      offerValue: number;
      yourShare: number; // ownership × offer
      invested: number; // total checks into this company so far
    }
  | {
      id: string;
      type: "bridge";
      companyId: string;
      companyName: string;
      amount: number;
      postMoney: number;
    }
  | {
      id: string;
      type: "term_sheet";
      companyId: string;
      companyName: string;
      stage: string;
      raised: number;
      topTierPost: number;
      highPricePost: number;
      ownedTopTier: number; // your % after signing the top-tier sheet
      ownedHighPrice: number; // your % after signing the high-price sheet
    }
  | {
      id: string;
      type: "pivot";
      companyId: string;
      companyName: string;
    };

const cardClasses =
  "h-full rounded-2xl border-2 border-amber-400 bg-amber-50/70 p-5 shadow-[5px_5px_0_rgba(245,158,11,0.3)] dark:border-amber-600/70 dark:bg-amber-950/20 dark:shadow-[5px_5px_0_rgba(0,0,0,0.5)]";
const primaryButton =
  "btn-arcade shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50";
const secondaryButton =
  "btn-arcade shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300";

// The "EVENT!" stamp in each card's corner names the situation.
function EventStamp({ label }: { label: string }) {
  return (
    <span className="float-right ml-3 -rotate-2 rounded-lg border-2 border-amber-500 bg-amber-400/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-950">
      {label}
    </span>
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

function ProRataCard({ d }: { d: Extract<DecisionView, { type: "pro_rata" }> }) {
  const [state, formAction, pending] = useActionState(
    fundProRata.bind(null, d.id),
    null
  );
  const [isDeclining, startDecline] = useTransition();
  const [check, setCheck] = useState(String(d.proRataCheck));

  const checkNumber = Number(check);
  const bought =
    Number.isFinite(checkNumber) && checkNumber > 0
      ? (checkNumber / d.postMoney) * 100
      : 0;

  return (
    <div className={cardClasses}>
      <EventStamp label="Follow-on" />
      <p className="text-sm text-slate-700 dark:text-slate-300">
        📈 <CompanyName id={d.companyId} name={d.companyName} /> is raising a{" "}
        {STAGE_LABELS[d.stage as keyof typeof STAGE_LABELS] ?? d.stage}:{" "}
        {formatDollars(d.raised)} at a {formatDollars(d.postMoney)} post-money.
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Your {formatPercent(d.ownedBefore)} is being{" "}
        <Term def="New rounds create new shares, so everyone who doesn't buy in owns a smaller slice: your stake × (post-money − raised) ÷ post-money.">
          diluted
        </Term>{" "}
        to <strong>{formatPercent(d.ownedNow)}</strong>.{" "}
        <Term def="Funding your pro-rata means investing enough of the new round to keep your ownership percentage where it was.">
          Defending it
        </Term>{" "}
        costs about <strong>{formatDollars(d.proRataCheck)}</strong> — or sit out and
        keep the cash for other bets.
      </p>
      <form action={formAction} className="mt-3 flex items-center gap-2">
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
        <button type="submit" disabled={pending || isDeclining} className={primaryButton}>
          {pending ? "Wiring..." : "Write the check"}
        </button>
        <button
          type="button"
          disabled={pending || isDeclining}
          onClick={() => startDecline(() => declineDecision(d.id))}
          className={secondaryButton}
        >
          Sit out
        </button>
      </form>
      {bought > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {formatDollars(checkNumber)} buys back {bought.toFixed(2)} points →{" "}
          {formatPercent(d.ownedNow + bought)} after the round.
        </p>
      )}
      {state?.error && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400" role="alert">
          {state.error}
        </p>
      )}
    </div>
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
    <div className={cardClasses}>
      <EventStamp label="Exit offer" />
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🤝 An acquirer is offering {formatDollars(d.offerValue)} for{" "}
        <CompanyName id={d.companyId} name={d.companyName} />. Your stake would
        return <strong>{formatDollars(d.yourShare)}</strong>
        {d.invested > 0 && (
          <>
            {" "}
            — a <strong>{multiple.toFixed(1)}×</strong> on your{" "}
            {formatDollars(d.invested)}
          </>
        )}
        .
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Cash now, or hold for{" "}
        <Term def="In venture, a handful of huge winners return more than everything else combined. Selling a potential winner early caps the outcome that pays for the whole fund.">
          the power law
        </Term>
        ? Declined offers don&apos;t come back — and neither do dead companies.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => acceptAcquisition(d.id))}
          className={primaryButton}
        >
          {pending ? "Signing..." : "Take the exit"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => declineDecision(d.id))}
          className={secondaryButton}
        >
          Hold
        </button>
      </div>
    </div>
  );
}

function BridgeCard({ d }: { d: Extract<DecisionView, { type: "bridge" }> }) {
  const [error, setError] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className={cardClasses}>
      <EventStamp label="SOS" />
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
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Fund it and they get runway to recover. Refuse and they probably
        don&apos;t make it — but bridges to nowhere are how funds bleed out.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setError(await fundBridge(d.id)))}
          className={primaryButton}
        >
          {pending ? "Wiring..." : `Fund the bridge`}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => declineDecision(d.id))}
          className={secondaryButton}
        >
          Refuse
        </button>
      </div>
      {error?.error && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error.error}
        </p>
      )}
    </div>
  );
}

function TermSheetCard({ d }: { d: Extract<DecisionView, { type: "term_sheet" }> }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={cardClasses}>
      <EventStamp label="Term sheets" />
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🖊️ <CompanyName id={d.companyId} name={d.companyName} /> has two term sheets
        for its {STAGE_LABELS[d.stage as keyof typeof STAGE_LABELS] ?? d.stage}, both
        raising {formatDollars(d.raised)} — and the founder is asking you which to
        sign.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
        <li>
          🏦 A top-tier lead at a <strong>{formatDollars(d.topTierPost)}</strong>{" "}
          <Term def="The company's valuation with the new money already counted in. A lower post-money means the same check buys more of the company — everyone gets diluted more.">
            post-money
          </Term>{" "}
          → you&apos;d hold {formatPercent(d.ownedTopTier)}.
        </li>
        <li>
          🎈 A hype fund at a <strong>{formatDollars(d.highPricePost)}</strong>{" "}
          post-money → you&apos;d hold {formatPercent(d.ownedHighPrice)}.
        </li>
      </ul>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Price is one round&apos;s vanity;{" "}
        <Term def="A strong lead investor helps recruit, opens doors, and anchors the next round. That support shifts the company's odds every year after — worth more than a flattering valuation.">
          the partner compounds
        </Term>
        . The higher price keeps more ownership and a bigger paper mark today.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => resolveTermSheet(d.id, "top_tier"))}
          className={primaryButton}
        >
          {pending ? "Advising..." : "🏦 Sign the top-tier lead"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => resolveTermSheet(d.id, "high_price"))}
          className={secondaryButton}
        >
          🎈 Take the higher price
        </button>
      </div>
    </div>
  );
}

function PivotCard({ d }: { d: Extract<DecisionView, { type: "pivot" }> }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={cardClasses}>
      <EventStamp label="Crossroads" />
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🧭 Growth has stalled at{" "}
        <CompanyName id={d.companyId} name={d.companyName} />. The founder wants to{" "}
        <Term def="Change the product or market while keeping the team and the money already raised. Most pivots fizzle; a famous few (Slack, Instagram) found the real business.">
          pivot
        </Term>{" "}
        into an adjacent market and is asking for your blessing before betting the
        rest of the runway.
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Backing the pivot is a high-variance reroll of the company&apos;s odds.
        Urging focus is the safe, small win. Either answer beats silence — an
        unsupported founder pivots anyway, half-hearted.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => resolvePivot(d.id, "back"))}
          className={primaryButton}
        >
          {pending ? "Advising..." : "🎲 Back the pivot"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => resolvePivot(d.id, "focus"))}
          className={secondaryButton}
        >
          🎯 Urge focus
        </button>
      </div>
    </div>
  );
}

export function DecisionCard({ decision }: { decision: DecisionView }) {
  if (decision.type === "pro_rata") return <ProRataCard d={decision} />;
  if (decision.type === "acquisition") return <AcquisitionCard d={decision} />;
  if (decision.type === "term_sheet") return <TermSheetCard d={decision} />;
  if (decision.type === "pivot") return <PivotCard d={decision} />;
  return <BridgeCard d={decision} />;
}
