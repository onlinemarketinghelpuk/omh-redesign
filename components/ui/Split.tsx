import type { ReactNode } from "react";

/* Two-column row, stacked until `from` (docs/responsive-plan.md section 2.1). Replaces the hand-written 12-column
   rows that switched to display:block below 1024px. The column widths come from the `split-on` utility in
   globals.css, which matches col-span-A / col-span-B of the old 12-column grid exactly, so migrating a row
   does not move it on desktop. Children need no classes, so a <Reveal> can be a column.

   Defaults follow the plan's rule that a column must be at least 20rem wide before a row goes side by side:
   6/6 from 768px, 7/5-type rows from 1024px, a narrow 4/12 side from 1152px (`wide`). */

type Ratio = "4/8" | "8/4" | "5/7" | "7/5" | "5/6" | "6/5" | "6/6" | "7/4" | "4/7";
type From = "md" | "lg" | "wide" | "xl";

const RATIO: Record<Ratio, string> = {
  "4/8": "[--split-a:4] [--split-b:8]",
  "8/4": "[--split-a:8] [--split-b:4]",
  "5/7": "[--split-a:5] [--split-b:7]",
  "7/5": "[--split-a:7] [--split-b:5]",
  "5/6": "[--split-a:5] [--split-b:6]",
  "6/5": "[--split-a:6] [--split-b:5]",
  "6/6": "[--split-a:6] [--split-b:6]",
  "7/4": "[--split-a:7] [--split-b:4]",
  "4/7": "[--split-a:4] [--split-b:7]",
};
const DEFAULT_FROM: Record<Ratio, From> = { "4/8": "wide", "8/4": "wide", "4/7": "wide", "7/4": "wide", "5/7": "lg", "7/5": "lg", "5/6": "lg", "6/5": "lg", "6/6": "md" };

// Literal class strings per tier (Tailwind only generates classes it can read in the source).
const ON: Record<From, string> = { md: "md:split-on", lg: "lg:split-on", wide: "wide:split-on", xl: "xl:split-on" };
const REVERSE: Record<From, string> = {
  md: "md:[&>:first-child]:order-2",
  lg: "lg:[&>:first-child]:order-2",
  wide: "wide:[&>:first-child]:order-2",
  xl: "xl:[&>:first-child]:order-2",
};
// The intro column stays in view while the other one scrolls, only once the row is side by side.
const STICKY: Record<From, string> = {
  md: "md:[&>:first-child]:sticky md:[&>:first-child]:top-24 md:[&>:first-child]:self-start",
  lg: "lg:[&>:first-child]:sticky lg:[&>:first-child]:top-24 lg:[&>:first-child]:self-start",
  wide: "wide:[&>:first-child]:sticky wide:[&>:first-child]:top-24 wide:[&>:first-child]:self-start",
  xl: "xl:[&>:first-child]:sticky xl:[&>:first-child]:top-24 xl:[&>:first-child]:self-start",
};
const ALIGN = { stretch: "", start: "items-start", center: "items-center", end: "items-end" } as const;
const GAP = { 10: "[--split-gap:2.5rem]", 12: "[--split-gap:3rem]", 16: "[--split-gap:4rem]" } as const;

export function Split({
  ratio = "6/6",
  from,
  align = "stretch",
  gap = 12,
  reverse = false,
  sticky = false,
  as: Tag = "div",
  className = "",
  children,
}: {
  ratio?: Ratio;
  /** Tier at which the two columns sit side by side; stacked below it. */
  from?: From;
  align?: keyof typeof ALIGN;
  /** Gutter between the columns in Tailwind units: 10 = 40px, 12 = 48px (default), 16 = 64px. */
  gap?: keyof typeof GAP;
  /** Show the first child on the right once side by side (it still comes first when stacked). */
  reverse?: boolean;
  /** Keep the first child in view while the second scrolls. Do not combine with align="center". */
  sticky?: boolean;
  as?: "div" | "section" | "article";
  className?: string;
  children: [ReactNode, ReactNode];
}) {
  const tier = from ?? DEFAULT_FROM[ratio];
  return (
    <Tag className={["split", RATIO[ratio], GAP[gap], ON[tier], ALIGN[align], reverse ? REVERSE[tier] : "", sticky ? STICKY[tier] : "", className].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}
