import { ctx } from "./convex-mock.ts";
import * as FL from "../convex/flows.ts";
import * as R from "../convex/routing.ts";
import { basisFor, PECR_CALL_RULE } from "../gates/flows.js";
import { OPT_OUT } from "../gates/message-text.js";
import { readFileSync } from "node:fs";

/* =========================================================================
   The Control Panel's server half: saving flows and messages, and the
   engine running what was saved.

   THE PROPERTY, OVER SAVED FLOWS.

   routes.test.ts asserts that no marketing route can dial, over the routes
   in code. Once the owner can write flows, the code is no longer the only
   place a route comes from, so the same property is asserted here over the
   STORE: after a battery of hostile saves, for every flow and every saved
   version, if it is marketing then no step is a call. And because a row can
   reach the store without going through saveFlow (an import, a migration, a
   bug), the engine is driven over rows inserted directly, and must still
   not dial.

   Marketing is recomputed here from the triggers, never read from the row,
   because a row that says it is not marketing is exactly the row that would
   be lying.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(label: string, cond: boolean, detail?: unknown) {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail !== undefined ? "\n         " + JSON.stringify(detail) : "")); }
}
function eq(label: string, got: unknown, want: unknown) {
  ok(label, JSON.stringify(got) === JSON.stringify(want), { got, want });
}
const call = (fn: any, c: any, args: any) => fn._handler(c, args);

const send = (id: string, channel: string, message: string, extra: any = {}) =>
  ({ id, type: "send", channel, message, ...extra });
const after = (id: string, minutes: number) => ({ id, type: "wait", after: { minutes } });
const at = (id: string, addDays: number, hour: number) => ({ id, type: "wait", at: { addDays, hour, minute: 0 } });
const stopIf = (id: string) => ({ id, type: "stop_if", conditions: ["replied"] });

const ENQUIRY = [send("a", "sms", "b_sms_first"), stopIf("s"), after("w", 30), send("b", "email", "b_email_day2")];
const MARKETING = [send("a", "sms", "f_sms_first"), stopIf("s"), at("w", 4, 10), send("b", "sms", "f_sms_second")];

async function lead(db: any, over: Record<string, any> = {}) {
  const now = Date.now();
  return await db.insert("leads", {
    sessionId: "cp-" + Math.random().toString(36).slice(2, 8),
    name: "Smoke Tester", phone: "+447700900123", phoneKey: "+447700900123",
    email: "smoke@example.com", emailKey: "smoke@example.com",
    service: "SEO", hot: false, channel: "chat", status: "new", at: now, firstAt: now,
    sourceChannel: "website_form", ...over,
  });
}

/** Every flow and version in the store obeys the property. */
function sweep(db: any) {
  const bad: any[] = [];
  for (const f of db.all("flows")) {
    const marketing = (f.triggers || []).some((t: string) => basisFor([t]) !== "they_contacted_us");
    if (marketing && (f.nodes || []).some((n: any) => n && n.channel === "call")) bad.push(["flow", f._id]);
  }
  for (const v of db.all("flowVersions")) {
    const marketing = (v.triggers || []).some((t: string) => basisFor([t]) !== "they_contacted_us");
    if (marketing && (v.nodes || []).some((n: any) => n && n.channel === "call")) bad.push(["version", v._id]);
    const c = v.compiled;
    if (c && (c.marketing || marketing) &&
        [...(c.immediate || []), ...(c.steps || [])].some((s: any) => s.channel === "call")) bad.push(["compiled", v._id]);
  }
  return bad;
}

