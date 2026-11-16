Put the OMH tone of voice into every brain in the system.

## Where you are

Project root: `/Users/rafiulislam/Work/n8n/OHM/website`

A Next.js 16 marketing site plus an internal lead dashboard for Online
Marketing Help, a UK digital marketing agency. Behind it: Convex as the
database and the clock (`widget/convex/`), n8n on srv1836598 as the
automation brain (`widget/n8n/`), Retell for voice, and a test suite of
roughly 1160 assertions run by `zsh widget/tests/run.sh`.

**Read these two first, completely, before writing anything:**

1. `docs/tone-of-voice.md`. OMH's own staff guide, written by Melissa on
   12 November 2026 and transcribed into the repo unchanged. This is the
   standard. Do not improve it, argue with it, or substitute your own taste.
2. `docs/engineering/013-the-omh-voice-in-every-brain/plan.md`. The audit of
   where every brain lives, which half of the guide is a test and which half
   is a prompt, the nine tasks, and what is deliberately out of scope.

Then skim, in this order:

3. `../widget/retell/prompt-core.md`, the shared system prompt. **Note the
   `../`: it is outside this git repository**, at
   `/Users/rafiulislam/Work/n8n/OHM/widget/retell/`, alongside
   `prompt-voice.md` and `prompt-outbound.md`. See "The prompts are not in
   git" below before you touch them.
4. `widget/gates/templates.ts`, every follow-up text and email
5. `widget/gates/message-text.js`, in particular `validateMessage`
6. `widget/tests/templates.test.ts` and any suite near it, to see how tests
   are written here

## The shape of the problem

Six surfaces produce words that a customer reads or hears. The plan has the
full table. Two facts about it change how you work:

**`prompt-core.md` is read three times.** The n8n builder reads it for the
chat agent, `retell/create-agent.py` reads it for the web voice agent, and
`retell/create-outbound-agent.py` reads it for the callback agent. One edit
reaches all three. Do not create per-agent copies of the tone section.

**The prompts are not in git, and that is a finding rather than a design.**
`OHM/widget/retell/` sits outside the `OHM/website` repository. The file that
defines Melissa for the chat agent, the web voice agent and the callback
agent is therefore version controlled nowhere: no history, no diff, and no
copy if the machine is lost. The three `.md` files contain no secrets; only
the sibling `create-*.py` scripts read credentials, and they read them from
`.env.local` rather than holding them. So there is no reason the prompts
cannot be tracked, and there is a good reason to track them before anybody
rewrites the tone section.

Do not restructure this yourself. It touches `build-workflows.py` and both
Retell scripts, which resolve the path as `ROOT / "retell"`, and two copies
that drift would be worse than one copy outside git. Raise it with Rafiul,
and in the meantime **take a copy of the three files before your first edit**
so the previous wording can be recovered.

**The knowledge base is out of scope and this is deliberate.** `widget/kb/`
holds 517 chunks built by `kb/build.py` from `raw.json`, crawled from the
live website, with no model anywhere in that file, because a model that
paraphrases a price is worse than no answer at all. Rewriting the KB would
make the assistant quote words that are not on OMH's site. The guide governs
what Melissa writes *around* a KB fact, never the fact itself. If you find
yourself editing `kb/*.json`, stop.

## The one thing you must not get wrong

Half of this guide is decidable and half is judgement, and the value of the
work is in keeping them apart.

**Decidable**, and therefore a test in `widget/gates/tone.js` with a suite
over it: em dashes, the never-use word list, US date order, `£450/mo` instead
of `£450 + VAT`, exclamation marks used to sell, American spellings.

**Judgement**, and therefore prompt text: "straight talk said kindly",
matching the client's formality, leading with "the short version" when the
detail is heavy.

Do not try to make a test out of the judgement half. A regex that thinks it
can detect kindness will fail on good copy and pass on bad, and then somebody
will delete the whole suite because it cries wolf. Equally, do not leave the
decidable half as prompt text and hope: a rule that is only written down is a
rule that comes back.

## How work is done here

- **Forge.** `.forge/active` already says
  `013-the-omh-voice-in-every-brain`. Tick tasks off in `plan.md` as they
  pass. Record evidence from real runs, not from the diff.
- **Tests before the code they cover, watched failing first.** Then prove the
  test has teeth: plant a violation, confirm the assertion fails, restore. A
  test that has never failed is not evidence.
- **The gates pattern.** Logic that runs both in tests and inside an n8n Code
  node lives in `widget/gates/*.js` as plain JavaScript with no imports and a
  **single-line export statement**; `gate_inline()` strips only lines starting
  with `export {`. The test imports the same file the workflow runs, so the
  two cannot drift. `tone.js` must follow this, because `validateMessage`
  runs in both places.
- **n8n is generated, never edited in the UI.** Change
  `widget/n8n/build-workflows.py`, run it, then `push.py`. `push.py` matches
  by name, so a renamed workflow creates a duplicate.

## Traps that have already cost time in this codebase

1. **`zsh widget/tests/run.sh`, not bash.** Under bash the loop body is a
   syntax error, every suite is skipped, and it prints "every suite passed"
   having run nothing.
2. **`?demo=1` bypasses the real data path entirely.** Verify anything
   data-shaped without demo mode.
3. **`.env.local` lives in `OHM/widget/`, not `OHM/website/widget/`.**
   `widget/n8n` is a symlink to `website/widget/n8n`, same inode.
4. **The n8n MCP server points at srv1236458. The workflows are on
   srv1836598.** Use the REST API with the key in `.env.local`.
5. **An import cycle in Convex does not fail loudly.** It surfaces as
   `v.optional(undefined)` and `Cannot read properties of undefined (reading
   'asOptional')`, naming neither file.
6. **Read n8n's execution log when something looks fine but is not.** Voice
   was dead for four days because Retell switched off an endpoint and
   returned a warning-shaped body. The log said so; nothing else did.

## Two things to watch for in this particular job

**The guide forbids em dashes, and so does the house style of this
repository's prose.** When you report findings, do not introduce them.

**Changing `templates.ts` changes what real people receive.** Task 4 is copy
only: no route changes, no timing changes, no new steps. If a template reads
badly because the *route* is wrong rather than the words, say so and leave it
alone; that is a separate decision and the Messages screen now shows the
owner the text anyway.

Also worth knowing before you touch route B's first text: it is already 230
characters, so it is two SMS segments and every first text costs double. That
was found and deliberately not changed, because the words are the client's
decision. If your edit shortens it below 160, say so, because that is a
saving worth reporting rather than a side effect.

## Standing constraints, which are not yours to waive

- **No push, no deploy, no `git push`, no setting an n8n workflow active, no
  SMS, no real email and no paid API call without Rafiul's typed approval.**
  Build locally, test locally, then ask.
- Convex is still the **dev** deployment (`cool-ferret-103`).
- `widget/n8n/*.json` stays out of git: the Convex secret is in those files
  many times over. The builder `.py` files are tracked; the generated JSON is
  not. The Retell prompts are not tracked either, for no good reason; see
  above.
- Never put a GitHub token on a command line.

## Where to start

Task 1 and 2 together: `gates/tone.js` and `tests/tone.test.ts`, the rules
first and the suite watched failing. Then task 3, which runs it over every
string in `templates.ts`.

**Report the count from task 3 before fixing anything.** How many violations
exist, of which rules, in which templates. That number is the honest measure
of how much of this job is real, and it is more useful to Rafiul than a pile
of copy edits he has to read to understand.
