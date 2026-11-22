import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted on the VPS: bundle a minimal server into .next/standalone.
  output: "standalone",
  // Pages revalidate hourly (the Sanity fetches). Next's default expire of a year made every HTML response say
  // "stale-while-revalidate" for a year, and Chrome honours that: it showed a saved page from before the last
  // deploy, whose CSS no longer exists, so the page loaded unstyled. Expiring with the revalidate drops it.
  expireTime: 3600,
  images: {
    // AVIF first (sharp is installed): smaller than WebP for the photo-heavy media frames.
    formats: ["image/avif", "image/webp"],
    // Optimised images are immutable per URL, so let browsers and the CDN keep them for 31 days
    // (PageSpeed, 26 Oct 2026: the 4-hour default was flagged as an inefficient cache policy).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "onlinemarketinghelp.co.uk",
        pathname: "/wp-content/uploads/**",
      },
      // Blog images uploaded through Sanity Studio.
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
      // Reel thumbnails from the Instagram API (lib/instagram.ts).
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
  // Portfolio demos (public/portfolio/, shown in the popup on /website-designs) are made-up shops: keep them out of
  // search results, and let only our own pages frame them (client, 18 Nov 2026). The proxy sends anyone who opens one
  // directly back to the gallery, so the answer varies with how it was requested.
  async headers() {
    return [
      {
        source: "/portfolio/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Vary", value: "Sec-Fetch-Dest" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/insights", permanent: true },
      // No services hub page exists; the homepage once linked here and the prefetch 404'd (audit, 26 Oct 2026).
      { source: "/services", destination: "/pricing", permanent: true },
      // Phase 4: the four standalone legacy case-study pages now live in the
      // /case-studies/[slug] system, so their old URLs keep their equity.
      {
        source: "/ppc-for-fleming-verandas-case-study",
        destination: "/case-studies/fleming-verandas",
        permanent: true,
      },
      {
        source: "/search-engine-optimisation-for-california-accounting-case-study",
        destination: "/case-studies/california-accounting",
        permanent: true,
      },
      {
        source: "/social-care-illustration-design-case-study",
        destination: "/case-studies/allied-hands",
        permanent: true,
      },
      {
        source: "/website-design-for-out-out-entry-website-design",
        destination: "/case-studies/out-out-entry",
        permanent: true,
      },
      // SEO brief (27 Sep 2026): the organic social page moved to the keyword slug.
      { source: "/social-media-marketing", destination: "/social-media-marketing-services", permanent: true },
      // SEO brief (1 Oct 2026): the national SEO landing page moved off the listicle slug.
      { source: "/best-seo-services", destination: "/seo-services", permanent: true },
      // Oct 2026: retired services. Their URLs pass to the closest live page.
      { source: "/search-engine-optimisation", destination: "/seo-services", permanent: true },
      { source: "/best-local-seo-services", destination: "/local-seo", permanent: true },
      { source: "/web-content-writing-request-quote", destination: "/book-a-consultation", permanent: true },
      // 16 Nov 2026 (client): the free consultation landing page is retired; bookings go through the booking page.
      { source: "/omh-free-consultation", destination: "/book-a-consultation", permanent: true },
      // 17 Nov 2026 (client): booking and contact are two pages. /contact was the booking page; it moved to
      // /book-a-consultation and /contact-us is the Contact Us page again. The quote forms and questionnaires that
      // only a button linked to were removed; their URLs go to the booking page.
      { source: "/contact", destination: "/contact-us", permanent: true },
      ...["ppc-request-quote", "seo-request-quote", "wordpress-development-request-quote", "wordpress-website-maintenance-request-quote",
        "social-media-paid-marketing-request-quote", "facebook-paid-ads-questionnaire", "new-website-development-quotation-questionnaire",
        "website-redesign-project-questionnaire"].map((slug) => ({ source: `/${slug}`, destination: "/book-a-consultation", permanent: true })),
      // Search Console 404s (20 Oct 2026): old WordPress URLs still indexed. Each goes to its closest live page.
      { source: "/all-services-price-list", destination: "/pricing", permanent: true },
      { source: "/website-maintenance", destination: "/wordpress-website-maintenance", permanent: true },
      // 22 Nov 2026: posts live at /<slug>, not /insights/<slug>; the old redirects here landed on "Coming soon".
      // /10-benefits-of-custom-wordpress-development-for-uk-business is a live post again (no redirect). These two
      // have no post of their own, so they go to the nearest one; the /insights/ copies cover browsers that cached
      // the old 308.
      ...["", "/insights"].flatMap((prefix) => [
        {
          source: `${prefix}/advance-tips-to-increase-conversion-rate-in-email-marketing`,
          destination: "/ai-powered-email-marketing-personalisation-at-scale-for-higher-conversions",
          permanent: true,
        },
        {
          source: `${prefix}/best-content-delivery-network-cdn-providers`,
          destination: "/best-content-delivery-network-providers",
          permanent: true,
        },
      ]),
      // The old WordPress theme's files (greate, greate-child). Only themes: /wp-content/uploads may still be
      // referenced by imported images (see images.remotePatterns above).
      { source: "/wp-content/themes/:path*", destination: "/", permanent: true },
      // Client URL structure, 21 Oct 2026: dentists, healthcare and builders-construction.
      { source: "/ai-voice-agents/dental-clinics", destination: "/ai-voice-agents/dentists", permanent: true },
      { source: "/ai-voice-agents/dental-clinics/:city", destination: "/ai-voice-agents/dentists/:city", permanent: true },
      { source: "/ai-voice-agents/clinics-healthcare", destination: "/ai-voice-agents/healthcare", permanent: true },
      { source: "/ai-voice-agents/clinics-healthcare/:city", destination: "/ai-voice-agents/healthcare/:city", permanent: true },
      { source: "/ai-voice-agents/contractors-builders", destination: "/ai-voice-agents/builders-construction", permanent: true },
      { source: "/ai-voice-agents/contractors-builders/:city", destination: "/ai-voice-agents/builders-construction/:city", permanent: true },
      { source: "/ai-voice-agents/dental-clinics-v2", destination: "/ai-voice-agents/dentists-v2", permanent: true },
      // SEO brief v2 §4.3: the sample call recording was renamed; the frozen oldv3 copy still uses the old name.
      { source: "/audio/Realest%20voice%20agent.m4a", destination: "/audio/estate-agency-sample-call.mp3", permanent: true },
      { source: "/audio/estate-agency-sample-call.m4a", destination: "/audio/estate-agency-sample-call.mp3", permanent: true },
      // SEO brief v2 §4.6 (21 Oct 2026): back to UK wording. This reverses the 20 Oct move to "real-estate-letting-agents".
      { source: "/ai-voice-agents/real-estate-letting-agents", destination: "/ai-voice-agents/estate-letting-agents", permanent: true },
      {
        source: "/ai-voice-agents/real-estate-letting-agents/:city",
        destination: "/ai-voice-agents/estate-letting-agents/:city",
        permanent: true,
      },
    ];
  },
  // /insights/<post> shows the post (its canonical is /<post>) instead of "Coming soon". A rewrite, not a redirect:
  // browsers that cached the old /<post> -> /insights/<post> 308 would loop on a redirect back.
  async rewrites() {
    return [{ source: "/insights/:slug", destination: "/:slug" }];
  },
};

export default nextConfig;
