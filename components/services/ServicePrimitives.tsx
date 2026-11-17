import type { ReactNode } from "react";
import Link from "next/link";
import { isHiddenHref } from "@/lib/flags";
import { HighlightedText, SectionHeader } from "@/components/ui/SectionHeader";

// Moved to components/ui/SectionHeader.tsx; re-exported so existing imports keep working.
export { HighlightedText, SectionHeader as ServiceSectionIntro };

/**
 * A page title with its closing phrase in the amber accent, as on the homepage
 * H1 ("…for UK businesses"): the last two words, or the last word of a short
 * title, with any closing punctuation left outside the accent.
 */
export function AccentTitle({ text }: { text: string }) {
  const body = text.replace(/[.!?:]+$/, "");
  const words = body.split(" ");
  if (words.length < 2) return <>{text}</>;
  const n = words.length >= 4 ? 2 : 1;
  return (
    <>
      {words.slice(0, -n).join(" ")} <span className="text-amber-deep">{words.slice(-n).join(" ")}</span>
      {text.slice(body.length)}
    </>
  );
}


export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  );
}

export function MinusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M6 12h12" />
    </svg>
  );
}

// Shared package-table cell: strings are shown verbatim, booleans use an
// accessible included/not-included status that can be recoloured per service.
export function FeatureValue({
  value,
  includedClassName = "text-amber-deep",
  excludedClassName = "text-muted/55",
  falseFallback,
}: {
  value: boolean | string;
  includedClassName?: string;
  excludedClassName?: string;
  falseFallback?: ReactNode;
}) {
  if (typeof value === "string") return <>{value}</>;

  if (value) {
    return (
      <span className={`inline-flex items-center ${includedClassName}`}>
        <CheckIcon className="size-4" />
        <span className="sr-only">Included</span>
      </span>
    );
  }

  if (falseFallback !== undefined) return <>{falseFallback}</>;

  return (
    <span className={`inline-flex items-center ${excludedClassName}`}>
      <MinusIcon className="size-4" />
      <span className="sr-only">Not included</span>
    </span>
  );
}

// Audit T-26: the live site has zero contextual in-body internal links — every
// internal link resolves to the header, footer or mega-menu. Content files hold
// plain strings, so link targets are written inline as [anchor](/path) and
// rendered here. Keeps the §7 linking plan in the content data, not the markup.
// Bare email addresses and UK phone numbers in the text also become links (client audit, 26 Oct 2026).
const linkPattern = /(\[[^\]]+\]\(\/[^)]*\)|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|(?:\+44\s?|0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/g;
const linkClass = "font-semibold text-amber-deep underline decoration-amber-deep/35 underline-offset-4 hover:decoration-amber-deep";

export function withLinks(text: string) {
  const parts = text.split(linkPattern);
  return (
    <>
      {parts.map((part, i) => {
        if (part.includes("@") && !part.startsWith("[")) {
          // The address may break after the @ (on 320px phones it is wider than the column), never inside the domain.
          const [user, domain] = part.split("@");
          return <a key={i} href={`mailto:${part}`} className={linkClass}>{user}@<wbr />{domain}</a>;
        }
        if (/^(?:\+44|0)[\d\s-]+$/.test(part)) {
          const digits = part.replace(/[\s-]/g, "").replace(/^0/, "+44");
          return <a key={i} href={`tel:${digits}`} className={linkClass}>{part}</a>;
        }
        const match = /^\[([^\]]+)\]\((\/[^)]*)\)$/.exec(part);
        if (!match) return part;
        if (isHiddenHref(match[2])) return match[1];
        // ponytail: a plain inline anchor, not TextLink — TextLink appends an
        // arrow and is inline-flex, which breaks mid-sentence.
        return (
          <Link key={i} href={match[2]} className={linkClass}>
            {match[1]}
          </Link>
        );
      })}
    </>
  );
}
