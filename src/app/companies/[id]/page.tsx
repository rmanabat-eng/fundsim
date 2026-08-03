import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS } from "@/lib/constants";
import { STAGE_STYLES } from "@/lib/badges";
import {
  formatDollars,
  formatPercent,
  formatMultiple,
  formatDate,
  ownershipTimeline,
  valueTimeline,
  companyIrr,
} from "@/lib/fund-math";
import { DeleteRoundButton } from "@/components/DeleteRoundButton";
import { UndoExitButton } from "@/components/UndoExitButton";
import { StakeSparkline } from "@/components/StakeSparkline";
import { StatCard } from "@/components/StatCard";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    // `deal` is set for companies backed in campaign mode — it holds the
    // signals from the pitch you originally bought.
    include: { rounds: { orderBy: { date: "asc" } }, deal: true },
  });

  if (!company) notFound();

  const pitchNotes: string[] = company.deal
    ? (JSON.parse(company.deal.signals) as string[])
    : [];

  const timeline = ownershipTimeline(company.rounds);
  const values = valueTimeline(company.rounds);
  const invested = company.rounds.reduce((sum, r) => sum + r.yourCheck, 0);
  const currentOwnership = timeline[timeline.length - 1] ?? 0;
  const exited = company.exitValue !== null;
  const stakeValue = exited
    ? (currentOwnership / 100) * (company.exitValue ?? 0)
    : values[values.length - 1] ?? 0;
  const multiple = invested > 0 ? stakeValue / invested : 0;
  const latest = company.rounds[company.rounds.length - 1];

  const irr = companyIrr(company);
  const totalLoss = exited && company.exitValue === 0;

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
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
            >
              ← Portfolio
            </Link>
            <h1 className="mt-1 font-bungee text-4xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
              {company.name}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {company.sector} · {STAGE_LABELS[latest.stage]} ·{" "}
              {formatDollars(invested)} invested for {formatPercent(currentOwnership)}
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
        {exited && (
          <div
            className="max-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
            style={
              {
                "--max-card-border":
                  company.exitValue === 0 ? "var(--max-orange)" : "var(--max-cyan)",
              } as React.CSSProperties
            }
          >
            <p className="text-sm text-white/80">
              {company.exitValue === 0 ? (
                <>
                  <strong className="text-white">Written off</strong>
                  {company.exitDate && <> on {formatDate(company.exitDate)}</>} — the
                  company shut down and your {formatDollars(invested)} is gone.
                </>
              ) : (
                <>
                  <strong className="text-white">Exited</strong>
                  {company.exitDate && <> on {formatDate(company.exitDate)}</>} at a{" "}
                  {formatDollars(company.exitValue ?? 0)} valuation — your{" "}
                  {formatPercent(currentOwnership)} returned{" "}
                  <strong className="text-white">{formatDollars(stakeValue)}</strong> in
                  cash ({formatMultiple(multiple)} on {formatDollars(invested)}{" "}
                  invested).
                </>
              )}{" "}
              The cap table is frozen.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href={`/companies/${company.id}/exit`}
                className="text-xs font-bold text-[color:var(--max-cyan)] hover:underline"
              >
                Edit exit
              </Link>
              <UndoExitButton companyId={company.id} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Your ownership"
            value={formatPercent(currentOwnership)}
            gradient="from-indigo-500 to-indigo-600"
            hint="Your slice of the company after every round: each check buys check ÷ post-money, and each round you sit out dilutes what you had."
          />
          <StatCard
            label="Total invested"
            value={formatDollars(invested)}
            gradient="from-violet-500 to-fuchsia-600"
            hint="Every check you've written into this company, first and follow-on."
          />
          <StatCard
            label={exited ? "Exit proceeds" : "Stake value"}
            value={
              <>
                {formatDollars(stakeValue)}{" "}
                <span className="text-sm font-medium text-white/80">
                  {formatMultiple(multiple)}
                </span>
              </>
            }
            gradient="from-sky-500 to-cyan-600"
            hint={
              exited
                ? "Cash returned at exit: your ownership × the exit valuation. The multiple is proceeds ÷ invested."
                : "Your ownership × the latest post-money valuation — paper value, marked to the last round. The multiple is value ÷ invested."
            }
          />
          <StatCard
            label="Latest valuation"
            value={formatDollars(latest.postMoney)}
            gradient="from-emerald-500 to-teal-600"
            hint="The company's post-money valuation from its most recent round — what the whole company was last priced at."
          />
          <StatCard
            label="Rounds"
            value={company.rounds.length}
            gradient="from-amber-500 to-orange-600"
            hint="Financing rounds logged for this company, including ones you sat out."
          />
          <StatCard
            label="IRR"
            value={totalLoss ? "−100%" : irr === null ? "—" : formatPercent(irr * 100)}
            gradient="from-rose-500 to-pink-600"
            hint="Annualized internal rate of return on this position's dated cash flows. Unlike the multiple, it rewards speed: a quick 2× can beat a slow 3×."
          />
        </div>

        {company.rounds.length >= 2 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest font-black text-white/60">
              Stake value by round
            </p>
            <StakeSparkline
              points={company.rounds.map((r, i) => ({
                date: r.date,
                value: values[i],
              }))}
            />
          </div>
        )}

        {pitchNotes.length > 0 && (
          <section
            className="max-card mt-8 rounded-2xl p-5"
            style={{ "--max-card-border": "var(--max-purple)" } as React.CSSProperties}
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
              🔎 Notes from the pitch
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-white/75">
              {pitchNotes.map((s) => (
                <li key={s} className="flex gap-2">
                  <span aria-hidden>·</span>
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/40">
              What the deck said when you backed them. Some of it predicted how this
              turned out; some of it was noise.
            </p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
            Funding rounds
          </h2>
          <div className="flex items-center gap-3">
            {!exited && (
              <Link
                href={`/companies/${company.id}/exit`}
                className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85"
              >
                Record exit
              </Link>
            )}
            {!exited && (
              <Link
                href={`/companies/${company.id}/rounds/new`}
                className="max-btn-primary rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white"
              >
                + Add round
              </Link>
            )}
          </div>
        </div>

        <div
          className="max-card mt-3 overflow-x-auto rounded-2xl"
          style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-white/15 bg-white/5 text-left text-xs uppercase tracking-widest font-black text-white/60">
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total raised</th>
                <th className="py-3 px-4">Post-money</th>
                <th className="py-3 px-4">Your check</th>
                <th className="py-3 px-4">Ownership after</th>
                <th className="py-3 px-4">Stake value</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {company.rounds.map((round, i) => {
                const prev = i > 0 ? timeline[i - 1] : null;
                const delta = prev !== null ? timeline[i] - prev : null;
                const valueDelta = i > 0 ? values[i] - values[i - 1] : null;
                return (
                  <tr key={round.id} className="border-b border-white/10 last:border-b-0">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          STAGE_STYLES[round.stage] ?? "bg-white/10 text-white/80 ring-white/25"
                        }`}
                      >
                        {STAGE_LABELS[round.stage]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">{formatDate(round.date)}</td>
                    <td className="py-3 px-4 text-white/75">
                      {formatDollars(round.raised)}
                    </td>
                    <td className="py-3 px-4 text-white/75">
                      {formatDollars(round.postMoney)}
                    </td>
                    <td className="py-3 px-4 text-white/75">
                      {round.yourCheck > 0 ? (
                        formatDollars(round.yourCheck)
                      ) : (
                        <span className="text-white/40">sat out</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[color:var(--max-magenta)]">
                      {formatPercent(timeline[i])}
                      {delta !== null && (
                        <span
                          className={`ml-2 text-xs font-medium ${
                            delta >= 0
                              ? "text-[color:var(--max-cyan)]"
                              : "text-[color:var(--max-orange)]"
                          }`}
                        >
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(2)} pts
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white/75">
                      {formatDollars(values[i])}
                      {valueDelta !== null && (
                        <span
                          className={`ml-2 text-xs font-medium ${
                            valueDelta >= 0
                              ? "text-[color:var(--max-cyan)]"
                              : "text-[color:var(--max-orange)]"
                          }`}
                        >
                          {valueDelta >= 0 ? "+" : "−"}
                          {formatDollars(Math.abs(valueDelta))}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!exited && (
                        <div className="flex items-center gap-3 justify-end">
                          <Link
                            href={`/companies/${company.id}/rounds/${round.id}/edit`}
                            className="text-xs font-bold text-[color:var(--max-cyan)] hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteRoundButton
                            roundId={round.id}
                            companyId={company.id}
                            isOnlyRound={company.rounds.length === 1}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section
          className="max-card mt-8 rounded-2xl p-6"
          style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
        >
          <h2 className="font-display text-lg font-bold text-white [text-shadow:2px_2px_0_var(--max-purple)]">
            How dilution works here
          </h2>
          <p className="mt-3 text-sm text-white/75 leading-relaxed">
            When {company.name} raises a new round, the new investors&apos; money buys
            newly created shares — so everyone who invested before owns a smaller slice
            of a (hopefully) more valuable company. Your stake gets multiplied by
            (post-money − raised) ÷ post-money each round. Writing a follow-on check adds
            your check ÷ post-money back. The &quot;Ownership after&quot; column shows
            your stake evolving round by round.
          </p>
          <p className="mt-3 text-sm text-white/75 leading-relaxed">
            The &quot;Stake value&quot; column is that ownership marked at each
            round&apos;s post-money valuation — a paper <strong className="text-white">markup</strong> when the
            company raises at a higher price, a markdown when it raises a down round. No
            cash has come back to the fund; the value is only realized when the company
            exits.
          </p>
        </section>
      </main>
    </div>
  );
}
