import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS } from "@/lib/constants";
import { formatDollars, formatPercent, formatDate, ownershipPercent } from "@/lib/fund-math";
import { SummaryBar } from "@/components/SummaryBar";
import { DeleteInvestmentButton } from "@/components/DeleteInvestmentButton";

export default async function Home() {
  const investments = await prisma.investment.findMany({
    orderBy: { investmentDate: "desc" },
  });

  const deployed = investments.reduce((sum, inv) => sum + inv.checkSize, 0);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">FundSim</h1>
          {investments.length < 15 && (
            <Link
              href="/investments/new"
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
            >
              Add investment
            </Link>
          )}
        </div>

        <SummaryBar deployed={deployed} count={investments.length} />

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4">Company</th>
                <th className="py-2 pr-4">Sector</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Check size</th>
                <th className="py-2 pr-4">Post-money valuation</th>
                <th className="py-2 pr-4">Ownership</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {investments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No investments yet.{" "}
                    <Link href="/investments/new" className="underline">
                      Add your first one
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {investments.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">{inv.companyName}</td>
                  <td className="py-3 pr-4">{inv.sector}</td>
                  <td className="py-3 pr-4">{STAGE_LABELS[inv.stage]}</td>
                  <td className="py-3 pr-4">{formatDollars(inv.checkSize)}</td>
                  <td className="py-3 pr-4">{formatDollars(inv.postMoneyValuation)}</td>
                  <td className="py-3 pr-4">
                    {formatPercent(ownershipPercent(inv.checkSize, inv.postMoneyValuation))}
                  </td>
                  <td className="py-3 pr-4">{formatDate(inv.investmentDate)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3 justify-end">
                      <Link
                        href={`/investments/${inv.id}/edit`}
                        className="text-xs font-medium text-blue-600 hover:underline"
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
