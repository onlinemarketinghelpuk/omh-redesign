/* =========================================================================
   The Brain and the outbound agent: their settings, and the one decision
   n8n asks for on every text reply.

   Both live as rows in `settings` (keys "brain" and "agent"), checked by the
   gates on every write. Absent means the defaults, which are exactly what
   the system did before either existed: the assistant answers every reply,
   and no number means no outbound call is placed.

   routing.ts imports `agentSettings` from here; nothing here imports
   routing.ts, so there is no cycle (see convex/limits.ts for why that
   matters in Convex).
   ========================================================================= */

import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { decideReply, validateBrain, salesBrief, DEFAULT_SALES, type Brain } from "../gates/brain.js";
import { DEFAULT_AGENT, validateAgent, normaliseNumber, type Agent } from "../gates/agent.js";
import { isOn } from "../gates/integrations.js";
import { channelSwitchMap, enrolmentChannel } from "./channelSwitch";

async function row(ctx: QueryCtx, key: string) {
  return await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", key)).unique();
}

async function put(ctx: MutationCtx, key: string, value: unknown, by?: string) {
  const r = await row(ctx, key);
  const now = Date.now();
  if (r) await ctx.db.patch(r._id, { value, updatedAt: now, updatedBy: by });
  else await ctx.db.insert("settings", { key, value, updatedAt: now, updatedBy: by });
}

/* ------------------------------------------------------------------ brain */

export async function brainSettings(ctx: QueryCtx): Promise<Brain & { sales: typeof DEFAULT_SALES; updatedAt: number | null; updatedBy: string | null }> {
  const r = await row(ctx, "brain");
  const v = (r?.value ?? {}) as Partial<Brain>;
  return {
    enabled: v.enabled !== false,
    policies: v.policies ?? {},
    sales: { ...DEFAULT_SALES, ...(v.sales ?? {}) },
    updatedAt: r?.updatedAt ?? null,
    updatedBy: r?.updatedBy ?? null,
  };
}

export const getBrain = query({ args: {}, handler: async (ctx) => await brainSettings(ctx) });

export const setBrain = mutation({
  args: {
    enabled: v.boolean(),
    policies: v.record(v.string(), v.string()),
    sales: v.optional(v.object({ goal: v.string(), offer: v.string(), notes: v.string() })),
    by: v.optional(v.string()),
  },
  handler: async (ctx, { enabled, policies, sales, by }) => {
    const current = await brainSettings(ctx);
    const value = { enabled, policies, sales: sales ?? current.sales };
    const check = validateBrain(value);
    if (!check.ok) return { ok: false as const, errors: check.errors };
    await put(ctx, "brain", value, by);
    return { ok: true as const };
  },
});

/**
 * What happens to a text reply. Called by 09-twilio-inbound after the reply
 * is logged and the follow-up stopped.
 *
 * A query: it decides and returns, and n8n does what it says. The hand-over
 * itself is the existing /handover/request, so a reply handed over lands in
 * Needs a person exactly as a chat hand-over does.
 */
export const decide = query({
  args: {
    leadId: v.optional(v.id("leads")),
    text: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, text, channel }) => {
    const brain = await brainSettings(ctx);
    const lead = leadId ? await ctx.db.get(leadId as Id<"leads">) : null;
    const ch = channel ?? lead?.sourceChannel ?? "unknown";
    /* The channel's switch. For a lead, the channel it counts under (its
       source, or reactivation for a route F lead), the same rule enrol uses. */
    const seq = lead
      ? await ctx.db.query("sequences").withIndex("by_lead", (q) => q.eq("leadId", lead._id)).order("desc").first()
      : null;
    const switchChannel = lead ? enrolmentChannel(lead, seq?.route ?? "") : ch;
    const channelOn = isOn(await channelSwitchMap(ctx), switchChannel);
    const d = decideReply({ brain, channel: ch, text, channelOn });
    return {
      ...d,
      sessionId: lead?.sessionId ?? null,
      /* Only when the assistant is to answer: the sales brief it answers
         with. Built here so the chat workflow has nothing to look up. */
      brief: d.answer ? salesBrief({ brain, channel: ch, lead: { name: lead?.name, service: lead?.service } }) : null,
    };
  },
});

/* ------------------------------------------------------------------ agent */

export async function agentSettings(ctx: QueryCtx): Promise<Agent & { updatedAt: number | null; updatedBy: string | null }> {
  const r = await row(ctx, "agent");
  const v = (r?.value ?? {}) as Partial<Agent>;
  return { ...DEFAULT_AGENT, ...v, updatedAt: r?.updatedAt ?? null, updatedBy: r?.updatedBy ?? null };
}

export const getAgent = query({ args: {}, handler: async (ctx) => await agentSettings(ctx) });

export const setAgent = mutation({
  args: {
    fromNumber: v.string(),
    days: v.array(v.number()),
    start: v.number(),
    end: v.number(),
    opening: v.string(),
    goal: v.string(),
    by: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const check = validateAgent(a);
    if (!check.ok) return { ok: false as const, errors: check.errors };
    const value: Agent = {
      fromNumber: normaliseNumber(a.fromNumber),
      days: [...new Set(a.days)].sort(),
      start: a.start,
      end: a.end,
      opening: a.opening.trim(),
      goal: a.goal.trim(),
    };
    await put(ctx, "agent", value, a.by);
    return { ok: true as const, fromNumber: value.fromNumber };
  },
});
