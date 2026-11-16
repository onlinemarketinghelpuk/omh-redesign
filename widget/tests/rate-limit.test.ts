import { ctx } from "./convex-mock";
import { hello } from "../convex/visitors";
import { visitorSay } from "../convex/handover";
import { checkLimit } from "../convex/functions";
import {
  WINDOW_MS,
  HELLO_PER_SESSION,
  HELLO_PER_VISITOR,
  HELLO_PER_DEPLOYMENT,
  SAY_PER_SESSION,
  SAY_PER_DEPLOYMENT,
} from "../convex/limits";

/* =========================================================================
   Ceilings on the two public routes that had none.

   `/visitorHello` and `/visitorSay` answer the visitor's own browser with no
   secret, and both WRITE: hello inserts a session and may touch a person,
   say appends to a transcript. The chat route next to them has had a limiter
   since the beginning, because it spends model money on every message and
   that is the cost everybody thinks of. These two spend rows, which nobody
   bills you for until the table is large and the dashboard's counts are
   whatever a script decided to send.

   The hazard being tested is in BOTH directions, and the dangerous one is
   not abuse. A cap set too low refuses a real visitor, and a refused visitor
   does not look like a bug: they look like somebody who lost interest. So
   every cap here is asserted twice, once that a plausible real visit sails
   through and once that a flood does not.
   ========================================================================= */

let pass = 0, fail = 0;
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
function ok(label: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail ? "\n         " + detail : "")); }
}

const call = (fn: any, c: any, args: any) => fn._handler(c, args);
const limitRow = (db: any, key: string) =>
  db.all("limits").find((r: any) => r.key === key);

/* ------------------------------------------------------- hello: the caps */

console.log("\n== a real visit is never refused ==");
{
  const { db, ctx: c } = ctx();
  /* Forty page views in an hour is a heavy reader on a marketing site: every
     service page, every package, the blog and back again. */
  let limited = 0;
  for (let i = 0; i < 40; i++) {
    const r: any = await call(hello, c, { sessionId: "s1", visitorId: "v1", pageUrl: "/p" + i });
    if (r.limited) limited++;
  }
  eq("forty page views in one visit, none refused", limited, 0);
  eq("and it is one session row, not forty", db.all("sessions").length, 1);
}

console.log("\n== but a flood is ==");
{
  const { db, ctx: c } = ctx();
  const results: any[] = [];
  for (let i = 0; i < HELLO_PER_SESSION + 5; i++) {
    results.push(await call(hello, c, { sessionId: "s1", visitorId: "v1" }));
  }
  eq(`the first ${HELLO_PER_SESSION} are served`,
     results.slice(0, HELLO_PER_SESSION).filter((r) => r.limited).length, 0);
  eq("everything past the cap is refused",
     results.slice(HELLO_PER_SESSION).every((r) => r.limited === true), true);

  /* The point of the limit. A refused call must not write. */
  const sessionsAfter = db.all("sessions").length;
  eq("the flood produced exactly one session row", sessionsAfter, 1);

  /* And the counters it touched are three rows, not one per request. */
  eq("counters are rows keyed by name, so they do not grow with traffic",
     db.all("limits").length, 3);
}

console.log("\n== the shape a refusal returns ==");
{
  const { ctx: c } = ctx();
  const first: any = await call(hello, c, { sessionId: "s1", visitorId: "v1" });
  for (let i = 0; i < HELLO_PER_SESSION; i++) {
    await call(hello, c, { sessionId: "s1", visitorId: "v1" });
  }
  const refused: any = await call(hello, c, { sessionId: "s1", visitorId: "v1" });

  /* The widget calls this on page load and reads the answer to decide
     whether to greet by name. An error here is a broken panel, so a refusal
     is the same shape with one extra flag. */
  eq("a refusal carries every key the normal answer does",
     Object.keys(refused).sort(), Object.keys(first).sort());
  eq("it is still ok, so the widget renders", refused.ok, true);
  eq("it says it was limited, so this is visible in a log", refused.limited, true);
  eq("the normal answer says so too, rather than leaving the key out",
     first.limited, false);
}

