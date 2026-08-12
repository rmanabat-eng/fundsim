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

// What the learning guide actually covers, as the four "why this matters" bullets.
const GUIDE_POINTS = [
  {
    accent: "var(--max-magenta)",
    title: "The power law",
    desc: "A couple of big winners carry the whole fund — most bets return zero.",
  },
  {
    accent: "var(--max-cyan)",
    title: "Dilution",
    desc: "Every new round shrinks your stake, unless you defend it with a follow-on.",
  },
  {
    accent: "var(--max-yellow)",
    title: "TVPI vs. cash",
    desc: "Paper markups aren't real money until there's an exit — know the difference.",
  },
  {
    accent: "var(--max-orange)",
    title: "Vintages & the J-curve",
    desc: "Timing warps everything, and staying silent costs more than saying no.",
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

// Full-bleed section break: just the colour bar. Earlier versions duplicated
// each neighbour's pattern in their own top/bottom band divs, but a tiled
// background restarts its phase at each element's own top-left corner — two
// separately-tiled diagonal-stripe layers meeting at a seam rarely line up,
// which showed as a faint seam line even with identical classes/colours.
// Sitting the bar directly between the sections' own (single, unbroken)
// pattern layers removes the seam entirely: each side is one continuous
// background, not two stitched together.
function SectionDivider({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden
      className="relative left-1/2 h-2 w-screen -translate-x-1/2"
      style={{ backgroundColor: accent }}
    />
  );
}

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
        {/* -------- Learning guide: identity + CTA left, four "why it matters" bullets right -------- */}
        <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#0d0d1a]">
          <div aria-hidden className="max-pattern-grid pointer-events-none absolute inset-0" />
          <section className="relative mx-auto grid max-w-6xl items-start gap-10 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span
              aria-hidden
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-br from-[color:var(--max-magenta)] to-[color:var(--max-purple)] text-2xl shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
            >
              📚
            </span>
            <h2 className="mb-5 mt-5 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white [text-shadow:3px_3px_0_var(--max-purple),6px_6px_0_var(--max-magenta)]">
              Learning
              <br />
              Guide
            </h2>
            <p className="mb-6 max-w-sm rounded-xl border-[3px] border-dashed border-[color:var(--max-cyan)] bg-[#2d1b4e]/40 px-5 py-4 text-sm leading-relaxed text-white/85">
              Start here — learn what the game is actually teaching.
            </p>
            <Link
              href="/guide"
              className="max-btn-primary inline-flex items-center gap-2 rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-7 py-[14px] text-sm font-black uppercase tracking-[0.06em] text-white"
            >
              📖 Read the guide
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {GUIDE_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border-[3px] bg-[#2d1b4e]/40 p-5 backdrop-blur-sm"
                style={{ borderColor: p.accent }}
              >
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-[#0d0d1a]"
                    style={{ backgroundColor: p.accent }}
                  >
                    ✓
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold uppercase tracking-tight text-white">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </section>
        </div>

        <SectionDivider accent="var(--max-yellow)" />

        {/* -------- Fund dashboard: preview left, copy + CTA right -------- */}
        <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#150f28]">
          <div aria-hidden className="max-pattern-stripes pointer-events-none absolute inset-0" />
          <div aria-hidden className="max-pattern-dots pointer-events-none absolute inset-0" />
          <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[1fr_1.05fr]">
          {/* Stylized dashboard preview — mimics the real dashboard's chart + stat
              tiles rather than an embedded screenshot, so it never goes stale. */}
          <div className="relative rounded-3xl border-4 border-[color:var(--max-cyan)] bg-[#15102a] p-4 shadow-[8px_8px_0_var(--max-magenta)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-1 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--max-magenta)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--max-yellow)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--max-cyan)]" />
              <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                fundsim.app/dashboard
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 px-1">
              <div className="rounded-lg border-2 border-[color:var(--max-magenta)]/60 bg-white/5 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
                  Fund size
                </p>
                <p className="mt-1 font-display text-lg font-bold text-white">$10M</p>
              </div>
              <div className="rounded-lg border-2 border-[color:var(--max-yellow)]/60 bg-white/5 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
                  TVPI
                </p>
                <p className="mt-1 font-display text-lg font-bold text-white">2.4x</p>
              </div>
              <div className="rounded-lg border-2 border-[color:var(--max-orange)]/60 bg-white/5 p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
                  Deals
                </p>
                <p className="mt-1 font-display text-lg font-bold text-white">14</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border-2 border-white/10 bg-white/5 px-3 pb-3 pt-4">
              <svg viewBox="0 0 220 70" className="h-16 w-full" aria-hidden>
                <polyline
                  points="0,55 30,50 60,52 90,35 120,38 150,15 180,20 220,5"
                  fill="none"
                  stroke="var(--max-cyan)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="220" cy="5" r="4" fill="var(--max-cyan)" />
              </svg>
            </div>
          </div>

          <div className="rounded-3xl border-4 border-[color:var(--max-magenta)] bg-[#2d1b4e]/50 p-8 backdrop-blur-sm sm:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[color:var(--max-orange)]">
              Free play
            </p>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-cyan)] sm:text-4xl">
              Fund Dashboard
            </h2>
            <Link
              href="/dashboard"
              className="max-btn-primary mt-6 inline-flex items-center gap-2 rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-orange)] via-[color:var(--max-magenta)] to-[color:var(--max-purple)] px-7 py-[14px] text-sm font-black uppercase tracking-[0.06em] text-white"
            >
              📊 Open dashboard
            </Link>
            <p className="mt-6 max-w-[52ch] text-sm leading-relaxed text-white/80">
              Build a portfolio by hand, simulate years, and watch the metrics —
              the sandbox behind the campaign, plus your campaign portfolio in
              detail.
            </p>
          </div>
          </section>
        </div>

        <SectionDivider accent="var(--max-cyan)" />
      </main>
    </div>
  );
}
