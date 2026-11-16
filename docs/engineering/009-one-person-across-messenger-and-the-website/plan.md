# Plan

The last thing on our side of the OMH package: a person who writes on
Messenger and a person who fills in the website form are the same human, and
today they are two rows.

## What is actually true now

`findPerson` merges on three keys: `phoneKey`, `emailKey` and `visitorIds`.
Grepped the whole backend: **`psid` appears nowhere in `convex/`**. So:

| Path | What identity reaches Convex |
|---|---|
| Meta lead ad (route C) | name, phone, email from the Graph fetch. No PSID, because a lead form has none. |
| Meta DM (route D) | `sessionId: "meta:<psid>"` and nothing else. **No lead row is created at all.** |
| Website | `visitorId` from localStorage, plus whatever they type. |

The failure, concretely: somebody DMs the Page, chats, gives no phone or
email, so there is no lead. A week later they fill in the website form. Two
rows, no way to join them, and the client's dashboard says two enquiries
where there was one person. Facebook and Instagram go live tomorrow, so this
shows up on the first day.

## The decision, and why it is cheaper than the earlier plan said

Workstream 006 recorded this as blocked on a schema index, meaning a Convex
deploy. It is not. `visitorIds` is already an array matched by scanning the
most recent 500 leads, precisely because **Convex cannot index into an
array**. A PSID is the same shape of problem, so it gets the same treatment
and needs no new index.

Second, and better: the PSID does not need plumbing through the chat agent's
tool call, because **`sessionId` is already `"meta:<psid>"`**. Deriving it in
`saveLead` means one place, derived from data that is already there, and it
cannot be forgotten by a caller. An explicit `psid` argument is accepted too,
for the DM router path, but nothing has to pass it for this to work.

## Tasks

- [x] 1. `leads.psids: v.optional(v.array(v.string()))` in `schema.ts`,
      alongside `visitorIds` and for the same reason.
- [x] 2. A `psidFromSession` helper in `visitors.ts`: `"meta:<psid>"` yields
      the psid, anything else yields nothing. Exported, because the test
      asserts it and because the next caller should not re-derive it.
- [x] 3. `findPerson` takes `psid` and matches it the way it matches
      `visitorId`, in the same scan rather than a second one.
- [x] 4. `saveLead` accepts an optional `psid`, derives one from the session
      when it was not passed, uses it in the `findPerson` lookup, and adds it
      to `psids` on both the merge and the insert path.
- [x] 5. Order matters and must be asserted. Phone and email still win over
      PSID: they are what a human confirmed, a PSID is what a platform
      assigned. A PSID must never override a phone match.
- [x] 6. The direction that would be a data leak if wrong: one PSID must
      match exactly one person, and an empty or absent PSID must match
      **nobody**. `"meta:"` with nothing after it, a bare `""`, and a session
      id that merely contains "meta" are each asserted to find no one. A
      falsy key that matched the first lead in the scan would hand a
      stranger's record to whoever DMs next.
- [x] 7. Tests, watched failing first, then the mutation check: remove the
      psid arm and confirm the merge assertions fail.
- [x] 8. Regression: the full widget suite, and `attachments`/`attribution`
      in particular because they drive `saveLead` hardest.

## Not in scope

- Creating a lead for every DM. A DM is a conversation, not an enquiry, and a
  row per curious person would inflate the lead count the client is paying
  attention to. The PSID is recorded when they become a lead.
- An index on `psids`. Convex cannot index into an array, and the scan is the
  established pattern here. If leads reach the tens of thousands, visitors
  get their own table, which is already written down against `visitorIds`.
- Deploying it. Convex is still the dev deployment and that is Rafiul's call.

## What it cost, and one thing the plan had wrong

The earlier note in workstream 006 said this was blocked on a schema index
and therefore on a Convex deploy. That was wrong, and checking it was the
cheapest part of the work: `visitorIds` is already matched by scanning,
precisely because Convex cannot index into an array, so a PSID needed no
index at all. The deploy is still needed for the schema field to exist in
front of real traffic, but nothing here was blocked on a decision.

`findPerson` does ONE scan for both array keys rather than two. A browser id
and a PSID are never both present anyway: a DM has no browser, a website
visit has no PSID.

**A test fixture of mine was wrong, not the code.** I wrote the phone key as
`447700900123`; `phoneKey` keeps the plus, so it is `+447700900123`. The
assertion that caught it was the right one (a confirmed phone must beat a
platform id), it was just fed a key that could never match.

Mutation check, both directions:

| Mutation | Result |
|---|---|
| `findPerson` stops matching a psid | 12 assertions fail |
| an empty remainder becomes an empty-string key | 2 assertions fail |

The second is the leak: a falsy key would match the first lead without a
psid and hand a stranger's name, phone and email to whoever writes to the
Page next. It is refused in two places, `psidFromSession` returning nothing
for an empty remainder and `findPerson` guarding on a truthy key, and the
test proves the first half.

## Not done

Deploying it. Convex is still the dev deployment, so `psids` is in the schema
file and not yet in front of real traffic.
