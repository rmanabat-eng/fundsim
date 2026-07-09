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

### Deployment pacing

A fund doesn't invest all its capital at once; it deploys it over years across many companies. FundSim tracks this with two numbers:

- **Total deployed** — the sum of every check size written so far.
- **Remaining capital** — `fund size ($10,000,000) - total deployed`.

FundSim blocks you from adding an investment that would push total deployed past the fund size, the same way a real fund manager can't invest more than their fund's committed capital.

## What's out of scope (for now)

This is a V1. It intentionally does not model:

- Follow-on rounds or dilution across multiple financing rounds
- Markups/revaluations after the initial investment
- Returns metrics (TVPI, DPI, IRR)
- Exits or write-offs
- Charts, dashboards, or multi-user accounts

These are natural V2 features once the core mechanics above are solid.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + React
- [Prisma](https://www.prisma.io/) with SQLite (via the `better-sqlite3` driver adapter)
- [Tailwind CSS](https://tailwindcss.com/)

## Project structure

```
prisma/
  schema.prisma      # the Investment model
  seed.ts            # loads 3 sample investments
src/
  app/
    page.tsx                        # home: summary bar + investment table
    investments/new/page.tsx        # add form
    investments/[id]/edit/page.tsx  # edit form
    actions.ts                      # server actions: create/update/delete + validation
  components/
    SummaryBar.tsx
    InvestmentForm.tsx
    DeleteInvestmentButton.tsx
  lib/
    constants.ts       # fund size, sector list, stage list
    fund-math.ts        # ownership % and formatting helpers
    prisma.ts           # Prisma client singleton
```
