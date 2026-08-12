import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVisitorId } from "@/lib/visitor";
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
  campaignLog,
  gradeFund,
  reputation,
  type Market,
} from "@/lib/campaign";
import { DealCard, type DealView } from "@/components/DealCard";
import { DecisionCard, type DecisionView } from "@/components/DecisionCard";
import { StartCampaignButton } from "@/components/StartCampaignButton";
import { FundNamePrompt } from "@/components/FundNamePrompt";
import { DismissAndHomeLink } from "@/components/DismissAndHomeLink";
import { EndCampaignButton } from "@/components/EndCampaignButton";
import { AdvanceYearButton } from "@/components/AdvanceYearButton";
import { Toaster } from "@/components/toast";
import { UndoInvestmentButton } from "@/components/UndoInvestmentButton";
import { CampaignTutorial } from "@/components/CampaignTutorial";
import { CampaignTips } from "@/components/CampaignTips";
import { CampaignLog } from "@/components/CampaignLog";
import { PortfolioPanel } from "@/components/PortfolioPanel";
import { SaveScenarioForm } from "@/components/SaveScenarioForm";
import { toCompanyRows, toChartPoints } from "@/lib/portfolio-view";
import { sectorArt } from "@/lib/sectors";
import type {
  AcquisitionPayload,
  BridgePayload,
  FundSecondaryPayload,
  ProRataPayload,
  TermSheetPayload,
} from "@/app/play/actions";
import type { ExitRoutePayload, PayToPlayPayload } from "@/lib/campaign";

const GRADE_STYLES = {
  great: "border-[color:var(--max-cyan)] bg-[#2d1b4e]/50 backdrop-blur-sm text-white",
  good: "border-[color:var(--max-purple)] bg-[#2d1b4e]/50 backdrop-blur-sm text-white",
  ok: "border-[color:var(--max-yellow)] bg-[#2d1b4e]/50 backdrop-blur-sm text-white",
  bad: "border-[color:var(--max-orange)] bg-[#2d1b4e]/50 backdrop-blur-sm text-white",
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
  bull: "border-[color:var(--max-cyan)] bg-[color:var(--max-cyan)]/15 text-[color:var(--max-cyan)]",
  normal: "border-[color:var(--max-yellow)] bg-[color:var(--max-yellow)]/15 text-[color:var(--max-yellow)]",
  bear: "border-[color:var(--max-magenta)] bg-[color:var(--max-magenta)]/15 text-[color:var(--max-magenta)]",
};

// Rotated per-instance via the `border` prop so a row of stats clashes
// intentionally instead of repeating one accent down the line.
const STAT_BORDERS = [
  "var(--max-yellow)",
  "var(--max-cyan)",
  "var(--max-magenta)",
  "var(--max-purple)",
  "var(--max-orange)",
] as const;

