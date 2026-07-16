import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const h2 = "text-lg font-semibold text-slate-900 dark:text-slate-100";
const p = "mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed";
const card =
  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const em = "font-semibold text-slate-800 dark:text-slate-200";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div className="max-w-2xl">
            <Link href="/" className="text-sm text-white/70 hover:text-white">
              ← Portfolio
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
              What am I learning here?
            </h1>
            <p className="text-sm text-white/80 mt-1">
              FundSim in one sentence: you control the checks, the world controls the
              outcomes. Here&apos;s how to play it so the lessons land.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <section className={card}>
          <h2 className={h2}>The core idea: you only control the inputs</h2>
          <p className={p}>
            Real VCs make exactly two kinds of decisions: <span className={em}>which
            first checks to write</span> and <span className={em}>whether to follow
            on</span> when a company raises again. Everything else — who raises, who
            dies, who exits, at what price — happens <em>to</em> them. The ⏩ Simulate
            a year button recreates that feeling: you deploy, the world rolls the
            dice, and your job is to have built a portfolio that survives the dice.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>The playbook</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
            <li>
              <span className={em}>Deploy the fund first.</span> Back 10–15 companies
              before simulating — one company is a coin flip, not a fund. Leave some
              capital un-deployed as <em>reserves</em> for follow-ons (real funds hold
              back roughly half).
            </li>
            <li>
              <span className={em}>Simulate a year at a time</span> and re-read the
              summary cards after each one. Who raised? Who died? What did that do to
              TVPI and IRR?
            </li>
            <li>
              <span className={em}>Make follow-on decisions.</span> Simulated rounds
              arrive with your check at $0 — you sat out and got diluted. Edit a round
              to write a follow-on check and defend your stake in the winners.
            </li>
            <li>
              <span className={em}>After ~5–6 years, judge the fund.</span> Did total
              value beat capital deployed? Save it as a scenario, clear, and try a
              different strategy.
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 1 — The power law</h2>
          <p className={p}>
            After a few simulated years, sort the portfolio by the{" "}
            <span className={em}>Value</span>{" "}column. Expect roughly a third of your
            companies dead and, almost always, one or two positions worth more than
            everything else combined. That skew is the defining fact of venture
            capital: returns don&apos;t average out, they concentrate. It&apos;s why
            VCs ask &quot;could this one return the whole fund?&quot; instead of
            &quot;is this one safe?&quot;
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 2 — Dilution is a bill that comes due</h2>
          <p className={p}>
            Watch your ownership in a hot company shrink round after round — 2.5% →
            2.0% → 1.6% — every time you sit out. Then price the counterfactual: edit
            a simulated round and see what defending your stake costs at the new,
            higher valuation. Keeping ownership isn&apos;t free; that&apos;s what
            reserves are for. If you deployed everything in first checks, the sim
            will show you exactly why that hurts.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 3 — TVPI is paper, DPI is cash</h2>
          <p className={p}>
            After markups, your <span className={em}>TVPI</span> may look great while{" "}
            <span className={em}>DPI</span> sits near zero. Paper wealth arrives years
            before cash does — nothing is real until companies exit. The gap between
            those two cards is what a real LP would grill a fund manager about
            (&quot;you can&apos;t eat TVPI&quot;).
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 4 — Time matters: IRR and the J-curve</h2>
          <p className={p}>
            Watch the fund chart year by year. Write-offs hit immediately; markups
            take years — so total value dips below deployed capital before
            (hopefully) climbing past it. That dip-then-recover shape is the{" "}
            <span className={em}>J-curve</span> every young fund lives through. And
            notice on the IRR card how an early, modest exit props up IRR more than a
            bigger exit years later would: multiples ignore time, IRR doesn&apos;t.
          </p>
        </section>

        <section className={card}>
          <h2 className={h2}>Lesson 5 — Strategy is testable</h2>
          <p className={p}>
            This is what the <Link href="/scenarios" className="text-violet-600 underline dark:text-violet-400">Scenarios</Link>{" "}
            page is for. Save a run as &quot;Portfolio A&quot;, clear, redeploy the
            same fund as 5 big concentrated checks instead of 15 small ones, simulate
            the same number of years, and compare. Concentration means higher variance
            — sometimes a monster fund, often a dead one. Spraying means more shots at
            the power-law winner, but less ownership when you hit it. There&apos;s no
            right answer; that&apos;s the point.
          </p>
        </section>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Every metric on the dashboard also explains itself — hover any card label
          with a dotted underline. The math behind all of it is written up in the
          project&apos;s README.
        </p>
      </main>
    </div>
  );
}
