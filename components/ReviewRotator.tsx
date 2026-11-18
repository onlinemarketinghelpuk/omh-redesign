"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Quote } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Review = { quote: string; name?: string };

const AUTOPLAY_MS = 7000;
const SWIPE_PX = 50;

// The featured quote steps down a size as it gets longer, so the 560-character reviews fit the same card as the
// short ones.
const featuredSize = (quote: string) =>
  quote.length <= 180
    ? "text-[clamp(30px,25px+1.3vw,44px)] leading-tight max-sm:text-h3"
    : quote.length <= 340
      ? "text-[clamp(22px,18px+0.9vw,32px)] leading-snug"
      : "text-[clamp(18px,16px+0.6vw,25px)] leading-normal";

const navButton =
  "flex size-11 items-center justify-center rounded-full border border-oninverse/20 text-oninverse transition-colors hover:border-oninverse/55 hover:bg-oninverse/10";

/*
  Home reviews: one featured card on the left, the next two on the right. "Next" moves the top-right review into
  the featured card, the bottom-right one up, and brings a new one in at the bottom; "previous" runs it backwards.
  It loops forever and steps on its own while not hovered or focused. Below 1024px only the featured card shows.
*/
export function ReviewRotator({ testimonials }: { testimonials: readonly Review[] }) {
  const count = testimonials.length;
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(0); // 1 next, -1 previous, 0 nothing moved yet (no entrance animation)
  // Hover or keyboard focus holds the rotation. No pause button (client, 18 Nov 2026).
  const [held, setHeld] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (step: number) => {
    setDir(step);
    setCurrent((i) => (i + step + count) % count);
  };
  const at = (offset: number) => (current + offset) % count;

  // `current` in the deps restarts the countdown after a manual step, so a click never gets overtaken at once.
  useEffect(() => {
    if (held || count < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [held, current, count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === 0) return null;

  // Each slot slides in from where its new review was: next = featured from the right, the side cards from below.
  // No slide before the first step, and none for reduced motion.
  const slide = dir === 0 ? "" : "motion-safe:animate-[review-in_560ms_cubic-bezier(.2,.8,.2,1)]";
  const from = (x: number, y: number) => ({ "--rx": `${x * dir}px`, "--ry": `${y * dir}px` }) as CSSProperties;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Client reviews"
      className="grid grid-cols-[1.1fr_0.9fr] gap-6 max-lg:grid-cols-1"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const moved = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(moved) > SWIPE_PX) go(moved < 0 ? 1 : -1);
      }}
    >
      <div className="quote-feature group relative flex min-h-[520px] flex-col overflow-hidden rounded-[8px] bg-inverse p-[clamp(28px,4vw,56px)] text-oninverse max-sm:min-h-[420px]">
        <Quote className="size-12 shrink-0 text-oninverse/22 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-1 group-hover:rotate-[-4deg] max-sm:size-9" strokeWidth={1.5} aria-hidden />

        {/* Every review sits in the same grid cell and only the current one is visible, so the card is always as
            tall as the longest review and the page below never jumps as it rotates. */}
        <div className="my-10 grid flex-1 max-sm:my-6" aria-live={held ? "polite" : "off"}>
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              aria-hidden={i === current ? undefined : true}
              className={`col-start-1 row-start-1 my-auto font-body ${featuredSize(t.quote)} ${i === current ? slide : "invisible"}`}
              style={from(48, 0)}
            >
              &ldquo;{t.quote}&rdquo;
            </blockquote>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p key={current} className={`text-body font-semibold text-oninverse/75 ${slide}`} style={from(24, 0)}>
            {testimonials[current].name}
          </p>
          <div className="flex items-center gap-2">
            <p className="mr-2 text-body font-semibold tabular-nums text-oninverse/62 max-sm:hidden">
              {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </p>
            <button type="button" onClick={() => go(-1)} aria-label="Previous review" data-event="home_reviews_previous" className={navButton}>
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next review" data-event="home_reviews_next" className={navButton}>
              <ArrowRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-rows-2 gap-6 max-lg:hidden" aria-label="Up next">
        {[1, 2].map((offset) => {
          const t = testimonials[at(offset)];
          return (
            // Keyed by step, not review: a remount is what replays the slide-in.
            <figure
              key={`${current}-${offset}`}
              style={from(0, 32)}
              className={`surface-card group flex flex-col justify-between rounded-[8px] border border-teal/20 bg-surface p-8 ${slide}`}
            >
              <div>
                <Quote className="size-9 text-amber transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-1 group-hover:rotate-[-4deg]" strokeWidth={1.5} aria-hidden />
                {/* Previews: clamped to five lines at a fixed height, read in full once they reach the featured card. */}
                <blockquote className="mt-5 line-clamp-5 h-[calc(5*1.625em)] text-[22px] leading-relaxed text-ink/85">&ldquo;{t.quote}&rdquo;</blockquote>
              </div>
              <figcaption className="mt-8 flex items-center justify-between gap-4 text-body font-semibold">
                {t.name}
                {/* ponytail: no star row — these are named, real reviewers who never gave a score, so five stars
                    would be an invented rating (brief §6). */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-[14px] font-semibold uppercase tracking-[0.08em] text-amber-deep">
                  <BadgeCheck className="size-4" aria-hidden />
                  Client review
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
