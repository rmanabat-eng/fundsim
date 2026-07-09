import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import { formatDollars, formatPercent, formatDate, ownershipPercent } from "@/lib/fund-math";
import { SummaryBar } from "@/components/SummaryBar";
import { DeleteInvestmentButton } from "@/components/DeleteInvestmentButton";
import { ClearAllButton } from "@/components/ClearAllButton";

export default async function Home() {
  const investments = await prisma.investment.findMany({
    orderBy: { investmentDate: "desc" },
  });

  const deployed = investments.reduce((sum, inv) => sum + inv.checkSize, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <SummaryBar deployed={deployed} count={investments.length} />

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
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

        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Check size</th>
                <th className="py-3 px-4">Post-money valuation</th>
                <th className="py-3 px-4">Ownership</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {investments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No investments yet.{" "}
                    <Link href="/investments/new" className="text-violet-600 underline">
                      Add your first one
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {investments.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {inv.companyName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        SECTOR_STYLES[inv.sector] ?? "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {inv.sector}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        STAGE_STYLES[inv.stage] ?? "bg-slate-100 text-slate-700 ring-slate-300"
                      }`}
                    >
                      {STAGE_LABELS[inv.stage]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{formatDollars(inv.checkSize)}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {formatDollars(inv.postMoneyValuation)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-violet-700">
                    {formatPercent(ownershipPercent(inv.checkSize, inv.postMoneyValuation))}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(inv.investmentDate)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 justify-end">
                      <Link
                        href={`/investments/${inv.id}/edit`}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteInvestmentButton id={inv.id} companyName={inv.companyName} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                1
              </span>
              <span>
                <strong className="text-slate-800">Add an investment</strong>{" "}with the
                company&apos;s name, sector, stage, your check size, and the post-money
                valuation from the term sheet.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                2
              </span>
              <span>
                <strong className="text-slate-800">Ownership is calculated for you</strong>:
                check size ÷ post-money valuation. A $250,000 check at an $8M post-money
                buys 3.13% of the company.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700">
                3
              </span>
              <span>
                <strong className="text-slate-800">Watch your deployment pacing</strong>{" "}in
                the cards above — total deployed and remaining capital update with every
                deal. You can&apos;t deploy past the $10M fund size.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                4
              </span>
              <span>
                <strong className="text-slate-800">Edit or delete</strong>{" "}any deal from the
                table to correct mistakes — the fund math recalculates instantly.
              </span>
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
