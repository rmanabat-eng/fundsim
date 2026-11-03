"use client";

import { useEffect, useState } from "react";
import { formatDollars, formatMultiple } from "@/lib/fund-math";
import { prefersReducedMotion } from "@/lib/motion";

const FORMATS = { dollars: formatDollars, multiple: formatMultiple };
type Format = keyof typeof FORMATS;

// Ticks a number from `from` to `to` after `delay` ms, easing out. Starts
// at `from` on the server too, so hydration matches; reduced motion jumps
// straight to `to` on the first frame.
export function CountUp({
  from,
  to,
  delay = 0,
  format = "multiple",
}: {
  from: number;
  to: number;
  delay?: number;
  format?: Format;
}) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    let frame = 0;
    const start = prefersReducedMotion() ? -Infinity : performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / 900, 0), 1);
      setValue(from + (to - from) * (1 - (1 - t) ** 3)); // ease-out cubic
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to, delay]);
  return <>{FORMATS[format](value)}</>;
}

// A live number that ticks from its previous value whenever it changes —
// e.g. dry powder dropping after a check, TVPI moving after a year.
export function Ticker({ value, format }: { value: number; format: Format }) {
  const [last, setLast] = useState(value);
  const [from, setFrom] = useState(value);
  if (value !== last) {
    // Adjusting state during render (React's "previous props" pattern).
    setFrom(last);
    setLast(value);
  }
  return <CountUp key={value} from={from} to={value} format={format} />;
}
