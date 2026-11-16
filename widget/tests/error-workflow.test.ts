import { readFileSync, readdirSync } from "node:fs";

/* =========================================================================
   The error handler, and the wiring that makes it get called.

   Until 2026-11-16 a failed n8n execution went nowhere. n8n recorded it,
   nothing read the record, and whatever that execution was carrying was
   gone: no email, no row, nothing to notice. For a lead router that means a
   customer enquired and was never contacted, while every screen still looks
   healthy. It is the only failure in this system that is both silent and
   expensive.

   Two things are asserted here and neither is a comment:

   1. All twelve workflows name an error workflow, and 00-error does not name
      itself. An error workflow pointed at itself calls itself when it fails,
      and the part of it most likely to fail is the email send, so that loop
      ends in a throttled mailbox rather than in a report.

   2. The formatter survives every payload shape n8n actually sends. n8n has
      two: a node threw, which carries `execution`, and a trigger threw,
      which carries `trigger` and NO execution at all. Reading
      `$json.execution.error` would throw on the second one, inside the error
      handler, which is the one place a crash cannot be seen.
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

const dir = new URL("../n8n/", import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));

const ERROR_WF_NAME = "OHM Assistant — Error Handler";

/* ----------------------------------------------- 1 · the workflow exists */

console.log("\n== there is an error handler, and it is shaped like one ==");

const err = read("00-error.json");
eq("it is named so push.py can find it by name", err.name, ERROR_WF_NAME);

const types = (err.nodes ?? []).map((n: any) => n.type);
ok("it starts from an Error Trigger",
   types.includes("n8n-nodes-base.errorTrigger"), types.join(", "));
ok("it ends in an email", types.includes("n8n-nodes-base.emailSend"));

/* The one dependency rule. A Convex outage is a plausible CAUSE of the error
   being reported, so a handler that had to reach Convex to report it would
   be silent in exactly the case that matters most. */
