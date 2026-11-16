# Remediation

Ordered by damage prevented per unit of effort, not by what is easiest.

## Baseline, recorded before anything is fixed

```
zsh widget/tests/run.sh      every suite passed
                             29 Code nodes across 12 workflows
                             channel coverage 74 assertions
                             meta 56 assertions
git status                   clean except the intended work in progress
```

A fix that breaks any of this is immediately visible against that line.

---

## Group 1 · DONE · Clear tomorrow's path

**F-01** and **F-02**. Both turn tomorrow's "edit `.env.local`, rebuild, push"
into something longer, and both are small.

| Fix | Change | Risk of the fix |
|---|---|---|
| F-01 | Read the Twilio credential id from `.env.local` like every other value: `TWILIO_CRED_ID = env.get("TWILIO_CRED_ID", "TWILIO_CRED_PENDING")` | None. It is the same literal until the env var exists, so the built output is byte-identical today. |
| F-02 | Give the `New Mail` node a `credentials` block reading `IMAP_CRED_ID` the same way | None, for the same reason. The workflow is not pushed and not active. |

**Applied 15 November, approved by Rafiul.** `TWILIO_CRED_ID` and
`IMAP_CRED_ID` now come from `.env.local` like every other value.

Proof the fix changed nothing today: all 12 built workflows were hashed before
and after. **11 were byte-identical.** The twelfth, `12-email-inbound.json`,
changed by exactly the credential block it previously lacked. Proof the fix
works: setting both ids in `.env.local` and rebuilding puts the real ids into
all four nodes, and removes them from the placeholder count. Full suite green
afterwards, 29 Code nodes across 12 workflows.

The plan gate was waived for this, with the reason recorded, rather than
worked around.

---

## Group 2 · Close the public write paths (this week, not tonight)

**F-04**. Two unauthenticated endpoints that can grow tables without limit.

The mechanism already exists and is already proven on the attachment routes:
`bump(ctx, key, max, now)` in `convex/functions.ts`. The work is applying it to
`visitors.hello` and `handover.visitorSay` with a per-session and a
per-deployment cap, and choosing the caps.

**This needs its own workstream, not a quick patch**, for one reason: a cap set
too low silently stops a real visitor mid-conversation, which is worse than the
problem being fixed. It needs a test asserting that a normal conversation never
trips the limit, alongside one asserting that a loop does.

```sh
forge new "Rate limit the two public write routes"
```

---

## Group 3 · Know when it breaks (before real leads flow)

**F-03**. No workflow has an `errorWorkflow`, and 51 of 136 nodes continue on
error.

The per-send case is already handled correctly and should not be changed. What
is missing is a single error workflow, set on all twelve, that notifies when an
execution actually fails. `05-notify` already proves the notification path
works.

Worth doing before the system carries real leads, because the product's promise
is a response inside two minutes and the current time-to-notice on an outage is
"until the client asks".

---

## Group 4 · Dependencies (not urgent, do not rush)

**F-05**. `npm audit fix` resolves most of them without a major bump. The two
criticals are either inapplicable (`next`, preconditions absent and verified so)
or unproven here (`dompurify`).

**Do not run `npm audit fix --force` before a client meeting.** It takes
breaking changes across Next.js and Sanity, and the cost of a broken build
tomorrow is far higher than the risk being closed.

---

## Deliberately not fixed, and why

**The PSID merge in `findPerson`** (workstream 006, task 7). A person who DMs
and later fills in a form becomes two leads rather than one. The fix needs a
new index in `schema.ts`, which means deploying Convex, and Convex is still a
**dev** deployment. That decision belongs with the production question, in
front of Rafiul, not quietly inside an audit.

**Everything requiring a credential.** A real Twilio send, a real Meta webhook
delivery, an IMAP fetch, a Retell call. These are what tomorrow is for, and
each should be exercised once, for real, the day the credential lands.
