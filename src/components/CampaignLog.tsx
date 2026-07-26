import { formatDollars } from "@/lib/fund-math";
import type { CampaignLogEntry } from "@/lib/campaign";

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
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        📜 Fund log
      </h2>
      <ol className="mt-3 space-y-2">
        {withEvents.map((e) => (
          <li
            key={e.year}
            className="rounded-2xl border-2 border-slate-900/10 bg-white p-4 shadow-[3px_3px_0_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Year {e.year}
            </p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {e.writtenOff.length > 0 && (
                <li className="font-semibold text-rose-600 dark:text-rose-400">
                  💀 Went bankrupt: {e.writtenOff.join(", ")}
                </li>
              )}
              {e.exited.length > 0 && (
                <li className="font-semibold text-emerald-600 dark:text-emerald-400">
                  🏆 Exited:{" "}
                  {e.exited
                    .map((x) => `${x.name} at ${formatDollars(x.value)}`)
                    .join(", ")}
                </li>
              )}
              {e.backed.length > 0 && (
                <li className="text-slate-600 dark:text-slate-400">
                  💸 Backed: {e.backed.join(", ")}
                </li>
              )}
              {e.raised.length > 0 && (
                <li className="text-slate-600 dark:text-slate-400">
                  📈 Raised again: {e.raised.join(", ")}
                </li>
              )}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
