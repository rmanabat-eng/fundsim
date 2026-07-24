import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ownershipAfterRounds,
  currentValue,
  exitProceeds,
  fundMetrics,
  fundTimeline,
  formatDollars,
} from "@/lib/fund-math";
import { getSettings } from "@/lib/settings";
import { GAME_YEARS } from "@/lib/campaign";
import { FundChart, type FundChartPoint } from "@/components/FundChart";
import { FundChartToggle } from "@/components/FundChartToggle";
import { SummaryBar } from "@/components/SummaryBar";
import { CompanyTable, type CompanyRow } from "@/components/CompanyTable";
import { ClearAllButton } from "@/components/ClearAllButton";
import { SimulateYearButton } from "@/components/SimulateYearButton";
import { ThemeToggle } from "@/components/ThemeToggle";

// Deterministic star positions — server and client must paint the same sky.
const HERO_STARS = [
  { top: "18%", left: "8%", size: "5px", delay: "0s" },
  { top: "70%", left: "16%", size: "4px", delay: "1.1s" },
  { top: "26%", left: "31%", size: "6px", delay: "0.5s" },
  { top: "64%", left: "44%", size: "4px", delay: "1.7s" },
  { top: "14%", left: "57%", size: "5px", delay: "0.9s" },
  { top: "58%", left: "69%", size: "6px", delay: "0.2s" },
  { top: "22%", left: "78%", size: "4px", delay: "1.4s" },
  { top: "68%", left: "90%", size: "5px", delay: "0.7s" },
] as const;

export default async function Home() {
  const [companies, settings, game] = await Promise.all([
    prisma.company.findMany({
      include: { rounds: { orderBy: { date: "asc" } } },
    }),
    getSettings(),
    prisma.game.findUnique({ where: { id: 1 } }),
  ]);

  const metrics = fundMetrics(companies);

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

  const chartPoints: FundChartPoint[] = fundTimeline(companies).map((p) => ({
    date: p.date.toISOString(),
    deployed: p.deployed,
    value: p.value,
    distributions: p.distributions,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-white tracking-tight">FundSim</h1>
            <p className="text-sm text-white/80 mt-1">
              Simulating a {formatDollars(settings.fundSize)} venture fund ·{" "}
              <Link href="/guide" className="underline hover:text-white">
                Learning guide
              </Link>{" "}
              ·{" "}
              <Link href="/settings" className="underline hover:text-white">
                Settings
              </Link>{" "}
              ·{" "}
              <Link href="/scenarios" className="underline hover:text-white">
                Scenarios
              </Link>
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
        <section className="relative overflow-hidden rounded-3xl border-2 border-slate-900/10 bg-gradient-to-br from-indigo-950 via-violet-950 to-fuchsia-950 p-6 shadow-[8px_8px_0_rgba(15,23,42,0.15)] dark:border-white/10 dark:shadow-[8px_8px_0_rgba(0,0,0,0.5)] sm:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {HERO_STARS.map((s, i) => (
              <span
                key={i}
                className="game-twinkle absolute rounded-full bg-white/80"
                style={{
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  animationDelay: s.delay,
                }}
              />
            ))}
            <span
              className="game-float absolute right-[8%] top-5 text-4xl opacity-90"
              style={{ animationDelay: "0.6s" }}
            >
              🎲
            </span>
          </div>
          <div className="relative flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="min-w-0 flex-1 basis-72">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300">
                The main event
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                Campaign mode
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                Run a {formatDollars(settings.fundSize)} fund for {GAME_YEARS} years:
                get dealt pitches, read the signals, defend your pro-rata, survive
                bear markets — and get graded like a real GP when the fund closes.
              </p>
              {game && game.status === "active" && (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                  ⏳ Run in progress — year {game.year} of {GAME_YEARS}
                </p>
              )}
            </div>
            <Link
              href="/play"
              className="btn-arcade shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-base font-black uppercase tracking-wide text-slate-950"
            >
              {!game
                ? "🚀 Start your fund"
                : game.status === "active"
                  ? `▶ Continue year ${game.year}`
                  : "🏁 See your scorecard"}
            </Link>
          </div>
        </section>

        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {game
            ? "Fund dashboard — your campaign portfolio, in detail"
            : "Free play — the sandbox fund"}
        </p>
        <SummaryBar
          deployed={metrics.deployed}
          portfolioValue={metrics.portfolioValue}
          distributions={metrics.distributions}
          irr={metrics.irr}
          count={companies.length}
          fundSize={settings.fundSize}
          maxCompanies={settings.maxCompanies}
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
            {companies.length > 0 && (
              <SimulateYearButton
                activeCount={rows.filter((r) => r.status === "active").length}
              />
            )}
            {companies.length > 0 && <ClearAllButton />}
            {companies.length < settings.maxCompanies && (
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
                same {formatDollars(settings.fundSize)} fund.
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
