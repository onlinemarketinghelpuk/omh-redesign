import {
  POLICIES, DEFAULT_POLICY, quickIntent, decideReply, validateBrain, isOptOut, policyLabel,
  salesBrief, DEFAULT_SALES,
} from "../gates/brain.js";
import { TRIGGER_ORDER } from "../gates/flows.js";
import { ctx } from "./convex-mock.ts";
import * as B from "../convex/brain.ts";

/* =========================================================================
   The Brain: who answers a reply.

   A reply to one of our texts arrives. Somebody has to answer it: the
   assistant, or a person. The owner chooses, per channel, from four
   policies, and can switch automated answering off altogether.

   Two rules hold under every policy, and are asserted first:
   1. An opt-out is never answered. It is handled by suppression, upstream.
   2. When unsure, it hands over. A missed hand-over costs a customer; an
      unnecessary one costs thirty seconds of somebody's time.

   The default is "assistant only", because that is what the system does
   today: every text reply goes to the assistant. Shipping the Brain changes
   nothing until the owner changes a setting.
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
const call = (fn: any, c: any, args: any) => fn._handler(c, args);
const on = (policies: Record<string, string> = {}) => ({ enabled: true, policies });
const pick = (d: any) => [d.answer, d.handOver];

console.log("\n== the four policies ==");
eq("they are the README's four", POLICIES.map((p: any) => p.key),
   ["assistant_only", "assistant_until_reply", "owner_only", "owner_for_interested"]);
eq("the default is what happens today", DEFAULT_POLICY, "assistant_only");
ok("every policy has a label and a sentence", POLICIES.every((p: any) => p.label && p.what.length > 20));
eq("labels", policyLabel("owner_only"), "You answer");

console.log("\n== NEVER answer an opt-out ==");
for (const t of ["STOP", "stop", "Unsubscribe", "STOP please", "stop all"]) {
  for (const p of POLICIES.map((x: any) => x.key)) {
    const d = decideReply({ brain: on({ website_form: p }), channel: "website_form", text: t });
    if (d.answer || d.handOver) { fail++; console.log(`  FAIL "${t}" under ${p} was answered or handed over`); }
  }
}
pass++; console.log("  ok   no policy answers or hands over an opt-out");
eq("but a question containing 'stop' is not an opt-out", isOptOut("what time do you stop today"), false);

console.log("\n== the master switch ==");
{
  const d = decideReply({ brain: { enabled: false, policies: {} }, channel: "google_ads", text: "How much is it?" });
  eq("off: nothing automated answers, it goes to a person", pick(d), [false, true]);
  ok("and says why", /off/i.test(d.reason), d.reason);
}

console.log("\n== each policy ==");
{
  const t = "Can you do Thursday?";
  eq("assistant only: the assistant answers",
     pick(decideReply({ brain: on({ google_ads: "assistant_only" }), channel: "google_ads", text: t })), [true, false]);
  eq("assistant until they reply: their reply goes to a person",
     pick(decideReply({ brain: on({ google_ads: "assistant_until_reply" }), channel: "google_ads", text: t })), [false, true]);
  eq("you answer: always a person",
     pick(decideReply({ brain: on({ google_ads: "owner_only" }), channel: "google_ads", text: t })), [false, true]);
  eq("no setting for the channel: the default, assistant only",
     pick(decideReply({ brain: on({}), channel: "google_ads", text: t })), [true, false]);
  eq("an old channel name finds its setting",
     decideReply({ brain: on({ facebook: "owner_only" }), channel: "facebook_dm", text: t }).policy, "owner_only");
}

console.log("\n== you answer the interested ones: and WHEN UNSURE, IT HANDS OVER ==");
{
  const d = (text: string) => decideReply({ brain: on({ website_form: "owner_for_interested" }), channel: "website_form", text });
  eq("'yes please, call me' is interested: a person", pick(d("Yes please, call me tomorrow")), [false, true]);
  eq("'how much would that cost' is interested: a person", pick(d("how much would that cost?")), [false, true]);
  eq("'can I book in' is interested: a person", pick(d("Can I book in for next week")), [false, true]);
  eq("'not interested thanks' is answered by the assistant", pick(d("not interested thanks")), [true, false]);
  eq("a plain question the assistant can answer", pick(d("Do you work in Leeds?")), [true, false]);
  eq("'ok' is unsure: a person", pick(d("ok")), [false, true]);
  eq("a photo with no words is unsure: a person", pick(d("")), [false, true]);
  ok("the reason names the intent", /interested/.test(d("yes please").reason), d("yes please").reason);
}

console.log("\n== quickIntent ==");
eq("yes", quickIntent("Yes"), "interested");
eq("price", quickIntent("what's the price"), "interested");
eq("no thanks", quickIntent("No thanks"), "not_interested");
eq("wrong number", quickIntent("wrong number mate"), "not_interested");
eq("question", quickIntent("Are you open on Saturdays?"), "question");
eq("nothing", quickIntent("hmm"), "unsure");
eq("opt out", quickIntent("STOP"), "opt_out");

console.log("\n== validateBrain ==");
ok("a good setting", validateBrain({ enabled: true, policies: { website_form: "owner_only" } }).ok);
ok("an unknown policy is refused, named",
   (() => { const r = validateBrain({ enabled: true, policies: { website_form: "robot" } }); return !r.ok && /robot/.test(r.errors[0]); })());
ok("an unknown channel is refused", !validateBrain({ enabled: true, policies: { fax: "owner_only" } }).ok);
ok("enabled must be true or false", !validateBrain({ enabled: "yes", policies: {} }).ok);
ok("every channel can be set", validateBrain({ enabled: true, policies: Object.fromEntries(TRIGGER_ORDER.map((t: string) => [t, "owner_only"])) }).ok);


console.log("\n== THE SALES BRIEF: answer, explain, book; never guess ==");
{
  const b = salesBrief({ brain: on(), channel: "google_ads", lead: { name: "Sarah Whitfield", service: "Local SEO" } });
  console.log("         " + b.split("\n").join("\n         "));
  ok("its goal is the booking", b.includes("Your goal: " + DEFAULT_SALES.goal));
  ok("it knows where they came from and what they asked about", b.includes("a Google Ads landing page") && b.includes("about Local SEO"));
  ok("it uses their name", b.includes("Sarah Whitfield"));
  ok("answer first, then sell, then ask for the booking", /answer exactly what they asked first[\s\S]*ask for the booking/.test(b));
  ok("one no means stop", b.includes("do not push twice"));
  ok("it is told it is a text", /it is a text/.test(b));
  const lines = b.split("\n");
  ok("THE LAST LINE is the never-guess rule", /Never guess a figure/.test(lines[lines.length - 1]), lines[lines.length - 1]);
  const own = salesBrief({ brain: { enabled: true, policies: {}, sales: { goal: "Book a site survey", offer: "A free site survey", notes: "We only cover Essex." } }, channel: "website_form", lead: {} });
  ok("the owner's goal, offer and notes are used", own.includes("Book a site survey") && own.includes("A free site survey") && own.includes("We only cover Essex."));
  ok("and the never-guess rule still comes after the owner's notes", own.indexOf("Never guess") > own.indexOf("We only cover Essex."));
  ok("an old channel name still reads well", salesBrief({ brain: on(), channel: "roi_calculator", lead: {} }).includes("the contact form on the website"));
  ok("an empty goal is refused", !validateBrain({ enabled: true, policies: {}, sales: { goal: " " } }).ok);
  ok("a good sales setting saves", validateBrain({ enabled: true, policies: {}, sales: { goal: "Book it", offer: "x", notes: "" } }).ok);
}

console.log("\n== stored in Convex, and decided there ==");
{
  const { db, ctx: c } = ctx();
  const g0 = await call(B.getBrain, c, {});
  eq("nothing stored: on, every channel on the default", [g0.enabled, g0.policies], [true, {}]);
  const bad = await call(B.setBrain, c, { enabled: true, policies: { website_form: "robot" } });
  eq("a bad setting is refused and nothing written", [bad.ok, db.all("settings").length], [false, 0]);
  const s = await call(B.setBrain, c, { enabled: true, policies: { website_form: "owner_for_interested" }, by: "owner" });
  ok("a good one saves", s.ok, s);
  const leadId = await db.insert("leads", { name: "A", sessionId: "s1", sourceChannel: "website_form", channel: "chat", status: "new", hot: false, at: 1 });
  const d = await call(B.decide, c, { leadId, text: "Yes, ring me" });
  eq("the decision for this lead's channel", [d.answer, d.handOver, d.policy], [false, true, "owner_for_interested"]);
  eq("it hands back the session for the hand-over", d.sessionId, "s1");
  const d2 = await call(B.decide, c, { text: "Yes, ring me" });
  eq("an unknown sender: the default policy", d2.policy, "assistant_only");
  await call(B.setBrain, c, { enabled: false, policies: {}, by: "owner" });
  eq("switched off: a person", (await call(B.decide, c, { leadId, text: "hello?" })).handOver, true);
  eq("who changed it is recorded", (await call(B.getBrain, c, {})).updatedBy, "owner");
}

console.log("\n== a channel switched off: a person answers, never the assistant ==");
{
  /* Plan 014, Rafiul's ruling of 16 November 2026: off means everything on
     that channel stops, the assistant included. The reply still has to reach
     somebody, so it is handed to a person rather than dropped. */
  const d = decideReply({ brain: on({ facebook: "assistant_only" }), channel: "facebook", text: "How much is SEO?", channelOn: false });
  eq("the assistant does not answer", d.answer, false);
  eq("it goes to a person", d.handOver, true);
  ok("and says the channel is switched off", /switched off/i.test(d.reason), d.reason);

  const o = decideReply({ brain: on({}), channel: "facebook", text: "STOP", channelOn: false });
  eq("an opt-out is still an opt-out, not a hand-over", [o.answer, o.handOver, o.intent], [false, false, "opt_out"]);

  const u = decideReply({ brain: on({}), channel: "facebook", text: "How much is SEO?" });
  eq("with the switch not given, nothing changes", u.answer, true);
  const t = decideReply({ brain: on({}), channel: "facebook", text: "How much is SEO?", channelOn: true });
  eq("switched on, nothing changes", t.answer, true);
}

console.log("\n" + (fail ? "FAILED " + fail : "all " + pass + " assertions pass"));
process.exit(fail ? 1 : 0);
