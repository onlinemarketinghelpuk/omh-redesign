/* =========================================================================
   The Control Panel's store: flows and messages, saved by the owner.

   Every write here is checked by the same gates the dashboard checks with
   while the owner types (gates/flows.js, gates/message-text.js). The
   dashboard's check is a convenience. THIS one is the refusal: it runs on
   every save whatever produced the request, and it derives the legal basis
   itself. There is no argument that sets the basis, and an extra field in
   the request is ignored.

   Raw facts out, as everywhere in this deployment: the dashboard decides
   how to show them.
   ========================================================================= */

import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { validateFlow, compileFlow } from "../gates/flows.js";
import { validateMessage } from "../gates/message-text.js";
import { templateKeys, messageChannel } from "../gates/templates";
import { ROUTES } from "../gates/routes";
import { messageMap } from "./flowRuntime";

const node = v.any();

/* ------------------------------------------------------------------ flows */

export const listFlows = query({
  args: {},
  handler: async (ctx) => {
    const flows = await ctx.db.query("flows").collect();
    return {
      flows: flows.map((f) => ({
        id: f._id,
        name: f.name,
        basis: f.basis,
        triggers: f.triggers,
        nodes: f.nodes,
        status: f.status,
        version: f.version,
        updatedAt: f.updatedAt,
        updatedBy: f.updatedBy ?? null,
      })),
    };
  },
});

export const getFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    const f = await ctx.db.get(flowId);
    if (!f) return null;
    return {
      id: f._id, name: f.name, basis: f.basis, triggers: f.triggers, nodes: f.nodes,
      status: f.status, version: f.version, updatedAt: f.updatedAt, updatedBy: f.updatedBy ?? null,
    };
  },
});

export const flowHistory = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, { flowId }) => {
    const rows = await ctx.db
      .query("flowVersions")
      .withIndex("by_flow_version", (q) => q.eq("flowId", flowId))
      .collect();
    rows.sort((a, b) => b.version - a.version);
    return {
      versions: rows.map((r) => ({
        version: r.version, name: r.name, triggers: r.triggers, nodes: r.nodes,
        status: r.status, at: r.at, by: r.by ?? null,
      })),
    };
  },
});

/** Live flows, other than this one, that already serve any of these channels. */
async function conflicts(ctx: MutationCtx, triggers: string[], self?: Id<"flows">) {
  const live = await ctx.db
    .query("flows")
    .withIndex("by_status", (q) => q.eq("status", "live"))
    .collect();
  return live
    .filter((f) => f._id !== self)
    .map((f) => ({ f, shared: f.triggers.filter((t) => triggers.includes(t)) }))
    .filter((x) => x.shared.length > 0);
}

/**
 * Write a new version of a flow: the row, and the append-only copy.
 * Refusal is decided by the caller; this only writes.
 */
async function writeVersion(
  ctx: MutationCtx,
  existing: Doc<"flows"> | null,
  f: { name: string; triggers: string[]; nodes: unknown[] },
  basis: string,
  status: string,
  ok: boolean,
  by?: string,
) {
  const now = Date.now();
  const version = existing ? existing.version + 1 : 1;
  let flowId: Id<"flows">;
  if (existing) {
    await ctx.db.patch(existing._id, {
      name: f.name, basis, triggers: f.triggers, nodes: f.nodes, status, version,
      updatedAt: now, updatedBy: by,
    });
    flowId = existing._id;
  } else {
    flowId = await ctx.db.insert("flows", {
      name: f.name, basis, triggers: f.triggers, nodes: f.nodes, status, version,
      updatedAt: now, updatedBy: by,
    });
  }
  await ctx.db.insert("flowVersions", {
    flowId, version, name: f.name, basis, triggers: f.triggers, nodes: f.nodes,
    compiled: ok ? compileFlow(f) : undefined,
    status, at: now, by,
  });
  return { flowId, version };
}

async function pauseConflicts(ctx: MutationCtx, clash: Awaited<ReturnType<typeof conflicts>>, by?: string) {
  for (const { f } of clash) {
    await ctx.db.patch(f._id, { status: "paused", updatedAt: Date.now(), updatedBy: by });
  }
}

