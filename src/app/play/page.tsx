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
import {
  GAME_YEARS,
  INVESTMENT_PERIOD_YEARS,
  MARKET_LABELS,
  gradeFund,
  reputation,
  type Market,
} from "@/lib/campaign";
import { DealCard, type DealView } from "@/components/DealCard";
import { DecisionCard, type DecisionView } from "@/components/DecisionCard";
import { StartCampaignButton } from "@/components/StartCampaignButton";
import { AdvanceYearButton } from "@/components/AdvanceYearButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/toast";
import { UndoInvestmentButton } from "@/components/UndoInvestmentButton";
import type {
  AcquisitionPayload,
  BridgePayload,
  ProRataPayload,
  TermSheetPayload,
} from "@/app/play/actions";

const GRADE_STYLES = {
  great:
    "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[6px_6px_0_rgba(16,185,129,0.35)] dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  good: "border-violet-400 bg-violet-50 text-violet-900 shadow-[6px_6px_0_rgba(139,92,246,0.35)] dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200",
  ok: "border-amber-400 bg-amber-50 text-amber-900 shadow-[6px_6px_0_rgba(245,158,11,0.35)] dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  bad: "border-rose-400 bg-rose-50 text-rose-900 shadow-[6px_6px_0_rgba(244,63,94,0.35)] dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
} as const;

const GRADE_EMOJI = { great: "🏆", good: "🥈", ok: "🥉", bad: "💀" } as const;

const REP_EMOJI = { great: "💖", good: "🤝", ok: "🌫️", bad: "👻" } as const;

const REP_BAR_STYLES = {
  great: "from-emerald-400 to-teal-500",
  good: "from-violet-400 to-fuchsia-500",
  ok: "from-amber-400 to-orange-500",
  bad: "from-rose-400 to-pink-500",
} as const;

const MARKET_CHIP_STYLES: Record<Market, string> = {
  bull: "border-emerald-400/70 bg-emerald-400/15 text-emerald-200",
  normal: "border-slate-300/50 bg-white/10 text-slate-200",
  bear: "border-rose-400/70 bg-rose-400/15 text-rose-200",
};

function Stat({
  icon,
  label,
  value,
  accent,
  hint,
  delay = 0,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string; // gradient classes for the icon tile
  hint?: string; // hover definition, StatCard-style
  delay?: number;
}) {
  return (
    <div
      className="group game-deal-in relative flex items-center gap-3 rounded-2xl border-2 border-slate-900/10 bg-white p-3 shadow-[4px_4px_0_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        aria-hidden
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl shadow-inner ${accent}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {hint ? (
            <span
              tabIndex={0}
              className="cursor-help rounded-sm underline decoration-dotted decoration-slate-400 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:decoration-slate-500"
            >
              {label}
              <span className="sr-only">: {hint}</span>
            </span>
          ) : (
            label
          )}
        </p>
        <p className="truncate text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
      {hint && (
        <div
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-1.5 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-600 shadow-lg group-hover:visible group-focus-within:visible dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {hint}
        </div>
      )}
    </div>
  );
}

// Reputation reads the paper trail: every deal and decision row keeps its
// final status, so how you've treated founders so far is all in the database.
async function currentReputation() {
  const [
    bridgesFunded,
    bridgesRefused,
    proRataBacked,
    adviceGiven,
    decisionsExpired,
    dealsExpired,
  ] = await Promise.all([
    prisma.decision.count({ where: { type: "bridge", status: "resolved" } }),
    prisma.decision.count({ where: { type: "bridge", status: "declined" } }),
    prisma.decision.count({ where: { type: "pro_rata", status: "resolved" } }),
    prisma.decision.count({
      where: { type: { in: ["term_sheet", "pivot"] }, status: "resolved" },
    }),
    prisma.decision.count({ where: { status: "expired" } }),
    prisma.deal.count({ where: { status: "expired" } }),
  ]);
  const rep = reputation({
    bridgesFunded,
    bridgesRefused,
    proRataBacked,
    adviceGiven,
    decisionsExpired,
    dealsExpired,
  });
  const drivers = [
    bridgesFunded > 0 &&
      `${bridgesFunded} ${bridgesFunded === 1 ? "bridge" : "bridges"} funded`,
    proRataBacked > 0 &&
      `${proRataBacked} follow-on ${proRataBacked === 1 ? "round" : "rounds"} answered`,
    adviceGiven > 0 &&
      `${adviceGiven} founder ${adviceGiven === 1 ? "call" : "calls"} advised`,
    bridgesRefused > 0 &&
      `${bridgesRefused} ${bridgesRefused === 1 ? "bridge" : "bridges"} refused`,
    decisionsExpired > 0 &&
      `${decisionsExpired} ${decisionsExpired === 1 ? "founder" : "founders"} ghosted`,
    dealsExpired > 0 &&
      `${dealsExpired} ${dealsExpired === 1 ? "pitch" : "pitches"} never answered`,
  ].filter(Boolean) as string[];
  return { rep, drivers };
}

