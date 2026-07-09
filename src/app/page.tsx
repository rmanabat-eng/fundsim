import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS } from "@/lib/constants";
import { SECTOR_STYLES, STAGE_STYLES } from "@/lib/badges";
import { formatDollars, formatPercent, formatDate, ownershipPercent } from "@/lib/fund-math";
import { SummaryBar } from "@/components/SummaryBar";
import { DeleteInvestmentButton } from "@/components/DeleteInvestmentButton";

export default async function Home() {
  const investments = await prisma.investment.findMany({
    orderBy: { investmentDate: "desc" },
  });

  const deployed = investments.reduce((sum, inv) => sum + inv.checkSize, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">FundSim</h1>
            <p className="text-sm text-white/80 mt-1">
              Simulating a $10M venture fund
            </p>
          </div>
          {investments.length < 15 && (
            <Link
              href="/investments/new"
              className="rounded-lg bg-white text-violet-700 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-violet-50 transition-colors"
            >
              + Add investment
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <SummaryBar deployed={deployed} count={investments.length} />

        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
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
      </main>
    </div>
  );
}