const clashReport = (clash: Awaited<ReturnType<typeof conflicts>>) =>
  clash.map((x) => ({ id: x.f._id, name: x.f.name, triggers: x.shared }));

/**
 * Save a flow, as a draft or live.
 *
 * Refuses, writing nothing, when:
 *   - the flow breaks a rule that no state may break (the PECR rule above
 *     all): `why: "invalid"`, with every error in words
 *   - it is to be live and is unfinished: `why: "not_ready"`
 *   - it is to be live and another live flow already serves one of its
 *     channels, and `replace` was not given: `why: "trigger_taken"`, with
 *     the flows it would replace. Two live flows on one channel is two
 *     texts from one business in one hour.
 */
export const saveFlow = mutation({
  args: {
    flowId: v.optional(v.id("flows")),
    name: v.string(),
    triggers: v.array(v.string()),
    nodes: v.array(node),
    live: v.optional(v.boolean()),
    replace: v.optional(v.boolean()),
    by: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const existing = a.flowId ? await ctx.db.get(a.flowId) : null;
    if (a.flowId && !existing) return { ok: false as const, why: "no_such_flow" };

    /* Only these three fields are judged and stored. Anything else in the
       request, a `basis` or a `marketing` above all, is not read. */
    const f = { name: a.name.trim(), triggers: a.triggers, nodes: a.nodes };
    const check = validateFlow(f, { messages: await messageMap(ctx) });
    if (!check.canSaveDraft) return { ok: false as const, why: "invalid", errors: check.errors };

    const status = a.live === true ? "live" : a.live === false ? "draft" : existing?.status ?? "draft";
    if (status === "live" && !check.ok) {
      return { ok: false as const, why: "not_ready", errors: check.errors };
    }
    if (status === "live") {
      const clash = await conflicts(ctx, f.triggers, existing?._id);
      if (clash.length && a.replace !== true) {
        return { ok: false as const, why: "trigger_taken", conflicts: clashReport(clash) };
      }
      await pauseConflicts(ctx, clash, a.by);
    }

    const w = await writeVersion(ctx, existing, f, check.basis!, status, check.ok, a.by);
    return { ok: true as const, ...w, status, basis: check.basis, warnings: check.warnings };
  },
});

/**
 * Switch a flow on, pause it, or return it to draft.
 *
 * Going live re-validates the STORED row, not a cached verdict: if the row
 * was changed outside saveFlow, this is where that is caught.
 */
export const setFlowStatus = mutation({
  args: {
    flowId: v.id("flows"),
    status: v.string(),
    replace: v.optional(v.boolean()),
    by: v.optional(v.string()),
  },
  handler: async (ctx, { flowId, status, replace, by }) => {
    if (!["live", "paused", "draft"].includes(status)) return { ok: false as const, why: "bad_status" };
    const flow = await ctx.db.get(flowId);
    if (!flow) return { ok: false as const, why: "no_such_flow" };

    if (status !== "live") {
      await ctx.db.patch(flowId, { status, updatedAt: Date.now(), updatedBy: by });
      return { ok: true as const, status, version: flow.version };
    }

    const f = { name: flow.name, triggers: flow.triggers, nodes: flow.nodes };
    const check = validateFlow(f, { messages: await messageMap(ctx) });
    if (!check.ok) {
      return { ok: false as const, why: check.canSaveDraft ? "not_ready" : "invalid", errors: check.errors };
    }
    const clash = await conflicts(ctx, flow.triggers, flowId);
    if (clash.length && replace !== true) {
      return { ok: false as const, why: "trigger_taken", conflicts: clashReport(clash) };
    }
    await pauseConflicts(ctx, clash, by);

    /* A version that was saved as an unfinished draft has nothing compiled
       to run, so switching it on writes a new version that has. Otherwise
       the version is unchanged: switching on is not an edit. */
    const row = await ctx.db
      .query("flowVersions")
      .withIndex("by_flow_version", (q) => q.eq("flowId", flowId).eq("version", flow.version))
      .unique();
    if (!row || !row.compiled) {
      const w = await writeVersion(ctx, flow, f, check.basis!, "live", true, by);
      return { ok: true as const, status: "live", version: w.version };
    }
    await ctx.db.patch(flowId, { status: "live", updatedAt: Date.now(), updatedBy: by });
    return { ok: true as const, status: "live", version: flow.version };
  },
});

