import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SummaryBar } from "@/components/SummaryBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InvestmentTable } from "@/components/InvestmentTable";
import { ClearAllButton } from "@/components/ClearAllButton";

export default async function Home() {
  const investments = await prisma.investment.findMany({
    orderBy: { investmentDate: "desc" },
  });

  const deployed = investments.reduce((sum, inv) => sum + inv.checkSize, 0);

  const rows = investments.map((inv) => ({
    id: inv.id,
    companyName: inv.companyName,
    sector: inv.sector,
    stage: inv.stage as string,
    checkSize: inv.checkSize,
    postMoneyValuation: inv.postMoneyValuation,
    investmentDate: inv.investmentDate.toISOString(),
  }));

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
              next deal. By running this fund you&apos;re learning the three mechanics
              every VC lives by: <strong>ownership</strong> (what a check buys at a given
              valuation), <strong>deployment pacing</strong> (spreading limited capital
              across enough bets), and <strong>portfolio construction</strong> (balancing
              sectors, stages, and check sizes).
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <SummaryBar deployed={deployed} count={investments.length} />

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Portfolio
          </h2>
          <div className="flex items-center gap-3">
            {investments.length > 0 && <ClearAllButton />}
            {investments.length < 15 && (
              <Link
                href="/investments/new"
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-colors"
              >
                + Add investment
              </Link>
            )}
          </div>
        </div>

        <InvestmentTable investments={rows} />

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
                  Add an investment
                </strong>{" "}
                with the company&apos;s name, sector, stage, your check size, and the
                post-money valuation from the term sheet.
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
                : check size ÷ post-money valuation. A $250,000 check at an $8M
                post-money buys 3.13% of the company.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                3
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Watch your deployment pacing
                </strong>{" "}
                in the cards above — total deployed and remaining capital update with
                every deal. You can&apos;t deploy past the $10M fund size.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                4
              </span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200">
                  Edit or delete
                </strong>{" "}
                any deal from the table to correct mistakes — the fund math recalculates
                instantly.
              </span>
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
