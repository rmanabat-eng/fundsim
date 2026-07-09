"use client";

import { useState } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { STARTUP_PRESETS } from "@/lib/presets";
import { generateRandomStartup } from "@/lib/random-startup";
import { SECTOR_STYLES } from "@/lib/badges";
import { STAGE_LABELS } from "@/lib/constants";
import { formatDollars } from "@/lib/fund-math";
import type { FormState } from "@/app/actions";

type FormValues = {
  companyName: string;
  sector: string;
  stage: string;
  checkSize: number;
  postMoneyValuation: number;
  investmentDate: string;
};

type Selection =
  | { kind: "blank" }
  | { kind: "preset"; name: string }
  | { kind: "random"; values: FormValues; nonce: number };

export function StartupPicker({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [selection, setSelection] = useState<Selection>({ kind: "blank" });

  const today = new Date().toISOString().slice(0, 10);

  let formKey = "blank";
  let defaultValues: FormValues | undefined;

  if (selection.kind === "preset") {
    const preset = STARTUP_PRESETS.find((p) => p.companyName === selection.name);
    if (preset) {
      formKey = `preset-${preset.companyName}`;
      defaultValues = {
        companyName: preset.companyName,
        sector: preset.sector,
        stage: preset.stage,
        checkSize: preset.checkSize,
        postMoneyValuation: preset.postMoneyValuation,
        investmentDate: today,
      };
    }
  } else if (selection.kind === "random") {
    formKey = `random-${selection.nonce}`;
    defaultValues = selection.values;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Pick a real startup&hellip;
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Numbers approximate each company&apos;s actual early round — tweak anything
          before investing.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STARTUP_PRESETS.map((p) => {
            const isActive =
              selection.kind === "preset" && selection.name === p.companyName;
            return (
              <button
                key={p.companyName}
                type="button"
                onClick={() => setSelection({ kind: "preset", name: p.companyName })}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200 shadow-sm dark:bg-violet-950 dark:ring-violet-800"
                    : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{p.companyName}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      SECTOR_STYLES[p.sector] ?? "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {p.sector}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.blurb}</p>
                <p className="mt-2 text-xs font-medium text-violet-700 dark:text-violet-400">
                  {STAGE_LABELS[p.stage]} · {formatDollars(p.checkSize)} at{" "}
                  {formatDollars(p.postMoneyValuation)} post
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          &hellip;or create your own
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelection({ kind: "blank" })}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              selection.kind === "blank"
                ? "border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-violet-700"
            }`}
          >
            Start from a blank form
          </button>
          <button
            type="button"
            onClick={() =>
              setSelection({
                kind: "random",
                values: generateRandomStartup(),
                nonce: Date.now(),
              })
            }
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              selection.kind === "random"
                ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 ring-2 ring-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:ring-fuchsia-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-fuchsia-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-fuchsia-700"
            }`}
          >
            🎲 Randomize a fake startup
          </button>
        </div>
        {selection.kind === "random" && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Rolled <strong className="text-fuchsia-600">{selection.values.companyName}</strong> —
            click again for a new one, or tweak the form below.
          </p>
        )}
      </div>

      <InvestmentForm
        key={formKey}
        action={action}
        submitLabel="Add investment"
        defaultValues={defaultValues}
      />
    </div>
  );
}
