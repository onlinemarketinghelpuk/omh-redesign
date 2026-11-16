# What to deploy, and in what order

Everything below is on `main` at `cb99f7d`. `onlinemarketinghelp.co.uk` is
this Next.js app, so one deploy of this repo ships the website, the dashboard,
the API routes and the chat widget together.

**There is one ordering rule, and getting it wrong breaks five screens:**
deploy Convex before the site. The control panel's screens read Convex
functions that do not exist on the deployment yet. The site will build
perfectly and those five pages will fail at request time.

---

## 1. Convex first

The deployment is `cool-ferret-103`. Four new modules (`flows.ts`, `brain.ts`,
`flowRuntime.ts`, `limits.ts`) and three new tables in `schema.ts`.

To confirm whether it has already gone out, ask the deployment for a function
that only exists in this commit:

```sh
curl -s -X POST https://cool-ferret-103.convex.cloud/api/query \
  -H 'content-type: application/json' \
  --data '{"path":"flows:listFlows","args":{},"format":"json"}'
```

`Could not find public function for 'flows:listFlows'` means it has not
been deployed. `{"status":"success"...}` means it has.

**Deployed on 16 November 2026**, which added the `flows`, `flowVersions`,
`messageTemplates` and `messageHistory` indexes. The five control panel
screens came out of read-only mode in the same minute.

> **`cool-ferret-103` is still a development deployment.** Dev deployments are
> not meant to hold a live client's customer data and carry no production
> guarantees. Moving it to production is a decision to take before real leads
> start flowing, not after, and it is not part of this deploy.

## 2. Then the site

Self-hosted on the VPS, in Docker, behind the same Traefik that n8n already
runs on. There is no CI, so it is a pull and a rebuild on the box:

```sh
git pull origin main
docker compose up -d --build
```

`npm ci && npm run build` is the equivalent if you are not using the compose
file. `prebuild` rebuilds the chat widget into `public/ohm-assistant.js`, so
nothing extra is needed for it.

### One environment variable to add

```
OHM_LEAD_ROUTER_URL=<the n8n lead router webhook URL>
```

Without it the website's own forms still email the team exactly as they do
today, and nothing errors. With it, every form fill also enters the engagement
package: a lead row, its attribution, and route B's text and email inside two
minutes. It is the single variable that connects the marketing site to the
system, and it is read in `app/api/enquiry/route.ts`.

## 3. n8n, separately

Three workflows have never been pushed (`00-error`, `10-meta`,
`12-email-inbound`) and the other ten need rebuilding, because they now carry
an `errorWorkflow` link, the voice workflow has moved to Retell's v3 endpoint,
and the SMTP credential is read from configuration rather than hardcoded.

```sh
cd ../widget
python3 n8n/build-workflows.py
python3 n8n/push.py
```

`push.py` creates workflows **inactive** and its update payload carries no
`active` field, so nothing starts sending by itself. Activating is a separate
flag and a separate decision.

---

## How to tell the deploy worked

| Check | Before | After |
|---|---|---|
| `curl -s https://onlinemarketinghelp.co.uk/ohm-assistant.js \| wc -c` | 30922 | 31257 |
| `/lead-dashboard/control` | 404 after login | loads |
| The `flows:listFlows` probe above | not found | returns |

Checking `/lead-dashboard/control` from the outside without signing in tells
you nothing: everything under `/lead-dashboard` redirects to the login page
whether the route exists or not.

## What changes for a visitor

- **Filling in any form on the site now reaches the system.** Six forms posted
  to `/api/enquiry`, which emailed the team and stopped. No lead row, no
  attribution, no route, no follow-up. Route B was built and tested and
  nothing fed it. Needs `OHM_LEAD_ROUTER_URL` above.
- **Voice in the browser works again.** Retell switched off
  `v2/create-web-call` and returned a warning-shaped body, so nothing failed
  loudly and it was dead for four days. It is on v3.
- Somebody who chats on the site and later messages the Facebook Page is now
  one person rather than two records.

## What changes for OMH

Five new screens, which together are the control panel: `/control` for what
happens to a lead from each channel, `/messages` for what the messages
actually say, `/brain` for who answers replies, `/flows` for the order they go
in, and `/agent` for the calling agent.

The compliance property moved with them and did not become a checkbox. A call
step exists only on routes where the person contacted us first. On a marketing
flow the Call node is absent from the palette rather than disabled, Convex
refuses the whole flow server side whatever produced it, and the test suite
asserts that over saved flows and not only over the code. PECR regulation 19
is the reason.

Also: the dashboard was reading 25 rows and reporting them as the total. It
had survived several browser passes because `?demo=1` never reaches the query.

## What still will not work, and is not a bug

1. **Nothing texts or calls anybody.** There is no Twilio number yet, so
   `07-router`, `08-sequence-worker`, `09-twilio-inbound` and `11-reactivation`
   stay inactive. See `../CLIENT-ACCESS-LIVE-CALL.md` and
   `../pdf/OMH-Switching-On-Your-Channels.pdf`.
2. **Two people can still book the same slot.** The form reads availability,
   but the guarantee is a lock inside the Google Apps Script, and that script
   has not been redeployed. The new version is in
   `docs/google-calendar-booking.md`, and it must go out as a NEW VERSION of
   the existing deployment so the URL does not change.
3. **Facebook and Instagram are not connected.** The routes exist and are
   tested; the access does not.

## If something looks wrong

The chat, the dashboard and the widget all read from Convex
(`cool-ferret-103`) and n8n (`srv1836598`). If the site builds but the
assistant is silent, or a dashboard screen is empty rather than broken, it is
one of those two and not this deploy. n8n's execution log is worth reading
before anything else: the voice outage above was visible there and nowhere
else.
