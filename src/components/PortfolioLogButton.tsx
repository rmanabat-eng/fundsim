"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { CompanyRow } from "@/components/CompanyTable";
import { STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import { formatDollars, formatPercent, formatMultiple } from "@/lib/fund-math";

const STATUS_STYLES: Record<CompanyRow["status"], string> = {
  active: "bg-white/10 text-white/70",
  exited: "bg-[color:var(--max-cyan)]/20 text-[color:var(--max-cyan)]",
  "written-off": "bg-[color:var(--max-orange)]/20 text-[color:var(--max-orange)]",
};

const STATUS_LABELS: Record<CompanyRow["status"], string> = {
  active: "Active",
  exited: "Exited",
  "written-off": "Written off",
};

// A quick-glance popup of everything backed so far, reachable from the
// sticky bar — lighter than the full filterable CompanyTable (which stays
// on the dashboard/scorecard): just name, stage, status, and the numbers
// that answer "how's it doing".
export function PortfolioLogButton({ rows }: { rows: CompanyRow[] }) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Portfolio log"
        className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
      >
        📁 Portfolio ({rows.length})
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio log"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[#0d0d1a]/85"
              onClick={() => setOpen(false)}
            />
            <div
              className="max-card-solid relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 shadow-[6px_6px_0_var(--max-cyan)] sm:p-6"
              style={{ "--max-card-border": "var(--max-purple)" } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-lg font-bold text-white">
                  📁 Portfolio ({rows.length})
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="shrink-0 text-xl leading-none text-white/50 hover:text-white"
                >
                  ×
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {rows.map((c) => (
                  <li
                    key={c.id}
                    className="max-chip-box flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{c.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[c.status]}`}
                        >
                          {STATUS_LABELS[c.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            SECTOR_STYLES[c.sector] ?? "bg-white/10 text-white/80"
                          }`}
                        >
                          {c.sector}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                            STAGE_STYLES[c.latestStage] ??
                            "bg-white/10 text-white/80 ring-white/25"
                          }`}
                        >
                          {STAGE_LABELS[c.latestStage as keyof typeof STAGE_LABELS] ??
                            c.latestStage}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-white/70">
                      <p>
                        {formatPercent(c.ownershipPct)} ·{" "}
                        <span className="font-semibold text-white/90">
                          {formatDollars(c.value)}
                        </span>
                      </p>
                      <p
                        className={
                          c.multiple >= 1
                            ? "text-[color:var(--max-cyan)]"
                            : "text-[color:var(--max-orange)]"
                        }
                      >
                        {formatMultiple(c.multiple)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
