export function ownershipPercent(checkSize: number, postMoneyValuation: number): number {
  if (postMoneyValuation <= 0) return 0;
  return (checkSize / postMoneyValuation) * 100;
}

export type RoundInput = {
  date: Date | string;
  raised: number;
  postMoney: number;
  yourCheck: number;
};

// Walk rounds in date order. Each new round dilutes the stake you already hold
// by (post - raised) / post — the old shareholders' slice of the new valuation —
// then adds whatever your new check buys: yourCheck / post.
export function ownershipAfterRounds(rounds: RoundInput[]): number {
  const ordered = [...rounds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let ownership = 0; // as a fraction, 0..1
  for (const r of ordered) {
    if (r.postMoney <= 0) continue;
    const dilutionFactor = (r.postMoney - r.raised) / r.postMoney;
    ownership = ownership * dilutionFactor + r.yourCheck / r.postMoney;
  }
  return ownership * 100;
}

// Ownership fraction after each round, for showing the evolution step by step.
export function ownershipTimeline(rounds: RoundInput[]): number[] {
  const ordered = [...rounds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const timeline: number[] = [];
  let ownership = 0;
  for (const r of ordered) {
    if (r.postMoney > 0) {
      const dilutionFactor = (r.postMoney - r.raised) / r.postMoney;
      ownership = ownership * dilutionFactor + r.yourCheck / r.postMoney;
    }
    timeline.push(ownership * 100);
  }
  return timeline;
}

// What your stake is worth today: ownership after every round, marked at the
// latest post-money valuation. A company that raises up rounds "marks up" your
// early checks even though no cash has come back.
export function currentValue(rounds: RoundInput[]): number {
  const ordered = [...rounds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let ownership = 0; // as a fraction, 0..1
  let latestPostMoney = 0;
  for (const r of ordered) {
    if (r.postMoney <= 0) continue;
    const dilutionFactor = (r.postMoney - r.raised) / r.postMoney;
    ownership = ownership * dilutionFactor + r.yourCheck / r.postMoney;
    latestPostMoney = r.postMoney;
  }
  return ownership * latestPostMoney;
}

// Stake value after each round (ownership × that round's post-money), for
// showing markups and markdowns round by round.
export function valueTimeline(rounds: RoundInput[]): number[] {
  const ordered = [...rounds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const timeline: number[] = [];
  let ownership = 0;
  for (const r of ordered) {
    if (r.postMoney > 0) {
      const dilutionFactor = (r.postMoney - r.raised) / r.postMoney;
      ownership = ownership * dilutionFactor + r.yourCheck / r.postMoney;
    }
    timeline.push(ownership * Math.max(r.postMoney, 0));
  }
  return timeline;
}

// Cash returned to the fund when a company exits: ownership at exit × exit
// valuation. A write-off is just an exit at 0.
export function exitProceeds(rounds: RoundInput[], exitValue: number): number {
  return (ownershipAfterRounds(rounds) / 100) * exitValue;
}

export type CashFlow = { date: Date | string; amount: number };

// Annualized internal rate of return from dated cash flows (checks out are
// negative, cash back is positive), solved by bisection on the NPV. Returns
// null when there's no meaningful rate: fewer than two flows, flows all one
// direction, zero elapsed time, or a total loss.
export function xirr(flows: CashFlow[]): number | null {
  const fs = flows
    .filter((f) => f.amount !== 0)
    .map((f) => ({ t: new Date(f.date).getTime(), amount: f.amount }));
  if (fs.length < 2) return null;
  if (!fs.some((f) => f.amount > 0) || !fs.some((f) => f.amount < 0)) return null;

  const t0 = Math.min(...fs.map((f) => f.t));
  const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
  const years = fs.map((f) => (f.t - t0) / YEAR_MS);
  if (Math.max(...years) <= 0) return null;

  const npv = (rate: number) =>
    fs.reduce((sum, f, i) => sum + f.amount / Math.pow(1 + rate, years[i]), 0);

  let lo = -0.9999;
  let hi = 10;
  let npvLo = npv(lo);
  if (npvLo * npv(hi) > 0) return null; // no root in a sane range
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = npv(mid);
    if (npvMid === 0) return mid;
    if (npvLo * npvMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      npvLo = npvMid;
    }
  }
  return (lo + hi) / 2;
}

// A company's cash flows from the fund's point of view: each check is money
// out on its round date; an exit returns proceeds on the exit date; an active
// stake counts its current paper value as an inflow "as of" the given date
// (the standard interim-fund convention).
export function companyCashFlows(
  rounds: RoundInput[],
  exit: { value: number; date: Date | string } | null,
  asOf: Date | string
): CashFlow[] {
  const flows: CashFlow[] = rounds
    .filter((r) => r.yourCheck > 0)
    .map((r) => ({ date: r.date, amount: -r.yourCheck }));
  if (exit) {
    flows.push({ date: exit.date, amount: exitProceeds(rounds, exit.value) });
  } else {
    const value = currentValue(rounds);
    if (value > 0) flows.push({ date: asOf, amount: value });
  }
  return flows;
}

export function formatDollars(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}×`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
