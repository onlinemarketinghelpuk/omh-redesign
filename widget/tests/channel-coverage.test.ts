import { readFileSync } from "node:fs";
import { ROUTES } from "../gates/routes.js";

/* =========================================================================
   Every channel a lead can arrive on, end to end.

   The system has eleven source channels, six routes, twelve workflows and
   one router. Each of those was tested on its own. What was never asserted
   is the thing the client actually cares about: that a lead arriving on ANY
   channel gets all the way through.

   A channel breaks end to end in four quiet ways, and none of them throws:

   1. **No entry point.** The source channel exists in the schema and the
      dashboard will happily group by it, but no webhook ever produces one,
      so the column is permanently zero and looks like a channel that simply
      does not perform.
   2. **No route.** The router falls back to B for anything it does not
      recognise, so a new channel silently gets the website form's follow-up
      instead of its own. Facebook leads would get called, which route C
      exists specifically to prevent.
   3. **A step with no sender.** A route step with a channel the sequence
      worker cannot send goes due, is claimed, and then nothing happens. The
      lead is marked as chased and never was.
   4. **A Convex route that does not exist.** Every workflow calls Convex
      over HTTP by path. A typo or an invented path 404s at runtime, and the
      node is set to continue on error so the execution still goes green.
      This is not hypothetical: the deep check on 2026-11-15 found two in
      10-meta, `/meta/lead` and `/touch`, both invented while writing it.

   So this file asserts the joins, not the parts.
   ========================================================================= */

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + "\n         got  " + JSON.stringify(got) + "\n         want " + JSON.stringify(want)); }
}
function ok(label: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail ? "\n         " + detail : "")); }
}

const here = new URL(".", import.meta.url);
const read = (p: string) => readFileSync(new URL(p, here), "utf8");
const wf = (n: string) => read("../n8n/" + n);

const WORKFLOWS = [
  "01-chat.json", "02-voice.json", "03-events.json", "04-calendar.json",
  "05-notify.json", "06-roi-leads.json", "07-router.json",
  "08-sequence-worker.json", "09-twilio-inbound.json", "10-meta.json",
  "11-reactivation.json", "12-email-inbound.json",
];

/* ===================================================================== */
console.log("\n== EVERY CONVEX ROUTE A WORKFLOW CALLS MUST EXIST ==");

/* The check that found two broken paths in 10-meta. Every node that calls
   Convex is set to continue on error, so a 404 here does not fail the
   execution: it just silently does nothing, for ever. */
