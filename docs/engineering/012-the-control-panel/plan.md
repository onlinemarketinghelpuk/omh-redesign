# Plan

The owner decides what happens to every lead; the system keeps the legal
envelope. Design and audit are in `README.md` beside this file. This is the
order it is built in, and what each task is proven by.

Run unattended (nostop) on 2026-11-16. Decisions taken without Rafiul are in
`LEDGER.md` beside this file, and every one of them can be reversed.

Baseline before any change: `zsh widget/tests/run.sh`, 33 suites, every suite
passed, 1442 assertions.

## Before any of it

- [x] 0a. Verify `v2/create-phone-call` against Retell's current docs.
- [ ] 0b. UK long-code number imported into Retell by SIP. **Blocked:**
      needs a Twilio account and a purchase.
- [ ] 0c. The five open questions in README section 9. **Blocked:** client
      meeting. Stages 6 and 7 wait on them; 2 to 4 and 8 do not.

## Found on the way, fixed

- [x] F3. **Route H had no templates.** `h_email_day_before` and
      `h_sms_same_day` did not exist in `templates.ts`, so every reminder
      that fell due threw in `render`, the sequence was marked
      `render_failed`, and nobody was ever reminded. Found by the flows
      suite's assertion that every route key has a template. Templates
      written; the appointment time now comes from the sequence's anchor.
      `booking-reminder.test.ts`: 13 passed 7 failed before, 20 passed after.
- [x] F4. **A lead still on route B who booked got no reminders.**
      `remindAbout` cleared route H only, so `enrol` refused H as
      `already_active`. Booking now stops the chase with the reason the
      engine would have given at its next claim, `booked`.

- [x] F5. **Route F never sent its opening text.** `enrol` asked for the
      first step strictly after `now`, and F's opener is due AT enrolment,
      so it was skipped: every reactivation contact began with the "second
      and last" text, five days late. And had it been sent, a delay under an
      hour skipped quiet hours, so a batch started at 23:00 would have texted
      at 23:00 although the route's own comment promises 08:00. Enrol now
      floors at `now - 1`; marketing steps always pass through quiet hours.
      `routes.test.ts`: 5 new assertions, the 08:00 one failing before.

## Stage 2: the model, the compiler, the validator, the property

- [x] 1. `widget/gates/flows.js`: triggers and their basis (not editable),
      the palette per basis, `validateFlow`, `compileFlow` to the `Route`
      shape, `routeToNodes` to load today's routes as editable flows,
      `describeFlow` for the live sentence. Plain JS, no imports, one export
      line. Tests first: `widget/tests/flows.test.ts`.
- [x] 2. `widget/gates/message-text.js`: variables, rendering a stored
      message, the opt-out appended on marketing and impossible to remove,
      SMS segment counting (GSM-7 and UCS-2), `validateMessage`. Tests first:
      `widget/tests/message-text.test.ts`.
- [x] 3. `routes.ts` gains `nextStepIn(route, ...)` working on a Route
      object; `nextStep` delegates. No behaviour change, proven by the
      existing 46 assertions unchanged.
- [x] 4. Schema: `flows`, `flowVersions`, `messageTemplates`,
      `messageHistory`; `sequences` gains `flowId` and `flowVersion`.
- [x] 5. `convex/flows.ts`: `saveFlow` (validates server side, derives the
      basis itself, refuses with the rule's own words, one live flow per
      trigger), `setFlowStatus`, `listFlows`, `flowHistory`, `saveMessage`,
      `listMessages`. Tests first: `widget/tests/control-panel.test.ts`.
- [x] 6. The engine reads the live flow: `enrol` picks the live flow for
      the lead's channel when the caller asked for that channel's default
      route; the sequence carries the version; `claimDue` and
      `completeStep` resolve the route from the stored version; a stored
      message overrides the code template, the code template is the
      fallback. Re-validates at enrol, so a row written round the
      validator still cannot dial.
- [x] 7. THE PROPERTY OVER SAVED FLOWS: for every flow in the store, if
      marketing then no step has `channel: "call"`. Asserted after a battery
      of hostile saves, and asserted at enrolment over a row inserted
      directly. Teeth proven by breaking the validator and watching it fail.
- [x] 8. HTTP routes for the dashboard, and `channel-coverage` style
      assertion that every path the dashboard calls exists.

## Stage 3: Control Panel screen (`/lead-dashboard/control`)

- [x] 9. One row per channel, the fifteen in `SOURCE_ORDER`: flow, who
      answers replies, live. Kill switch at the top, unchanged.
- [x] 10. Edit in place: choose a flow, pause or resume it, load the code
      default as an editable flow. Server actions behind `assertCanWrite`.

## Stage 4: Messages screen (`/lead-dashboard/messages`)

- [x] 11. Every message, editable; variable chips; live segment count with
      cost; preview with realistic data; the opt-out shown greyed on
      marketing messages, "added automatically"; history with who and when.

## Stage 5: Flow Builder (`/lead-dashboard/flows/[id]`)

- [x] 12. Four node types, one line, palette filtered by basis (Call
      absent on marketing), quiet hours as a band, live sentence beside it,
      server refusal shown in its own words.

