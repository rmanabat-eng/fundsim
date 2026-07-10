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
      className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
    >
      <span className="[.chart-hidden_&]:hidden">Hide chart</span>
      <span className="hidden [.chart-hidden_&]:inline">Show chart</span>
    </button>
  );
}
