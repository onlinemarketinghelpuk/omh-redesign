import {
  CONNECTORS, STAND_IN_SMTP, connector, ukNumber, validateConnector, rulesFor, patchWorkflow, redactConfig,
} from "../gates/connectors.js";
import { INTEGRATIONS, pendingTokens } from "../gates/integrations.js";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { ctx as mockCtx } from "./convex-mock.ts";
import * as IN from "../convex/integrations.ts";

/* =========================================================================
   Connecting a channel from the dashboard (plan 015), the decidable part.

   What this holds:
   - the values are checked before any provider is asked;
   - the patch changes exactly the fields it names, in the workflows it names,
     and nothing else (the chat workflow carries a gate inlined, and a find
     and replace over it would rewrite that code);
   - disconnecting puts back exactly what was there;
   - a secret stored in Convex never reaches a browser.

   The patch is run on the REAL built workflows (widget/n8n/*.json), because
   a patch tested on a hand-made workflow proves the hand-made workflow.
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

/* Made-up values in the right shapes. Never a real id (standing rule). */
const SID = "AC" + "0123456789abcdef".repeat(2);
const TOKEN32 = "fedcba9876543210".repeat(2);
const PAGE_TOKEN = "EAAtest" + "x1y2z3".repeat(12);
const GOOD: Record<string, Record<string, string>> = {
  twilio: { accountSid: SID, authToken: TOKEN32, fromNumber: "07700 900123" },
  meta: { pageId: "102938475610", pageToken: PAGE_TOKEN, appSecret: TOKEN32 },
  google_lead_form: {},
  imap: { host: "imap.example.com", port: "993", user: "replies@example.com", password: "app-password-1" },
  smtp: { from: "hello@example.com", host: "smtp.example.com", port: "465", user: "hello@example.com", password: "app-password-2" },
  booking: { url: "https://script.google.com/macros/s/AKfyTEST_123-abc/exec", secret: "a-long-secret" },
};
/* What Connect would store after the provider said yes. */
const STORED: Record<string, Record<string, string>> = {
  twilio: { credentialId: "credTestTwilio01", credentialName: "Twilio — OMH", fromNumber: "+447700900123" },
  meta: { pageId: "102938475610", pageToken: PAGE_TOKEN, appSecret: TOKEN32, verifyToken: "verify_test_0123456789abcdef" },
  google_lead_form: { key: "glf_test_0123456789abcdefghij" },
  imap: { credentialId: "credTestImap0001", credentialName: "IMAP — OMH replies" },
  smtp: { credentialId: "credTestSmtp0001", credentialName: "SMTP — OMH", from: "hello@example.com" },
};

/* ===================================================================== */
console.log("\n== 1. the registry ==");
{
  const keys = INTEGRATIONS.map((i: any) => i.key);
  for (const c of CONNECTORS) {
    ok(`${c.key} fixes an integration the 014 screen measures`, keys.includes(c.integration), c.integration);
    ok(`${c.key} has steps a person can follow`, c.steps.length > 0);
    ok(`${c.key}: every secret field says where it goes`, c.fields.filter((f: any) => f.kind === "secret").every((f: any) => c.key === "meta" || c.key === "booking" || f.help));
  }
  eq("an unknown connector is refused", validateConnector("myspace", {}).ok, false);
}

/* ===================================================================== */
console.log("\n== 2. values are checked before any provider is asked ==");
{
  for (const [k, v] of Object.entries(GOOD)) eq(`${k}: good values pass`, validateConnector(k, v).errors, {});
  eq("a UK number is stored as +44", validateConnector("twilio", GOOD.twilio).clean.fromNumber, "+447700900123");
  eq("ukNumber: 020 3489 3934", ukNumber("020 3489 3934"), "+442034893934");
  eq("ukNumber: a premium number is not one", ukNumber("09001234567"), "");
  eq("a port is stored as a number", validateConnector("imap", GOOD.imap).clean.port, 993);

  const bad = (k: string, field: string, value: string) =>
    Object.keys(validateConnector(k, { ...GOOD[k], [field]: value }).errors);
  eq("an SID that is not AC + 32", bad("twilio", "accountSid", "AB123"), ["accountSid"]);
  eq("a number that is not UK", bad("twilio", "fromNumber", "+1 415 555 0100"), ["fromNumber"]);
  eq("a Page token with a quote in it cannot reach n8n's code", bad("meta", "pageToken", PAGE_TOKEN + '";alert(1)//'), ["pageToken"]);
  eq("an app secret of the wrong length", bad("meta", "appSecret", "abc"), ["appSecret"]);
  eq("a booking URL that is not an Apps Script /exec", bad("booking", "url", "https://evil.example/exec"), ["url"]);
  eq("a missing required field is named", Object.keys(validateConnector("smtp", { ...GOOD.smtp, password: "" }).errors), ["password"]);
  ok("and the message says what is needed", /needed/.test(validateConnector("smtp", { ...GOOD.smtp, password: "" }).errors.password));
}

