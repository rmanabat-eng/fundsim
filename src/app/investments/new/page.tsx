import { InvestmentForm } from "@/components/InvestmentForm";
import { createInvestment } from "@/app/actions";

export default function NewInvestmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Add investment</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InvestmentForm action={createInvestment} submitLabel="Add investment" />
      </main>
    </div>
  );
}
