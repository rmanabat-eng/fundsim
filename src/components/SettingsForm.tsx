"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { inputClasses, labelClasses } from "@/components/RoundFields";
import { updateSettings } from "@/app/actions";
import { formatDollars } from "@/lib/fund-math";

const FUND_SIZE_PRESETS = [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];
const MAX_COMPANIES_PRESETS = [5, 10, 15, 20, 30];

// One-click presets for values a slider would fight (precision matters here —
// fund size and max companies both feed exact math the player reasons about).
// "Custom…" swaps in a plain number input for anything off the preset list.
function PresetField({
  name,
  label,
  hint,
  presets,
  format,
  defaultValue,
  min,
  max,
}: {
  name: string;
  label: string;
  hint?: string;
  presets: number[];
  format: (n: number) => string;
  defaultValue: number;
  min: number;
  max?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [custom, setCustom] = useState(!presets.includes(defaultValue));

  return (
    <div>
      <label className={labelClasses} htmlFor={name}>
        {label}
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = !custom && value === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                setValue(p);
                setCustom(false);
              }}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-all ${
                active
                  ? "border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] text-white"
                  : "border-white/25 bg-[#2d1b4e]/60 text-white/75 hover:border-white/40"
              }`}
            >
              {format(p)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustom(true)}
          className={`rounded-full border-2 border-dashed px-4 py-1.5 text-sm font-bold transition-all ${
            custom
              ? "border-[color:var(--max-yellow)] text-white"
              : "border-white/25 text-white/50 hover:border-white/40"
          }`}
        >
          Custom&hellip;
        </button>
      </div>
      {custom ? (
        <input
          id={name}
          name={name}
          type="number"
          min={min}
          max={max}
          step="1"
          required
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className={`mt-2 ${inputClasses}`}
        />
      ) : (
        <input type="hidden" name={name} value={value} />
      )}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export function SettingsForm({
  fundSize,
  maxCompanies,
}: {
  fundSize: number;
  maxCompanies: number;
}) {
  const [state, formAction, pending] = useActionState(updateSettings, null);

  return (
    <form
      action={formAction}
      className="max-card-flat space-y-4 max-w-lg rounded-2xl p-6"
      style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
    >
      <PresetField
        name="fundSize"
        label="Fund size (USD) — total committed capital"
        hint="Can't go below what you've already deployed."
        presets={FUND_SIZE_PRESETS}
        format={formatDollars}
        defaultValue={fundSize}
        min={1}
      />

      <PresetField
        name="maxCompanies"
        label="Max companies — how many bets the fund can make"
        presets={MAX_COMPANIES_PRESETS}
        format={(n) => String(n)}
        defaultValue={maxCompanies}
        min={1}
        max={50}
      />

      {state?.error && (
        <p
          className="rounded-lg border-2 border-[color:var(--max-orange)] bg-[color:var(--max-orange)]/15 px-3 py-2 text-sm text-[color:var(--max-orange)]"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save settings"}
        </button>
        <Link
          href="/"
          className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
