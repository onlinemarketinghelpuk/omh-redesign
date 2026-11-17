# Section spacing and lines: plan (17 Nov 2026)

Client request (screenshots of /local-seo, /seo-services, /website-designs, home): spacing between sections is
inconsistent, and lines run between and inside sections. Remove the lines from the whole site, give every section on
every page the same space above and below its content, and change repetitive headings where needed.

## What the census found

`node scripts/responsive-audit.mjs rhythm` (new mode) measures every top-level section on all 52 code-built pages at
1440px and 390px: the visible gap above the first content and below the last, the section's own borders, and every
line drawn inside it. Baseline in `audit/rhythm-before`.

- 557 sections. 219 have a border line on their top or bottom edge (the lines between sections).
- 117 decorative label lines: the hairline that runs right from a band label ("LOCAL SEO BENEFITS ——"), the centred
  and "topline" label styles, and the home page's label lines.
- More decorative rules on blocks inside sections: above the hero stats, above the review proof, the SEO claims strip
  (with vertical dividers), above notes and footnotes, the home hero stats.
- The space above content comes in 26 different sizes at 1440px (40 to 144px): `section-md` 104, home 115-128,
  Solutions `section-lg` 144, voice pages 80, heroes 80/88, and others.
- 99 sections have a different gap below their content than above it (more than 12px apart), mostly because the last
  element adds its own padding or margin (list rows, collages, asides).

## Decisions (defaults; one token changes the number site-wide)

1. **One section spacing.** Every band on every page, heroes included, uses one value top and bottom:
   `--section-y: clamp(48px, 34.667px + 4.1667vw, 88px)` (48px on a 320px phone, 88px from 1280px). The old
   `section-sm/md/lg/hero` utilities, the home page's own paddings, the voice pages' `py-14 lg:py-20` and
   `.v4l .section`, and the custom paddings on Pricing, the booking and contact pages and Get More Leads all point at it.
   Two light sections are then 176px apart on desktop (today 208-288px) and 96px on phones.
2. **Equal above and below.** The visible gap under a section's last content equals the gap above its first content
   (within 8px): trailing padding and margins inside sections are removed where the census shows them.
3. **No lines between sections.** All section top and bottom borders go, including the hero's bottom border and the
   white band's border in `ServiceBand`. Light sections separate by spacing; black sections by their colour.
4. **No decorative lines.** Label hairlines go (labels keep their dash, dot or pill). Decorative rules on blocks go:
   hero stats, review proof, the SEO claims strip and its dividers, notes and footnotes, the home hero stats.
   **Kept**, because they are part of a component rather than decoration: card outlines, table rows, FAQ and
   accordion rows, the dividers between rows of one list, form fields and buttons. (Say if those should go too.)
5. **One label per section, everywhere.** Where a band label and a second small-caps kicker sit above the same title
   ("WHO THIS IS FOR" then "A USEFUL STARTING POINT"), only the band label stays, as already on phones.
6. **Not changed:** the sticky header's bottom border and the footer (they are not sections), the legal pages'
   sub-sections (paragraph groups inside one article), and colours.

## Order

1. Token and shared frames: `--section-y`, `ServiceBand` (padding, no border, label lines), `PageHero`,
   `SectionHeader` (kicker), `FinalCta`, `BookDemo`.
2. Hand-built sections: home, Solutions template, About, FAQ, Warranty, Website Designs, Pricing, booking, Contact Us,
   Get More Leads, Insights hub and article, case-study templates.
3. Voice pages (16), AI Services: CSS in the unlayered block of `app/ai-voice-agents/voice-agents.css`.
4. Decorative rules inside sections, then the uneven sections from the census.
5. Verify: census budgets below, `npm run audit:responsive` with nothing worse, before/after screenshots.

## Budgets (census, 1440px and 390px)

| Check | Before | Target |
|---|---|---|
| Sections with a top/bottom border | 219 | 0 |
| Decorative label lines | 117 | 0 |
| Distinct section paddings (space above content) | 26 | 1 (plus headings' own line height) |
| Sections with top and bottom gaps more than 12px apart | 99 | 0, except deliberate overlaps (listed) |

## Progress (17 Nov 2026)

Done in one pass (steps 1-4):

- `--section-y` in `app/globals.css`; `section-sm/md/lg` and the hero paddings all read it. Home, Solutions,
  Pricing, booking, Contact Us and Get More Leads paddings moved onto it; voice bands get it from one CSS rule
  (`voice-agents.css`, unlayered block) that also zeroes their inner container padding and band borders.
- 51 section borders removed (script over `app/` and `components/`; pricing tier rows kept). `ServiceBand`: white
  band border and the label hairlines gone. `BookDemo` strip border gone.
- Decorative rules removed: hero stats, review proof, SEO claims strip and dividers, final CTA note, social notes,
  home hero stats, testimonial controls, Solutions hero points and outcome strips, the "You may also be trying to"
  rule, About stats and tab panel, booking page contact list, Website Designs quote and gallery hairlines, Insights
  hero and "Featured insight" hairline, article sidebar rules, voice hero stat strips and lead-demo facts.
- `SectionHeader` kicker shown only where a page asks for it (`kickerOnPhones`): one label per section.
- Uneven bands fixed: home Instagram carousel (40px extra padding below), Warranty two-column text (last
  paragraph margin), AI Services comparison cards on phones (last card margin), London voice heroes on phones
  (floating call card now has room under the photo).
- Census items checked by hand and left: background glows at the top of dark voice bands, hover-scroll crops
  inside clipped frames (Website Designs), the sticky service menu on /pricing, the 404 digits' leading, the
  Insights topic bar at the top of the archive band.
- Home and Get More Leads stats strips: now a normal band (`section-md`), figures on a gap, no dividers.

Results (census `audit/rhythm-after3` + `rhythm-after4`, 52 pages, /design-system and legal sub-sections left out):
bordered sections 219 -> 0; label hairlines 117 -> 0; space above content 88px at 1440 (85-95 where a heading's
own line height adds a few px) and 51px at 390; uneven sections 99 -> 0 real. Full `audit:responsive` beside
`final-audit-3`: nothing worse (0 sideways scroll, 0 spilled text at every width); distinct section paddings per
width 11-18 -> 4. Before/after sheets in `audit/sr-sheets`.
