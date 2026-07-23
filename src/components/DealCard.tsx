"use client";

import { useActionState, useState } from "react";
import { investInDeal, passDeal } from "@/app/play/actions";
import { formatDollars } from "@/lib/fund-math";
import { STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import { inputClasses } from "@/components/RoundFields";

export type DealView = {
  id: string;
  name: string;
  sector: string;
  stage: string;
  raised: number;
  postMoney: number;
  signals: string[];
};

// A pitch card: the numbers, the signals, and a decision. The signals are
// the whole game — some of them (noisily) predict how the company does.
export function DealCard({ deal }: { deal: DealView }) {
  const [state, formAction, pending] = useActionState(
    investInDeal.bind(null, deal.id),
    null
  );
  const [check, setCheck] = useState("");

  const checkNumber = Number(check);
  const ownership =
    Number.isFinite(checkNumber) && checkNumber > 0
      ? (checkNumber / deal.postMoney) * 100
      : null;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {deal.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SECTOR_STYLES[deal.sector] ?? SECTOR_STYLES.Other}`}
        >
          {deal.sector}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        <span
          className={`mr-1 rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STAGE_STYLES[deal.stage] ?? ""}`}
        >
          {STAGE_LABELS[deal.stage as keyof typeof STAGE_LABELS] ?? deal.stage}
        </span>
        raising {formatDollars(deal.raised)} at a {formatDollars(deal.postMoney)}{" "}
        post-money.
      </p>

      <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
        {deal.signals.map((s) => (
          <li key={s} className="flex gap-2">
            <span aria-hidden className="text-slate-300 dark:text-slate-600">
              •
            </span>
            {s}
          </li>
        ))}
      </ul>

      <form action={formAction} className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            name="check"
            type="number"
            min={0}
            max={deal.raised}
            step={25000}
            placeholder="Your check, e.g. 250000"
            value={check}
            onChange={(e) => setCheck(e.target.value)}
            className={inputClasses}
          />
          <button
            type="submit"
            disabled={pending || !ownership}
            className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {pending ? "Wiring..." : "Invest"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => passDeal(deal.id)}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Pass
          </button>
        </div>
        {ownership !== null && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatDollars(checkNumber)} buys <strong>{ownership.toFixed(2)}%</strong>{" "}
            of the company.
          </p>
        )}
        {state?.error && (
          <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
