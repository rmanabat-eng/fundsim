import { StartupPicker } from "@/components/StartupPicker";
import { createCompany } from "@/app/actions";

export default function NewCompanyPage() {
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
            <h1 className="font-bungee text-4xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
              Back a company
            </h1>
            <p className="text-sm text-white/80 mt-2">
              Invent your own deal, or roll a randomized one
            </p>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-6 py-8">
        <StartupPicker action={createCompany} />
      </main>
    </div>
  );
}
