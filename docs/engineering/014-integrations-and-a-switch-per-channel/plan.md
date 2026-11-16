# Integrations, and a switch per channel

Two things the owner asked for that do not exist:

1. One place that shows every channel, whether it is actually connected, and
   what is missing if it is not.
2. A switch per channel, so they can say "not this one, not right now",
   without turning everything off and without deleting a flow.

## What exists today, and why neither of these is it

| | What it does | Why it is not this |
|---|---|---|
| The kill switch, `outboundEnabled` | stops **everything** | all or nothing |
| Flow status, live / paused / draft | pauses one saved flow | a channel with no saved flow falls back to the route in the code, so pausing a flow does not stop the channel |
| The Control panel's channel rows | what each channel *does* | says nothing about whether the plumbing behind it is connected |
| Settings | the kill switch and costs | not per channel |

So a channel can be fully configured, have no credentials behind it, and read
as healthy. Today that is every channel except chat and voice.

## The one thing to get right

**Connected is measured, never declared.** The temptation is a `connected:
true` field somebody sets when they finish wiring a channel. That field is
wrong the moment a token expires, and it is wrong in the most expensive
direction: the screen says the channel is live while leads fall on the floor.
Voice was dead for four days under exactly this kind of assumption.

So every row on this screen is derived at request time from the thing that
actually decides:

| Channel | Connected means |
|---|---|
| Website chat | the n8n `Chat` workflow is active |
| Website voice | the `Voice` workflow is active **and** Retell's API answers for the agent |
| Website form, Google Ads landing page | `OHM_LEAD_ROUTER_URL` is set **and** the `Lead Router` workflow is active |
| Google Ads lead forms | the above, plus `GOOGLE_LEAD_FORM_KEY` is a real value |
| Text messages, missed calls | `TWILIO_CRED_ID` and `TWILIO_FROM_NUMBER` are real, and `Twilio Inbound` is active |
| Outbound calls | the above, plus a number imported into Retell, plus the outbound agent exists |
| Email follow-ups | `MAIL_FROM` and `SMTP_CRED_ID` are set |
| Email replies | `IMAP_CRED_ID` is real and `Email Inbound` is active |
| Facebook, Instagram | `META_PAGE_TOKEN` and `META_APP_SECRET` are real and `Meta` is active |
| Appointments | `GOOGLE_BOOKING_WEBHOOK` answers |

A placeholder such as `TWILIO_NUMBER_PENDING` counts as not set. That is the
whole point: eight of them are placeholders today and the screen should say so
in those words.

## The second thing to get right

**The per-channel switch is enforced in Convex, not in the UI.** `enrol`
refuses a channel that is switched off, with a reason, the same way it already
refuses a suppressed person and a disabled kill switch. A switch that only
hides a button is not a switch: the router would carry on enrolling, the
sequence board would fill, and the owner would believe they had stopped
something they had not.

Off means **no new enrolments**. People already on a sequence for that channel
keep theirs, because silently abandoning somebody mid-conversation is worse
than finishing. The screen says that in a line, and offers stopping them as a
separate, deliberate action.

## What this screen is not

**It is not a form for pasting credentials.** n8n owns the Twilio, SMTP and
IMAP credentials, and an n8n node references them by an id that only n8n can
mint. A token typed into a web page cannot become one. Pretending otherwise
would produce a screen that accepts a token and changes nothing, which is
worse than a screen that says plainly: here is what is missing, here is who
can supply it, here is the document that explains how.

Where a value genuinely is ours to hold, it is already held: the Retell
number, the agent, the Google lead form key. Those can be edited here.

## Tasks

- [x] 1. `gates/integrations.js`: the channel list, what each one needs, and
      the function that turns a set of observed facts into a status. Plain JS,
      single-line export, so the tests and n8n share it.
- [x] 2. `tests/integrations.test.ts`, watched failing first. A placeholder is
      not a value; a missing env var is not a value; an inactive workflow is
      not connected; a channel switched off is reported as off rather than
      broken.
- [x] 3. `lib/dashboard/integrations.ts`: gather the facts server side, once
      per request. n8n's workflow list, Retell's agent and numbers, the env.
      Every call has a timeout and a failure is reported as "could not check",
      never as connected.
- [x] 4. Convex: `channelSwitch` on the settings document, plus `setChannel`.
      `enrol` refuses with `stopReason: "channel_off"`.
- [x] 5. `tests/engine.test.ts`: enrol on a switched-off channel sends
      nothing and records the reason; a sequence already running is untouched.
- [x] 6. The screen at `/lead-dashboard/integrations`: a row per channel with
      its status, what is missing in plain words, and the switch.
- [x] 7. Nav entry in `Shell.tsx`, and a line on the Control panel pointing at
      it, since that is where somebody will look first.
