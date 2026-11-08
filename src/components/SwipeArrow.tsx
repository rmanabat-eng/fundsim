"use client";

// Phone-only ‹ › on a deal card in the snap-scroll row. Tapping slides to the
// neighbouring card; block "nearest" keeps the page itself from jumping.
// Lives inside the card's wrapper, so first/last-card hiding is pure CSS.
export function SwipeArrow({ dir }: { dir: "prev" | "next" }) {
  const next = dir === "next";
  return (
    <button
      type="button"
      aria-label={next ? "Next deal" : "Previous deal"}
      onClick={(e) => {
        const slide = e.currentTarget.parentElement;
        const target = next ? slide?.nextElementSibling : slide?.previousElementSibling;
        target?.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }}
      className={`swipe-nudge absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-xl font-black text-white/80 outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-[color:var(--max-cyan)] active:bg-white/30 md:hidden ${
        next
          ? "right-0 translate-x-1/2 group-last/deal:hidden"
          : "left-0 -translate-x-1/2 [--nudge-x:-5px] group-first/deal:hidden"
      }`}
    >
      {next ? "›" : "‹"}
    </button>
  );
}
