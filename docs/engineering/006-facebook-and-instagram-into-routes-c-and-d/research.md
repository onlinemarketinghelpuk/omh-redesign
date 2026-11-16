# What already exists, and what is actually missing

**Order note, for honesty:** `gates/meta.js` and `tests/meta.test.ts` were
written before this workstream was opened, while finishing the Sonnet switch.
They are recorded here as done rather than presented as planned work.

## The state before this

Facebook and Instagram are the one capability in the engagement package that
was never built. Everything around them was:

| Already there | Where |
|---|---|
| Routes C and D, fully specified, with `messenger` and `instagram` step channels | `gates/routes.ts:178` and `:226` |
| `facebook`, `instagram`, `facebook_ads`, `instagram_ads` as source channels | `convex/schema.ts:214`, `convex/visitors.ts:171` |
| Old `facebook_dm` / `facebook_page` rows merged so one person is not two | `gates/allocation.js:33` |
| `graph.facebook.com` already allowed for attachments | `gates/attachments.js:46` |
| A working pattern for answering an inbound message with the website's own agent | `build_inbound()`, which POSTs to the `ohm-chat` webhook |

So the engine can already carry these leads. What is missing is the thing that
receives them: there is no `10-meta.json`, and no workflow feeds routes C or D.

## What Meta's webhook actually does, and the four ways it bites

1. **Our own replies come back.** Every message the Page sends is echoed on
   the same webhook, shaped like an ordinary inbound message. Without an
   `is_echo` check the assistant answers itself, reads that answer, and the
   two of them talk on the client's Page until a rate limit stops it.
2. **Meta retries for days** on anything that did not return 200, so every
   event needs an idempotency key or one form fill becomes two leads and two
   sets of texts to a real person.
3. **The timestamps are not the same unit.** `leadgen.created_time` is in
   seconds; Messenger's `timestamp` is in milliseconds. Mixing them puts leads
   in 1970 and makes every speed measure meaningless.
4. **The URL is public and the signature is the only lock.**
   `X-Hub-Signature-256` is HMAC over the **raw** bytes, so a re-serialised
   body fails for reasons that look like a Meta bug.

Also confirmed rather than assumed: the webhook payload carries `ad_id` and
`adgroup_id` but **not `campaign_id`**, so naming the campaign needs a second
Graph call on `ad_id`.

## Two things checked against the n8n node schema, not guessed

The last outage on this project came from guessing how a Code node behaves, so
both of these were read off `nodes-base.webhook` v2.1 rather than recalled:

- `multipleMethods: true` turns `httpMethod` into an array, so **one node**
  serves Meta's verification GET and its event POST on the same path. Meta
  requires the same URL for both.
- `options.rawBody: true` returns the unparsed body, which the signature check
  needs.

## Decisions

**The DM is answered by the existing chat agent, not a second one.** Route D
says the assistant answers in-thread on the same knowledge base. Rebuilding a
27 node agent inside `10-meta` would mean two brains to keep in step. Instead
the workflow POSTs to the `ohm-chat` webhook with `session_id = meta:<psid>`,
exactly as `build_inbound()` already does for SMS. One brain, one knowledge
base, one set of tools.

**No message tag is ever attached.** A message outside the 24 hour window
needs an approved tag that honestly describes it. Route D stops at 20 hours so
the question does not arise, and `sendBody()` has no tag field to misuse.

**Development Mode means this can be finished before App Review.** Admins,
developers and testers of an app may use unapproved permissions, so it can be
tested in full against OMH's own Page. App Review only gates a member of the
public messaging the Page and getting an answer: a switch, not more work.
