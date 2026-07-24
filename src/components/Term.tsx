import type { ReactNode } from "react";

// Inline jargon with a hover definition — the same dotted-underline cue and
// pure-CSS tooltip as StatCard, but for a word inside running text. Works in
// server and client components alike.
export function Term({ children, def }: { children: ReactNode; def: string }) {
  return (
    <span className="group/term relative inline-block">
      <span className="cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2 dark:decoration-slate-500">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute -left-2 bottom-full z-20 mb-1.5 w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-600 shadow-lg group-hover/term:visible dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        {def}
      </span>
    </span>
  );
}
