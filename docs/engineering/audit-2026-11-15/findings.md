# Findings

Judged against one question: **when the placeholders are replaced tomorrow,
what breaks?**

These are the passes run directly. Four further passes (secrets and auth,
Convex data and error paths, test quality, dashboard correctness) were run in
parallel and their results are merged in below as they land.

---

## F-01 · Major · FIXED · Tomorrow's Twilio step was a code edit, not a config change

**Where:** `widget/n8n/build-workflows.py:1003`

```python
TWILIO_CRED = {
    "twilioApi": {"id": "TWILIO_CRED_PENDING", "name": "Twilio — OMH"}
}
```

Every other value tomorrow needs is read from `.env.local`:

```
MAIL_FROM  TWILIO_FROM_NUMBER  RETELL_FROM_NUMBER
GOOGLE_LEAD_FORM_KEY  META_VERIFY_TOKEN  META_APP_SECRET  META_PAGE_TOKEN
```

The Twilio **credential id** is not. It is a literal in the source. So the
documented path, "put the values in `.env.local`, rebuild, push", silently
does not cover it, and three workflows (`07-router`, `08-sequence-worker`,
`09-twilio-inbound`) push with a credential reference pointing at nothing.

**Reproduce:**
```
grep -n 'env.get("' widget/n8n/build-workflows.py   # 7 values
grep -n 'TWILIO_CRED_PENDING' widget/n8n/build-workflows.py   # not among them
```

**What it costs:** the failure is loud rather than silent (n8n reports an
unknown credential on execution), so nothing wrong gets sent. The cost is
meeting-day time spent on a surprise, and a real risk of someone fixing it by
hand in the n8n UI, which this project forbids because the next rebuild
overwrites it.

---

## F-02 · Major · FIXED · The IMAP node had no credential block, so push could not bind it

**Where:** `widget/n8n/build-workflows.py`, `build_email_inbound()`, the
`New Mail` node

Every other node that needs a credential carries one:

| Workflow | Node | Credential |
|---|---|---|
| 01-chat | Chat Model, Fallback Model | `openRouterApi` (real id) |
| 05-notify | Email The Team | `smtp` (real id) |
| 07-router | Send The Text / Send The Email | `twilioApi` (placeholder) / `smtp` |
| 08-sequence-worker | Text Them / Email Them | `twilioApi` / `smtp` |
| 09-twilio-inbound | Answer Them | `twilioApi` |
| **12-email-inbound** | **New Mail** | **none at all** |

**Reproduce:** the script in the audit log that walks every node and prints its
`credentials` key. `New Mail` prints `NONE`.

**What it costs:** tomorrow the IMAP password arrives, a credential is created
in n8n, and pushing `12-email-inbound` still produces a node bound to nothing.
Someone then binds it in the UI, and the next `push.py` run silently reverts
it. This is the exact failure mode the "never touch the UI" rule exists to
prevent.

---

## F-03 · Minor · Nothing would tell us the system had stopped working

**Where:** every workflow

- 51 of 136 nodes are set to `continueRegularOutput`.
- **No workflow has an `errorWorkflow` configured.** All twelve report `NONE`.

The per-send case is handled properly and is recorded as verified below. The
gap is systemic failure: if Convex went down, or a credential expired, or a
webhook stopped being delivered, every execution would still finish green and
the first signal would be the client asking why nobody has been called.

**What it costs:** time-to-notice on an outage is currently "until a human
notices", against a product whose entire promise is responding within two
minutes.

---

## F-04 · Major · Two public write endpoints have no rate limit

**Where:** `convex/http.ts`, the `publicRoute` handlers for `/visitorHello`
and `/visitorSay`

These are called directly from a visitor's browser, so they are unauthenticated
by design: anyone on the internet can POST to them. Five of the six public
routes are fine. Two are not:

| Route | Convex function | Kind | Rate limited |
|---|---|---|---|
| `/visitorPoll` | `handover.poll` | query | n/a |
| `/visitor/history` | `visitors.historyForVisitor` | query | n/a |
| `/visitor/attachment/url` | `attachments.uploadUrl` | write | **yes** |
| `/visitor/attachment/attach` | `attachments.attach` | write | via `canAttach` |
| **`/visitorHello`** | **`visitors.hello`** | **write** | **no** |
| **`/visitorSay`** | **`handover.visitorSay`** | **write** | **no** |

The attachment paths were clearly thought about: `uploadUrl` takes a slot from
`bump()` against both a per-session and a per-deployment cap. The two older
routes were not given the same treatment.

**Reproduce:** the script in the audit log that resolves each public route to
its Convex function and greps the handler body for `bump(` or `checkLimit`.
`hello` and `visitorSay` contain neither.

