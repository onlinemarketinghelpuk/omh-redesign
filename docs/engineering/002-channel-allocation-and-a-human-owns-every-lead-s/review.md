# Review - Channel allocation, and a human owns every lead status

**REQUEST CHANGES.** Two blockers, four majors.

Reviewed 2026-11-16 by a reviewer that did not write the code, with this
folder and the files in scope, and without the author's reasoning.

The maths in `widget/gates/allocation.js` is the strongest thing here and is
honestly tested. The problem is not the gate. It is that the screen the gate
feeds now sits one click away from two older screens that answer the same
questions with a different floor and a different population, and nothing in
this workstream reconciled them. The section is careful; its neighbours were
not made careful to match, and a client reading both in one sitting gets two
answers.

## Evidence

Paste the real output. Not a description of it.

| Check | Command | Result |
|---|---|---|
| Tests | `cd widget && zsh tests/run.sh` | `every suite passed` - 30 suites, **1042 assertions, 0 failed**, no skips. `allocation.test.ts` 38 passed, `engine.test.ts` 55 passed. |
| Build or types | `npx tsc --noEmit` | exit 0, no output |
| Build or types | `npx tsc -p tsconfig.check.json` | exit 0, no output |
| Lint | `npx eslint components app lib widget/gates` | exit 0, no output |
| Browser (user-visible changes) | `curl -D- http://localhost:3000/lead-dashboard?demo=1` | **`HTTP/1.1 307 Temporary Redirect` / `location: /lead-dashboard/login`.** Not verified by this reviewer - see "What was not verified". |

Verbatim:

```
$ npx tsc --noEmit;                     echo "exit=$?"
exit=0
$ npx tsc -p tsconfig.check.json;       echo "exit=$?"
exit=0
$ npx eslint components app lib widget/gates; echo "exit=$?"
exit=0
```

```
$ cd widget && zsh tests/run.sh | tail -3
27 passed, 0 failed

every suite passed
```

```
######## allocation.test.ts ########
38 passed, 0 failed
######## engine.test.ts ########
55 passed, 0 failed
######## screens.test.ts ########
66 passed, 0 failed
```

Before and after counts for the test suite, so a regression cannot hide:

| | Suites | Assertions | Failed |
|---|---|---|---|
| After (measured here, 2026-11-16) | 30 | **1042** | 0 |
| Before | **not recorded** | **not recorded** | - |

The plan's "assertion count stated" box is ticked and no count is written down
anywhere in this folder, so there is no before number to compare against. The
1042 above is the first number on record. A regression in a suite this
workstream did not touch could not be seen from here.

Reproducing a figure quoted in the section, over the demo data, to check it is
real rather than described - `allocate(demoChannelFacts().rows, demoSpend())`:

```
channel        leads booked conversion  quadrant   spend
facebook_ads    34    3     0.0882      money_pit  2400
organic         32    6     0.1875      money_pit  (none)
website_form    30    9     0.3000      money_pit  (none)
google_ads      28   11     0.3929      working    3100
facebook        26    8     0.3077      working    (none)
whatsapp        25   10     0.4000      working    350
instagram       24    5     0.2083      money_pit  (none)
reactivation    24    5     0.2083      money_pit  (none)
website_chat    22    9     0.4091      starved    (none)
instagram_ads   21    2     0.0952      leave      900
phone_inbound   18    9     0.5000      starved    (none)
direct          13    3     0.2308      leave      (none)
website_voice   12    4     0.3333      starved    (none)
phone_missed    10    4     0.4000      starved    (none)
referral        10    5     0.5000      starved    (none)
best phone_inbound   worst facebook_ads
totals {"leads":329,"booked":93,"won":55,"value":133498,"spend":6750,
        "channelsWithSpend":4,"channels":15,"floor":8}
```

Note what is not in that output: **no row has `tooEarly: true`.** See finding 6.

## Findings

