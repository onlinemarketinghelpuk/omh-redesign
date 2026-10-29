import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { company } from "@/lib/content/nav";

// Every notFound() and unmatched URL lands here, inside the site header and footer. Before this file existed,
// Next's bare default showed: a black screen with "404 | This page could not be found" under the site header.

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

const popular = [
  { label: "AI Voice Agents", href: "/ai-voice-agents", note: "Every call answered, 24/7" },
  { label: "Services", href: "/services", note: "Websites, ads, SEO and social" },
  { label: "Case Studies", href: "/case-studies", note: "Results for UK businesses" },
  { label: "Insights", href: "/insights", note: "Guides and articles" },
];

export default function NotFound() {
  return (
    <section className="hero-grid overflow-x-clip border-b border-line bg-warm">
      <div className="container-omh section-md">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[14px] font-semibold uppercase tracking-[0.16em] text-muted">Error 404</p>
          <h1 className="mb-5 mt-6 font-sans text-display font-semibold text-balance">
            This page <span className="text-amber-deep">can&rsquo;t be found</span>
          </h1>
          <p className="text-lead leading-relaxed text-ink/75">
            The link may be old, or the page may have moved. Try one of these instead, or search the site from the
            top of the page.
          </p>

          <ul className="mx-auto mt-9 grid max-w-[480px] gap-2.5 text-left">
            {popular.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4 transition-colors hover:border-amber/60"
                >
                  <span>
                    <span className="block font-sans text-body font-semibold">{page.label}</span>
                    <span className="block text-[14px] text-muted">{page.note}</span>
                  </span>
                  <span aria-hidden className="text-amber-deep">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <Button href="/" arrow>
              Back to the home page
            </Button>
            <a href={company.phoneHref} className="text-body font-medium text-muted hover:text-ink">
              {company.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