/* ===================================================================== */
console.log("\n== 3. the patch, on the real built workflows ==");
const dir = new URL("../n8n/", import.meta.url);
const built = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d\d-.*\.json$/.test(f)) : [];
const byShort = (short: string) => {
  for (const f of built) {
    const wf = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    const name = String(wf.name).split("— ").pop();
    if (name === short || name.startsWith(short + " ")) return wf;
  }
  return null;
};
if (!built.length) {
  console.log("  NOT CHECKED: no built workflows in widget/n8n (run build-workflows.py)");
} else {
  for (const c of CONNECTORS) {
    if (!c.workflows.length) continue;
    const rules = rulesFor(c.key, STORED[c.key]);
    let total = 0;
    for (const name of c.workflows) {
      const wf = byShort(name);
      ok(`${c.key}: ${name} is built`, Boolean(wf), name);
      if (!wf) continue;
      const before = pendingTokens(JSON.stringify(wf));
      const p = patchWorkflow(wf, rules);
      total += p.changed;
      const after = pendingTokens(JSON.stringify(p.body));
      const mine = rules.filter((r: any) => /_PENDING$/.test(r.from)).map((r: any) => r.from);
      eq(`${c.key}: ${name} keeps none of its own placeholders`, after.filter((t: string) => mine.includes(t)), []);
      eq(`${c.key}: ${name} keeps every other placeholder it had`,
         after, before.filter((t: string) => !mine.includes(t)));
      eq(`${c.key}: ${name} keeps the same nodes`, p.body.nodes.map((n: any) => n.name), wf.nodes.map((n: any) => n.name));
      ok(`${c.key}: ${name} is saved without touching active`, !("active" in p.body));

      /* Exactly the named fields changed: undo the patch by hand and it is
         the original, byte for byte. */
      const undo = patchWorkflow(p.body, rulesFor(c.key, STORED[c.key], true));
      eq(`${c.key}: ${name} disconnect puts back exactly what was there`, JSON.stringify(undo.body.nodes), JSON.stringify(wf.nodes));
    }
    ok(`${c.key}: the patch changed something`, total > 0, total);
  }

  /* The chat and voice workflows carry the integrations gate inlined. No
     connector names them, and even if every rule were run over them, the
     gate's own text must come out unchanged. */
  for (const name of ["Chat", "Voice"]) {
    const wf = byShort(name);
    if (!wf) continue;
    const all = CONNECTORS.flatMap((c: any) => rulesFor(c.key, STORED[c.key] || {}));
    const p = patchWorkflow(wf, all.filter((r: any) => r.kind !== "param"));
    eq(`${name}: every text and credential rule run over it changes nothing`, p.changed, 0);
  }

  /* The smtp rule replaces the stand-in, and only the stand-in. */
  const sw = byShort("Sequence Worker");
  if (sw) {
    const p = patchWorkflow(sw, rulesFor("smtp", STORED.smtp));
    const txt = JSON.stringify(p.body);
    ok("smtp: the stand-in address is gone from the Sequence Worker", !txt.includes(STAND_IN_SMTP.from));
    ok("smtp: the new credential is in its place", txt.includes(STORED.smtp.credentialId));
  }
}

/* ===================================================================== */
console.log("\n== 4. a half-made connection writes nothing ==");
{
  const wf = { name: "x", nodes: [{ name: "n", parameters: { from: "TWILIO_NUMBER" + "_PENDING" }, credentials: { twilioApi: { id: "TWILIO_CRED" + "_PENDING" } } }], connections: {} };
  const p = patchWorkflow(wf, rulesFor("twilio", { fromNumber: "+447700900123" }));
  eq("no credential id yet: the credential is left alone", (p.body.nodes[0] as any).credentials.twilioApi.id, "TWILIO_CRED" + "_PENDING");
  ok("and 'undefined' is never written", !JSON.stringify(p.body).includes("undefined"));
}

