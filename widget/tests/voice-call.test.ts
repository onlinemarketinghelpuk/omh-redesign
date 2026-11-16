import { readFileSync } from "node:fs";

/* =========================================================================
   The voice call, end to end on paper: n8n asks Retell for a call, and the
   browser is given everything it needs to join it.

   This exists because the Voice tab was dead and nothing said so. Retell did
   not merely deprecate `POST /v2/create-web-call`, they switched it off, and
   what comes back is a warning-shaped body rather than an obvious failure.
   So n8n recorded an errored execution, no one was subscribed to that, the
   widget got no token, and the panel just sat there. Every call since at
   least 12 November failed this way. It was found by reading n8n's own
   execution log, not by anyone noticing.

   Two halves have to agree, and both are asserted here, because getting one
   right and not the other still leaves voice broken:

     1. n8n calls v3 and passes on ALL FOUR fields v3 answers with.
     2. the browser sends all four into startCall, on an SDK new enough to
        understand them.

   The second half is the one that would be missed. v3 answers with
   `transport: "gateway"`, and the gateway transport throws
   "callId is required" and builds its peer connection from `ice_servers`.
   The old livekit path needed only the token, which is exactly why passing
   only the token looked correct for as long as it did.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(label: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail ? "\n         " + detail : "")); }
}
function eq(label: string, got: unknown, want: unknown) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  if (good) { pass++; console.log("  ok   " + label); }
  else {
    fail++;
    console.log("  FAIL " + label +
      "\n         got  " + JSON.stringify(got) +
      "\n         want " + JSON.stringify(want));
  }
}

const wf = JSON.parse(
  readFileSync(new URL("../n8n/02-voice.json", import.meta.url), "utf8"),
);
const embed = readFileSync(
  new URL("../web/embed/src/embed.js", import.meta.url), "utf8",
);

/* ------------------------------------------------------- the n8n half */

console.log("\n== n8n asks the endpoint that still exists ==");

const mk = wf.nodes.find((n: any) => n.name === "Create Retell Web Call");
ok("the node that creates the call is there", Boolean(mk));

const url: string = mk?.parameters?.url ?? "";
ok("it calls v3", url.includes("/v3/create-web-call"), url);
/* Named explicitly rather than inferred from the above, because a rebuild
   from a stale branch is exactly how this would come back. */
ok("and not the switched-off v2", !url.includes("/v2/create-web-call"), url);

const body: string = mk?.parameters?.jsonBody ?? "";
ok("it still sends an agent_id", /agent_id/.test(body));
ok("it still carries the session, so the agent knows who it is talking to",
   /session_id/.test(body));

console.log("\n== and passes on everything the browser needs ==");

const resp = wf.nodes.find((n: any) => n.name === "Respond Token");
const rb: string = resp?.parameters?.responseBody ?? "";
for (const field of ["access_token", "call_id", "transport", "ice_servers"]) {
  ok(`the reply carries ${field}`, rb.includes(field), rb.slice(0, 160));
}

/* --------------------------------------------------- the browser half */

console.log("\n== the browser is on an SDK that understands them ==");

const sdk = embed.match(/retell-client-js-sdk@([0-9]+)\.([0-9]+)\.([0-9]+)/);
ok("the SDK version is pinned, not floating on latest", Boolean(sdk), String(sdk));
/* 2.x has no transport, no callId and no iceServers anywhere in its bundle,
   so on 2.x the gateway call cannot be joined however correct n8n is. */
ok(`the SDK is 3.x or newer (found ${sdk?.[0]})`, Number(sdk?.[1] ?? 0) >= 3);

console.log("\n== and hands all four to startCall ==");

ok("the token is read from the reply", /d\.access_token/.test(embed));
ok("so is the call id", /d\.call_id/.test(embed));
ok("so is the transport", /d\.transport/.test(embed));
ok("so are the ice servers", /d\.ice_servers/.test(embed));

const startCall = embed.slice(embed.indexOf("var opts = { accessToken"),
                              embed.indexOf("client.startCall(opts)") + 30);
ok("startCall is given the call id", /opts\.callId/.test(startCall), startCall.slice(0, 200));
ok("startCall is given the transport", /opts\.transport/.test(startCall));
ok("startCall is given the ice servers", /opts\.iceServers/.test(startCall));

/* Absent is not the same as undefined here: the SDK reads `transport` and
   falls back to its own default only when the key is missing. */
ok("each one is set only when it actually arrived",
   /if \(o\.callId\)/.test(startCall) && /if \(o\.transport\)/.test(startCall));

console.log("\n== the events the panel listens for still exist ==");

/* The four the widget binds. All four are emitted by 3.0.4; this asserts the
   widget has not been left listening for something renamed, which would show
   up as a call that connects and a panel that never notices. */
const listened = [...embed.matchAll(/client\.on\("([a-z_]+)"/g)].map((m) => m[1]).sort();
eq("the widget binds exactly the four it has always bound",
   [...new Set(listened)], ["call_ended", "call_started", "error", "update"]);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
