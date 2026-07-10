import { FUND_SIZE } from "@/lib/constants";
import { formatDollars, formatMultiple } from "@/lib/fund-math";

export function SummaryBar({
  deployed,
  portfolioValue,
  count,
}: {
  deployed: number;
  portfolioValue: number;
  count: number;
}) {
  const remaining = FUND_SIZE - deployed;
  const pctDeployed = (deployed / FUND_SIZE) * 100;
  const tvpi = deployed > 0 ? portfolioValue / deployed : null;

  const stats = [
    {
      label: "Fund size",
      value: formatDollars(FUND_SIZE),
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Total deployed",
      value: formatDollars(deployed),
      gradient: "from-violet-500 to-fuchsia-600",
    },
    {
      label: "Remaining capital",
      value: formatDollars(remaining),
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Portfolio value",
      value: formatDollars(portfolioValue),
      gradient: "from-sky-500 to-cyan-600",
    },
    {
      label: "TVPI",
      value: tvpi === null ? "—" : formatMultiple(tvpi),
      gradient: "from-rose-500 to-pink-600",
    },
    {
      label: "Companies",
      value: `${count} / 15`,
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-sm`}
          >
            <p className="text-xs uppercase tracking-wide text-white/80">
              {stat.label}
            </p>
            <p className="text-xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Capital deployed</span>
          <span>{pctDeployed.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-all"
            style={{ width: `${Math.min(pctDeployed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
