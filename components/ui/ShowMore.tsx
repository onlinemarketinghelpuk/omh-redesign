"use client";

import { Children, useState, type ReactNode } from "react";

/* Phones only (under 640px): show the first `limit` items of a long list and a "Show all" button; tablets and
   desktop always show everything. Every item stays in the HTML, so nothing is lost for search or screen readers
   with the button pressed (user decision, 16 Nov 2026: collapse long lists on phones, remove nothing). */

// Literal classes per limit: Tailwind only generates what it can read in the source.
const HIDE = {
  1: "max-sm:[&>:nth-child(n+2)]:hidden",
  2: "max-sm:[&>:nth-child(n+3)]:hidden",
  3: "max-sm:[&>:nth-child(n+4)]:hidden",
  4: "max-sm:[&>:nth-child(n+5)]:hidden",
  5: "max-sm:[&>:nth-child(n+6)]:hidden",
  6: "max-sm:[&>:nth-child(n+7)]:hidden",
  8: "max-sm:[&>:nth-child(n+9)]:hidden",
} as const;

export function ShowMore({
  limit = 5,
  as: Tag = "ul",
  className = "",
  buttonClassName = "",
  noun = "items",
  moreLabel,
  lessLabel,
  children,
}: {
  limit?: keyof typeof HIDE;
  as?: "ul" | "ol" | "div" | "dl";
  className?: string;
  buttonClassName?: string;
  /** What the list holds, for the default label: "Show all 14 inclusions". */
  noun?: string;
  moreLabel?: string;
  lessLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const total = Children.count(children);
  return (
    <>
      <Tag className={`${className} ${open ? "" : HIDE[limit]}`}>{children}</Tag>
      {total > limit && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={`mt-3 inline-flex min-h-11 cursor-pointer items-center font-sans text-body font-semibold text-amber-deep underline-offset-4 hover:underline sm:hidden ${buttonClassName}`}
        >
          {open ? (lessLabel ?? `Show fewer ${noun}`) : (moreLabel ?? `Show all ${total} ${noun}`)}
        </button>
      )}
    </>
  );
}
