import type { ReactNode } from "react";
import { CheckIcon } from "@/components/services/ServicePrimitives";

/* A list of included points with the check mark. One icon, one size and one offset for the whole site
   (there were 25 hand-written variants). `divided` puts a hairline under each row. */

export function CheckList({
  items,
  divided = false,
  inverse = false,
  cols = 1,
  className = "",
}: {
  items: ReadonlyArray<ReactNode>;
  divided?: boolean;
  inverse?: boolean;
  /** 2 = two columns from 768px. */
  cols?: 1 | 2;
  className?: string;
}) {
  return (
    <ul className={`grid ${divided ? "" : "gap-3"} ${cols === 2 ? "md:grid-cols-2 md:gap-x-8" : ""} ${className}`}>
      {items.map((item, i) => (
        <li
          key={i}
          className={`flex gap-3 text-body leading-relaxed ${inverse ? "text-oninverse/85" : "text-ink/75"} ${
            divided ? `border-b py-3 ${inverse ? "border-oninverse/15" : "border-line"}` : ""
          }`}
        >
          <CheckIcon className={`mt-1 size-4 shrink-0 ${inverse ? "text-amber" : "text-amber-deep"}`} />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
