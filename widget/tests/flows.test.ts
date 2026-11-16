import {
  TRIGGERS, TRIGGER_ORDER, BASES, basisOf, basisFor, defaultRouteFor, palette,
  validateFlow, compileFlow, routeToNodes, describeFlow, flowTimeline, PECR_CALL_RULE,
  MAX_SENDS, WARN_SENDS, QUIET_START, QUIET_END, MERGED, canonicalTrigger,
} from "../gates/flows.js";
import { ROUTES, nextStepIn, nextStep } from "../gates/routes.ts";
import { templateKeys } from "../gates/templates.ts";
import { londonInstant, QUIET_START_HOUR, QUIET_END_HOUR } from "../gates/clock.ts";
import { readFileSync } from "node:fs";

/* =========================================================================
   The owner's flows, before any of them reach the engine.

   Three things are asserted here and the first is the one that matters:

   1. THE LEGAL ENVELOPE. A flow's basis comes from its trigger, the owner
      cannot set it, and a marketing flow with a call step is refused with
      the rule's own words, whatever else is right about it.
   2. NOTHING NEW IS INVENTED. Every route the engine runs today, turned into
      editable nodes and compiled back, is the same route. If that round trip
      holds, a flow is just a route the owner wrote, and everything already
      proven about routes (the clock, the lease, the gates, quiet hours)
      still holds for it.
   3. The validator says what is wrong in words an owner can act on.
   ========================================================================= */

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + "\n         got  " + JSON.stringify(got) + "\n         want " + JSON.stringify(want)); }
}
function ok(label: string, cond: boolean, detail: unknown = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail !== "" ? "\n         " + JSON.stringify(detail) : "")); }
}
const codes = (r: any) => r.errors.map((e: any) => e.code);

/* Every message the code knows, with the channel its route sends it on. */
const MSG: Record<string, string> = {};
for (const r of Object.values(ROUTES)) {
  for (const s of [...r.immediate, ...r.steps]) MSG[s.key] = s.channel;
}
const opts = { messages: MSG };

const send = (id: string, channel: string, message: string, extra: any = {}) =>
  ({ id, type: "send", channel, message, ...extra });
const after = (id: string, minutes: number) => ({ id, type: "wait", after: { minutes } });
const at = (id: string, addDays: number, hour: number, minute = 0) =>
  ({ id, type: "wait", at: { addDays, hour, minute } });
const stopIf = (id: string) => ({ id, type: "stop_if", conditions: ["replied"] });

/* ===================================================================== */
console.log("\n== the triggers are the channels, and the basis is theirs ==");
{
  /* The dashboard's channel list, read from its source rather than copied,
     so this screen and the Channels report cannot disagree about what a
     channel is. */
  const src = readFileSync(new URL("../../lib/dashboard/channels.ts", import.meta.url), "utf8");
  const m = src.match(/SOURCE_ORDER = \[([\s\S]*?)\] as const/);
  const order = m ? [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]) : [];
  eq("one trigger per dashboard channel, in the same order (unknown excepted)",
     TRIGGER_ORDER, order.filter((c) => c !== "unknown"));
  eq("fifteen of them", TRIGGER_ORDER.length, 15);

  const mb = src.slice(src.indexOf("const MERGED"), src.indexOf("};", src.indexOf("const MERGED")));
  const merged = Object.fromEntries([...mb.matchAll(/([a-z_]+): "([a-z_]+)"/g)].map((x) => [x[1], x[2]]));
  eq("old channel names map exactly as the dashboard maps them", MERGED, merged);
  eq("an old name finds its channel", canonicalTrigger("facebook_dm"), "facebook");
  eq("nothing is unknown", canonicalTrigger(undefined), "unknown");

  eq("reactivation is the only channel where we start it",
     TRIGGER_ORDER.filter((t: string) => basisOf(t) === "we_are_contacting_them"), ["reactivation"]);
  eq("two bases exist", BASES, ["they_contacted_us", "we_are_contacting_them"]);
  eq("an unknown channel has no basis", basisOf("carrier_pigeon"), null);

  /* The router's channel-to-route table, read out of the generator, so a
     flow replaces exactly the route a channel gets today. */
  const py = readFileSync(new URL("../n8n/build-workflows.py", import.meta.url), "utf8");
  const block = py.slice(py.indexOf("const BY_SOURCE = {"), py.indexOf("// Merged away"));
  for (const t of TRIGGER_ORDER) {
    const hit = block.match(new RegExp(`\\b${t}: '([A-H])'`));
    eq(`${t} defaults to the route the router gives it today`, defaultRouteFor(t), hit ? hit[1] : null);
  }
  /* And the basis agrees with the routes' own marketing flag. */
  for (const t of TRIGGER_ORDER) {
    const r = (ROUTES as any)[defaultRouteFor(t)];
    eq(`${t}: basis matches route ${r.id}'s marketing flag`,
       basisOf(t) === "we_are_contacting_them", r.marketing);
  }
}

