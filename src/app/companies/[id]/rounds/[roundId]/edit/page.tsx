import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVisitorId } from "@/lib/visitor";
import { RoundForm } from "@/components/RoundForm";
import { updateRound } from "@/app/actions";

export default async function EditRoundPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const { id, roundId } = await params;
  const visitorId = await getVisitorId();
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { company: true },
  });
  if (!round || round.companyId !== id || round.visitorId !== visitorId) notFound();

  const boundAction = updateRound.bind(null, roundId, id);

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
          <h1 className="font-bungee text-3xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
            Edit round — {round.company.name}
          </h1>
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-6 py-8">
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
