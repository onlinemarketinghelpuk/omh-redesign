# The OHM dashboard, rebuilt in the Ecomsixx design

Asked by Rafiul, 16 November 2026: "ohm dashboard ta fully ecomsixx ar
dashboard moto redesign koro fully rebuild korba but just brand colour ta ohm
ar moto thakbe ok baki all ecomsixx dashboard moto hobe ... same oii rokom
premiumness smooth ness akon perfect ui/ux lagbe".

So: the visual system is Ecomsixx's, entirely (the standing rule for a design
clone: the reference's system, our content). The one thing that stays OHM's
is the brand colour. Every screen keeps its data, its wording and what it
does.

## What Ecomsixx's dashboard is, measured

Read from the running Ecomsixx dashboard (local dev, signed in as the dev
demo account) and from its source (`components/ecx/app-kit.tsx`,
`components/ecx/dash.tsx`, `components/dashboard/DashboardShell.tsx`,
`styles/globals.css`):

| | Ecomsixx |
|---|---|
| Body | Inter 16px, ink `#141416` on white |
| Headings | Geist Sans 500, h1 24px, letter-spacing -0.01em; card titles 16px |
| Figures and labels | JetBrains Mono, 11px uppercase, tracking 0.1em, for KPI labels, group labels and "Updated just now" |
| Sidebar | white, 232px, hairline right edge; logo row with a green "LIVE"; ⌘K search; groups under mono uppercase labels; items 13px, 6px radius, active a soft brand-tint pill at 500 |
| Top bar | breadcrumbs, a ⌘K search pill, the AI pause control |
| Cards | 20px radius, 1px brand-tinted line, a four-layer brand-tinted shadow |
| KPI | mono label with an icon, a 30px Geist figure that counts up, a muted line, optional ring or sparkline |
| Controls | ink primary button (10px radius, 36px), hairline ghost; filter pills ink when active |
| Motion | 0.15s on controls, 0.18s ease-out on the nav, a 0.26s rise when a view changes; nothing under reduced motion |
| Phone | a top bar, the current group's screens as a row of pills, a bottom tab bar |
| Brand | purple `#5b0dd5`, tints `#efe9fd` and `#f6f3ff`, purple-ink `#110229` |

## The swap

Only the brand family changes. Purple becomes OHM bronze; its tints become
bronze tints; the brand-tinted shadows are tinted bronze.

| Ecomsixx | OHM |
|---|---|
| brand `#5b0dd5` | `#7d5c33` |
| brand deep `#3d0a8f` | `#5e4526` |
| light series `#b69cff` | `#d2b48c` |
| tint `#efe9fd` (active, track) | `#f3eee7` |
| tint `#f6f3ff` (hover) | `#faf8f5` |
| line `#e4e0ea` | `#e7e2db` |
| brand ink `#110229` | `#1c140b` |
| shadow hue `rgb(67 16 147)` | `rgb(94 69 38)` |

## How, in the order that gets the most right soonest

1. **Tokens, scoped to `#omh-dashboard`.** The colour variables every screen
   already uses (`bg-warm`, `border-line`, `text-muted`, `bg-inverse`...) are
   redefined there to Ecomsixx's values in bronze, and pinned light (the
   marketing site's tokens switch with the OS; Ecomsixx's dashboard does
   not). The fonts load only for the dashboard. One change re-skins all 23
   screens before any of them is touched.
2. **The kit.** `app-kit` and `dash` ported to `components/dashboard/kit.tsx`.
3. **The shared pieces** (`ui.tsx` Card, Pill, Table, Empty) rebuilt to the
   kit's look, so every screen that uses them follows.
4. **The shell.** Ecomsixx's sidebar, top bar with breadcrumbs and ⌘K, a
   command palette, and the phone top bar, pill row and bottom tab bar.
5. **Screens**, onto the kit's layouts: KPI rows, filter pills, cards.
6. **Proof.** Computed styles compared with Ecomsixx's; a sweep at every
   size; screenshots of both side by side, looked at.

## Tasks

- [x] 1. Tokens and fonts, scoped
- [x] 2. `components/dashboard/kit.tsx`
- [x] 3. `ui.tsx` to the kit's look
- [ ] 4. Shell: sidebar, top bar, ⌘K palette, phone bar, pill row, tab bar
- [ ] 5. Screens onto the kit
- [ ] 6. Proof: measurements, sweep, side-by-side screenshots

## Not changing

What any screen says or does, its data, its routes, or anything outside
`/lead-dashboard`.
