"use client";

import { useEffect, useState } from "react";

// A tiny toast system. The store lives at module scope so a toast fired from a
// card that's about to unmount (its deal/decision leaves the list on the next
// revalidate) still lands — the persistent <Toaster/> in the play Shell owns
// the UI, not the card that triggered it.

export type ToastTone = "success" | "info" | "error";
type Toast = { id: number; message: string; tone: ToastTone };

let toasts: Toast[] = [];
const listeners = new Set<(t: Toast[]) => void>();
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(toasts);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(message: string, tone: ToastTone = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => dismiss(id), 3500);
}

const toneStyles: Record<ToastTone, string> = {
  success:
    "border-emerald-500 dark:border-emerald-600 text-slate-800 dark:text-slate-100",
  info: "border-indigo-500 dark:border-indigo-600 text-slate-800 dark:text-slate-100",
  error: "border-rose-500 dark:border-rose-600 text-slate-800 dark:text-slate-100",
};

const toneIcon: Record<ToastTone, string> = {
  success: "✅",
  info: "💬",
  error: "⚠️",
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    setItems(toasts); // catch anything queued before mount
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium shadow-lg dark:bg-slate-900 ${toneStyles[t.tone]}`}
        >
          <span aria-hidden>{toneIcon[t.tone]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded text-slate-400 outline-none hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
