Build the OMH Control Panel.

## Where you are

Project root: `/Users/rafiulislam/Work/n8n/OHM/website`

This is a Next.js 16 marketing site plus an internal lead dashboard for
Online Marketing Help, a UK digital marketing agency. Behind it: Convex as
the database and the clock (`widget/convex/`), n8n on srv1836598 as the
automation brain (`widget/n8n/`), and a test suite of roughly 1100
assertions run by `zsh widget/tests/run.sh`.

**Read `docs/engineering/012-the-control-panel/README.md` first, completely,
before writing anything.** It is the audit and the plan: what exists, what is
broken, the design, the data model, the six screens, the build order and the
open questions. This prompt is the operating instructions around it, not a
replacement for it.

Then read, in this order:

1. `docs/engineering/README.md` and the most recent numbered workstreams,
   to see how work is recorded here
2. `widget/gates/routes.ts` and `widget/tests/routes.test.ts`
3. `widget/convex/routing.ts` (enrol, claimDue, completeStep)
4. `widget/gates/templates.ts`
5. `app/lead-dashboard/settings/page.tsx` and
   `components/dashboard/KillSwitch.tsx`, which are the existing pattern for
   a dashboard screen that writes

## What you are building

An owner-facing control panel so the client decides what happens to every
lead: which channels get which messages, how many, in what order, what they
say, who answers the replies, and when a person takes over from the
assistant. Six screens, three new Convex tables, a flow compiler and a
validator. The README has all of it.

## The one thing you must not get wrong

`widget/gates/routes.ts` holds the routes as code, and
`widget/tests/routes.test.ts` asserts a property over them: a `call` step
exists **only** in routes B and E, the two where the person contacted us
first, and the only marketing route is F. Therefore no marketing route can
dial. That is not a setting or a flag. It is the absence of data.

It exists because of PECR regulation 19: an automated marketing call needs
consent that specifically covers automated calls. The ICO's largest fines
under PECR are for exactly this.

A visual flow builder that lets the owner drop a Call node anywhere destroys
that guarantee. The resolution, which the README sets out in full and which
you must implement rather than redesign:

- the legal basis belongs to the trigger, not the flow, and the owner cannot
  edit it
- on a marketing flow the Call node is **absent from the palette**, not
  disabled
- **the refusal is server-side in Convex**, not in the UI, and rejects the
  whole flow whatever produced it
- the rejection names the actual rule, not "not permitted"
- `routes.test.ts`'s property is re-asserted over **saved flows**, not only
  over the code

If a change would turn that property into a checkbox, that change is the
mistake, not the thing it enables. Say so and stop rather than building it.

## How work is done here

- **Forge.** There is a `.forge/` directory. Write `plan.md` in a new
  numbered folder under `docs/engineering/` before product code, tick tasks
  as they pass, and record evidence from real runs. No product code before
  the plan has tasks.
- **Tests before the code they cover, watched failing first.** Then prove
  the test has teeth: break the code deliberately, confirm the assertion
  fails, restore. A test that has never failed is not evidence.
- **The gates pattern.** Logic that runs both in tests and inside an n8n Code
  node lives in `widget/gates/*.js` as plain JavaScript with no imports and a
  **single-line export statement** (`gate_inline()` strips only lines
  starting with `export {`). The test imports the same file the workflow
  runs, so the two cannot drift.
- **n8n is generated, never edited in the UI.** Change
  `widget/n8n/build-workflows.py`, run it, then `push.py`. `push.py` matches
  by name, so a renamed workflow creates a duplicate.
- **Convex returns raw facts; the dashboard filters and totals.** The rule
  for what counts as our own test traffic lives in exactly one place,
  `lib/dashboard/test-rows.ts`. Do not add a second opinion in Convex.

## Traps that have already cost time in this codebase

1. **`zsh widget/tests/run.sh`, not bash.** Under bash the loop body is a
   syntax error, every suite is skipped and it prints "every suite passed"
   having run nothing. The script refuses bash for this reason; do not work
   around it.
2. **`?demo=1` bypasses the real data path entirely.** A `take(25)` bug sat
   on the Leads screen through several browser passes because every one of
   them ran in demo mode, which calls `demoLeads()` and never reaches the
   query. Verify anything data-shaped **without** demo mode.
3. **`.env.local` lives in `OHM/widget/`, not `OHM/website/widget/`.**
   `widget/n8n` is a symlink to `website/widget/n8n`, same inode.
4. **The n8n MCP server points at srv1236458. The workflows are on
   srv1836598.** A credential created through MCP has an id this instance
   does not know, and the node then runs unauthenticated and silently. Use
   the REST API with the key in `.env.local`.
5. **Convex cannot index into an array.** `visitorIds` and `psids` are
   matched by scanning recent leads, deliberately.
6. **An import cycle in Convex does not fail loudly.** It surfaces as
   `v.optional(undefined)` and `Cannot read properties of undefined (reading
   'asOptional')`, naming neither file. The rate limits live in
   `convex/limits.ts` for exactly this reason.
7. **Read n8n's execution log when something looks fine but is not.** Voice
   had been dead for four days because Retell switched off
   `v2/create-web-call` and returned a warning-shaped body. The log said so;
   nothing else did.

## Standing constraints, which are not yours to waive

- **No push, no deploy, no `git push`, no setting an n8n workflow active, no
  SMS, no real email, and no paid API call without Rafiul's typed approval.**
  Build locally, test locally, then ask. This includes `npm audit fix
  --force` and anything that changes the live instance.
- Convex is still the **dev** deployment (`cool-ferret-103`). Moving it to
  production is Rafiul's decision and is listed as stage 1 in the README's
  build order. Do not do it yourself.
- `widget/n8n/` and `OHM/retell/` stay out of git: the Convex secret is in
  those files many times over.
- Never put a GitHub token on a command line.

## Before you start building

Three things in the README's build order come before stage 2, and two of them
are questions rather than code:

1. Verify `https://api.retellai.com/v2/create-phone-call` against Retell's
   current API. Its sibling `v2/create-web-call` was switched off without a
   grace period and failed silently for days. Check the docs; do not place a
   test call without approval.
2. The outbound call step currently has `from_number:
   'TWILIO_NUMBER_PENDING'`. There is no number, so outbound calling has
   never run. It must be a UK domestic long code imported into Retell by SIP;
   an alphanumeric sender ID cannot receive a reply, which would break every
   route built on the lead replying.
3. Ask Rafiul the five open questions at the end of the README before
   building the Brain or the Outbound Agent screens. Two of them change the
   design: who the owner is by name, and whether the client holds per-person
   consent evidence for reactivation.

## Where to start

Stage 2 in the README: the `flows` and `messages` schema, the compiler from a
flow to the `Route` shape, the validator, and the compliance test over saved
flows. Stages 3 and 4, the Control Panel and Messages screens, are where most
of the value lands and neither needs the canvas to exist.

Ship each stage so it works on its own. An owner who can change what the
messages say and who answers them has most of what they asked for before the
flow builder is written.
