// A visitor's own entry, pinned below the public top-10 lists — visually
// distinct (border-4, --max-yellow accent) the same way the campaign
// scorecard sets emphasized cards apart from repeated list rows (see
// GRADE_STYLES/reputation card in src/app/play/page.tsx).
export function PinnedLeaderboardEntry({
  label,
  fundName,
  tvpi,
  tvpiRank,
  reputation,
  reputationRank,
}: {
  label: string;
  fundName: string;
  tvpi: string;
  tvpiRank: number;
  reputation: number;
  reputationRank: number;
}) {
  return (
    <li className="rounded-2xl border-4 border-[color:var(--max-yellow)] bg-[#2d1b4e]/60 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--max-yellow)]">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="font-bold text-white">{fundName}</span>
        <span className="flex items-center gap-4 text-sm">
          <span className="text-white/80">
            TVPI <strong className="text-white">{tvpi}</strong>{" "}
            <span className="text-white/50">#{tvpiRank}</span>
          </span>
          <span className="text-white/80">
            Rep <strong className="text-white">{reputation}</strong>{" "}
            <span className="text-white/50">#{reputationRank}</span>
          </span>
        </span>
      </div>
    </li>
  );
}
