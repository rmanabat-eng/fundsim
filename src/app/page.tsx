import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVisitorId } from "@/lib/visitor";
import { formatDollars } from "@/lib/fund-math";
import { getSettings } from "@/lib/settings";
import { GAME_YEARS } from "@/lib/campaign";
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

// How-it-works steps — replaces the old guide/dashboard/leaderboard promo
// stack so a beginner reaches /play after one screen, not four.
const STEPS = [
  {
    accent: "var(--max-yellow)",
    emoji: "1️⃣",
    title: "Source & decide",
    desc: "Evaluate deals, pick check size and valuation. Jargon is underlined — hover to learn it.",
  },
  {
    accent: "var(--max-purple)",
    emoji: "2️⃣",
    title: "Watch it compound",
    desc: "Your dashboard updates every year: dilution, TVPI, dry powder.",
  },
  {
    accent: "var(--max-orange)",
    emoji: "3️⃣",
    title: "Compare your run",
    desc: "See your TVPI ranked on the public leaderboard.",
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
  const visitorId = await getVisitorId();
  const [settings, game] = await Promise.all([
    getSettings(),
    prisma.game.findUnique({ where: { visitorId } }),
  ]);

  const campaignCta =
    !game || (game.status === "ended" && game.dismissed)
      ? "🚀 Start your fund"
      : game.status === "active"
        ? `▶ Continue year ${game.year}`
        : "🏁 See your scorecard";

  return (
    <div className="max-hero relative min-h-screen bg-[#0d0d1a]">
      {/* Layered background: dot grid + colour-wash mesh, per the maximalism
          "never an empty section" rule. Fixed to the viewport and spanning the
          whole page (not just the header) so the ombre doesn't hard-cut at the
          header/main border — kept low-opacity so copy stays readable. */}
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
        {/* Header-only extra layer: diagonal stripes, on top of the page-wide mesh above. */}
        <div aria-hidden className="max-pattern-stripes pointer-events-none absolute inset-0" />

        <div aria-hidden className="pointer-events-none absolute inset-0">
          {HERO_STARS.map((s, i) => (
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
        </div>


        <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
            {/* -------- Left: FundSim identity + campaign CTA -------- */}
            <div>
              <p className="inline-flex -rotate-[2deg] items-center gap-2 rounded-full border-[3px] border-dashed border-[color:var(--max-yellow)] px-[22px] py-[9px] text-xs font-black uppercase tracking-[0.14em] text-[color:var(--max-yellow)]">
                <span className="max-wiggle inline-block">★</span>
                Venture capital, the game
                <span className="max-wiggle inline-block">★</span>
              </p>

              <h1 className="mb-[34px] mt-4 font-bungee text-6xl leading-[0.95] tracking-tight text-white sm:text-7xl">
                FundSim
              </h1>

              <p className="mb-[38px] max-w-[560px] rounded-[22px] border-4 border-[color:var(--max-cyan)] bg-[#2d1b4e]/50 px-7 py-6 text-lg leading-relaxed text-white/92 shadow-[0_0_20px_rgba(0,245,212,0.2)] backdrop-blur-sm">
                You&apos;re the GP of a {formatDollars(settings.fundSize)} fund. Learn
                the mechanics every VC lives by — by{" "}
                <strong className="text-white">playing</strong>, not reading.
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <Link
                  href="/play"
                  className="max-btn-primary inline-flex items-center gap-2 rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-9 py-[18px] text-sm font-black uppercase tracking-[0.06em] text-white"
                >
                  {campaignCta}
                </Link>
                <Link
                  href="/settings"
                  className="max-btn-outline inline-flex items-center gap-2 rounded-full border-4 border-[color:var(--max-magenta)] bg-[#2d1b4e]/60 px-8 py-[18px] text-sm font-black uppercase tracking-[0.06em] text-white"
                >
                  ⚙ Settings
                </Link>
                <Link
                  href="/scenarios"
                  className="max-btn-outline inline-flex items-center gap-2 rounded-full border-4 border-[color:var(--max-cyan)] bg-[#2d1b4e]/60 px-8 py-[18px] text-sm font-black uppercase tracking-[0.06em] text-white"
                >
                  📁 Scenarios
                </Link>
              </div>

              {game && game.status === "active" && (
                <p className="mt-4 inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                  ⏳ Run in progress — year {game.year} of {GAME_YEARS}
                </p>
              )}
            </div>

            {/* -------- Right: the four mechanics, as a cascading card stack -------- */}
            <div className="relative -ml-2 h-[380px] max-lg:h-auto max-lg:grid max-lg:grid-cols-2 max-lg:gap-4">
              <span
                aria-hidden
                className="max-bounce-subtle absolute -top-[34px] left-[150px] hidden text-2xl opacity-90 lg:block"
              >
                ✨
              </span>
              <span
                aria-hidden
                className="max-float-reverse absolute -top-[6px] left-[280px] hidden text-3xl opacity-90 lg:block"
              >
                🚀
              </span>
              <span
                aria-hidden
                className="game-float absolute left-[250px] top-[150px] hidden text-2xl opacity-70 lg:block"
              >
                ✨
              </span>
              <span
                aria-hidden
                className="max-spin-slow absolute bottom-[6px] left-[250px] hidden h-[60px] w-[60px] rounded-full border-4 border-dotted border-[color:var(--max-purple)] lg:block"
              />

              <div className="group flex w-[168px] flex-col items-start justify-center gap-1.5 rounded-[18px] border-4 border-[color:var(--max-yellow)] bg-[linear-gradient(135deg,var(--max-purple),var(--max-magenta))] py-4 pl-[18px] shadow-[6px_6px_0_rgba(0,0,0,0.25)] transition-transform duration-300 -rotate-[6deg] hover:scale-105 hover:rotate-0 max-lg:static max-lg:w-full lg:absolute lg:left-[90px] lg:top-0">
                <span aria-hidden className="text-[2.1rem] leading-none">
                  🎯
                </span>
                <span className="text-[15px] font-extrabold uppercase tracking-[0.05em] text-white">
                  <Term def={CONCEPTS[0].def}>Ownership</Term>
                </span>
              </div>

              <div className="group flex w-[168px] flex-col items-start justify-center gap-1.5 rounded-[18px] border-4 border-[color:var(--max-magenta)] bg-[linear-gradient(135deg,var(--max-cyan),#3ddc97)] py-4 pl-[18px] shadow-[6px_6px_0_rgba(0,0,0,0.25)] transition-transform duration-300 rotate-[4deg] hover:scale-105 hover:rotate-0 max-lg:static max-lg:w-full lg:absolute lg:left-[20px] lg:top-[78px]">
                <span aria-hidden className="text-[2.1rem] leading-none">
                  💧
                </span>
                <span className="text-[15px] font-extrabold uppercase tracking-[0.05em] text-white">
                  <Term def={CONCEPTS[1].def}>Dilution</Term>
                </span>
              </div>

              <div className="group flex w-[168px] flex-col items-start justify-center gap-1.5 rounded-[18px] border-4 border-[color:var(--max-cyan)] bg-[linear-gradient(135deg,var(--max-orange),var(--max-magenta))] py-4 pl-[18px] shadow-[6px_6px_0_rgba(0,0,0,0.25)] transition-transform duration-300 -rotate-[3deg] hover:scale-105 hover:rotate-0 max-lg:static max-lg:w-full lg:absolute lg:left-[100px] lg:top-[182px]">
                <span aria-hidden className="text-[2.1rem] leading-none">
                  ⏱️
                </span>
                <span className="text-[15px] font-extrabold uppercase tracking-[0.05em] text-white">
                  <Term def={CONCEPTS[2].def}>Pacing</Term>
                </span>
              </div>

              <div className="group flex w-[168px] flex-col items-start justify-center gap-1.5 rounded-[18px] border-4 border-[color:var(--max-purple)] bg-[linear-gradient(135deg,var(--max-yellow),var(--max-orange))] py-4 pl-[18px] shadow-[6px_6px_0_rgba(0,0,0,0.25)] transition-transform duration-300 rotate-[5deg] hover:scale-105 hover:rotate-0 max-lg:static max-lg:w-full lg:absolute lg:left-[30px] lg:top-[266px]">
                <span aria-hidden className="text-[2.1rem] leading-none text-[#241033]">
                  🧩
                </span>
                <span className="text-[15px] font-extrabold uppercase tracking-[0.05em] text-[#241033]">
                  <Term def={CONCEPTS[3].def}>Portfolio</Term>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* -------- How it works: replaces the old guide/dashboard/leaderboard
            promo stack, so /play is one screen away instead of four. -------- */}
        <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-4 sm:pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border-[3px] bg-[#2d1b4e]/40 p-5 backdrop-blur-sm"
                style={{ borderColor: s.accent }}
              >
                <span aria-hidden className="text-2xl">
                  {s.emoji}
                </span>
                <h3 className="mt-2 font-display text-base font-bold uppercase tracking-tight text-white">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/75">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* -------- Footer nav: guide/dashboard/leaderboard as links, not
            full-bleed sections — kept consistent for every visitor. -------- */}
        <footer className="relative left-1/2 w-screen -translate-x-1/2 border-t-2 border-white/10 bg-[#150f28]">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-6 px-6 py-5 text-sm font-bold text-white/70">
            <Link href="/guide" className="hover:text-white">
              📖 Learning guide
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              📊 Fund dashboard
            </Link>
            <Link href="/leaderboard" className="hover:text-white">
              🏆 Public leaderboard
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