function Stat({
  icon,
  label,
  value,
  accent,
  hint,
  delay = 0,
  index = 0,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string; // gradient classes for the icon tile
  hint?: string; // hover definition, StatCard-style
  delay?: number;
  index?: number;
}) {
  const border = STAT_BORDERS[index % STAT_BORDERS.length];
  return (
    <div
      className="max-card-flat group game-deal-in relative flex items-center gap-3 rounded-2xl p-3 hover:z-30 focus-within:z-30"
      style={{ animationDelay: `${delay}ms`, "--max-card-border": border } as React.CSSProperties}
    >
      <span
        aria-hidden
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl shadow-inner ${accent}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          {hint ? (
            <span
              tabIndex={0}
              className="cursor-help rounded-sm underline decoration-dotted decoration-white/40 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)]"
            >
              {label}
              <span className="sr-only">: {hint}</span>
            </span>
          ) : (
            label
          )}
        </p>
        <p className="truncate font-display text-lg font-bold tabular-nums text-white">
          {value}
        </p>
      </div>
      {hint && (
        <div
          aria-hidden="true"
          className="max-card-flat pointer-events-none invisible absolute left-1/2 top-full z-20 mt-1.5 w-56 -translate-x-1/2 rounded-lg px-3 py-2 text-xs font-normal normal-case tracking-normal text-white/80 group-hover:visible group-focus-within:visible"
          style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

// Reputation reads the paper trail: every deal and decision row keeps its
// final status, so how you've treated founders so far is all in the database.
async function currentReputation(visitorId: string) {
  const [
    bridgesFunded,
    bridgesRefused,
    costlyRefusals,
    proRataBacked,
    flatteringTermSheetsBacked,
    adviceGiven,
    decisionsExpired,
    dealsExpired,
    foundersOusted,
  ] = await Promise.all([
    prisma.decision.count({ where: { visitorId, type: "bridge", status: "resolved" } }),
    prisma.decision.count({
      where: { visitorId, type: { in: ["bridge", "pro_rata"] }, status: "declined" },
    }),
    prisma.decision.count({
      where: { visitorId, type: { in: ["bridge", "pro_rata"] }, status: "declined_costly" },
    }),
    prisma.decision.count({ where: { visitorId, type: "pro_rata", status: "resolved" } }),
    prisma.decision.count({
      where: { visitorId, type: "term_sheet", status: "resolved_flattering" },
    }),
    prisma.decision.count({
      where: {
        visitorId,
        type: { in: ["pivot", "ceo_replacement"] },
        status: "resolved",
      },
    }),
    prisma.decision.count({ where: { visitorId, status: "expired" } }),
    prisma.deal.count({ where: { visitorId, status: "expired" } }),
    prisma.decision.count({ where: { visitorId, status: "ousted" } }),
  ]);
  const rep = reputation({
    bridgesFunded,
    bridgesRefused,
    costlyRefusals,
    proRataBacked,
    flatteringTermSheetsBacked,
    adviceGiven,
    decisionsExpired,
    dealsExpired,
    foundersOusted,
  });
  const drivers = [
    bridgesFunded > 0 &&
      `${bridgesFunded} ${bridgesFunded === 1 ? "bridge" : "bridges"} funded`,
    proRataBacked > 0 &&
      `${proRataBacked} follow-on ${proRataBacked === 1 ? "round" : "rounds"} answered`,
    adviceGiven > 0 &&
      `${adviceGiven} founder ${adviceGiven === 1 ? "call" : "calls"} advised`,
    flatteringTermSheetsBacked > 0 &&
      `${flatteringTermSheetsBacked} flattering ${flatteringTermSheetsBacked === 1 ? "price" : "prices"} backed`,
    bridgesRefused > 0 &&
      `${bridgesRefused} ${bridgesRefused === 1 ? "ask" : "asks"} refused`,
    costlyRefusals > 0 &&
      `${costlyRefusals} trusted ${costlyRefusals === 1 ? "founder" : "founders"} turned down`,
    decisionsExpired > 0 &&
      `${decisionsExpired} ${decisionsExpired === 1 ? "founder" : "founders"} ghosted`,
    dealsExpired > 0 &&
      `${dealsExpired} ${dealsExpired === 1 ? "pitch" : "pitches"} never answered`,
    foundersOusted > 0 &&
      `${foundersOusted} ${foundersOusted === 1 ? "founder" : "founders"} ousted`,
  ].filter(Boolean) as string[];
  return { rep, drivers };
}

export default async function PlayPage() {
  const visitorId = await getVisitorId();
  const [game, settings, companies] = await Promise.all([
    prisma.game.findUnique({ where: { visitorId } }),
    getSettings(),
    prisma.company.findMany({
      where: { visitorId },
      include: { rounds: { orderBy: { date: "asc" } }, deal: true },
    }),
  ]);

  const metrics = fundMetrics(companies);
  const remaining = settings.fundSize - metrics.deployed;

  // ---- No campaign yet: the title screen ----
  if (!game) {
    return (
      <Shell year={null} market={null}>
        <div
          className="max-card mx-auto mt-10 max-w-2xl rounded-3xl p-8 text-center"
          style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}
        >
          <div aria-hidden className="game-float text-6xl">
            🚀
          </div>
          <h2 className="mt-3 font-display text-balance text-3xl font-bold tracking-tight text-white">
            Run a {formatDollars(settings.fundSize)} fund for {GAME_YEARS} years.
          </h2>
          {/* Columns, not a grid: grid rows stretch every box to the tallest in
              the row, which left the short ones half empty. Flowing them lets
              each box end where its text does. */}
          <div className="mt-6 columns-1 gap-3 text-left sm:columns-2">
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
                className="max-chip-box game-deal-in mb-3 flex break-inside-avoid gap-3 rounded-2xl p-4"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span aria-hidden className="text-2xl">
                  {f.icon}
                </span>
                <p className="text-sm text-white/75">{f.text}</p>
              </div>
            ))}
          </div>
          <p className="game-blink mt-8 text-xs font-black uppercase tracking-[0.3em] text-[color:var(--max-cyan)]">
            Press start
          </p>
          <div className="mt-2 flex justify-center">
            <StartCampaignButton
              label="🚀 Start your fund"
              hasPortfolio={companies.length > 0}
            />
          </div>
          {companies.length > 0 && (
            <p className="mt-4 text-xs text-white/50">
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
    // gradeFund's quartile thresholds are calibrated to a full GAME_YEARS
    // run — an early close (End Campaign) skips the grade rather than
    // mislabel a partial fund against those benchmarks.
    const earlyClose = game.year < GAME_YEARS;
    const grade = earlyClose ? null : gradeFund(metrics.tvpi);
    const { rep, drivers: repDrivers } = await currentReputation(visitorId);
    const positions = companies
      .filter((c) => c.rounds.length > 0)
      .map((c) => {
        const invested = c.rounds.reduce((sum, r) => sum + r.yourCheck, 0);
        const value =
          c.exitValue !== null
            ? exitProceeds(c.rounds, c.exitValue)
            : currentValue(c.rounds);
        return {
          id: c.id,
          name: c.name,
          sector: c.sector,
          invested,
          value,
          exited: c.exitValue !== null,
        };
      })
      .filter((p) => p.invested > 0)
      .sort((a, b) => b.value - a.value);
    // Bars are scaled to the biggest position, so the power law is visible at a
    // glance: one winner's bar dwarfs the rest.
    const topValue = Math.max(...positions.map((p) => p.value), 1);
    const deadCompanies = companies.filter((c) => c.exitValue === 0);
    const writeOffs = deadCompanies.length;
    const medals = ["🥇", "🥈", "🥉"];
    const finalLog = campaignLog(companies, game.startedAt, GAME_YEARS);

    return (
      <Shell year={null} market={null} ended>
        <p className="game-blink mt-8 text-center text-xs font-black uppercase tracking-[0.4em] text-white/50">
          Game over
        </p>
        <h2 className="mt-1 text-center font-display text-xl font-bold text-white/80">
          {game.name}
        </h2>
        <div
          className={`game-deal-in mt-3 rounded-3xl border-4 p-6 text-center ${
            earlyClose ? GRADE_STYLES.ok : GRADE_STYLES[grade!.tone]
          }`}
        >
          <div aria-hidden className="game-float text-6xl">
            {earlyClose ? "🚩" : GRADE_EMOJI[grade!.tone]}
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide opacity-70">
            Fund closed{" "}
            {earlyClose ? `early at year ${game.year}` : `after ${GAME_YEARS} years`} —{" "}
            {metrics.tvpi === null ? "no capital deployed" : formatMultiple(metrics.tvpi)}{" "}
            TVPI
          </p>
          {/* The one hero moment that gets the poster face — everything else
              on the scorecard stays on the calmer display font. */}
          <h2 className="mt-1 font-bungee text-4xl font-normal uppercase">
            {earlyClose ? "Early close" : grade!.label}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed">
            {earlyClose
              ? `You ended this run before year ${GAME_YEARS} — too early for a fair quartile grade against a full-length fund.`
              : grade!.blurb}
          </p>
        </div>

        <div
          className={`game-deal-in mt-6 rounded-3xl border-4 p-6 ${GRADE_STYLES[rep.tone]}`}
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
              <h3 className="font-display text-2xl font-bold tracking-tight">
                {rep.label}
              </h3>
            </div>
            <div className="ml-auto w-full max-w-xs">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70">
                <span>Founder cred</span>
                <span>{rep.score}/100</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full border border-current/30 bg-black/30">
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
            index={0}
          />
          <Stat
            icon="🏦"
            label="Distributions"
            value={formatDollars(metrics.distributions)}
            accent="from-emerald-400 to-teal-600"
            hint="Cash actually returned by exits: your ownership × the exit valuation, summed. The only money LPs can spend."
            delay={60}
            index={1}
          />
          <Stat
            icon="💰"
            label="DPI (cash back)"
            value={metrics.dpi === null ? "—" : formatMultiple(metrics.dpi)}
            accent="from-amber-400 to-orange-600"
            hint="Distributions to Paid-In: cash returned ÷ capital deployed. The realized multiple — “you can't eat TVPI.”"
            delay={120}
            index={2}
          />
          <Stat
            icon="📊"
            label="TVPI"
            value={metrics.tvpi === null ? "—" : formatMultiple(metrics.tvpi)}
            accent="from-violet-400 to-fuchsia-600"
            hint="Total Value to Paid-In: (paper value + cash back) ÷ capital deployed. The headline multiple LPs grade a fund by."
            delay={180}
            index={3}
          />
          <Stat
            icon="⚡"
            label="IRR"
            value={metrics.irr === null ? "—" : formatPercent(metrics.irr * 100)}
            accent="from-rose-400 to-pink-600"
            hint="Internal rate of return: the annualized rate implied by your dated cash flows. Unlike multiples, it rewards getting money back fast."
            delay={240}
            index={4}
          />
        </div>

        {positions.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
              🏅 Where the returns came from
            </h3>
            <ul className="mt-3 space-y-2">
              {positions.slice(0, 5).map((p, i) => {
                const multiple = p.invested > 0 ? p.value / p.invested : 0;
                const art = sectorArt(p.sector);
                const border = STAT_BORDERS[i % STAT_BORDERS.length];
                return (
                  <li
                    key={p.id}
                    className="max-card-flat game-deal-in relative overflow-hidden rounded-2xl"
                    style={{ animationDelay: `${i * 90}ms`, "--max-card-border": border } as React.CSSProperties}
                  >
                    {/* The bar is the point: its length is this position's share
                        of the best one, so the skew is impossible to miss. */}
                    <div
                      aria-hidden
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r opacity-30 ${art.banner}`}
                      style={{ width: `${Math.max((p.value / topValue) * 100, 1.5)}%` }}
                    />
                    <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="w-7 text-lg">
                          {medals[i] ?? `${i + 1}.`}
                        </span>
                        <span aria-hidden className="text-lg">
                          {art.emoji}
                        </span>
                        <Link
                          href={`/companies/${p.id}`}
                          className="font-bold text-white underline-offset-2 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </span>
                      <span className="flex items-baseline gap-3">
                        <span className="text-xs text-white/60">
                          {formatDollars(p.invested)} →{" "}
                          <strong className="text-white/90">
                            {formatDollars(p.value)}
                          </strong>
                          {p.exited ? "" : " (unrealized)"}
                        </span>
                        {/* The headline number gets to be a headline. */}
                        <strong
                          className={`font-display text-xl font-bold tabular-nums ${
                            multiple >= 3
                              ? "text-[color:var(--max-cyan)]"
                              : multiple >= 1
                                ? "text-white"
                                : "text-[color:var(--max-orange)]"
                          }`}
                        >
                          {formatMultiple(multiple)}
                        </strong>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-white/40">
              Companies still active at close are marked at their last round.
            </p>
          </section>
        )}

        {deadCompanies.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-[color:var(--max-orange)]">
              💀 The graveyard — {writeOffs}{" "}
              {writeOffs === 1 ? "company" : "companies"} went to zero
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {deadCompanies.map((c) => {
                const sunk = c.rounds.reduce((sum, r) => sum + r.yourCheck, 0);
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border-4 border-[color:var(--max-orange)] bg-[#2d1b4e]/50 px-4 py-3 text-sm backdrop-blur-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="text-lg grayscale">
                        {sectorArt(c.sector).emoji}
                      </span>
                      <Link
                        href={`/companies/${c.id}`}
                        className="font-bold text-white underline-offset-2 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </span>
                    <span className="font-bold tabular-nums text-[color:var(--max-orange)]">
                      −{formatDollars(sunk)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-white/40">
              That&apos;s venture — roughly a third of a portfolio going to zero is
              normal. The winners are supposed to pay for them.
            </p>
          </section>
        )}

        <CampaignLog entries={finalLog} />

        <PortfolioPanel
          rows={toCompanyRows(companies)}
          points={toChartPoints(companies)}
        />

        <section
          className="max-card-flat mt-8 rounded-2xl p-5"
          style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
            💾 Save this run
          </h3>
          <p className="mt-1 text-sm text-white/70">
            Keep this fund as a scenario so you can compare it against your next
            one — starting a new fund clears the portfolio.
          </p>
          <div className="mt-3">
            <SaveScenarioForm />
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StartCampaignButton label="🔁 Start a new fund" hasPortfolio />
          <Link
            href="/settings"
            className="max-btn-outline rounded-full border-4 border-white/25 bg-[#2d1b4e]/60 px-4 py-2 text-sm font-bold text-white/85"
          >
            ⚙️ Adjust fund settings
          </Link>
        </div>
      </Shell>
    );
  }

  // ---- Active campaign ----
  const { rep } = await currentReputation(visitorId);

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
      where: { visitorId, status: "open", year: game.year },
      orderBy: { postMoney: "asc" },
    }),
    prisma.decision.findMany({
      // An exit freezes the cap table, so decisions about exited companies are moot.
      where: { visitorId, status: "pending", company: { exitValue: null } },
      include: {
        company: {
          // `deal` carries the original pitch signals, so a decision can show
          // you what you liked about this company in the first place.
          include: { rounds: { orderBy: { date: "asc" } }, deal: true },
        },
      },
    }),
  ]);

  const dealViews: DealView[] = deals.map((d) => ({
    id: d.id,
    name: d.name,
    sector: d.sector,
    stage: d.stage,
    raised: d.raised,
    postMoney: d.postMoney,
    description: d.description,
    referredBy: d.referredBy,
    signals: JSON.parse(d.signals) as string[],
  }));

  const decisionViews: DecisionView[] = decisions.map((d) => {
    const rounds = d.company.rounds;
    // The pitch signals, so a decision can remind you why you backed them.
    const signals = d.company.deal
      ? (JSON.parse(d.company.deal.signals) as string[])
      : [];
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
        signals,
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
        signals,
      };
    }
    if (d.type === "fund_secondary") {
      const payload = JSON.parse(d.payload) as FundSecondaryPayload;
      return {
        id: d.id,
        type: "fund_secondary",
        companyId: d.companyId,
        companyName: d.company.name,
        offerValue: payload.offerValue,
        yourShare: (ownershipAfterRounds(rounds) / 100) * payload.offerValue,
        invested: rounds.reduce((sum, r) => sum + r.yourCheck, 0),
        signals,
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
        signals,
      };
    }
    if (d.type === "pivot") {
      return {
        id: d.id,
        type: "pivot",
        companyId: d.companyId,
        companyName: d.company.name,
        signals,
      };
    }
    if (d.type === "ceo_replacement") {
      return {
        id: d.id,
        type: "ceo_replacement",
        companyId: d.companyId,
        companyName: d.company.name,
        signals,
      };
    }
    if (d.type === "exit_route") {
      const payload = JSON.parse(d.payload) as ExitRoutePayload;
      return {
        id: d.id,
        type: "exit_route",
        companyId: d.companyId,
        companyName: d.company.name,
        stage: payload.stage,
        postMoney: payload.postMoney,
        ipoLow: payload.ipoLow,
        ipoHigh: payload.ipoHigh,
        ipoPullChance: payload.ipoPullChance,
        acquisitionOffer: payload.acquisitionOffer,
        secondaryValuation: payload.secondaryValuation,
        owned: ownershipAfterRounds(rounds),
        signals,
      };
    }
    if (d.type === "pay_to_play") {
      const payload = JSON.parse(d.payload) as PayToPlayPayload;
      const ownedNow = ownershipAfterRounds(rounds);
      // Participating dilutes you like any round, then your check buys back in;
      // sitting out converts the whole stake at the punitive recap price.
      const dilute = (owned: number, post: number) =>
        (owned * (post - payload.raised)) / post;
      return {
        id: d.id,
        type: "pay_to_play",
        companyId: d.companyId,
        companyName: d.company.name,
        stage: payload.stage,
        raised: payload.raised,
        postMoney: payload.postMoney,
        requiredCheck: payload.requiredCheck,
        ownedNow,
        ownedIfPay:
          dilute(ownedNow, payload.postMoney) +
          (payload.requiredCheck / payload.postMoney) * 100,
        ownedIfDecline: dilute(ownedNow, payload.recapPostMoney),
        signals,
      };
    }
    const payload = JSON.parse(d.payload) as BridgePayload;
    // You fund the whole bridge, so your stake is diluted by the new money and
    // then topped back up by the slice that money buys.
    const ownedNow = ownershipAfterRounds(rounds);
    const ownedAfter =
      (ownedNow * (payload.postMoney - payload.amount)) / payload.postMoney +
      (payload.amount / payload.postMoney) * 100;
    return {
      id: d.id,
      type: "bridge",
      companyId: d.companyId,
      companyName: d.company.name,
      amount: payload.amount,
      postMoney: payload.postMoney,
      ownedNow,
      ownedAfter,
      signals,
    };
  });

  return (
    <Shell year={game.year} market={game.market as Market}>
      {game.year === 1 && game.name === "Untitled Fund" && <FundNamePrompt />}
      <CampaignTips />

      {/* Year lives in the header pips now, so the HUD is all fund health. */}
      <div data-tour="hud" className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat
          icon="💰"
          label="Dry powder"
          value={formatDollars(remaining)}
          accent="from-amber-400 to-orange-600"
          hint="Capital you haven't deployed yet. Every check — first, follow-on, or bridge — comes out of this, and exits don't refill it."
          index={0}
        />
        <Stat
          icon="🏢"
          label="Companies backed"
          value={`${companies.length} of ${settings.maxCompanies}`}
          accent="from-indigo-400 to-blue-600"
          hint="Portfolio companies you've written checks into, out of the fund's cap. When it's full, new deals bounce — pace yourself."
          delay={60}
          index={1}
        />
        <Stat
          icon="📈"
          label="Portfolio value"
          value={formatDollars(metrics.portfolioValue + metrics.distributions)}
          accent="from-emerald-400 to-teal-600"
          hint="Active stakes marked at each company's latest post-money valuation, plus cash already returned by exits."
          delay={120}
          index={2}
        />
        <Stat
          icon="🏆"
          label="TVPI"
          value={metrics.tvpi === null ? "—" : formatMultiple(metrics.tvpi)}
          accent="from-violet-400 to-fuchsia-600"
          hint="Total Value to Paid-In: (paper value + cash back) ÷ capital deployed. The headline multiple LPs grade a fund by."
          delay={180}
          index={3}
        />
        <Stat
          icon={REP_EMOJI[rep.tone]}
          label="Reputation"
          value={`${rep.score}/100`}
          accent="from-pink-400 to-rose-600"
          hint="How founders talk about you. Funding bridges and answering follow-ons builds it; a quick no barely costs; ghosting costs the most."
          delay={240}
          index={4}
        />
      </div>

      {backedThisYear.length > 0 && (
        <section className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">
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
          <h2 className="text-sm font-black uppercase tracking-widest text-[color:var(--max-yellow)]">
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
        <AdvanceYearButton
          year={game.year}
          openDeals={dealViews.length}
          pendingDecisions={decisionViews.length}
          heading={
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
              🃏 This year&apos;s deal flow{" "}
              <span className="text-white/40">
                (Year {game.year})
              </span>
            </h2>
          }
        />
        {dealViews.length === 0 ? (
          <p className="mt-4 rounded-2xl border-4 border-dashed border-[color:var(--max-cyan)] p-6 text-center text-sm text-white/60">
            {game.year > INVESTMENT_PERIOD_YEARS ? (
              <>
                🔒 The investment period ended after year {INVESTMENT_PERIOD_YEARS}
                {" — "}
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
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <PortfolioPanel
        rows={toCompanyRows(companies)}
        points={toChartPoints(companies)}
      />

      <CampaignLog entries={campaignLog(companies, game.startedAt, game.year)} />

      {/* First-run coach marks, year 1 only. */}
      {game.year === 1 && <CampaignTutorial />}
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
      data-tour="year-pips"
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
                ? "bg-[color:var(--max-yellow)]"
                : n === year
                  ? "game-blink bg-[color:var(--max-magenta)] shadow-[0_0_10px_rgba(255,58,242,0.7)]"
                  : "bg-white/15"
            }`}
          />
        );
      })}
      <span className="ml-2 text-sm font-black uppercase tracking-widest text-white/90">
        Year {year}/{GAME_YEARS}
      </span>
    </div>
  );
}

function Shell({
  year,
  market,
  ended = false,
  children,
}: {
  year: number | null;
  market: Market | null;
  ended?: boolean;
  children: React.ReactNode;
}) {
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
      {/* The marquee: always dark, like a game committing to its own art style. */}
      <header className="relative overflow-hidden border-b-8 border-[color:var(--max-magenta)]">
        <div aria-hidden className="max-pattern-stripes pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="game-twinkle absolute rounded-full bg-[color:var(--max-cyan)]"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
              }}
            />
          ))}
          {/* Pushed below the header's top-right button row (End/Restart
              Campaign) so they don't get covered by it. */}
          <span
            className="game-float absolute right-[14%] top-32 text-4xl opacity-90"
            style={{ animationDelay: "0.4s" }}
          >
            🚀
          </span>
          <span
            className="game-float absolute right-[30%] top-24 text-2xl opacity-60"
            style={{ animationDelay: "1.2s" }}
          >
            💰
          </span>
          <span
            className="game-float absolute right-[44%] top-20 text-2xl opacity-50"
            style={{ animationDelay: "2s" }}
          >
            📈
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              {ended ? (
                <DismissAndHomeLink />
              ) : (
                <Link
                  href="/"
                  className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                >
                  ← Home
                </Link>
              )}
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.35em] text-[color:var(--max-magenta)]">
                ★ FundSim presents ★
              </p>
              <h1 className="font-bungee text-4xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
                Campaign
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {market !== null && year !== null ? (
                  <span
                    data-tour="market"
                    className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${MARKET_CHIP_STYLES[market]}`}
                  >
                    {MARKET_LABELS[market]}
                  </span>
                ) : (
                  "A 10-year fund, dealt one year at a time."
                )}
              </p>
            </div>
            {year !== null && (
              <div className="flex flex-wrap items-center gap-2">
                <EndCampaignButton year={year} />
                <StartCampaignButton
                  label="Restart Campaign"
                  hasPortfolio={true}
                  variant="outline"
                />
              </div>
            )}
          </div>
          {year !== null && (
            <div className="mt-4">
              <YearPips year={year} />
            </div>
          )}
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-6 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
