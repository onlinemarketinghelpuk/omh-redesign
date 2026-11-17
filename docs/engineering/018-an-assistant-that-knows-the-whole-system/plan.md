# An assistant that knows the whole system

The owner wants somebody to ask. Not a report to read: a thing he talks to,
that already knows what is on his screen.

- An **Assistance** section at the top of the rail, with an animated avatar he
  can speak to.
- It knows the business: how many leads came in today, from which channel, how
  many are hot, how many are not worth having.
- He asks *"how many hot leads today"*, it says *"five"*, he says *"show me
  their conversations"*, and they appear beside it.
- He opens a lead or a conversation, says *"write a reply here"*, and the draft
  appears in the reply box. He presses send. Or says *"send"*. Or says *"no,
  say it like this"* and it writes it again.
- He can tell it to change a lead's outcome.
- On every **other** screen, a small voice button in the corner, which is the
  same assistant.
- Wherever he is, it knows: which screen, which lead, which conversation.

## Be accurate about what is new here

Context-aware in-app assistants exist: Intercom's Fin, Attio, Linear, Notion.
Saying nobody has built this is not true, and building on that belief is how a
project discovers the hard parts in week three instead of week one.

What is genuinely unusual, and what makes this worth doing, is narrower and
sharper: **this one can act on the system it is reporting on.** Most in-app
assistants answer questions. This one changes a lead's outcome and puts words
in front of a real customer. That is the whole value and it is also the entire
risk, and the plan below is shaped around that one sentence.

## The one thing to get right

**Nothing the assistant decides reaches a customer without a press.**

The worst failure this system can produce is not a wrong number on a screen. It
is a text message sent to a real member of the public because the assistant
misheard the word "send", or because a draft was auto-submitted while the owner
was still reading it. Everything else in this repo is built to prevent that:
quiet hours, the suppression table, `checkSendable`, the kill switch, the
consent evidence that is append-only because a consent record that can be
edited is not evidence.

An assistant with a microphone is a new way into all of it, so:

| | Rule |
|---|---|
| Read tools | Free. Ask anything, as often as it likes. |
| Write tools | **Always return a proposal, never an effect.** The tool's result is a draft and a button. |
| "Send" spoken aloud | Fills the box and focuses the button. It does not press it. A spoken word is a transcription, and transcriptions are wrong. |
| Every write | Goes through the **existing server action** (`sendReply`, `setLeadOutcome`, `addLeadNote`), which already calls `assertCanWrite()`. No second write path. |
| The customer-facing text | Passes `validateMessage` in `widget/gates/message-text.js` and the tone guide, the same as every other message this system sends. |

If a future version is to send without a press, that is its own decision, with
its own plan, taken deliberately. It is not something this workstream drifts
into because the confirmation step felt like friction.

## The second thing to get right

**Every figure comes from a tool call, never from the model.**

"How many hot leads today" has one correct answer and it is in Convex. A model
that answers from the conversation it has been having will be confidently wrong
about a number the owner then repeats to somebody. Worse, it will be wrong in
the reassuring direction.

So the read tools are thin wrappers over the queries the dashboard screens
already use, and they go through `lib/dashboard/test-rows.ts`, the single place
that excludes OMH's own test traffic. The Channels screen hides 8 test rows out
of 10 today. An assistant that counts them would tell the owner he had five
times the business he has.

Every answer that contains a number names where it came from, in the owner's
words: *"five, from the Leads screen, today, test rows left out."*

## Architecture

```
  ┌──────────────────── the browser ────────────────────┐
  │  AssistantProvider                                   │
  │   • surface: which screen, which lead, which         │
  │     conversation is open, which filters are set      │
  │   • transcript                                       │
  │   • mic (Web Speech API) and voice out               │
  │                                                      │
  │  <AssistantPanel/>  full screen at /assistance       │
  │  <AssistantDock/>   corner button everywhere else    │
  └───────────────────────┬──────────────────────────────┘
                          │ POST /api/assistant  (streaming)
                          v
  ┌──────────── Next.js route handler ───────────────────┐
  │  assertCanWrite() FIRST, before a single token        │
  │  Claude with tools, loop until it stops               │
  │    read tools  ──→ lib/dashboard/* queries           │
  │                    (test rows excluded, as on screen) │
  │    write tools ──→ return a PROPOSAL, nothing else    │
  └──────────────────────────────────────────────────────┘
                          │  owner presses
                          v
              existing server actions, unchanged
```

