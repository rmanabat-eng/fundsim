"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { CompanyRow } from "@/components/CompanyTable";
import { CampaignLogList } from "@/components/CampaignLog";
import { FundChart, type FundChartPoint } from "@/components/FundChart";
import type { CampaignLogEntry } from "@/lib/campaign";
import { STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import { formatDollars, formatPercent, formatMultiple } from "@/lib/fund-math";

type Tab = "snapshot" | "history" | "chart";

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
// on the dashboard sandbox, a different tool): just name, stage, status,
// and the numbers that answer "how's it doing". History folds in the
// year-by-year fund log, and Chart folds in the value-over-time trend, so
// "state of things", "what happened", and "how it's trended" all live in
// one place instead of three separate page sections.
export function PortfolioLogButton({
  rows,
  logEntries,
  points,
}: {
  rows: CompanyRow[];
  logEntries: CampaignLogEntry[];
  points: FundChartPoint[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("snapshot");
  if (rows.length === 0) return null;

  return (
    <>
      <button
        type="button"
        data-tour="portfolio-button"
        onClick={() => {
          setOpen(true);
          // The tutorial's gated "go open your portfolio" step listens for
          // this to advance itself instead of requiring a Next click.
          window.dispatchEvent(new Event("fundsim:portfolio-opened"));
        }}
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

              <div className="mt-3 flex gap-1 border-b-2 border-white/10">
                {(["snapshot", "history", "chart"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`-mb-0.5 border-b-2 px-3 py-2 text-xs font-black uppercase tracking-widest ${
                      tab === t
                        ? "border-[color:var(--max-cyan)] text-white"
                        : "border-transparent text-white/50 hover:text-white/80"
                    }`}
                  >
                    {t === "snapshot" ? "Snapshot" : t === "history" ? "History" : "Chart"}
                  </button>
                ))}
              </div>

              {tab === "history" ? (
                <div className="mt-4">
                  <CampaignLogList entries={logEntries} />
                </div>
              ) : tab === "chart" ? (
                <div className="mt-4">
                  {points.length >= 2 ? (
                    <FundChart points={points} />
                  ) : (
                    <p className="text-sm text-white/50">
                      Not enough history yet — the trend line needs at least two events.
                    </p>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
