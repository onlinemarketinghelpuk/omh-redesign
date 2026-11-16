import "server-only";

/* =========================================================================
   The facts behind the Integrations screen, gathered once per request.

   Nothing here decides a status. It asks the four things that know, in
   parallel, each with a ceiling, and hands what they said to
   widget/gates/integrations.js, which does the deciding (and is what the
   tests hold to account):

     n8n      GET /api/v1/workflows   the OHM workflows as deployed
     Retell   POST /v2/list-agents, GET /v2/list-phone-numbers
     Convex   the outbound number, and the per-channel switches
     Google   the booking script's read-only "freebusy" call

   Every one of them can fail, and a failure is reported as "could not
   check" with the reason, never as connected. Nothing here writes: the only
   write on this screen is the switch, and that goes through Convex.

   All server side. The n8n and Retell keys never reach a browser.
   ========================================================================= */

import { workflowFacts } from "@/widget/gates/integrations.js";
import { getAgent, getChannelSwitches } from "./routing";

/** No single check may hold the page up for longer than this. */
const CEILING_MS = 8_000;

type Checked = { checked: true } | { checked: false; why: string };

export type Facts = {
  n8n: Checked & { workflows?: ReturnType<typeof workflowFacts>[] };
  retell: Checked & { agents?: string[]; numbers?: string[] };
  env: { leadRouterUrl: boolean };
  agent: Checked & { fromNumber?: string };
  booking: Checked & { ok?: boolean; why?: string };
};

export type Switches = { known: boolean; switches: Record<string, boolean>; updatedAt: number | null; updatedBy: string | null };

function why(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/abort|timeout/i.test(m)) return `no answer within ${CEILING_MS / 1000} seconds`;
  return m.slice(0, 140);
}

/* ------------------------------------------------------------------ n8n */

async function n8n(): Promise<Facts["n8n"]> {
  const base = (process.env.N8N_BASE_URL || "").replace(/\/+$/, "");
  const key = process.env.N8N_API_KEY || "";
  /* The website has never needed n8n's key before. Until it is given one,
     every n8n-backed row says so, rather than pretending to know. */
  if (!base || !key) {
    return { checked: false, why: "the website has no N8N_BASE_URL and N8N_API_KEY to read n8n with" };
  }
  try {
    const all: unknown[] = [];
    let cursor = "";
    for (let page = 0; page < 5; page++) {
      const u = `${base}/api/v1/workflows?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const r = await fetch(u, {
        headers: { "X-N8N-API-KEY": key, accept: "application/json" },
        signal: AbortSignal.timeout(CEILING_MS),
        cache: "no-store",
      });
      if (!r.ok) return { checked: false, why: `n8n answered ${r.status}` };
      const d = (await r.json()) as { data?: unknown[]; nextCursor?: string | null };
      all.push(...(d.data ?? []));
      if (!d.nextCursor) break;
      cursor = d.nextCursor;
    }
    const workflows = all
      .map((w) => workflowFacts(w))
      .filter((w) => w.name.startsWith("OHM Assistant"));
    return { checked: true, workflows };
  } catch (e) {
    return { checked: false, why: why(e) };
  }
}

/* --------------------------------------------------------------- Retell */

async function retell(): Promise<Facts["retell"]> {
  const key = process.env.RETELL_API_KEY || "";
  if (!key) return { checked: false, why: "the website has no RETELL_API_KEY" };
  const h = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  try {
    /* The legacy GET /list-agents was retired on 2026-07-31 and now answers
       400; the v2 list is a POST. Read on 2026-11-16. */
    const [a, n] = await Promise.all([
      fetch("https://api.retellai.com/v2/list-agents", {
        method: "POST", headers: h, body: JSON.stringify({ limit: 1000 }),
        signal: AbortSignal.timeout(CEILING_MS), cache: "no-store",
      }),
      fetch("https://api.retellai.com/v2/list-phone-numbers", {
        headers: h, signal: AbortSignal.timeout(CEILING_MS), cache: "no-store",
      }),
    ]);
    if (!a.ok) return { checked: false, why: `Retell answered ${a.status} for the agent list` };
    if (!n.ok) return { checked: false, why: `Retell answered ${n.status} for the phone numbers` };
    const agents = ((await a.json()) as { items?: { agent_name?: string }[] }).items ?? [];
    const numbers = ((await n.json()) as { items?: { phone_number?: string }[] }).items ?? [];
    return {
      checked: true,
      agents: [...new Set(agents.map((x) => x.agent_name || "").filter(Boolean))],
      numbers: numbers.map((x) => x.phone_number || "").filter(Boolean),
    };
  } catch (e) {
    return { checked: false, why: why(e) };
  }
}

/* --------------------------------------------------------------- Convex */

async function agent(): Promise<Facts["agent"]> {
  const a = await getAgent();
  if (!a) return { checked: false, why: "Convex did not answer, or the website has no OHM_WIDGET_SECRET" };
  return { checked: true, fromNumber: a.fromNumber || "" };
}

export async function switches(): Promise<Switches> {
  const s = await getChannelSwitches();
  if (!s) return { known: false, switches: {}, updatedAt: null, updatedBy: null };
  return { known: true, switches: s.switches, updatedAt: s.updatedAt, updatedBy: s.updatedBy };
}

/* --------------------------------------------------------------- Google */

/** The next weekday, as the booking script expects a date: YYYY-MM-DD. */
function nextWeekday(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 12));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function booking(): Promise<Facts["booking"]> {
  const webhook = process.env.GOOGLE_BOOKING_WEBHOOK;
  const secret = process.env.GOOGLE_BOOKING_SECRET;
  /* Not set is a definite answer, not an unknown one. */
  if (!webhook || !secret) {
    return { checked: true, ok: false, why: "GOOGLE_BOOKING_WEBHOOK and GOOGLE_BOOKING_SECRET are not set on the website" };
  }
  try {
    /* The same read-only call /api/book-demo makes to offer free times. It
       reads the diary and writes nothing. */
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "freebusy", date: nextWeekday() }),
      signal: AbortSignal.timeout(CEILING_MS),
      cache: "no-store",
    });
    const d = (await r.json().catch(() => null)) as { ok?: boolean; busy?: unknown } | null;
    if (!d?.ok) return { checked: true, ok: false, why: "The booking script did not answer with ok" };
    if (!Array.isArray(d.busy)) return { checked: true, ok: false, why: "The booking script answered without its list of busy times" };
    return { checked: true, ok: true };
  } catch (e) {
    return { checked: false, why: why(e) };
  }
}

/* ------------------------------------------------------------------ all */

/** Everything the screen needs, asked in parallel. Never throws. */
export async function gatherFacts(): Promise<Facts> {
  const [w, r, a, b] = await Promise.all([n8n(), retell(), agent(), booking()]);
  return {
    n8n: w,
    retell: r,
    env: { leadRouterUrl: Boolean(process.env.OHM_LEAD_ROUTER_URL) },
    agent: a,
    booking: b,
  };
}
