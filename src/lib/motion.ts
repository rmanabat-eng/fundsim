// Shared by DealCard and DecisionCard's exit animations — a setTimeout hold
// can't be gated by CSS (motion-safe: / @media (prefers-reduced-motion))
// the way the animations themselves are, so this is the JS-side counterpart
// of that same signal, read fresh on every call rather than cached once.
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
