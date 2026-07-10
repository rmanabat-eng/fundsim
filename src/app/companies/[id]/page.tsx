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
  companyCashFlows,
  xirr,
} from "@/lib/fund-math";
import { DeleteRoundButton } from "@/components/DeleteRoundButton";
import { UndoExitButton } from "@/components/UndoExitButton";
import { StakeSparkline } from "@/components/StakeSparkline";
import { StatCard } from "@/components/StatCard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function CompanyPage({
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

  const asOf = new Date(
    Math.max(
      Date.now(),
      ...company.rounds.map((r) => r.date.getTime()),
      company.exitDate?.getTime() ?? 0
    )
  );
  const irr = xirr(
    companyCashFlows(
      company.rounds,
      exited ? { value: company.exitValue ?? 0, date: company.exitDate ?? asOf } : null,
      asOf
    )
  );
  const totalLoss = exited && company.exitValue === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Portfolio
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
              {company.name}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              {company.sector} · {STAGE_LABELS[latest.stage]} ·{" "}
              {formatDollars(invested)} invested for {formatPercent(currentOwnership)}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {exited && (
          <div
            className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              company.exitValue === 0
                ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
            }`}
          >
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {company.exitValue === 0 ? (
                <>
                  <strong>Written off</strong>
                  {company.exitDate && <> on {formatDate(company.exitDate)}</>} — the
                  company shut down and your {formatDollars(invested)} is gone.
                </>
              ) : (
                <>
                  <strong>Exited</strong>
                  {company.exitDate && <> on {formatDate(company.exitDate)}</>} at a{" "}
                  {formatDollars(company.exitValue ?? 0)} valuation — your{" "}
                  {formatPercent(currentOwnership)} returned{" "}
                  <strong>{formatDollars(stakeValue)}</strong> in cash (
                  {formatMultiple(multiple)} on {formatDollars(invested)} invested).
                </>
              )}{" "}
              The cap table is frozen.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href={`/companies/${company.id}/exit`}
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
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
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
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

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Funding rounds
          </h2>
          <div className="flex items-center gap-3">
            {!exited && (
              <Link
                href={`/companies/${company.id}/exit`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Record exit
              </Link>
            )}
            {!exited && (
              <Link
                href={`/companies/${company.id}/rounds/new`}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-colors"
              >
                + Add round
              </Link>
            )}
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
          <table className="w-full text-sm bg-white dark:bg-slate-900">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
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
                  <tr
                    key={round.id}
                    className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          STAGE_STYLES[round.stage] ??
                          "bg-slate-100 text-slate-700 ring-slate-300"
                        }`}
                      >
                        {STAGE_LABELS[round.stage]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {formatDate(round.date)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {formatDollars(round.raised)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {formatDollars(round.postMoney)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {round.yourCheck > 0 ? (
                        formatDollars(round.yourCheck)
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          sat out
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-violet-700 dark:text-violet-400">
                      {formatPercent(timeline[i])}
                      {delta !== null && (
                        <span
                          className={`ml-2 text-xs font-medium ${
                            delta >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(2)} pts
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {formatDollars(values[i])}
                      {valueDelta !== null && (
                        <span
                          className={`ml-2 text-xs font-medium ${
                            valueDelta >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
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
                            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
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

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            How dilution works here
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            When {company.name} raises a new round, the new investors&apos; money buys
            newly created shares — so everyone who invested before owns a smaller slice
            of a (hopefully) more valuable company. Your stake gets multiplied by
            (post-money − raised) ÷ post-money each round. Writing a follow-on check adds
            your check ÷ post-money back. The &quot;Ownership after&quot; column shows
            your stake evolving round by round.
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The &quot;Stake value&quot; column is that ownership marked at each
            round&apos;s post-money valuation — a paper <strong>markup</strong> when the
            company raises at a higher price, a markdown when it raises a down round. No
            cash has come back to the fund; the value is only realized when the company
            exits.
          </p>
        </section>
      </main>
    </div>
  );
}
