# Scope

## Why this audit is happening

A client meeting tomorrow, 16 November, hands over the credentials the system
has been waiting on: Twilio, Meta, an IMAP password, Retell billing. The
requirement Rafiul set is precise: **after adding those credentials, everything
must work end to end with no surprises.**

That makes this a specific kind of audit. The question is not "is this good
code". It is: **when the placeholders are replaced tomorrow, what breaks?**

Every finding is judged against that. A flaw that only bites under load in six
months is a minor here. A flaw that makes tomorrow's first real text go to the
wrong person is a blocker.

## In scope

| Area | What |
|---|---|
| `widget/gates/` | The plain-JS logic files, asserted by tests and inlined into n8n Code nodes |
| `widget/convex/` | Schema, queries, mutations, HTTP routes behind `x-ohm-secret` |
| `widget/n8n/` | `build-workflows.py` and the 12 generated workflows |
| `widget/tests/` | The suite, and whether it asserts anything real |
| `app/lead-dashboard/` | The internal dashboard the client reads |
| The live instance | srv1836598, what is active, and how it differs from local |

## Out of scope, and why

- **The marketing site's content pages.** Not part of the engagement package
  and not touched by this work.
- **Pushing, deploying or activating anything.** No credential exists yet and
  nothing goes live without Rafiul's approval. This audit reports.
- **Paid API calls.** A live chat turn costs money and needs permission. Where
  a check would require one, it is recorded as not checked rather than skipped
  silently.
- **App Review and the Meta production switch.** Development Mode covers
  everything buildable today.

## Severity, for this project

| Word | Means |
|---|---|
| **Blocker** | Tomorrow, with credentials in, this sends the wrong thing to a real person, loses a lead, or exposes a secret. Must be fixed before go-live. |
| **Major** | Works, but a foreseeable real case breaks it, or the client is shown a number that is wrong. |
| **Minor** | Real, worth fixing, no immediate consequence. |
| **Note** | Observation. Not reproducible, or a judgement call. Kept separate so it cannot dilute the findings. |

The sharpest line in this project: **texting a client's customer twice, or
texting the wrong person, is the worst thing this system can do.** Anything
touching that is a blocker by default.

## Passes

- [ ] Cold start: does the builder and suite run from the documented commands
- [ ] Tests: present, passing, and asserting something real rather than tautologies
- [ ] Correctness: the placeholder paths, read against what tomorrow replaces them with
- [ ] Error paths: bad input, timeouts, empty state, partial failure, retries
- [ ] Auth: the Convex secret, the public routes, the webhook locks
- [ ] Secrets: nothing committed, nothing logged, nothing in the client bundle
- [ ] Data: schema integrity, unbounded growth, the dev-vs-production question
- [ ] UI: the dashboard driven in a real browser
- [ ] Performance: the paths that carry volume
- [ ] Observability: would a failure be noticed without a client reporting it
- [ ] Dependencies: versions and advisories
