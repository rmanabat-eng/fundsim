import type { ReactNode } from "react";

// Gradient stat tile with an optional hover explainer. The dotted underline
// is the "hover me" cue; the tooltip is pure CSS (group-hover), so this stays
// a server component.
export function StatCard({
  label,
  value,
  gradient,
  hint,
}: {
  label: string;
  value: ReactNode;
  gradient: string;
  hint?: string;
}) {
  return (
    <div
      className={`group relative rounded-xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm`}
    >
      <p className="text-xs uppercase tracking-wide text-white/80">
        {hint ? (
          <span
            tabIndex={0}
            className="cursor-help rounded-sm underline decoration-dotted decoration-white/60 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            {label}
            <span className="sr-only">: {hint}</span>
          </span>
        ) : (
          label
        )}
      </p>
      <p className="text-xl font-semibold">{value}</p>
      {hint && (
        <div
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-1.5 w-48 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-600 shadow-lg group-hover:visible group-focus-within:visible dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {hint}
        </div>
      )}
    </div>
  );
}