/* ===================================================================== */
console.log("\n== THE PROPERTY OVER SAVED FLOWS: hostile saves ==");
{
  const { db, ctx: c } = ctx();

  /* 1. The plain attempt. */
  const w0 = db.writes;
  const r1 = await call(FL.saveFlow, c, {
    name: "Dormant clients", triggers: ["reactivation"],
    nodes: [...MARKETING, after("w2", 60), send("x", "call", "b_call")], by: "owner",
  });
  eq("a marketing flow with a call is refused", r1.ok, false);
  ok("with the rule, in words", (r1.errors || []).some((e: any) => e.message.startsWith(PECR_CALL_RULE)), r1);
  eq("and nothing at all is written", db.writes, w0);

  /* 2. Claiming a basis it does not have. */
  const r2 = await call(FL.saveFlow, c, {
    name: "Dormant clients", triggers: ["reactivation"], basis: "they_contacted_us", marketing: false,
    nodes: [send("x", "call", "b_call")],
  });
  eq("a claimed basis changes nothing", r2.ok, false);

  /* 3. Hiding it in a mixed flow. */
  const r3 = await call(FL.saveFlow, c, {
    name: "Everyone", triggers: ["website_form", "reactivation"],
    nodes: [send("a", "sms", "b_sms_first"), after("w", 15), send("x", "call", "b_call")],
  });
  eq("a mixed flow with a call is refused", r3.ok, false);
  ok("for the call as well as the mixing",
     ["marketing_call", "mixed_basis"].every((k) => (r3.errors || []).some((e: any) => e.code === k)), r3.errors);

  /* 4. Adding the call to a legitimate marketing flow later. */
  const good = await call(FL.saveFlow, c, { name: "Dormant clients", triggers: ["reactivation"], nodes: MARKETING });
  ok("a marketing flow without a call saves", good.ok, good);
  eq("its basis is derived on the server", db.all("flows")[0].basis, "we_are_contacting_them");
  const before = JSON.stringify(db.all("flows")[0]);
  const r4 = await call(FL.saveFlow, c, {
    flowId: good.flowId, name: "Dormant clients", triggers: ["reactivation"],
    nodes: [...MARKETING, after("w2", 60), send("x", "call", "b_call")],
  });
  eq("adding a call to it later is refused", r4.ok, false);
  eq("and the stored flow is untouched", JSON.stringify(db.all("flows")[0]), before);

  /* 5. Turning a calling enquiry flow into a marketing one by its trigger. */
  const calling = await call(FL.saveFlow, c, {
    name: "Call back fast", triggers: ["phone_missed"],
    nodes: [send("a", "sms", "e_sms_missed"), stopIf("s"), after("w", 5), send("b", "call", "e_call_back")],
  });
  ok("an enquiry flow may call", calling.ok, calling);
  const r5 = await call(FL.saveFlow, c, {
    flowId: calling.flowId, name: "Call back fast", triggers: ["reactivation"],
    nodes: [send("a", "sms", "e_sms_missed"), stopIf("s"), after("w", 5), send("b", "call", "e_call_back")],
  });
  eq("moving it onto the reactivation list is refused", r5.ok, false);

  /* 6. Tampering with the stored row, then asking for it to go live. */
  await db.patch(good.flowId, { nodes: [send("x", "call", "b_call")] });
  const r6 = await call(FL.setFlowStatus, c, { flowId: good.flowId, status: "live" });
  eq("a tampered row cannot be switched on", r6.ok, false);
  ok("and says why", (r6.errors || []).some((e: any) => e.code === "marketing_call"), r6);
  /* Put it back, so the sweep below judges what saveFlow wrote. */
  await db.patch(good.flowId, { nodes: MARKETING });

  eq("THE SWEEP: no marketing flow or version in the store can dial", sweep(db), []);
}

/* ===================================================================== */
console.log("\n== drafts, going live, one live flow per channel ==");
{
  const { db, ctx: c } = ctx();
  const d = await call(FL.saveFlow, c, {
    name: "Half written", triggers: ["google_ads"], nodes: [send("a", "sms", "")],
  });
  ok("an unfinished draft saves", d.ok && d.status === "draft", d);
  const live = await call(FL.setFlowStatus, c, { flowId: d.flowId, status: "live" });
  eq("but cannot go live", [live.ok, live.why], [false, "not_ready"]);
  ok("and says which step", (live.errors || []).some((e: any) => e.code === "no_message" && e.nodeId === "a"), live);

  const one = await call(FL.saveFlow, c, { name: "Ads follow-up", triggers: ["google_ads", "website_form"], nodes: ENQUIRY, live: true });
  ok("a finished flow goes live", one.ok && one.status === "live", one);
  const two = await call(FL.saveFlow, c, { name: "Ads, faster", triggers: ["google_ads"], nodes: ENQUIRY, live: true });
  eq("a second live flow on the same channel asks first", [two.ok, two.why], [false, "trigger_taken"]);
  eq("naming the flow it would replace, and the channel", two.conflicts?.map((x: any) => [x.name, x.triggers]),
     [["Ads follow-up", ["google_ads"]]]);
  eq("and nothing was written for it", db.all("flows").filter((f: any) => f.name === "Ads, faster").length, 0);

  const three = await call(FL.saveFlow, c, { name: "Ads, faster", triggers: ["google_ads"], nodes: ENQUIRY, live: true, replace: true });
  ok("told to replace, it does", three.ok && three.status === "live", three);
  eq("the old one is paused, not deleted",
     db.all("flows").find((f: any) => f.name === "Ads follow-up").status, "paused");
  const liveOn = (t: string) => db.all("flows").filter((f: any) => f.status === "live" && f.triggers.includes(t)).length;
  eq("google_ads has exactly one live flow", liveOn("google_ads"), 1);
  /* The replaced flow also served website_form. Pausing it leaves that
     channel on its default, which the screen shows; it does not silently
     move website_form onto the new flow. */
  eq("website_form falls back to its default", liveOn("website_form"), 0);
}

