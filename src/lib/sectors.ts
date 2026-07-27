// A mascot and a colour per sector. Shared so a company looks the same
// wherever it appears — pitch card, fund log, graveyard, scorecard.
export const SECTOR_ART: Record<
  string,
  { emoji: string; banner: string; chip: string }
> = {
  "Water Tech": {
    emoji: "💧",
    banner: "from-cyan-500 to-sky-600",
    chip: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  },
  Climate: {
    emoji: "🌍",
    banner: "from-emerald-500 to-teal-600",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  SaaS: {
    emoji: "☁️",
    banner: "from-violet-500 to-indigo-600",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  Fintech: {
    emoji: "💳",
    banner: "from-amber-500 to-orange-600",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  Health: {
    emoji: "🩺",
    banner: "from-rose-500 to-pink-600",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  Other: {
    emoji: "🎲",
    banner: "from-slate-500 to-slate-600",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export function sectorArt(sector: string) {
  return SECTOR_ART[sector] ?? SECTOR_ART.Other;
}
