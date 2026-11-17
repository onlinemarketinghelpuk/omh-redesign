import type { ReactNode } from "react";
import { CardGrid } from "@/components/ui/CardGrid";

/* Numbered points: the problem lists, numbered card grids and dark "goal" cards that were written ~20 times.
   Numbers are always two digits ("01" ... "12"; the old `0{index + 1}` printed "010").
     ruled  hairline above each item, number beside the title, body indented under it (two columns from 768px)
     card   bordered card, number on top (CardGrid tiers: 1, then 2, then `cols`) */

// [title, body] pairs as the content files store them, or { title, body } objects.
type Item = ReadonlyArray<ReactNode> | { title: string; body: ReactNode };
const pair = (item: Item): [string, ReactNode] => ("title" in item ? [item.title, item.body] : [String(item[0]), item[1]]);
const num = (n: number) => String(n).padStart(2, "0");

export function NumberedList({
  items,
  variant = "card",
  cols = 3,
  start = 1,
  inverse = false,
  className = "",
}: {
  items: ReadonlyArray<Item>;
  variant?: "ruled" | "card";
  cols?: 2 | 3 | 4;
  start?: number;
  inverse?: boolean;
  className?: string;
}) {
  if (variant === "ruled") {
    return (
      <div className={`grid gap-x-8 md:grid-cols-2 ${className}`}>
        {items.map((item, i) => {
          const [title, body] = pair(item);
          return (
            <article
              key={title}
              className={`group border-t px-3 py-6 transition-colors ${inverse ? "border-oninverse/15" : "border-line hover:border-teal/50 hover:bg-surface"}`}
            >
              <div className="flex items-baseline gap-4">
                <span className={`font-sans text-body font-semibold tracking-[0.1em] ${inverse ? "text-amber" : "text-muted group-hover:text-amber"}`}>{num(start + i)}</span>
                <h3 className="font-sans text-h4 font-semibold">{title}</h3>
              </div>
              <p className={`mt-2.5 pl-10 text-body leading-relaxed ${inverse ? "text-oninverse/72" : "text-ink/75"}`}>{body}</p>
            </article>
          );
        })}
      </div>
    );
  }
  return (
    <CardGrid cols={cols} className={className}>
      {items.map((item, i) => {
        const [title, body] = pair(item);
        return (
          <article
            key={title}
            className={`rounded-card border p-card ${inverse ? "border-oninverse/12 bg-oninverse/[0.04]" : "surface-card border-line bg-surface"}`}
          >
            <span className="text-body font-semibold tracking-[0.12em] text-amber">{num(start + i)}</span>
            <h3 className="mt-5 font-sans text-h4 font-semibold">{title}</h3>
            <p className={`mt-3 text-body leading-relaxed ${inverse ? "text-oninverse/72" : "text-ink/75"}`}>{body}</p>
          </article>
        );
      })}
    </CardGrid>
  );
}