/* ===================================================================== */
console.log("\n== versions are append-only ==");
{
  const { db, ctx: c } = ctx();
  const a = await call(FL.saveFlow, c, { name: "V", triggers: ["website_form"], nodes: ENQUIRY, by: "owner" });
  const b = await call(FL.saveFlow, c, { flowId: a.flowId, name: "V", triggers: ["website_form"],
    nodes: [...ENQUIRY, at("w2", 1, 10), send("c", "sms", "b_sms_final")], by: "owner" });
  eq("each save is a new version", [a.version, b.version], [1, 2]);
  const vs = db.all("flowVersions");
  eq("both versions are kept", vs.map((v: any) => v.version), [1, 2]);
  eq("version 1 still says what version 1 said", vs[0].nodes.length, ENQUIRY.length);
  eq("who saved it is recorded", vs.map((v: any) => v.by), ["owner", "owner"]);
  const h = await call(FL.flowHistory, c, { flowId: a.flowId });
  eq("history reads newest first", h.versions.map((v: any) => v.version), [2, 1]);
}

/* ===================================================================== */
console.log("\n== messages ==");
{
  const { db, ctx: c } = ctx();
  const s = await call(FL.saveMessage, c, { key: "b_sms_first", channel: "sms", body: "{{greeting}} thanks, back to you shortly.", by: "owner" });
  ok("an edit to a code message saves", s.ok, s);
  const bad = await call(FL.saveMessage, c, { key: "b_sms_first", channel: "sms", body: "Hi {{fist_name}}" });
  eq("an unknown variable is refused", [bad.ok, bad.errors?.[0]?.code], [false, "unknown_variable"]);
  const moved = await call(FL.saveMessage, c, { key: "b_sms_first", channel: "email", subject: "x", body: "x" });
  eq("a code message cannot change channel under its flows", [moved.ok, moved.why], [false, "channel_fixed"]);
  const custom = await call(FL.saveMessage, c, { key: "spring_offer", channel: "sms", body: "{{greeting}} spring offer." });
  ok("a new message saves", custom.ok, custom);
  eq("every save is in the history", db.all("messageHistory").map((h: any) => [h.key, h.action]),
     [["b_sms_first", "saved"], ["spring_offer", "saved"]]);

  /* A flow may use the new message once it exists. */
  const f = await call(FL.saveFlow, c, { name: "Spring", triggers: ["website_form"],
    nodes: [send("a", "sms", "spring_offer")], live: true });
  ok("a flow can use the owner's own message", f.ok, f);
  const reset = await call(FL.resetMessage, c, { key: "spring_offer" });
  eq("a message a live flow sends cannot be deleted from under it", [reset.ok, reset.why], [false, "in_use"]);
  const back = await call(FL.resetMessage, c, { key: "b_sms_first", by: "owner" });
  ok("a code message can be reset to the code's words", back.ok, back);
  eq("its override is gone", db.all("messageTemplates").map((m: any) => m.key), ["spring_offer"]);
  eq("and the reset is in the history", db.all("messageHistory").at(-1).action, "reset");
}

