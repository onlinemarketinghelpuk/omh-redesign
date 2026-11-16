# The Control Panel

Giving the owner of OMH control of what happens to every lead: which channels
get which messages, how many, in what order, what they say, who answers the
replies, and when a person takes over from the assistant.

Written for Rafiul and whoever implements this. It assumes you know the
system exists and not how it is built.

---

## 1. What is actually there today

Audited on 2026-11-16 by reading the code, driving the dashboard in a
browser, and reading the live n8n execution log.

### Working, and genuinely finished

| Piece | Where | State |
|---|---|---|
| Eight routes, A to H, with timing, gating and quiet hours | `widget/gates/routes.ts`, `convex/routing.ts` | live, 1042 assertions across the suite |
| The clock: London wall time, DST, quiet hours, lease-protected sends | `convex/clock.ts`, `claimDue`/`completeStep` | live |
| Message content for every step | `widget/gates/templates.ts` | live |
| Consent, suppression, the kill switch | `convex/routing.ts`, `settings` table | live |
| Twelve n8n workflows plus an error handler | `widget/n8n/` | built; six live |
| The dashboard: Leads, Channels, Bookings, Sequences, Handover, Settings | `app/lead-dashboard/` | live |
| Website forms reaching the system | `widget/gates/enquiry-form.js` | built today, not deployed |

### Known broken or incomplete, before any of this starts

1. **Outbound calling has never placed a call.** The sequence worker's call
   step posts to `https://api.retellai.com/v2/create-phone-call` with
   `from_number: 'TWILIO_NUMBER_PENDING'`. There is no number.
2. **That endpoint is on a version its sibling was switched off from.**
   Retell killed `v2/create-web-call` without a grace period and returned a
   warning-shaped body, so the Voice tab died silently and stayed dead for
   at least four days. `v2/create-phone-call` has not been verified since.
   **Check it before building anything that depends on it.**
3. **Convex is still a dev deployment.** Everything below is a schema change,
   so production is now a prerequisite rather than a preference.
4. **Nothing is pushed.** Thirteen workflows are built locally; ten are on
   the instance, two were never pushed, and none carry the error workflow.

### The thing that shapes this entire plan

`widget/gates/routes.ts` holds the routes **as code**, and
`widget/tests/routes.test.ts` asserts a property over them:

```
route A has no call step   route E HAS call step
route B HAS call step      route F has no call step
route C has no call step   route G has no call step
route D has no call step   route H has no call step

the only marketing route is F
no marketing route can dial          <- the guarantee
```

A `call` step exists **only** in the two routes where the person contacted us
first. That is not a setting, a flag or a policy document. It is the absence
of data, and it cannot be undone by a mis-typed configuration, a bad import
or a model deciding to be helpful.

It exists because of PECR regulation 19: an automated marketing call needs
consent that **specifically** covers automated calls. General marketing
consent does not cover it. Neither does consent for live calls. The ICO's
largest fines under PECR are for exactly this.

**A visual flow builder that lets the owner drop a Call node anywhere
destroys that guarantee.** That is the central design problem here, and
section 3 is how it is resolved. Everything else in this document is
ordinary product work.

---

## 2. What the owner asked for

In their words, reorganised:

- per channel, decide how a lead is handled: SMS only, email only, call only,
  or all of them
- how many texts, how many emails, in what order, with what content
- a brain that handles the replies those messages get, with an on/off switch
- per channel, decide who handles it: fully the assistant, fully the owner,
  the assistant until the lead replies, or the owner only for interested
  leads
- build the order visually: add a node, pick the channels; add another node,
  pick SMS or email or call; join them into a flow
- it has to be genuinely easy to use
- an outbound agent that rings people

---

## 3. The design decision everything rests on

**The owner controls the business decisions. The system keeps the legal
envelope.** Those are different things and the line between them is drawn
once, here, rather than argued about per feature.

### The legal basis belongs to the trigger, not the flow

