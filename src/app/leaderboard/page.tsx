import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVisitorId } from "@/lib/visitor";
import { formatMultiple } from "@/lib/fund-math";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { PinnedLeaderboardEntry } from "@/components/PinnedLeaderboardEntry";

const TOP_N = 10;

// Rotated per-row so a list of ranks clashes intentionally instead of
// repeating one accent down the line (same idea as STAT_BORDERS in
// src/app/play/page.tsx).
const ROW_BORDERS = [
  "var(--max-yellow)",
  "var(--max-cyan)",
  "var(--max-magenta)",
  "var(--max-purple)",
  "var(--max-orange)",
] as const;

export default async function LeaderboardPage() {
  const visitorId = await getVisitorId();

  const [topTvpi, topReputation, myEntries] = await Promise.all([
    prisma.leaderboardEntry.findMany({ orderBy: { tvpi: "desc" }, take: TOP_N }),
    prisma.leaderboardEntry.findMany({ orderBy: { reputation: "desc" }, take: TOP_N }),
    // Public listing above is never scoped to visitorId — only this lookup,
    // for the visitor's own pinned rows below, is.
    prisma.leaderboardEntry.findMany({ where: { visitorId } }),
  ]);

  const myBest =
    myEntries.length > 0
      ? myEntries.reduce((best, e) => (e.tvpi > best.tvpi ? e : best))
      : null;
  const myMostRecent =
    myEntries.length > 0
      ? myEntries.reduce((latest, e) =>
          e.submittedAt > latest.submittedAt ? e : latest
        )
      : null;

  const pinned: { label: string; entry: (typeof myEntries)[number] }[] = [];
  if (myBest) pinned.push({ label: "⭐ Your best", entry: myBest });
  if (myMostRecent && myMostRecent.id !== myBest?.id) {
    pinned.push({ label: "🕐 Your most recent", entry: myMostRecent });
  }

  // Rank = a real count of entries strictly ahead on that metric, plus one —
  // not an approximation from the top-10 arrays above, which only cover the
  // first page. Ties share a rank (competition-style), same as any table
  // sorted on these columns would show.
  const rankCounts = await Promise.all(
    pinned.flatMap(({ entry }) => [
      prisma.leaderboardEntry.count({ where: { tvpi: { gt: entry.tvpi } } }),
      prisma.leaderboardEntry.count({
        where: { reputation: { gt: entry.reputation } },
      }),
    ])
  );
  const pinnedWithRanks = pinned.map(({ label, entry }, i) => ({
    label,
    entry,
    tvpiRank: rankCounts[i * 2] + 1,
    reputationRank: rankCounts[i * 2 + 1] + 1,
  }));

  return (
    <div className="max-hero relative min-h-screen bg-[#0d0d1a]">
      <div aria-hidden className="max-pattern-dots pointer-events-none fixed inset-0" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90rem 60rem at 15% 0%, rgba(255,58,242,.16) 0%, transparent 55%), radial-gradient(ellipse 80rem 60rem at 90% 30%, rgba(0,245,212,.13) 0%, transparent 55%), radial-gradient(ellipse 90rem 70rem at 50% 90%, rgba(123,47,255,.16) 0%, transparent 60%)",
        }}
      />
      <header className="relative overflow-hidden border-b-8 border-[color:var(--max-magenta)]">
        <div aria-hidden className="max-pattern-stripes pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <div>
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
            >
              ← Home
            </Link>
            <h1 className="mt-1 font-bungee text-4xl font-normal uppercase tracking-tight text-white [text-shadow:2px_2px_0_var(--max-purple),4px_4px_0_var(--max-magenta),6px_6px_0_var(--max-cyan)]">
              Leaderboard
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Every fund that&apos;s submitted a finished run, ranked by TVPI
              and by reputation.
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
              📊 Top TVPI
            </h2>
            {topTvpi.length === 0 ? (
              <p className="mt-3 rounded-2xl border-4 border-dashed border-[color:var(--max-cyan)] p-6 text-center text-sm text-white/60">
                No funds submitted yet — be the first.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {topTvpi.map((e, i) => (
                  <LeaderboardRow
                    key={e.id}
                    rank={i + 1}
                    fundName={e.fundName}
                    value={formatMultiple(e.tvpi)}
                    border={ROW_BORDERS[i % ROW_BORDERS.length]}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
              🤝 Top Reputation
            </h2>
            {topReputation.length === 0 ? (
              <p className="mt-3 rounded-2xl border-4 border-dashed border-[color:var(--max-cyan)] p-6 text-center text-sm text-white/60">
                No funds submitted yet — be the first.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {topReputation.map((e, i) => (
                  <LeaderboardRow
                    key={e.id}
                    rank={i + 1}
                    fundName={e.fundName}
                    value={`${e.reputation}`}
                    border={ROW_BORDERS[i % ROW_BORDERS.length]}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        {pinnedWithRanks.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
              📌 Your entries
            </h2>
            <ul className="mt-3 space-y-2">
              {pinnedWithRanks.map(({ label, entry, tvpiRank, reputationRank }) => (
                <PinnedLeaderboardEntry
                  key={entry.id}
                  label={label}
                  fundName={entry.fundName}
                  tvpi={formatMultiple(entry.tvpi)}
                  tvpiRank={tvpiRank}
                  reputation={entry.reputation}
                  reputationRank={reputationRank}
                />
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