/* ===================================================================== */
console.log("\n== THE ENGINE RUNS THE LIVE FLOW ==");
{
  const { db, ctx: c } = ctx();
  /* No flow: exactly today. */
  const l0 = await lead(db);
  const r0 = await call(R.enrol, c, { leadId: l0, route: "B" });
  eq("with no flow, route B as today", r0.immediate.map((i: any) => i.key), ["b_sms_first", "b_email_first"]);
  ok("and no flow recorded", db.all("sequences")[0].flowId === undefined);

  const f = await call(FL.saveFlow, c, { name: "Short", triggers: ["website_form"], nodes: ENQUIRY, live: true });
  await call(FL.saveMessage, c, { key: "b_sms_first", channel: "sms", body: "{{greeting}} owner's words." });

  const l1 = await lead(db);
  const t0 = Date.now();
  const r1 = await call(R.enrol, c, { leadId: l1, route: "B" });
  eq("the live flow's inline step, not route B's two", r1.immediate.map((i: any) => i.key), ["b_sms_first"]);
  eq("in the owner's words", r1.immediate[0].body, "Hi Smoke, owner's words.");
  const seq = db.all("sequences").find((s: any) => s.leadId === l1);
  eq("the sequence records the flow and its version", [seq.flowId, seq.flowVersion], [f.flowId, 1]);
  ok("its next step is the flow's, 30 minutes out",
     Math.abs(seq.nextDueAt - (t0 + 30 * 60 * 1000)) < 5000, seq.nextDueAt - t0);

  /* The owner changes the flow. The person already on it is not retimed. */
  await call(FL.saveFlow, c, { flowId: f.flowId, name: "Short", triggers: ["website_form"], live: true,
    nodes: [...ENQUIRY, at("w2", 1, 10), send("c", "sms", "b_sms_final")] });
  await db.patch(seq._id, { nextDueAt: Date.now() - 1000 });
  const claim = await call(R.claimDue, c, {});
  eq("version 1's step is claimed", claim.claimed.map((x: any) => x.stepKey), ["b_email_day2"]);
  const done = await call(R.completeStep, c, { sequenceId: seq._id, leaseToken: claim.claimed[0].leaseToken, outcome: "sent" });
  eq("and version 1 ends where version 1 ended, not where version 2 does", done.status, "completed");

  const l2 = await lead(db);
  await call(R.enrol, c, { leadId: l2, route: "B" });
  eq("somebody new starts on version 2", db.all("sequences").find((s: any) => s.leadId === l2).flowVersion, 2);

  /* A different route asked for on purpose is obeyed. */
  const l3 = await lead(db);
  await call(R.enrol, c, { leadId: l3, route: "G" });
  ok("a no-show (G) is not swapped for the channel's flow", db.all("sequences").find((s: any) => s.leadId === l3).flowId === undefined);

  /* Old channel names find their flow. */
  const l4 = await lead(db, { sourceChannel: "roi_calculator" });
  await call(R.enrol, c, { leadId: l4, route: "B" });
  eq("roi_calculator is website_form", db.all("sequences").find((s: any) => s.leadId === l4).flowId, f.flowId);

  /* Paused is not live. */
  await call(FL.setFlowStatus, c, { flowId: f.flowId, status: "paused" });
  const l5 = await lead(db);
  const r5 = await call(R.enrol, c, { leadId: l5, route: "B" });
  eq("a paused flow is not used", r5.immediate.length, 2);
}

/* ===================================================================== */
console.log("\n== a marketing flow: nothing inline, opt-out always ==");
{
  const { db, ctx: c } = ctx();
  await call(FL.saveFlow, c, { name: "Dormant", triggers: ["reactivation"], nodes: MARKETING, live: true });
  await call(FL.saveMessage, c, { key: "f_sms_first", channel: "sms", body: "{{greeting}} we have missed you." });
  const l = await lead(db, { sourceChannel: "reactivation", smsConsent: "soft_optin" });
  const r = await call(R.enrol, c, { leadId: l, route: "F" });
  eq("nothing inline", r.immediate, []);
  const seq = db.all("sequences").find((s: any) => s.leadId === l);
  ok("on the flow", Boolean(seq.flowId));
  await db.patch(seq._id, { nextDueAt: Date.now() - 1000 });
  const claim = await call(R.claimDue, c, {});
  const body = claim.claimed[0]?.body ?? "";
  ok("the owner's words go out", body.startsWith("Hi Smoke, we have missed you."), body);
  ok("with the opt-out they did not write", body.endsWith("\n\n" + OPT_OUT), body);
}

