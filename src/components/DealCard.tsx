"use client";

import { useActionState, useState } from "react";
import { investInDeal, passDeal } from "@/app/play/actions";
import { formatDollars } from "@/lib/fund-math";
import { STAGE_LABELS } from "@/lib/constants";
import { STAGE_STYLES } from "@/lib/badges";
import { inputClasses } from "@/components/RoundFields";
import { Term } from "@/components/Term";

export type DealView = {
  id: string;
  name: string;
  sector: string;
  stage: string;
  raised: number;
  postMoney: number;
  signals: string[];
};

// The collectible-card art for each sector: a mascot and a banner gradient.
const SECTOR_ART: Record<string, { emoji: string; banner: string }> = {
  "Water Tech": { emoji: "💧", banner: "from-cyan-500 to-sky-600" },
  Climate: { emoji: "🌍", banner: "from-emerald-500 to-teal-600" },
  SaaS: { emoji: "☁️", banner: "from-violet-500 to-indigo-600" },
  Fintech: { emoji: "💳", banner: "from-amber-500 to-orange-600" },
  Health: { emoji: "🩺", banner: "from-rose-500 to-pink-600" },
  Other: { emoji: "🎲", banner: "from-slate-500 to-slate-600" },
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
  const art = SECTOR_ART[deal.sector] ?? SECTOR_ART.Other;

  return (
    <div className="flex h-full flex-col rounded-2xl border-2 border-slate-900/10 bg-white shadow-[5px_5px_0_rgba(15,23,42,0.12)] transition-transform duration-150 hover:-translate-y-1 hover:-rotate-[0.5deg] dark:border-white/10 dark:bg-slate-900 dark:shadow-[5px_5px_0_rgba(0,0,0,0.5)]">
      <div
        className={`flex items-center justify-between gap-2 rounded-t-[14px] bg-gradient-to-r px-5 py-3 ${art.banner}`}
      >
        <h3 className="flex items-center gap-2 text-base font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">
          <span aria-hidden className="text-2xl">
            {art.emoji}
          </span>
          {deal.name}
        </h3>
        <span className="shrink-0 rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
          {deal.sector}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span
            className={`mr-1 rounded px-1.5 py-0.5 text-xs font-bold ring-1 ring-inset ${STAGE_STYLES[deal.stage] ?? ""}`}
          >
            {STAGE_LABELS[deal.stage as keyof typeof STAGE_LABELS] ?? deal.stage}
          </span>
          raising {formatDollars(deal.raised)} at a {formatDollars(deal.postMoney)}{" "}
          <Term def="The company's valuation with the new money already counted in. Your ownership is simply your check ÷ post-money.">
            post-money
          </Term>
          .
        </p>

        <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          {deal.signals.map((s) => (
            <li key={s} className="flex gap-2">
              <span aria-hidden>🔎</span>
              {s}
            </li>
          ))}
        </ul>

        <form
          action={formAction}
          className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
        >
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
              className="btn-arcade shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
            >
              {pending ? "Wiring..." : "💸 Invest"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => passDeal(deal.id)}
              className="btn-arcade shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
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
    </div>
  );
}
