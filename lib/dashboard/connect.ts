import "server-only";

/* =========================================================================
   Connecting a channel (plan 015): the part that talks to the providers,
   to n8n and to Convex. The part with a right answer (what each connector
   needs, the validation, the exact patch) is widget/gates/connectors.js.

   The order is the safety:

     1. validate the values             nothing asked of anybody yet
     2. ask the provider                a wrong key stops here, nothing written
     3. make the n8n credential         a secret goes to n8n, encrypted
     4. patch the workflows             only the fields the rules name
     5. save to Convex                  so the builder keeps it on a rebuild

   A failure at 2 or 3 changes nothing. A failure at 4 is reported by
   workflow, never hidden: the 014 status on the next load shows the truth.

   `dryRun` does 1, 2 and works out 4 (what would change, where) without
   writing anything anywhere. It is how this is proved against the live
   workflows without changing them.

   Server only. The values typed in never come back to a browser; the screen
   gets redactConfig() of what was stored.
   ========================================================================= */

import { randomBytes } from "node:crypto";
import tls from "node:tls";
import nodemailer from "nodemailer";
import {
  connector, validateConnector, rulesFor, patchWorkflow, redactConfig, CRED_NAMES,
  type Rule,
} from "@/widget/gates/connectors.js";

const CEILING_MS = 10_000;

const SITE = process.env.OHM_WIDGET_CONVEX_SITE || "https://cool-ferret-103.convex.site";
const SECRET = process.env.OHM_WIDGET_SECRET || "";

type Stored = Record<string, string | number>;
type Config = Record<string, Stored>;

export type WorkflowResult = { workflow: string; changed: number; saved: boolean; why?: string };
export type ConnectResult = {
  ok: boolean;
  /** Field by field, when the values themselves are wrong. */
  errors?: Record<string, string>;
  /** In words, when something else is: the provider said no, n8n could not be reached. */
  message: string;
  workflows?: WorkflowResult[];
  dryRun?: boolean;
};

/* ---------------------------------------------------------------- Convex */

