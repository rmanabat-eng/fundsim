import { formatDollars, formatDate } from "@/lib/fund-math";

// Small step-line of the stake's value after each round. Single series
// (violet, same slot as the fund chart's total-value line); the rounds table
// below is the full data view.
export function StakeSparkline({
  points,
}: {
  points: { date: Date; value: number }[];
}) {
  if (points.length < 2) return null;

  const W = 220;
  const H = 48;
  const PAD = 6;
  const t0 = points[0].date.getTime();
  const span = Math.max(points[points.length - 1].date.getTime() - t0, 1);
  const max = Math.max(...points.map((p) => p.value), 1);

  const x = (d: Date) => PAD + ((d.getTime() - t0) / span) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);

  let d = `M ${x(points[0].date).toFixed(1)} ${y(points[0].value).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` H ${x(points[i].date).toFixed(1)} V ${y(points[i].value).toFixed(1)}`;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-1 w-full max-w-[220px]"
      role="img"
      aria-label="Stake value after each round"
    >
      <path
        d={d}
        fill="none"
        strokeWidth={2}
        className="stroke-violet-600 dark:stroke-violet-500"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(p.date)}
          cy={y(p.value)}
          r={3}
          className="fill-violet-600 stroke-white dark:fill-violet-500 dark:stroke-slate-900"
          strokeWidth={1.5}
        >
          <title>
            {formatDate(p.date)}: {formatDollars(p.value)}
          </title>
        </circle>
      ))}
    </svg>
  );
}
