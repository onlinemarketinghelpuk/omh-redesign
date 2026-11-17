# Notes, revenue on a win, and one insights page

Three things the owner asked for:

1. An **optional note** on any lead. Nobody has to write one; anybody can.
2. When somebody changes a lead's outcome to won, a box asking **how much that
   client is worth**, with a **dropdown of services and packages** that puts the
   right figure in for them. The owner confirms it, or types their own number.
3. **One page of insights**: how many leads each channel produced, how many
   converted, how much revenue each one brought, and a **See all** button on
   every row that opens exactly those leads.

## What already exists, checked against the code rather than assumed

Read this section before building anything. Two of the three are largely built,
and the work is smaller and different from what the request sounds like.

| Asked for | State | Where |
|---|---|---|
| Insights per channel: leads, replies, appointments, deals won, revenue | **Built** | `app/lead-dashboard/channels/page.tsx`, 500 lines. Sums `valueGbp` per `sourceChannel`, ranks channels by deals won with the money beside it, and has reply rate, time to first touch and appointments per channel. |
| See all the leads behind a channel | **Built**, workstream 007, all 5 tasks ticked | The channel name cell links to `/lead-dashboard/leads?source=<key>`, and `DataTable` reads its facet from the URL so the table lands pre-filtered. |
| A box asking for money when a lead is marked won | **Built** | `components/dashboard/OutcomePicker.tsx`. Choosing "won" opens a `£` field, Enter or Save writes it through `setLeadOutcome` to `routing.setOutcome`. Skippable by design. |
| A **service and package dropdown** that puts a figure in for them | **Does not exist** | The `£` field is free text. Nothing knows what OMH sells or what it costs. |
| An **optional note** on a lead | **Does not exist** | `leads` in `widget/convex/schema.ts` has `message` (what the visitor typed) and no notes field at all. `notes` exists on `profiles` and `bookings`, neither of which is this. |

So the honest scope is: **build the note, build the service catalogue and the
prefilled amount, and make the insights page findable.** Do not rebuild the
channels report. Rebuilding it would cost a day and lose the drift guard that
task 4 of workstream 007 exists to provide.

### Why the owner may believe the insights page is missing

The drill-through is the channel **name**, styled as a table cell. There is no
button that says "See all". A link that does not look like one is a feature
nobody finds, which is indistinguishable from a feature that is not there. That
is a real defect and it is task 7 below, not a quibble.

## The one thing to get right

**The price list is derived, never retyped.** `lib/content/price-list.ts` is the
client's own live pricing, copied verbatim from `/all-services-price-list/`,
with a comment at the top saying the figures must not be edited. Its shape is
already what this feature needs:

```ts
{ id: "smm", title: "Social Media Management Packages",
  tiers: ["Seed Social Media Marketing", "Shoot …", "Sapling …"],
  rows: [ …, { label: "Pricing", values: ["£450", "£700", "£900"] } ] }
```

A second copy of those numbers in the dashboard would drift the first time the
client changes a price, and then the dashboard would be prefilling a figure the
website does not charge. So the catalogue is **computed from `priceList` at
build time**, and a test asserts that every option's amount still matches the
`Pricing` row it came from.

Three traps in that file, all of which will bite whoever skips this paragraph:

- **Tier names collide.** `"SEO Seed"` is a tier of both the `seo` and the
  `local-seo` tables, at different prices. The option key must be
  `` `${sectionId}:${tierIndex}` ``, never the tier name.
- **`website-designs` has `tiers: []` and `rows: []`.** It is notes only. It
  must produce no options rather than one broken one.
- **`amazon-ppc` takes its prices from `amazonPpc.packages.map(p => p.price)`**,
  not from a literal array. Derive, do not pattern-match on literals.

## The second thing to get right, and the open question

**Most of these packages are monthly, with a contract length in the table.**
Social Media Management Seed is `£450` with `Contract Length (Months): 3`. PPC
Shoot is monthly with a 6 month contract and a required ad spend beside it.

So "how much did we get from this client" has two defensible answers, £450 and
£1,350, and picking one silently makes every revenue figure on the dashboard
wrong by a factor of three in one direction or the other.

