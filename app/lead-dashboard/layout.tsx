import type { Metadata } from "next";
import { Inter, Geist, JetBrains_Mono } from "next/font/google";

/* Not public. It is excluded from robots.ts, it is not in the sitemap because
   that is derived from readyPages, and nothing on the site links to it.

   Unlisted is not the same as protected, so proxy.ts puts a password in front
   of /dashboard as soon as one is configured, and the handover reply box
   refuses to send until it is. See lib/dashboard/auth.ts. */
export const metadata: Metadata = {
  title: "Client dashboard | Online Marketing Help",
  robots: { index: false, follow: false, nocache: true },
};

/* The Ecomsixx dashboard's three faces (plan 016): Inter for everything,
   Geist for headings and figures, JetBrains Mono for the small uppercase
   labels. Loaded here, so the marketing site never downloads them. */
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${geist.variable} ${mono.variable}`}>
      {/* The dashboard sits inside the site's root layout, so it inherited the
          marketing header, the full footer and the floating "Ask the
          assistant" button, which covered the calls table. This hides every
          top-level sibling of <main> while a dashboard page is mounted. The
          skip link and the analytics scripts stay. */}
      <style>{`
        body:has(#omh-dashboard) > *:not(main):not(script):not(a[href="#main"]) {
          display: none !important;
        }

        /* ===============================================================
           The Ecomsixx dashboard's design system, in OHM's brand colour.
           docs/engineering/016-dashboard-in-the-ecomsixx-design/plan.md.

           Measured from the running Ecomsixx dashboard and its
           styles/globals.css. Only the brand family is swapped: purple
           #5b0dd5 for OHM bronze #7d5c33, its lavender tints for bronze
           tints, and the purple-tinted shadows for bronze-tinted ones.

           Scoped to #omh-dashboard, so none of it reaches the public site.
           And pinned light: the site's own tokens follow the OS into dark,
           Ecomsixx's dashboard does not, so the values are set here, on the
           element, where they win over :root for everything inside.
           =============================================================== */
        #omh-dashboard {
          color-scheme: light;
          /* Ecomsixx's body is 16px; the website's is 18px and was being
             inherited by any text without a size of its own. */
          font-size: 16px;
          line-height: 1.5;

          /* The fonts every existing font-sans / font-body class uses,
             pointed at Inter here and nowhere else. */
          --font-instrument: var(--font-inter);
          --font-source-sans: var(--font-inter);
          /* And the two the site's base rules read. A custom property is
             resolved where it is declared, so --font-body arrives from :root
             already fixed to Source Sans; redefining the inner variable
             alone left 137 elements in the old face. */
          --font-body: var(--font-inter), system-ui, sans-serif;
          --font-sans: var(--font-inter), system-ui, sans-serif;

          /* The site's colour roles, as Ecomsixx uses them. */
          --color-ink: #141416;
          --color-muted: #52525b;
          --color-line: #e7e2db;
          /* The soft tint behind callouts, icon tiles and quiet rows
             (68 uses). Not white: as white they disappeared. Ecomsixx's
             equivalent is its pale brand tint. */
          --color-warm: #faf8f5;
          --color-surface: #ffffff;
          --color-soft: #f3eee7;
          --color-soft-dark: #e9e0d3;
          --color-inverse: #1c140b;
          --color-oninverse: #ffffff;
          --color-amber-deep: #7d5c33;
          --dash-accent-text: #7d5c33;

          /* Ecomsixx's --nx-* tokens, bronze. */
          --nx-brand: #7d5c33;
          --nx-brand-text: #7d5c33;
          --nx-brand-deep: #5e4526;
          --nx-brand-bright: #d2b48c;
          --nx-ink: #1c140b;
          --nx-ink-70: rgb(20 20 22 / 0.70);
          --nx-ink-45: rgb(20 20 22 / 0.45);
          --nx-muted: #52525b;
          --nx-line: #e7e2db;
          --nx-tint: #faf8f5;
          --nx-warm: #f3eee7;
          --nx-ok: #047857;
          --nx-shadow-card:
            rgb(28 20 11 / 0.060) 0 0 0 1px,
            rgb(94 69 38 / 0.040) 0 1px 2px 0,
            rgb(94 69 38 / 0.050) 0 3px 6px 0,
            rgb(94 69 38 / 0.060) 0 8px 16px 0;
          --nx-shadow-lift:
            rgb(28 20 11 / 0.060) 0 0 0 1px,
            rgb(94 69 38 / 0.040) 0 2px 4px 0,
            rgb(94 69 38 / 0.055) 0 6px 12px 0,
            rgb(94 69 38 / 0.080) 0 16px 32px 0;
          --nx-ease: cubic-bezier(0.2, 0.8, 0.2, 1);

          /* The older shadow names the screens use, now Ecomsixx's. */
          --e1: var(--nx-shadow-card);
          --e2: var(--nx-shadow-card);
          --e3: var(--nx-shadow-lift);
          --ring-inset: inset 0 0 0 0 transparent;

          background: #ffffff;
          color: #141416;
          font-family: var(--font-inter), system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Headings are Geist 500 with a tight track, as in Ecomsixx. */
        #omh-dashboard h1, #omh-dashboard h2, #omh-dashboard h3 {
          font-family: var(--font-geist), var(--font-inter), system-ui, sans-serif;
          font-weight: 500;
          letter-spacing: -0.01em;
        }

        /* ---- helpers, copied from Ecomsixx's globals ---------------- */
        #omh-dashboard .tnum { font-variant-numeric: tabular-nums; }
        #omh-dashboard .dash-focus:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgb(125 92 51 / 0.22);
        }
        @keyframes dash-skel { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        #omh-dashboard .dash-skel {
          border-radius: 6px;
          background: #f3eee7;
          animation: dash-skel 1.4s ease-in-out infinite;
        }
        #omh-dashboard .nx-canvas-grid {
          background-color: #ffffff;
          background-image: radial-gradient(circle, rgba(20, 20, 22, 0.10) 1px, transparent 1.3px);
          background-size: 16px 16px;
        }
        #omh-dashboard .nx-canvas-scroll { scrollbar-width: thin; }
        #omh-dashboard .dash-kbd {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 4px; border-radius: 5px;
          font-family: var(--font-jetbrains), ui-monospace, monospace; font-size: 10.5px;
          color: #52525b; background: #ffffff; box-shadow: inset 0 0 0 1px rgb(20 20 22 / 0.12);
        }

        /* The sidebar item, measured: 13px, 6px radius, 6px 8px padding. */
        #omh-dashboard .dash-nav {
          display: flex; align-items: center; gap: 10px;
          border-radius: 6px; padding: 6px 8px;
          font-size: 13px; font-weight: 400; color: #141416; position: relative;
          transition: color .18s ease-out, background-color .18s ease-out;
        }
        #omh-dashboard .dash-nav svg { color: #8f8578; width: 15px; height: 15px; flex-shrink: 0; }
        #omh-dashboard .dash-nav:hover { background: #faf8f5; }
        #omh-dashboard .dash-nav-active { font-weight: 500; background: #f3eee7; }
        #omh-dashboard .dash-nav-active svg { color: #7d5c33; }
        #omh-dashboard .dash-count {
          display: inline-flex; min-width: 18px; height: 17px; align-items: center; justify-content: center;
          border-radius: 6px; padding: 0 6px; font-size: 10.5px; font-weight: 500;
          font-variant-numeric: tabular-nums; line-height: 1;
          background: #f3eee7; color: #7d5c33;
        }
        #omh-dashboard .dash-count-urgent { background: #7d5c33; color: #ffffff; }
        #omh-dashboard .dash-eyebrow {
          font-family: var(--font-jetbrains), ui-monospace, monospace;
          font-size: 10.5px; text-transform: uppercase; letter-spacing: .14em; color: #52525b;
        }

        /* A view arrives with a short rise (Ecomsixx's nx-view-in), once,
           on first paint; never on a hover or an update. */
        @keyframes nx-view-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        #omh-dashboard .nx-view-in,
        #omh-dashboard [data-rise] {
          animation: nx-view-in .26s cubic-bezier(.2, .8, .2, 1) both;
          animation-delay: calc(var(--i, 0) * 24ms);
        }

        /* Anyone who has asked their system not to animate things gets the
           finished state immediately. Not a shorter animation: none. */
        @media (prefers-reduced-motion: reduce) {
          #omh-dashboard .nx-view-in, #omh-dashboard [data-rise], #omh-dashboard .dash-skel { animation: none; }
          #omh-dashboard * {
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
