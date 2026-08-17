// One ranked row on the public leaderboard: rank, fund name, metric value.
// visitorId is deliberately never passed in or rendered here — the
// leaderboard is public, and LeaderboardEntry.visitorId is a private lookup
// key only (see prisma/schema.prisma).
const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardRow({
  rank,
  fundName,
  value,
  border,
}: {
  rank: number;
  fundName: string;
  value: string;
  border: string; // one of the --max-* accent colors, rotated per row
}) {
  return (
    <li
      className="max-card-flat flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
      style={{ "--max-card-border": border } as React.CSSProperties}
    >
      <span className="flex items-center gap-3">
        <span aria-hidden className="w-7 text-lg">
          {MEDALS[rank - 1] ?? `#${rank}`}
        </span>
        <span className="font-bold text-white">{fundName}</span>
      </span>
      <span className="font-display text-lg font-bold tabular-nums text-white">
        {value}
      </span>
    </li>
  );
}
