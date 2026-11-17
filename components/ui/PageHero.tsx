import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Proof";
import { Split } from "@/components/ui/Split";

/* The service-page hero (10 near-identical copies before): eyebrow, h1, lead, buttons and a stat row on the left;
   media and the review proof on the right. Side by side from 1024px (7/5, as before). On tablets the copy runs
   full width and the media and proof sit two-up under it, so the hero is no longer 1.2 screens tall at 820px. */

export type HeroStat = readonly [label: string, value: string];

export function PageHero({
  eyebrow,
  title,
  titleSize = "display",
  body,
  actions,
  stats,
  statsStyle = "inline",
  media,
  proof,
  className = "",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  titleSize?: "display" | "h1";
  body: ReactNode;
  /** The button row (Button elements). */
  actions: ReactNode;
  stats?: ReadonlyArray<HeroStat>;
  /** inline: stats wrap in a row. divided: three equal columns with hairlines between them (one-up on phones). */
  statsStyle?: "inline" | "divided";
  media?: ReactNode;
  proof?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hero-grid overflow-x-clip border-b border-line bg-warm ${className}`}>
      <div className="container-omh section-hero">
        <Split ratio="7/5" align="center">
          {/* CSS-only entrance, not <Reveal>: the JS-gated reveal held the headline at opacity 0 until hydration
              and delayed the largest paint. */}
          <div className="hero-in">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className={`mb-6 mt-7 font-sans font-semibold text-balance ${titleSize === "h1" ? "text-h1" : "text-display"}`}>{title}</h1>
            <div className="mb-9 text-lead leading-relaxed text-ink/75 [&>p+p]:mt-4">{typeof body === "string" ? <p>{body}</p> : body}</div>
            <div className="flex flex-wrap items-center gap-3.5 max-sm:flex-col max-sm:items-stretch">{actions}</div>
            {stats && (
              <dl className={`mt-10 border-t border-line pt-7 ${statsStyle === "divided" ? "grid max-w-[690px] items-end gap-5 sm:grid-cols-3 sm:gap-0" : "flex flex-wrap gap-x-10 gap-y-5"}`}>
                {stats.map(([label, value]) => (
                  <div key={label} className={statsStyle === "divided" ? "sm:border-l sm:border-line sm:pl-5 sm:first:border-l-0 sm:first:pl-0" : undefined}>
                    <dt className="eyebrow text-muted">{label}</dt>
                    <dd className="mt-1.5 font-sans text-h4 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {(media || proof) && (
            <div className="hero-in hero-in-2 md:max-lg:grid md:max-lg:grid-cols-2 md:max-lg:items-start md:max-lg:gap-6">
              {media}
              {proof && <div className="mt-6 md:max-lg:mt-0">{proof}</div>}
            </div>
          )}
        </Split>
      </div>
    </section>
  );
}
