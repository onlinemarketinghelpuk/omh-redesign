/* =========================================================================
   What has been connected from the dashboard (plan 015).

   One settings row, key "integrations": { [connector]: { ...values, at, by } }.

   It holds what Connect made or was given that has to outlive the request:
   an n8n credential's id, a Twilio number, the Meta tokens (which cannot be
   n8n credentials, because the Meta workflow uses them in a Code node), a
   generated Google key, the booking script. It never holds a Twilio auth
   token or a mailbox password: those went into an n8n credential, and only
   that credential's id comes back here.

   Read through the secret-checked HTTP route by the dashboard SERVER and by
   build-workflows.py. Nothing here goes to a browser as it is: the dashboard
   redacts with redactConfig() first, and the suite holds it to that.
   ========================================================================= */

import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { connector } from "../gates/connectors.js";

const KEY = "integrations";

async function row(ctx: QueryCtx) {
  return await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", KEY))
    .unique();
}

type Config = Record<string, Record<string, string | number>>;

export const getIntegrations = query({
  args: {},
  handler: async (ctx) => {
    const r = await row(ctx);
    return { config: ((r?.value ?? {}) as Config), updatedAt: r?.updatedAt ?? null };
  },
});

/** Text and numbers only: nothing a query could be smuggled through, nothing huge. */
function cleanValue(value: unknown): Record<string, string | number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string | number> = {};
  for (const [k, x] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(k)) return null;
    if (typeof x === "string" && x.length <= 2000) out[k] = x;
    else if (typeof x === "number" && Number.isFinite(x)) out[k] = x;
    else return null;
  }
  return out;
}

export const saveIntegration = mutation({
  args: { key: v.string(), value: v.any(), by: v.optional(v.string()) },
  handler: async (ctx, { key, value, by }) => {
    if (!connector(key)) return { ok: false as const, why: "unknown_connector" };
    const clean = cleanValue(value);
    if (!clean) return { ok: false as const, why: "bad_value" };
    const r = await row(ctx);
    const at = Date.now();
    const config = { ...((r?.value ?? {}) as Config), [key]: { ...clean, at, by: by ?? "" } };
    if (r) await ctx.db.patch(r._id, { value: config, updatedAt: at, updatedBy: by });
    else await ctx.db.insert("settings", { key: KEY, value: config, updatedAt: at, updatedBy: by });
    return { ok: true as const, at };
  },
});

export const clearIntegration = mutation({
  args: { key: v.string(), by: v.optional(v.string()) },
  handler: async (ctx, { key, by }) => {
    const r = await row(ctx);
    if (!r) return { ok: true as const };
    const config = { ...((r.value ?? {}) as Config) };
    delete config[key];
    await ctx.db.patch(r._id, { value: config, updatedAt: Date.now(), updatedBy: by });
    return { ok: true as const };
  },
});
