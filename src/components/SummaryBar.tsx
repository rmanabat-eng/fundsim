import { FUND_SIZE } from "@/lib/constants";
import { formatDollars, formatMultiple, formatPercent } from "@/lib/fund-math";
import { StatCard } from "@/components/StatCard";

export function SummaryBar({
  deployed,
  portfolioValue,
  distributions,
  irr,
  count,
}: {
  deployed: number;
  portfolioValue: number;
  distributions: number;
  irr: number | null;
  count: number;
}) {
  const remaining = FUND_SIZE - deployed;
  const pctDeployed = (deployed / FUND_SIZE) * 100;
  const tvpi = deployed > 0 ? (portfolioValue + distributions) / deployed : null;
  const dpi = deployed > 0 ? distributions / deployed : null;

  // Fund size ($10M) lives in the page header; the cards track what moves.
  const stats = [
    {
      label: "Total deployed",
      value: formatDollars(deployed),
      gradient: "from-violet-500 to-fuchsia-600",
      hint: "Every check you've written so far — first checks and follow-ons — out of the $10M fund.",
    },
    {
      label: "Remaining capital",
      value: formatDollars(remaining),
      gradient: "from-emerald-500 to-teal-600",
      hint: "Fund size minus deployed. Exits don't refill it — in a real fund, distributions go back to the LPs.",
    },
    {
      label: "Companies",
      value: `${count} / 15`,
      gradient: "from-amber-500 to-orange-600",
      hint: "Portfolio companies backed, out of a maximum of 15.",
    },
    {
      label: "Portfolio value",
      value: formatDollars(portfolioValue),
      gradient: "from-sky-500 to-cyan-600",
      hint: "Your active stakes, each marked at its company's latest post-money valuation. Paper value — nothing is cash until an exit.",
    },
    {
      label: "Distributions",
      value: formatDollars(distributions),
      gradient: "from-lime-500 to-green-600",
      hint: "Cash actually returned to the fund by exits: your ownership × the exit valuation, summed across exited companies.",
    },
    {
      label: "DPI",
      value: dpi === null ? "—" : formatMultiple(dpi),
      gradient: "from-teal-500 to-emerald-600",
      hint: "Distributions to Paid-In: cash returned ÷ capital deployed. The realized multiple — “you can't eat TVPI.”",
    },
    {
      label: "TVPI",
      value: tvpi === null ? "—" : formatMultiple(tvpi),
      gradient: "from-rose-500 to-pink-600",
      hint: "Total Value to Paid-In: (portfolio value + distributions) ÷ capital deployed. The headline multiple — paper plus cash per dollar in.",
    },
    {
      label: "IRR (annualized)",
      value: irr === null ? "—" : formatPercent(irr * 100),
      gradient: "from-indigo-500 to-indigo-600",
      hint: "Internal rate of return: the annualized rate implied by your dated cash flows. Unlike multiples, it rewards getting money back fast.",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
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
