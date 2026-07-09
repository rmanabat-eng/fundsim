"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // null until mounted so the server render never guesses the theme
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className="rounded-full bg-white/20 p-2 text-lg leading-none hover:bg-white/30 transition-colors"
    >
      {dark === null ? "…" : dark ? "🌙" : "☀️"}
    </button>
  );
}
