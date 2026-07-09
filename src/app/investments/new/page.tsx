import { StartupPicker } from "@/components/StartupPicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createInvestment } from "@/app/actions";

export default function NewInvestmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Add investment</h1>
            <p className="text-sm text-white/80 mt-1">
              Back a real startup&apos;s early round, or invent your own deal
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <StartupPicker action={createInvestment} />
      </main>
    </div>
  );
}
