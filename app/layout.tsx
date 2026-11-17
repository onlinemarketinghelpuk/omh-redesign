import type { Metadata } from "next";
import { Instrument_Sans, Source_Sans_3 } from "next/font/google";
import { draftMode, headers } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollTop } from "@/components/layout/ScrollTop";
import { SiteBreadcrumbs } from "@/components/layout/SiteBreadcrumbs";
import { SiteAssistant } from "@/components/layout/SiteAssistant";
import { getSearchIndex } from "@/lib/content/search-index";
import { JsonLd, SITE, organisation, website } from "@/lib/schema";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Online Marketing Help | UK digital marketing & web development agency",
    template: "%s | Online Marketing Help",
  },
  alternates: { canonical: "https://onlinemarketinghelp.co.uk/" },
  // Large preview card; the image itself comes from app/twitter-image.tsx.
  twitter: { card: "summary_large_image" },
  description:
    "We help UK service businesses and ecommerce brands grow through Google Ads, Meta Ads, SEO, and conversion-focused websites, supported by clear reporting and reliable tracking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* The dashboard is an internal tool: no site analytics on it. Set by
     proxy.ts, which already knows which requests those are. */
  const isDashboard = (await headers()).get("x-omh-dashboard") === "1";

  const searchEntries = await getSearchIndex();

  return (
    <html
      lang="en-GB"
      className={`${instrument.variable} ${sourceSans.variable} h-full antialiased`}
      // The voice pages give <html> smooth scrolling. This tells Next to turn it off while it resets the scroll on a
      // page change; without it the reset animated and the new page could land on the demo form (17 Nov 2026).
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Google Tag Manager, loaded on the visitor's first interaction or 3.5s after the page loads,
            whichever comes first (PageSpeed, 21 Oct 2026: GTM and the tags it pulls in were ~900ms of
            main-thread blocking and ~500 KiB on mobile). dataLayer exists from the start, so events pushed
            before GTM arrives are queued, not lost. Trade-off: a visitor who leaves within ~3s without
            touching the page is not recorded. */}
        {/* Public pages only, for the same reason as Plerdy below and one
            more that matters more.

            Gating Plerdy stopped the hydration error. This one was still
            loading on every dashboard page and reporting a page_view to
            Google Tag Manager, which means the client's own tag account was
            being told the URL of each screen somebody opened. Those URLs
            carry a session id and a campaign id, so a conversation with a
            named member of the public was leaving the building in the query
            string of a marketing pixel. Nothing about an internal tool
            belongs in the site's advertising measurement either way: it is
            not a visitor, and counting it inflates every figure the client
            pays attention to. */}
        {!isDashboard && (
        /* eslint-disable-next-line @next/next/next-script-for-ga */
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,i){w.dataLayer=w.dataLayer||[];var done=0,ev=["pointerdown","keydown","touchstart","scroll","wheel"];
function load(){if(done)return;done=1;ev.forEach(function(e){w.removeEventListener(e,load,true)});
w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var j=d.createElement('script');j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i;d.head.appendChild(j)}
ev.forEach(function(e){w.addEventListener(e,load,{capture:true,passive:true,once:true})});
function later(){setTimeout(load,3500)}if(d.readyState==='complete')later();else w.addEventListener('load',later)})(window,document,'GTM-WWSXTPH');`,
          }}
        />
        )}
        {/* Runs before first paint: sets the theme so the page never flashes the
            wrong one, and marks that JS is alive so scroll reveals may hide
            content. Without it, a failed script would leave .rv invisible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=document.documentElement,s=localStorage.getItem("omh-theme");r.dataset.theme=s==="dark"||s==="light"?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");r.dataset.js="1"}catch(e){}`,
          }}
        />
        {/* Section joins (client, 17 Nov 2026): a section with the same colour as the one above it gets data-join and
            drops its top spacing (globals.css), so two white sections are one gap apart, not two. Colours differ
            between the themes, so it runs in a frame callback (always before paint, so nothing moves) after any
            DOM change or theme switch. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(d){var q=0;function bg(e){for(;e;e=e.parentElement){var c=getComputedStyle(e).backgroundColor;if(c!=="rgba(0, 0, 0, 0)"&&c!=="transparent")return c}return""}
function run(){q=0;var m=d.getElementById("main");if(!m)return;var pc=null;m.querySelectorAll("section").forEach(function(s){if(s.parentElement.closest("section")||getComputedStyle(s).display==="none")return;var c=bg(s);if(c===pc)s.setAttribute("data-join","");else s.removeAttribute("data-join");pc=c})}
function go(){if(!q){q=1;requestAnimationFrame(run)}}
new MutationObserver(go).observe(d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["data-theme"]});addEventListener("resize",go);go()})(document);`,
          }}
        />
      </head>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before
          React loads; this only silences that one-level attribute mismatch. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <JsonLd data={[organisation, website]} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-teal focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Header searchEntries={searchEntries} />
        <main id="main" className="relative flex-1">
          <SiteBreadcrumbs />
          {children}
        </main>
        <Footer />
        <ScrollTop />
        {/* The public chat and voice assistant. Not on the dashboard: it is
            the thing the dashboard REPORTS ON, and mounting it there means
            the launcher sits over the bottom-left of every screen covering
            whatever is under it. Its webhooks only accept the public domain
            in any case, so pressing it from an internal tool fails. */}
        {!isDashboard && <SiteAssistant />}
        {/* Draft preview only: connects the page to the Studio's Presentation tool so edits show as you type. */}
        {(await draftMode()).isEnabled && <VisualEditing />}
        {/* Plerdy heatmaps and session tracking (site ID 82582), as supplied
            by Plerdy. Public pages only: its script writes attributes into
            the DOM before React hydrates, which broke every dashboard page,
            and heatmapping an internal tool was never the point of it. */}
        {!isDashboard && (
        <script
          data-plerdy_code="1"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d){if(w.__plerdyCode)return;w.__plerdyCode=1;
w._protocol=w.location.protocol=="https:"?"https://":"http://";
w._site_hash_code="0eb2c6d30f5cb5b16b2df3bebdd85de7";w._suid=82582;
var s=d.createElement("script");s.async=true;s.referrerPolicy="strict-origin-when-cross-origin";
s.src="https://d.plerdy.com/public/js/click/main.js?v="+Math.random();d.head.appendChild(s)})(window,document);`,
          }}
        />
        )}
      </body>
    </html>
  );
}
