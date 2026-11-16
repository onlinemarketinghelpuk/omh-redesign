# The OMH voice, in every brain

Melissa has a tone section. It was written before the company had a tone of
voice, and it is not the same thing. OMH now has one, written by Melissa on
12 November 2026, and nothing in the system has been checked against it.

This puts it where the words are actually made, and makes the mechanical half
of it a test rather than a hope.

## The source

`OMH Tone of Voice: Staff Guide`, 12 Nov 2026. Six principles, a say-this /
not-this table, a never-use word list, a house style, and a pre-send
checklist. The parts that bear on this system:

- Straight talk said kindly; explain the why in plain English; protect the
  client; honest caveats built in; options priced and clear; own it and close
  the loop.
- UK English. No em dashes. Prices as `£450 + VAT`, thousands with a comma.
  Dates as "4th November", never US order. Active voice. Paragraphs of three
  sentences at most. No exclamation marks to sell.
- Never use: leverage, synergy, unlock, elevate, seamless, robust, holistic,
  empower, delve, game-changing, cutting-edge, materially, outsized,
  underpins, "not just X but Y", or lists of three for rhythm.
- Say "I want to be straight with you", "The short version:", "On that basis,
  we recommend:", "Your side / Our side", "There is nothing you need to do
  right now". Not "circling back", "actioned", "hope this helps".

## Every brain, and whether the voice reaches it

| Brain | Where | What it writes | Today |
|---|---|---|---|
| Melissa, chat | n8n `01-chat`, system prompt is `retell/prompt-core.md` | every widget reply | a TONE section, written before the guide |
| Melissa, web voice | Retell agent, core + `prompt-voice.md` | every spoken reply | same core |
| The callback agent | Retell, core + voice + `prompt-outbound.md` | outbound calls | same core, agent not created yet |
| Sequence copy | `gates/templates.ts`, 412 lines | every follow-up text and email on routes A to F | hand written, never checked against the guide |
| The reply brain | `gates/brain.js`, `convex/brain.ts` | the sales brief an AI reply is written from | no tone instruction at all |
| What the owner types | `gates/message-text.js` `validateMessage` | the control panel's Messages screen | checks variables, opt-out, SMS segments, UCS-2. No tone check |
| Knowledge base | `kb/`, 517 chunks | the facts quoted | **not ours to rewrite, see below** |

**One structural piece of luck.** `prompt-core.md` is read by the n8n builder
*and* by both Retell create scripts. One edit there reaches chat, web voice
and the callback agent. The voice is not three copies that drift.

**The knowledge base is deliberately out of scope.** `kb/build.py` parses
`raw.json`, crawled from the live website, with no model anywhere in it,
because a model that paraphrases a price is worse than no answer. Rewriting
the KB would make the assistant quote words that are not on OMH's site. The
guide governs what Melissa writes *around* a KB fact, not the fact.

## The approach

The guide has two halves and they need different treatment.

**The mechanical half is a test.** Em dashes, the never-use list, US date
order, `£450/mo` instead of `£450 + VAT`, selling exclamation marks,
Americanisms. These are decidable, so they become `gates/tone.js` and a suite
that runs over every template in `templates.ts`. A rule that is only written
down gets forgotten; a rule that fails the build does not.

**The judgement half is a prompt.** "Straight talk said kindly", matching the
client's formality, leading with "the short version" when the detail is
heavy. No test can check that, so it goes into `prompt-core.md` as the
principles plus the say-this / not-this table, which is the part a model can
actually act on.

And the same `tone.js` runs inside `validateMessage`, so the owner editing a
message in the control panel sees the same rules as a warning while they
type. The guide then applies to words we never wrote.

## Tasks

- [ ] 1. `gates/tone.js`: the mechanical rules as plain JS, single-line
      export, no imports, so n8n can inline it and the tests can import it.
- [ ] 2. `tests/tone.test.ts`: the rules themselves, watched failing first,
      then proven to have teeth by planting a violation.
- [ ] 3. Run it over every string in `templates.ts` as its own assertion, so
      a new template cannot be added in the wrong voice.
- [ ] 4. Fix whatever task 3 reports. Copy changes only; no behaviour.
- [ ] 5. `prompt-core.md`: replace the TONE section with the six principles,
      the say-this / not-this table and the house style. One edit, three
      agents.
- [ ] 6. `prompt-outbound.md` and `prompt-voice.md`: the parts of the guide
      that are spoken rather than written, mainly matching formality and
      saying prices as a person would.
- [ ] 7. `gates/brain.js`: the sales brief an AI reply is written from
      carries the voice, not only the facts.
- [ ] 8. `validateMessage`: tone warnings beside the existing ones.
- [ ] 9. Rebuild the workflows, confirm the inlined gate is byte identical to
      the file the tests import.

## Found while auditing: the prompts are not in version control

`OHM/widget/retell/` is outside the `OHM/website` repository, so
`prompt-core.md`, `prompt-voice.md` and `prompt-outbound.md` have no history,
no diff and no second copy. That file defines Melissa for all three agents.
The three `.md` files hold no secrets; only the sibling `create-*.py` scripts
read credentials, and they read them from `.env.local`. So nothing prevents
tracking them.

Not fixed here, because it touches `build-workflows.py` and both Retell
scripts, which resolve the path as `ROOT / "retell"`, and two copies that
drift would be worse than one copy outside git.

- [ ] 10. **Rafiul's decision.** Where the Retell prompts should live, and
      whether moving them into the repo is worth the path change in three
      files. Until then, copy the three files before editing them.

## Not in scope

- The knowledge base, for the reason above.
- The marketing site's own copy. The guide covers client messages, and the
  site is a separate decision with its own `docs/design-rules.md`.
- Internal emails, such as the error workflow and the team notification.
  Nobody outside OMH reads them, and the guide is explicitly about writing
  "to a client or prospect".
