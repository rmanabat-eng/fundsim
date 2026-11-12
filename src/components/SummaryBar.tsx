import { GAME_YEARS } from "@/lib/campaign";
import { formatDollars, formatMultiple, formatPercent, managementFees, tvpiHint } from "@/lib/fund-math";
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
  // Same basis as the campaign's "Dry powder": lifetime fees come off the top.
  const investable = fundSize - managementFees(fundSize, GAME_YEARS);
  const remaining = investable - deployed;
  const pctDeployed = (deployed / investable) * 100;
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
      hint: `Money left to invest: the fund, minus ${formatDollars(managementFees(fundSize, GAME_YEARS))} in fees, minus what you've invested. It never refills — in a real fund, cash from a sale goes back to the fund's backers (called LPs).`,
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
      hint: "What your shares in active companies are worth at each one's latest price. Paper value — it isn't cash until a company is sold or goes public.",
    },
    {
      icon: "🏦",
      label: "Distributions",
      value: formatDollars(distributions),
      hint: "Cash that actually came back from companies that were sold or went public: your share × the sale price.",
    },
    {
      icon: "💵",
      label: "DPI",
      value: dpi === null ? "—" : formatMultiple(dpi),
      hint: "Cash you got back for every $1 you invested. 1.0× means you have your money back; anything above is real profit. (DPI: Distributions to Paid-In.)",
    },
    {
      icon: "🏆",
      label: "TVPI",
      value: tvpi === null ? "—" : formatMultiple(tvpi),
      hint: tvpiHint(tvpi, dpi),
    },
    {
      icon: "⚡",
      label: "IRR (annualized)",
      value: irr === null ? "—" : formatPercent(irr * 100),
      hint: "Your yearly rate of return, like an interest rate on the money you invested. Getting money back sooner raises it — a quick 2× can beat a slow 3×. (IRR: internal rate of return.)",
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
