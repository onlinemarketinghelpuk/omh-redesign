# Plan

Three findings from the 2026-11-15 audit that need nothing from the client.
Rafiul asked for all three closed, tested and verified before tomorrow's
meeting.

## The gaps

| # | Finding | Measured now |
|---|---|---|
| 1 | No `errorWorkflow` on any workflow | `grep -c errorWorkflow widget/n8n/*.json` → 0 on all 12 |
| 2 | No rate limit on `visitors.hello` or `handover.visitorSay` | neither handler calls `bump` |
| 3 | Dependency advisories | `npm audit` → 37 (2 critical, 11 high, 24 moderate) |

Baseline before any change: `zsh widget/tests/run.sh` → every suite passed,
29 Code nodes across 12 workflows.

## Why #1 is first

Tomorrow credentials arrive and six more workflows start carrying real
traffic. The first thing that breaks will break quietly: an n8n execution
fails, nobody is subscribed to that, and the lead it was carrying is simply
gone. Every other finding here is a cost or an abuse ceiling. This one is a
lost customer with no trace.

## Tasks

- [x] 1. A thirteenth workflow, `00-error.json`, built by `build_error()`:
      Error Trigger → Code that formats the failure → email to the team.
      **It talks to nothing but SMTP.** A Convex outage is a plausible cause
      of the error it is reporting, so the handler must not depend on Convex
      to report it.
- [x] 2. Point all 12 at it. The id only exists after the workflow is on the
      instance, so `push.py` resolves it **by name** from the instance and
      injects `settings.errorWorkflow` at push time; the builder also honours
      `ERROR_WORKFLOW_ID` from `.env.local` so a generated file is complete on
      its own. `00-error` is excluded from its own handler: an error workflow
      that errors would call itself.
- [x] 3. Prove n8n actually accepts `settings.errorWorkflow` over the public
      API before claiming it works. Read an existing workflow's settings from
      srv1836598 first; do not assume the field from the UI.
- [x] 4. Rate-limit `visitors.hello` and `handover.visitorSay`, reusing
      `bump` from `convex/functions.ts` rather than adding a second limiter.
      Separate key prefixes from the chat limiter, so a page-view burst cannot
      spend a real visitor's chat budget.
- [x] 5. Caps as exported constants with the reasoning in the name, asserted
      by tests. The hazard here is a cap set too low: it does not look like a
      bug, it looks like a visitor who went quiet. So the test asserts both
      directions, that a plausible real visitor is never refused and that a
      flood is.
- [x] 6. Over the limit, `hello` does **no writes** and returns the same shape
      with `limited: true`; `visitorSay` returns `{ ok: false }` like its two
      existing refusals, so the widget's existing path handles it.
- [x] 7. `npm audit fix` without `--force`, then `tsc`, `eslint`, `npm run
      build` and the widget suite. `--force` crosses major versions the day
      before a client meeting; the remainder is reported, not forced.
- [x] 8. Regression: full suite plus the dashboard browser pass, numbers
      quoted against the baseline above.

## Not in scope

- Pushing any of this. Six workflows are live and answering the public; the
  push, and the activation of the error workflow, need Rafiul's typed yes.
- `npm audit fix --force`. Named in the report with what it would upgrade.
- Moving Convex off the dev deployment. That is a decision, not a task.

## What actually happened, beyond the plan

- **An import cycle, found by the test and not by review.** Moving the
  counters into `visitors.ts`'s reach made `functions.ts` and `visitors.ts`
  import each other. Convex does not fail loudly on that: the second module
  to load sees `undefined`, so `v.optional(attributionArg)` became
  `v.optional(undefined)` and the build died with `Cannot read properties of
  undefined (reading 'asOptional')`, naming neither file. The ceilings now
  live in `convex/limits.ts`, which imports nothing of ours.

- **A second silent drop, in the widget.** `/visitorSay` answers 200 with
  `{ ok: false }` when it refuses, and the widget only handled a network
  failure. So a refusal rendered as sent: the visitor watches their own
  message sit in the thread believing a person is reading it. Fixed in
  `web/embed/src/embed.js`; it mattered the moment a rate limit existed, but
  it was already true for `not in handover`.

- **`npm audit fix` could not reach the critical one.** `package.json` pinned
  `next` to an exact `16.2.10`, so the fix was outside the declared range and
  npm left it. The remedy was `npm i next@16.4.6`, same major, which cleared
  four unauthenticated RCE advisories (Image Optimization with SVG and AVIF,
  `next/og`, `use cache`). `eslint-config-next` was bumped to match, because
  a lint config a minor behind its framework is its own slow problem.

- **Disk was full**: 532 MB free on 228 GB, which is what the ENOSPC during
  the second `npm audit fix` pass actually was. Cleared with Rafiul's say-so.

## Where it stands

| | Before | After |
|---|---|---|
| Workflows naming an error workflow | 0 of 12 | 12 of 12, plus the handler |
| Rate-limited public routes | chat only | chat, hello and say |
| Advisories | 37 (2 critical, 11 high) | 23 (0 critical, 2 high) |
| Widget suite | every suite passed | every suite passed, +94 assertions |

The 23 that remain need either a major bump (`next-sanity@11`, which pulls
the whole Sanity CLI tree with it) or an override of the lint tooling Next
itself pins. Neither is a thing to do the night before a client meeting, and
both are named here rather than quietly left.

## Not done, and why

- **Nothing is pushed.** The twelve workflows on the instance still have no
  `errorWorkflow`, because `push.py` is what resolves the id and six of those
  workflows are live and answering the public right now. That push, and
  whether the error handler is activated, is Rafiul's call.
- **Convex is still the dev deployment**, so the rate limits are in the code
  and not yet in front of the public routes.
- `npm audit fix --force`.
