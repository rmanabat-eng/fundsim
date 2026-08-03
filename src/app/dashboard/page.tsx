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
import { FundChart, type FundChartPoint } from "@/components/FundChart";
import { FundChartToggle } from "@/components/FundChartToggle";
import { SummaryBar } from "@/components/SummaryBar";
import { CompanyTable, type CompanyRow } from "@/components/CompanyTable";
import { ClearAllButton } from "@/components/ClearAllButton";
import { SimulateYearButton } from "@/components/SimulateYearButton";

export default async function DashboardPage() {
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

  const HOW_IT_WORKS = [
    {
      accent: "var(--max-magenta)",
      title: "Back a company",
      body: "with its name, sector, and the details of the first round you invest in: stage, total raised, post-money valuation, and your check.",
    },
    {
      accent: "var(--max-cyan)",
      title: "Ownership is calculated for you",
      body: "your check ÷ post-money valuation. A $250,000 check at an $8M post-money buys 3.13% of the company.",
    },
    {
      accent: "var(--max-yellow)",
      title: "Add follow-on rounds",
      body: "from a company's page as it raises again. Each new round dilutes your stake by (post-money − raised) ÷ post-money — unless you write another check to defend your ownership.",
    },
    {
      accent: "var(--max-orange)",
      title: "Watch your deployment pacing",
      body: `in the cards above — every check, first or follow-on, comes out of the same ${formatDollars(settings.fundSize)} fund.`,
    },
    {
      accent: "var(--max-purple)",
      title: "Track your markups and TVPI",
      body: "each stake is marked at the company's latest post-money valuation, and TVPI — total value ÷ paid-in capital — is the headline multiple LPs judge a fund by. It's all paper gains until companies exit.",
    },
  ] as const;

  return (
    <div className="max-hero relative min-h-screen bg-[#0d0d1a]">
      <div aria-hidden className="max-pattern-dots pointer-events-none fixed inset-0" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90rem 60rem at 15% 0%, rgba(255,58,242,.16) 0%, transparent 55%), radial-gradient(ellipse 80rem 60rem at 90% 30%, rgba(0,245,212,.13) 0%, transparent 55%), radial-gradient(ellipse 90rem 70rem at 50% 90%, rgba(123,47,255,.16) 0%, transparent 60%)",
        }}
      />
      <header className="relative overflow-hidden border-b-8 border-[color:var(--max-magenta)]">
        <div aria-hidden className="max-pattern-stripes pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <div>
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
            >
              ← Home
            </Link>
            <h1 className="mt-1 font-bungee text-4xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
              Fund Dashboard
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {game
                ? "Your campaign portfolio, in detail"
                : "Free play — the sandbox fund"}{" "}
              ·{" "}
              <Link href="/guide" className="underline decoration-[color:var(--max-cyan)] hover:text-white">
                Learning guide
              </Link>{" "}
              ·{" "}
              <Link href="/settings" className="underline decoration-[color:var(--max-cyan)] hover:text-white">
                Settings
              </Link>{" "}
              ·{" "}
              <Link href="/scenarios" className="underline decoration-[color:var(--max-cyan)] hover:text-white">
                Scenarios
              </Link>
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
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
              <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
                Fund performance
              </h2>
              <FundChartToggle />
            </div>
            <div
              className="max-card mt-3 rounded-2xl p-5 [.chart-hidden_&]:hidden"
              style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
            >
              <FundChart points={chartPoints} />
              <p className="mt-3 text-xs text-white/50">
                Both lines move only when something happens — a check, a round, an
                exit. Early on, total value hugs deployed capital (everything at
                cost); write-offs knock it below, markups and exits pull it away.
                That dip-then-climb is venture&apos;s famous J-curve.
              </p>
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
            Portfolio
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {companies.length > 0 && (
              <SimulateYearButton
                activeCount={rows.filter((r) => r.status === "active").length}
              />
            )}
            {companies.length > 0 && <ClearAllButton />}
            {companies.length < settings.maxCompanies && (
              <Link
                href="/companies/new"
                className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white"
              >
                + Back a company
              </Link>
            )}
          </div>
        </div>

        <div
          className="max-card mt-3 overflow-hidden rounded-2xl"
          style={{ "--max-card-border": "var(--max-purple)" } as React.CSSProperties}
        >
          <CompanyTable companies={rows} />
        </div>

        <section
          className="max-card mt-8 rounded-2xl p-6"
          style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
        >
          <h2 className="font-display text-lg font-bold text-white [text-shadow:2px_2px_0_var(--max-purple)]">
            How it works
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-white/75">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-[#0d0d1a]"
                  style={{ backgroundColor: step.accent }}
                >
                  {i + 1}
                </span>
                <span>
                  <strong className="text-white">{step.title}</strong> {step.body}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
