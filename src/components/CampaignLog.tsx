import { formatDollars } from "@/lib/fund-math";
import type { CampaignLogEntry, LogCompanyRef } from "@/lib/campaign";
import { sectorArt } from "@/lib/sectors";

// Rotated per entry so a stack of year cards clashes intentionally.
const STAT_BORDERS = [
  "var(--max-yellow)",
  "var(--max-cyan)",
  "var(--max-magenta)",
  "var(--max-purple)",
  "var(--max-orange)",
] as const;

// A company keeps its sector mascot everywhere it shows up, so a name in the
// log is recognisable as the same company you saw on the pitch card.
function Name({ c, muted = false }: { c: LogCompanyRef; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold ${
        muted ? "bg-[color:var(--max-orange)]/20 text-[color:var(--max-orange)]" : sectorArt(c.sector).chip
      }`}
    >
      <span aria-hidden>{sectorArt(c.sector).emoji}</span>
      {c.name}
    </span>
  );
}

// The campaign's history, newest year first. Write-offs are called out in red
// because a company dying is the thing you most want to notice after a roll.
export function CampaignLog({ entries }: { entries: CampaignLogEntry[] }) {
  const withEvents = [...entries]
    .reverse()
    .filter(
      (e) =>
        e.backed.length + e.raised.length + e.exited.length + e.writtenOff.length > 0
    );

  if (withEvents.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
        📜 Fund log
      </h2>
      <ol className="mt-3 space-y-2">
        {withEvents.map((e, i) => (
          <li
            key={e.year}
            className="max-card rounded-2xl p-4"
            style={{ "--max-card-border": STAT_BORDERS[i % STAT_BORDERS.length] } as React.CSSProperties}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
              Year {e.year}
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm">
              {e.writtenOff.length > 0 && (
                <li className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-[color:var(--max-orange)]">
                  💀 Went bankrupt:
                  {e.writtenOff.map((c, i) => (
                    <Name key={`${c.name}-${i}`} c={c} muted />
                  ))}
                </li>
              )}
              {e.exited.length > 0 && (
                <li className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-[color:var(--max-cyan)]">
                  🏆 Exited:
                  {e.exited.map((c, i) => (
                    <span key={`${c.name}-${i}`} className="inline-flex items-center">
                      <Name c={c} />
                      <span className="ml-1 font-normal">
                        at {formatDollars(c.value)}
                      </span>
                    </span>
                  ))}
                </li>
              )}
              {e.backed.length > 0 && (
                <li className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/70">
                  💸 Backed:
                  {e.backed.map((c, i) => (
                    <Name key={`${c.name}-${i}`} c={c} />
                  ))}
                </li>
              )}
              {e.raised.length > 0 && (
                <li className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/70">
                  📈 Raised again:
                  {e.raised.map((c, i) => (
                    <Name key={`${c.name}-${i}`} c={c} />
                  ))}
                </li>
              )}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