eq("the gate's quiet hours are the clock's", [QUIET_START, QUIET_END], [QUIET_START_HOUR, QUIET_END_HOUR]);

/* ===================================================================== */
console.log("\n== basisFor: one basis per flow, never a mixture ==");
eq("all enquiries", basisFor(["website_form", "google_ads"]), "they_contacted_us");
eq("a list", basisFor(["reactivation"]), "we_are_contacting_them");
eq("mixed is no basis at all", basisFor(["website_form", "reactivation"]), null);
eq("nothing is no basis", basisFor([]), null);
eq("an unknown channel poisons it", basisFor(["website_form", "fax"]), null);

/* ===================================================================== */
console.log("\n== the palette: on a marketing flow the call is ABSENT, not disabled ==");
{
  const reply = palette(["website_form"]);
  const mkt = palette(["reactivation"]);
  ok("an enquiry flow may call", reply.channels.includes("call"));
  eq("a marketing flow's channels", mkt.channels, ["sms", "email"]);
  ok("call is not in the marketing palette at all", !mkt.channels.includes("call"));
  ok("and there is no 'disabled' list carrying it either", !JSON.stringify(mkt).includes("call"), mkt);
  eq("the four node types", reply.nodes, ["send", "wait", "stop_if"].concat([]));
  ok("messenger only where every trigger is a Meta channel",
     palette(["facebook", "facebook_ads"]).channels.includes("messenger") &&
     !palette(["website_form", "facebook"]).channels.includes("messenger"));
  eq("a mixed flow offers nothing", palette(["website_form", "reactivation"]).channels, []);
}

/* ===================================================================== */
console.log("\n== THE REFUSAL: a marketing flow cannot carry a call ==");
{
  const bad = {
    name: "Dormant clients",
    triggers: ["reactivation"],
    nodes: [send("n1", "sms", "f_sms_first"), stopIf("n2"), at("n3", 4, 10), send("n4", "call", "b_call")],
  };
  const r = validateFlow(bad, opts);
  ok("refused", r.ok === false);
  ok("names the rule", codes(r).includes("marketing_call"), codes(r));
  const msg = r.errors.find((e: any) => e.code === "marketing_call")?.message ?? "";
  ok("in the rule's own words, PECR regulation 19", msg.includes("PECR regulation 19"), msg);
  ok("names where the flow starts", msg.includes("Reactivation"), msg);
  ok("never just 'not permitted'", !/not permitted/i.test(msg), msg);
  eq("the rule text is exported once, for the screens to reuse", msg.startsWith(PECR_CALL_RULE), true);
  ok("blocks even a draft: there is no state in which this is saved",
     r.errors.find((e: any) => e.code === "marketing_call")?.liveOnly === false);

  /* The basis cannot be smuggled in. A flow object that claims to be a
     reply is judged by its trigger, not its claim. */
  const lying = { ...bad, basis: "they_contacted_us", marketing: false };
  const r2 = validateFlow(lying, opts);
  ok("a claimed basis is ignored", codes(r2).includes("marketing_call"), codes(r2));
  eq("and the basis reported is the trigger's", r2.basis, "we_are_contacting_them");

  /* A call hidden as the very first node, or as the only node, is still a call. */
  const only = validateFlow({ name: "x", triggers: ["reactivation"], nodes: [send("a", "call", "b_call")] }, opts);
  ok("a lone call on a marketing flow is refused", codes(only).includes("marketing_call"), codes(only));
  /* Channel spelled differently is not a way round it. */
  const upper = validateFlow({ name: "x", triggers: ["reactivation"], nodes: [send("a", "CALL", "b_call")] }, opts);
  ok("'CALL' is not a new channel that slips through", upper.ok === false, codes(upper));

  /* Compiling refuses too: nothing that bypassed the validator can come out
     the other side as a marketing route that dials. */
  let threw = "";
  try { compileFlow(bad); } catch (e: any) { threw = String(e.message); }
  ok("compileFlow throws on it rather than compiling", threw.includes("PECR"), threw);
}