**Proposal, to be confirmed by Rafiul before task 4:** prefill the **monthly**
price, and show the reason for the number next to the box in words, for example
*"Social Media Management, Seed. £450 a month, 3 month contract. £1,350 over
the term."* with both figures as one-press choices and the field still editable.
Then `valueGbp` means what the owner confirmed it means, and the screen said
which it was at the moment they confirmed.

Store the parts as well as the total, so the figure can be explained a month
later: `serviceKey`, `packageLabel`, `monthlyGbp`, `months`, and `valueBasis`
of `"monthly" | "term" | "custom"`. `valueGbp` stays the single field every
report already reads, so **the Channels page needs no change to show money.**

## Notes: append-only, not one editable string

A single `notes: v.optional(v.string())` on `leads` is less code and is what the
request literally asks for. It is also how two people on the same dashboard
silently overwrite each other, and the note that is lost is the one somebody
typed after a phone call.

Every other record of what happened in this system is append-only for exactly
this reason: `touches`, `consentEvents`, `messageHistory`. Notes join them. One
`leadNotes` table, one row per note, with `by` and `at`, newest first in the UI,
and the author able to delete their own. The lead row carries `noteCount` so the
Leads table can show that a lead has notes without reading the table.

If Rafiul prefers the single field, say so and do that instead; it is a smaller
change and the plan should not pretend otherwise. **The decision belongs to him,
not to whoever picks this up.**

## What this is not

- **Not a new insights page.** `/lead-dashboard/channels` is that page. A second
  one would disagree with the first within a fortnight.
- **Not a quoting tool.** The dropdown records what was sold. It does not build
  proposals, does not email a price, and does not touch the website's pricing.
- **Not a change to bulk outcomes.** `setOutcomeMany` deliberately takes no
  value, because one figure set on twenty leads invents revenue. That stays.
- **Not a per-lead revenue figure on anything the client sees.** This is the
  internal dashboard only.

## Tasks

- [x] 1. `lib/dashboard/service-catalogue.ts`. Derive the options from
      `priceList`: `{ key, serviceId, serviceTitle, packageLabel, monthlyGbp,
      months }`. Parse `"£450"` to `450`, and anything unparseable (`"POA"`, a
      boolean, a missing `Pricing` row) yields an option with no amount rather
      than `0`, because a zero on a report is a lie and a blank is a question.
      Plain TS, no React, so the tests and the server action share it.
- [x] 2. `widget/tests/service-catalogue.test.ts`, **watched failing first**.
      Every option's amount equals the `Pricing` cell at its tier index;
      `website-designs` yields nothing; `amazon-ppc` is derived not hardcoded;
      `"SEO Seed"` yields two distinct keys at two different prices; no two
      options share a key. Teeth: hardcoding one price fails the suite.
      165 ok, 0 failed.
- [x] 3. Convex schema: `leadNotes` table (`leadId`, `body`, `by`, `at`,
      indexed `by_lead`), `noteCount` on `leads`, and the five value fields
      above. Then `addLeadNote`, `deleteLeadNote`, `leadNotes` query, and
      `setOutcome` accepting and storing the service fields.
- [x] 4. **Confirm the monthly-versus-term question with Rafiul**, then the
      amount logic. Decided under nostop: prefill monthly, reason line with
      both figures as one-press choices, field still editable; store the parts
      alongside `valueGbp`. See `.nostop/decisions.log`. Open for his review.
- [x] 5. `widget/tests/engine.test.ts` additions, red first: a note is stored
      with its author and time and does not touch `valueGbp`; `noteCount`
      tracks adds and deletes; an outcome moved off `won` clears the service
      fields along with the value, the way it already clears `valueGbp`;
      a custom number is stored as `valueBasis: "custom"` and is not
      overwritten by the catalogue on the next save. +29 assertions.
- [x] 6. `OutcomePicker.tsx`: the service dropdown and the reason line, in front
      of the existing `£` field rather than replacing it. Keep both existing
      properties: skippable, and saves on choosing with no second button. The
      demo path must still save nothing and say so.
- [x] 7. A `LeadNotes` control, on the conversation page where there is room,
      and a note indicator on the Leads table that links to it. Not an inline
      editor in a table cell of sixty rows.