console.log("\n== fresh session ids do not walk past it ==");
{
  const { db, ctx: c } = ctx();
  /* A script that mints a new session id per request defeats the per-session
     counter by construction. The visitor id is the next line. */
  let limited = 0;
  for (let i = 0; i < HELLO_PER_VISITOR + 3; i++) {
    const r: any = await call(hello, c, { sessionId: "s" + i, visitorId: "v1" });
    if (r.limited) limited++;
  }
  eq("the per-visitor cap catches it", limited, 3);
  eq("so it stopped at the cap, not at the number of requests",
     db.all("sessions").length, HELLO_PER_VISITOR);
}

console.log("\n== fresh ids on both only the deployment counter can see ==");
{
  const { db, ctx: c } = ctx();
  /* Driven by seeding the counter rather than by sending four thousand
     requests: what is being asserted is that the widest counter is
     consulted at all, and that it is consulted FIRST, so a flood using
     fresh ids every time cannot spend anybody's per-session budget. */
  db.insert("limits", { key: "hello:all", windowStart: Date.now(), count: HELLO_PER_DEPLOYMENT });
  const r: any = await call(hello, c, { sessionId: "brand-new", visitorId: "brand-new" });
  eq("a visitor nobody has ever seen is refused once the whole site is over",
     r.limited, true);
  eq("and no session row was written", db.all("sessions").length, 0);
  eq("the narrower counters were never even touched",
     db.all("limits").map((x: any) => x.key), ["hello:all"]);
}

console.log("\n== the window reopens ==");
{
  const { db, ctx: c } = ctx();
  for (let i = 0; i <= HELLO_PER_SESSION; i++) {
    await call(hello, c, { sessionId: "s1", visitorId: "v1" });
  }
  eq("refused at the cap",
     (await call(hello, c, { sessionId: "s1", visitorId: "v1" })).limited, true);

  /* An hour later. A cap that never reopens is not a rate limit, it is a
     ban, and a visitor who came back tomorrow would still be refused. */
  for (const key of ["hello:all", "hello:v:v1", "hello:s:s1"]) {
    const row = limitRow(db, key);
    db.patch(row._id, { windowStart: Date.now() - WINDOW_MS - 1000 });
  }
  eq("an hour later the same visitor is served",
     (await call(hello, c, { sessionId: "s1", visitorId: "v1" })).limited, false);
}

/* ------------------------------------------------- hello vs the chat path */

console.log("\n== reading the site does not use up the right to talk ==");
{
  const { ctx: c } = ctx();
  /* The chat limiter counts on "s:<id>" and "global". If hello shared those
     keys, a visitor who read thirty pages would arrive at the chat box with
     no budget left, and the assistant would simply refuse them. */
  for (let i = 0; i < HELLO_PER_SESSION; i++) {
    await call(hello, c, { sessionId: "s1", visitorId: "v1" });
  }
  const chat: any = await call(checkLimit, c, { sessionId: "s1", ip: "1.2.3.4" });
  eq("after a full hello budget, the chat limiter is untouched", chat.allowed, true);
}

/* ---------------------------------------------------------------- say */

function inHandover(state = "live") {
  const { db, ctx: c } = ctx();
  db.insert("sessions", {
    sessionId: "s1", visitorId: "v1", channel: "chat",
    startedAt: 1_000, lastSeenAt: 1_000, handover: state,
  });
  return { db, c };
}

console.log("\n== talking to a human is not rationed tightly ==");
{
  const { db, c } = inHandover();
  let refused = 0;
  for (let i = 0; i < 25; i++) {
    const r: any = await call(visitorSay, c, { sessionId: "s1", text: "message " + i });
    if (!r.ok) refused++;
  }
  eq("twenty five messages in a live conversation all land", refused, 0);
  eq("and all twenty five are in the transcript", db.all("messages").length, 25);
}