/* --------------------------------------------------------------- messages */

/** The owner's overrides and the recent history. The code's messages the
    dashboard reads from gates/templates.ts itself. */
export const listMessages = query({
  args: { historyLimit: v.optional(v.number()) },
  handler: async (ctx, { historyLimit }) => {
    const rows = await ctx.db.query("messageTemplates").collect();
    const history = await ctx.db.query("messageHistory").order("desc").take(Math.min(historyLimit ?? 200, 500));
    return {
      messages: rows.map((m) => ({
        key: m.key, channel: m.channel, subject: m.subject ?? null, body: m.body,
        updatedAt: m.updatedAt, updatedBy: m.updatedBy ?? null,
      })),
      history: history.map((h) => ({
        key: h.key, action: h.action, channel: h.channel, subject: h.subject ?? null,
        body: h.body ?? null, at: h.at, by: h.by ?? null,
      })),
    };
  },
});

/** Is this key sent by anything marketing: route F, or a marketing flow? */
async function sentAsMarketing(ctx: MutationCtx, key: string): Promise<boolean> {
  for (const r of Object.values(ROUTES)) {
    if (r.marketing && [...r.immediate, ...r.steps].some((s) => s.key === key)) return true;
  }
  const flows = await ctx.db.query("flows").collect();
  return flows.some((f) => f.basis === "we_are_contacting_them" &&
    f.nodes.some((n: any) => n && n.type === "send" && n.message === key));
}

export const saveMessage = mutation({
  args: {
    key: v.string(),
    channel: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    by: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    /* A message the code sends keeps its channel: the routes that send it
       were built for a text or for an email, and a text that became an
       email under them would arrive with no subject on a phone that cannot
       show it. Write a new message instead. */
    const inCode = templateKeys().includes(a.key);
    if (inCode && messageChannel(a.key) !== a.channel) {
      return { ok: false as const, why: "channel_fixed", errors: [{ code: "channel_fixed",
        message: "This message is sent as " + messageChannel(a.key) + " by the flows that use it. Write a new message for another channel." }] };
    }
    const marketing = await sentAsMarketing(ctx, a.key);
    const check = validateMessage(a, { marketing });
    if (!check.ok) return { ok: false as const, why: "invalid", errors: check.errors };

    const now = Date.now();
    const subject = a.channel === "email" ? a.subject?.trim() : undefined;
    const existing = await ctx.db
      .query("messageTemplates")
      .withIndex("by_key", (q) => q.eq("key", a.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { channel: a.channel, subject, body: a.body, updatedAt: now, updatedBy: a.by });
    } else {
      await ctx.db.insert("messageTemplates", { key: a.key, channel: a.channel, subject, body: a.body, updatedAt: now, updatedBy: a.by });
    }
    await ctx.db.insert("messageHistory", { key: a.key, action: "saved", channel: a.channel, subject, body: a.body, at: now, by: a.by });
    return { ok: true as const, warnings: check.warnings };
  },
});

/**
 * Remove the owner's words: a code message goes back to the code's. A
 * message only the owner wrote is deleted, unless a live flow sends it,
 * because then a step would be left with nothing to send.
 */
export const resetMessage = mutation({
  args: { key: v.string(), by: v.optional(v.string()) },
  handler: async (ctx, { key, by }) => {
    const row = await ctx.db
      .query("messageTemplates")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!row) return { ok: false as const, why: "no_override" };
    if (!templateKeys().includes(key)) {
      const live = await ctx.db.query("flows").withIndex("by_status", (q) => q.eq("status", "live")).collect();
      const users = live.filter((f) => f.nodes.some((n: any) => n && n.type === "send" && n.message === key));
      if (users.length) return { ok: false as const, why: "in_use", flows: users.map((f) => f.name) };
    }
    await ctx.db.delete(row._id);
    await ctx.db.insert("messageHistory", { key, action: "reset", channel: row.channel, at: Date.now(), by });
    return { ok: true as const };
  },
});
