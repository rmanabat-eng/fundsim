# FundSim

FundSim is a small web app that simulates managing a $10M venture capital fund. Log hypothetical investments and watch fund-level metrics — deployed capital, remaining capital, and ownership — update in real time. Built to learn VC fund math by encoding it in working software.

The in-app **guide** (at `/guide`, linked from the dashboard header) walks through the playbook the simulator teaches: deploy first, keep reserves, simulate year by year, and let the power law show up in your own numbers.

The fastest way to feel the mechanics is **campaign mode** (at `/play`): a 10-year fund played one year at a time, where the game deals you the numbers and you make the calls.

## Running it locally

Requirements: Node.js 18+.

```bash
npm install
npx prisma migrate dev   # creates the SQLite database and applies the schema
npm run seed              # loads 3 sample investments
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database is a single SQLite file (`dev.db`, at the project root), so all data persists between sessions without any external service.

The fund math has a unit test suite (Vitest) covering ownership, dilution, TVPI/DPI, IRR, and the year simulator:

```bash
npm test
```

To preview the due-diligence fact pool that generates deal signals (see [below](#due-diligence-fact-pool--card-generator-v3)) without starting the app:

```bash
npm run cards          # prints one generated startup card
npm run cards 5        # prints 5
```

## The fund math

### Post-money valuation

When a company raises money, its **post-money valuation** is what the company is worth immediately *after* the check clears. It's the sum of what the company was worth before the round (the "pre-money" valuation) plus the new money raised:

```
post-money valuation = pre-money valuation + check size
```

FundSim asks for post-money valuation directly (rather than pre-money) because it's what founders and other investors usually quote in a term sheet, and it's all you need to calculate your ownership.

### Ownership percentage

Your ownership stake in a company is simply the fraction of the post-money valuation that your check represents:

```
ownership % = check size / post-money valuation
```

Example: you invest $250,000 into a company at an $8,000,000 post-money valuation. You own:

```
$250,000 / $8,000,000 = 3.125%
```

This is a simplification — it ignores option pool top-ups, existing investor pro-rata rights, and other terms that affect real cap tables — but it captures the core mechanic every VC deal runs on.

### Dilution (V2)

Companies raise more than once. When a company raises a new round, the new
investors' money buys newly created shares — so everyone who invested earlier
owns a smaller slice of a (hopefully) more valuable company:

```
new ownership = old ownership × (post-money − raised) ÷ post-money
```

Example: you own 2.5% after a seed round. The company raises a $30M Series A at
a $150M post-money. Your stake becomes 2.5% × ($150M − $30M) ÷ $150M = **2.0%**.

Writing a follow-on check in the new round adds ownership back:

```
new ownership += your check ÷ post-money
```

FundSim models each company as a series of rounds. Set your check to $0 on a
round to sit it out and watch the dilution; write a follow-on check to defend
your stake. The company page shows your ownership evolving round by round.

### Markups and current portfolio value (V2)

Venture stakes are illiquid — there's no ticker showing what your slice of a
startup is worth. The convention the industry uses is **mark-to-market at the
last round price**: your stake is valued at whatever the company's most recent
post-money valuation implies.

```
current value of a stake = ownership % × latest post-money valuation
```

When a company raises a new round at a higher valuation, your earlier checks
get **marked up** (worth more on paper, even though you did nothing); a down
round marks them down. The company page shows your stake's value after each
round, and the dashboard shows each position's current value alongside its
multiple (`value ÷ invested`).

These are paper gains only — no cash returns to the fund until a company
exits.

### Exits and write-offs (V2)

A venture position ends one of three ways: the company is **acquired**, it
**IPOs**, or it **dies**. When it's acquired or goes public, your stake
converts to cash:

```
exit proceeds = ownership % × exit valuation
```

That cash is a **distribution** back to the fund. When the company dies,
that's a **write-off** — an exit at $0. Either way the position stops marking
to market: record an exit from a company's page and its cap table freezes.

Distributions don't top the fund's deployable capital back up — in a real
fund they're returned to the LPs, so remaining capital still only shrinks as
you write checks.

### TVPI and DPI (V2)

**TVPI (Total Value to Paid-In)** is the headline multiple LPs use to judge a
fund:

```
TVPI = (current portfolio value + distributions) ÷ total deployed
```

A TVPI of 2.00× means each deployed dollar is worth two — on paper plus in
cash. Its skeptical sibling is **DPI (Distributions to Paid-In)**:

```
DPI = distributions ÷ total deployed
```

DPI counts only cash actually returned ("you can't eat TVPI"). The gap
between the two is the unrealized part of the portfolio — value that still
depends on future exits. The dashboard summary bar tracks both live.

### IRR (V2)

Multiples ignore time: a 3× return in 3 years and a 3× in 12 years score the
same TVPI, but the first fund is far better. **IRR (internal rate of return)**
is the annualized rate that makes the fund's dated cash flows net out to zero
— every check is money out on its round date, every exit is money in on its
exit date, and (by the standard interim-fund convention) the unrealized
portfolio counts as a final inflow at its current marked value. FundSim
solves for the rate numerically (bisection) in `fund-math.ts`, and shows a
fund-level IRR in the summary bar plus a per-company IRR on each company
page — watch how a quick modest exit can out-IRR a slow home run.

### Deployment pacing

A fund doesn't invest all its capital at once; it deploys it over years across many companies. FundSim tracks this with two numbers:

- **Total deployed** — the sum of every check size written so far.
- **Remaining capital** — `fund size ($10,000,000) - total deployed`.

FundSim blocks you from adding an investment that would push total deployed past the fund size, the same way a real fund manager can't invest more than their fund's committed capital.

### Simulating a year (V2)

The dashboard's **⏩ Simulate a year** button advances the whole portfolio
one year: every active company rolls its fate — 15% shut down, 10% exit,
45% raise their next round (usually a markup, sometimes a down round), 30%
have a quiet year. The simulation never spends your money: simulated rounds
arrive with a $0 check, so every follow-on decision is still yours — edit
the round to defend your stake before the next year rolls. Run it a few
times and the power law shows up in your own numbers: a third of the fund
dies, and one or two winners end up carrying everything.

### The fund chart (V2)

The dashboard plots the fund's whole history from its dated events: a
cyan staircase of **capital deployed** and a violet line of **total value**
(active stakes at their marks, plus cash distributed). The vertical gap
between the lines is your gain or loss — the ratio between them is TVPI,
drawn. Early on the lines overlap (everything held at cost); write-offs
knock value below deployed and markups pull it above. That dip-then-recover
shape is venture's famous **J-curve**. Company pages get a sparkline of the
stake's value round by round.

### Campaign mode (V3)

Free-play mode is a ledger: you invent the companies and the numbers.
**Campaign mode** (`/play`) turns it into a game of decisions under
uncertainty — the thing real investing actually is:

- **Deal flow, during the investment period.** Years 1–5 each deal you
  four generated pitches (a randomized name, sector, stage, and
  cosmetic one-line description — see [company
  descriptions](#company-descriptions) below); after year 5 the
  checkbook closes for new names — like a real fund's investment
  period — and years 6–10 are pure portfolio management. Every card
  shows 3-5 due-diligence facts ("revenue tripled", "under 8 months of
  runway") drawn from a [fact pool](#due-diligence-fact-pool--card-generator-v3)
  that noisily encodes a hidden quality score. Quality tilts every
  later die roll — better companies die less, raise more, and price
  higher — so over several runs you learn to read a pitch. Noisily is
  the key word: a great-looking deal can still be a dud, just less
  often.
- **A 10-year clock.** Advancing the year expires whatever you left on the
  table, rolls quality- and market-weighted events across the portfolio
  (bull and bear years scale valuations and death rates for everyone at
  once), and deals the next year's pitches while the investment period
  lasts. After year 10 the fund closes and your TVPI is graded against
  real venture quartiles.
- **Forced decisions, drawn from a [weighted scenario
  pool](#weighted-scenario-pools--chaining-state-v3).** Portfolio
  companies raising new rounds put a pro-rata on your desk (fund it or
  eat the dilution — the diluted percentage is computed for you).
  Acquirers show up offering cash now versus the power law; a winner
  can instead draw a secondary offer on just your stake, capping
  return now for less upside later. Struggling companies ask for
  bridges — refuse and they usually don't recover (and stop asking);
  funding them is how funds bleed out. All of it expires against you
  at year end.
- **Founder calls.** Sometimes a round arrives as two competing term
  sheets — a top-tier lead at a lower price versus a hype fund at a
  flattering one — and the founder asks which to sign (partner quality
  compounds; price is one round's vanity). Stalled founders ask for your
  blessing to pivot: backing it is a high-variance reroll, urging focus a
  safe small win, and ghosting them means they pivot anyway,
  half-hearted.

The scorecard at the end shows where the returns actually came from,
which — thanks to the power law — is usually one or two names. It also
grades your **VC reputation** (0–100): funding bridges and answering
follow-ons builds it, a deliberate "no" costs almost nothing, and letting
pitches or decisions expire unanswered — ghosting founders — costs the
most, independent of whether the fund made money.

### Weighted scenario pools & chaining state (V3)

Per-company events used to be a hardcoded if/else chain; they now draw
from a **weighted pool** (`src/lib/scenario-pool.ts`), gated by static
attributes so a scenario can only fire where it makes sense:

- **Eligibility** — stage, latest post-money, and derived round
  performance (up/flat/down from the last two rounds) decide which
  scenarios are even in the running for a company this year. A
  pre-seed company can't draw a fund-secondary offer; only a company
  above the exit-route threshold can be asked to pick an exit route.
- **Weight** — among the eligible scenarios (plus an implicit "nothing
  happens" slice), the market, performance, and the company's own
  dynamic state set the relative odds. A down round makes a bridge
  request more likely than an acquisition offer; a macro shock (a rare
  fund-wide event) temporarily leans every company's weights toward
  distress for the year.
- **Chaining state (`CompanyDynState`)** — separate from the hidden
  `quality` score, each company carries its own decision memory: how
  many bridges it's been funded or refused, a variance multiplier, and
  whether it's been dropped from future pools entirely. Funding a
  bridge nudges its odds toward recovery; refusing one — if the
  company doesn't bounce back — removes it from the pool for good.
  Backing a founder's pivot widens the spread of that company's future
  outcomes (bigger wins, bigger losses); urging focus narrows it.

Two fund-level signals ride alongside the per-company pool:
**reserves scarcity** flags when this year's fixed-amount asks (bridges,
pay-to-play checks) outrun what's left to deploy, and a **macro shock**
temporarily reweights the whole portfolio for the year rather than
firing as its own card.

### Due-diligence fact pool & card generator (V3)

Deal signals come from a structured **fact pool** (`src/lib/facts.json`,
36 facts across 6 categories — Team & Founders, Market & Competition,
Product & Tech, Financials & Traction, Legal & Governance, Culture &
Ops) instead of a flat list of canned strings. Each fact carries:

- a **template** with optional number substitution (a random value in
  a range, or a weighted pick from a tiered list) so the same fact
  reads differently card to card,
- a **sentiment tag** (positive/negative/neutral) that drives the
  hidden quality score, and
- an **exclusion list** so contradictory facts (e.g. "no revenue yet"
  and "unit economics improve at scale") never land on the same card.

`generateDeal()` draws 3–5 non-contradictory facts per pitch (weighted
toward 4), fills their templates, and sums their sentiment into quality
plus noise — same mechanism as before, richer and less repetitive pool.
Preview the generator on its own with `npm run cards [count]` (see
[Running it locally](#running-it-locally)).

### Company descriptions

Every generated or randomized startup also gets a cosmetic, one-line
**description** (`src/lib/random-startup.ts`) — 60% a plausible
"what it does, for whom" sentence per sector, 40% an absurd one-liner
for flavor. It's stored on the `Company`/`Deal` rows and shown
wherever the pitch appears (deal cards, the company detail page), but
it never touches `quality` or any game math — pure flavor text.

### Fund settings and scenarios (V2)

The fund's size and company cap are editable under **Settings** — run a $50M
fund and feel how check sizes, ownership targets, and the exits needed to
return the fund all scale. The **Scenarios** page snapshots your whole
portfolio (companies, rounds, exits, and settings) under a name; load one to
restore it, or keep several and compare their DPI / TVPI / IRR side by side
to test different strategies — concentrated versus spray-and-pray, early
versus late stage.

## What's out of scope (for now)

Not yet modeled:

- Multi-user accounts

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + React
- [Prisma](https://www.prisma.io/) with SQLite (via the `better-sqlite3` driver adapter)
- [Tailwind CSS](https://tailwindcss.com/)

## Project structure

```
prisma/
  schema.prisma      # Company, Round, FundSettings, Scenario, Game, Deal, Decision
  seed.ts            # sample portfolio incl. a company with follow-on rounds