async function convex<T>(path: string, body: Record<string, unknown> = {}): Promise<T | null> {
  if (!SECRET) return null;
  try {
    const r = await fetch(`${SITE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-ohm-secret": SECRET },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CEILING_MS),
      cache: "no-store",
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Everything connected so far, in full. Server side only. */
export async function storedConfig(): Promise<Config | null> {
  const r = await convex<{ config: Config }>("/integrations/get");
  return r ? r.config : null;
}

/** What the screen may see: secrets reduced to "set, ends in ...". */
export async function connectedForScreen() {
  const c = await storedConfig();
  return c ? redactConfig(c) : null;
}

/* ------------------------------------------------------------------- n8n */

function n8nBase() {
  const base = (process.env.N8N_BASE_URL || "").replace(/\/+$/, "");
  const key = process.env.N8N_API_KEY || "";
  return base && key ? { base, key } : null;
}

async function n8n<T>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  const n = n8nBase();
  if (!n) return { ok: false, status: 0, data: null };
  try {
    const r = await fetch(`${n.base}/api/v1${path}`, {
      method,
      headers: { "X-N8N-API-KEY": n.key, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(CEILING_MS),
      cache: "no-store",
    });
    const data = (await r.json().catch(() => null)) as T | null;
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

type RawWorkflow = { id: string; name: string; active: boolean; nodes: unknown[]; connections: unknown; settings: unknown };

async function ohmWorkflows(): Promise<RawWorkflow[] | null> {
  const r = await n8n<{ data: RawWorkflow[] }>("GET", "/workflows?limit=250");
  if (!r.ok || !r.data) return null;
  return r.data.data.filter((w) => w.name.startsWith("OHM Assistant"));
}

function shortName(name: string) {
  const i = name.lastIndexOf("— ");
  return i === -1 ? name : name.slice(i + 2);
}

function find(list: RawWorkflow[], wanted: string) {
  return list.find((w) => {
    const s = shortName(w.name);
    return s === wanted || s.startsWith(wanted + " ");
  });
}

async function createCredential(type: string, name: string, data: Record<string, unknown>) {
  const r = await n8n<{ id: string }>("POST", "/credentials", { name, type, data });
  return r.ok && r.data?.id ? r.data.id : null;
}

async function deleteCredential(id: string) {
  await n8n("DELETE", `/credentials/${encodeURIComponent(id)}`);
}

/** Switch a workflow on, by its short name. The Follow-up sender's button. */
export async function activateWorkflow(wanted: string): Promise<{ ok: boolean; message: string }> {
  const list = await ohmWorkflows();
  if (!list) return { ok: false, message: "Could not reach n8n, so nothing has changed." };
  const w = find(list, wanted);
  if (!w) return { ok: false, message: `The ${wanted} workflow is not on n8n.` };
  if (w.active) return { ok: true, message: `The ${wanted} workflow was already on.` };
  const r = await n8n("POST", `/workflows/${encodeURIComponent(w.id)}/activate`);
  return r.ok
    ? { ok: true, message: `The ${wanted} workflow is on.` }
    : { ok: false, message: `n8n refused to switch ${wanted} on (${r.status}). It usually means a credential in it is missing.` };
}

/* -------------------------------------------------------- provider tests */

async function testTwilio(v: Stored): Promise<string | null> {
  const auth = "Basic " + Buffer.from(`${v.accountSid}:${v.authToken}`).toString("base64");
  try {
    const a = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${v.accountSid}.json`, {
      headers: { Authorization: auth }, signal: AbortSignal.timeout(CEILING_MS), cache: "no-store",
    });
    if (a.status === 401) return "Twilio did not accept that Account SID and Auth Token.";
    if (!a.ok) return `Twilio answered ${a.status}.`;
    const n = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${v.accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(String(v.fromNumber))}`,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(CEILING_MS), cache: "no-store" },
    );
    const d = (await n.json().catch(() => null)) as { incoming_phone_numbers?: unknown[] } | null;
    if (!d?.incoming_phone_numbers?.length) return `The number ${v.fromNumber} is not on that Twilio account.`;
    return null;
  } catch {
    return "Could not reach Twilio to check the keys.";
  }
}

async function testMeta(v: Stored): Promise<{ why: string | null; pageName?: string }> {
  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(String(v.pageId))}?fields=id,name&access_token=${encodeURIComponent(String(v.pageToken))}`,
      { signal: AbortSignal.timeout(CEILING_MS), cache: "no-store" },
    );
    const d = (await r.json().catch(() => null)) as { id?: string; name?: string; error?: { message?: string } } | null;
    if (!r.ok || !d?.id) return { why: `Facebook did not accept that token for the Page${d?.error?.message ? `: ${d.error.message}` : "."}` };
    if (d.id !== String(v.pageId)) return { why: "That token belongs to a different Page." };
    return { why: null, pageName: d.name };
  } catch {
    return { why: "Could not reach Facebook to check the token." };
  }
}

/** An IMAP LOGIN over TLS, and nothing else: no mailbox is opened or read. */
function testImap(v: Stored): Promise<string | null> {
  const quote = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return new Promise((resolve) => {
    let buf = "", stage = 0, done = false;
    const finish = (why: string | null) => {
      if (done) return;
      done = true;
      try { sock.end(); } catch { /* closed */ }
      resolve(why);
    };
    const sock = tls.connect({ host: String(v.host), port: Number(v.port), servername: String(v.host) });
    sock.setTimeout(CEILING_MS, () => finish("The mail server did not answer in time."));
    sock.on("error", () => finish(`Could not connect to ${v.host} on port ${v.port}.`));
    sock.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      if (stage === 0 && /\r\n/.test(buf)) {
        stage = 1; buf = "";
        sock.write(`a1 LOGIN ${quote(String(v.user))} ${quote(String(v.password))}\r\n`);
      } else if (stage === 1) {
        if (/^a1 OK/m.test(buf)) { sock.write("a2 LOGOUT\r\n"); finish(null); }
        else if (/^a1 (NO|BAD)/m.test(buf)) finish("The mail server refused that login. For Gmail, use an app password.");
      }
    });
  });
}

