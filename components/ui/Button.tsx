import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { isHiddenHref } from "@/lib/flags";

// Future Elementor widget: "OMH Button"
// The site has two buttons (client, 17 Nov 2026). Their look is `.btn-primary` / `.btn-secondary` in globals.css,
// shared with form submits and the voice pages; this only adds the lift on hover. The arrow is drawn by the CSS.
// OLD variants inverse (white on black) and ghost-white became primary and secondary; `small` and `arrow` went.
type Variant = "primary" | "secondary";

export function Button({
  href,
  variant = "primary",
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (isHiddenHref(href)) return null;
  return (
    <Link href={href} {...props} className={`button-motion btn-${variant} ${props.className ?? ""}`}>
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  ...props
}: {
  href: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (isHiddenHref(href)) return null;
  return (
    <Link
      href={href}
      {...props}
      className={`tap-target group inline-flex items-center gap-2 font-semibold text-amber-deep transition-colors duration-500 hover:text-amber-deep hover:underline underline-offset-4 ${props.className ?? ""}`}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:translate-x-0.5" />
    </Link>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );
}
