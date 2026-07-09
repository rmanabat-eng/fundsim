export function ownershipPercent(checkSize: number, postMoneyValuation: number): number {
  if (postMoneyValuation <= 0) return 0;
  return (checkSize / postMoneyValuation) * 100;
}

export function formatDollars(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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
