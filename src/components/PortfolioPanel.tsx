import { FundChart, type FundChartPoint } from "@/components/FundChart";
import { CompanyTable, type CompanyRow } from "@/components/CompanyTable";

// The dashboard's chart and table, reused inside campaign mode — collapsed
// during a run so it doesn't bury the deal flow, open on the scorecard where
// reviewing the portfolio is the whole point.
export function PortfolioPanel({
  rows,
  points,
  open = false,
  label = "📊 Fund dashboard",
}: {
  rows: CompanyRow[];
  points: FundChartPoint[];
  open?: boolean;
  label?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <details open={open} className="group mt-8">
      <summary className="inline-flex w-fit cursor-pointer select-none list-none items-center gap-2 rounded-xl border-2 border-slate-900/10 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 shadow-[3px_3px_0_rgba(15,23,42,0.1)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-indigo-400 motion-safe:hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:shadow-[3px_3px_0_rgba(0,0,0,0.45)] [&::-webkit-details-marker]:hidden">
        {label}
        <span
          aria-hidden
          className="text-[10px] transition-transform group-open:rotate-180"
        >
          ▼
        </span>
      </summary>

      <div className="mt-3 space-y-4">
        {points.length >= 2 && (
          <div className="rounded-2xl border-2 border-slate-900/10 bg-white p-5 shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
            <FundChart points={points} />
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Both lines move only when something happens — a check, a round, an
              exit. Write-offs knock total value below deployed capital; markups and
              exits pull it away. That dip-then-climb is the J-curve.
            </p>
          </div>
        )}
        <CompanyTable companies={rows} />
      </div>
    </details>
  );
}
