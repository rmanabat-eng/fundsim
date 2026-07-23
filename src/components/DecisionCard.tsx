"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  acceptAcquisition,
  declineDecision,
  fundBridge,
  fundProRata,
  type FormState,
} from "@/app/play/actions";
import { formatDollars, formatPercent } from "@/lib/fund-math";
import { STAGE_LABELS } from "@/lib/constants";
import { inputClasses } from "@/components/RoundFields";

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
    };

const cardClasses =
  "rounded-xl border border-amber-300 bg-amber-50/60 p-5 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/20";
const primaryButton =
  "shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50";
const secondaryButton =
  "shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800";

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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        📈 <CompanyName id={d.companyId} name={d.companyName} /> is raising a{" "}
        {STAGE_LABELS[d.stage as keyof typeof STAGE_LABELS] ?? d.stage}:{" "}
        {formatDollars(d.raised)} at a {formatDollars(d.postMoney)} post-money.
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Your {formatPercent(d.ownedBefore)} is being diluted to{" "}
        <strong>{formatPercent(d.ownedNow)}</strong>. Defending it costs about{" "}
        <strong>{formatDollars(d.proRataCheck)}</strong> — or sit out and keep the
        cash for other bets.
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
        Cash now, or hold for the power law? Declined offers don&apos;t come back —
        and neither do dead companies.
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
      <p className="text-sm text-slate-700 dark:text-slate-300">
        🆘 <CompanyName id={d.companyId} name={d.companyName} /> is nearly out of
        cash and asking you for a {formatDollars(d.amount)} bridge at a{" "}
        {formatDollars(d.postMoney)} post-money.
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

export function DecisionCard({ decision }: { decision: DecisionView }) {
  if (decision.type === "pro_rata") return <ProRataCard d={decision} />;
  if (decision.type === "acquisition") return <AcquisitionCard d={decision} />;
  return <BridgeCard d={decision} />;
}