Every flow starts from a trigger: which channel the lead arrived on. The
trigger carries a basis that the owner cannot edit:

| Basis | Channels | What it permits |
|---|---|---|
| `they_contacted_us` | website form, chat, voice, Google Ads form, Meta lead ad, Meta DM, WhatsApp, inbound call, missed call, referral, organic, direct | replying by any channel, including an automated call, because replying to somebody's own enquiry is not marketing |
| `we_are_contacting_them` | reactivation, any imported list | marketing. Recorded consent required per send. **Automated calls are not available at all.** |

The rule in one line, which is worth saying to the client as well:
**replying to somebody's own enquiry is not marketing; starting a
conversation they did not ask for is.**

### The palette is filtered, and the server refuses

1. On a marketing flow, the Call node is **not in the palette**. Not greyed
   out, not disabled with a tooltip: absent. A control that exists and
   refuses invites somebody to find the way round it.
2. The UI filter is a convenience. **The refusal is server-side.** Convex
   validates every flow on save and rejects the whole thing if a marketing
   flow contains a call step, whatever produced it: the API, an import, a
   migration, a bug in the builder.
3. The rejection names the actual rule. "Automated marketing calls need
   consent that specifically covers automated calls (PECR regulation 19).
   This flow starts from a reactivation list, so a call step cannot be saved
   on it." Not "not permitted".
4. `routes.test.ts`'s property is **re-asserted over saved flows**, not just
   over the code. The test becomes: for every flow in the store, if
   `marketing` then no step has `channel: "call"`. Same guarantee, now
   covering the data the owner creates.

### What the owner genuinely controls

Everything else, and it is most of it: which channels, how many messages, of
what kind, in what order, how far apart, what each one says, what stops a
sequence, who answers the replies, and whether any of it runs at all.

---

## 4. The sections to add

Five new screens and one rebuilt one. Each one answers a single question.

### 4.1 Control Panel (`/lead-dashboard/control`)

The home of all of this, and the only screen most days need. One row per
channel:

```
CHANNEL            FLOW                WHO ANSWERS REPLIES        LIVE
Website form       Standard follow-up  Assistant until they reply  ON
Google Ads         Standard follow-up  Assistant until they reply  ON
Facebook ad        Meta form chase     Assistant only              ON
Facebook message   (in conversation)   Assistant until they reply  ON
Missed call        Call back fast      Assistant until they reply  ON
Reactivation       Dormant clients     Owner only                  OFF
```

Each cell is editable in place. The channel list is the fifteen canonical
sources already in `gates/channels`, so this screen cannot drift from the
Channels report beside it.

At the top: the existing kill switch, unchanged, because an owner looking
for the off switch should find it where it already is.

### 4.2 Flow Builder (`/lead-dashboard/flows/[id]`)

The node canvas. Deliberately small: four node types, not a general
workflow tool. A general tool is how this becomes unusable.

| Node | What it asks | Notes |
|---|---|---|
| **Start** | which channels use this flow | one flow can serve several. The basis is shown and is not editable. |
| **Send** | SMS, email, or call; which message | the only node that contacts anybody |
| **Wait** | how long, or until a time of day | "15 minutes", "same day at 6pm", "day 2 at 10am" |
| **Stop if** | they replied, they booked, they opted out | defaults to "they replied", because that is right almost always |

Rules the canvas enforces while you drag:

- **One line, not a graph.** Branching reads well on a screen and is
  unanswerable in practice ("which branch is this person on?"). Conditions
  live on Stop-if nodes instead. If branching is ever genuinely needed, it is
  a second flow on the same trigger, which is readable.
- **Quiet hours are not a node.** They apply to the whole flow and are shown
  as a band on the canvas. Making them a node means somebody can forget one.
- **Every Send node must name a message.** A flow with an unwritten message
  cannot be switched on.
- **Live preview beside the canvas**: "this person would get a text at 2
  minutes, an email at 2 minutes, a call at 15 minutes, a text that evening,
  then stop." The sentence is the test of whether the flow is what they meant.

