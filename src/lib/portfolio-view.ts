import {
  currentValue,
  exitProceeds,
  fundTimeline,
  ownershipAfterRounds,
} from "@/lib/fund-math";
import type { CompanyRow } from "@/components/CompanyTable";
import type { FundChartPoint } from "@/components/FundChart";

// Shared shaping for the portfolio table and fund chart, so the dashboard and
// the campaign page can't drift apart in how they present the same portfolio.

type ViewCompany = {
  id: string;
  name: string;
  sector: string;
  exitValue: number | null;
  rounds: {
    stage: string;
    date: Date;
    raised: number;
    postMoney: number;
    yourCheck: number;
  }[];
};

export function toCompanyRows(companies: ViewCompany[]): CompanyRow[] {
  return companies
    .filter((c) => c.rounds.length > 0)
    .map((c) => {
      const latest = c.rounds[c.rounds.length - 1];
      const invested = c.rounds.reduce((sum, r) => sum + r.yourCheck, 0);
      const exited = c.exitValue !== null;
      // Exited stakes are cash in the bank; active ones mark to the last round.
      const value = exited
        ? exitProceeds(c.rounds, c.exitValue ?? 0)
        : currentValue(c.rounds);
      return {
        id: c.id,
        name: c.name,
        sector: c.sector,
        latestStage: latest.stage,
        invested,
        latestPostMoney: latest.postMoney,
        ownershipPct: ownershipAfterRounds(c.rounds),
        value,
        multiple: invested > 0 ? value / invested : 0,
        status: exited
          ? c.exitValue === 0
            ? ("written-off" as const)
            : ("exited" as const)
          : ("active" as const),
        roundCount: c.rounds.length,
        latestDate: latest.date.toISOString(),
      };
    });
}

export function toChartPoints(
  companies: Parameters<typeof fundTimeline>[0]
): FundChartPoint[] {
  return fundTimeline(companies).map((p) => ({
    date: p.date.toISOString(),
    deployed: p.deployed,
    value: p.value,
    distributions: p.distributions,
  }));
}
