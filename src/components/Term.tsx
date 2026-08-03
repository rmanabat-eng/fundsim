import type { ReactNode } from "react";

// Inline jargon with a hover/focus definition — the same dotted-underline cue
// and pure-CSS tooltip as StatCard, but for a word inside running text. The
// trigger is focusable so keyboard and touch users can reveal it too, and the
// definition is mirrored in sr-only text for screen readers (the visual
// bubble is decorative). Works in server and client components alike.
export function Term({ children, def }: { children: ReactNode; def: string }) {
  return (
    <span className="group/term relative inline-block">
      <span
        tabIndex={0}
        className="cursor-help rounded-sm underline decoration-dotted decoration-white/40 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)]"
      >
        {children}
      </span>
      <span className="sr-only"> ({def})</span>
      <span
        aria-hidden="true"
        className="max-card pointer-events-none invisible absolute -left-2 bottom-full z-20 mb-1.5 w-56 rounded-lg px-3 py-2 text-xs font-normal normal-case tracking-normal text-white/85 group-hover/term:visible group-focus-within/term:visible"
        style={{ "--max-card-border": "var(--max-cyan)" } as React.CSSProperties}
      >
        {def}
      </span>
    </span>
  );
}