const httpTs = read("../convex/http.ts");
const declared = new Set(Array.from(httpTs.matchAll(/path:\s*"([^"]+)"/g), (m) => m[1]));
ok("http.ts declares routes at all", declared.size > 20, `found ${declared.size}`);

const calls = new Map<string, Set<string>>();
for (const name of WORKFLOWS) {
  for (const m of wf(name).matchAll(/https:\/\/[a-z0-9-]+\.convex\.site(\/[A-Za-z0-9/_-]*)/g)) {
    if (!calls.has(m[1])) calls.set(m[1], new Set());
    calls.get(m[1])!.add(name);
  }
}
const missing = [...calls.keys()].filter((r) => !declared.has(r));
eq("no workflow calls a Convex route that does not exist", missing, []);
ok("and the check is actually looking at something", calls.size > 20, `${calls.size} routes called`);

/* ===================================================================== */
console.log("\n== EVERY CHANNEL HAS A ROUTE, NOT THE FALLBACK ==");

/* Read the router's own map out of the built workflow rather than keeping a
   second copy here, which would agree with itself and prove nothing. */
const router = wf("07-router.json");
const bySource = new Set(
  Array.from(router.matchAll(/([a-z_]+):\s*'([A-F])'/g), (m) => m[1]),
);
ok("the router's map was found", bySource.size > 10, `found ${bySource.size}`);

/* Every source channel the schema accepts. */
const SOURCES = [
  "website_chat", "website_voice", "website_form",
  "google_ads", "facebook_ads", "instagram_ads",
  "facebook", "instagram", "whatsapp",
  "phone_inbound", "phone_missed",
  "reactivation",
];
for (const s of SOURCES) {
  ok(`${s} is routed explicitly, not left to the fallback`, bySource.has(s));
}

/* The routes those channels must land on. Getting this wrong is not a
   cosmetic error: route C exists precisely so a cold Facebook form fill is
   never dialled, and it is the only thing preventing it. */
const EXPECTED: Record<string, string> = {
  website_chat: "A", website_voice: "A",
  website_form: "B", google_ads: "B",
  facebook_ads: "C", instagram_ads: "C",
  facebook: "D", instagram: "D", whatsapp: "D",
  phone_missed: "E", phone_inbound: "E",
  reactivation: "F",
};
for (const [src, want] of Object.entries(EXPECTED)) {
  const m = router.match(new RegExp(`${src}:\\s*'([A-F])'`));
  eq(`${src} goes to route ${want}`, m ? m[1] : null, want);
}

/* ===================================================================== */
console.log("\n== THE COMPLIANCE PROPERTY, STATED AS A JOIN ==");

/* Asserted in routes.test.ts against the route data. Repeated here against
   the ROUTER, because the route data being right does not help if the
   router sends Facebook leads to route B. */
for (const src of ["facebook_ads", "instagram_ads"]) {
  const m = router.match(new RegExp(`${src}:\\s*'([A-F])'`));
  const route = (ROUTES as any)[m![1]];
  ok(`${src} lands on a route with no call step`,
    !route.steps.some((s: any) => s.channel === "call") &&
    !(route.immediate || []).some((s: any) => s.channel === "call"),
    `route ${m![1]} has a call step`);
}
for (const src of ["facebook", "instagram", "whatsapp"]) {
  const m = router.match(new RegExp(`${src}:\\s*'([A-F])'`));
  const route = (ROUTES as any)[m![1]];
  ok(`a DM from ${src} never triggers an automated call`,
    !route.steps.some((s: any) => s.channel === "call"));
}

/* ===================================================================== */
console.log("\n== EVERY STEP A ROUTE CAN REACH HAS SOMETHING THAT SENDS IT ==");

/* A step whose channel the worker cannot send goes due, is claimed, marked
   done, and nothing reaches the person. The lead is recorded as chased and
   never was, which is the worst of both: no contact, and no sign of it. */
const worker = wf("08-sequence-worker.json");
const sendable = new Set<string>();
for (const ch of ["sms", "email", "call"]) {
  if (worker.includes(`"${ch}"`) || worker.includes(`'${ch}'`)) sendable.add(ch);
}
for (const [id, route] of Object.entries(ROUTES as any)) {
  const steps = [...((route as any).steps || []), ...((route as any).immediate || [])];
  for (const s of steps) {
    const inWorker = sendable.has(s.channel);
    /* messenger and instagram are sent by 10-meta inside the thread, not by
       the worker, so they are satisfied there instead. */
    const inMeta = (s.channel === "messenger" || s.channel === "instagram")
      && wf("10-meta.json").includes("/messages");
    ok(`route ${id} step ${s.key} (${s.channel}) has a sender`, inWorker || inMeta);
  }
}

/* ===================================================================== */
console.log("\n== EVERY CHANNEL HAS AN ENTRY POINT THAT EXISTS ==");

/* A source channel nobody can produce is a permanently empty column on the
   client's report, indistinguishable from a channel that does not work. */
const ENTRY: Array<[string, string, string]> = [
  ["website chat", "01-chat.json", "ohm-chat"],
  ["browser voice", "02-voice.json", "ohm-voice"],
  ["website form and Google Ads", "07-router.json", "ohm-lead-router"],
  ["Google Ads lead form", "07-router.json", "ohm-google-lead-form"],
  ["ROI calculator", "06-roi-leads.json", "webhook"],
  ["Facebook and Instagram", "10-meta.json", "ohm-meta"],
  ["inbound SMS", "09-twilio-inbound.json", "ohm-sms-inbound"],
  ["missed call", "09-twilio-inbound.json", "ohm-call-status"],
  ["email reply", "12-email-inbound.json", "emailReadImap"],
  ["reactivation", "11-reactivation.json", "ohm-reactivation"],
];
for (const [label, file, marker] of ENTRY) {
  ok(`${label} has an entry point`, wf(file).includes(marker), `${marker} not in ${file}`);
}

/* ===================================================================== */
console.log("\n== A LEAD FROM ANY CHANNEL REACHES THE SAME ROUTER ==");

/* One router, not a copy per channel. A second path would drift out of step
   with the tested one, and the drift would show up as one channel quietly
   skipping the consent gate. */
ok("Facebook leads go through the router, not a path of their own",
  wf("10-meta.json").includes("ohm-lead-router"));
ok("Google Ads leads go through the same router",
  router.includes("ohm-google-lead-form") && router.includes("ohm-lead-router"));
ok("the reactivation import enrols rather than sending directly",
  wf("11-reactivation.json").includes("/campaign/enrol"));

/* The one gate every send passes. If a channel reached a sender without
   going through the router, it would skip this. */
ok("the router enrols through Convex, where the consent gate lives",
  router.includes("/router/enrol"));

/* ===================================================================== */
console.log("\n== ATTRIBUTION SURVIVES THE TRIP ==");

/* "Which advert produced them" is the measure the client buys. It is worth
   nothing if the advert id is dropped between the webhook and the lead. */
ok("Meta carries the advert through to the router",
  wf("10-meta.json").includes("adId") && wf("10-meta.json").includes("campaign"));
ok("Meta resolves the campaign name, which the webhook does not include",
  wf("10-meta.json").includes("fields=name,campaign"));
ok("Meta fetches the person, who is not in the webhook either",
  wf("10-meta.json").includes("fields=field_data"));
ok("Google carries the click id", router.includes("gclid"));

/* ===================================================================== */
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
