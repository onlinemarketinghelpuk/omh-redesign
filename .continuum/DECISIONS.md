# Decisions

Append-only. Newest at the bottom. One entry per decision that would otherwise
be re-argued in a later session.

A decision belongs here when reversing it would cost real work: a library
choice, a schema shape, an auth model, a deployment target, a rejected
alternative. Not here: formatting, naming, anything the linter settles.

---

## D-001 - n8n is the brain, Convex is the database and the clock

- **Date:** 2026-11-10
- **Decision:** backend logic lives in n8n. Convex holds data, scheduling
  state and template rendering. Code only where n8n genuinely cannot.
- **Because:** Rafiul's standing instruction for this project. Practically:
  every provider call stays somewhere visible and re-runnable, and no Convex
  `action` is introduced, so the deployment keeps its "one door, one secret"
  property.
- **Except:** `enrol` and `claimDue` stay in Convex because correctness
  depends on one transaction and n8n has none; and the due date is a row,
  not an n8n `Wait` node, because a Wait spanning four days lives in that
  execution's state and a restart loses it silently.

---

## D-002 - Shared logic lives in widget/gates/ as plain JavaScript

- **Date:** 2026-11-10
- **Decision:** any rule that has to hold in more than one place is a file in
  `widget/gates/`, with no imports, imported by the tests and inlined
  verbatim into the n8n Code node that runs it.
- **Because:** the same rule written twice drifts, and the copy that drifts
  is the one nobody tested. One text, asserted and executed.
- **Rejected:** bundling the gate with esbuild (`gate_source`). The bundle
  assigns an IIFE to a global the n8n Code sandbox cannot reach; it took the
  live chat down on 2026-11-11. `gate_inline` drops the export line instead.

---

## D-003 - The visitor's capability is the id PAIR, not either id

- **Date:** 2026-11-11
- **Decision:** a public route that returns anything about a conversation
  requires both the session id and the visitor id, and checks that the
  session belongs to that visitor. A session keeps the visitor that started
  it and cannot be re-pointed.
- **Because:** a review found that reading on the visitor id alone returned
  a stranger's whole transcript, and that `hello` let anyone claim a session.
  `publicRoute` checks only that a session id is present and cannot know
  whose it is, so each handler scopes itself.
- **Also:** both ids are now 16 bytes from `crypto.getRandomValues`. They
  were `Date.now()` plus `Math.random()`, which is a known prefix and about
  40 bits from a generator not meant for this.

---

## D-004 - The booking guarantee is the Apps Script lock, not the form

- **Date:** 2026-11-11
- **Decision:** the form reads availability and strikes out taken times, but
  the authoritative check is a `LockService` lock in the Apps Script with the
  clash check inside it, immediately before the event is created. The
  availability GET fails OPEN: if the calendar cannot be reached, every time
  is offered.
- **Because:** two submissions in the same second both see the slot free on
  the page, and only a check in the same breath as the write refuses the
  second. Given that, a form that offers nothing because a Google script
  timed out turns away real customers to prevent a clash already prevented.
- **Not symmetric:** an answer we cannot PARSE is never reported as "fully
  booked". That would silently close the diary on an empty day.

---

## D-005 - Replying is not marketing, and only route F is

- **Date:** 2026-11-10
- **Decision:** routes B to E may text, email and call within minutes with no
  recorded consent. Route F is the only one marked `marketing: true` and
  demands consent evidence per person.
- **Because:** PECR. Replying to somebody's own enquiry is not marketing;
  starting a conversation they did not ask for is. An automated marketing
  call needs consent that specifically covers automated calls (reg 19), which
  general marketing consent does not give.
- **Enforced structurally:** a `call` step exists only in routes B and E. C,
  D and F have none, so an automated marketing call is not reachable by a
  configuration mistake. A test asserts it.

---

## D-006 - A photo is described first, then handed to the agent as text

- **Date:** 2026-11-12
- **Decision:** when a visitor sends a photo, a separate OpenRouter call
  describes it, and the description goes into the agent's turn as text. The
  agent itself stays a text agent.
