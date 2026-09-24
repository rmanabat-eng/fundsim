"use client";

// Stateless, like ThemeToggle: visibility is driven by the `chart-hidden`
// class on <html> (restored pre-paint in the layout's inline script), so
// there's nothing to hydrate and no flash. The label swaps via CSS.
export function FundChartToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("chart-hidden");
    document.documentElement.classList.toggle("chart-hidden", next);
    localStorage.fundChart = next ? "hidden" : "shown";
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--max-cyan)] hover:text-white"
    >
      <span className="[.chart-hidden_&]:hidden">Hide chart</span>
      <span className="hidden [.chart-hidden_&]:inline">Show chart</span>
      <span aria-hidden className="text-[10px] transition-transform [.chart-hidden_&]:-rotate-90">
        ▼
      </span>
    </button>
  );
}
