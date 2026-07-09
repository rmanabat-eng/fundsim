"use client";

// Stateless: the icon is chosen by CSS from the `dark` class on <html>,
// so there's nothing to hydrate and no flash. The click handler just
// flips the class and persists the choice.
export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle dark mode"
      aria-label="Toggle dark mode"
      className="rounded-full bg-white/20 p-2 text-lg leading-none hover:bg-white/30 transition-colors"
    >
      <span className="dark:hidden">☀️</span>
      <span className="hidden dark:inline">🌙</span>
    </button>
  );
}