**What it costs:** anyone can POST `/visitorHello` with freshly invented
session and visitor ids in a loop and create unbounded rows in `sessions`, and
POST `/visitorSay` to create unbounded rows in messages. Two consequences, and
the second is worse than the bill:

1. Convex storage and bandwidth on a deployment that is still a **dev**
   deployment with no production guarantees.
2. **The client's dashboard fills with junk sessions.** The test-row filter
   excludes *our* test traffic by name and id pattern; it has no way to
   recognise invented sessions from a stranger. The agency would be reading
   conversation counts that include them.

It is not a tomorrow-blocker, because no credential changes it, and it needs
someone to actually go looking. It is a gap, and the brief was no gaps.

---

## F-05 · Note · Dependency advisories, including two criticals

`npm audit --omit=dev` reports 31 vulnerabilities, 18 moderate, 11 high, 2
critical.

**The `next` critical does not apply here**, and this was checked rather than
assumed. The advisory is a middleware/proxy bypass in App Router apps *using
Turbopack and a single locale*. This app has **no `middleware.ts` at all**, no
Turbopack flag in its build script, and no i18n or locale configuration, so the
preconditions are absent. Recorded as a note, not a finding.

Two worth a look on their own merits, because they sit on paths this product
actually uses:

- `nodemailer` (high): a process-global DNS cache reuses the TLS `servername`
  across transports. This system sends client email through nodemailer.
- `dompurify` (critical): relevant only wherever untrusted HTML is sanitised.

Neither is demonstrated to be exploitable here, which is why both are notes.

---

# Verified as working

As useful as the findings, because it stops the next session re-checking them.

| Area | How it was proved |
|---|---|
| **Nothing goes live by accident** | `push.py` creates workflows **inactive**, its update payload carries no `active` field so a live workflow stays as it is, and `--activate` is a separate opt-in flag. `--only <text>` allows pushing one workflow. |
| **A failed send is not recorded as sent** | `08-sequence-worker` routes all three senders through `Sent Or Not`, which normalises Twilio, SMTP and Retell into one `failed` / `sent` answer and reports it to `completeStep` **with the lease token**. The `continueRegularOutput` on the senders is deliberate: it catches the error so it can be inspected, not so it can be ignored. |
| **Every Convex route a workflow calls exists** | Cross-checked all 28 called paths against the 66 declared in `convex/http.ts`. Zero missing. This pass found two broken paths earlier today in `10-meta` (`/meta/lead` and `/touch`); both fixed, and the check is now permanent in `tests/channel-coverage.test.ts`. |
| **Every channel reaches a route, and the compliance property holds** | `tests/channel-coverage.test.ts`, 74 assertions: every source channel maps explicitly rather than falling back, `facebook_ads` and `instagram_ads` land on a route with no call step, every route step has something that can send it. Teeth proven by pointing `facebook_ads` at route B and watching two assertions fail. |
| **The pushed workflows match local, with no surprises** | Every live workflow diffed node by node against the server. `03/04/05/07/11` identical; `01-chat` differs by the intended Sonnet switch and two `outputKey` additions; `02-voice` and `06-roi-leads` differ by exactly one added `http://localhost:3100` origin, purely additive. `10-meta` and `12-email-inbound` have never been pushed. |
| **The Next.js critical advisory's preconditions are absent** | No `middleware.ts`, no Turbopack flag, no locale config. |
| **One visitor cannot read another's conversation** | `/visitor/history` scopes on `visitorId`, and the shared `publicRoute` guard only checks that *a* session id is present. That looks like the classic hole, and it was one: `historyForVisitor` now requires **both** values and verifies the session row's `visitorId` matches, returning empty otherwise (`convex/visitors.ts`). Separately, `hello` no longer re-points an existing session at whatever visitor id the caller sends. Both were found and fixed in an earlier pass, and both carry a comment explaining the attack, which is why they stayed fixed. |
| **Client-facing numbers exclude our own test traffic** | The filter is applied in the **data layer**, not per screen: `lib/dashboard/convex.ts` filters leads, bookings, escalations and sessions through `isTestRow` inside `getWidgetData`, and returns a `hidden` count alongside. So a screen that never imports `test-rows` still receives filtered data. A per-screen grep suggests otherwise and is misleading; the data-layer placement is the better design because there is one copy of the rule. |

---

# Not checked, and why

- **A live chat turn.** It costs a paid API call and needs Rafiul's permission.
  This is the one thing that should be done immediately after the Sonnet push.
- **Anything requiring a credential that does not exist yet**: a real Twilio
  send, a real Meta webhook delivery, an IMAP fetch, a Retell outbound call.
  These are the reason for tomorrow's meeting.
- **App Review and the Meta production switch.** Out of scope by decision.
