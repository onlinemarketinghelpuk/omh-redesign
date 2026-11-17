import type { ReactNode } from "react";

/* The section header: optional small-caps kicker, the h2 with an accented phrase, and a description stacked
   underneath (design rules 4 and 22). One component for every band; `ServiceSectionIntro` in
   ServicePrimitives is the same component under its old name. */

export function HighlightedText({
  text,
  highlight,
  highlightClassName = "text-amber-deep",
}: {
  text: string;
  highlight?: string;
  highlightClassName?: string;
}) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;

  const start = text.indexOf(highlight);
  return (
    <>
      {text.slice(0, start)}
      <span className={highlightClassName}>{highlight}</span>
      {text.slice(start + highlight.length)}
    </>
  );
}

export function SectionHeader({
  title,
  accent,
  kicker,
  kickerOnPhones = false,
  body,
  size = "lg",
  align = "left",
  inverse = false,
  id,
  className = "",
  headingMaxWidthClassName = "",
  headingClassName = "",
  bodyClassName = "",
  accentClassName = "text-amber-deep",
}: {
  title: string;
  accent?: string;
  /** Small-caps line above the title. Hidden on phones unless kickerOnPhones, because the band label already
      sits above it there (one label per section on phones, design rule 22). */
  kicker?: ReactNode;
  kickerOnPhones?: boolean;
  body?: ReactNode;
  /** "md" is for a title in a narrow side column: h3 size once the row is side by side (from 1024px), the
      normal h2 size when it has stacked. */
  size?: "lg" | "md";
  align?: "left" | "center";
  inverse?: boolean;
  id?: string;
  className?: string;
  headingMaxWidthClassName?: string;
  headingClassName?: string;
  bodyClassName?: string;
  accentClassName?: string;
}) {
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`.trim() || undefined}>
      {kicker && (
        <p className={`eyebrow mb-5 ${inverse ? "text-oninverse/55" : "text-amber-deep"} ${kickerOnPhones ? "" : "max-sm:hidden"}`}>
          {kicker}
        </p>
      )}
      <h2
        id={id}
        className={`${headingMaxWidthClassName} font-sans font-semibold text-balance ${
          size === "md" ? "text-h2 lg:text-h3" : "text-h2"
        } ${headingClassName}`}
      >
        <HighlightedText text={title} highlight={accent} highlightClassName={accentClassName} />
      </h2>
      {body && (
        <p className={`mt-5 text-lead leading-relaxed ${inverse ? "text-oninverse/72" : "text-ink/75"} ${bodyClassName}`}>
          {body}
        </p>
      )}
    </div>
  );
}
