import Link from "next/link";
import { GAME_YEARS, INVESTMENT_PERIOD_YEARS } from "@/lib/campaign";

const h2 = "font-display text-lg font-bold text-white [text-shadow:2px_2px_0_var(--max-purple)]";
const p = "mt-3 text-sm text-white/75 leading-relaxed";
const card = "max-card-flat rounded-2xl p-6";
const em = "font-semibold text-white";
const link = "text-[color:var(--max-cyan)] underline";

export default function GuidePage() {
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
        <div className="relative mx-auto flex max-w-5xl items-start justify-between gap-4 px-6 py-8">
          <div className="max-w-2xl">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
            >
              ← Home
            </Link>
            <h1 className="mt-1 flex items-center gap-3 font-bungee text-3xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
              <span aria-hidden className="game-float text-3xl">
                📚
              </span>
              What am I learning here?
            </h1>
            <p className="text-sm text-white/80 mt-2">
              FundSim in one sentence:{" "}
              <strong className="text-white">
                you control the checks, the world controls the outcomes.
              </strong>{" "}
              Here&apos;s how to play it so the lessons land.
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-8 space-y-6">
        <section className={card} style={{ "--max-card-border": "var(--max-magenta)" } as React.CSSProperties}>
          <h2 className={h2}>🎮 Two ways to play</h2>
          <p className={p}>
            <Link href="/play" className={link}>
              <span className={em}>Campaign mode</span>
            </Link>{" "}
            is the game: {GAME_YEARS}{" "}
            years, pitches dealt to you, forced decisions, market swings, and a grade
            at the end. You react to a world that doesn&apos;t care what you planned.
          </p>
          <p className={p}>
            <Link href="/dashboard" className={link}>
              <span className={em}>The fund dashboard</span>
            </Link>{" "}
            is the sandbox: you invent the companies and the numbers, then simulate
            years on demand. Best for testing a specific idea (&quot;what if I
            concentrated into 5 checks?&quot;) without waiting on the deal deck. It
            also shows your campaign portfolio in detail.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}>
          <h2 className={h2}>The core idea: you only control the inputs</h2>
          <p className={p}>
            Real VCs make exactly two kinds of decisions:{" "}
            <span className={em}>which first checks to write</span> and{" "}
            <span className={em}>whether to follow on</span> when a company raises
            again. Everything else — who raises, who dies, who exits, at what price —
            happens <em>to</em> them. Advancing a year recreates that feeling: you
            deploy, the world rolls the dice, and your job is to have built a
            portfolio that survives the dice.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}>
          <h2 className={h2}>🃏 The campaign playbook</h2>
          <ol className="mt-3 space-y-2 text-sm text-white/75 list-decimal list-inside leading-relaxed">
            <li>
              <span className={em}>Read the signals, not the vibes.</span> Each pitch
              shows three bullet points. Some genuinely predict success, some are
              mean nothing, some are warnings — and none are certain, so a
              great-looking pitch still fails sometimes. Patterns only show up
              over several games.
            </li>
            <li>
              <span className={em}>Pace yourself through year{" "}
              {INVESTMENT_PERIOD_YEARS}.</span> New pitches only come during the
              investment period (years 1–{INVESTMENT_PERIOD_YEARS}). After that you
              can&apos;t back new companies, only look after the ones you own —
              so don&apos;t spend everything in year 1, and don&apos;t reach year{" "}
              {INVESTMENT_PERIOD_YEARS} with a half-empty portfolio.
            </li>
            <li>
              <span className={em}>Save money for later rounds.</span> Your winners
              will raise more money, and your share shrinks each time unless you
              invest again (the amount that keeps your share is called your
              pro-rata). Real funds hold back roughly half their money for exactly
              this.
            </li>
            <li>
              <span className={em}>Answer every request.</span> Decisions expire when the
              year rolls, and silence is the worst answer — see reputation below.
            </li>
            <li>
              <span className={em}>Play it again.</span> One game is mostly luck. The
              lessons are in what keeps happening across several games, not in any
              one fund.
            </li>
          </ol>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-orange)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 1 — A few big winners pay for everything</h2>
          <p className={p}>
            At the end of a fund, look at where the returns came from. Expect roughly
            a third of your companies dead and, almost always, one or two positions
            worth more than everything else combined. This is called the{" "}
            <span className={em}>power law</span>, and it&apos;s the defining fact
            of venture capital: returns don&apos;t average out, they pile up in a
            few winners.
            It&apos;s why VCs ask &quot;could this one return the whole fund?&quot;
            instead of &quot;is this one safe?&quot; — and why taking a quick 3×
            acquisition can quietly cost you the fund.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-purple)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 2 — Your share shrinks unless you pay to keep it</h2>
          <p className={p}>
            Every time a company raises money it creates new shares, so the share
            you own gets smaller — 2.5% → 2.0% → 1.6% — unless you invest again.
            This is called <span className={em}>dilution</span>. The follow-on card
            shows what keeping your share costs at the new, higher price. Keeping
            it isn&apos;t free; that&apos;s what saving money for later rounds is
            for. If you spent everything on first checks, the game will show you
            exactly why that hurts.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-magenta)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 3 — Paper value isn&apos;t cash</h2>
          <p className={p}>
            <span className={em}>TVPI</span> counts everything your fund is worth
            per $1 invested, including shares you still hold.{" "}
            <span className={em}>DPI</span>{" "}
            counts only the cash you&apos;ve
            actually got back. When your companies&apos; prices rise, TVPI can look
            great while DPI sits near zero: nothing is real money until a company
            is sold or goes public. That gap is what a fund&apos;s backers (called
            LPs) grill a fund manager about — &quot;you can&apos;t eat TVPI&quot;.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 4 — Losses come early, wins come late</h2>
          <p className={p}>
            Watch the fund chart year by year. Failures show up right away;
            successes take years — so your fund is worth less than you invested
            before (hopefully) climbing past it. That dip-then-recover shape is
            the <span className={em}>J-curve</span> every young fund lives through.
            Speed matters too: <span className={em}>IRR</span> is your yearly rate
            of return, so a small early sale can lift it more than a bigger sale
            years later.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-yellow)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 5 — The market is weather, not skill</h2>
          <p className={p}>
            Each year rolls a mood. A <span className={em}>bull market</span> lifts
            valuations and exits; a <span className={em}>bear market</span> pushes them
            down and kills weak companies faster. Every fund that year gets the same
            weather — which is why fund <em>vintage</em> is a real thing in venture,
            and why comparing two funds from different years is mostly comparing their
            luck. What you control is how much money you still have left to invest
            when the weather turns.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-orange)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 6 — Reputation compounds</h2>
          <p className={p}>
            Founders talk. You start at <span className={em}>70/100</span>. Funding a
            bridge (+8), backing a follow-on (+4), or answering a founder&apos;s call
            (+3) builds credit; a deliberate no costs almost nothing (−2). But letting
            a decision expire unanswered is −10, and ignoring a pitch is −4 —{" "}
            <span className={em}>silence is far more expensive than rejection</span>.
            Negotiating has a price too: push a founder for a lower price and win,
            and you gain +4; push and they walk away, and you lose 8. That&apos;s
            the real lesson: founders choose who sees their best deals, so being
            someone who always answers is how you get shown them.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-purple)" } as React.CSSProperties}>
          <h2 className={h2}>🏁 How you&apos;re graded</h2>
          <p className={p}>
            At year {GAME_YEARS} the fund closes and your TVPI is scored against real
            venture benchmarks:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/75">
            <li>
              <span className={em}>Under 1.0×</span> — bottom quartile. You returned
              less than you deployed.
            </li>
            <li>
              <span className={em}>1.0–1.85×</span> — third quartile. Money back and a
              little more, but below the venture median.
            </li>
            <li>
              <span className={em}>1.85–2.5×</span> — second quartile. A solid,
              around-the-median fund.
            </li>
            <li>
              <span className={em}>2.5–3.5×</span> — top quartile. This is the business
              LPs sign up for.
            </li>
            <li>
              <span className={em}>3.5×+</span> — top decile. You caught a power-law
              winner and held on.
            </li>
          </ul>
          <p className={p}>
            Note how demanding that scale is. &quot;Doubling your money&quot; over ten
            years is a <em>below-average</em> venture fund — because the people who
            put money into funds take this risk for huge wins, not savings-account
            returns.
          </p>
        </section>

        <section className={card} style={{ "--max-card-border": "var(--max-magenta)" } as React.CSSProperties}>
          <h2 className={h2}>Lesson 7 — Strategy is testable</h2>
          <p className={p}>
            This is what the{" "}
            <Link href="/scenarios" className={link}>
              Scenarios
            </Link>{" "}
            page is for. Save a run as &quot;Portfolio A&quot;, clear, redeploy the
            same fund as 5 big concentrated checks instead of 15 small ones, simulate
            the same number of years, and compare. Concentration means higher variance
            — sometimes a monster fund, often a dead one. Spraying means more shots at
            the power-law winner, but less ownership when you hit it. There&apos;s no
            right answer; that&apos;s the point.
          </p>
        </section>

        <p className="text-xs text-white/40">
          Every metric also explains itself — hover (or tab to) any label with a dotted
          underline. The math behind all of it is written up in the project&apos;s
          README.
        </p>
      </main>
    </div>
  );
}