| # | Severity | Finding | File | Resolution |
|---|---|---|---|---|
| 1 | **blocker** | **The Leads and Overview screens count at most 25 leads, and say "leads".** `functions:recent` is `.take(25)` with no argument, and `getWidgetData()` is the only source for `app/lead-dashboard/leads/page.tsx`. So `Kpi label="Leads captured" value={String(leads.length)}` is `min(25, total)` minus test rows, `Ready to buy` prints `${Math.round(hot/leads.length*100)}% of leads` over those same 25, and the Overview's channel mix (`bySource`) is built from them. The new Allocation section, on the same Overview page, is built from `getChannelFacts(undefined, 1000)` and says **329 leads**. Two lead populations, one screen. Worse, every Channels row and every bar links to `/lead-dashboard/leads?source=<channel>` under a comment claiming "this is where those 34 are" - they are not, the destination holds 25 rows across all channels. This is the exact failure `test-rows.ts` was written to prevent, arriving by a different door: the *rule* is single, the *population it is applied to* is not. | `widget/convex/functions.ts:963`, `lib/dashboard/convex.ts:106-110`, `app/lead-dashboard/leads/page.tsx:22-30`, `app/lead-dashboard/page.tsx:57-66` | **open.** Fix: give `functions:recent` a limit argument and have `getWidgetData()` request the same cap the channel screens use, or re-point Leads at `channelFacts`. Until then no "Leads captured" figure on this dashboard is a lead count. |
| 2 | **blocker** | **Channels names a worst channel on two leads; the Allocation section refuses to rank under eight.** `channels/page.tsx:108-110` filters `g.leads >= 2` and prints `"<worst> produced none from <n> leads"` in the headline card. `allocation.js` sets `FLOOR = 8` and the section prints "Not ranked, under 8 leads each". Both screens are reachable from each other by one link, over the same data. ADR-007 ("rank nothing on a handful of leads") and research.md failure 1 are written against exactly this, and the workstream applied the rule to the new screen while leaving the old one contradicting it. A channel the Overview declines to judge can be named the worst performer on the Channels page it links to. | `app/lead-dashboard/channels/page.tsx:106-117` | **open.** Fix: import `FLOOR` from `widget/gates/allocation.js` and use it for both `best` and `worst` on Channels; suppress the clause when nothing clears the floor. |
| 3 | major | **"Costing you" is a cost claim made about channels with no spend.** The plot in `Allocation.tsx` shades and labels a quadrant "costing you", and dots land in it purely on leads-vs-conversion medians. Over the demo data that quadrant contains `organic` (Found us on Google) and `website_form`, both with `spend: null`. ADR-008 is explicit that profit is not claimed without spend and that the honest word is "efficient". The table cell beside it is careful ("volume, not converting"); the chart label is not, and the chart is the part that gets screenshotted. Also note `website_form` at 30.00% is "costing you" while `facebook` at 30.77% is "working" - a 0.77-point gap flipping a hard categorical verdict, because the split is the median. | `components/dashboard/Allocation.tsx:38-43, 234-237`, `widget/gates/allocation.js` quadrant block | **open.** Fix: rename the quadrant to something that claims only what is measured ("not converting"), or restrict "costing you" wording to rows where `spend !== null`. |
| 4 | major | **A rate over a different population than its label, on the Channels screen.** Two of them. (a) `Kpi label="Text reply rate" value={Math.round(smsIn/smsOut*100)}%` with `sub="target 15 to 30 per cent"` - inbound *messages* over outbound *messages*, no denominator printed, and it can exceed 100% whenever one person sends three texts back. (b) In the by-channel table the `Replied` cell prints `g.replied` (leads with *any* first reply, any channel) and directly under it `{Math.round(replyRate*100)}% of texts` where `replyRate = g.smsIn/g.smsOut`. A count of people with a percentage of messages set under it, in one cell, reads as "X of Y replied, which is Z%". It is not. The same applies to Email reply rate. plan.md's closing note fixed the 82% figure and states "The rate without a denominator was real and was on Channels" in the singular; these three were missed, so the DoD box "No figure on the section is a rate without its denominator" is ticked and not true of the screen. | `app/lead-dashboard/channels/page.tsx:217-257, 341-348` | **open.** Fix: print `of N texts` / `of N emails` in the `sub`, and move the per-channel text rate out of the Replied cell into its own cell or label it `% of its texts` on its own line. |
| 5 | major | **A2's test file does not exist.** plan.md A2 is ticked with "Test first: `widget/tests/spend.test.ts`, asserting a channel with no figure reads as absent rather than zero, a negative figure is refused, and a figure set for one channel does not appear against another". There is no `spend.test.ts` in `widget/tests/`, and `grep -rn "setChannelSpend\|channelSpend\|not_a_cost" widget/tests/` returns nothing. The `not_a_cost` guard in `setChannelSpend` is real code with zero assertions behind it, and "a figure set for one channel does not appear against another" is untested in a function that writes every channel into one shared `settings` row. | `plan.md` A2 vs `widget/tests/` | **open.** Either write the three assertions or untick A2 and record why it shipped untested. |
| 6 | major | **A4's own verify criterion is not met.** A4 says the demo must show "at least one channel in each of money pit, starved and working, and at least one 'too early to say'". Computed above: the smallest demo channel is 10 leads, `FLOOR` is 8, so **no row is `tooEarly`**. The "Not ranked, under 8 leads each. Too few to tell a good channel from a lucky week." paragraph (`Allocation.tsx:148-154`) never renders in the demo, and the small-dot branch (`r={r.tooEarly ? 3.5 : 6}`) is never drawn. The single rule the section is built around - the one ADR-007 exists for and the one the client is most likely to challenge - has never been seen on screen. | `lib/dashboard/demo.ts` SEEDS, `components/dashboard/Allocation.tsx:148-154` | **open.** Drop one demo channel below 8 leads, then re-drive the section. |
| 7 | minor | **A "too early" channel with a high rate is drawn off the top of the chart.** `maxConv` is taken from `ranked` (which excludes `tooEarly`), but `plotted` includes `tooEarly` rows. A 3-lead, 2-booking channel at 67% against a `maxConv` of 0.4 gives `cy = PAD.t + ih - (0.67/0.4)*ih`, which is negative and outside the viewBox: the dot vanishes. Unreachable in today's demo data only because of finding 6, and it is precisely the shape of channel finding 6 asks to be added. | `components/dashboard/Allocation.tsx:67-68, 264-265` | **open.** Take `maxConv` over `plotted`, or clamp `y()`. |
| 8 | minor | **Spend typed under a merged channel name is silently dropped.** `allocate()` creates the row with `slot(canonical(k))` but then reads `money[key2] \|\| money[c2.key]`, which are the same canonical key. Verified: `allocate(20 facebook_dm leads, { facebook_dm: 1000 })` returns one row `key: "facebook"` with `spend: null`, `costPerBooking: null`, and `totals.spend: 0`, `channelsWithSpend: 0`. `setChannelSpend` does not canonicalise the key it stores either. Not reachable through `SpendTable` today, which offers canonical keys - but the merge table exists because old names are still in the data, and the cost of being wrong is "add spend" shown next to a channel somebody is paying £1000 a month for. | `widget/gates/allocation.js` (`var cost = ...`), `widget/convex/routing.ts:964` | **open.** Canonicalise on write, and sum the aliases on read. |
| 9 | minor | **The "test rows not listed" footnote on Leads counts rows that are not leads.** `getWidgetData()` returns one `hidden` that is hidden leads **plus** hidden bookings **plus** hidden escalations; `leads/page.tsx` prints it under the leads table as "N test rows not listed". The exclusion count that the whole single-rule discipline exists to make honest is itself over-stated on the screen where it is printed. | `lib/dashboard/convex.ts:112-115`, `app/lead-dashboard/leads/page.tsx` footnote | **open.** Return the three counts separately. |
| 10 | minor | **`channelFacts` caps at the 1000 newest leads silently.** `take(cap)` happens before the `since` filter and nothing downstream says the window exists. Past 1000 leads, "82% of 329 leads answered inside 2 min" becomes "of 1000" with no indication it is a window rather than the business. | `widget/convex/routing.ts:1114-1120` | **open.** Return whether the cap was hit and say so on the page, as the test-row count is said. |
| 11 | minor | **One tautological assertion.** `ok("the floor is a real number", FLOOR >= 5, String(FLOOR))` imports the constant from the implementation and asserts a property of that constant. No plausible bug in `allocate()` can make it fail; only a deliberate edit to the same line's neighbour can. It is the only one in the file - the other 37 assertions in `allocation.test.ts` are genuine behaviour over hand-built fixtures with hand-computed expectations, and the quadrant and floor cases would each fail under a real bug. | `widget/tests/allocation.test.ts` ("THE FLOOR" block) | accepted if restated as "a channel at FLOOR-1 leads is tooEarly and a channel at FLOOR is not", which is the behaviour it is reaching for. |
| 12 | minor | Stale comment: `saveChannelSpend` says "The allocation section on the Overview reads this, and so does the Channels report". `channels/page.tsx` does not import `getChannelSpend` and shows no cost figure. | `app/lead-dashboard/settings/actions.ts:69-70` | **open.** Correct the comment. |