## Stage 8: Sequences shows flow and step

- [x] 13. "On flow X v3, step 3 of 6, next at 18:00".

## Stages 6 and 7

- [x] 14. **The Brain (Replies screen), sales-focused.** Master switch;
      per channel, one of four policies; a sales brief (goal, offer, notes)
      the assistant answers with: answer first, explain, ask for the
      booking, stop after one no, and the never-guess rule LAST. Decided in
      Convex by `gates/brain.js` (`/brain/decide`), carried out in n8n:
      09-twilio-inbound asks the Brain, then either the assistant answers
      (ohm-chat, with the brief, accepted only with the server token) or the
      reply goes to Needs a person. Test console runs the same gate, free.
      `brain.test.ts` 53 assertions.
- [x] 14b. **The calling agent (Retell), booking-focused.** UK number only,
      calling hours (default Mon to Fri 9 to 5, never outside 8 to 8),
      opening line and goal per call. Engine: no number skips the call step
      (it used to fail three times and kill the sequence); outside hours the
      call waits for the next window. The worker sends from_number from
      Convex, an idempotency key, and the opening/goal as Retell dynamic
      variables. Retell events now mark an outbound call answered or not,
      which is what lets "a text saying we tried" fire. Outbound agent:
      `widget/retell/prompt-outbound.md` + `create-outbound-agent.py`, same
      tools as the site voice agent. `agent.test.ts` 47 assertions.
- [x] 14c. **Drag and drop** in the builder: drag a step by its handle, or
      drag Send / Wait / Stop-if from the palette into the line. Arrows stay
      for keyboard and phone.
- [x] 14d. **One page per channel** (`/lead-dashboard/control/[channel]`):
      steps, builder, every message's words, who answers replies, calls, and
      the people on it. The Control panel is a short list.

## Proof

- [x] 15. Full suite, `tsc --noEmit`, `tsc -p tsconfig.check.json`,
      eslint, `npm run build`, and the new screens driven in a real browser
      both in demo mode and without it.

## Evidence, 2026-11-16

| Check | Result |
|---|---|
| `zsh widget/tests/run.sh` | every suite passed: 36 suites, 1813 assertions (baseline 33 and 1442) |
| `npx tsc --noEmit` | clean |
| `npx tsc -p tsconfig.check.json` | clean, including the engine rewiring |
| `npx eslint components app lib widget/gates` | clean |
| `npm run build` | compiled; `/lead-dashboard/control`, `/messages`, `/flows/[id]` built |
| Teeth | PECR refusal disabled: 8 failures in flows.test; opt-out append disabled: 5 in message-text.test; saveFlow refusal skipped: 8 in control-panel.test; runtime trusting the stored `compiled`: the smuggled marketing flow DIALS (`got 1 want 0`). All restored and green. |
| Browser, real write path | Production build on :3011 pointed at a local stand-in for the Convex HTTP door that runs the REAL `convex/flows.ts` and `convex/routing.ts` handlers over the test mock. 33 checks passed: make editable, switch on (v2 in the store), turning it into a reactivation flow shows no Call button, the PECR rule on the step and changes nothing stored; a message edited and saved with history; the opt-out shown "added automatically" and absent from the text box; an enrolment runs the flow in the owner's words and Follow-ups reads "Your flow, version 2"; no sideways scroll at 390px on all three screens; no console errors. |
| Browser, live deployment, read only | On Rafiul's dev server (:3000) outside demo mode: Control panel and Messages both say the store cannot be reached, which is true until the functions are deployed. Demo mode renders all three screens and Follow-ups. |

Two layout faults were found by the phone-width check and fixed: the
Control panel's grid track grew to the table's width (1002px on a 390px
phone), and the builder's message select took the width of its longest
option (498px).

## Not done, and why

- **Not deployed.** The new schema and functions are not on
  `cool-ferret-103`. Until `npx convex deploy` (or `convex dev`) is run, the
  two new screens say "cannot be reached" outside demo mode and the engine
  behaves exactly as before. Deploying is Rafiul's call.
- **Stages 6 and 7** (the Brain, the Outbound Agent): built in the second
  pass below. What still waits: the UK number, `create-outbound-agent.py`,
  and pushing the four n8n workflows.
- **Not committed.** The website repo already held uncommitted work from
  earlier workstreams in several of the same files; see LEDGER.md.

## Evidence, second pass (Brain, calling agent, drag and drop)

| Check | Result |
|---|---|
| `zsh widget/tests/run.sh` | every suite passed: 38 suites, 1937 assertions |
| Teeth | "unsure hands over" removed: 2 failures; never-guess moved first: 2; no-number skip removed: 2. Restored, green. |
| `tsc`, strict Convex check, eslint, `npm run build` | clean |
| n8n | `build-workflows.py` run locally; code-nodes 64, channel-coverage 74, voice-call 20 pass. NOT pushed. |
| Browser | Replies: per-channel policy, test console, sales brief, save to store; Convex decides the same on a real request. Calling agent: "OMH" refused with the reason, UK number saved normalised. Channel page carries both. Drag and drop: insert from palette, move to end, move back. No sideways scroll at 390px. |
