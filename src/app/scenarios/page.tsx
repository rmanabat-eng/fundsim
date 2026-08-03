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

const cell = "py-3 px-4 text-white/75";

function MetricCells({ m, count }: { m: FundMetrics; count: number }) {
  return (
    <>
      <td className={cell}>{count}</td>
      <td className={cell}>{formatDollars(m.deployed)}</td>
      <td className={cell}>{formatDollars(m.portfolioValue)}</td>
      <td className={cell}>{formatDollars(m.distributions)}</td>
      <td className={cell}>{m.dpi === null ? "—" : formatMultiple(m.dpi)}</td>
      <td className="py-3 px-4 font-semibold text-[color:var(--max-magenta)]">
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
              ← Portfolio
            </Link>
            <h1 className="mt-1 font-bungee text-4xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
              Scenarios
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Snapshot a portfolio, try a different strategy, and compare how each
              fund performed. Loading a scenario replaces your current portfolio —
              save it first.
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
        <SaveScenarioForm />

        <div
          className="max-card mt-6 overflow-x-auto rounded-2xl"
          style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-white/15 bg-white/5 text-left text-xs uppercase tracking-widest font-black text-white/60">
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
              <tr className="border-b border-white/10 bg-[color:var(--max-purple)]/10">
                <td className="py-3 px-4 font-medium text-white">
                  Current portfolio
                </td>
                <td className={cell}>{formatDollars(settings.fundSize)}</td>
                <MetricCells m={current} count={companies.length} />
                <td className="py-3 px-4"></td>
              </tr>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-white/60">
                    No saved scenarios yet. Save your current portfolio above, then
                    clear it and try a different strategy.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/10 last:border-b-0">
                  <td className="py-3 px-4">
                    <span className="font-medium text-white">{r.name}</span>
                    <span className="ml-2 text-xs text-white/40">
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

        <p className="mt-3 text-xs text-white/40">
          Scenario metrics are recomputed from the snapshot, so unrealized values
          stay marked at each company&apos;s last round — comparisons are
          apples-to-apples.
        </p>
      </main>
    </div>
  );
}
