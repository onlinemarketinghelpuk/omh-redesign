import {
  INTEGRATIONS, CHANNEL_NEEDS, MERGED, STAND_IN_SENDER, workflowFacts, pendingTokens,
  integrationStatus, channelStatus, isOn,
} from "../gates/integrations.js";
import { TRIGGER_ORDER, MERGED as FLOW_MERGED } from "../gates/flows.js";
import { readFileSync } from "node:fs";
import { channelRows } from "../../lib/dashboard/control-panel.ts";

/* =========================================================================
   Connected is measured, never declared.

   Every status here is derived from facts observed at request time: the
   workflows as they are on n8n, the agents and numbers as Retell lists them,
   the website's own environment, the outbound number in Convex and the
   booking script answering. There is no `connected: true` anywhere, because
   that field is wrong the moment a token expires, and wrong in the
   expensive direction: the screen says live while leads fall on the floor.

   Four rules this suite holds:
   - a placeholder is not a value,
   - a missing setting is not a value,
   - an inactive workflow is not connected,
   - a channel switched off is reported as OFF, not as broken,
   and a fifth that matters as much: anything we could not ask is "could
   not check", never "connected".
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

/* Everything healthy, as the base the cases below break one fact at a time. */
const W = (name: string, extra: Record<string, unknown> = {}) =>
  ({ name: "OHM Assistant \u2014 " + name, active: true, pending: [], agentOverride: false, senders: [], ...extra });
function healthy() {
  return {
    n8n: {
      checked: true,
      workflows: [
        W("Chat"), W("Voice (Retell tools + web call token)"), W("Lead Router"),
        W("Twilio Inbound"), W("Email Inbound"), W("Meta"),
        W("Sequence Worker", { agentOverride: true, senders: ["hello@onlinemarketinghelp.co.uk"] }),
      ],
    },
    retell: { checked: true, agents: ["OMH Site Assistant", "OMH Outbound"], numbers: ["+447700900123"] },
    env: { leadRouterUrl: true },
    agent: { checked: true, fromNumber: "+447700900123" },
    booking: { checked: true, ok: true },
  };
}
const state = (k: string, f: any) => integrationStatus(k, f).state;

/* ===================================================================== */
console.log("\n== 1. the shape ==");
{
  eq("a switch for every channel the Control panel lists, in its order",
     Object.keys(CHANNEL_NEEDS), TRIGGER_ORDER);
  eq("old channel names map exactly as flows.js maps them", MERGED, FLOW_MERGED);
  const keys = INTEGRATIONS.map((i: any) => i.key);
  ok("every channel needs only integrations that exist",
     Object.values(CHANNEL_NEEDS).every((n: any) => n.every((k: string) => keys.includes(k))));
  ok("every integration has a label and says what it does", INTEGRATIONS.every((i: any) => i.label && i.what));
  const f = healthy();
  for (const k of keys) eq(`healthy facts: ${k} is connected`, state(k, f), "connected");
}

/* ===================================================================== */
console.log("\n== 2. a placeholder is not a value ==");
{
  eq("pendingTokens finds them", pendingTokens('{"id":"TWILIO_CRED_PENDING","x":"META_PAGE_TOKEN_PENDING"}'),
     ["META_PAGE_TOKEN_PENDING", "TWILIO_CRED_PENDING"]);
  eq("the error workflow's sentinel is not one: push.py resolves it",
     pendingTokens('{"errorWorkflow":"ERROR_WF_PENDING"}'), []);

  const f: any = healthy();
  f.n8n.workflows.find((w: any) => w.name.endsWith("Twilio Inbound")).pending = ["TWILIO_CRED_PENDING"];
  const s = integrationStatus("texts", f);
  eq("a placeholder Twilio credential: texts not connected", s.state, "not_connected");
  ok("and it says so in words, naming who supplies it",
     s.missing.some((m: any) => /Twilio/.test(m.what) && /OMH/.test(m.from)), s.missing);

  const g: any = healthy();
  g.n8n.workflows.find((w: any) => w.name.endsWith("Meta")).pending = ["META_PAGE_TOKEN_PENDING"];
  eq("a placeholder Page token: Facebook and Instagram not connected", state("meta", g), "not_connected");
  eq("which is what the Facebook message channel shows", channelStatus("facebook", g, {}).state, "not_connected");
}

/* ===================================================================== */
console.log("\n== 3. a missing setting is not a value ==");
{
  const f: any = healthy(); f.env.leadRouterUrl = false;
  eq("no OHM_LEAD_ROUTER_URL on the website: the form is not connected", state("lead_router", f), "not_connected");
  ok("and names the setting", integrationStatus("lead_router", f).missing.some((m: any) => m.what.includes("OHM_LEAD_ROUTER_URL")));

  const g: any = healthy(); g.agent.fromNumber = "";
  eq("no outbound number set: calls not connected", state("outbound_calls", g), "not_connected");
  const h: any = healthy(); h.retell.numbers = [];
  eq("a number not imported into Retell: calls not connected", state("outbound_calls", h), "not_connected");
  const i: any = healthy(); i.n8n.workflows.find((w: any) => w.name.endsWith("Sequence Worker")).agentOverride = false;
  eq("no outbound agent in the call step: calls not connected", state("outbound_calls", i), "not_connected");
}

