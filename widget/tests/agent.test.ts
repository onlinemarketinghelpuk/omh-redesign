import {
  DEFAULT_AGENT, normaliseNumber, validateAgent, retellOutcome, callBrief,
} from "../gates/agent.js";
import { inCallingHours, nextCallingAt } from "../gates/calling-hours.ts";
import { londonInstant, londonWall } from "../gates/clock.ts";
import { ctx } from "./convex-mock.ts";
import * as B from "../convex/brain.ts";
import * as R from "../convex/routing.ts";

/* =========================================================================
   The outbound agent: the Retell voice agent that rings people back.

   It exists to book the free consultation and explain what OMH does, and it
   only ever rings somebody who contacted us first (the compliance property
   in routes.test.ts and control-panel.test.ts holds that line; nothing here
   can move it).

   What this suite holds:
   1. The number. Only a UK long code, because an alphanumeric sender cannot
      be called back and every route is built on the lead replying.
   2. Calling hours, separate from message quiet hours: a text at 8pm is
      fine, a call at 8pm is not. A call due outside them waits for the next
      window rather than being dropped.
   3. No number, no call. The step is skipped, not attempted with a
      placeholder that fails three times and kills the sequence.
   4. Retell's outcome, read into answered or no_answer, so "a text saying
      we tried" goes only when we really did try and missed them.
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
const at = (day: number, hour: number, minute = 0) => londonInstant({ year: 2026, month: 11, day, hour, minute, second: 0 });
// 2026-11-16 is a Monday.

console.log("\n== the number: a UK long code, nothing else ==");
eq("020 written locally", normaliseNumber("020 3489 3934"), "+442034893934");
eq("a mobile", normaliseNumber("07700 900123"), "+447700900123");
eq("already E.164", normaliseNumber("+44 1702 123456"), "+441702123456");
ok("an alphanumeric sender is refused, and says why",
   (() => { const r = validateAgent({ ...DEFAULT_AGENT, fromNumber: "OMH" }); return !r.ok && /cannot be (called|rung) back|reply/i.test(r.errors.join(" ")); })());
ok("a US number is refused", !validateAgent({ ...DEFAULT_AGENT, fromNumber: "+14155550100" }).ok);
ok("a premium 09 number is refused", !validateAgent({ ...DEFAULT_AGENT, fromNumber: "09012345678" }).ok);
ok("no number is allowed: it means not calling yet", validateAgent({ ...DEFAULT_AGENT, fromNumber: "" }).ok);
ok("a London number is fine", validateAgent({ ...DEFAULT_AGENT, fromNumber: "02034893934" }).ok);

console.log("\n== calling hours ==");
eq("default: Monday to Friday, 9 to 5", [DEFAULT_AGENT.days, DEFAULT_AGENT.start, DEFAULT_AGENT.end], [[1, 2, 3, 4, 5], 9, 17]);
ok("hours must make sense", !validateAgent({ ...DEFAULT_AGENT, start: 17, end: 9 }).ok);
ok("no calls after 8pm, whatever is typed", !validateAgent({ ...DEFAULT_AGENT, end: 21 }).ok);
ok("no calls before 8am", !validateAgent({ ...DEFAULT_AGENT, start: 7 }).ok);
ok("at least one day", !validateAgent({ ...DEFAULT_AGENT, days: [] }).ok);
const H = DEFAULT_AGENT;
eq("Monday 10:00 is in hours", inCallingHours(at(16, 10), H), true);
eq("Monday 17:00 is not", inCallingHours(at(16, 17), H), false);
eq("Monday 08:59 is not", inCallingHours(at(16, 8, 59), H), false);
eq("Saturday 11:00 is not", inCallingHours(at(21, 11), H), false);
const w = (ms: number) => { const x = londonWall(ms); return [x.day, x.hour, x.minute]; };
eq("in hours, now is now", nextCallingAt(at(16, 10, 30), H), at(16, 10, 30));
eq("Monday 19:00 waits for Tuesday 09:00", w(nextCallingAt(at(16, 19), H)), [17, 9, 0]);
eq("Monday 07:00 waits for Monday 09:00", w(nextCallingAt(at(16, 7), H)), [16, 9, 0]);
eq("Friday 18:00 waits for Monday 09:00", w(nextCallingAt(at(20, 18), H)), [23, 9, 0]);
eq("Saturday waits for Monday", w(nextCallingAt(at(21, 12), H)), [23, 9, 0]);
eq("across the clocks going back (Sat 24 Oct 2026 18:00 -> Mon 26 09:00)",
   (() => { const x = londonWall(nextCallingAt(londonInstant({ year: 2026, month: 10, day: 24, hour: 18, minute: 0, second: 0 }), H)); return [x.day, x.hour]; })(), [26, 9]);

console.log("\n== Retell's outcome ==");
eq("answered and talked", retellOutcome({ disconnection_reason: "user_hangup", call_status: "ended" }), "answered");
eq("agent ended it", retellOutcome({ disconnection_reason: "agent_hangup" }), "answered");
eq("no answer", retellOutcome({ disconnection_reason: "dial_no_answer" }), "no_answer");
eq("busy", retellOutcome({ disconnection_reason: "dial_busy" }), "no_answer");
eq("voicemail is not a conversation", retellOutcome({ disconnection_reason: "voicemail_reached" }), "no_answer");
eq("a failed dial", retellOutcome({ disconnection_reason: "dial_failed" }), "failed");
eq("Retell's own do-not-call list", retellOutcome({ disconnection_reason: "error_user_not_joined" }), "no_answer");
eq("nothing known", retellOutcome({}), "failed");

console.log("\n== what the agent is told about this call ==");
{
  const b = callBrief({ ...DEFAULT_AGENT }, { name: "Sarah Whitfield", service: "Local SEO" });
  ok("the opening uses their first name and what they asked about",
     b.opening.includes("Sarah") && b.opening.includes("Local SEO"), b.opening);
  ok("the goal is the booking", /book/i.test(b.goal), b.goal);
  const anon = callBrief({ ...DEFAULT_AGENT }, {});
  ok("no name, no wrong guess", !/undefined|\{\{/.test(anon.opening), anon.opening);
}

console.log("\n== settings in Convex ==");
{
  const { db, ctx: c } = ctx();
  const g = await call(B.getAgent, c, {});
  eq("nothing stored: the defaults, no number", [g.fromNumber, g.days, g.start, g.end], ["", [1, 2, 3, 4, 5], 9, 17]);
  const bad = await call(B.setAgent, c, { ...DEFAULT_AGENT, fromNumber: "OMH" });
  eq("an alphanumeric sender is refused, nothing written", [bad.ok, db.all("settings").length], [false, 0]);
  const s = await call(B.setAgent, c, { ...DEFAULT_AGENT, fromNumber: "020 3489 3934", by: "owner" });
  ok("a UK number saves", s.ok, s);
  eq("stored normalised", (await call(B.getAgent, c, {})).fromNumber, "+442034893934");
}

console.log("\n== THE ENGINE: no number, no call; outside hours, it waits ==");
async function seqAtCall(db: any, c: any) {
  const leadId = await db.insert("leads", { name: "Sarah Whitfield", sessionId: "s-" + Math.random(), phone: "+447700900123",
    phoneKey: "+447700900123", email: "s@example.com", emailKey: "s@example.com", service: "Local SEO",
    sourceChannel: "website_form", channel: "chat", status: "new", hot: false, at: Date.now() });
  /* Route B, sitting on its call step (index 0), due now. */
  return await db.insert("sequences", { leadId, route: "B", step: 0, status: "active",
    nextDueAt: Date.now() - 1000, attempts: 0, at: Date.now() - 16 * 60 * 1000 });
}
{
  const { db, ctx: c } = ctx();
  const sid = await seqAtCall(db, c);
  const r = await call(R.claimDue, c, {});
  eq("no number: nothing is claimed to dial", r.claimed.filter((x: any) => x.channel === "call").length, 0);
  const seq = db.all("sequences").find((s: any) => s._id === sid);
  ok("the sequence moves on rather than failing", seq.status === "active" && seq.step > 0, seq);
}
{
  const { db, ctx: c } = ctx();
  /* Every day, all day: so this assertion does not depend on when it runs. */
  await call(B.setAgent, c, { ...DEFAULT_AGENT, fromNumber: "02034893934", days: [0, 1, 2, 3, 4, 5, 6], start: 8, end: 20 });
  const now = londonWall(Date.now());
  const sid = await seqAtCall(db, c);
  const r = await call(R.claimDue, c, {});
  const inHours = now.hour >= 8 && now.hour < 20;
  if (inHours) {
    const x = r.claimed.find((y: any) => y.channel === "call");
    ok("with a number, in hours, the call is claimed", Boolean(x), r);
    eq("from our number", x?.fromNumber, "+442034893934");
    ok("with the opening line for this person", String(x?.opening ?? "").includes("Sarah"), x);
    ok("and the goal", /book/i.test(String(x?.goal ?? "")), x);
  } else {
    const seq = db.all("sequences").find((s: any) => s._id === sid);
    ok("outside hours, the call waits for 08:00 rather than being dropped",
       seq.step === 0 && londonWall(seq.nextDueAt).hour === 8, seq);
  }
}
{
  const { db, ctx: c } = ctx();
  /* Hours that are never now: a one-hour window on a day that is not today. */
  const today = new Date().getDay();
  await call(B.setAgent, c, { ...DEFAULT_AGENT, fromNumber: "02034893934", days: [(today + 3) % 7], start: 10, end: 11 });
  const sid = await seqAtCall(db, c);
  const r = await call(R.claimDue, c, {});
  eq("outside calling hours: not claimed", r.claimed.length, 0);
  const seq = db.all("sequences").find((s: any) => s._id === sid);
  eq("still on the call step", seq.step, 0);
  ok("re-timed to 10:00 on the calling day", londonWall(seq.nextDueAt).hour === 10 && seq.nextDueAt > Date.now(), londonWall(seq.nextDueAt));
}

console.log("\n" + (fail ? "FAILED " + fail : "all " + pass + " assertions pass"));
process.exit(fail ? 1 : 0);
