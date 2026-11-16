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

- [x] 1. `gates/tone.js`: the mechanical rules as plain JS, single-line
      export, no imports, so n8n can inline it and the tests can import it.
- [x] 2. `tests/tone.test.ts`: the rules themselves, watched failing first,
      then proven to have teeth by planting a violation.
- [x] 3. Run it over every string in `templates.ts` as its own assertion, so
      a new template cannot be added in the wrong voice.
- [x] 4. Fix whatever task 3 reports. Copy changes only; no behaviour.
- [x] 5. `prompt-core.md`: replace the TONE section with the six principles,
      the say-this / not-this table and the house style. One edit, three
      agents.
- [x] 6. `prompt-outbound.md` and `prompt-voice.md`: the parts of the guide
      that are spoken rather than written, mainly matching formality and
      saying prices as a person would.
- [x] 7. `gates/brain.js`: the sales brief an AI reply is written from
      carries the voice, not only the facts.
- [x] 8. `validateMessage`: tone warnings beside the existing ones.
- [x] 9. Rebuild the workflows, confirm the inlined gate is byte identical to
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

## Done, 16 November 2026: what ran and what it found

Evidence from real runs, not from the diff.

**Task 3, the count before fixing.** 27 templates, rendered with the two date
shapes the system really hands them (`appointmentWords()` and the booking row),
and with no details at all. **5 templates with an issue, 10 issues, every one
`date_format`.** Zero em dashes, never-use words, prices, exclamation marks or
American spellings in the hand-written copy. Every hit came from the date
VALUE, not the words:

- `booking_confirmed` was rendered from the booking row as stored, so the
  confirmation text read "booked for 2026-12-01 at 10:00".
- `appointmentWords()` wrote "Tuesday 1 December"; the guide writes "Tuesday
  13th October". That reaches `g_sms_missed`, `h_email_day_before`,
  `h_sms_same_day`, `booking_reminder` and every owner message using
  `{{appointment}}`.

**Task 4.** Fixed in the two formatters in `convex/routing.ts`
(`bookingWords()`, and an ordinal in `dayWords()`), because the words in
`templates.ts` were already right. No route, timing or step changed. Route B's
first text is unchanged, so it is still 230 characters and two SMS segments.
`engine.test.ts` asserted the machine date in the confirmation, so it had
encoded the defect; it now asserts the words and that the machine form is gone.

**Teeth.** A planted em dash, "we would love to", "!" and "optimize" in
`b_sms_first` failed by name. Disabling the em dash rule failed 10 assertions.
A planted "£450 a month" and a dash in `prompt-core.md` failed 2. All restored
byte identical.

**Task 5 and 6.** `prompt-core.md` TONE section replaced: the six principles,
matching formality, the say-this table, the house style. Also its tool list
used six em dashes and its two price examples had no VAT, and a model copies
its examples more faithfully than its rules, so those changed too. "+ VAT" on
every price rests on two sources: the guide, and `kb/faq.json` ("All invoices
are subject to UK VAT"). Previous wording kept in
`OHM/widget/retell/.before-013-tone-2026-11-16/` (shasums matched at copy).

**Task 7.** `salesBrief()` said "How to sell" with nothing on how to sound. It
now carries one line: advisory, never pushy, say when OMH is not the right fit,
and the written house style. The never-guess rule is still its last line.

**Task 8.** `validateMessage` returns `tone_*` WARNINGS, never errors, judged on
what the owner typed with `{{variables}}` left out. Driven in a real browser on
the local dev server: typing "we can unlock more leads for £450 a month, with a
dash and a !" showed four tone warnings in plain words; the guide-voice rewrite
showed none; every code message opens with none. (The editor is read only on
the local server, which has no write secret; the check lifted `disabled` in the
DOM, so it proves the rendering, and nothing was saved.)

**Task 9.** `build-workflows.py` rebuilt locally. Only `01-chat.json` changed.
The Clean Reply node contains `tone.js` byte for byte, and its body, run through
`new Function` as n8n runs it, returns `tone: ["em_dash", "price_format"]` for a
reply with both, and leaves the reply text untouched.

**Suites.** Before: 1937 assertions, every suite passed. After: 2101, every
suite passed (`zsh widget/tests/run.sh`). `tsc --noEmit` clean.

### Where the brief and the code disagreed

The brief says `validateMessage` runs inside n8n. It does not: its callers are
`convex/flows.ts`, `components/dashboard/MessageEditor.tsx` and the tests, all
of which bundle. So `message-text.js` imports `tone.js` (the one gate with an
import), and `tone.test.ts` asserts it is never passed through `gate_inline()`.

### Deliberately not made into rules

Paragraphs of three sentences, active voice, lists of three, matching
formality. Either judgement or too noisy to trust; they live in the prompt.

### Waiting for Rafiul's typed approval

Nothing below has run. Each is one command.

1. n8n, the chat with the new prompt and the tone report:
   `cd OHM/widget && python3 n8n/push.py --only 01-chat`
2. Retell, the web voice agent's prompt:
   `cd OHM/widget && python3 retell/create-agent.py --update`
   (The callback agent is still not created; it will read the new prompts
   when it is.)
3. Convex dev (`cool-ferret-103`), for the date words, the sales brief and
   the owner warnings. No push command is written down in `docs/`, so none is
   given here; push it the way it was last pushed.
4. The site, for the Messages screen warnings, after Convex (the order the
   last deploy note gives).

## Not in scope

- The knowledge base, for the reason above.
- The marketing site's own copy. The guide covers client messages, and the
  site is a separate decision with its own `docs/design-rules.md`.
- Internal emails, such as the error workflow and the team notification.
  Nobody outside OMH reads them, and the guide is explicitly about writing
  "to a client or prospect".
