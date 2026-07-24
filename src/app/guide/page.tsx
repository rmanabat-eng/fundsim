import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GAME_YEARS, INVESTMENT_PERIOD_YEARS } from "@/lib/campaign";

const h2 = "text-lg font-black text-slate-900 dark:text-slate-100";
const p = "mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed";
const card =
  "rounded-2xl border-2 border-slate-900/10 bg-white p-6 shadow-[4px_4px_0_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[4px_4px_0_rgba(0,0,0,0.45)]";
const em = "font-semibold text-slate-800 dark:text-slate-200";
const link = "text-violet-600 underline dark:text-violet-400";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Home
            </Link>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-white">
              <span aria-hidden className="game-float text-3xl">
                📚
              </span>
              What am I learning here?
            </h1>
            <p className="text-sm text-white/80 mt-2">
              FundSim in one sentence:{" "}
              <strong>
                you control the checks, the world controls the outcomes.
              </strong>{" "}
              Here&apos;s how to play it so the lessons land.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <section className={card}>
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

        <section className={card}>
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

        <section className={card}>
          <h2 className={h2}>🃏 The campaign playbook</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
            <li>
              <span className={em}>Read the signals, not the vibes.</span> Each pitch
              shows three bullet points. Some genuinely predict success, some are
              noise, some are red flags — and the link is deliberately noisy, so a
              great-looking pitch still busts sometimes. Patterns only emerge across
              runs.
            </li>
            <li>
              <span className={em}>Pace yourself through year{" "}
              {INVESTMENT_PERIOD_YEARS}.</span> New pitches only come during the
              investment period (years 1–{INVESTMENT_PERIOD_YEARS}). After that the
              checkbook closes to new names and it&apos;s pure portfolio management —
              so don&apos;t spend everything in year 1, and don&apos;t reach year{" "}
              {INVESTMENT_PERIOD_YEARS} with a half-empty portfolio.
            </li>
            <li>
              <span className={em}>Keep reserves for follow-ons.</span> Your winners
              will raise again and dilute you unless you defend your pro-rata. Real
              funds hold back roughly half their capital for exactly this.
            </li>
            <li>
              <span className={em}>Answer your desk.</span> Decisions expire when the
              year rolls, and silence is the worst answer — see reputation below.
            </li>
            <li>
              <span className={em}>Play it again.</span> One run is a single sample of
              a very random process. The lessons are in the pattern across runs, not
              in any one fund.
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 1 — The power law</h2>
          <p className={p}>
            At the end of a fund, look at where the returns came from. Expect roughly
            a third of your companies dead and, almost always, one or two positions
            worth more than everything else combined. That skew is the defining fact
            of venture capital: returns don&apos;t average out, they concentrate.
            It&apos;s why VCs ask &quot;could this one return the whole fund?&quot;
            instead of &quot;is this one safe?&quot; — and why taking a quick 3×
            acquisition can quietly cost you the fund.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 2 — Dilution is a bill that comes due</h2>
          <p className={p}>
            Watch your ownership in a hot company shrink round after round — 2.5% →
            2.0% → 1.6% — every time you sit out. The follow-on card prices the
            counterfactual for you: it shows what defending your stake costs at the
            new, higher valuation. Keeping ownership isn&apos;t free; that&apos;s what
            reserves are for. If you deployed everything in first checks, the game
            will show you exactly why that hurts.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 3 — TVPI is paper, DPI is cash</h2>
          <p className={p}>
            After markups, your <span className={em}>TVPI</span> may look great while{" "}
            <span className={em}>DPI</span> sits near zero. Paper wealth arrives years
            before cash does — nothing is real until companies exit. The gap between
            those two numbers is what a real LP would grill a fund manager about
            (&quot;you can&apos;t eat TVPI&quot;).
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 4 — Time matters: IRR and the J-curve</h2>
          <p className={p}>
            Watch the fund chart year by year. Write-offs hit immediately; markups
            take years — so total value dips below deployed capital before (hopefully)
            climbing past it. That dip-then-recover shape is the{" "}
            <span className={em}>J-curve</span> every young fund lives through. And
            notice how an early, modest exit props up IRR more than a bigger exit
            years later would: multiples ignore time, IRR doesn&apos;t.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 5 — The market is weather, not skill</h2>
          <p className={p}>
            Each year rolls a mood. A <span className={em}>bull market</span> lifts
            valuations and exits; a <span className={em}>bear market</span> pushes them
            down and kills weak companies faster. Every fund that year gets the same
            weather — which is why fund <em>vintage</em> is a real thing in venture,
            and why comparing two funds from different years is mostly comparing their
            luck. What you control is how much dry powder you still have when the
            weather turns.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 6 — Reputation compounds</h2>
          <p className={p}>
            Founders talk. You start at <span className={em}>70/100</span>. Funding a
            bridge (+8), backing a follow-on (+4), or answering a founder&apos;s call
            (+3) builds credit; a deliberate no costs almost nothing (−2). But letting
            a decision expire unanswered is −10, and ignoring a pitch is −4 —{" "}
            <span className={em}>silence is far more expensive than rejection</span>.
            That&apos;s the real lesson: in a business where the best deals are shown
            to you by choice, being reliably responsive <em>is</em> deal flow.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>🏁 How you&apos;re graded</h2>
          <p className={p}>
            At year {GAME_YEARS} the fund closes and your TVPI is scored against real
            venture benchmarks:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
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
            years is a <em>below-median</em> venture fund — because LPs take this risk
            for outliers, not savings-account returns.
          </p>
        </section>

        <section className={card}>
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

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Every metric also explains itself — hover (or tab to) any label with a dotted
          underline. The math behind all of it is written up in the project&apos;s
          README.
        </p>
      </main>
    </div>
  );
}