/* ===================================================================== */
console.log("\n== mixing bases is refused, with both halves named ==");
{
  const r = validateFlow({ name: "Everything", triggers: ["website_form", "reactivation"],
    nodes: [send("a", "sms", "b_sms_first")] }, opts);
  ok("refused", codes(r).includes("mixed_basis"), codes(r));
  const m = r.errors.find((e: any) => e.code === "mixed_basis")?.message ?? "";
  ok("names both sides", m.includes("Website form") && m.includes("Reactivation"), m);
}

/* ===================================================================== */
console.log("\n== NOTHING NEW IS INVENTED: today's routes round-trip exactly ==");
for (const id of ["B", "C", "D", "E", "F", "G"] as const) {
  const route = ROUTES[id];
  const triggers = TRIGGER_ORDER.filter((t: string) => defaultRouteFor(t) === id);
  const flow = { name: route.name, triggers: triggers.length ? triggers : ["website_form"],
                 nodes: routeToNodes(route) };
  /* G is not a channel's default (it is the no-show route), so give it an
     enquiry trigger: its shape is what is being tested. */
  const v = validateFlow(flow, opts);
  ok(`route ${id} as nodes is a valid flow`, v.ok, v.errors);
  const c = compileFlow(flow);
  const strip = (s: any) => ({ key: s.key, when: s.when, channel: s.channel, gate: s.gate, label: s.label, why: s.why });
  eq(`route ${id}: immediate identical`, c.immediate.map(strip), route.immediate.map(strip));
  eq(`route ${id}: steps identical`, c.steps.map(strip), route.steps.map(strip));
  eq(`route ${id}: marketing identical`, c.marketing, route.marketing);
}
{
  /* And the engine's walk over the compiled route lands on the same moments
     as its walk over the code, from every enrolment hour. */
  let same = true;
  for (const hour of [0, 3, 8, 9, 12, 17, 18, 19, 21, 23]) {
    const t0 = londonInstant({ year: 2026, month: 7, day: 15, hour, minute: 0, second: 0 });
    for (const id of ["B", "C", "D", "E", "F", "G"] as const) {
      const own = TRIGGER_ORDER.filter((t: string) => defaultRouteFor(t) === id);
      const c = compileFlow({ name: "x", triggers: own.length ? own : ["website_form"],
                              nodes: routeToNodes(ROUTES[id]) });
      let i = 0, floor = t0, j = 0, floor2 = t0;
      for (let k = 0; k < 20; k++) {
        const a = nextStep(id, t0, i, floor);
        const b = nextStepIn(c, t0, j, floor2);
        if (JSON.stringify(a && [a.index, a.dueAt]) !== JSON.stringify(b && [b.index, b.dueAt])) same = false;
        if (!a || !b) break;
        i = a.index + 1; floor = a.dueAt; j = b.index + 1; floor2 = b.dueAt;
      }
    }
  }
  ok("the engine schedules a compiled route exactly as it schedules the code", same);
}
eq("route A has no nodes: it finishes in the conversation", routeToNodes(ROUTES.A), []);

/* ===================================================================== */
console.log("\n== compile: what goes inline and what is queued ==");
{
  const c = compileFlow({ name: "x", triggers: ["website_form"], nodes: [
    send("a", "sms", "b_sms_first"), send("b", "email", "b_email_first"),
    stopIf("s"), after("w", 15), send("c", "call", "b_call"),
  ] });
  eq("sends before the first wait go inline on an enquiry", c.immediate.map((s: any) => s.key), ["b_sms_first", "b_email_first"]);
  eq("inline sends are ungated", c.immediate.map((s: any) => s.gate), ["always", "always"]);
  eq("a send after stop-if is gated on no reply", c.steps[0].gate, "no_reply");
  eq("waits are measured from enrolment", c.steps[0].when, { afterMs: 15 * 60 * 1000 });

  const m = compileFlow({ name: "x", triggers: ["reactivation"], nodes: [
    send("a", "sms", "f_sms_first"), stopIf("s"), at("w", 4, 10), send("b", "sms", "f_sms_second"),
  ] });
  eq("a marketing flow sends NOTHING inline, so quiet hours apply to its first text", m.immediate, []);
  eq("its first text is queued at enrolment", m.steps[0].when, { afterMs: 0 });
  eq("and it is marked marketing, from the trigger", m.marketing, true);

  const cum = compileFlow({ name: "x", triggers: ["website_form"], nodes: [
    stopIf("s"), after("w1", 15), send("a", "call", "b_call"), after("w2", 2),
    send("b", "sms", "b_sms_we_tried", { onlyIfCallUnanswered: true }),
  ] });
  eq("after-waits accumulate", cum.steps.map((s: any) => s.when.afterMs / 60000), [15, 17]);
  eq("'only if the call went unanswered' is the call_no_answer gate", cum.steps[1].gate, "call_no_answer");
}

