"use client";

import { useState } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { STARTUP_PRESETS } from "@/lib/presets";
import { SECTOR_STYLES } from "@/lib/badges";
import { STAGE_LABELS } from "@/lib/constants";
import { formatDollars } from "@/lib/fund-math";
import type { FormState } from "@/app/actions";

export function StartupPicker({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const preset = STARTUP_PRESETS.find((p) => p.companyName === selected);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pick a real startup&hellip;
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Numbers approximate each company&apos;s actual early round — tweak anything
          before investing.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STARTUP_PRESETS.map((p) => {
            const isActive = selected === p.companyName;
            return (
              <button
                key={p.companyName}
                type="button"
                onClick={() => setSelected(p.companyName)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200 shadow-sm"
                    : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{p.companyName}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      SECTOR_STYLES[p.sector] ?? "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {p.sector}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{p.blurb}</p>
                <p className="mt-2 text-xs font-medium text-violet-700">
                  {STAGE_LABELS[p.stage]} · {formatDollars(p.checkSize)} at{" "}
                  {formatDollars(p.postMoneyValuation)} post
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          &hellip;or create your own
        </h2>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              selected === null
                ? "border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
            }`}
          >
            Start from a blank form
          </button>
        </div>
      </div>

      <InvestmentForm
        key={selected ?? "blank"}
        action={action}
        submitLabel="Add investment"
        defaultValues={
          preset
            ? {
                companyName: preset.companyName,
                sector: preset.sector,
                stage: preset.stage,
                checkSize: preset.checkSize,
                postMoneyValuation: preset.postMoneyValuation,
                investmentDate: today,
              }
            : undefined
        }
      />
    </div>
  );
}
