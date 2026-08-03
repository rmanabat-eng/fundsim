"use client";

import { useState } from "react";
import { CompanyForm, type CompanyFormValues } from "@/components/CompanyForm";
import { STARTUP_PRESETS } from "@/lib/presets";
import { generateRandomStartup } from "@/lib/random-startup";
import { SECTOR_STYLES } from "@/lib/badges";
import { STAGE_LABELS } from "@/lib/constants";
import { formatDollars } from "@/lib/fund-math";
import type { FormState } from "@/app/actions";

type Selection =
  | { kind: "blank" }
  | { kind: "preset"; name: string }
  | {
      kind: "random";
      values: CompanyFormValues & { companyName: string };
      description: string;
      nonce: number;
    };

export function StartupPicker({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [selection, setSelection] = useState<Selection>({ kind: "blank" });

  const today = new Date().toISOString().slice(0, 10);

  let formKey = "blank";
  let defaultValues: CompanyFormValues | undefined;

  if (selection.kind === "preset") {
    const preset = STARTUP_PRESETS.find((p) => p.companyName === selection.name);
    if (preset) {
      formKey = `preset-${preset.companyName}`;
      defaultValues = {
        companyName: preset.companyName,
        sector: preset.sector,
        description: preset.blurb,
        stage: preset.stage,
        raised: preset.raised,
        yourCheck: preset.checkSize,
        postMoney: preset.postMoneyValuation,
        date: today,
      };
    }
  } else if (selection.kind === "random") {
    formKey = `random-${selection.nonce}`;
    defaultValues = selection.values;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
          Pick a real startup&hellip;
        </h2>
        <p className="text-xs text-white/40 mt-1">
          Numbers approximate each company&apos;s actual early round — tweak anything
          before investing.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STARTUP_PRESETS.map((p, i) => {
            const isActive =
              selection.kind === "preset" && selection.name === p.companyName;
            const accent = [
              "var(--max-magenta)",
              "var(--max-cyan)",
              "var(--max-yellow)",
              "var(--max-orange)",
              "var(--max-purple)",
            ][i % 5];
            return (
              <button
                key={p.companyName}
                type="button"
                onClick={() => setSelection({ kind: "preset", name: p.companyName })}
                className="max-chip-box rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: isActive ? accent : "rgba(255,255,255,0.16)",
                  boxShadow: isActive ? `3px 3px 0 ${accent}` : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{p.companyName}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      SECTOR_STYLES[p.sector] ?? "bg-white/10 text-white/80"
                    }`}
                  >
                    {p.sector}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/60">{p.blurb}</p>
                <p className="mt-2 text-xs font-bold text-[color:var(--max-cyan)]">
                  {STAGE_LABELS[p.stage]} · {formatDollars(p.checkSize)} at{" "}
                  {formatDollars(p.postMoneyValuation)} post
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
          &hellip;or create your own
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelection({ kind: "blank" })}
            className="max-chip-box rounded-full border-2 px-4 py-2 text-sm font-bold transition-all"
            style={{
              borderColor: selection.kind === "blank" ? "var(--max-magenta)" : "rgba(255,255,255,0.16)",
              color: selection.kind === "blank" ? "var(--max-magenta)" : "rgba(255,255,255,0.7)",
            }}
          >
            Start from a blank form
          </button>
          <button
            type="button"
            onClick={() => {
              const r = generateRandomStartup();
              setSelection({
                kind: "random",
                values: {
                  companyName: r.companyName,
                  sector: r.sector,
                  description: r.description,
                  stage: r.stage,
                  raised: r.raised,
                  yourCheck: r.checkSize,
                  postMoney: r.postMoneyValuation,
                  date: r.investmentDate,
                },
                description: r.description,
                nonce: Date.now(),
              });
            }}
            className="max-chip-box rounded-full border-2 px-4 py-2 text-sm font-bold transition-all"
            style={{
              borderColor: selection.kind === "random" ? "var(--max-yellow)" : "rgba(255,255,255,0.16)",
              color: selection.kind === "random" ? "var(--max-yellow)" : "rgba(255,255,255,0.7)",
            }}
          >
            🎲 Randomize a fake startup
          </button>
        </div>
        {selection.kind === "random" && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-white/40">
              Rolled{" "}
              <strong className="text-[color:var(--max-yellow)]">
                {selection.values.companyName}
              </strong>{" "}
              — click again for a new one, or tweak the form below.
            </p>
            <p className="text-xs text-white/60">{selection.description}</p>
          </div>
        )}
      </div>

      <CompanyForm
        key={formKey}
        action={action}
        submitLabel="Back this company"
        defaultValues={defaultValues}
      />
    </div>
  );
}