/* ===================================================================== */
console.log("\n== the validator, rule by rule ==");
const base = { name: "Test flow", triggers: ["website_form"] };
const v = (nodes: any[], o: any = opts, b: any = base) => validateFlow({ ...b, nodes }, o);
ok("a minimal valid flow", v([send("a", "sms", "b_sms_first")]).ok, v([send("a", "sms", "b_sms_first")]).errors);
ok("no name", codes(v([send("a", "sms", "b_sms_first")], opts, { ...base, name: "  " })).includes("no_name"));
ok("no triggers", codes(v([send("a", "sms", "b_sms_first")], opts, { ...base, triggers: [] })).includes("no_triggers"));
ok("an unknown trigger", codes(v([send("a", "sms", "b_sms_first")], opts, { ...base, triggers: ["fax"] })).includes("unknown_trigger"));
ok("a flow that sends nothing", codes(v([stopIf("s")])).includes("no_sends"));
ok("a send with no message", codes(v([send("a", "sms", "")])).includes("no_message"));
ok("a send naming a message that does not exist", codes(v([send("a", "sms", "nope_nope")])).includes("unknown_message"));
ok("an email message on a text", codes(v([send("a", "sms", "b_email_first")])).includes("message_wrong_channel"));
ok("an unknown node type", codes(v([{ id: "a", type: "branch" }])).includes("unknown_node_type"));
ok("an unknown channel", codes(v([send("a", "pigeon", "b_sms_first")])).includes("unknown_channel"));
ok("messenger on a website form", codes(v([send("a", "messenger", "c_dm_first")])).includes("channel_not_here"));
ok("duplicate node ids", codes(v([send("a", "sms", "b_sms_first"), send("a", "email", "b_email_first")])).includes("duplicate_id"));
ok("a wait of nothing", codes(v([send("a", "sms", "b_sms_first"), after("w", 0), send("b", "sms", "b_sms_final")])).includes("bad_wait"));
ok("a wait of two months", codes(v([send("a", "sms", "b_sms_first"), after("w", 60 * 24 * 60), send("b", "sms", "b_sms_final")])).includes("bad_wait"));
ok("an 'after' wait following an 'at' wait",
   codes(v([send("a", "sms", "b_sms_first"), at("w", 1, 10), send("b", "sms", "b_sms_evening"), after("w2", 30), send("c", "sms", "b_sms_final")])).includes("after_follows_at"));
ok("a time of day inside quiet hours (21:00)",
   codes(v([send("a", "sms", "b_sms_first"), at("w", 1, 21), send("b", "sms", "b_sms_final")])).includes("wait_in_quiet_hours"));
ok("a time of day inside quiet hours (07:30)",
   codes(v([send("a", "sms", "b_sms_first"), at("w", 1, 7, 30), send("b", "sms", "b_sms_final")])).includes("wait_in_quiet_hours"));
ok("08:00 and 19:59 are fine",
   v([send("a", "sms", "b_sms_first"), at("w", 1, 8), send("b", "sms", "b_sms_final"), at("w2", 2, 19, 59), send("c", "sms", "b_sms_evening")]).ok);
ok("times of day must move forward",
   codes(v([send("a", "sms", "b_sms_first"), at("w", 2, 10), send("b", "sms", "b_sms_final"), at("w2", 1, 10), send("c", "sms", "b_sms_evening")])).includes("not_after_previous"));
ok("two queued sends at the same moment",
   codes(v([send("a", "sms", "b_sms_first"), after("w", 30), send("b", "sms", "b_sms_final"), send("c", "email", "b_email_day2")])).includes("same_moment"));