Underneath, a flow compiles to exactly the `Route` shape in
`gates/routes.ts`. Nothing new is invented: the engine, the clock, the lease,
the gates and the quiet hours all stay as they are and are already tested.

### 4.3 Messages (`/lead-dashboard/messages`)

Every message, editable, in one place.

- variables offered as chips: name, first name, company, service, the
  business name, the booking link, the phone number
- **SMS segment count, live, with the cost.** 160 characters is one segment;
  161 is two and costs twice. Nobody knows this until the bill arrives.
- preview with realistic data, both channels
- **the opt-out is appended by the renderer on marketing messages and cannot
  be edited away.** It is currently impossible to leave off and must stay
  impossible. Shown in the preview greyed, with "added automatically".
- a history of changes, with who and when

This replaces `gates/templates.ts` as the source for route steps. The file
stays as the fallback and the seed: a message deleted from the store falls
back to the code, so a half-finished edit cannot leave a step with nothing
to send.

### 4.4 The Brain (`/lead-dashboard/brain`)

What happens when somebody replies to the text or the email.

A master on/off switch, then per channel, one of four policies:

| Policy | What it means |
|---|---|
| **Assistant only** | it answers everything and escalates only when it cannot |
| **Assistant until they reply** | the sequence runs, and the first inbound reply hands the thread to a person |
| **Owner only** | nothing automated answers; every reply lands in Handover |
| **Owner for interested leads** | the assistant answers, and hands over when the reply shows buying intent |

The last one needs intent classification on every inbound reply. Say so
plainly in the UI, with the cost: roughly £0.0011 per reply on Sonnet, which
is about £1 per thousand replies. Also say what it does when it is unsure:
**it hands over.** A missed hand-over costs a customer; an unnecessary one
costs thirty seconds of somebody's time.

Also on this screen:

- what the assistant is allowed to say: the knowledge base it answers from,
  which is already in Convex
- what it must never do: quote a price it cannot source, promise a date,
  claim something is in stock
- a **test console**: type a reply as if you were a lead, see what it would
  answer and whether it would hand over. Costs a model call, labelled.

### 4.5 Outbound Agent (`/lead-dashboard/agent`)

The thing that rings people. This screen is mostly honesty about state.

- which number it calls from, and that it must be a **UK domestic long
  code**: Twilio does not support international long codes for UK, and an
  alphanumeric sender ID cannot receive a reply, which would break every
  route built on the lead replying
- calling hours, separate from message quiet hours, because a text at 8pm is
  fine and a call at 8pm is not
- the agent's opening line and what it is trying to achieve
- **which flows may call at all**, read-only, with the reason: the two where
  the person contacted us first
- `honor_internal_dnc: true` on every call, shown as a fact not a setting
- TPS screening state for any list-based calling

### 4.6 Sequences, rebuilt (`/lead-dashboard/sequences`)

Exists, and becomes the proof that the control panel did what it said. Each
row gains "on flow X, step 3 of 6, next at 18:00" so an owner who changed a
flow this morning can see this afternoon's people moving through it.

---

## 5. Data model

Three new tables. Everything else stays.

### `flows`

```
name           "Standard follow-up"
basis          "they_contacted_us" | "we_are_contacting_them"   <- never editable
triggers       ["website_form", "google_ads", "organic"]
nodes          [ {id, type: "send"|"wait"|"stop_if", ...} ]
status         "draft" | "live" | "paused"
version        n
updatedAt / updatedBy
```

Indexed `by_status` and `by_trigger`. A channel has at most one live flow;
saving a second one asks which to replace rather than silently running both,
because two live flows on one channel is two texts from one business in one
hour, which reads as a system out of control.

### `messages`

```
key            "b_sms_first"          <- matches the template key
channel        "sms" | "email"
subject        (email only)
body           with {{variables}}
marketing      derived from the flow, not typed
updatedAt / updatedBy
```

### `flowVersions`

