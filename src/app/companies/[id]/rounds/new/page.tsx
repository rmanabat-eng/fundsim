import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoundForm } from "@/components/RoundForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { addRound } from "@/app/actions";

export default async function NewRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const boundAction = addRound.bind(null, id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Add round — {company.name}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Log a new financing round. Set your check to 0 if you sat it out — your
              stake will dilute.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <RoundForm
          action={boundAction}
          submitLabel="Add round"
          cancelHref={`/companies/${id}`}
          checkOptional
        />
      </main>
    </div>
  );
}
