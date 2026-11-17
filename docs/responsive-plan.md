# OMH site: responsive rebuild and shared section components

Approved by the user 16 Nov 2026. Working copy `D:\claude\omh\site`, branch `main` (plan written at `c5041aa`).
Progress is logged in section 9 at the end of this file; update it after every phase.

Tools (Phase 0):

```bash
npm run build && npx next start -p 3111                                      # audits run against a production server
npm run audit:responsive -- --out ../audit/<name> --compare ../audit/baseline-2026-11-16/summary.json
node scripts/responsive-audit.mjs rects --out ../audit/<name>-rects          # desktop element positions + page text
node scripts/responsive-audit.mjs diff-rects ../audit/baseline-2026-11-16-rects ../audit/<name>-rects
npm run check:design                                                         # one-off classes may only go down
```

Audit output lives in `D:\claude\omh\audit\` (outside the repo). In Git Bash, `--pages /a,/b` works (the script undoes Git Bash's path rewriting).

## 1. Context

The client reported "lots and lots of issues" on tablet and mobile (section spacing, font size, text width) and asked for every section of every page to be rechecked on every device, with repeated sections turned into global components so the site is easy to develop, debug and scale.

Before planning I measured 58 page templates (every code-built page, 4 blog posts, 2 hidden voice city pages, a thank-you page, the 404) at 12 widths from 320px to 1280px in a real browser, took full-page screenshots of four pages at 390px and 820px, ran a code survey, and had the approach reviewed independently. The problems are real and come from four root causes, so the plan fixes causes first and pages second.

Caveat on the numbers: the widths were measured in frames with a 15px scrollbar, so the layout was 15px narrower than the label (the "390px" run is a 375px layout). Counts are a baseline for direction, not exact; Phase 0 re-takes them at true device widths. Some counts are overstated (the one-column grid count includes FAQ lists and form stacks; small-text and tap-target counts include mock-up UI).

### Root causes (measured)

1. **There is no tablet layout.** The React pages are desktop-first with two states: the full 12-column desktop from 1024px, and one stacked column below it.
   - 768-912px: up to 100-122 one-column grids 600px+ wide, on 39 of 58 pages (a phone layout stretched across a tablet). The Google Ads hero is 1.22 screens tall at 820px.
   - 1024-1279px: the desktop grid arrives too early. 115 squeezed text blocks on 32 pages at 1024px (a 41px `h2` in a 278px column); `h1` text runs outside its column on 5 form pages (474px of text in a 359px box, and probably still at 1280px).
   - Some grids never step down: Related Services stays 3-up at 820px with 183px-wide text.
2. **Type is not on a scale.** 39 computed font sizes at 390px, 53 at 1280px. `h3` has 13-16 sizes; `h2` is 32px on 405 headings but 24px on 79. Body text is 18px on the main site and 16px on the voice pages (23% of all text). 370 one-off `text-[Npx]` classes in React pages, about 5,000 in voice templates, 40 one-off `clamp()` sizes. The display size bottoms out at 42px: `h1` takes 6 lines on 7 pages and text boxes spill at the smallest phones.
3. **Spacing is not on a scale.** 11-13 different section paddings site-wide (65, 56, 80, 48, 81, 64, 72... on phones). A voice page uses 4-5. Inside sections: header-to-content gaps of `mt-6/8/10/11/12/14`, card padding `p-6` to `p-10`, grid gaps of 4/5/6.
4. **The same section is written many times, each slightly differently.** 10 near-identical page heroes; about 40 hand-written section headers that bypass the existing `ServiceSectionIntro`; the comparison table plus mobile cards copied in 5 files (about 160 lines each) with different widths and paddings; about 20 numbered card grids that collapse at different breakpoints; a byte-identical problem list in 4 files; 25 check-list rows; 28 class combinations for the small-caps label; 91 `grid-cols-12 ... max-lg:block` rows. Three files hold whole sections as single 1,000-2,300 character lines.

### Other measured problems

- Phones: a typical page is 27 screens long (longest 41). Small-caps labels wrap to 3 lines; sections show two labels above the title.
- Floating UI on phones: scroll-to-top, the assistant pill and (16 voice pages) a 75px sticky bar overlap content and each other. In landscape, header plus bar take about 160 of 390px.
- About 34 controls under 40px per page on phones (footer links 28-33px tall, carousel dots 6px, one 28px form input).
- Sideways scroll: `/cookies` (+64px on phones), the header row is 8px too wide at 320px on every page, one quote form at the smallest width. Everything else already fits.

Corrected during review: the voice pages already use the site's container and gutter. Some voice sections start 16px left of it; that is something bleeding out of the container, to be traced in Phase 4, not a second gutter system.

### Decisions made by the user (16 Nov 2026)

| Topic | Decision |
|---|---|
| Phone page length | Collapse long lists on phones behind "Show all"; nothing removed; tablet and desktop stay expanded |
| Voice pages | Fix now (spacing, type, tablet layout, floating UI); merging the 12 templates is a separate later phase |
| Labels on phones | One label per section below 640px (keep the band label, hide the duplicate kicker); two lines at most |
| Voice body text | 18px everywhere |

## 2. Target system

### 2.1 Tiers

Tailwind's defaults plus one new breakpoint, `wide` (1152px). Responsive rules live inside the shared components, written mobile-first; page files stop carrying breakpoint classes for layout.

| Tier | Width | Rule |
|---|---|---|
| Phone | under 640px | One column. One label. Long lists collapsed. Must work at 320px. |
| Tablet | 640-1023px | Card grids 2-up (an odd last card spans both). 6/6 text-and-media rows side by side from 768px. Hero: copy full width, then media and proof two-up. Comparison tables shown as 2-up cards. |
| Laptop | 1024-1279px | 7/5 and 5/7 rows side by side. 4/8 sticky-intro rows stay stacked until 1152px. Rule: a column must be at least 20rem wide before a row goes side by side. |
| Desktop | 1280px and up | The approved look. Element positions must not move (checked by measurement), except the changes listed in 2.4. |

Why viewport tiers and not container queries or auto-fit grids (reviewed): every band is full width, so container width is just the screen minus gutters; auto-fit cannot skip from 4 columns to 2, strands single cards, and makes the desktop column count depend on the scrollbar. Auto-fit wrapping is used only for rows of stats, chips, buttons and logos.

### 2.2 Global tokens (`app/globals.css`, single source)

```css
@theme { --breakpoint-wide: 72rem; }
:root {
  --gutter: clamp(20px, 8.4px + 3.09vw, 48px);              /* today's value, named once */
  --section-sm: clamp(40px, 26.67px + 4.167vw, 80px);
  --section-md: clamp(48px, 29.33px + 5.833vw, 104px);      /* phone 65 -> 52px; 104 at 1280 as today */
  --section-lg: clamp(64px, 37.33px + 8.333vw, 144px);
  --hero-pt: clamp(48px, 34px + 2.3vw, 80px);               /* the 10 one-off hero paddings */
  --hero-pb: clamp(56px, 38px + 2.9vw, 88px);
  --gap-header: clamp(1.75rem, 1.333rem + 2.083vw, 3rem);   /* replaces mt-10/11/12/14 and band mb-11 */
  --gap-block: clamp(1.25rem, 1rem + 1.25vw, 2rem);         /* replaces mt-6/8 */
  --gap-grid: clamp(1rem, .917rem + .417vw, 1.25rem);       /* replaces gap-4/5/6 */
  --card-pad: clamp(1.25rem, 1.083rem + .833vw, 1.75rem);   /* replaces p-6/7 */
  --card-pad-lg: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);  /* replaces p-8/9/10 */
}
@theme inline {
  --text-display: clamp(2.125rem, 1.333rem + 3.96vw, 4.5rem); /* 34 at 320, 37 at 390, 72 at 1280 */
  --text-h1: clamp(2rem, 1.417rem + 2.92vw, 3.75rem);
  --text-h2: clamp(1.75rem, 1.417rem + 1.667vw, 2.75rem);     /* phone 32 -> 29px */
  --text-h3: clamp(1.375rem, 1.208rem + .833vw, 1.875rem);
  --text-eyebrow: .875rem;  /* + line-height 1.4, letter-spacing .14em, weight 600 */
  --text-stat: clamp(2rem, 1.583rem + 2.08vw, 3.25rem);
  /* --spacing-gutter/header/block/grid/card -> utilities px-gutter, mt-header, gap-grid, p-card */
}
```

- `section-sm/md/lg` and a new `section-hero` utility read these variables; so do the voice `.section` rules, the home page's own `clamp()` paddings and PriceList's `py-12 sm:py-16`.
- Every clamp reaches today's value at 1280px, so desktop moves by under 0.2px. Phones get tighter sections and smaller headings; tablets land in between.
- Headings: `overflow-wrap: break-word` on `h1-h4`, hyphenation only at 360px and below, so a long word can never leave its box.
- A title in a narrow column drops to the `h3` size only while its row is side by side; stacked, it is a normal `h2`. This removes the 79 `h2`s that are 24px on phones.
- `@utility card` (border, radius, surface, `p-card`) instead of a Card component.
- `Split` is a utility pair that sizes the two tracks itself (no classes needed on children, so `Reveal` wrappers keep working) and reproduces today's `col-span` widths exactly.
- Floors: content text 14px minimum (decorative mock-up UI is tagged `data-mock`, exempt, 11px floor); 44px tap targets for buttons, nav, footer links, form and carousel controls.

### 2.3 Shared components (kept deliberately small)

| Component | File | Replaces |
|---|---|---|
| `ServiceBand` + `pad: sm, md, lg, hero` and one default tone | `components/services/ServiceBand.tsx` (existing) | the local `Band`/`SectionShell` wrappers in 4 files; hand-written `<section>` shells in Solution, About, Warranty, FAQ, ServiceMedia, RelatedServices, FinalCta. The label-wrapping fix is made here once. |
| `SectionHeader` (eyebrow, `h2` with accent, body, size, align) | `components/ui/SectionHeader.tsx`; `ServiceSectionIntro` stays as an alias | about 40 hand-written headers; hides the duplicate kicker on phones |
| `Split` (ratio, `from`, align, reverse, sticky) | `components/ui/Split.tsx` | 91 `grid-cols-12 ... max-lg:block` rows; internals of `ServiceFaqSection`, `ServiceProcessTimeline`, `FinalCta`, `Testimonials`, `ServiceMedia` showcases |
| `CardGrid` (cols 2, 3 or 4) | `components/ui/CardGrid.tsx` | every hand-set card grid, `RelatedServices`, `CaseStudies` |
| `NumberedList` (card or ruled, number or check marker, light or dark) | `components/ui/NumberedList.tsx` | about 20 numbered grids, the 4 identical problem lists, `ServiceReasonGrid` rows |
| `CheckList` | `components/services/ServicePrimitives.tsx` (beside `CheckIcon`) | 25 hand-written rows |
| `PageHero` (eyebrow, title, body, actions, stats, media, proof, ratio) | `components/ui/PageHero.tsx` | 10 service heroes; simpler heroes on Warranty, About, FAQ, Insights, Legal, PriceList |
| `PackageComparison` (table from `lg` or `xl`, cards below, plan-card mode, notes) | `components/services/PackageComparison.tsx` | 5 table-plus-cards copies, the plan cards on 6 pages, 6 note styles |
| `ShowMore` (phones only: first N rows, then "Show all") | `components/ui/ShowMore.tsx`, small client component | new |

Not extracted on purpose: a Card component (utility instead), ProblemList (a `NumberedList` variant), ProofBox (about 12 lines once `Split` exists), MediaShowcase (already in `ServiceMedia.tsx`; it adopts `Split`), StatBand (only two live copies).

Layout variety (client rule: no two pages share one layout) is kept. Pages keep their own `*Sections.tsx` files and arrangement; variety comes from ratio, reverse, sticky, column count, variant, tone and label style. The components share behaviour, not arrangement. The agreed exceptions stay (quote forms, the social family, legal pages).

`/design-system` (exists, internal, noindex) becomes the gallery: every component in every variant, checked at every width.

### 2.4 Visible desktop changes that need the client's OK

1. Voice pages: section padding moves onto the site scale; body text 16 to 18px (pages about 10% longer).
2. Home page: its own section paddings move onto the scale (a few px at 1280px and up).
3. In-section rhythm normalised (gaps move by up to 8px).
4. Quote-form `h1` gets smaller so it fits its column.
5. Open question, not changed until answered: small-caps labels are 14px on service pages but 18px on the home and voice pages. Both sizes stay as tokens for now.

**Decision, 17 Nov 2026 (user): small desktop shifts are allowed** so shared components carry one set of values:
same-purpose gaps unify (moves of up to 8px), one letter spacing for the small-caps labels (0.14em), one card
padding per card size, one price size. Columns, layout and content stay as approved. Every page that shifts gets
before/after screenshots; the desktop gate for migrated pages is `diff-rects --anchors` with the shifts listed.

## 3. Phases

Each phase is shippable alone, measured before and after, committed in small commits of my own files, and pushed only when the user says so.

### Phase 0: Guard rails (no visual change)
- `scripts/responsive-audit.mjs`: the measurement behind this plan, run through headless Chrome the way `scripts/page-shots.mjs` already does (no new dependency), at true device widths. Starting code: `%TEMP%\claude\e5d26ead7e589289\35754ed9-dfd8-43ce-85a2-1a66166e4663\scratchpad\responsive-measure.js`; if gone, rebuild from section 5. `npm run audit:responsive`, exits non-zero over budget.
- Desktop gate: `responsive-audit.mjs rects` dumps the position and size of every element in header, main and footer plus a hash of the page text; `diff-rects` compares two dumps. Positions must be identical within 0.5px at 1280, 1366, 1440 and 1920 unless the change is listed in 2.4, and the page text must not change. (Built into the audit script rather than `page-shots.mjs`, so there is one tool.)
- `scripts/check-design.mjs`: a ratchet on one-off classes (`text-[Npx]`, `text-[clamp(`, `py-[clamp(`, `max-lg:block`); counts may only go down.
- Baseline report, element dumps and screenshots (390, 820, 1280, 1440) for every template, stored outside git.
- Save this plan as `site/docs/responsive-plan.md` with a progress log; add "Responsive rules" to `site/docs/design-rules.md`.

### Phase 1: Tokens and confirmed bugs
- Tokens from 2.2 in `app/globals.css`, one group per commit (the file is shared with other committers).
- Bugs with a site-wide or obvious effect: `/cookies` sideways scroll; header row at 320px; quote-form `h1` spill; label wrapping in `ServiceBand` (its `rule` and `centered` hairlines have no minimum width); tap targets (footer and legal links, carousel dots and pause, the 28px input, logo link).
- Floating UI on phones: one stacking order (sticky bar, assistant pill above it, scroll-top above that), safe-area padding, sticky bar hidden when the screen is under 480px tall. The assistant pill's position is in `widget/web/embed/src/embed.js`, which another session owns: agree a CSS variable with them; do not edit their file unasked.

### Phase 2: Existing shared components, then the new primitives
- First put the tokens into components that already exist (`ServiceBand`, `ServiceSectionIntro`, `ServiceReasonGrid`, `RelatedServices`, `FinalCta`, `CapabilityShowcase`, `ServiceFaqSection`, `ServiceProcessTimeline`, `Testimonials`). This improves all 223 bands with no page edits.
- Then build `SectionHeader`, `Split`, `CardGrid`, `NumberedList`, `CheckList`, `PageHero`, `PackageComparison`, `ShowMore` and show them on `/design-system`. Gate: the gallery passes the audit at every width.

### Phase 3: Migrate pages (one file per commit)
1. Formatting-only commit for the three files with single-line sections (`SocialMediaMarketingSections`, `SocialMediaPaidAdvertisingSections`, `LocalSeoSections`) so later diffs are readable.
2. Pilot: `GoogleAdsPpcSections.tsx` (it has every pattern). Review with the user before continuing.
3. Pricing family (LocalSeo, Shopify, WordPress, Maintenance), social family (SMM, PaidSocial, Facebook, Instagram), then Amazon, SEO, Ecommerce SEO.
4. Solutions template, About, FAQ, Warranty, Website Designs, Pricing, Contact, `/get-more-leads`.
5. Insights hub and article template (`components/insights/*`, `.insight-prose`), case-study templates (unpublished), legal, quote forms, thank-you pages.
6. Home page last (it has the most bespoke sections).

### Phase 4: Voice pages (16 pages)
- Type: point the `.va-page h1-h4` rules (`voice-agents.css` around lines 108-111) and the `.v4l .h1/.h2/.h3` rules at the global type tokens. Then a size census and a mechanical replacement table across the 12 industry files (the method used for the 16 Nov colour pass): body 16 to 18px, sub-14px tags to 14px.
- Spacing: `.v4l .section` reads `--section-sm`; the literal `container-omh py-14 lg:py-20` (53 identical uses) becomes `container-omh section-sm`; larger variants map to `section-md`.
- Tablet: one rule gives a 2-up step to grids that only have `lg:` columns, plus per-section rules by id (ids are shared across the 12 pages).
- Trace the 16px bleed past the gutter. Hero, sticky bar and label rules as on the rest of the site.
- Trap: `landing-v4.css` resets margin and padding on everything inside `.v4l` in a later CSS layer than Tailwind's utilities, so new margin or padding classes added to that markup compute to 0. Tokens reach it through CSS rules only. `landing-v4.css` is hand-maintained now (its generator's source HTML no longer exists).
- Not touched: frozen backups (`*-old*`, `lib/content/voice-industry/{dental-clinics,estate-letting-agents,clinics-healthcare}.ts`). They share the stylesheets, so they restyle anyway; they are hidden pages.

### Phase 5: Phone page length
`ShowMore` on plan-card feature lists and package cards, phones only; content stays in the HTML. Report page length before and after for every page. Target: no package card taller than about 1.5 screens, and a clearly shorter median than 27 screens.

### Phase 6: Device pass and hand-over
- Emulated: 320, 360, 390, 430, 540, 640, 768, 820, 912, 1024, 1152, 1180, 1280, 1366, 1440, 1536, 1920; portrait and landscape; light and dark; 200% text zoom on a phone.
- Real devices, on the Vercel preview: a small Android, an iPhone, an iPad in both orientations, a 13-inch laptop. Checks: sticky bar and safe area, input zoom, orientation change, and hover-only features (the portfolio hover-scroll needs a tap equivalent).
- Final audit beside the baseline; update `docs/design-rules.md`, `docs/responsive-plan.md` and memory.

### Phase 7 (later, separate approval): voice template merge
No two industry sections are byte-identical, so merge at helper level: move the icon sprite and the repeated snippet builders into `lib/content/voice-shared/parts.ts`, then data-driven builders for hero, how-it-works, cities, pricing, FAQ and sticky bar. HTML strings stay (no React rewrite). Each commit is verified by an empty diff of the rendered `#va-page` HTML.

## 4. Out of scope

Lead dashboard (`app/lead-dashboard`, `components/dashboard`), Sanity Studio, the widget's internals, `*-old*` backup routes, `app/home-2` (a 669-line copy of the home page), blog post content in Sanity (the article template and prose styles are in scope), and any copy change.

## 5. Verification

Budgets the audit enforces at the end (baseline in brackets; re-taken in Phase 0):

| Check | Target | Baseline |
|---|---|---|
| Sideways scroll, 320px and up | 0 pages | 2 pages + header at 320px |
| Text outside its box | 0 | 61 at the smallest width, 25 at 1024px |
| Squeezed text (under ~18 characters a line), 360-1280px | 0 | 115 at 1024px, 89 at 1280px |
| One-column card grids 600px+ wide, 768-912px | 0 | up to 100-122 on 39 pages |
| Section padding values per width | 4 (sm, md, lg, hero) | 11-13 |
| Computed font sizes | token set only | 39-53 |
| `h2` sizes per width | 2 (normal, narrow column) | 3 |
| `h3` sizes per width | 2 | 13-16 |
| Content text under 14px | 0 | 2% of text, 29 pages |
| `h1` lines on a 390px phone | 5 or fewer | 6 on 7 pages |
| Small-caps label lines | 2 or fewer | 3 |
| Tap targets under 44px (not inline links) | 0 | about 34 a page |
| Fixed elements overlapping on phones | 0 | 3 layers on voice pages |
| Desktop element positions, 1280-1920px | identical within 0.5px, or listed in 2.4 | n/a |

How the measurement works (enough to rebuild the script): for each page and width, walk every visible element; record document overflow; elements past the right edge that nothing clips; text boxes whose `scrollWidth` exceeds `clientWidth`; text blocks of 40+ characters whose box fits fewer than 18; one-track grids 600px+ wide with 3+ children; each top-level section's padding (section plus first wrapper) and left content edge; a font-size histogram weighted by characters; heading sizes and line counts; uppercase tracked labels over 2 lines; controls under 40px; fixed elements.

Per commit: `npx tsc --noEmit`, `npx eslint` on changed files, the greps in `docs/design-rules.md` section 5, the desktop element dump for every route that imports the changed file, and at 320/390/768/820/1024: no sideways scroll, no text box wider than its parent, every `h2` followed by a stacked `p`. Rendered text must be unchanged (copy is verbatim) and each page keeps one `h1`. Per phase: full `npm run audit:responsive`, `npm run build`, phone and tablet screenshots sent to the user.

## 6. Known traps (from the code)

- `max-lg:block` rows carry inert `gap-y-*` plus `max-lg:mb-*`/`mt-*` on children. Turning them into real grids doubles the gap: remove the margins in the same commit.
- `col-start-*` on a one-column grid creates extra columns and overflow; `Split` sizes tracks instead.
- `Reveal` is often the grid item, so `Split` must not need classes on its children.
- 20 `lg:sticky` intros must follow their row's own breakpoint, or they stick while stacked at 1024-1151px. A sticky side must stretch: never combine with centred alignment.
- The global `h2` 30ch cap is measured in the `h2`'s own font size: a smaller title has a narrower cap; centred titles need `.text-center` on an ancestor.
- The local `Band` wrappers default to tone "white"; pass the tone explicitly when deleting them. Warm, white and mist all compute to `#fff` since 29 Oct, so check "adjacent bands differ" on computed background plus border, in both themes.
- Tailwind classes must be literal strings: use lookup maps for variants, not string building.
- Heroes use the CSS `hero-in` entrance, not `Reveal` (largest-paint timing).

## 7. Working rules

- `git pull --rebase --autostash origin main` before every commit; commit only my own files; push only when asked. Other sessions commit to this repo.
- Read `site/AGENTS.md` and the Next docs in `node_modules/next/dist/docs/` before touching anything Next-specific.
- The VPS Docker build is a clean install: anything `npm run build` runs may only import declared dependencies. Audit and screenshot scripts are dev-only and stay out of the build.
- Colours stay on tokens (16 Nov colour pass). `ServiceBand` stays the only section scaffold, `container-omh` the only container, descriptions 18px, two fonts.
- After each phase: update the progress log in `site/docs/responsive-plan.md` and the memory note.

## 8. Risks

- **Desktop regressions** on an approved design: the element-position gate on every commit.
- **Visible changes in 2.4** need the client's OK before they ship.
- **Shared files**: `app/globals.css` and the widget are edited by other sessions; keep commits tiny and coordinate on the widget.
- **Size**: about 45 React files and 16 voice pages. Phases 0-2 are small and already improve every page; Phase 3 is the bulk and can stop after any file.

## 9. Progress log

### Baseline, 16 Nov 2026 (`c5041aa`)

59 templates at true device widths (`../audit/baseline-2026-11-16/`, desktop element positions in
`../audit/baseline-2026-11-16-rects/`). Tap targets count every control under 44px, capped at 40 a page,
so that row only shows direction. Floating layers: 0 overlaps (the voice sticky bar, scroll-to-top and the
assistant pill already stack apart), so that budget only guards against regressions.

| Check | 320 | 360 | 390 | 430 | 540 | 640 | 768 | 820 | 912 | 1024 | 1152 | 1280 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sideways scroll (pages) | 2 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Text outside its box | 46 | 11 | 3 | 2 | 0 | 2 | 11 | 13 | 13 | 24 | 18 | 17 |
| Squeezed text | 159 | 37 | 24 | 16 | 7 | 4 | 15 | 3 | 1 | 113 | 44 | 66 |
| Stretched one-column grids | 0 | 0 | 0 | 0 | 0 | 27 | 118 | 127 | 126 | 22 | 22 | 19 |
| Section padding values | 11 | 11 | 13 | 12 | 13 | 15 | 15 | 15 | 14 | 18 | 17 | 17 |
| Font sizes | 36 | 36 | 39 | 45 | 48 | 46 | 51 | 49 | 54 | 51 | 48 | 53 |
| h2 sizes | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| h3 sizes | 10 | 11 | 13 | 16 | 16 | 17 | 17 | 16 | 17 | 17 | 16 | 14 |
| Most h1 lines | 7 | 7 | 6 | 6 | 5 | 5 | 4 | 4 | 4 | 7 | 6 | 5 |
| Text under 14px (%) | 1.5 | 1.51 | 1.51 | 1.51 | 1.51 | 1.5 | 1.52 | 1.52 | 1.52 | 1.49 | 1.49 | 1.5 |
| Labels over 2 lines | 15 | 6 | 5 | 1 | 0 | 43 | 28 | 28 | 14 | 8 | 7 | 3 |
| Small tap targets | 1892 | 1995 | 2040 | 2042 | 1758 | 1966 | 1646 | 1703 | 1868 | 1950 | 2078 | 1968 |
| Median page (screens) | 28 | 26 | 24 | 23 | 22 | 20 | 18 | 18 | 17 | 14 | 14 | 13 |

One-off class ratchet at the start (`scripts/design-ratchet.json`): 3,850 `text-[Npx]`, 212 one-off
`clamp()` font sizes, 50 one-off `clamp()` spacings, 90 `max-lg:block` rows, 4 `max-w-[Nch]`, 3 hex colours.

### Phase 0, 16 Nov 2026: done

`scripts/responsive-audit.mjs` (audit, rects, diff-rects), `scripts/check-design.mjs` + ratchet,
`npm run audit:responsive` / `check:design`, this plan and the responsive rules (design-rules 4b).

### Phase 1, 16 Nov 2026: tokens and site-wide phone fixes

- `app/globals.css`: type scale and section padding are now variables (`--section-sm/md/lg`, `--hero-pt/pb`,
  `--gutter`) with lower phone minimums; every value equals the old one at 1280px. `wide` breakpoint (1152px).
  `overflow-wrap: break-word` on headings and running text. `tap-target` utility (invisible 44px touch area).
- Header: 44px phone buttons, logo 116px under 360px (the row was 8px too wide at 320px). Footer links 44px on
  phones. Breadcrumbs, closing-band contact links, `TextLink` and standalone amber links use `tap-target`.
  Testimonial dots hidden below 1024px (arrows and the "01 / 08" counter stay). Band labels: tighter tracking,
  balanced lines and no hairline on phones. `/cookies` sideways scroll fixed. Voice sticky bar hidden on
  screens under 481px tall.
- Quote-form titles use `text-h1` (listed desktop change, plan 2.4): at the display size one long word was
  wider than the 5/12 column at every width (537px of text in 465px at 1280px).
- Desktop gate: across 59 pages at 1280, 1366, 1440 and 1920 only the 8 quote-form title columns moved; no other
  element and no page text changed. (The rects tool now ignores closed `<details>` bodies, which Chrome
  sometimes reports a box for.)

| Check | 320 | 390 | 768 | 820 | 1024 | 1280 |
|---|---|---|---|---|---|---|
| Text outside its box | 46 → 35 | 3 → 2 | 11 | 13 | 24 → 16 | 17 → 13 |
| Squeezed text | 159 → 63 | 24 → 18 | 15 | 3 | 113 → 99 | 66 |
| Most h1 lines | 7 | 6 | 4 | 4 | 7 | 5 |
| Labels over 2 lines | 15 → 14 | 5 → 2 | 28 | 28 | 8 | 3 |
| Small tap targets | 1892 → 232 | 2040 → 234 | 1646 → 242 | 1703 → 218 | 1950 → 1831 | 1968 → 1839 |
| Median page (screens) | 28 → 27 | 24 | 18 | 18 → 17 | 14 | 13 |

Distinct heading and padding sizes went up by 1-2 at most widths: the React pages moved onto the new scale and the
voice pages still use their own sizes (32.2px `h2`, 40px `h1` on phones). That closes in Phase 4. Still open for
later phases: the voice `h1`s (6-7 lines at 320px), the hero stats labels wrapping at tablet widths (14 service
pages, Phase 3 hero), and voice-only tap targets (Phase 4).

### Phase 2a, 16 Nov 2026: tokens in the existing shared components

- Rhythm tokens `--gap-label`, `--gap-header`, `--gap-stack`, `--gap-grid` as spacing utilities (`mb-label`,
  `mt-header`, `mb-stack`, `gap-grid`), each equal to the old desktop value at 1280px.
- `ServiceBand` label gap uses `mb-label`. The four rows with a narrow 4/12 sticky side column
  (`ServiceFaqSection`, `ServiceProcessTimeline`, `RelatedServices`, `Testimonials`) stack until 1152px (`wide`)
  instead of 1024px. `ServiceReasonGrid` is two-up from 768px. Related-service cards are two-up on tablets.
- Audit against Phase 1: no page scrolls sideways at any width (was 1 page), squeezed text at 1024px 99 -> 53,
  stretched one-column grids at 768-912px -8, small phone tap targets 234 -> 147. Nothing worse.

### Phase 2b, 17 Nov 2026: shared section components (bc637ac)

- New: `components/ui/{Split,CardGrid,SectionHeader,NumberedList,CheckList,ShowMore,PageHero}.tsx` and
  `components/services/PackageComparison.tsx`; `ServiceSectionIntro` is now an alias of `SectionHeader`. Each one
  is shown in every variant on `/design-system`, which passes the audit at every width (no overflow, no spill).
- Desktop unchanged on the 8 service pages that already used `ServiceSectionIntro`.

### Phase 3 pilot, 17 Nov 2026: Google Ads page (9004c16)

- `GoogleAdsPpcSections.tsx` rebuilt from the shared components (287 -> 205 lines); copy unchanged.
- The `eyebrow` utility no longer sets a font (it made the hero stat labels wider and wrap at 1440px);
  `Eyebrow` in `Proof.tsx` uses it, so hero labels are 0.14em everywhere (was 0.16em, 0.15em on dark).
- Phone page 25,416 -> 23,734px (30.1 -> 28.1 screens); tablet 18,872 -> 18,143px; stretched one-column grids
  at 768-912px 3 -> 1 (the pricing notes list). No audit check got worse.
- Desktop shifts (allowed 17 Nov): feature panel padding 40 -> 36px, check-list rows +4.5px each, table prices
  32 -> 34px with the columns rebalancing; at most 31px vertical at 1280px, 8px at 1440px. Page text differs
  only by the four phone-only "Show everything included" buttons. Before/after screenshots sent to the user.

### Phase 3, 17 Nov 2026: pricing family (179bd2e)

- Local SEO, Shopify, WordPress development and WordPress maintenance on the shared components
  (1,866 -> 1,211 lines; copy unchanged). Formatting-only commit for the three single-line files first (9dfc595).
- `PageHero` uses the CSS `hero-in` entrance on every page (the pilot had put Google Ads on `Reveal`); new
  `statsStyle="divided"`. `PackageComparison`: 280px label column for three packages, 240px for four; `cardCta`
  keeps per-page button copy.
- Phone pages at 390px: Local SEO 25,743 -> 24,288px, Shopify 28,682 -> 25,323, WordPress 30,124 -> 26,422,
  Maintenance 25,702 -> 24,131. No audit check worse on any of the four.
- Desktop: comparison tables 74-128px shorter on Shopify, WordPress and Maintenance (row labels wrap less);
  Local SEO moves at most 20px (check-list rows on the shared spacing). Google Ads unchanged.

### Phase 3, 17 Nov 2026: social family (3fac3c5)

- Social media marketing (scaffold shared with Facebook and Instagram), paid social and the Facebook/Instagram-only
  bands on the shared components. New `PlanCards` for the two published-plan grids (three-up from 1024px, two-up
  on tablets, five feature rows then "Show everything included" on phones).
- Instagram's 9:16 creative frame is capped at 20rem while stacked (it ran full width on tablets).
- Phone pages at 390px 1,400-2,200px shorter (Instagram 24,813 -> 23,134px); one-column grids at 768-912px gone on
  all four; no audit check worse. Text differs only by the three phone-only buttons per page.
- Desktop: card gap 16 -> 20px and card padding 24 -> 28px move later sections by up to 36px; Instagram 74px
  (two process cards wrap one more line).

### Phase 3, 17 Nov 2026: Amazon PPC, SEO, Ecommerce SEO (5146d85)

- All 12 service pages are now on the shared components. `PageHero` gains `subtitle`, `statsNote` and `after`.
- Tablets 520-760px shorter; Ecommerce SEO's stretched one-column grid gone; phones 250-350px shorter. No audit
  check worse; no text changed.
- Desktop: Ecommerce SEO unchanged; SEO moves 4px (its narrow stat card keeps 32px padding from 1024px, the
  shared 36px made its text wrap more); Amazon's hero figures align to the bottom when a label wraps (22px at
  1280px only).

### Phase 3, 17 Nov 2026: Solutions, About, FAQ, Warranty, Website Designs, Get More Leads (c4cd148, 6f1397f)

- Re-baselined on the button session's commit (e4f69f1) first, so its button changes are not counted here.
- Solutions template: outcome rows and comparison cards two-up on tablets; the 4/12 and 5/12 intros stack until
  1152px (their h2 ran 8-9 characters a line at 1024px). About, FAQ, Warranty and Website Designs rows on `Split`;
  Warranty prices two-up on tablets; About's four portraits four-up on tablets. Get More Leads stats fit at
  1024-1279px. FAQ "Jump to" links have 44px tap areas.
- Contact Us (new, from the button session): headline and intro caps removed per design rules 8 and 9 (content moves
  up 30px at 1440px).
- Every flagged item fixed except one 1152px heading on one Solutions page; no audit check worse; no text changed.
  Desktop unchanged except About and Warranty card padding (12px).
- Not changed on purpose: the Pricing page's flags are all inside the AI voice plan cards (Phase 4); the booking and
  About h1s count as "squeezed" at display size in their approved columns.

### Phase 3, 17 Nov 2026: insights, legal, thank-you pages (this commit and the one before)

- Measured the hub, four articles, privacy, cookies, terms, AI services, three thank-you pages and the 404. The only
  real problem was the related-articles (and case-study) cards: one stretched column on tablets, now two-up.
  Every article is ~760px shorter at 820px; desktop unchanged. Legal, thank-you and 404 pages were already clean.
- AI services is voice markup (Phase 4). Quote forms were removed by the button session (e4f69f1).
- Measurement trap: another session runs `next build` in this checkout. Mid-run rebuilds make the preview serve HTML
  for missing CSS (pages measure unstyled, e.g. 1,200px images). Check `.next/BUILD_ID` is unchanged across a run.
- Phase 3 left: the home page.

### Phase 3 complete, 17 Nov 2026: home page (a613e28)

- Services list drops its decorative numbers under 360px; the client quote uses the h3 size on phones; the
  who-we-work-with cards go one-up at 1024-1279px and the stats strip fits there. Squeezed text at 320px 13 -> 1 and
  at 1024px 5 -> 1 (the h1 at display size is the remaining one on both), spill fixed, desktop unchanged.
- Phase 3 is done: every code-built page is either on the shared components or measured clean. Left for Phase 4:
  the 16 voice pages, /ai-services and the voice plan cards on /pricing. Phase 5: phone length (home is 26 screens at
  390px, Website Designs 34, About 27).

### Phase 4a, 17 Nov 2026: voice pages, CSS only

- `voice-agents.css` (@layer base) and `landing-v4.css`: h1/h2 on `--text-display`/`--text-h2`; `.v4l .section` on
  `--section-md`. New unlayered block at the end of `voice-agents.css` (it has to beat the markup's Tailwind classes):
  three-column card rows two-up at 768-1023px (two-column rows left alone, their cards are image-beside-text), voice
  plans on /pricing two-up until 1280px, plan fact labels 14px, London widgets fit at 320px.
- Results: /pricing squeezed@1024 20 -> 0; London spill@320 15 -> 5; one stretched tablet grid fewer per voice page;
  desktop moves 2.5px at most; no audit check worse.
- Left as they are: the literal `py-14 lg:py-20` section paddings (one consistent voice rhythm, 56/80px), h3/h4 sizes
  (27.8px/20px vs the site's 30/22 at 1280; changing them reflows desktop), the lead-flow diagram labels, and the
  remaining "stretched" tablet grids, which are intro-plus-content stacks, the phone mock-up and video cards.
- Next: voice body text 15-17px -> 18px (user decision), piloted on /ai-voice-agents before the 12 industry files.

### Phase 4b, 17 Nov 2026: voice body text 18px (one CSS rule)

- Unlayered rule at the end of `voice-agents.css`: any element in `#va-page`/`.v4l` written at text-[16px], 16.5px,
  17px or `.t-card` goes to 18px, except spans, `.uppercase` labels, buttons/tabs/summaries/labels/inputs, headings,
  `[role="img"]` and `.brand-phone` mock-ups. No markup edits, so all 16 voice pages, /ai-services and the voice plans
  on /pricing changed together. `md:grid-cols-3` voice card rows now two-up at 768-1023px too.
- Pages +3-4% at 390px, +1-3% at 1280px. Audit: squeezed text at 768px back to 0; the remaining "capsWrap" flags are
  dt/th cells stretched by taller neighbours (measured: one line each); one nested list on /ai-services at 320px
  runs 17 characters a line.
- Phase 4 left: the "16px gutter bleed" from the plan was not seen in this round's measurements. Next: Phase 5
  (phone length: voice pages 31-40 screens, Website Designs 34, About 27, home 26).

### Phase 5, 17 Nov 2026: phone length

- `ShowMore` on the Website Designs gallery (2 per category), About team (4) and home services (5);
  `components/voice-agents/PhoneCollapse.tsx` for the voice markup (adds a `.phone-more` button and
  `data-phone-limit`; CSS in `voice-agents.css` hides the rest under 640px, never while a filter has hidden items).
- Screens at 390px: Website Designs 33.7 -> 24.2, About 27.1 -> 19.6, home 26.3 -> 24.9, /ai-voice-agents
  41.4 -> 35.9, industry voice pages about -2 each (30.6-38.1 now). 640px and 1280px heights unchanged.
- Not collapsed on purpose: voice FAQ ("Open all" and the result count would disagree with a collapsed list),
  plan cards, lead-flow and day-of-calls sections. Voice pages stay long because every section is kept (client).
- Next: Phase 6 device pass (real phones on the Vercel preview; the user is already sending screenshots from one).
