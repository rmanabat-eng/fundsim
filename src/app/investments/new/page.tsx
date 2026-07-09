import { InvestmentForm } from "@/components/InvestmentForm";
import { createInvestment } from "@/app/actions";

export default function NewInvestmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Add investment</h1>
        <InvestmentForm action={createInvestment} submitLabel="Add investment" />
      </main>
    </div>
  );
}
