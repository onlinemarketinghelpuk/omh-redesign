Add notes to a lead, a service and package dropdown that prefills the revenue
figure when a lead is marked won, and make the per-channel insights page
findable.

## Where you are

Project root: `/Users/rafiulislam/Work/n8n/OHM/website`

A Next.js 16 marketing site plus an internal lead dashboard for Online
Marketing Help, a UK digital marketing agency. Behind it: Convex as the
database and the clock (`widget/convex/`), n8n on srv1836598 as the automation
brain (`widget/n8n/`), Retell for voice, and a suite of roughly 2227 assertions
run by `zsh widget/tests/run.sh`.

**Read this first, completely, before writing anything:**

`docs/engineering/017-notes-revenue-on-a-win-and-one-insights-page/plan.md`

It contains the nine tasks, three traps in the price list that will bite you,
and three open questions that are Rafiul's to answer, not yours to assume.

Its most important section is **"What already exists, checked against the code
rather than assumed"**. Two of the three things requested are largely built.
The per-channel insights page with revenue and a drill-through to the leads
behind each channel is finished work from workstream 007. Do not rebuild it.
If you find yourself writing a new insights page, you have misread the plan.

Then read, in this order:

1. `components/dashboard/OutcomePicker.tsx` in full, including the comments.
   Three properties are deliberate and must survive your change: five fixed
   outcomes, a value asked for only on a win, and saving on choosing with no
   second button.
2. `lib/content/price-list.ts`. The client's own live prices, copied verbatim,
   with a comment saying the figures must not be edited. Your catalogue derives
   from this file. Never retype a number out of it.
3. `widget/convex/schema.ts`, the `leads` table, in particular the block of
   comments under "What came of it" explaining why `outcome` and `valueGbp`
   exist and who is allowed to set them.
4. `app/lead-dashboard/leads/actions.ts` and `setOutcome` / `applyOutcome` in
   `widget/convex/routing.ts`, the whole write path.
5. `app/lead-dashboard/channels/page.tsx`, enough of it to see that the money
   is already summed per channel and that the channel name is already a link.
6. `docs/engineering/007-drill-through-from-a-channel-to-the-leads-it-pro/plan.md`,
   so you do not undo its task 4 drift guard.
7. `docs/design-rules.md`, before touching any layout, as `AGENTS.md` requires.

## How to work

Forge is set up on this project: plan before code, evidence before done.
Tick each task off in `plan.md` as it passes. Tests before the code they cover,
and watched failing first. A test that has never failed is not evidence.

Start by asking Rafiul the three open questions at the foot of the plan. Task 4
is blocked on the first one and every revenue figure on the dashboard depends
on the answer. Tasks 1, 2 and 3 are not blocked, so get those done while you
wait rather than guessing.

## Standing constraints

- **No deploy, no push, no `git push`, no workflow set `active`, no SMS, no real
  email and no paid API call without Rafiul's typed approval.** Local commits
  and drafts only.
- Convex is `cool-ferret-103`, still a **dev** deployment. Deploy keys are per
  project and the wrong key writes to the wrong client's database. The ordering
  rule from `DEPLOY-NOTE.md`: Convex before the site.
- `widget/n8n/*.json` stays gitignored. The Convex secret is in those files many
  times.
- Test rows: every figure on every screen excludes OMH's own test traffic, and
  the rule lives in one place, `lib/dashboard/test-rows.ts`. Do not add a second
  copy.
- `?demo=1` never reaches the Convex query, so demo mode renders a perfect page
  over a dead backend. Verify on real data. A `take(25)` bug survived several
  browser passes inside exactly that blind spot.
- The whole `ui-ux-pro-max` skill applies to anything visual, including
  rendering the page in Playwright and looking at it before calling it done.
