import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Portfolio
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
              Fund settings
            </h1>
            <p className="text-sm text-white/80 mt-1">
              A bigger fund writes bigger checks — and needs bigger exits to return
              it. Change the size and feel how the math shifts.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <SettingsForm
          fundSize={settings.fundSize}
          maxCompanies={settings.maxCompanies}
        />
      </main>
    </div>
  );
}
