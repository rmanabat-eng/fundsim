import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvestmentForm } from "@/components/InvestmentForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { updateInvestment } from "@/app/actions";

export default async function EditInvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const investment = await prisma.investment.findUnique({ where: { id } });

  if (!investment) notFound();

  const boundAction = updateInvestment.bind(null, id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">Edit investment</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InvestmentForm
          action={boundAction}
          submitLabel="Save changes"
          defaultValues={{
            companyName: investment.companyName,
            sector: investment.sector,
            stage: investment.stage,
            checkSize: investment.checkSize,
            postMoneyValuation: investment.postMoneyValuation,
            investmentDate: investment.investmentDate.toISOString().slice(0, 10),
          }}
        />
      </main>
    </div>
  );
}