- **Because:** the n8n agent node takes a string prompt. Making it carry an
  image content array means fighting the node, and the agent's tools, memory
  and system prompt all work. One extra call buys leaving all of that alone.
- **Cost, measured not guessed:** $0.0001331 per photo on
  `anthropic/claude-haiku-5.5`, 806 prompt tokens and 105 completion, on a
  100KB image. About 7,500 photos per dollar. Only images are sent; a voice
  note is not, because that is a paid call that can only fail.
- **The description is untrusted text.** It is written by a model reading a
  stranger's picture and then placed inside a prompt, so it is fenced and
  labelled as something the visitor sent rather than as an instruction.
  Somebody will eventually photograph a sign saying "ignore your
  instructions". `gates/vision.js`, asserted.
- **The widget sends a storage id, never a URL.** Convex resolves it, and
  refuses an id that is not already in a conversation. A workflow fetching
  an address chosen in a browser is the forgery `checkRemote` exists to
  prevent, and it is no better coming from our own page.

---

## D-007 - Voice notes are transcribed with Deepgram, and a doubtful one is treated as unheard

- **Date:** 2026-11-12
- **Decision:** Deepgram Nova-3 pre-recorded, through the key that already
  exists on Rafiul's account. Transcribe, hand the words to the agent as
  text, leave the agent alone, exactly as with a photo.
- **Because:** measured before deciding. One real file, 78.5 seconds,
  confidence 1.0, accurate. About $0.0043 a minute, so a twenty second voice
  note is roughly $0.0015. Nothing to buy and nothing to integrate: the key
  was already in use for the Bangla voice work.
- **The part worth keeping:** anything below 0.6 confidence is treated as
  NOT HEARD, and none of its words reach the prompt. A wrong transcript is
  worse than no transcript, because it reads perfectly, says something the
  visitor never said, and the agent answers it with complete confidence. A
  misheard budget or phone number is not funny.
- **Also untrusted:** the transcript is a stranger's words going into a
  prompt. Saying "ignore your instructions" out loud is easier than
  photographing it, so it is fenced and labelled the same way the photo
  description is. See [[D-006]].

---

## D-008 - Text replies run on Sonnet 5.5, and the packages were repriced for it

2026-11-13. Rafiul's call: "We will use Sonnet for handle all of the text
replay. Not Haiku."

- **What changed:** `CHAT_MODEL` in `widget/n8n/build-workflows.py` is now
  `anthropic/claude-sonnet-5.5`. The Melissa agent node in `01-chat` is the
  only consumer.
- **What did not:** `VISION_MODEL` in `gates/vision.js` stays on Haiku. That
  call describes a photo into text; the Sonnet agent is what then answers. See
  [[D-006]]. At £0.0001 a photo there is nothing to gain by moving it.
- **The cost, and why it is not measured yet:** Sonnet 5.5 is $2.00/$10.00 per
  1M against Haiku's $0.10/$0.50 - exactly 20x on both input and output, so the
  measured Haiku turn scales to $0.0014 a reply without needing the token
  split. The pricing PDF marks that line **derived**, not measured, until a
  live turn has run through the deployed workflow.
- **It broke the margin floor and nothing noticed.** At the old allowances the
  switch added £10/£27/£65 a month per client and put all three plans under
  60% in the worst case (59.3 / 58.6 / 57.6). The document would have printed
  those numbers without complaint. Fixed two ways: voice minutes trimmed to
  360/700/950, which restores 62% on all three with no price change and no
  other limit touched; and `pdf/build-engagement-packages-pdf.py` now
  **asserts** every plan sits inside the 60-65% band, proven to have teeth by
  re-injecting `calls=400` and watching it fail.
- **Voice is the lever, not the AI bill.** Talk time is 53-77% of plan cost;
  chat is 7-9% even after a 20x rise. Any future rate change should be
  absorbed on minutes first.
- **"Unlimited chat replies" still holds.** The tables budget 10,000/25,000/
  60,000 replies, far past what these businesses send, and even at those
  volumes the whole AI bill is £65.43 on the largest plan.