Blockers are resolved before this workstream closes. Findings 1 and 2 are
blockers because both produce a specific wrong number in front of the client,
and both are the failures research.md predicted in writing.

## Checked specifically

- [x] Every task in plan.md is implemented, or explicitly dropped with a reason
      - A1, A3, A5, A6, A7 implemented as described. **A2 implemented but its
        named test file does not exist (finding 5). A4's stated verify
        criterion is not met by the data that shipped (finding 6).**
- [x] Error paths return what architecture.md said they return
      - ADR-008's "absent, not zero" holds end to end and is asserted:
        `channelSpend` drops non-finite and non-positive values,
        `costPerBooking`/`roas`/`profitable` are `null` without spend, the
        table prints "add spend". `setChannelSpend` returns
        `{ok:false, why}` rather than throwing, and the action maps `not_a_cost`
        to a sentence. `getChannelFacts` returning null is distinguished from an
        empty week on both screens ("cannot be reached" vs "nothing yet").
        ADR-009 holds: `outcome` is the only editable field, `status` stays
        derived, and `setOutcomeMany` routes through `applyOutcome` so the two
        paths cannot drift.
- [x] No secret, key or token added to a tracked file
      - grepped the scoped files for `sk-`, assigned `api_key`/`secret`: nothing.
- [x] No debug code, commented-out block or stray console output left behind
      - no `console.`, `TODO`, `FIXME` or `debugger` in any scoped file.