/* ===================================================================== */
console.log("\n== 5. a stored secret never reaches a browser ==");
{
  const stored = { meta: STORED.meta, booking: { url: GOOD.booking.url, secret: GOOD.booking.secret }, google_lead_form: STORED.google_lead_form };
  const r = redactConfig(stored);
  const out = JSON.stringify(r);
  for (const s of [PAGE_TOKEN, TOKEN32, GOOD.booking.secret]) ok(`not in what the screen gets: ${s.slice(0, 6)}...`, !out.includes(s));
  eq("a secret becomes set and its last four", r.meta.pageToken, { set: true, last4: PAGE_TOKEN.slice(-4) });
  eq("what the owner must copy into Meta is still shown", r.meta.verifyToken, STORED.meta.verifyToken);
  eq("and the Google key, which is pasted into Google Ads", r.google_lead_form.key, STORED.google_lead_form.key);
  eq("an empty secret says it is not set", redactConfig({ meta: { pageToken: "" } }).meta.pageToken, { set: false });
}

/* ===================================================================== */
console.log("\n== 6. shaped for n8n and Convex ==");
{
  const src = readFileSync(new URL("../gates/connectors.js", import.meta.url), "utf8");
  ok("no import statement", !/^\s*import\s/m.test(src));
  eq("one export line", src.split("\n").filter((l) => /^\s*export\b/.test(l)).length, 1);
  eq("no whole placeholder token in its text", pendingTokens(src), []);
  /* Every gate is inlined into some workflow. A whole placeholder name in
     one, even in a comment, becomes one more place the 014 screen sees a
     placeholder and the patch writes a secret into. Found twice on
     2026-11-16: the integrations table, then a comment in the Google gate. */
  for (const f of readdirSync(new URL("../gates/", import.meta.url)).filter((x) => x.endsWith(".js"))) {
    const text = readFileSync(new URL(`../gates/${f}`, import.meta.url), "utf8");
    eq(`gates/${f} spells out no whole placeholder name`, pendingTokens(text), []);
  }
  ok("connector() finds by key", connector("smtp")?.label === "Sending mailbox");
}

/* ===================================================================== */
console.log("\n== 7. the Convex setting ==");
{
  const { ctx: c } = mockCtx();
  const call = (fn: any, args: any) => fn._handler(c, args);
  eq("nothing connected yet", (await call(IN.getIntegrations, {})).config, {});
  await call(IN.saveIntegration, { key: "twilio", value: STORED.twilio, by: "smoke" });
  await call(IN.saveIntegration, { key: "meta", value: STORED.meta, by: "smoke" });
  const got = await call(IN.getIntegrations, {});
  eq("saved values read back, for the server and the builder", got.config.twilio.credentialId, STORED.twilio.credentialId);
  ok("with who saved it and when", got.config.twilio.by === "smoke" && typeof got.config.twilio.at === "number");
  eq("one connector saving does not touch another", got.config.meta.pageToken, STORED.meta.pageToken);
  eq("an unknown connector is refused", (await call(IN.saveIntegration, { key: "myspace", value: {} })).ok, false);
  eq("a value that is not text or a number is refused",
     (await call(IN.saveIntegration, { key: "twilio", value: { credentialId: { $gt: "" } } })).ok, false);
  await call(IN.clearIntegration, { key: "meta", by: "smoke" });
  ok("disconnect clears it", !("meta" in (await call(IN.getIntegrations, {})).config));
}

/* ===================================================================== */
console.log("\n== 8. the browser boundary, in the code that crosses it ==");
{
  /* A page is a server component, so what it passes to a client component
     is sent to the browser. It must only ever hold the redacted config. */
  const page = readFileSync(new URL("../../app/lead-dashboard/integrations/page.tsx", import.meta.url), "utf8");
  ok("the page reads the redacted config", page.includes("connectedForScreen()"));
  ok("and never the full one", !/storedConfig\s*\(/.test(page));
  const lib = readFileSync(new URL("../../lib/dashboard/connect.ts", import.meta.url), "utf8");
  ok("connectedForScreen redacts before returning", /export async function connectedForScreen[\s\S]{0,200}redactConfig\(/.test(lib));
  const actions = readFileSync(new URL("../../app/lead-dashboard/integrations/connect-actions.ts", import.meta.url), "utf8");
  ok("the actions build their answer field by field, never by spreading the result", /function forScreen[\s\S]{0,400}ok: r\.ok,\s*message: r\.message/.test(actions) && !/\.\.\.r\b/.test(actions));
  ok("every action checks the dashboard password", (actions.match(/assertCanWrite\(\)/g) || []).length === 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