async function testSmtp(v: Stored): Promise<string | null> {
  try {
    const t = nodemailer.createTransport({
      host: String(v.host), port: Number(v.port), secure: Number(v.port) === 465,
      auth: { user: String(v.user), pass: String(v.password) },
      connectionTimeout: CEILING_MS, greetingTimeout: CEILING_MS,
    });
    await t.verify();
    return null;
  } catch {
    return "The mail server refused that login. For Gmail, use an app password.";
  }
}

async function testBooking(v: Stored): Promise<string | null> {
  try {
    const d = new Date(Date.now() + 864e5);
    while (d.getUTCDay() % 6 === 0) d.setUTCDate(d.getUTCDate() + 1);
    const r = await fetch(String(v.url), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: v.secret, action: "freebusy", date: d.toISOString().slice(0, 10) }),
      signal: AbortSignal.timeout(CEILING_MS), cache: "no-store",
    });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; busy?: unknown } | null;
    if (!j?.ok || !Array.isArray(j.busy)) return "The script answered, but not with ok and a busy list. Check the secret.";
    return null;
  } catch {
    return "Could not reach the script at that URL.";
  }
}

/* --------------------------------------------------------------- connect */

const randomKey = (prefix: string) => prefix + randomBytes(24).toString("hex");

/**
 * Connect one channel. See the order at the top of this file.
 *
 * Reconnecting replaces the old values: the workflows are first put back to
 * their placeholders with the OLD stored values, then filled with the new,
 * so a second Connect never leaves a mixture.
 */
