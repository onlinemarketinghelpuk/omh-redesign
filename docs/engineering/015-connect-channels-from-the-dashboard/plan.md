# Connect every channel from the dashboard

Asked by Rafiul, 16 November 2026: "ami cassi dashboard thekei jeno all
channel connect kora jai", the way the Ecomsixx dashboard does it. Some
channels are already connected; the ones that are not should be connectable
from the Integrations screen, by the owner, without anybody editing a file.

This reverses one line of plan 014 ("this screen is not a form for pasting
credentials") on purpose. 014 was right that a token typed into a page cannot
by itself become an n8n credential. n8n's own API can create one, though, and
that is the route this takes.

## How Ecomsixx does it, and why OHM cannot copy it as is

Ecomsixx (`components/dashboard/Integrations.tsx`) shows a card per channel:
icon, a status chip, a description, then "Setup instructions" opening the
steps and the credential fields from a connector registry, a Connect button,
a two-step Disconnect, and "Ask for help" on a card that is stuck. Connect
encrypts the token and stores it in Convex, because Convex is what talks to
Meta and WhatsApp there.

In OHM it is n8n that talks to Twilio, the mailboxes and Meta. The values live
inside the workflows, put there by `build-workflows.py`, which writes a
`*_PENDING` placeholder for anything it does not have. So for OHM, connecting
a channel means changing n8n. The card is Ecomsixx's; what Connect does
underneath is ours.

## What Connect does

1. **Test the value with the provider before anything is saved.** A wrong
   token never reaches n8n. Twilio: the account answers with these keys, and
   the number belongs to it. Meta: the Page answers with this token and its
   id matches. Mailboxes: an IMAP login and an SMTP `verify()` succeed. The
   booking script: its read-only `freebusy` answers.
2. **Secrets go where they are protected.** A Twilio auth token and a mailbox
   password become an n8n credential (n8n encrypts it; we keep only its id).
   The Meta Page token and app secret cannot be credentials, because the Meta
   workflow uses them in a Code node, so they are stored in a Convex setting
   that only a holder of `OHM_WIDGET_SECRET` can read (the dashboard server
   and the builder), and are **never returned to a browser**: the screen sees
   "set, ends in ...a91c".
3. **The live workflows are patched in place.** The placeholder in each
   workflow is replaced by the real value (or credential id) through n8n's
   API, and the workflow is saved with its active state untouched.
4. **The builder reads the same values.** `build-workflows.py` asks Convex for
   them before it falls back to `.env.local` and then to `*_PENDING`, so the
   next rebuild and push does not quietly put the placeholders back.
5. **The status is re-measured, not assumed.** After Connect the card shows
   what the 014 checks say, the same as on a fresh page load.

## The connectors

| Card | What the owner enters | Test | Where it lands |
|---|---|---|---|
| Text messages (Twilio) | Account SID, auth token, UK number | `GET /Accounts/{sid}.json`, then the number is on that account | n8n `twilioApi` credential; number replaces `TWILIO_NUMBER_PENDING` in Lead Router, Sequence Worker, Twilio Inbound |
| Facebook and Instagram | Page id, Page access token, app secret. We generate the verify token and show the callback URL to paste into Meta | `GET graph.facebook.com/{page-id}` with the token | Convex (secret); replaces the three `META_*_PENDING` in Meta |
| Google Ads lead forms | Nothing: we generate the key, and show it with the webhook URL to paste into Google Ads | none needed | Convex; replaces `GOOGLE_LEAD_FORM_KEY_PENDING` in Lead Router |
| Reply mailbox (IMAP) | Host, port, user, password | IMAP `LOGIN` over TLS | n8n `imap` credential; replaces `IMAP_CRED_PENDING` in Email Inbound |
| Sending mailbox (SMTP) | From address, host, port, user, password | nodemailer `verify()` | n8n `smtp` credential; replaces the stand-in Gmail credential and address |
| Booking calendar | Script URL, secret | the read-only `freebusy` call | Convex; the site reads it before its environment |
| Follow-up sender | nothing | none | a "Turn on" button that activates the Sequence Worker, and Email Inbound once its mailbox is connected |

Not in this plan, and said so on their cards: **outbound calls** (importing a
number into Retell and creating the outbound agent run `create-outbound-
agent.py` against Retell, which needs a decision on cost first) and
**WhatsApp** (nothing is built).

## Disconnect

Two steps, as in Ecomsixx. It puts the placeholders back in the workflows,
which is the honest effect ("this channel stops"), deletes the n8n credential
it created, and clears the Convex value.

## What must not go wrong

- **No secret in a response to the browser.** A test reads every route the
  screen calls and asserts no stored secret appears in it.
- **A failed test changes nothing.** n8n and Convex are only written after
  the provider has said yes.
- **A half-applied connect is reported, not hidden.** If the credential is
  created but a workflow fails to save, the card says which, and the 014
  status shows the truth on the next load.
- **Only the owner can do it.** Every action checks the dashboard password, as
  the other server actions do.

## Tasks

- [x] 1. `gates/connectors.js`: the registry (fields, steps, what each one
      replaces), field validation, and `patchWorkflow(raw, replacements)`.
      Plain JS, one export line.
- [x] 2. `tests/connectors.test.ts`, red first: validation, the patch on the
      real built workflows (every placeholder found, nothing else touched,
      the active state kept), redaction.
- [x] 3. Convex: the `integrations` setting, a write route, and a read route
      that redacts secrets for the dashboard and gives them in full only to
      the builder.
- [x] 4. `lib/dashboard/connect.ts`: the provider tests, n8n credential
      create and delete, the workflow patch, and a dry run that does
      everything except write.
- [x] 5. The cards on the Integrations screen, Ecomsixx's pattern: steps,
      fields, Connect, two-step Disconnect, the URLs to copy.
- [x] 6. `build-workflows.py` reads the Convex values first.
- [x] 7. The site reads the booking script from Convex before its env.
- [x] 8. Prove it: the dry run against the live workflows finds every
      placeholder it should; the full suite; the screen at phone and desktop
      sizes.

## Done, 16 November 2026: what ran and what it found

Evidence from real runs. Nothing was written to n8n, Convex or any provider.

- **connectors.test.ts, 149, red first** (the gate moved aside). The patch is
  run on the real built workflows: it removes exactly its own placeholders,
  keeps every other one and every node, never sends `active`, and
  disconnect restores the original byte for byte. No rule changes the chat
  or voice workflow. A Page token with a quote in it is refused. Redaction
  holds, and the page, the library and the actions are held at source to
  pass only redacted values to the browser. Teeth: disconnect without the
  builder's credential name failed 4 (a real bug, found that way); an
  unredacted Page token fails 3.
- **Dry run against the live systems:** the Google key's slot found in the
  live Lead Router and nothing written; made-up Twilio keys refused by Twilio;
  a made-up Page token refused by Facebook ("Malformed access token"); bad
  values refused before any provider was asked.
- **In a real browser, signed in:** bad values give errors under each field
  and ask no provider; made-up Twilio keys come back "Twilio did not accept
  that Account SID and Auth Token"; the token box is emptied after every
  attempt; secret fields are password inputs; no page errors; no horizontal
  scroll at 390. Screenshots looked at.
- **The builder:** with a stub answering like `/integrations/get`, every
  connected value reached the built workflows and their placeholders were
  gone. With Convex unreachable (today) it says so and uses `.env.local`.
- **The booking form** behaves exactly as before while nothing is connected
  (`not_configured`, 503).
- Full suite 2378, every suite passed. Lint and source typecheck clean;
  the Convex folder typechecks apart from one existing `process` type.

### Found while building it

- **Whole placeholder names inside gate code.** The integrations gate's own
  table, once inlined into Chat and Voice, made those workflows look as if
  they held every placeholder; a comment in the Google gate made the Lead
  Router look as if it held its key twice, and the patch would have written
  the webhook key into the comment. Both fixed; the suite now holds every
  `gates/*.js` file to no whole placeholder name.
- **Switching the Sequence Worker on is offered only when it is the last
  thing missing for BOTH texts and email,** and asks first. It sends every
  follow-up, so switching it on with Twilio still a placeholder would email
  real people and fail every text. Today it is not offered, correctly.

### Not built, and said so on their cards

Outbound calls (a Retell number import and the outbound agent, with a cost
to agree) and WhatsApp (nothing built).

## What needs Rafiul before it is live

- The Convex push (`integrations` module and routes, with 014's) and the
  site deploy. Until then Connect gets as far as the provider and n8n, then
  reports "connected only in part: the record of it in the routing store".
  Do not use Connect before the push.
- The website needs `N8N_BASE_URL` and `N8N_API_KEY` where it is deployed.
  Connect writes through that key, so it is an admin key on the web server:
  the same decision as for 014, with more riding on it.
- The first real Connect writes to live n8n. It should be done by the owner
  with OMH's real values, not by a test.