const reaches = JSON.stringify(err.nodes).match(/https?:\/\/[^"'\s]+/g) ?? [];
eq("it calls nothing over HTTP, so a Convex outage can still be reported",
   reaches.filter((u: string) => !u.includes("schema")), []);

/* ------------------------------------------- 2 · everything points at it */

console.log("\n== every workflow names it, and it does not name itself ==");

const files = readdirSync(dir).filter((f) => /^\d\d-.*\.json$/.test(f)).sort();
ok("all thirteen workflows are present", files.length === 13, `found ${files.length}`);

eq("the error handler does not point at itself",
   err.settings?.errorWorkflow ?? null, null);

let pointed = 0;
for (const f of files) {
  if (f === "00-error.json") continue;
  const wf = read(f);
  const ew = wf.settings?.errorWorkflow;
  ok(`${f} names an error workflow`, typeof ew === "string" && ew.length > 0, String(ew));
  if (typeof ew === "string" && ew.length > 0) pointed++;
}
eq("twelve workflows are covered", pointed, 12);

/* Only the keys n8n's public API schema allows. That schema is
   `additionalProperties: false`, so one unknown key rejects the whole PUT and
   the push fails for a reason that reads like a server fault. */
const ALLOWED_SETTINGS = new Set([
  "saveExecutionProgress", "saveManualExecutions", "saveDataErrorExecution",
  "saveDataSuccessExecution", "executionTimeout", "errorWorkflow",
  "timezone", "executionOrder",
]);
for (const f of files) {
  const bad = Object.keys(read(f).settings ?? {}).filter((k) => !ALLOWED_SETTINGS.has(k));
  eq(`${f} sends no settings key the API would reject`, bad, []);
}

/* ------------------------------------------------- 3 · the formatter runs */

console.log("\n== the formatter survives what n8n actually sends ==");

const code: string = err.nodes.find((n: any) => n.parameters?.jsCode)?.parameters.jsCode;
ok("there is a formatter to drive", typeof code === "string" && code.length > 0);

/* Driven the way n8n drives it: the body wrapped in a function, with the
   names n8n puts in scope passed in. Static data is a real object here, so
   the suppression window can be exercised across calls. */
function runner() {
  const store: any = { seen: undefined };
  const fn = new Function(
    "$input", "$getWorkflowStaticData", "$", "$json", "$now", "items", "DateTime",
    code,
  );
  return {
    store,
    call(payload: any) {
      return fn(
        { first: () => ({ json: payload }) },
        () => store,
        () => ({}), payload, new Date(), [], null,
      );
    },
  };
}

/* The shape n8n sends when a node threw. */
const NODE_FAILURE = {
  execution: {
    id: "4471",
    url: "https://srv1836598.hstgr.cloud/workflow/WvX8464jZBFXmg3K/executions/4471",
    retryOf: null,
    error: { message: "connect ETIMEDOUT 10.0.0.4:443", stack: "Error: connect..." },
    lastNodeExecuted: "Enrol On A Route",
    mode: "trigger",
  },
  workflow: { id: "WvX8464jZBFXmg3K", name: "OHM Assistant — Lead Router" },
};

{
  const r = runner();
  const out = r.call(NODE_FAILURE);
  ok("a node failure produces exactly one email", Array.isArray(out) && out.length === 1);
  const j = out[0].json;
  ok("the subject names the workflow that failed",
     j.subject.includes("OHM Assistant — Lead Router"), j.subject);
  ok("the subject says it failed, so it reads as an alert in a mailbox",
     /FAILED/.test(j.subject), j.subject);
  ok("the body names the node that threw", j.body.includes("Enrol On A Route"));
  ok("the body carries the error itself", j.body.includes("connect ETIMEDOUT"));
  ok("the body links the execution, so it can be opened and retried",
     j.body.includes("/executions/4471"));
  /* The sentence that makes somebody act. An alert that says "workflow
     failed" gets filed; one that says a lead was not contacted does not. */
  ok("the body says what it costs: the lead was not contacted",
     /has not been contacted/.test(j.body));
}

/* The shape n8n sends when the TRIGGER threw. There is no `execution` key at
   all. This is the one that crashes a formatter written against the common
   case, and it crashes it invisibly. */
{
  const r = runner();
  let out: any, threw = "";
  try {
    out = r.call({
      trigger: { error: { message: "ENOTFOUND imap.gmail.com" }, mode: "trigger" },
      workflow: { id: "x9", name: "OHM Assistant — Email Inbound" },
    });
  } catch (e) { threw = String((e as Error).message); }
  ok("a trigger failure does not crash the handler", threw === "", threw);
  ok("it still produces an email", Array.isArray(out) && out.length === 1);
  ok("it carries the trigger's error", out?.[0]?.json?.body?.includes("ENOTFOUND"));
  ok("and says the trigger is where it broke",
     out?.[0]?.json?.body?.includes("the trigger"), out?.[0]?.json?.body);
}

/* Nothing recognisable at all. Still an email, because an error handler that
   returns nothing when it does not understand the payload is a silent
   failure wearing a handler's clothes. */
{
  const r = runner();
  let out: any, threw = "";
  try { out = r.call({}); } catch (e) { threw = String((e as Error).message); }
  ok("an unrecognised payload does not crash it", threw === "", threw);
  ok("it still reports something", Array.isArray(out) && out.length === 1);
  ok("and admits what it does not know",
     out?.[0]?.json?.body?.includes("not reported"), out?.[0]?.json?.body);
}

/* ------------------------------------------- 4 · the repeat suppression */

console.log("\n== a failing cron does not become 1440 emails a day ==");

{
  const r = runner();
  eq("the first one is sent", r.call(NODE_FAILURE).length, 1);
  eq("the same failure again is counted, not sent", r.call(NODE_FAILURE).length, 0);
  eq("and again", r.call(NODE_FAILURE).length, 0);

  /* The direction that must never be suppressed. A SECOND, DIFFERENT fault
     in the same workflow is news, and a throttle keyed on the workflow alone
     would have swallowed it. */
  const other = {
    ...NODE_FAILURE,
    execution: { ...NODE_FAILURE.execution, error: { message: "Convex 401 unauthorised" } },
  };
  eq("a different failure in the same workflow is sent immediately",
     r.call(other).length, 1);

  /* And once the window has passed, the original is reported again, with the
     count of what was suppressed, so an ongoing fault keeps nagging. */
  const seen = r.store.seen;
  for (const k of Object.keys(seen)) seen[k].at -= 16 * 60 * 1000;
  const again = r.call(NODE_FAILURE);
  eq("after the window it is reported again", again.length, 1);
  ok("and says how many times it happened while quiet",
     /times in the last 15 minutes/.test(again[0].json.body), again[0].json.body);
}

/* Static data is not guaranteed to be writable in every execution mode. If
   it is not, the throttle must fail OPEN: more emails, never fewer. A
   throttle that fails closed turns an outage into silence. */
{
  const fn = new Function(
    "$input", "$getWorkflowStaticData", "$", "$json", "$now", "items", "DateTime",
    code,
  );
  const callNoStore = () => fn(
    { first: () => ({ json: NODE_FAILURE }) },
    () => { throw new Error("static data unavailable"); },
    () => ({}), NODE_FAILURE, new Date(), [], null,
  );
  let threw = "";
  let a: any, b: any;
  try { a = callNoStore(); b = callNoStore(); } catch (e) { threw = String((e as Error).message); }
  ok("with no static data it does not crash", threw === "", threw);
  eq("and it still reports, every time, rather than going quiet",
     [a?.length, b?.length], [1, 1]);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