export async function connect(key: string, values: Record<string, unknown>, by: string, opts: { dryRun?: boolean } = {}): Promise<ConnectResult> {
  const dry = Boolean(opts.dryRun);
  const c = connector(key);
  if (!c) return { ok: false, message: "There is no such connection." };

  const check = validateConnector(key, values);
  if (!check.ok) return { ok: false, errors: check.errors, message: "Some of those values need fixing." };
  const v = check.clean as Stored;

  if (c.workflows.length && !n8nBase()) {
    return { ok: false, message: "The website has no N8N_BASE_URL and N8N_API_KEY, so it cannot change n8n." };
  }

  /* 2. The provider. */
  let pageName: string | undefined;
  const why =
    key === "twilio" ? await testTwilio(v)
    : key === "meta" ? await testMeta(v).then((r) => { pageName = r.pageName; return r.why; })
    : key === "imap" ? await testImap(v)
    : key === "smtp" ? await testSmtp(v)
    : key === "booking" ? await testBooking(v)
    : null;
  if (why) return { ok: false, message: why };

  const old = (await storedConfig())?.[key] ?? null;

  /* 3. What gets stored, making the n8n credential where there is one. In a
        dry run a stand-in id is used, so the patch can be worked out. */
  let stored: Stored;
  let madeCredential: string | null = null;
  const cred = async (type: string, name: string, data: Record<string, unknown>) => {
    if (dry) return `dry-run-${type}`;
    madeCredential = await createCredential(type, name, data);
    return madeCredential;
  };
  if (key === "twilio") {
    const id = await cred("twilioApi", CRED_NAMES.twilioApi, { authType: "authToken", accountSid: v.accountSid, authToken: v.authToken });
    if (!id) return { ok: false, message: "n8n would not save the Twilio credential, so nothing has changed." };
    stored = { credentialId: id, credentialName: CRED_NAMES.twilioApi, fromNumber: v.fromNumber, accountSidLast4: String(v.accountSid).slice(-4) };
  } else if (key === "meta") {
    stored = { pageId: v.pageId, pageName: pageName ?? "", pageToken: v.pageToken, appSecret: v.appSecret, verifyToken: String(old?.verifyToken || randomKey("omh_")) };
  } else if (key === "google_lead_form") {
    stored = { key: String(old?.key || randomKey("glf_")) };
  } else if (key === "imap") {
    const id = await cred("imap", CRED_NAMES.imap, { user: v.user, password: v.password, host: v.host, port: Number(v.port), secure: true });
    if (!id) return { ok: false, message: "n8n would not save the mailbox credential, so nothing has changed." };
    stored = { credentialId: id, credentialName: CRED_NAMES.imap, user: v.user, host: v.host };
  } else if (key === "smtp") {
    const name = "SMTP — OMH";
    const id = await cred("smtp", name, { user: v.user, password: v.password, host: v.host, port: Number(v.port), secure: Number(v.port) === 465 });
    if (!id) return { ok: false, message: "n8n would not save the mailbox credential, so nothing has changed." };
    stored = { credentialId: id, credentialName: name, from: v.from, host: v.host, user: v.user };
  } else {
    stored = { url: v.url, secret: v.secret };
  }

  /* 4. The workflows. */
  const results: WorkflowResult[] = [];
  if (c.workflows.length) {
    const list = await ohmWorkflows();
    if (!list) {
      if (madeCredential) await deleteCredential(madeCredential);
      return { ok: false, message: "Could not read the workflows from n8n, so nothing has changed." };
    }
    const rules: Rule[][] = old ? [rulesFor(key, old, true), rulesFor(key, stored)] : [rulesFor(key, stored)];
    for (const name of c.workflows) {
      const w = find(list, name);
      if (!w) { results.push({ workflow: name, changed: 0, saved: false, why: "not on n8n" }); continue; }
      let body: unknown = w;
      let changed = 0;
      for (const set of rules) {
        const p = patchWorkflow(body, set);
        body = { ...p.body, id: w.id };
        changed += p.changed;
      }
      if (dry || changed === 0) { results.push({ workflow: name, changed, saved: false, why: dry ? "dry run" : "nothing to change" }); continue; }
      const { id: _drop, ...put } = body as Record<string, unknown>;
      void _drop;
      const r = await n8n("PUT", `/workflows/${encodeURIComponent(w.id)}`, put);
      results.push({ workflow: name, changed, saved: r.ok, why: r.ok ? undefined : `n8n answered ${r.status}` });
    }
  }

  if (dry) {
    return { ok: true, dryRun: true, workflows: results, message: "Dry run: the provider accepted the values, and nothing was written." };
  }

  /* 5. Convex, so a rebuild keeps it. */
  const saved = await convex<{ ok: boolean }>("/integrations/save", { key, value: stored, by });
  const failed = results.filter((r) => !r.saved && r.why !== "nothing to change");
  if (old?.credentialId && madeCredential && old.credentialId !== madeCredential) await deleteCredential(String(old.credentialId));

  if (failed.length || !saved?.ok) {
    return {
      ok: false, workflows: results,
      message: `Connected only in part: ${[
        ...failed.map((f) => `${f.workflow} (${f.why})`),
        ...(!saved?.ok ? ["the record of it in the routing store"] : []),
      ].join(", ")}. The status above shows what is actually live.`,
    };
  }
  return { ok: true, workflows: results, message: `${c.label} is connected.` };
}

/** Undo a connection: placeholders back, the n8n credential deleted, the record cleared. */
export async function disconnect(key: string, by: string): Promise<ConnectResult> {
  const c = connector(key);
  if (!c) return { ok: false, message: "There is no such connection." };
  const old = (await storedConfig())?.[key];
  if (!old) return { ok: true, message: "It was not connected." };

  const results: WorkflowResult[] = [];
  if (c.workflows.length) {
    const list = await ohmWorkflows();
    if (!list) return { ok: false, message: "Could not read the workflows from n8n, so nothing has changed." };
    for (const name of c.workflows) {
      const w = find(list, name);
      if (!w) continue;
      const p = patchWorkflow(w, rulesFor(key, old, true));
      if (!p.changed) { results.push({ workflow: name, changed: 0, saved: false, why: "nothing to change" }); continue; }
      const r = await n8n("PUT", `/workflows/${encodeURIComponent(w.id)}`, p.body);
      results.push({ workflow: name, changed: p.changed, saved: r.ok, why: r.ok ? undefined : `n8n answered ${r.status}` });
    }
  }
  if (old.credentialId) await deleteCredential(String(old.credentialId));
  await convex("/integrations/clear", { key, by });
  return { ok: true, workflows: results, message: `${c.label} is disconnected.` };
}
