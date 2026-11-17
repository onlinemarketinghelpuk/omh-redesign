Build the dashboard assistant: a thing the owner talks to that already knows
what is on his screen, can answer any question about his business from the real
data, and can draft a reply or set an outcome for him to confirm.

## Where you are

Project root: `/Users/rafiulislam/Work/n8n/OHM/website`

A Next.js 16 marketing site plus an internal lead dashboard for Online
Marketing Help, a UK digital marketing agency. Behind it: Convex as the
database and the clock (`widget/convex/`), n8n on srv1836598 as the automation
brain (`widget/n8n/`), Retell for voice, and a suite of roughly 2250
assertions run by `zsh widget/tests/run.sh`.

**Read this first, completely, before writing anything:**

`docs/engineering/018-an-assistant-that-knows-the-whole-system/plan.md`

It has five phases, six architectural decisions with the reason for each, and
four open questions. **Question 1 blocks phase A3 and therefore everything
after it.** Ask Rafiul all four before you start, then do the parts that are
not blocked while you wait.

Two sections of that plan matter more than the rest. Read them twice:

- **"The one thing to get right"**: nothing the assistant decides reaches a
  customer without a press. Spoken "send" fills the box and focuses the button.
  It does not press it.
- **"The second thing to get right"**: every figure comes from a tool call,
  never from the model. The assistant and the dashboard must not be able to
  disagree, and test A2 is what guarantees it.

Then read, in this order:

1. `docs/tone-of-voice.md`. OMH's own staff guide, written by Melissa and
   transcribed unchanged. The system prompt is built from it. Do not improve
   it or substitute your own taste.
2. `lib/dashboard/test-rows.ts`. The single place OMH's own test traffic is
   excluded. The Channels screen hides 8 of 10 rows today. Every read tool goes
   through this file. There must not be a second copy.
3. `lib/dashboard/auth.ts`, in particular `assertCanWrite`. It gates every
   server action and it gates the assistant route before a single token.
4. `app/lead-dashboard/handover/actions.ts`, specifically `sendReply`. This is
   how a human replies to a customer today, and it is the only way the
   assistant's draft may ever reach one.
5. `app/lead-dashboard/leads/actions.ts`: `setLeadOutcome`, `addLeadNote`.
6. `widget/gates/message-text.js`, `validateMessage`. Every customer-facing
   word this system produces passes it. A drafted reply is not an exception.
7. `lib/dashboard/screens.ts`. `SCREENS` and `TABS`. The surface descriptor in
   phase B lives alongside these, and `screens.test.ts` asserts this file
   matches what each page declares, so adding to it without the test is drift.
8. `widget/convex/routing.ts`, enough to see `checkSendable`, the suppression
   table and the kill switch, so you understand what you must not route around.
9. `docs/design-rules.md`, before touching any layout, as `AGENTS.md` requires.

## Two things that will surprise you

- **There is no LLM call anywhere in this website today.** The customer-facing
  chat brain is an n8n workflow calling OpenRouter. The assistant route would
  be the first one in the Next.js app, which is exactly why open question 1
  exists and why it is Rafiul's to answer, not yours to assume.
- **`?demo=1` never reaches the Convex query.** Demo mode renders a perfect
  page over a completely dead backend. A `take(25)` bug survived several
  browser passes inside that blind spot. Verify on real data. In demo mode the
  assistant gets example data and **no write tools at all**, and says so.

## How to work

Forge is set up here: plan before code, evidence before done. Tick each task
off in `plan.md` as it passes. Tests before the code they cover, watched
failing first. A test that has never failed is not evidence.

Ship phase by phase. Each phase is useful on its own; that was the test used to
split them. Do not start phase C because phase B went well.

## Standing constraints

- **No deploy, no push, no `git push`, no workflow set `active`, no SMS, no real
  email and no paid API call without Rafiul's typed approval.** An LLM call is
  a paid API call. Local commits and drafts only.
- Convex is `cool-ferret-103`, still a **dev** deployment. Deploy keys are per
  project and the wrong key writes to another client's database. Ordering rule
  from `DEPLOY-NOTE.md`: Convex before the site.
- `widget/n8n/*.json` stays gitignored. The Convex secret is in those files
  many times.
- The whole `ui-ux-pro-max` skill applies to the panel, the dock and the
  avatar, including rendering in Playwright and looking at it before calling
  anything done.
- Workstream 017 (lead notes, the service catalogue, the revenue box) is in
  flight in another session and touches `app/lead-dashboard/leads/actions.ts`.
  Check what is there before you edit that file.