ok("'only if the call went unanswered' with no call before it",
   codes(v([send("a", "sms", "b_sms_first"), after("w", 30), send("b", "sms", "b_sms_we_tried", { onlyIfCallUnanswered: true })])).includes("no_call_before"));
{
  const many: any[] = [send("s0", "sms", "b_sms_first")];
  for (let i = 1; i <= MAX_SENDS; i++) { many.push(after("w" + i, i * 30)); many.push(send("s" + i, "sms", "b_sms_final")); }
  ok(`more than ${MAX_SENDS} sends is refused`, codes(v(many)).includes("too_many_sends"));
  const six: any[] = [send("s0", "sms", "b_sms_first")];
  for (let i = 1; i < WARN_SENDS; i++) { six.push(after("w" + i, i * 30)); six.push(send("s" + i, "sms", "b_sms_final")); }
  const r = v(six);
  ok(`${WARN_SENDS} sends is allowed, with a warning about opt-outs`,
     r.ok && r.warnings.some((w: any) => w.code === "many_sends" && /opt-out/i.test(w.message)), r);
}
ok("ending on a wait is a warning, not an error",
   (() => { const r = v([send("a", "sms", "b_sms_first"), after("w", 30)]); return r.ok && r.warnings.some((w: any) => w.code === "ends_waiting"); })());
{
  /* A draft may be unfinished. A live flow may not. A legal problem is
     neither. */
  const r = v([send("a", "sms", "")]);
  eq("a missing message only blocks going live", r.errors.map((e: any) => [e.code, e.liveOnly]), [["no_message", true]]);
  ok("no message list given: existence is not checked, everything else is",
     validateFlow({ ...base, nodes: [send("a", "sms", "made_up_key")] }).ok);
}
{
  /* Every error says something a person can act on, and names the node. */
  const r = v([send("a", "sms", "nope_nope"), after("w", 0), send("b", "sms", "b_sms_final")]);
  ok("every error has a message in words", r.errors.every((e: any) => typeof e.message === "string" && e.message.length > 20), r.errors);
  ok("node errors name the node", r.errors.filter((e: any) => e.code !== "no_sends").every((e: any) => e.nodeId), r.errors);
}
ok("garbage in does not throw", (() => {
  for (const g of [null, undefined, 3, "x", {}, { nodes: "x" }, { triggers: "website_form", nodes: [null, 3] }]) {
    try { const r = validateFlow(g as any, opts); if (r.ok) return false; } catch { return false; }
  }
  return true;
})());

/* ===================================================================== */
console.log("\n== the live sentence: the test of whether the flow is what they meant ==");
{
  const b = { name: "B", triggers: ["website_form"], nodes: routeToNodes(ROUTES.B) };
  const s = describeFlow(b);
  console.log("         " + s);
  ok("starts with what happens straight away", s.startsWith("They get a text and an email straight away"), s);
  ok("the call at fifteen minutes", s.includes("a call at 15 minutes"), s);
  ok("the we-tried text says why it might not come", s.includes("if the call went unanswered"), s);
  ok("the evening text", s.includes("a text at 6pm the same day"), s);
  ok("the day 2 email", s.includes("an email at 10am on day 2"), s);
  ok("ends by saying it stops", s.endsWith("then it stops."), s);
  ok("says replies stop it", describeFlow(b).includes("unless they reply"), s);
  const f = describeFlow({ name: "F", triggers: ["reactivation"], nodes: routeToNodes(ROUTES.F) });
  console.log("         " + f);
  ok("a marketing flow says its first text waits for sending hours", f.includes("in sending hours"), f);
  eq("an empty flow says so", describeFlow({ name: "x", triggers: ["website_form"], nodes: [] }), "Nothing is sent.");
}


console.log("\n== the step list the screens show ==");
{
  const t = flowTimeline({ name: "B", triggers: ["website_form"], nodes: routeToNodes(ROUTES.B) });
  eq("one row per message, when and how", t.map((r: any) => [r.when, r.label]), [
    ["Straight away", "Text"], ["Straight away", "Email"], ["15 min", "Call"], ["17 min", "Text"],
    ["Same day, 6pm", "Text"], ["Day 2, 10am", "Email"], ["Day 4, 10am", "Text"],
  ]);
  eq("the conditional text is marked", t.map((r: any) => r.onlyIfCallUnanswered), [false, false, false, true, false, false, false]);
  eq("rows after stop-if are marked", t.map((r: any) => r.unlessReplied), [false, false, true, true, true, true, true]);
  eq("a marketing opener waits for sending hours",
     flowTimeline({ name: "F", triggers: ["reactivation"], nodes: routeToNodes(ROUTES.F) })[0].when, "First sending hour");
  eq("D's 20 hours", flowTimeline({ name: "D", triggers: ["facebook"], nodes: routeToNodes(ROUTES.D) })[0].when, "20 hr");
  eq("nothing is an empty list", flowTimeline({ name: "x", triggers: [], nodes: [] }), []);
}

/* Every message every default route uses exists in code, so loading the
   defaults as flows can never produce a flow that cannot go live. */
{
  const keys = new Set(templateKeys());
  const missing = Object.keys(MSG).filter((k) => !keys.has(k));
  eq("every default route's messages exist in templates.ts", missing, []);
}

console.log("\n" + (fail ? "FAILED " + fail : "all " + pass + " assertions pass"));
process.exit(fail ? 1 : 0);