console.log("\n== a flood inside a handover is refused ==");
{
  const { db, c } = inHandover();
  const out: any[] = [];
  for (let i = 0; i < SAY_PER_SESSION + 3; i++) {
    out.push(await call(visitorSay, c, { sessionId: "s1", text: "m" + i }));
  }
  eq(`the first ${SAY_PER_SESSION} are accepted`,
     out.slice(0, SAY_PER_SESSION).filter((r) => !r.ok).length, 0);
  eq("the rest are refused", out.slice(SAY_PER_SESSION).map((r) => r.ok), [false, false, false]);
  eq("with a reason the widget can show",
     out[SAY_PER_SESSION].error, "too many messages");
  eq("and nothing past the cap reached the transcript",
     db.all("messages").length, SAY_PER_SESSION);
}

console.log("\n== the deployment ceiling on say ==");
{
  const { db, c } = inHandover();
  db.insert("limits", { key: "say:all", windowStart: Date.now(), count: SAY_PER_DEPLOYMENT });
  const r: any = await call(visitorSay, c, { sessionId: "s1", text: "hello?" });
  eq("over the site-wide ceiling it is refused", r.ok, false);
  eq("and nothing was written", db.all("messages").length, 0);
}

console.log("\n== what a script cannot do: spend somebody else's budget ==");
{
  /* `visitorSay` refuses anything not in handover, and that refusal comes
     FIRST. If the limit were checked before it, a script firing at a
     thousand made-up session ids would exhaust the deployment counter and
     silence every real conversation on the site. That is the ordering this
     asserts, and it is the whole reason the limit sits below the state
     check rather than above it. */
  const { db, c } = inHandover();
  for (let i = 0; i < 500; i++) {
    await call(visitorSay, c, { sessionId: "made-up-" + i, text: "flood" });
  }
  eq("five hundred messages at sessions not in handover spent no budget",
     limitRow(db, "say:all"), undefined);
  const real: any = await call(visitorSay, c, { sessionId: "s1", text: "are you there?" });
  eq("so the real conversation still works", real.ok, true);
  eq("and the limiter has only just started counting",
     limitRow(db, "say:all").count, 1);
}

console.log("\n== an empty message is refused before anything is counted ==");
{
  const { db, c } = inHandover();
  eq("blank text is refused", (await call(visitorSay, c, { sessionId: "s1", text: "   " })).ok, false);
  eq("and counted against nobody", limitRow(db, "say:all"), undefined);
}

console.log("\n== say reopens too ==");
{
  const { db, c } = inHandover();
  for (let i = 0; i <= SAY_PER_SESSION; i++) {
    await call(visitorSay, c, { sessionId: "s1", text: "m" + i });
  }
  eq("refused at the cap",
     (await call(visitorSay, c, { sessionId: "s1", text: "again" })).ok, false);
  for (const key of ["say:all", "say:s:s1"]) {
    const row = limitRow(db, key);
    db.patch(row._id, { windowStart: Date.now() - WINDOW_MS - 1000 });
  }
  eq("an hour later they can talk again",
     (await call(visitorSay, c, { sessionId: "s1", text: "still here" })).ok, true);
}

/* ------------------------------------------------- the caps themselves */

console.log("\n== the caps are plausible numbers, not placeholders ==");
{
  /* These are the assertions that would catch somebody tightening a cap
     during a panic and quietly cutting off real visitors. A cap below a
     plausible real visit is the failure this whole suite exists for. */
  ok(`hello per session (${HELLO_PER_SESSION}) is above a heavy real visit`,
     HELLO_PER_SESSION >= 100);
  ok(`hello per visitor (${HELLO_PER_VISITOR}) is above the per-session cap`,
     HELLO_PER_VISITOR > HELLO_PER_SESSION);
  ok(`hello per deployment (${HELLO_PER_DEPLOYMENT}) is above the per-visitor cap`,
     HELLO_PER_DEPLOYMENT > HELLO_PER_VISITOR);
  ok(`say per session (${SAY_PER_SESSION}) is at least a message a minute`,
     SAY_PER_SESSION >= 60);
  ok(`say per deployment (${SAY_PER_DEPLOYMENT}) allows several conversations at once`,
     SAY_PER_DEPLOYMENT >= SAY_PER_SESSION * 5);
  ok("the window is an hour, so nothing is banned for a day",
     WINDOW_MS === 60 * 60 * 1000);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
