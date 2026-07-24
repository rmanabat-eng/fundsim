import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDollars } from "@/lib/fund-math";
import { getSettings } from "@/lib/settings";
import { GAME_YEARS } from "@/lib/campaign";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Term } from "@/components/Term";

// The mechanics the sim teaches, as chips — each explains itself on hover/focus.
const CONCEPTS = [
  {
    emoji: "🎯",
    label: "ownership",
    def: "What a check buys at a given valuation: your check ÷ post-money.",
  },
  {
    emoji: "💧",
    label: "dilution",
    def: "How later rounds shrink your stake — unless you follow on.",
  },
  {
    emoji: "⏱️",
    label: "pacing",
    def: "Spreading limited capital across enough bets to catch a winner.",
  },
  {
    emoji: "🧩",
    label: "portfolio",
    def: "Balancing sectors, stages, and check sizes.",
  },
] as const;

// Deterministic star positions — server and client must paint the same sky.
const HERO_STARS = [
  { top: "18%", left: "8%", size: "5px", delay: "0s" },
  { top: "70%", left: "16%", size: "4px", delay: "1.1s" },
  { top: "26%", left: "31%", size: "6px", delay: "0.5s" },
  { top: "64%", left: "44%", size: "4px", delay: "1.7s" },
  { top: "14%", left: "57%", size: "5px", delay: "0.9s" },
  { top: "58%", left: "69%", size: "6px", delay: "0.2s" },
  { top: "22%", left: "78%", size: "4px", delay: "1.4s" },
  { top: "68%", left: "90%", size: "5px", delay: "0.7s" },
] as const;

export default async function Home() {
  const [settings, game] = await Promise.all([
    getSettings(),
    prisma.game.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {HERO_STARS.map((s, i) => (
            <span
              key={i}
              className="game-twinkle absolute rounded-full bg-white/70"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
              }}
            />
          ))}
          {/* Kept below the theme toggle and right of the copy so nothing collides. */}
          <span
            className="game-float absolute right-[8%] top-28 hidden text-4xl opacity-90 sm:block"
            style={{ animationDelay: "0.3s" }}
          >
            💸
          </span>
          <span
            className="game-float absolute right-[21%] top-20 hidden text-2xl opacity-60 sm:block"
            style={{ animationDelay: "1.3s" }}
          >
            🚀
          </span>
        </div>
        <div className="relative mx-auto flex max-w-5xl items-start justify-between gap-4 px-6 py-10">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-200">
              Venture capital, the game
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] sm:text-5xl">
              <span aria-hidden className="game-float text-3xl sm:text-4xl">
                📈
              </span>
              FundSim
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90">
              You&apos;re the GP of a {formatDollars(settings.fundSize)} fund. Learn the
              mechanics every VC lives by — by <strong>playing</strong>, not reading.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CONCEPTS.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/25"
                >
                  <span aria-hidden>{c.emoji}</span>
                  <Term def={c.def}>{c.label}</Term>
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs font-medium text-white/75">
              <Link href="/guide" className="underline hover:text-white">
                Learning guide
              </Link>{" "}
              ·{" "}
              <Link href="/settings" className="underline hover:text-white">
                Settings
              </Link>{" "}
              ·{" "}
              <Link href="/scenarios" className="underline hover:text-white">
                Scenarios
              </Link>
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <section className="relative overflow-hidden rounded-3xl border-2 border-slate-900/10 bg-gradient-to-br from-indigo-950 via-violet-950 to-fuchsia-950 p-6 shadow-[8px_8px_0_rgba(15,23,42,0.15)] dark:border-white/10 dark:shadow-[8px_8px_0_rgba(0,0,0,0.5)] sm:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {HERO_STARS.map((s, i) => (
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
              className="game-float absolute right-[8%] top-5 text-4xl opacity-90"
              style={{ animationDelay: "0.6s" }}
            >
              🎲
            </span>
          </div>
          <div className="relative flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="min-w-0 flex-1 basis-72">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300">
                The main event
              </p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                Campaign mode
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                Run a {formatDollars(settings.fundSize)} fund for {GAME_YEARS} years:
                get dealt pitches, read the signals, defend your pro-rata, survive
                bear markets — and get graded like a real GP when the fund closes.
              </p>
              {game && game.status === "active" && (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                  ⏳ Run in progress — year {game.year} of {GAME_YEARS}
                </p>
              )}
            </div>
            <Link
              href="/play"
              className="btn-arcade shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-base font-black uppercase tracking-wide text-slate-950"
            >
              {!game
                ? "🚀 Start your fund"
                : game.status === "active"
                  ? `▶ Continue year ${game.year}`
                  : "🏁 See your scorecard"}
            </Link>
          </div>
        </section>

        <Link
          href="/dashboard"
          className="group mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-slate-900/10 bg-white p-5 shadow-[4px_4px_0_rgba(15,23,42,0.1)] transition-transform motion-safe:hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
              Free play
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">
              Fund dashboard
            </h3>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Build a portfolio by hand, simulate years, and watch the metrics — the
              sandbox behind the campaign, plus your campaign portfolio in detail.
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
            Open dashboard →
          </span>
        </Link>
      </main>
    </div>
  );
}