/* ===================================================================== */
console.log("\n== A ROW THAT GOT ROUND THE VALIDATOR STILL CANNOT DIAL ==");
{
  const { db, ctx: c } = ctx();
  /* Written straight into the store, as an import or a migration might. It
     even claims not to be marketing. */
  const nodes = [send("x", "call", "b_call")];
  const flowId = await db.insert("flows", {
    name: "Smuggled", basis: "they_contacted_us", triggers: ["reactivation"], nodes,
    status: "live", version: 1, updatedAt: Date.now(),
  });
  await db.insert("flowVersions", {
    flowId, version: 1, name: "Smuggled", basis: "they_contacted_us", triggers: ["reactivation"], nodes,
    status: "live", at: Date.now(),
    compiled: { id: "flow:x", name: "Smuggled", intent: "", rule: "", marketing: false, immediate: [],
      steps: [{ key: "b_call", when: { afterMs: 0 }, channel: "call", gate: "always", label: "Call", why: "" }] },
  });
  ok("the sweep catches the row itself", sweep(db).length > 0);

  const l = await lead(db, { sourceChannel: "reactivation", smsConsent: "soft_optin", automatedCallConsent: true, tpsCheckedAt: Date.now() });
  const r = await call(R.enrol, c, { leadId: l, route: "F" });
  const seq = db.all("sequences").find((s: any) => s.leadId === l);
  ok("enrol refuses the flow", seq && seq.flowId === undefined, seq);
  eq("and says so", r.flowRefused, "marketing_call");
  ok("the person is on route F from code instead, which cannot dial", seq && seq.route === "F");

  /* A sequence already pointing at the bad version, as if it had been
     enrolled before the row was corrupted. Even with automated-call consent
     recorded on the lead, nothing is dialled. */
  const l2 = await lead(db, { sourceChannel: "reactivation", smsConsent: "soft_optin", automatedCallConsent: true, tpsCheckedAt: Date.now() });
  const sid = await db.insert("sequences", { leadId: l2, route: "F", flowId, flowVersion: 1, step: 0,
    status: "active", nextDueAt: Date.now() - 1000, attempts: 0, at: Date.now() - 2000 });
  const claim = await call(R.claimDue, c, {});
  eq("nothing is claimed to dial", claim.claimed.filter((x: any) => x.channel === "call").length, 0);
  eq("the sequence is stopped with the reason", [db.all("sequences").find((s: any) => s._id === sid).status,
     db.all("sequences").find((s: any) => s._id === sid).stopReason], ["failed", "flow_refused"]);
}


/* ===================================================================== */
console.log("\n== every path the dashboard calls exists ==");
{
  /* The same join channel-coverage asserts for n8n, for the dashboard: a
     path that 404s returns null, and null on these screens reads as
     "cannot be reached" rather than as a bug. */
  const lib = readFileSync(new URL("../../lib/dashboard/routing.ts", import.meta.url), "utf8");
  const http = readFileSync(new URL("../convex/http.ts", import.meta.url), "utf8");
  const declared = new Set(Array.from(http.matchAll(/path:\s*"([^"]+)"/g), (m) => m[1]));
  const called = Array.from(lib.matchAll(/call<[\s\S]*?>\(\s*"([^"]+)"/g), (m) => m[1]);
  ok("the dashboard calls something", called.length > 15, called.length);
  for (const p of ["/flows/list", "/flows/get", "/flows/history", "/flows/save", "/flows/status",
                   "/messages/list", "/messages/save", "/messages/reset",
                   "/brain/get", "/brain/set", "/agent/get", "/agent/set"]) {
    ok(`the dashboard calls ${p}`, called.includes(p));
  }
  const missing = called.filter((p) => !declared.has(p));
  eq("every one of them is declared in http.ts", missing, []);
}

console.log("\n" + (fail ? "FAILED " + fail : "all " + pass + " assertions pass"));
process.exit(fail ? 1 : 0);
