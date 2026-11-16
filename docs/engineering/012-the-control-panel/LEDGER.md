# Run ledger, 2026-11-16 (nostop)

The `nostop` CLI is not installed on this machine, so the ledger is kept by
hand here. Decisions are taken on Rafiul's behalf and can be reversed.

## Decisions

- D1. **Plan lives in 012, not a new folder.** `.forge/active` already points
  at `012-the-control-panel` and the README is there; a 013 would split one
  workstream across two folders.
- D2. **`messageTemplates`, not `messages`.** The README's table name is
  already taken: `messages` holds every chat message. Renaming the new one
  costs nothing; renaming the old one is a migration over live data.
- D3. **Four new tables, not three.** `messageHistory` added, append-only,
  because the README asks for "a history of changes, with who and when" on
  messages and gives it no table.
- D4. **`flowVersions` holds every version, including the current one,**
  with its compiled route. The README says "every save writes the previous
  one"; storing all of them means a sequence on version 3 reads version 3
  from one index and never has to ask whether 3 is the current row or a
  past one.
- D5. **No seeding mutation.** A channel with no flow shows the route from
  code, labelled "Default (from code)", and offers "Make editable", which
  turns that route into a draft flow. Same first impression the README asks
  for, and nothing has to be run against the deployment to get it.
- D6. **A flow replaces a channel's DEFAULT route only.** The router already
  passes `route`; when it equals the default route for the lead's channel,
  the live flow for that channel is used. When the caller asked for anything
  else (G for a no-show, H for a reminder, an explicit override) the caller
  is obeyed. No n8n change is needed.
- D7. **Marketing is the stricter of the two.** If the requested route is
  marketing and the live flow is not, the flow is not used.
- D8. **Waits are measured from enrolment, because that is what the Route
  shape can express.** "After" waits accumulate; "at a time of day" waits
  name a day and hour. An "after" wait cannot follow an "at" wait, and the
  validator says so in words.
- D9. **Stop-if compiles to the `no_reply` gate.** The engine already stops
  every sequence on a reply, a booking or an opt-out regardless of gate, so
  the conditions are recorded and shown but do not change behaviour. Saying
  otherwise on screen would be a promise the engine does not keep.
- D10. **At most 8 sends per flow; a warning from 6.** The README's "a
  panel that makes it easy to add a seventh text should make it obvious
  opt-outs rise".
- D11. **Messenger is a Send channel only when every trigger is a Meta
  channel.** It exists for routes C and D; on a website form it has nowhere
  to go.
- D12. **Marketing flows send nothing inline.** Every send is queued so
  quiet hours apply to the first one, the way route F behaves today.

- D13. **Cost is shown as a multiple, not in pounds.** "2 texts joined, so
  it costs twice a single text." The README asks for the cost; a pound figure
  would be a Twilio price typed from memory, and a wrong price on the screen
  is worse than an exact multiple.
- D14. **Editable messages are derived from the code templates**, rendered
  with stand-in values and turned back into {{variables}}, so there is no
  second hand-written copy. Saved unchanged, every one sends exactly what the
  code sends (asserted). Route B's first email loses its "You said: ..."
  quote in the editable version, because a variable cannot carry "if".
- D15. **No `by_trigger` index.** Convex cannot index into an array (trap
  5); live flows are a handful, so `by_status` is scanned.
- D16. **"Who answers replies" is not a control yet.** A setting that
  nothing reads would be a promise the engine does not keep. The Control
  Panel says so and says what it waits on (README questions 1 and 4).
- D17. **The runtime never trusts a stored row.** Every flow is recompiled
  from its nodes and triggers by the same gate each time the engine reads
  it; the stored `compiled` is a record, never run. Proven by the teeth test.
- D18. **`_generated/api.d.ts` edited by hand** to register `flows` and
  `flowRuntime`, in the generator's own format. The only regenerator is
  `npx convex dev`, which deploys to the live deployment.
- D19. **Nothing committed.** The website repo had uncommitted changes from
  earlier workstreams (the 011 form hand-over among them) in files this run
  also edited, so a commit would mix the two. Left in the working tree.
- D20. **Make editable copies the default onto every channel that shares
  it** and has no live flow, so one flow serves them all, as the code does
  today. The owner can untick channels in the builder.

- D21. **Retell is the voice agent; n8n is the automation brain** (Rafiul,
  2026-11-16). Text replies are decided in Convex and answered through
  n8n's ohm-chat; outbound calls are a Retell agent dialled by the worker.
- D22. **Intent by word rules, not a model.** Free per reply, never times
  out, and "unsure" goes to a person, which the README asks for anyway.
- D23. **Default reply policy is "assistant answers"**, which is what every
  text reply got before. Nothing changes until the owner changes it.
- D24. **A hand-over goes to Needs a person** (the existing queue), answering
  README question 4 with the screen that already exists.
- D25. **Calling hours default Mon to Fri, 9 to 5** (README question 3),
  never outside 8am to 8pm whatever is typed.
- D26. **The sales brief is only honoured with the server token.** ohm-chat
  is a public webhook; a brief from a stranger would be somebody else's
  instructions.
- D27. **No outbound agent id yet means no override**, so a placeholder can
  never fail every call; Retell uses the agent bound to the number.
- D28. Not answered by tonight's defaults: who the owner is by name (Q1),
  per-person consent evidence for reactivation (Q2: route F still demands
  recorded consent per send, as before), campaign-level flows (Q5: not
  built, one flow per channel).

## Skipped (needs Rafiul)

- S1. Convex deploy of the new schema and functions to `cool-ferret-103`.
  It is the live deployment. Without it the new screens show "cannot be
  reached" outside demo mode, which is the honest state.
- S2. Moving Convex to production (stage 1). Rafiul's decision.
- S3. Push, and `push.py` for the n8n changes (09 inbound, 01 chat, 08
  worker, 03 events). Built locally only.
- S4. `python3 widget/retell/create-outbound-agent.py`: creates the agent in
  the Retell account. Then rebuild the workflows and push.
- S5. Importing the UK number into Retell and saving it on the Calling
  agent screen.

## Blocked

- B1. UK long-code number for Retell (stage 7). Needs a Twilio purchase.
- B2. Stages 6 and 7 screens: the five open questions in README section 9.

## Findings

- F1. Retell `POST /v2/create-phone-call` is current in Retell's API
  reference (spec revision 2026-11-15) with no deprecation notice, and the
  only deprecation notice published names `create-web-call` alone. Checked
  2026-11-16 from the docs; no call placed.
- F2. The same reference offers `idempotency_key` on create-phone-call
  (safe retry for an hour). Our call node does not send one. A worker that
  rings, dies before `completeStep` and is re-claimed could dial twice.
- F3 to F5: three bugs fixed, see plan.md "Found on the way". F5 is the
  serious one: every reactivation campaign's first contact was its "second
  and last" text, five days late.
- F6. Route B's first text is already 230 characters, so as written it is
  two segments and every first text costs double. Not changed: the words are
  the client's decision, and the Messages screen now shows it.
- F7. The dashboard renders two nested `<main>` elements (layout and
  Shell). Pre-existing, not fixed tonight; a screen reader announces two
  main landmarks.
