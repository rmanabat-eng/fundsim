import { formatDollars, formatMultiple, formatPercent } from "@/lib/fund-math";
import { HudStrip } from "@/components/HudStrip";

export function SummaryBar({
  deployed,
  portfolioValue,
  distributions,
  irr,
  count,
  fundSize,
  maxCompanies,
}: {
  deployed: number;
  portfolioValue: number;
  distributions: number;
  irr: number | null;
  count: number;
  fundSize: number;
  maxCompanies: number;
}) {
  const remaining = fundSize - deployed;
  const pctDeployed = (deployed / fundSize) * 100;
  const tvpi = deployed > 0 ? (portfolioValue + distributions) / deployed : null;
  const dpi = deployed > 0 ? distributions / deployed : null;

  // Fund size ($10M) lives in the page header; the strip tracks what moves.
  const stats = [
    {
      icon: "💸",
      label: "Total deployed",
      value: formatDollars(deployed),
      hint: `Every check you've written so far — first checks and follow-ons — out of the ${formatDollars(fundSize)} fund.`,
    },
    {
      icon: "💰",
      label: "Remaining capital",
      value: formatDollars(remaining),
      hint: "Fund size minus deployed. Exits don't refill it — in a real fund, distributions go back to the LPs.",
    },
    {
      icon: "🏢",
      label: "Companies",
      value: `${count} / ${maxCompanies}`,
      hint: `Portfolio companies backed, out of a maximum of ${maxCompanies}.`,
    },
    {
      icon: "📈",
      label: "Portfolio value",
      value: formatDollars(portfolioValue),
      hint: "Your active stakes, each marked at its company's latest post-money valuation. Paper value — nothing is cash until an exit.",
    },
    {
      icon: "🏦",
      label: "Distributions",
      value: formatDollars(distributions),
      hint: "Cash actually returned to the fund by exits: your ownership × the exit valuation, summed across exited companies.",
    },
    {
      icon: "💵",
      label: "DPI",
      value: dpi === null ? "—" : formatMultiple(dpi),
      hint: "Distributions to Paid-In: cash returned ÷ capital deployed. The realized multiple — “you can't eat TVPI.”",
    },
    {
      icon: "🏆",
      label: "TVPI",
      value: tvpi === null ? "—" : formatMultiple(tvpi),
      hint: "Total Value to Paid-In: (portfolio value + distributions) ÷ capital deployed. The headline multiple — paper plus cash per dollar in.",
    },
    {
      icon: "⚡",
      label: "IRR (annualized)",
      value: irr === null ? "—" : formatPercent(irr * 100),
      hint: "Internal rate of return: the annualized rate implied by your dated cash flows. Unlike multiples, it rewards getting money back fast.",
    },
  ];

  return (
    <div>
      <HudStrip stats={stats} />
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>Capital deployed</span>
          <span>{pctDeployed.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full rounded-full border-2 border-white/10 bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--max-magenta)] to-[color:var(--max-cyan)] transition-all"
            style={{ width: `${Math.min(pctDeployed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
