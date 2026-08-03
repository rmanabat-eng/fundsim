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
      <summary className="max-btn-outline inline-flex w-fit cursor-pointer select-none list-none items-center gap-2 rounded-full border-4 border-[color:var(--max-magenta)] bg-[#2d1b4e]/60 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)] [&::-webkit-details-marker]:hidden">
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
          <div
            className="max-card-flat rounded-2xl p-5"
            style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
          >
            <FundChart points={points} />
            <p className="mt-3 text-xs text-white/50">
              Both lines move only when something happens — a check, a round, an
              exit. Write-offs knock total value below deployed capital; markups and
              exits pull it away. That dip-then-climb is the J-curve.
            </p>
          </div>
        )}
        <div className="max-card-flat overflow-hidden rounded-2xl" style={{ "--max-card-border": "var(--max-purple)" } as React.CSSProperties}>
          <CompanyTable companies={rows} />
        </div>
      </div>
    </details>
  );
}
