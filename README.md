# FundSim

FundSim is a small web app that simulates managing a $10M venture capital fund. Log hypothetical investments and watch fund-level metrics — deployed capital, remaining capital, and ownership — update in real time. Built to learn VC fund math by encoding it in working software.

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

### Deployment pacing

A fund doesn't invest all its capital at once; it deploys it over years across many companies. FundSim tracks this with two numbers:

- **Total deployed** — the sum of every check size written so far.
- **Remaining capital** — `fund size ($10,000,000) - total deployed`.

FundSim blocks you from adding an investment that would push total deployed past the fund size, the same way a real fund manager can't invest more than their fund's committed capital.

## What's out of scope (for now)

Not yet modeled:

- Returns metrics (TVPI, DPI, IRR) and current portfolio value from markups
- Exits and write-offs
- Charts, dashboards, or multi-user accounts

These are natural V2 features once the core mechanics above are solid.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + React
- [Prisma](https://www.prisma.io/) with SQLite (via the `better-sqlite3` driver adapter)
- [Tailwind CSS](https://tailwindcss.com/)

## Project structure

```
prisma/
  schema.prisma      # Company and Round models
  seed.ts            # sample portfolio incl. a company with follow-on rounds
src/
  app/
    page.tsx                                  # dashboard: summary bar + company table
    companies/new/page.tsx                    # back a new company (presets/random/blank)
    companies/[id]/page.tsx                   # company detail: round history + dilution
    companies/[id]/rounds/new/page.tsx        # add a follow-on round
    companies/[id]/rounds/[roundId]/edit/...  # edit a round
    actions.ts                                # server actions + fund validation
  components/          # tables, forms, pickers, theme toggle
  lib/
    constants.ts       # fund size, sector list, stage list
    fund-math.ts       # ownership, dilution, and formatting helpers
    prisma.ts          # Prisma client singleton
```
