"use client";

import { useEffect, useSyncExternalStore } from "react";
import { formatMultiple } from "@/lib/fund-math";
import { play, type Sfx } from "@/lib/sound";

// Plays once on mount, e.g. the scorecard's grade stamp. A reload has no user
// activation yet, so revisiting a finished fund stays quiet.
export function PlaySfx({ sfx, delay = 0 }: { sfx: Sfx; delay?: number }) {
  useEffect(() => play(sfx, delay), [sfx, delay]);
  return null;
}

// Exit celebration: every exit gets the fanfare, and a real winner (5×+)
// also gets a banner and a confetti burst. Module-scope store like toast, so
// a card that unmounts right after resolving can still fire it.

export const CELEBRATE_MULTIPLE = 5;
const SHOW_MS = 2800;
const COLORS = ["var(--max-yellow)", "var(--max-cyan)", "var(--max-magenta)", "var(--max-orange)"];

type Piece = { left: number; delay: number; duration: number; color: string; spin: number };
type Party = { id: number; text: string; pieces: Piece[] } | null;

let party: Party = null;
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  for (const l of listeners) l();
}

export function celebrateExit(name: string, multiple: number, delaySeconds = 0) {
  play("exit", delaySeconds);
  if (multiple < CELEBRATE_MULTIPLE) return;
  const id = nextId++;
  const show = () => {
    party = {
      id,
      text: `🏆 ${formatMultiple(multiple)} on ${name}`,
      pieces: Array.from({ length: 48 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        spin: Math.random() * 720 - 360,
      })),
    };
    emit();
    setTimeout(() => {
      if (party?.id === id) {
        party = null;
        emit();
      }
    }, SHOW_MS);
  };
  setTimeout(show, delaySeconds * 1000);
}

export function Celebration() {
  const p = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => party,
    () => null
  );
  if (!p) return null;

  return (
    <div key={p.id} aria-live="polite" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {p.pieces.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="confetti-piece absolute top-0 h-3 w-2 rounded-sm"
          style={
            {
              left: `${c.left}%`,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              "--spin": `${c.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="celebrate-banner absolute inset-x-4 top-1/3 mx-auto w-fit max-w-full rounded-3xl border-4 border-[color:var(--max-yellow)] bg-[#2d1b4e]/95 px-8 py-5 text-center font-bungee text-xl text-[color:var(--max-yellow)] shadow-2xl sm:text-3xl">
        {p.text}
      </div>
    </div>
  );
}