/* ===================================================================== */
console.log("\n== 4. an inactive workflow is not connected ==");
{
  const f: any = healthy(); f.n8n.workflows.find((w: any) => w.name.endsWith("Chat")).active = false;
  eq("Chat switched off in n8n", state("chat", f), "not_connected");
  ok("says the workflow is switched off", integrationStatus("chat", f).missing.some((m: any) => /switched off/i.test(m.what)));

  const g: any = healthy(); g.n8n.workflows = g.n8n.workflows.filter((w: any) => !w.name.endsWith("Meta"));
  eq("a workflow that is not on n8n at all", state("meta", g), "not_connected");

  const h: any = healthy(); h.n8n.workflows.find((w: any) => w.name.endsWith("Sequence Worker")).active = false;
  for (const k of ["texts", "outbound_calls", "email_followups"]) {
    eq(`Sequence Worker off: ${k} cannot follow up`, state(k, h), "not_connected");
  }
  eq("but the chat is untouched by it", state("chat", h), "connected");
}

/* ===================================================================== */
console.log("\n== 5. what we could not ask is never connected ==");
{
  const f: any = healthy(); f.n8n = { checked: false, why: "n8n did not answer in 8 seconds" };
  for (const k of ["chat", "lead_router", "meta", "texts"]) eq(`n8n unreachable: ${k}`, state(k, f), "could_not_check");
  ok("and says why", integrationStatus("chat", f).unchecked.some((u: string) => u.includes("8 seconds")));
  eq("appointments do not need n8n, so they are still judged", state("appointments", f), "connected");

  const g: any = healthy(); g.retell = { checked: false, why: "no RETELL_API_KEY on the website" };
  eq("Retell unreachable: voice", state("voice", g), "could_not_check");
  /* Retell's real name for it is "OMH Site Assistant (Melissa)". Read on
     2026-11-16; an exact match reported a working agent as missing. */
  const r: any = healthy(); r.retell.agents = ["OMH Site Assistant (Melissa)", "Melissa HeatPumps4Pools"];
  eq("the agent is found by its name with Retell's suffix", state("voice", r), "connected");
  const r2: any = healthy(); r2.retell.agents = ["Not OMH Site Assistant"];
  eq("but not by a name that merely contains it", state("voice", r2), "not_connected");

  const h: any = healthy(); h.booking = { checked: false, why: "timed out" };
  eq("booking script did not answer in time", state("appointments", h), "could_not_check");
  const i: any = healthy(); i.booking = { checked: true, ok: false, why: "the script answered without ok" };
  eq("booking script answered wrongly: not connected", state("appointments", i), "not_connected");

  const j: any = healthy(); j.n8n = { checked: false, why: "x" }; j.env.leadRouterUrl = false;
  eq("something definitely missing outranks something unknown", state("lead_router", j), "not_connected");
}

/* ===================================================================== */
console.log("\n== 6. a channel switched off is OFF, not broken ==");
{
  const f: any = healthy();
  eq("absent from the switches means on", isOn({}, "facebook"), true);
  eq("false means off", isOn({ facebook: false }, "facebook"), false);
  eq("an old channel name follows its new one", isOn({ facebook: false }, "facebook_dm"), false);
  eq("a healthy channel switched off", channelStatus("facebook", f, { facebook: false }).state, "off");

  const g: any = healthy(); g.n8n.workflows.find((w: any) => w.name.endsWith("Meta")).pending = ["META_PAGE_TOKEN_PENDING"];
  const s = channelStatus("facebook", g, { facebook: false });
  eq("a BROKEN channel switched off still reads as off", s.state, "off");
  ok("with what is missing kept, for when it is switched back on", s.missing.length > 0, s);
  eq("switching one channel off leaves its neighbour alone", channelStatus("instagram", f, { facebook: false }).state, "connected");
}

