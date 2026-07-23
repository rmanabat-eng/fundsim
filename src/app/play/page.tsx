import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import {
  currentValue,
  exitProceeds,
  formatDollars,
  formatMultiple,
  formatPercent,
  fundMetrics,
  ownershipAfterRounds,
} from "@/lib/fund-math";
import { GAME_YEARS, MARKET_LABELS, gradeFund, type Market } from "@/lib/campaign";
import { DealCard, type DealView } from "@/components/DealCard";
import { DecisionCard, type DecisionView } from "@/components/DecisionCard";
import { StartCampaignButton } from "@/components/StartCampaignButton";
import { AdvanceYearButton } from "@/components/AdvanceYearButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import type {
  AcquisitionPayload,
  BridgePayload,
  ProRataPayload,
} from "@/app/play/actions";

const GRADE_STYLES = {
  great:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  good: "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  ok: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  bad: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
} as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default async function PlayPage() {
  const [game, settings, companies] = await Promise.all([
    prisma.game.findUnique({ where: { id: 1 } }),
    getSettings(),
    prisma.company.findMany({ include: { rounds: { orderBy: { date: "asc" } } } }),
  ]);

  const metrics = fundMetrics(companies);
  const remaining = settings.fundSize - metrics.deployed;

  // ---- No campaign yet: the pitch ----
  if (!game) {
    return (
      <Shell year={null} market={null}>
        <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Run a {formatDollars(settings.fundSize)} fund for {GAME_YEARS} years.
          </h2>
          <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-slate-600 dark:text-slate-400">
            <li>
              🃏 Each year you&apos;re dealt fresh pitches. The signals on a card
              hint at how the company does — noisily. Learn to read them.
            </li>
            <li>
              ⏳ Deals and decisions expire when the year rolls. Pass on purpose,
              not by accident.
            </li>
            <li>
              📈 Portfolio companies will raise again (fund your pro-rata or get
              diluted), field acquisition offers (cash now vs. the power law), and
              run out of money (bridge them — or don&apos;t).
            </li>
            <li>
              🏁 After year {GAME_YEARS} the fund closes and your TVPI gets graded
              against real venture benchmarks.
            </li>
          </ul>
          <div className="mt-6 flex justify-center">
            <StartCampaignButton
              label="🚀 Start your fund"
              hasPortfolio={companies.length > 0}
            />
          </div>
          {companies.length > 0 && (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Starting a campaign clears the current portfolio — save it as a
              scenario first if you want to keep it.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  // ---- Fund closed: the scorecard ----
  if (game.status === "ended") {
    const grade = gradeFund(metrics.tvpi);
    const positions = companies
      .filter((c) => c.rounds.length > 0)
      .map((c) => {
        const invested = c.rounds.reduce((sum, r) => sum + r.yourCheck, 0);
        const value =
          c.exitValue !== null
            ? exitProceeds(c.rounds, c.exitValue)
            : currentValue(c.rounds);
        return { id: c.id, name: c.name, invested, value, exited: c.exitValue !== null };
      })
      .filter((p) => p.invested > 0)
      .sort((a, b) => b.value - a.value);
    const writeOffs = companies.filter((c) => c.exitValue === 0).length;

    return (
      <Shell year={null} market={null}>
        <div className={`mt-8 rounded-xl border p-6 ${GRADE_STYLES[grade.tone]}`}>
          <p className="text-sm font-medium uppercase tracking-wide opacity-70">
            Fund closed after {GAME_YEARS} years —{" "}
            {metrics.tvpi === null ? "no capital deployed" : formatMultiple(metrics.tvpi)}{" "}
            TVPI
          </p>
          <h2 className="mt-1 text-3xl font-bold">{grade.label}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed">{grade.blurb}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Deployed" value={formatDollars(metrics.deployed)} />
          <Stat label="Distributions" value={formatDollars(metrics.distributions)} />
          <Stat
            label="DPI (cash back)"
            value={metrics.dpi === null ? "—" : formatMultiple(metrics.dpi)}
          />
          <Stat
            label="TVPI"
            value={metrics.tvpi === null ? "—" : formatMultiple(metrics.tvpi)}
          />
          <Stat
            label="IRR"
            value={metrics.irr === null ? "—" : formatPercent(metrics.irr * 100)}
          />
        </div>

        {positions.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Where the returns came from
            </h3>
            <ul className="mt-3 space-y-2">
              {positions.slice(0, 5).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <Link
                    href={`/companies/${p.id}`}
                    className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                  >
                    {p.name}
                  </Link>
                  <span className="text-slate-600 dark:text-slate-400">
                    {formatDollars(p.invested)} →{" "}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {formatDollars(p.value)}
                    </strong>{" "}
                    ({formatMultiple(p.invested > 0 ? p.value / p.invested : 0)}
                    {p.exited ? "" : ", unrealized"})
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              {writeOffs > 0 && (
                <>
                  {writeOffs} {writeOffs === 1 ? "company" : "companies"}{" "}
                  went to zero — that&apos;s venture.{" "}
                </>
              )}
              Companies still active at close are marked at their last round.
            </p>
          </section>
        )}

        <div className="mt-8 flex justify-center">
          <StartCampaignButton label="🔁 Start a new fund" hasPortfolio />
        </div>
      </Shell>
    );
  }

  // ---- Active campaign ----
  const [deals, decisions] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "open", year: game.year },
      orderBy: { postMoney: "asc" },
    }),
    prisma.decision.findMany({
      // An exit freezes the cap table, so decisions about exited companies are moot.
      where: { status: "pending", company: { exitValue: null } },
      include: { company: { include: { rounds: { orderBy: { date: "asc" } } } } },
    }),
  ]);

  const dealViews: DealView[] = deals.map((d) => ({
    id: d.id,
    name: d.name,
    sector: d.sector,
    stage: d.stage,
    raised: d.raised,
    postMoney: d.postMoney,
    signals: JSON.parse(d.signals) as string[],
  }));

  const decisionViews: DecisionView[] = decisions.map((d) => {
    const rounds = d.company.rounds;
    if (d.type === "pro_rata") {
      const payload = JSON.parse(d.payload) as ProRataPayload;
      const ownedNow = ownershipAfterRounds(rounds);
      const ownedBefore = ownershipAfterRounds(
        rounds.filter((r) => r.id !== payload.roundId)
      );
      const proRataCheck = Math.min(
        Math.max(Math.round(((ownedBefore / 100) * payload.raised) / 25_000) * 25_000, 25_000),
        payload.raised
      );
      return {
        id: d.id,
        type: "pro_rata",
        companyId: d.companyId,
        companyName: d.company.name,
        stage: payload.stage,
        raised: payload.raised,
        postMoney: payload.postMoney,
        ownedBefore,
        ownedNow,
        proRataCheck,
      };
    }
    if (d.type === "acquisition") {
      const payload = JSON.parse(d.payload) as AcquisitionPayload;
      return {
        id: d.id,
        type: "acquisition",
        companyId: d.companyId,
        companyName: d.company.name,
        offerValue: payload.offerValue,
        yourShare: (ownershipAfterRounds(rounds) / 100) * payload.offerValue,
        invested: rounds.reduce((sum, r) => sum + r.yourCheck, 0),
      };
    }
    const payload = JSON.parse(d.payload) as BridgePayload;
    return {
      id: d.id,
      type: "bridge",
      companyId: d.companyId,
      companyName: d.company.name,
      amount: payload.amount,
      postMoney: payload.postMoney,
    };
  });

  return (
    <Shell year={game.year} market={game.market as Market}>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Year" value={`${game.year} of ${GAME_YEARS}`} />
        <Stat label="Dry powder" value={formatDollars(remaining)} />
        <Stat
          label="Portfolio value"
          value={formatDollars(metrics.portfolioValue + metrics.distributions)}
        />
        <Stat
          label="TVPI"
          value={metrics.tvpi === null ? "—" : formatMultiple(metrics.tvpi)}
        />
      </div>

      {decisionViews.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500">
            ⚡ Decisions on your desk — unresolved ones expire at year end
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {decisionViews.map((d) => (
              <DecisionCard key={d.id} decision={d} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            This year&apos;s deal flow
          </h2>
          <AdvanceYearButton
            year={game.year}
            openDeals={dealViews.length}
            pendingDecisions={decisionViews.length}
          />
        </div>
        {dealViews.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No open deals left this year. Resolve your decisions, check the{" "}
            <Link href="/" className="underline">
              portfolio
            </Link>
            , and advance when ready.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {dealViews.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}

function Shell({
  year,
  market,
  children,
}: {
  year: number | null;
  market: Market | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Portfolio
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
              Campaign{year !== null && ` — Year ${year}`}
            </h1>
            <p className="text-sm text-white/80 mt-1">
              {market !== null
                ? MARKET_LABELS[market]
                : "A 10-year fund, dealt one year at a time."}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
