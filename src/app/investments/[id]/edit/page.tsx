import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvestmentForm } from "@/components/InvestmentForm";
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
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Edit investment</h1>
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