### Six decisions, and why

**1. The brain runs in the Next.js app, not in n8n.** This contradicts the
standing rule that the OMH backend is n8n only, so it is stated plainly rather
than slipped in: n8n cannot stream tokens into a browser, and a conversation
that waits for a whole workflow to finish before showing a word does not feel
like talking to anybody. A multi-turn tool loop at this latency is not what
n8n is for. **Rafiul's decision, before task 1.** If the answer is no, the
honest consequence is that this feature is text-only and slow, and the plan
should be rewritten rather than quietly degraded.

**2. The tools are the existing server actions and queries.** Not a parallel
API. A second write path is a second place for the consent gate to be
forgotten, and the first version that forgets it will be the one nobody
reviewed because it was "just for the assistant".

**3. Voice in, voice out, in the browser.** The Web Speech API for the
microphone, and speech synthesis for the reply. Not Retell: Retell is a
telephony agent billed by the minute, it holds its own conversation state, and
it cannot call a server action carrying the owner's session cookie. Using it
here would mean a second brain with a second set of tools, which is the thing
decision 2 exists to prevent. **Firefox does not implement
`SpeechRecognition`**, so the text box is not a fallback, it is the primary
input and voice is an addition to it.

**4. The avatar is drawn, not filmed.** An audio-reactive form (Canvas or an
SVG with Rive) that moves with the amplitude of what is being said. Not a video
avatar: streaming video avatars cost per minute, add latency to the one thing
that must feel instant, and would make this the most expensive screen in the
product for the least functional reason. The avatar's job is to show it is
listening, thinking, or speaking. Three states, legible at a glance.

**5. The surface descriptor is explicit, not inferred.** Each screen declares
what it is showing, the same way `SCREENS` in `lib/dashboard/screens.ts`
already declares its title and shape. The assistant is told "the owner is on
the conversation with session X, which belongs to lead Y" as a fact, not left
to work it out from a URL. Parsing routes to guess context is how it ends up
replying in the wrong conversation.

**6. There is a budget and a kill switch.** Every turn costs money, voice turns
cost more, and an assistant left open in a tab is an assistant somebody is
paying for. A per-day token ceiling reusing the existing `limits` table, and a
switch beside the outbound kill switch in Settings.

## What this is not

- **Not a second Melissa.** The website assistant talks to customers and lives
  in n8n. This one talks to the owner and reads his dashboard. Two different
  jobs, two different tone registers, two different risk profiles. They share
  the tone guide and nothing else.
- **Not autonomous.** It does not act while nobody is looking, does not run on
  a schedule, and has no background loop.
- **Not a replacement for the screens.** Every answer it gives links to the
  screen that already shows it. The Channels report stays the source of truth.
- **Not available to the public.** It sits behind the dashboard login and
  `assertCanWrite`, and it is never in the website bundle.

## Phases

This is the largest thing in the project and it does not land in one pass. Each
phase is useful on its own and shippable on its own, which is the test of
whether the split is real.

### Phase A: it can answer, and it is always right

- [ ] A1. `lib/assistant/tools.ts`: the **read** tools only. Leads today, by
      channel, hot ones, outcomes, a conversation's messages, what is waiting
      on a person, a channel's figures. Each one wraps the query its screen
      already uses, and passes through `test-rows.ts`.
- [ ] A2. `widget/tests/assistant-tools.test.ts`, **watched failing first**.
      Each tool's figure equals the figure its screen shows for the same
      period. Teeth: a tool that forgets the test-row filter fails.
      This test is the whole guarantee that the assistant and the dashboard
      cannot disagree, so it is written before the first tool.
- [ ] A3. `app/api/assistant/route.ts`: `assertCanWrite()` first, then the
      Claude tool loop, streaming. Read tools only. A refused auth never
      reaches the model.
