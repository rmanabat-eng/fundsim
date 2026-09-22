export type HudStat = {
  icon: string;
  label: string;
  value: string;
  hint: string;
};

// Compact one-row HUD: hover/tab a label for its hint, same dotted-underline
// cue as Term. No expand state needed — the strip IS the detail view.
export function HudStrip({ stats }: { stats: HudStat[] }) {
  return (
    <div
      data-tour="hud"
      className="max-card-flat mt-6 flex flex-wrap items-center gap-x-1 gap-y-3 rounded-2xl px-4 py-3"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="group/stat relative flex min-w-[120px] flex-1 items-center gap-2 px-2 hover:z-30 focus-within:z-30"
        >
          <span aria-hidden className="text-base">
            {s.icon}
          </span>
          <div className="min-w-0">
            <p
              tabIndex={0}
              className="w-fit cursor-help truncate rounded-sm text-[9px] font-bold uppercase tracking-widest text-white/50 underline decoration-dotted decoration-white/30 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)]"
            >
              {s.label}
              <span className="sr-only">: {s.hint}</span>
            </p>
            <p className="truncate font-display text-sm font-bold tabular-nums text-white">
              {s.value}
            </p>
          </div>
          <div
            aria-hidden="true"
            className="max-card-flat pointer-events-none invisible absolute left-1/2 top-full z-20 mt-1.5 w-56 -translate-x-1/2 rounded-lg px-3 py-2 text-xs font-normal normal-case tracking-normal text-white/80 group-hover/stat:visible group-focus-within/stat:visible"
            style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
          >
            {s.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
