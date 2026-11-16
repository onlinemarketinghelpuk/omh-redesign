# Plan

## The gap

Rafiul: "kico section ase jekane lead click korle all info dekano uchit but
dekasse nh." Driven in a real browser, every list screen was counted for rows
that lead somewhere:

| Screen | Rows | Rows that link | Verdict |
|---|---|---|---|
| inbox | 55 | 54 | fine |
| chats, calls, sequences | 35-46 | 34 (minus 9 nav) | fine |
| leads, bookings | 38-59 | 34 + row buttons | fine |
| handover | 26 | 9 nav, but 9 row buttons | fine, it is master-detail |
| **channels** | **70** | **9, all of them nav** | **no row leads anywhere** |

**Correction to an earlier claim in this session.** I reported that the inbox
rows do not link. That was wrong. The measurement was broken two ways: the
script's login raced the server action so it was reading the sign-in page, and
its CSS selector interpolated to `main, [role=main] table tbody tr`, where the
comma made two selectors and every screen returned the same two rows. Both are
fixed in the sweep, and the inbox was fine all along.

So there is one real gap, and it is on the screen the client reads to decide
next month's budget.

## Why it matters on this screen specifically

Channels says "Facebook ad produced 3 appointments from 34 leads". The next
question anybody asks is "show me those 34". Today there is nowhere to click,
so the only way through is to go to Leads and rebuild the filter by hand,
which means the number on the report and the list they end up looking at are
not provably the same set.

## Tasks

- [x] 1. `DataTable` reads its initial facet selection from the URL, so any
      list screen can be linked to pre-filtered. Lazy `useState` initialiser
      off `useSearchParams`, keys taken from the facets the table was given,
      so an unknown query param is ignored rather than trusted.
- [x] 2. The channel name cell on Channels becomes a link to
      `/lead-dashboard/leads?source=<canonical>`, carrying `demo` when set.
- [x] 3. The same for the two "by channel" panels underneath, which ask the
      same question and have the same dead end.
- [x] 4. The drift risk, handled where it actually bites. Both sides come from
      the same `canonicalSource` in `lib/dashboard/channels.ts`, so they cannot
      disagree by construction. The real hazard was in the new code: the first
      version **dropped** a query value it had no option for, so a stale or
      mistyped source would have shown all 329 leads under a heading naming one
      channel. Unknown values are now applied, so the table comes back empty and
      "Clear filters" is on screen. Verified in the browser:
      `?source=facebook_ads` gives `34 of 329`, `?source=not_a_channel` gives
      `0 of 329`, no filter gives `329 rows`.

      There is no unit test runner in the website package (`package.json` has no
      test script and no vitest or jest), so the browser run is the test rather
      than a pretend unit one.
- [x] 5. Drive it in the browser: click a channel, confirm the lead count on
      Leads matches the number on the Channels row.

## Not in scope

- Redesigning Channels. It reads well and is dense; the only thing wrong is
  that it is a dead end.
- Making every KPI tile clickable. A tile is an aggregate across channels and
  has no single honest destination.
