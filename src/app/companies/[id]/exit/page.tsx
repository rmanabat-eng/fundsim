import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExitForm } from "@/components/ExitForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { recordExit } from "@/app/actions";

export default async function ExitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { rounds: { orderBy: { date: "asc" } } },
  });
  if (!company) notFound();

  const boundAction = recordExit.bind(null, id);
  const alreadyExited = company.exitValue !== null;
  const latest = company.rounds[company.rounds.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {alreadyExited ? "Edit exit" : "Record exit"} — {company.name}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              An acquisition or IPO turns your stake into cash: ownership × exit
              valuation. A write-off ends the position at $0.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <ExitForm
          action={boundAction}
          cancelHref={`/companies/${id}`}
          defaultValues={
            alreadyExited
              ? {
                  exitValue: company.exitValue ?? undefined,
                  exitDate: company.exitDate?.toISOString().slice(0, 10),
                }
              : undefined
          }
          randomizeFrom={
            latest && {
              postMoney: latest.postMoney,
              date: latest.date.toISOString().slice(0, 10),
            }
          }
        />
      </main>
    </div>
  );
}
