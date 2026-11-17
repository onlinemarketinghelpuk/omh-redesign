import type { ReactNode } from "react";

/* Card grid with the agreed tiers (docs/responsive-plan.md 2.1): one column on phones, two on tablets, then
   the full count. In the two-up tier an odd last card spans both columns, so no card is left on its own.
   Gap is the grid token (16px on phones, 20px from 1280px, as the old gap-5). */

const COLS = {
  2: "md:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>:last-child:nth-child(odd)]:col-span-2",
  4: "sm:grid-cols-2 xl:grid-cols-4 sm:max-xl:[&>:last-child:nth-child(odd)]:col-span-2",
} as const;

export function CardGrid({
  cols = 3,
  as: Tag = "div",
  className = "",
  children,
}: {
  cols?: keyof typeof COLS;
  as?: "div" | "ul" | "ol";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`grid gap-grid ${COLS[cols]} ${className}`}>{children}</Tag>;
}
