"use client";

import { useMemo, useState } from "react";
import { formatDollars, formatDate } from "@/lib/fund-math";

export type FundChartPoint = {
  date: string; // ISO
  deployed: number;
  value: number;
  distributions: number;
};

const W = 720;
const H = 280;
const PAD = { left: 60, right: 88, top: 16, bottom: 32 };

// This app never toggles Tailwind's `dark:` variant (no .dark class is ever
// set), so the light-surface violet/cyan/slate this component originally
// shipped with was the only palette that ever actually rendered — on
// fundsim's permanently dark background that read as muddy, low-contrast
// lines and near-invisible grid/axis text. These are the colors that
// actually paint now: high-contrast against dark, identity also carried by
// the direct labels and legend, never by color alone.
const SERIES = {
  total: { label: "Total value", color: "var(--max-magenta, #ff3af2)" },
  deployed: { label: "Deployed", color: "var(--max-cyan, #00f5d4)" },
};

function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(x)));
  const unit = x / pow;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10;
  return nice * pow;
}

function shortDollars(x: number): string {
  if (x >= 1_000_000) return `$${(x / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  if (x >= 1_000) return `$${Math.round(x / 1_000)}K`;
  return `$${x}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const s = d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  return s.replace(/(\d+)$/, "’$1"); // "Oct 24" → "Oct ’24"
}

// Step-after path: the value holds until the next event, then jumps.
function stepPath(xs: number[], ys: number[]): string {
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 1; i < xs.length; i++) {
    d += ` H ${xs[i].toFixed(1)} V ${ys[i].toFixed(1)}`;
  }
  return d;
}

export function FundChart({ points }: { points: FundChartPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const geom = useMemo(() => {
    const t0 = new Date(points[0].date).getTime();
    const t1 = new Date(points[points.length - 1].date).getTime();
    const span = Math.max(t1 - t0, 1);
    const totals = points.map((p) => p.value + p.distributions);
    const yMax = niceCeil(Math.max(...totals, ...points.map((p) => p.deployed)) * 1.1);

    const x = (iso: string) =>
      PAD.left + ((new Date(iso).getTime() - t0) / span) * (W - PAD.left - PAD.right);
    const y = (v: number) => H - PAD.bottom - (v / yMax) * (H - PAD.top - PAD.bottom);

    const xs = points.map((p) => x(p.date));
    return {
      xs,
      yTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax),
      yOf: y,
      totalYs: totals.map(y),
      deployedYs: points.map((p) => y(p.deployed)),
    };
  }, [points]);

  if (points.length < 2) return null;

  const { xs, yTicks, yOf, totalYs, deployedYs } = geom;
  const last = points.length - 1;

  // X ticks: first, ~middle, last event dates.
  const xTickIdxs = [...new Set([0, Math.floor(last / 2), last])];

  // Direct labels at the line ends; nudge apart if they'd collide.
  let totalLabelY = totalYs[last];
  let deployedLabelY = deployedYs[last];
  if (Math.abs(totalLabelY - deployedLabelY) < 14) {
    if (totalLabelY <= deployedLabelY) {
      totalLabelY -= 7;
      deployedLabelY += 7;
    } else {
      totalLabelY += 7;
      deployedLabelY -= 7;
    }
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++) {
      if (Math.abs(xs[i] - px) < Math.abs(xs[best] - px)) best = i;
    }
    setHoverIdx(best);
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const tooltipOnLeft = hoverIdx !== null && xs[hoverIdx] > W * 0.6;

  return (
    <div>
      <div className="flex items-center gap-5 text-xs text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: SERIES.total.color }}
          />
          Total value (paper + cash)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: SERIES.deployed.color }}
          />
          Capital deployed
        </span>
      </div>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Fund value and deployed capital over time"
          onMouseMove={onMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* recessive grid + y labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yOf(v)}
                y2={yOf(v)}
                className="stroke-white/10"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={yOf(v) + 3.5}
                textAnchor="end"
                className="fill-white/50"
                fontSize={11}
              >
                {shortDollars(v)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {xTickIdxs.map((i) => (
            <text
              key={i}
              x={xs[i]}
              y={H - PAD.bottom + 18}
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
              className="fill-white/50"
              fontSize={11}
            >
              {shortDate(points[i].date)}
            </text>
          ))}

          {/* series */}
          <path
            d={stepPath(xs, deployedYs)}
            fill="none"
            stroke={SERIES.deployed.color}
            strokeWidth={2}
          />
          <path
            d={stepPath(xs, totalYs)}
            fill="none"
            stroke={SERIES.total.color}
            strokeWidth={2}
          />

          {/* direct labels at line ends */}
          <text
            x={W - PAD.right + 6}
            y={totalLabelY + 3.5}
            fontSize={11}
            fontWeight={600}
            className="fill-white/90"
          >
            {shortDollars(points[last].value + points[last].distributions)} total
          </text>
          <text
            x={W - PAD.right + 6}
            y={deployedLabelY + 3.5}
            fontSize={11}
            className="fill-white/60"
          >
            {shortDollars(points[last].deployed)} in
          </text>

          {/* hover crosshair */}
          {hoverIdx !== null && (
            <g>
              <line
                x1={xs[hoverIdx]}
                x2={xs[hoverIdx]}
                y1={PAD.top}
                y2={H - PAD.bottom}
                className="stroke-white/20"
                strokeWidth={1}
              />
              <circle
                cx={xs[hoverIdx]}
                cy={totalYs[hoverIdx]}
                r={4}
                fill={SERIES.total.color}
                className="stroke-[#151528]"
                strokeWidth={2}
              />
              <circle
                cx={xs[hoverIdx]}
                cy={deployedYs[hoverIdx]}
                r={4}
                fill={SERIES.deployed.color}
                className="stroke-[#151528]"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {hover && hoverIdx !== null && (
          <div
            className="max-card-solid pointer-events-none absolute top-2 z-10 rounded-lg px-3 py-2 text-xs"
            style={
              {
                "--max-card-border": "var(--max-cyan)",
                ...(tooltipOnLeft
                  ? { right: `${100 - (xs[hoverIdx] / W) * 100 + 2}%` }
                  : { left: `${(xs[hoverIdx] / W) * 100 + 2}%` }),
              } as unknown as React.CSSProperties
            }
          >
            <p className="font-medium text-white/90">
              {formatDate(new Date(hover.date))}
            </p>
            <p className="mt-1 text-white/75">
              Total value: <strong>{formatDollars(hover.value + hover.distributions)}</strong>
            </p>
            {hover.distributions > 0 && (
              <p className="text-white/60">
                of which cash: {formatDollars(hover.distributions)}
              </p>
            )}
            <p className="text-white/60">
              Deployed: {formatDollars(hover.deployed)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