/* ===================================================================== */
console.log("\n== 7. a channel that needs two things ==");
{
  const f: any = healthy();
  f.n8n.workflows.find((w: any) => w.name.endsWith("Lead Router")).pending = ["GOOGLE_LEAD_FORM_KEY_PENDING"];
  eq("landing pages work, lead forms do not: Google Ads is partly connected", channelStatus("google_ads", f, {}).state, "partial");
  eq("the website form, which does not need the key, is connected", channelStatus("website_form", f, {}).state, "connected");
  eq("a channel nothing has been built for says so", channelStatus("whatsapp", f, {}).state, "not_built");
  /* Found on the real page: with n8n unreachable, both of Google Ads'
     integrations said the same "could not read n8n", and the row listed it
     twice (React reported the duplicate key). */
  const u: any = healthy(); u.n8n = { checked: false, why: "no key" };
  const g = channelStatus("google_ads", u, {});
  eq("a reason shared by two integrations is listed once", g.unchecked.length, new Set(g.unchecked).size);
  const v: any = healthy(); v.n8n.workflows.find((w: any) => w.name.endsWith("Lead Router")).active = false;
  const gm = channelStatus("google_ads", v, {}).missing.map((m: any) => m.what);
  eq("and so is a gap shared by two", gm.length, new Set(gm).size);
}

/* ===================================================================== */
console.log("\n== 8. the stand-in sender is said out loud ==");
{
  const f: any = healthy();
  f.n8n.workflows.find((w: any) => w.name.endsWith("Sequence Worker")).senders = [STAND_IN_SENDER];
  const s = integrationStatus("email_followups", f);
  eq("it sends, so it is connected", s.state, "connected");
  ok("but the note names the stand-in address", (s.note || "").includes(STAND_IN_SENDER), s);
}

/* ===================================================================== */
console.log("\n== 9. from n8n's own JSON ==");
{
  const raw = {
    name: "OHM Assistant \u2014 Sequence Worker", active: false,
    nodes: [
      { parameters: { fromEmail: "videoeditoromh@gmail.com" } },
      { parameters: { fromEmail: "={{ $json.from }}" } },
      { credentials: { twilioApi: { id: "TWILIO_CRED_PENDING" } } },
      { parameters: { jsonBody: "={{ JSON.stringify({ override_agent_id: 'agent_1' }) }}" } },
    ],
    settings: { errorWorkflow: "ERROR_WF_PENDING" },
  };
  eq("workflowFacts reduces a workflow to what the screen needs", workflowFacts(raw), {
    name: "OHM Assistant \u2014 Sequence Worker", active: false, pending: ["TWILIO_CRED_PENDING"],
    agentOverride: true, senders: ["videoeditoromh@gmail.com"],
  });
}

/* ===================================================================== */
console.log("\n== 10. today, measured: the live n8n of 2026-11-16 ==");
{
  /* Reduced from a real GET /api/v1/workflows. It is the honest answer to
     "what would this screen have said this morning", and the plan's claim
     that eight things are placeholders is checked against it, not repeated. */
  const fx = JSON.parse(readFileSync(new URL("./integrations.fixture.json", import.meta.url), "utf8"));
  const f: any = { ...healthy(), n8n: { checked: true, workflows: fx.workflows } };
  const tokens = [...new Set(fx.workflows.flatMap((w: any) => w.pending))].sort();
  eq("seven placeholders on the live workflows", tokens, [
    "GOOGLE_LEAD_FORM_KEY_PENDING", "IMAP_CRED_PENDING", "META_APP_SECRET_PENDING", "META_PAGE_TOKEN_PENDING",
    "META_VERIFY_PENDING", "TWILIO_CRED_PENDING", "TWILIO_NUMBER_PENDING",
  ]);
  ok("and the eighth, the outbound agent, absent from the call step",
     !fx.workflows.some((w: any) => w.agentOverride));
  eq("chat: connected", state("chat", f), "connected");
  eq("voice: connected", state("voice", f), "connected");
  eq("texts: not connected", state("texts", f), "not_connected");
  eq("email replies: not connected", state("email_replies", f), "not_connected");
  eq("Facebook and Instagram: not connected", state("meta", f), "not_connected");
  eq("Google Ads: partly connected", channelStatus("google_ads", f, {}).state, "partial");
  eq("outbound calls: not connected", state("outbound_calls", f), "not_connected");
  ok("the Sequence Worker being off is named on the follow-ups",
     integrationStatus("email_followups", f).missing.some((m: any) => /Sequence Worker/.test(m.what)));
}

/* ===================================================================== */
console.log("\n== 11. the Control panel and this screen cannot disagree ==");
{
  /* Same switches in, same answer out: both read isOn() from this gate,
     which is also what enrol() reads in Convex. */
  const sw = { facebook: false, reactivation: false };
  const rows = channelRows([], sw);
  const offRows = rows.filter((r: any) => r.on === false).map((r: any) => r.channel);
  const offHere = TRIGGER_ORDER.filter((c: string) => channelStatus(c, healthy(), sw).state === "off");
  eq("the Control panel marks the switched-off channels", offRows, ["facebook", "reactivation"]);
  eq("exactly the ones this screen reports as off", offRows, offHere);
  ok("with no switches given, every row is on", channelRows([]).every((r: any) => r.on === true));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