export default async function PlayPage() {
  const [game, settings, companies] = await Promise.all([
    prisma.game.findUnique({ where: { id: 1 } }),
    getSettings(),
    prisma.company.findMany({
      include: { rounds: { orderBy: { date: "asc" } }, deal: true },
    }),
  ]);

  const metrics = fundMetrics(companies);
  const remaining = settings.fundSize - metrics.deployed;

  // ---- No campaign yet: the title screen ----
  if (!game) {
    return (
      <Shell year={null} market={null}>
        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-slate-900/10 bg-white p-8 text-center shadow-[8px_8px_0_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
          <div aria-hidden className="game-float text-6xl">
            🚀
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Run a {formatDollars(settings.fundSize)} fund for {GAME_YEARS} years.
          </h2>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            {[
              {
                icon: "🃏",
                text: `Years 1–${INVESTMENT_PERIOD_YEARS} are the investment period: fresh pitches every year, with signals that (noisily) hint at how each company does. After that, the checkbook closes for new names — just like a real fund.`,
              },
              {
                icon: "⏳",
                text: "Deals and decisions expire when the year rolls. Pass on purpose, not by accident.",
              },
              {
                icon: "📈",
                text: "Portfolio companies will raise again (fund your pro-rata or get diluted), field acquisition offers (cash now vs. the power law), and run out of money (bridge them — or don't).",
              },
              {
                icon: "🧭",
                text: "Founders will also call for advice: which term sheet to sign, whether to pivot. Your answer moves their odds — and your reputation.",
              },
              {
                icon: "🏁",
                text: `After year ${GAME_YEARS} the fund closes and your TVPI gets graded against real venture benchmarks.`,
              },
            ].map((f, i) => (
              <div
                key={f.icon}
                className="game-deal-in flex gap-3 rounded-2xl border-2 border-slate-900/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-800/60"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span aria-hidden className="text-2xl">
                  {f.icon}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
          <p className="game-blink mt-8 text-xs font-black uppercase tracking-[0.3em] text-violet-500 dark:text-violet-400">
            Press start
          </p>
          <div className="mt-2 flex justify-center">
            <StartCampaignButton
              label="🚀 Start your fund"
              hasPortfolio={companies.length > 0}
            />
          </div>
          {companies.length > 0 && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Starting a campaign clears the current portfolio — save it as a
              scenario first if you want to keep it.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  // ---- Fund closed: the game-over scorecard ----
  if (game.status === "ended") {
    const grade = gradeFund(metrics.tvpi);
    const { rep, drivers: repDrivers } = await currentReputation();
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
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <Shell year={null} market={null}>
        <p className="game-blink mt-8 text-center text-xs font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
          Game over
        </p>
        <div
          className={`game-deal-in mt-3 rounded-3xl border-2 p-6 text-center ${GRADE_STYLES[grade.tone]}`}
        >
          <div aria-hidden className="game-float text-6xl">
            {GRADE_EMOJI[grade.tone]}
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide opacity-70">
            Fund closed after {GAME_YEARS} years —{" "}
            {metrics.tvpi === null ? "no capital deployed" : formatMultiple(metrics.tvpi)}{" "}
            TVPI
          </p>
          <h2 className="mt-1 text-4xl font-black tracking-tight">{grade.label}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed">{grade.blurb}</p>
        </div>

        <div
          className={`game-deal-in mt-6 rounded-3xl border-2 p-6 ${GRADE_STYLES[rep.tone]}`}
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span aria-hidden className="game-float text-4xl">
              {REP_EMOJI[rep.tone]}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                VC reputation
              </p>
              <h3 className="text-2xl font-black tracking-tight">{rep.label}</h3>
            </div>
            <div className="ml-auto w-full max-w-xs">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70">
                <span>Founder cred</span>
                <span>{rep.score}/100</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full border border-current/30 bg-white/60 dark:bg-black/30">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${REP_BAR_STYLES[rep.tone]}`}
                  style={{ width: `${rep.score}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed">{rep.blurb}</p>
          {repDrivers.length > 0 && (
            <p className="mt-2 text-xs font-medium opacity-70">
              ⚡ {repDrivers.join(" · ")}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat
            icon="💸"
            label="Deployed"
            value={formatDollars(metrics.deployed)}
            accent="from-indigo-400 to-indigo-600"
            hint="Every check you wrote across the fund's life — first checks, follow-ons, and bridges."
          />
          <Stat
            icon="🏦"
            label="Distributions"
            value={formatDollars(metrics.distributions)}
            accent="from-emerald-400 to-teal-600"
            hint="Cash actually returned by exits: your ownership × the exit valuation, summed. The only money LPs can spend."
            delay={60}
          />
          <Stat
            icon="💰"
            label="DPI (cash back)"
            value={metrics.dpi === null ? "—" : formatMultiple(metrics.dpi)}
            accent="from-amber-400 to-orange-600"
            hint="Distributions to Paid-In: cash returned ÷ capital deployed. The realized multiple — “you can't eat TVPI.”"
            delay={120}
          />
          <Stat
            icon="📊"
            label="TVPI"
            value={metrics.tvpi === null ? "—" : formatMultiple(metrics.tvpi)}
            accent="from-violet-400 to-fuchsia-600"
            hint="Total Value to Paid-In: (paper value + cash back) ÷ capital deployed. The headline multiple LPs grade a fund by."
            delay={180}
          />
          <Stat
            icon="⚡"
            label="IRR"
            value={metrics.irr === null ? "—" : formatPercent(metrics.irr * 100)}
            accent="from-rose-400 to-pink-600"
            hint="Internal rate of return: the annualized rate implied by your dated cash flows. Unlike multiples, it rewards getting money back fast."
            delay={240}
          />
        </div>

        {positions.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              🏅 Where the returns came from
            </h3>
            <ul className="mt-3 space-y-2">
              {positions.slice(0, 5).map((p, i) => (
                <li
                  key={p.id}
                  className="game-deal-in flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-900/10 bg-white px-4 py-3 text-sm shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="w-7 text-lg">
                      {medals[i] ?? `${i + 1}.`}
                    </span>
                    <Link
                      href={`/companies/${p.id}`}
                      className="font-bold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                    >
                      {p.name}
                    </Link>
                  </span>
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
  const { rep } = await currentReputation();

  // First checks written this year, straight from a pitch, that haven't exited
  // — these can be undone (delete the company, reopen the deal) until you advance.
  const backedThisYear = companies
    .filter(
      (c) =>
        c.deal !== null &&
        c.deal.year === game.year &&
        c.deal.status === "invested" &&
        c.exitValue === null
    )
    .map((c) => ({ id: c.id, name: c.name, check: c.rounds[0]?.yourCheck ?? 0 }));
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
    if (d.type === "term_sheet") {
      const payload = JSON.parse(d.payload) as TermSheetPayload;
      const ownedNow = ownershipAfterRounds(rounds);
      // What you'd own after each option's dilution: stake × (post − raised) ÷ post.
      const dilute = (post: number) => (ownedNow * (post - payload.raised)) / post;
      return {
        id: d.id,
        type: "term_sheet",
        companyId: d.companyId,
        companyName: d.company.name,
        stage: payload.stage,
        raised: payload.raised,
        topTierPost: payload.topTierPost,
        highPricePost: payload.highPricePost,
        ownedTopTier: dilute(payload.topTierPost),
        ownedHighPrice: dilute(payload.highPricePost),
      };
    }
    if (d.type === "pivot") {
      return {
        id: d.id,
        type: "pivot",
        companyId: d.companyId,
        companyName: d.company.name,
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
      {/* Year lives in the header pips now, so the HUD is all fund health. */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat
          icon="💰"
          label="Dry powder"
          value={formatDollars(remaining)}
          accent="from-amber-400 to-orange-600"
          hint="Capital you haven't deployed yet. Every check — first, follow-on, or bridge — comes out of this, and exits don't refill it."
        />
        <Stat
          icon="🏢"
          label="Companies backed"
          value={`${companies.length} of ${settings.maxCompanies}`}
          accent="from-indigo-400 to-blue-600"
          hint="Portfolio companies you've written checks into, out of the fund's cap. When it's full, new deals bounce — pace yourself."
          delay={60}
        />
        <Stat
          icon="📈"
          label="Portfolio value"
          value={formatDollars(metrics.portfolioValue + metrics.distributions)}
          accent="from-emerald-400 to-teal-600"
          hint="Active stakes marked at each company's latest post-money valuation, plus cash already returned by exits."
          delay={120}
        />
        <Stat
          icon="🏆"
          label="TVPI"
          value={metrics.tvpi === null ? "—" : formatMultiple(metrics.tvpi)}
          accent="from-violet-400 to-fuchsia-600"
          hint="Total Value to Paid-In: (paper value + cash back) ÷ capital deployed. The headline multiple LPs grade a fund by."
          delay={180}
        />
        <Stat
          icon={REP_EMOJI[rep.tone]}
          label="Reputation"
          value={`${rep.score}/100`}
          accent="from-pink-400 to-rose-600"
          hint="How founders talk about you. Funding bridges and answering follow-ons builds it; a quick no barely costs; ghosting costs the most."
          delay={240}
        />
      </div>

      {backedThisYear.length > 0 && (
        <section className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            ↩ Backed this year — undo before you advance
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {backedThisYear.map((c) => (
              <UndoInvestmentButton
                key={c.id}
                id={c.id}
                name={c.name}
                check={c.check}
              />
            ))}
          </div>
        </section>
      )}

      {decisionViews.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
            ⚡ Decisions on your desk — unresolved ones expire at year end
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {decisionViews.map((d, i) => (
              <div
                key={d.id}
                className="game-deal-in"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <DecisionCard decision={d} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            🃏 This year&apos;s deal flow
          </h2>
          <AdvanceYearButton
            year={game.year}
            openDeals={dealViews.length}
            pendingDecisions={decisionViews.length}
          />
        </div>
        {dealViews.length === 0 ? (
          <p className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {game.year > INVESTMENT_PERIOD_YEARS ? (
              <>
                🔒 The investment period ended after year {INVESTMENT_PERIOD_YEARS} —
                no new pitches. From here it&apos;s portfolio management: pro-ratas,
                bridges, founder calls, and exits. Check the{" "}
                <Link href="/" className="underline">
                  portfolio
                </Link>{" "}
                and advance when ready.
              </>
            ) : (
              <>
                🃏 No cards left in this year&apos;s deck. Resolve your decisions,
                check the{" "}
                <Link href="/" className="underline">
                  portfolio
                </Link>
                , and advance when ready.
              </>
            )}
          </p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {dealViews.map((d, i) => (
              <div
                key={d.id}
                className="game-deal-in"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <DealCard deal={d} />
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}

// Deterministic star positions — render must stay pure, and the server and
// client have to paint the same sky.
const STARS = [
  { top: "12%", left: "6%", size: "6px", delay: "0s" },
  { top: "68%", left: "11%", size: "4px", delay: "0.7s" },
  { top: "24%", left: "19%", size: "5px", delay: "1.4s" },
  { top: "80%", left: "27%", size: "6px", delay: "0.3s" },
  { top: "15%", left: "34%", size: "4px", delay: "1.9s" },
  { top: "55%", left: "41%", size: "5px", delay: "0.9s" },
  { top: "20%", left: "52%", size: "6px", delay: "1.6s" },
  { top: "72%", left: "58%", size: "4px", delay: "0.2s" },
  { top: "10%", left: "66%", size: "5px", delay: "1.1s" },
  { top: "62%", left: "73%", size: "6px", delay: "1.8s" },
  { top: "28%", left: "81%", size: "4px", delay: "0.5s" },
  { top: "76%", left: "88%", size: "5px", delay: "1.3s" },
  { top: "18%", left: "94%", size: "6px", delay: "0.8s" },
] as const;

function YearPips({ year }: { year: number }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="img"
      aria-label={`Year ${year} of ${GAME_YEARS}`}
    >
      {Array.from({ length: GAME_YEARS }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            className={`h-2.5 w-6 rounded-full ${
              n < year
                ? "bg-amber-400"
                : n === year
                  ? "game-blink bg-amber-300"
                  : "bg-white/15"
            }`}
          />
        );
      })}
      <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/70">
        Year {year}/{GAME_YEARS}
      </span>
    </div>
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
      {/* The marquee: always dark, like a game committing to its own art style. */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-950 to-fuchsia-950">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="game-twinkle absolute rounded-full bg-white/80"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
              }}
            />
          ))}
          <span
            className="game-float absolute right-[14%] top-6 text-4xl opacity-90"
            style={{ animationDelay: "0.4s" }}
          >
            🚀
          </span>
          <span
            className="game-float absolute right-[30%] top-8 text-2xl opacity-60"
            style={{ animationDelay: "1.2s" }}
          >
            💰
          </span>
          <span
            className="game-float absolute right-[44%] top-4 text-2xl opacity-50"
            style={{ animationDelay: "2s" }}
          >
            📈
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/"
                className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
              >
                ← Portfolio
              </Link>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300">
                FundSim presents
              </p>
              <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                Campaign
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {market !== null && year !== null ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${MARKET_CHIP_STYLES[market]}`}
                  >
                    {MARKET_LABELS[market]}
                  </span>
                ) : (
                  "A 10-year fund, dealt one year at a time."
                )}
              </p>
            </div>
            <ThemeToggle />
          </div>
          {year !== null && (
            <div className="mt-4">
              <YearPips year={year} />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