Append-only. Every save of a live flow writes the previous one here. Not for
tidiness: when somebody asks in three weeks why a lead got four texts, the
answer is in the flow as it was that day, not as it is now.

### Changes to what exists

- `sequences` gains `flowId` and `flowVersion`, so a person who started on
  version 3 finishes on version 3. Changing a flow must not retime somebody
  mid-sequence.
- `settings` gains `brain` (the policies) and `agent` (calling hours, number).
  The schema comment already anticipates a `routes` key; nothing reads it.

---

## 6. How a flow becomes a sequence

The part that must not become a second engine.

```
owner edits a flow
    -> compile to the Route shape in gates/routes.ts
    -> validate: basis vs channels, every Send has a message,
       quiet hours sane, at most one live flow per trigger
    -> refuse, with the reason, or save a new version
    -> enrol() reads the live flow for that channel instead of ROUTES[id]
    -> claimDue, completeStep, the lease, quiet hours: all unchanged
```

`ROUTES` stays in code as the **default**. A client with no flows configured
behaves exactly as today. That also means the migration is: ship it with the
existing eight routes pre-loaded as flows, and the first thing the owner sees
is what the system is already doing, which is the only honest starting point.

---

## 7. Build order

Each stage is usable on its own. Nothing here needs the stage after it.

| # | Stage | Blocked on | Rough size |
|---|---|---|---|
| 1 | Convex to production | Rafiul's decision | half a day |
| 2 | `flows` + `messages` schema, compiler, validator, the compliance test over saved flows | 1 | 2 days |
| 3 | Control Panel screen: channel to flow, policy, on/off | 2 | 1.5 days |
| 4 | Messages screen, segment counting, preview, opt-out appending | 2 | 1.5 days |
| 5 | Flow Builder canvas | 2 | 3 days |
| 6 | The Brain: policies, escalation, test console | 2 | 2 days |
| 7 | Outbound Agent screen | Twilio number, Retell verified | 1.5 days |
| 8 | Sequences rebuilt to show flow and step | 2 | half a day |

About twelve working days, assuming credentials arrive. Stages 3 and 4 are
where most of the value lands: an owner who can change what the messages say
and who answers them has most of what they asked for, before the canvas
exists.

### Before any of it

- verify `v2/create-phone-call` against Retell's current API, the way
  `v2/create-web-call` was not
- get the UK number and import it into Retell by SIP
- decide, with the client, who the **owner** is: this panel changes what
  their customers receive, and "the dashboard password" is not an identity.
  The `flowVersions` and `updatedBy` columns are only worth having if the
  name in them means something.

---

## 8. What this must not become

- **A general workflow builder.** Four node types, one line, no branching.
  Every extra node type doubles what the owner has to understand and halves
  the chance they finish a flow.
- **A way to send more.** The defaults that ship are the routing paper's,
  which stop at five or six touches. A panel that makes it easy to add a
  seventh text should also make it obvious that opt-outs rise: show the
  opt-out rate for the flow next to the Add node button.
- **A place where the compliance property is a checkbox.** It is the absence
  of a node in a palette and a refusal on the server. If a future change
  makes it a setting, that change is the mistake, not the thing it enables.
- **Editable by anyone with the dashboard password.** Stage 1 of a follow-up
  piece: named users, because this panel can text every customer the client
  has.

---

## 9. Open questions for the client meeting

1. Who is the owner, by name, and does anyone else get this panel?
2. Reactivation: do they hold consent evidence per person, or is route F
   off until they do? This decides whether the marketing basis is usable at
   all.
3. Calling hours: 9 to 5, or later? And do they want a call attempt at all
   on a website form, or only on a missed call?
4. When the brain hands over, where does the owner get told: the dashboard,
   an email, or a text?
5. Is one flow per channel enough, or do they want a different flow for
   "Google Ads, emergency plumbing" than "Google Ads, everything else"?
   Campaign-level flows are a real step up in complexity and should only be
   built if they will use it.
