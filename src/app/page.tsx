import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ownershipAfterRounds,
  currentValue,
  exitProceeds,
  companyCashFlows,
  xirr,
  fundTimeline,
} from "@/lib/fund-math";
import { FundChart, type FundChartPoint } from "@/components/FundChart";
import { FundChartToggle } from "@/components/FundChartToggle";
import { SummaryBar } from "@/components/SummaryBar";
import { CompanyTable, type CompanyRow } from "@/components/CompanyTable";
import { ClearAllButton } from "@/components/ClearAllButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const companies = await prisma.company.findMany({
    include: { rounds: { orderBy: { date: "asc" } } },
  });

  const deployed = companies
    .flatMap((c) => c.rounds)
    .reduce((sum, r) => sum + r.yourCheck, 0);

  const rows: CompanyRow[] = companies
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

  const portfolioValue = rows
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + r.value, 0);
  const distributions = rows
    .filter((r) => r.status !== "active")
    .reduce((sum, r) => sum + r.value, 0);

  // Value active stakes as of the latest date anywhere in the sim (rounds can
  // be dated in the future), so IRR never has to discount backwards.
  const asOf = new Date(
    Math.max(
      Date.now(),
      ...companies.flatMap((c) => [
        ...c.rounds.map((r) => r.date.getTime()),
        c.exitDate?.getTime() ?? 0,
      ])
    )
  );
  const chartPoints: FundChartPoint[] = fundTimeline(companies).map((p) => ({
    date: p.date.toISOString(),
    deployed: p.deployed,
    value: p.value,
    distributions: p.distributions,
  }));

  const irr = xirr(
    companies.flatMap((c) =>
      companyCashFlows(
        c.rounds,
        c.exitValue !== null
          ? { value: c.exitValue, date: c.exitDate ?? asOf }
          : null,
        asOf
      )
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-white tracking-tight">FundSim</h1>
            <p className="text-sm text-white/80 mt-1">
              Simulating a $10M venture fund
            </p>
            <p className="text-sm text-white/90 mt-3 leading-relaxed">
              You&apos;re the fund manager. Every check you write buys a slice of a
              company — and every dollar deployed is a dollar you can&apos;t use on the
              next deal. By running this fund you&apos;re learning the mechanics every VC
              lives by: <strong>ownership</strong> (what a check buys at a given
              valuation), <strong>dilution</strong> (how later rounds shrink your stake
              unless you follow on), <strong>deployment pacing</strong> (spreading
              limited capital across enough bets), and{" "}
              <strong>portfolio construction</strong> (balancing sectors, stages, and
              check sizes).
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <SummaryBar
          deployed={deployed}
          portfolioValue={portfolioValue}
          distributions={distributions}
          irr={irr}
          count={companies.length}
        />

        {chartPoints.length >= 2 && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Fund performance
              </h2>
              <FundChartToggle />
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 [.chart-hidden_&]:hidden">
              <FundChart points={chartPoints} />
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Both lines move only when something happens — a check, a round, an
                exit. Early on, total value hugs deployed capital (everything at
                cost); write-offs knock it below, markups and exits pull it away.
                That dip-then-climb is venture&apos;s famous J-curve.
              </p>
            </div>
          </section>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Portfolio
          </h2>
          <div className="flex items-center gap-3">
            {companies.length > 0 && <ClearAllButton />}
            {companies.length < 15 && (
              <Link
                href="/companies/new"
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-colors"
              >
                + Back a company
              </Link>
            )}
          </div>
        </div>

        <CompanyTable companies={rows} />

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            How it works
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                1
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Back a company
                </strong>{" "}
                with its name, sector, and the details of the first round you invest in:
                stage, total raised, post-money valuation, and your check.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                2
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Ownership is calculated for you
                </strong>
                : your check ÷ post-money valuation. A $250,000 check at an $8M
                post-money buys 3.13% of the company.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                3
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Add follow-on rounds
                </strong>{" "}
                from a company&apos;s page as it raises again. Each new round dilutes
                your stake by (post-money − raised) ÷ post-money — unless you write
                another check to defend your ownership.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                4
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Watch your deployment pacing
                </strong>{" "}
                in the cards above — every check, first or follow-on, comes out of the
                same $10M fund.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                5
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Track your markups and TVPI
                </strong>
                : each stake is marked at the company&apos;s latest post-money
                valuation, and TVPI — total value ÷ paid-in capital — is the headline
                multiple LPs judge a fund by. It&apos;s all paper gains until companies
                exit.
              </span>
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
