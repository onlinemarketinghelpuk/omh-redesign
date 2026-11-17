import type { ReactNode } from "react";

// Single "label + content" band shared by every service and landing page.
// Previously duplicated near-identically across 6 files with drifting spacing —
// this is the converged version. Each page keeps its own accent colour via
// `accent`, its own ground via `tone`, and its own label treatment via
// `labelStyle`, so consecutive pages don't repeat the same heading bar.

export type ServiceBandTone = "warm" | "white" | "mist" | "navy" | "dark";

/* `rule` is the original treatment and stays the default, so the nine existing
   service pages are untouched. Every rebuilt legacy page picks a different one. */
export type ServiceBandLabel =
  | "rule" // dash + caps (the hairline that ran to the right went with the site's lines, 17 Nov 2026)
  | "plain" // dash + caps, nothing else
  | "pill" // caps inside a rounded outline chip
  | "index" // large tabular numeral beside the caps
  | "centered" // caps, centred
  | "underline" // caps above a short thick accent bar
  | "topline" // caps only (its full-width hairline went with the site's lines)
  | "dot" // filled accent dot + caps
  | "none"; // no label band — content supplies its own heading

const toneClass: Record<ServiceBandTone, string> = {
  warm: "",
  white: "bg-surface",
  mist: "bg-tint-blue text-ink",
  // Black and white sections only (client, 29 Oct 2026). OLD navy #0e2035, dark #211a12.
  navy: "bg-inverse text-oninverse",
  dark: "bg-inverse text-oninverse",
};

const darkTones: ServiceBandTone[] = ["navy", "dark"];

export function ServiceBand({
  label,
  id,
  tone = "warm",
  accent = "bg-amber",
  labelStyle = "rule",
  index,
  className,
  children,
}: {
  label: string;
  id?: string;
  tone?: ServiceBandTone;
  accent?: string;
  labelStyle?: ServiceBandLabel;
  index?: number;
  /** Extra classes for the section, e.g. "hero-grid" when the band is a page hero. */
  className?: string;
  children: ReactNode;
}) {
  const dark = darkTones.includes(tone);
  // Phones: tighter tracking and balanced lines keep a long label to two lines (it wrapped to three at 360px).
  const caps = `text-[14px] font-semibold uppercase tracking-[0.17em] max-sm:tracking-[0.1em] text-balance ${dark ? "text-oninverse/55" : "text-muted"}`;
  const border = dark ? "border-oninverse/25" : "border-line";
  const accentText = dark ? "text-oninverse/70" : "text-amber-deep";

  return (
    <section id={id} className={[toneClass[tone], className].filter(Boolean).join(" ") || undefined}>
      <div className="container-omh section-md">
        <div className={labelStyle === "none" ? undefined : "mb-label"}>
          {labelStyle === "rule" && (
            <div className={`flex items-center gap-4 ${caps}`}>
              <span aria-hidden className={`h-0.5 w-7 shrink-0 ${accent}`} />
              <span className="min-w-0">{label}</span>
            </div>
          )}

          {labelStyle === "plain" && (
            <div className={`flex items-center gap-4 ${caps}`}>
              <span aria-hidden className={`h-0.5 w-7 shrink-0 ${accent}`} />
              <span>{label}</span>
            </div>
          )}

          {labelStyle === "pill" && (
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1.5 ${border} ${caps}`}
            >
              {label}
            </span>
          )}

          {labelStyle === "index" && (
            <div className="flex items-baseline gap-4">
              {index !== undefined && (
                <span
                  aria-hidden
                  className={`font-sans text-[clamp(30px,24px+1.2vw,40px)] font-semibold leading-none tabular-nums ${accentText}`}
                >
                  {String(index).padStart(2, "0")}
                </span>
              )}
              <span className={caps}>{label}</span>
            </div>
          )}

          {labelStyle === "centered" && (
            <div className={`text-center ${caps}`}>{label}</div>
          )}

          {labelStyle === "underline" && (
            <div>
              <span className={`${caps} block`}>{label}</span>
              <span aria-hidden className={`mt-3 block h-1 w-12 ${accent}`} />
            </div>
          )}

          {labelStyle === "topline" && (
            <span className={`${caps} block`}>{label}</span>
          )}

          {labelStyle === "dot" && (
            <div className={`flex items-center gap-3 ${caps}`}>
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${accent}`} />
              <span>{label}</span>
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
