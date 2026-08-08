"use client";

import { useState, useTransition } from "react";
import { investInDeal, passDeal } from "@/app/play/actions";
import { formatDollars } from "@/lib/fund-math";
import { StageBadge } from "@/components/StageBadge";
import { Term } from "@/components/Term";
import { toast } from "@/components/toast";
import { sectorArt } from "@/lib/sectors";
import { prefersReducedMotion } from "@/lib/motion";

const CHECK_STEP = 25_000;

// Exit-animation durations — the hold before the real mutation fires, so the
// motion always finishes before revalidate's data change unmounts the card,
// rather than racing the network round-trip. Invest gets more time since its
// motion is doing more (lift, scale, border color); pass is a quick dismissal.
const INVEST_EXIT_MS = 380;
const PASS_EXIT_MS = 220;

export type DealView = {
  id: string;
  name: string;
  sector: string;
  stage: string;
  raised: number;
  postMoney: number;
  description: string;
  referredBy: string | null; // set when a founder with an earned track record referred this deal in
  signals: string[];
};

// A pitch card: the numbers, the signals, and a decision. The signals are
// the whole game — some of them (noisily) predict how the company does.
export function DealCard({ deal }: { deal: DealView }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Which exit motion is playing, if any — held locally so the animation
  // has something to animate on before the deal disappears from the parent's
  // list. See invest()/pass(): the exit plays first, then the real mutation.
  const [exiting, setExiting] = useState<"invest" | "pass" | null>(null);
  // Open with a real position on the table — ~20% of the round — instead of
  // an empty box the player has to type into.
  const defaultCheck = Math.max(
    Math.round((deal.raised * 0.2) / CHECK_STEP) * CHECK_STEP,
    CHECK_STEP
  );
  const [check, setCheck] = useState(defaultCheck);

  const ownership = (check / deal.postMoney) * 100;
  const art = sectorArt(deal.sector);

  // Call the action imperatively so the confirmation toast fires from the
  // module-level store before this card unmounts on the next revalidate.
  //
  // The exit animation plays before the mutation, not after: revalidatePath
  // (inside investInDeal/passDeal) changes the parent's deal list as soon as
  // the action resolves, and React unmounts this card the moment that new
  // data arrives. Waiting until after the action to animate would mean
  // racing that unmount. Playing the exit first and holding for its exact
  // duration guarantees it always finishes before the mutation that removes
  // the card even starts.
  function invest() {
    setError(null);
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("invest");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, INVEST_EXIT_MS));
      const data = new FormData();
      data.set("check", String(check));
      const res = await investInDeal(deal.id, null, data);
      if (res?.error) {
        setExiting(null);
        setError(res.error);
      } else {
        toast(
          `Wired ${formatDollars(check)} into ${deal.name} — ${ownership.toFixed(2)}%`
        );
      }
    });
  }

  function pass() {
    const reduced = prefersReducedMotion();
    if (!reduced) setExiting("pass");
    startTransition(async () => {
      if (!reduced) await new Promise((r) => setTimeout(r, PASS_EXIT_MS));
      await passDeal(deal.id);
      toast(`Passed on ${deal.name}`, "info");
    });
  }

  // Set as inline style (not another Tailwind class) so it reliably wins over
  // the hover-lift utility classes above regardless of whether the mouse is
  // still over the card when the exit starts — inline style always beats a
  // stylesheet rule, hover pseudo-class or not. Skipped entirely under
  // reduced motion (invest()/pass() never set `exiting` in that case), so
  // the card just sits still until the ordinary unmount removes it.
  const exitStyle =
    exiting === "invest"
      ? {
          transitionProperty: "transform, opacity, border-color",
          transitionDuration: `${INVEST_EXIT_MS}ms`,
          transitionTimingFunction: "ease-out",
          transform: "translateY(-0.75rem) scale(1.06)",
          opacity: 0,
          "--max-card-border": "var(--max-magenta)",
        }
      : exiting === "pass"
        ? {
            transitionProperty: "transform, opacity",
            transitionDuration: `${PASS_EXIT_MS}ms`,
            transitionTimingFunction: "ease-out",
            transform: "translateX(2.5rem) rotate(6deg)",
            opacity: 0,
          }
        : {};

  return (
    <div
      className="max-card-flat relative flex h-full flex-col rounded-2xl transition-transform duration-[var(--max-hover-duration)] ease-[var(--max-hover-ease)] hover:z-30 focus-within:z-30 motion-safe:hover:-translate-y-2 motion-safe:hover:-rotate-[1.5deg]"
      style={{ "--max-card-border": "var(--max-cyan)", ...exitStyle } as React.CSSProperties}
    >
      <div
        className={`flex items-center justify-between gap-2 rounded-t-[14px] border-b-4 border-black/20 bg-gradient-to-r px-5 py-3 ${art.banner}`}
      >
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">
          <span aria-hidden className="text-2xl">
            {art.emoji}
          </span>
          {deal.name}
        </h3>
        <span className="shrink-0 rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
          {deal.sector}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {deal.referredBy && (
          <p className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-[color:var(--max-yellow)]/50 bg-[color:var(--max-yellow)]/10 px-2 py-0.5 text-xs font-bold text-[color:var(--max-yellow)]">
            🤝 Referred by {deal.referredBy}
          </p>
        )}
        <p className="text-sm text-white/60">{deal.description}</p>

        <p className="mt-2 text-sm text-white/70">
          <StageBadge stage={deal.stage} /> raising {formatDollars(deal.raised)} at a{" "}
          {formatDollars(deal.postMoney)}{" "}
          <Term def="The company's valuation with the new money already counted in. Your ownership is simply your check ÷ post-money.">
            post-money
          </Term>
          .
        </p>

        <ul
          data-tour="deal-signals"
          className="mt-3 space-y-1.5 text-sm text-white/70"
        >
          {deal.signals.map((s) => (
            <li key={s} className="flex gap-2">
              <span aria-hidden>🔎</span>
              {s}
            </li>
          ))}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            invest();
          }}
          className="mt-auto flex flex-col gap-2 border-t-2 border-white/10 pt-4"
        >
          <div data-tour="deal-check" className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-white/60">Your check</span>
              <span className="font-semibold tabular-nums text-white">
                {formatDollars(check)}{" "}
                <span className="font-normal text-white/60">
                  · {ownership.toFixed(2)}%
                </span>
              </span>
            </div>
            <input
              name="check"
              type="range"
              min={CHECK_STEP}
              max={deal.raised}
              step={CHECK_STEP}
              value={check}
              onChange={(e) => setCheck(Number(e.target.value))}
              className="w-full accent-[color:var(--max-magenta)]"
              aria-label="Check size"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>{formatDollars(CHECK_STEP)}</span>
              <span>{formatDollars(deal.raised)} (lead it)</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="max-btn-primary shrink-0 rounded-full border-4 border-[color:var(--max-yellow)] bg-gradient-to-r from-[color:var(--max-magenta)] via-[color:var(--max-purple)] to-[color:var(--max-cyan)] px-4 py-2 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
            >
              {pending ? "Wiring..." : "💸 Invest"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={pass}
              className="max-btn-outline shrink-0 rounded-full border-4 border-white/30 bg-[#2d1b4e]/60 px-3 py-2 text-sm font-bold text-white/80 disabled:opacity-50"
            >
              Pass
            </button>
          </div>
          {error && (
            <p className="text-xs text-[color:var(--max-orange)]" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