- [ ] A4. The system prompt, in `lib/assistant/prompt.ts`, built from
      `docs/tone-of-voice.md`. It states what it may not do as plainly as what
      it may: never answer a number from memory, always name the source,
      always say "I do not know" rather than estimate.
- [ ] A5. Tests that the prompt holds: asked for a figure with the tools
      stubbed empty, it says it does not know rather than producing one.
- [ ] A6. `/lead-dashboard/assistance`: the panel, text input, transcript,
      streaming. No avatar, no voice, no writes. **Shippable.**

### Phase B: it knows where you are

- [ ] B1. `AssistantProvider` and the surface descriptor. Each screen declares
      its context, alongside its entry in `screens.ts`.
- [ ] B2. Tests: on the conversation screen the descriptor names that session
      and its lead; on Leads it names the active filter; a screen that declares
      nothing yields a descriptor that says so rather than a stale one.
      Teeth: a stale descriptor after navigation fails.
- [ ] B3. `AssistantDock`, the corner button on every screen, same provider,
      same transcript. Keyboard reachable, 44px, out of the way of the table.
- [ ] B4. The side result panel: "show me their conversations" lists them
      beside the transcript, each row a link to the real screen.

### Phase C: it can draft, and you press

- [ ] C1. The **write** tools, each returning a proposal: draft a reply, set an
      outcome, add a note. Nothing executes.
- [ ] C2. Tests, red first: a write tool returns a proposal and the database is
      untouched; a drafted reply passes `validateMessage`; a proposal for a
      suppressed person is refused at the proposal stage with the reason, not
      at the press. Teeth: a tool that writes directly fails.
- [ ] C3. The confirmation UI. A draft lands in the existing reply box on the
      conversation screen, not in a new one. "Send" spoken fills and focuses;
      it does not press.
- [ ] C4. Driven in a browser against a real conversation: draft, reject,
      redraft with "say it shorter", press send, confirm the message appears in
      the thread exactly once.

### Phase D: the avatar and the voice

- [ ] D1. Microphone input, with a visible recording state and a hard stop.
      Text input remains primary. No microphone permission is requested until
      the owner presses the button.
- [ ] D2. Speech out, interruptible. A long answer the owner has already read
      must stop when he starts typing.
- [ ] D3. The avatar: three states, audio-reactive, `prefers-reduced-motion`
      respected, and a still frame when it is idle.
- [ ] D4. Firefox and Safari checked by hand, not assumed. Firefox has no
      `SpeechRecognition`: the dock must say so in words rather than offering a
      button that does nothing.

### Phase E: cost and control

- [ ] E1. Per-day token ceiling on the `limits` table, and what it says when it
      is reached.
- [ ] E2. An on/off switch in Settings, next to the outbound kill switch.
- [ ] E3. The real measured cost of a typical day, recorded in this plan rather
      than estimated. A figure nobody measured is not a figure.

## Before any phase can be called done

- `zsh widget/tests/run.sh` green, new assertion count quoted against the
  baseline at the time.
- `npx tsc --noEmit` and lint clean.
- Browser evidence, looked at, 1280 and 390 wide. The whole `ui-ux-pro-max`
  skill applies to the panel, the dock and the avatar.
- `?demo=1` must give the assistant **example data and no write tools at all**,
  and say so in the panel. Demo mode renders perfectly over a dead backend, so
  verify on real data.
- Nothing deployed, pushed, or set `active` without Rafiul's typed approval.
  An LLM call is a paid API call: no live run without his typed approval either.

## Open questions for Rafiul, in the order they block work

1. **May the brain live in the Next.js app rather than n8n?** Decision 1 above.
   Blocks A3, which blocks everything. Nothing else in this plan needs an
   answer to start.
2. **Which model, and what is the daily ceiling in pounds?** A conversational
   assistant with tools is not a cheap screen, and the ceiling should be a
   number he chooses, not one I pick.
3. **Who may use it?** The dashboard has one shared login today. If a note or
   an outcome set by the assistant should say which person asked for it, the
   dashboard needs real users first, and that is a separate workstream.
4. **Should it be able to draft to a customer at all in version one**, or only
   read and set outcomes? Phase C is where all the risk is, and phases A, B, D
   and E are useful without it.
