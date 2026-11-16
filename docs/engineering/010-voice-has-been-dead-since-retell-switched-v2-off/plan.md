# Plan

The widget's Voice tab has not worked for at least four days, and nothing in
the system said so.

## How it was found, and what it actually was

`npm run embed:verify` reported 20 passes and 2 failures, both on the voice
tab: "Start call fetches a live Retell web-call token" with `HTTP 200, token
missing`. The first guess, that the Retell agent had gone or the account was
out of credit, was wrong. The agent id is present and correct.

The answer came out of n8n's own execution log, which is a free read and
needed no call to Retell at all. Five of five recent executions of
`OHM Assistant — Voice` errored, all with the same thing:

```
Deprecated API usage is no longer supported: Create Web Call v2
https://docs.retellai.com/deprecation-notice/2026/09-30_create_web_call_v2
```

Oldest in the window: 2026-11-12. Retell did not merely deprecate
`POST /v2/create-web-call`, they switched it off, and what they return is a
warning-shaped body rather than an obvious error, so n8n recorded a failed
execution and the browser simply received no token.

**Nothing was watching n8n executions.** That is the same hole workstream 008
closed with `00-error`, and this is what it looks like when it is open: a
headline feature dies, the client's site shows a Voice tab that does nothing,
and it surfaces four days later by accident.

## The fix is in three places, and two of them are easy to miss

| Where | Change |
|---|---|
| `build-workflows.py`, the create node | `/v2/create-web-call` becomes `/v3/create-web-call`. The request body is unchanged. |
| `build-workflows.py`, `Respond Token` | v3's RESPONSE is not the same. It now carries `transport` and `ice_servers`, and the browser needs both plus `call_id`. It was returning only `access_token` and `call_id`. |
| `web/embed/src/embed.js` | SDK 2.0.5 to 3.0.4, and all four fields passed into `startCall`. |

The browser half is the one that would be left behind, and fixing only the
endpoint would have looked right and still not connected a call. v3 answers
with `transport: "gateway"`. Read out of the SDK bundle itself rather than
assumed:

- the gateway transport throws `"callId is required for the gateway
  transport"` without a call id,
- it builds its `RTCPeerConnection` from `ice_servers`,
- and `retell-client-js-sdk@2.0.5` contains the strings `transport`,
  `iceServers` and `callId` **zero times**. The old livekit path needed only
  the token, which is exactly why passing only the token was correct for as
  long as it was.

Checked before changing the pin, so the SDK bump is not a leap:

- `RetellWebClient` is still a named export in 3.0.4, so the widget's
  `m.RetellWebClient || m.default.RetellWebClient` resolution is unchanged.
- All four events the widget binds (`call_started`, `call_ended`, `error`,
  `update`) are still emitted by 3.0.4.

## Tasks

- [x] 1. Root cause from n8n's execution log, without calling Retell.
- [x] 2. Read the migration from Retell's own docs rather than from memory.
- [x] 3. v3 endpoint, and all four fields in the webhook's reply.
- [x] 4. SDK to 3.0.4; pass `callId`, `transport` and `iceServers` into
      `startCall`, each only when it actually arrived, because the SDK falls
      back to its own default on a MISSING key and not on an undefined one.
- [x] 5. `tests/voice-call.test.ts`: 20 assertions holding both halves
      together, including that the pin is 3.x or newer and that v2 does not
      come back in a rebuild.
- [x] 6. Regression: full widget suite green, embed rebuilt.

## Not done, and it matters

**This is not verified against Retell.** Proving a call connects means
pushing `02-voice` to the live instance and placing a real web call, which is
a push and a paid provider. Both need Rafiul's word. What is proven is that
the request now matches Retell's documented v3 contract, that the reply
carries what their SDK reads, and that the SDK pinned is one that reads it.

The honest status is: **the diagnosis is confirmed from the live execution
log, the fix is not yet exercised.**