- [x] Authorisation enforced where the architecture said it would be
      - `saveChannelSpend` calls `assertCanWrite()` before touching the store,
        in the action itself and not only in `proxy.ts`, which is right for a
        server action. `canWrite && !demo` gates the outcome pickers.
        `/lead-dashboard?demo=1` returned 307 to `/lead-dashboard/login`
        unauthenticated, so the gate is live.
- [ ] **Nothing described as working that was not observed working**
      - Fails. Three DoD boxes are ticked that the code does not support:
        the assertion count is not stated anywhere (Evidence above);
        "No figure on the section is a rate without its denominator" is not
        true of Channels (finding 4); and A4's "at least one too early to say"
        does not occur in the demo data (finding 6). The browser evidence is
        claimed at six widths over nine screens and this reviewer could not
        see it.

### On the two questions asked specifically

**Honest denominators.** The *new* section is clean: every rate in
`Allocation.tsx` prints `of {r.leads}` beside it, the totals strip prints
"Spend known: 4 of 15" rather than a bare profit figure, and the headline
sentence was deliberately rewritten so both halves are counted the same way.
The Channels screen it links to is not clean - findings 2 and 4 - and the
Leads screen both of them link to is counting a different universe, finding 1.

**Test-row exclusion: is it actually single?** The *rule* is. One regex set in
`lib/dashboard/test-rows.ts`, eleven call sites, and Convex deliberately holds
no opinion at all: `channelFacts` returns `sessionId`, `name` and `email` with
the comment "Enough to apply the shared test-row rule on the other side"
(`routing.ts:1098-1105, 1152`), and a grep over `widget/convex/*.ts` finds no
second copy. That discipline held and it is the best decision in this
workstream. What defeats it is finding 1: the same rule applied to two
different query results gives two different real-lead counts, 25 and 329, on
screens that link to each other. A single rule over inconsistent populations
produces the same wrong outcome as two rules.

### What's done well

- `widget/gates/allocation.js` keeps the two promises it makes. The floor and
  the no-spend-no-profit rule are both enforced in the data rather than in the
  component, and both are asserted with fixtures that would fail under a real
  bug - the `tooEarly` channel is checked as neither `best` nor `worst` *and*
  as still returned, which is the harder half.
