"use client";

import { useState } from "react";
import { CompanyForm, type CompanyFormValues } from "@/components/CompanyForm";
import { generateRandomStartup } from "@/lib/random-startup";
import type { FormState } from "@/app/actions";

type Selection =
  | { kind: "blank" }
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

  const formKey = selection.kind === "random" ? `random-${selection.nonce}` : "blank";
  const defaultValues = selection.kind === "random" ? selection.values : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
          Create your own
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