- [x] 8. The findability fix: a real **See all** button on each channel row on
      `/lead-dashboard/channels`, beside the existing name link, plus a revenue
      figure in the KPI strip at the top. Both point at the URLs 007 already
      built. No new query.
- [ ] 9. Drive all of it in a real browser, signed in, on the live data and
      again with `?demo=1`: add a note, delete it, mark a lead won from the
      dropdown, override with a custom number, press See all and check the lead
      count on the destination equals the number on the row it came from.
      Screenshots looked at, not just taken. 1280 and 390 wide, no horizontal
      scroll. Rafiul approved the deploy on 17 November 2026 and Convex went
      out to `cool-ferret-103` (one index added, `leadNotes.by_lead`, none
      deleted). Driven afterwards, results below.

## Task 9: what the browser actually showed, 17 November 2026

Deployed first, then driven. Evidence from real runs.

**Passed, on real data:**

- A note posted on the real lead `router-mwjebnne`, read back, **still there
  after a full page reload**, which is what proves it reached Convex rather
  than React state. Deleted, and gone after a second reload. The lead is back
  exactly as it was.
- `routing:leadNotes` answers on the live deployment (it refuses a call with
  no `leadId`, which is the proof it is deployed).
- **See all** on Channels: the row promised 2 leads, the button went to
  `/lead-dashboard/leads?source=unknown`, and the destination showed 2 rows.
  The two sides agree.
- 390px wide: horizontal overflow 0px on Channels and on Leads. No page
  errors and no console errors anywhere in the run.
- The service dropdown is real and derived: **39 options**, reading
  `Website Seed · £200 / 6mo`, `Website Shoot · £200 / 12mo`, and so on, with
  a first option of "not from the catalogue".

**Not driven on real data, deliberately:** marking a lead won. There are two
real leads in this deployment, the five outcomes have no "unset", so a made-up
deal value could not be undone and would put false revenue into the client's
own channel report. The win box was driven in `?demo=1` instead, which says it
saves nothing. **This is still owed on a test row once one exists.**

### Defect found while driving it: the win box is clipped below 1400px

Measured, not eyeballed. On the Leads table at a 1280px viewport:

| | |
|---|---|
| The win panel | x 1034 to 1426, 392px wide |
| Its clipping ancestor | the table wrapper, `overflow-x-auto min-[1400px]:overflow-x-visible`, ending at x 1248 |
| Clipped off | 178px of the panel |
| **Cancel** | x 1232 to 1289, so almost entirely past the clip edge and past the 1280 viewport |

The class says it plainly: the wrapper only stops clipping at 1400px and up.
Below that the panel is cut off by the horizontally scrolling table it sits
inside, and on a 1280px laptop the owner can press Save but not Cancel.

This matters more than it sounds. `docs/design-rules.md` and the request for
this dashboard both describe a laptop in a client meeting, and 1280 is that
laptop. It is also the one control this entire workstream exists for.

Two ways out, and the second is the real fix: give the panel a portal so it
escapes the scroll container, as `OutcomePicker`'s own menu already does with
its measured flip; or open the win box somewhere that is not inside a
horizontally scrolling table. Not fixed here, because 017 is in flight in
another session and this file is how that session finds out.

## Before it can be called done

- `zsh widget/tests/run.sh` green, with the new assertion count quoted against
  the 2227 baseline. A fix that breaks a neighbour must be visible.
- `npx tsc --noEmit` and lint clean.
- Browser evidence recorded for every task 9 item. HTTP 200 is not proof, and
  `?demo=1` never reaches the Convex query, so demo mode renders perfectly over
  a dead backend. **Verify on real data, not on demo.**
- Convex must be deployed for any of the writes to work: the deployment is
  `cool-ferret-103`, still **dev**, and the key is per project. Ordering rule
  from `DEPLOY-NOTE.md`: **Convex before the site**, or the screens 500 at
  request time.
- Nothing deployed, pushed, or set `active` without Rafiul's typed approval.

## Open questions for Rafiul

1. **Monthly price or whole contract value?** The "£1,350 over the term" line
   above is a proposal, not a decision. Every revenue figure depends on it.
2. **Notes append-only, or one editable box?** Append-only is recommended and
   is more work.
3. Should a lost lead be able to carry a **service** too, so "which service do
   we lose most often" becomes answerable? Cheap now, awkward to add later.
