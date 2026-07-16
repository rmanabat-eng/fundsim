import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import {
  fundMetrics,
  formatDollars,
  formatMultiple,
  formatPercent,
  formatDate,
  type FundCompany,
  type FundMetrics,
} from "@/lib/fund-math";
import { SaveScenarioForm } from "@/components/SaveScenarioForm";
import { ScenarioActions } from "@/components/ScenarioActions";
import { ThemeToggle } from "@/components/ThemeToggle";

const cell = "py-3 px-4 text-slate-700 dark:text-slate-300";

function MetricCells({ m, count }: { m: FundMetrics; count: number }) {
  return (
    <>
      <td className={cell}>{count}</td>
      <td className={cell}>{formatDollars(m.deployed)}</td>
      <td className={cell}>{formatDollars(m.portfolioValue)}</td>
      <td className={cell}>{formatDollars(m.distributions)}</td>
      <td className={cell}>{m.dpi === null ? "—" : formatMultiple(m.dpi)}</td>
      <td className="py-3 px-4 font-semibold text-violet-700 dark:text-violet-400">
        {m.tvpi === null ? "—" : formatMultiple(m.tvpi)}
      </td>
      <td className={cell}>{m.irr === null ? "—" : formatPercent(m.irr * 100)}</td>
    </>
  );
}

export default async function ScenariosPage() {
  const [scenarios, companies, settings] = await Promise.all([
    prisma.scenario.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.company.findMany({
      include: { rounds: { orderBy: { date: "asc" } } },
    }),
    getSettings(),
  ]);

  const current = fundMetrics(companies);

  const rows = scenarios.map((s) => {
    const data = JSON.parse(s.data) as {
      fundSize: number;
      companies: (FundCompany & { rounds: FundCompany["rounds"] })[];
    };
    return {
      id: s.id,
      name: s.name,
      savedAt: s.createdAt,
      fundSize: data.fundSize,
      count: data.companies.length,
      metrics: fundMetrics(data.companies),
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Portfolio
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
              Scenarios
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Snapshot a portfolio, try a different strategy, and compare how each
              fund performed. Loading a scenario replaces your current portfolio —
              save it first.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <SaveScenarioForm />

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
          <table className="w-full text-sm bg-white dark:bg-slate-900">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="py-3 px-4">Scenario</th>
                <th className="py-3 px-4">Fund</th>
                <th className="py-3 px-4">Cos.</th>
                <th className="py-3 px-4">Deployed</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Distributions</th>
                <th className="py-3 px-4">DPI</th>
                <th className="py-3 px-4">TVPI</th>
                <th className="py-3 px-4">IRR</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 bg-violet-50/50 dark:border-slate-800 dark:bg-violet-950/20">
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  Current portfolio
                </td>
                <td className={cell}>{formatDollars(settings.fundSize)}</td>
                <MetricCells m={current} count={companies.length} />
                <td className="py-3 px-4"></td>
              </tr>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    No saved scenarios yet. Save your current portfolio above, then
                    clear it and try a different strategy.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {r.name}
                    </span>
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(r.savedAt)}
                    </span>
                  </td>
                  <td className={cell}>{formatDollars(r.fundSize)}</td>
                  <MetricCells m={r.metrics} count={r.count} />
                  <td className="py-3 px-4">
                    <ScenarioActions id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Scenario metrics are recomputed from the snapshot, so unrealized values
          stay marked at each company&apos;s last round — comparisons are
          apples-to-apples.
        </p>
      </main>
    </div>
  );
}