scripts/
  generate-card.ts   # CLI preview of the fact pool: `npm run cards [count]`
src/
  app/
    page.tsx                                  # dashboard: summary bar, chart, company table
    play/page.tsx                             # campaign mode: deal flow, decisions, scorecard
    play/actions.ts                           # campaign server actions, the year crank, scenario-pool wiring
    guide/page.tsx                            # learning guide: what the simulator teaches
    settings/page.tsx                         # edit fund size and company cap
    scenarios/page.tsx                        # save/load/compare portfolio snapshots
    companies/new/page.tsx                    # back a new company (random/blank)
    companies/[id]/page.tsx                   # company detail: round history + dilution
    companies/[id]/rounds/new/page.tsx        # add a follow-on round
    companies/[id]/exit/page.tsx              # record an exit or write-off
    companies/[id]/rounds/[roundId]/edit/...  # edit a round
    actions.ts                                # server actions + fund validation
  components/          # tables, forms, chart, pickers, deal/decision cards
  lib/
    constants.ts       # sector list, stage list, default fund size
    fund-math.ts       # ownership, dilution, mark-to-market, TVPI/DPI/IRR helpers
    fund-math.test.ts  # unit tests for the fund math
    simulate.ts        # the "simulate a year" engine (+ simulate.test.ts)
    campaign.ts        # campaign mode: deal generation, hidden quality, market odds (+ tests)
    scenario-pool.ts   # weighted event pools, eligibility/weight, CompanyDynState
    fact-card.ts       # draws/fills due-diligence facts, sentiment → quality (+ tests)
    facts.json         # the fact pool data
    random-startup.ts  # random name/pricing generator + company descriptions
    settings.ts        # fund settings read/write
    prisma.ts          # Prisma client singleton
```
