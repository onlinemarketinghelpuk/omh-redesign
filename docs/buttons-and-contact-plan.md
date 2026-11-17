# Buttons, booking and contact: plan (17 Nov 2026)

Client request: only two button styles site-wide (primary, secondary), page designs otherwise unchanged;
a separate Contact Us page under Company; "Book a Growth Consultation" and "Contact Us" go to different
pages; no two side-by-side buttons go to the same page; remove pages that are reachable only from a button.

## What the audit found (crawl of 153 pages at 1280px, local build)

- **28 distinct button looks**, of which 12 are real call-to-action buttons (the rest are filter chips and cards):
  brown filled in 4 paddings (16/28, 12/18, 12/14 header, 16/24 forms), white filled on dark in 2 paddings,
  black outline, white ghost outline in 2 paddings, and the AI voice pages' own `.btn` set (17px, Instrument Sans,
  11/22 padding, grey outline). Arrows appear on some and not others.
- **Every booking and contact button goes to `/contact`** (446 links), and `/contact-us` redirects there.
- **Side-by-side buttons going to the same page:** home closing band (Book a Growth Consultation + Send a Project
  Brief), every page that uses the shared closing band with a second button (it defaults both to `/contact`),
  /website-designs, /local-seo, /pricing, /seo-services, /ecommerce-seo-services.
- **Broken button:** home hero "View Client Results" points to `#proof`, a section hidden while case studies are
  unpublished, so the click does nothing.

## Decisions

1. **Two pages, two URLs.**
   - `/book-a-consultation`: "Book a Growth Consultation". The current `/contact` page moves here unchanged
     (same layout, form and copy); only its label, page title and breadcrumb say "Book a Growth Consultation".
   - `/contact-us`: new **Contact Us** page in the Company menu: phone, email, address, socials and a short
     general message form (name, email, phone, subject, message). Its own layout.
   - `/contact` redirects permanently to `/contact-us`. Old consultation URLs redirect to `/book-a-consultation`.
   - One constant each in `lib/content/nav.ts` (`BOOKING_HREF`, `CONTACT_HREF`); no page types a URL by hand.
2. **Which button goes where.**
   - Booking (`/book-a-consultation`): Book…, Discuss…, Request a … review or quote, Claim/Get … audit,
     Help me choose, Talk through your goals, every pricing-package button.
   - Contact (`/contact-us`): Contact, Get in touch, Talk to us, Send a … brief, Start a project, Talk to the team.
   - A pair of buttons never shares a page: primary books, secondary contacts (or has its own real target).
   - In-page form anchors stay (voice pages `#book-demo-form`, solutions `#enquire`): they are on the same page.
   - "View Client Results" points to the client reviews section while case studies are hidden.
3. **Two button styles, defined once.** `.btn-primary` and `.btn-secondary` in `app/globals.css`, used by
   `Button`, every form submit button and the voice pages' `.btn` classes.
   - Primary: brown fill, white text, 10px radius, 18px semibold, 16/28 padding, arrow. Same on light and dark
     grounds (the white-filled button on black goes).
   - Secondary: transparent, 1.5px outline in the text colour (black on light grounds, white on dark), same size,
     radius, font and arrow.
   - `Button` keeps only `variant="primary" | "secondary"`; `inverse` and `ghost-white` are removed, and every
     button shows the arrow. One size; the header button keeps a tighter padding only if the full size breaks the
     header bar.
   - Filter chips, tabs, cards and text links are not buttons and stay as they are.
4. **Remove pages reachable only from a button** (route, form data and links deleted; each URL redirects
   permanently to `/book-a-consultation`):

   | Page | Only linked from |
   | --- | --- |
   | /ppc-request-quote | Google Ads "Send a Campaign Brief", Amazon PPC "Send an Account Brief" |
   | /seo-request-quote | Local SEO "Discuss Local SEO Services" |
   | /wordpress-development-request-quote | WordPress "Start a project", "Send a Website Brief"; Website Designs "Request a Website Quote" |
   | /wordpress-website-maintenance-request-quote | Maintenance "Send a Website Brief" |
   | /social-media-paid-marketing-request-quote | Paid Social "Request a Paid Social Quote", Instagram "Request an Instagram Ads Quote" |
   | /facebook-paid-ads-questionnaire | Facebook "Start the Facebook Ads Questionnaire" |
   | /new-website-development-quotation-questionnaire | Shopify "Send a Store Brief" (+ two thank-you pages) |
   | /website-redesign-project-questionnaire | two thank-you pages only |

5. **Kept, listed for the client** (not linked from any button, so outside this request):
   - Thank-you pages (form or Calendly destinations, possible Google Ads conversion URLs): /calendly-thank-you,
     /contact-us-thank-you, /local-seo-thank-you, /quotation-questionnaire-thank-you,
     /search-engine-optimisation-thank-you, /subscription-thank-you, /wordpress-development-thank-you,
     /wordpress-maintenance-thank-you-page. After step 4 no form on the site sends anyone to them.
   - /get-more-leads (Free Growth Review ad landing page, linked from nothing on the site).
   - /home-2, /ai-voice-agents-old, -oldv2, -oldv3 (backups), /design-system (internal), /lead-dashboard (private).

## Result (17 Nov 2026, crawl of 136 pages on the new build)

- CTA looks: 2 (brown primary; outline secondary, black on light grounds and white on dark). The header button
  keeps its tighter padding (12/18) to fit the bar; one voice-page "Route" button keeps `!px-5`.
- 397 buttons go to `/book-a-consultation`, 22 to `/contact-us`. No two buttons in one call-to-action group go
  to the same page (pricing cards still each have their own "Discuss …" button, one per card).
- No dead in-page anchors. "View Client Results" goes to the client reviews (`#reviews`) while case studies are
  hidden. No overflow at 390px or 1024px on any page.
- Decision 1 note: links are literal paths in content files (no shared constant); the crawl is the check.
- Blog posts (Sanity, 17 Nov 2026, client OK): the 13 booking-intent links in 8 posts now point to
  `https://onlinemarketinghelp.co.uk/book-a-consultation` (transaction lwH2qhRJEDBeqXDBeR0eCQ). Backups:
  `D:\omh-backups\production-2026-11-17-before-booking-links.tar.gz`, `enquiries-…` and the 8 posts as JSON in
  `D:\omh-backups\posts-before-booking-links-2026-11-17`. The 7 contact-intent post links ("get in touch",
  "contact us", "send us a message"…) still say `/contact` and reach Contact Us through the redirect.

## Order of work

1. Contact Us page + booking page move + redirects + menu, breadcrumbs, sitemap, search.
2. Re-point every button by the rules in decision 2; fix the shared closing band default and the home hero.
3. Global `.btn-primary` / `.btn-secondary`; `Button`, forms and voice CSS on them.
4. Delete the 8 button-only pages and their form code; redirects.
5. Build, re-run the crawl (expect 2 looks, no same-page pairs, no dead anchors), screenshots at 1280 and 390.