- [x] 8. The Control panel's channel rows show "switched off" where it applies,
      so the two screens cannot disagree.

## Done, 16 November 2026: what ran and what it found

Evidence from real runs, not from the diff.

**What the screen said the first time it was pointed at the live systems.**
The gatherer, run directly against n8n (srv1836598), Retell and Convex, in
1.3 seconds:

| | |
|---|---|
| Connected | website chat, website voice, website form, and the three channels that arrive through it (found us on Google, referral, direct) |
| Partly connected | Google Ads: landing pages work, lead forms have no key |
| Not connected | Facebook ad, Instagram ad, Facebook message, Instagram message (no Page token, no app secret, webhook not verified); inbound call, missed call, reactivation (Twilio) |
| Not built | WhatsApp |
| Follow-ups | **None can go out: the Sequence Worker is switched off in n8n.** Also: the Twilio credential and number are placeholders, no number is imported into Retell, the outbound agent does not exist, Email Inbound is off with no IMAP login |

The plan's "eight placeholders" is right, checked against the live workflows
rather than repeated: seven `*_PENDING` tokens, plus the outbound agent, which
never appears in the JSON because the builder leaves the field out.

### Where the plan and the code disagreed

- **"Connected means ... `TWILIO_CRED_ID` is real".** Those values are not in
  any environment the website sees. The n8n builder reads them and bakes a
  `*_PENDING` placeholder into the workflow when one is missing. So the
  status reads the deployed workflows from n8n's API: the thing that
  actually decides. Only `OHM_LEAD_ROUTER_URL` is a real website setting.
- **The Sequence Worker** is not in the plan's table, but every queued
  follow-up goes out through it, and it is off. Texts, email follow-ups and
  calls now require it.
- **Retell retired `GET /list-agents`** on 31 July 2026 (it answers 400). The
  agent list is `POST /v2/list-agents`. Its name for the web agent is "OMH
  Site Assistant (Melissa)"; an exact match would have reported a working
  agent as missing.
- **"`enrol` refuses with `stopReason`".** enrol does not write a row when it
  refuses; it returns a reason, as it does for the kill switch. So it returns
  `{ enrolled: false, why: "channel_off", channel }`, and no sequence is made.
- **"Nav entry in `Shell.tsx`".** The rail is built from `TABS` in
  `lib/dashboard/screens.ts`, so the entry is there, with its icon in
  `NAV_ICON`.

### The open question below, decided for the run

The switch stops **new follow-ups only**. The assistant still answers people
on a switched-off channel, and anyone part way through a sequence finishes
it. The plan already defines off as "no new enrolments", and an unanswered
message is worse than an unchased one. Rafiul can reverse this; it would be
a change to the chat and inbound workflows, not to `enrol`.

### Evidence

- `integrations.test.ts`, 72 assertions, red first. Teeth: treating an
  unreachable n8n as fine fails 5; ignoring the switch fails 4.
- `engine.test.ts`, 17 new: refused with the reason, no sequence made, nothing
  handed to the router, old channel name, neighbour unaffected, the running
  sequence still active AND its next step still claimed, route F counted as
  reactivation, switched back on, kill switch still reported first. Teeth:
  removing the refusal fails 6.
- The real page, signed in on the local server: 200, no page errors, no
  horizontal scroll at 1280 and 390, screenshots looked at. Driving it found
  a reason listed twice on one row (React's duplicate key), now a test.
- The Control panel row says "Switched off" from the same `isOn()` that the
  Integrations screen and `enrol` use, asserted equal by the suite.
- Full suite 2101 to 2196, every suite passed. Source typecheck and lint clean.

**Not proven in a browser:** pressing the switch. The example screen is read
only by design, and the live one needs `/settings/channels`, which exists
only once Convex is pushed.

### Waiting for Rafiul

1. Push Convex (dev, `cool-ferret-103`): `setChannel`, `channelSwitches`,
   `channel_off` in enrol, `/settings/channels`. Until then the switches read
   "could not be read" and nothing is enforced.
2. Deploy the site after Convex.
3. Give the website **`N8N_BASE_URL` and `N8N_API_KEY`**, or every n8n-backed
   row says "Could not check". This is a security decision: that key is
   n8n's admin key, held server side only. A read-only key, if the instance
   can issue one, would be better.
4. `GOOGLE_BOOKING_WEBHOOK` and `GOOGLE_BOOKING_SECRET` are not in the local
   environment; check they are set where the site is deployed.
5. The Sequence Worker is off in n8n. Nothing in this plan turns it on.

## Open question for Rafiul

The switch stops **new enrolments**. Should it also stop the assistant
answering on that channel, or only the outbound follow-ups? They are different
promises: "stop chasing people from Facebook" is not the same as "stop
replying to people from Facebook", and the second one leaves somebody's
message unanswered.
