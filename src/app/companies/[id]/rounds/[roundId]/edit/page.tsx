import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoundForm } from "@/components/RoundForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { updateRound } from "@/app/actions";

export default async function EditRoundPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const { id, roundId } = await params;
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { company: true },
  });
  if (!round || round.companyId !== id) notFound();

  const boundAction = updateRound.bind(null, roundId, id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Edit round — {round.company.name}
          </h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <RoundForm
          action={boundAction}
          submitLabel="Save changes"
          cancelHref={`/companies/${id}`}
          checkOptional
          defaultValues={{
            stage: round.stage,
            date: round.date.toISOString().slice(0, 10),
            raised: round.raised,
            postMoney: round.postMoney,
            yourCheck: round.yourCheck,
          }}
        />
      </main>
    </div>
  );
}