- Spend-only channels. A channel somebody is paying for that produced zero
  leads is slotted in from the spend map and shown, with `conversion: null`
  rather than 0%. That row cannot come out of a group-by and it is the single
  most useful row on the screen.
- The `A5` audit trail tests are real behaviour: same value twice writes one
  row, same outcome with different money writes two, bulk writes one per lead,
  and every record is `direction: "note"` with no `idempotencyKey` so the
  sending path can never text an audit entry to a customer. That last
  assertion is the kind nobody writes until it has happened once.
- `tsconfig.check.json` is the honest half of this workstream. Discovering
  that a gate written into three plans had never once run, and that
  `tsconfig.json` excludes `widget` so the entire Convex backend was unchecked,
  is worth more than the feature. The `skipLibCheck: false` reasoning is
  correct and the "teeth proven by querying a table that does not exist" check
  is the right instinct.
- `run.sh` refusing to run under bash rather than printing "every suite
  passed" having run nothing.

## What was not verified

- **Everything user-visible.** The dashboard is behind auth and
  `GET /lead-dashboard?demo=1` on the running dev server returned
  `307 -> /lead-dashboard/login`. I did not drive the Allocation section, the
  Channels screen, the spend input on Settings, or the outcome picker on a
  conversation, at any width, in any theme. Every browser claim in plan.md -
  the six widths, the nine screens, the "32 tap targets under 32px, now 1",
  the 390px fixes - is the author's own and is unconfirmed by this review.
  To verify: a dashboard session cookie, then Playwright or DevTools over
  `/lead-dashboard?demo=1` and `/lead-dashboard/channels?demo=1`.
- **Anything against live Convex data.** I ran no Convex query and made no
  network call to `cool-ferret-103`. All figures quoted above are computed
  from `lib/dashboard/demo.ts` through the real `allocate()`, or read off the
  source. In particular I could not check whether the live deployment has more
  than 25 leads - finding 1 is a reading of the code, and its *severity* on
  live data depends on a count I do not have. If the client has fewer than 25
  real leads the disagreement is currently invisible; it still ships.
- **The before-counts for the test suite.** Nothing in this folder records
  what the suite counted before this workstream, and there is no git history
  here to recover it from, so "no new skips" and "no regression" are
  unprovable from this session. 1042/0 is recorded above as the new baseline.
- **A6 on live data.** "the value survives a reload" needs a real lead and a
  session; I confirmed only that the `!demo && thread` gate described in A6 is
  the shape the task says it is.
- **`npm run embed:verify`, Retell and OpenRouter** were not run, by
  instruction.

---

## Author's response, 2026-11-16

The verdict stands as written. What has changed since:

**Blocker 1, the population, is fixed.** `functions:recent` was a hard
`.take(25)` and is now `DASHBOARD_LIMIT = 1000`, matching the 1000 the
Channels screen already asked for, with a caller-supplied limit clamped to
that ceiling rather than removed. It is still a ceiling: an unbounded query
is a page that gets slower every week and then fails blank.

The reviewer is right that this was invisible to every browser pass that came
before it. All of them ran `?demo=1`, and demo mode calls `demoLeads()` and
never reaches this query. A screen can be driven, screenshotted and looked at
and still be measured over a population the real one never has.

`widget/tests/dashboard-population.test.ts`, 9 assertions, covers the
default, the ceiling, the clamp, the ordering, and bookings and escalations
being capped the same way.

**Blocker 2, the floor, is fixed**, and was slightly wider than reported. The
headline filtered `leads > 0` for `best` and `leads >= 2` for `worst`, so a
channel with a single lead and a single booking could be announced as the
best thing the client has. Both ends now use `FLOOR`, imported from
`widget/gates/allocation.js` rather than retyped, which is what let the two
numbers drift apart in the first place.

**The four majors are open** and are recorded as such, not quietly closed:
the "costing you" quadrant over `spend: null`, the three rates still without
denominators, the missing `widget/tests/spend.test.ts`, and A4's `tooEarly`
state never being reachable on the demo data that is used to look at it.

Gates after the two fixes: `tsc --noEmit` clean, `tsc -p tsconfig.check.json`
clean, `eslint components app lib widget/gates` clean, `zsh tests/run.sh`
every suite passed, `npm run build` compiled successfully.
