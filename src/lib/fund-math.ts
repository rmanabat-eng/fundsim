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
