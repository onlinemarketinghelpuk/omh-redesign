/* =========================================================================
   What the engine needs from the Control Panel, and nothing else.

   A separate file so that routing.ts and flows.ts can both import it
   without importing each other. An import cycle in Convex does not fail
   loudly (see convex/limits.ts for the last time it cost an afternoon).

   One rule runs through all of it: THE STORED ROW IS NOT TRUSTED. A flow is
   recompiled from its nodes and its triggers every time the engine reads
   it, by the same gate that refused it on save. The `compiled` field on a
   version is a record of what was saved, never something that is run, and
   the `basis` on a row is never read. So a row that reached the store round
   the validator, by an import, a migration or a bug, is refused here
   instead of dialled.
   ========================================================================= */

import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ROUTES, type RouteId, type RouteLike } from "../gates/routes";
import { compileFlow, canonicalTrigger, defaultRouteFor } from "../gates/flows.js";
import { renderMessage } from "../gates/message-text.js";
import { renderWith, templateKeys, messageChannel, type RenderContext } from "../gates/templates";

const isRoute = (s: string): s is RouteId =>
  Object.prototype.hasOwnProperty.call(ROUTES, s);

export type Resolved =
  | { ok: true; def: RouteLike; marketing: boolean; flowId?: Id<"flows">; flowVersion?: number }
  | { ok: false; why: string };

/** Compile a stored flow or version, or say why it must not run. */
export function compileStored(row: { name: string; triggers: string[]; nodes: unknown[] }):
  { ok: true; def: RouteLike } | { ok: false; why: string } {
  try {
    const def = compileFlow({ name: row.name, triggers: row.triggers, nodes: row.nodes }) as RouteLike;
    return { ok: true, def };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    return { ok: false, why: msg.includes("PECR") ? "marketing_call" : "invalid_flow" };
  }
}

/** The live flow for a channel, if the owner has switched one on. */
export async function liveFlowFor(ctx: QueryCtx, trigger: string): Promise<Doc<"flows"> | null> {
  const live = await ctx.db
    .query("flows")
    .withIndex("by_status", (q) => q.eq("status", "live"))
    .collect();
  /* The newest wins if two ever share a channel. saveFlow refuses that, so
     this is the answer to a state that should not exist, chosen so it is at
     least predictable. */
  const hits = live.filter((f) => f.triggers.includes(trigger));
  hits.sort((a, b) => b.updatedAt - a.updatedAt);
  return hits[0] ?? null;
}

export async function versionRow(ctx: QueryCtx, flowId: Id<"flows">, version: number) {
  return await ctx.db
    .query("flowVersions")
    .withIndex("by_flow_version", (q) => q.eq("flowId", flowId).eq("version", version))
    .unique();
}

/**
 * Which route a new enrolment runs.
 *
 * A live flow replaces a channel's DEFAULT route, and only that: when the
 * caller asked for the route the router would have picked for this lead's
 * channel. A caller that asked for something else on purpose (G for a
 * no-show, H for a reminder) is obeyed.
 */
export async function routeForEnrolment(
  ctx: QueryCtx,
  lead: Doc<"leads">,
  route: RouteId,
): Promise<Resolved & { flowRefused?: string }> {
  const code: Resolved = { ok: true, def: ROUTES[route], marketing: ROUTES[route].marketing };
  const trigger = canonicalTrigger(lead.sourceChannel);
  if (defaultRouteFor(trigger) !== route) return code;

  const flow = await liveFlowFor(ctx, trigger);
  if (!flow) return code;

  const c = compileStored(flow);
  /* Fail closed onto the code's route, which is the system's own legal
     default, and say so, so the router's log shows it. */
  if (!c.ok) return { ...code, flowRefused: c.why };

  /* The stricter of the two. They agree by construction (a channel's basis
     and its default route's marketing flag are asserted equal), and this is
     what holds if they ever do not. */
  const marketing = c.def.marketing || ROUTES[route].marketing;
  return { ok: true, def: { ...c.def, marketing }, marketing, flowId: flow._id, flowVersion: flow.version };
}

/** Which route an existing sequence runs: the version it started on. */
export async function routeForSequence(ctx: QueryCtx, seq: Doc<"sequences">): Promise<Resolved> {
  if (!isRoute(seq.route)) return { ok: false, why: "unknown_route" };
  if (!seq.flowId || seq.flowVersion === undefined) {
    return { ok: true, def: ROUTES[seq.route], marketing: ROUTES[seq.route].marketing };
  }
  const row = await versionRow(ctx, seq.flowId, seq.flowVersion);
  if (!row) return { ok: false, why: "flow_missing" };
  const c = compileStored(row);
  if (!c.ok) return { ok: false, why: "flow_refused" };
  const marketing = c.def.marketing || ROUTES[seq.route].marketing;
  return { ok: true, def: { ...c.def, marketing }, marketing, flowId: seq.flowId, flowVersion: seq.flowVersion };
}

/**
 * One message, in the owner's words if they wrote some, else the code's.
 *
 * The opt-out is decided by `marketing`, which comes from the route or
 * flow, never from the message row.
 */
export async function renderStep(
  ctx: QueryCtx,
  key: string,
  c: RenderContext,
  marketing: boolean,
): Promise<{ subject?: string; body: string }> {
  const stored = await ctx.db
    .query("messageTemplates")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (stored) return renderMessage(stored, c, marketing);
  return renderWith(key, c, marketing);
}

/** Every message that exists, `{ key: channel }`, for the flow validator. */
export async function messageMap(ctx: QueryCtx): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const k of templateKeys()) out[k] = messageChannel(k);
  for (const m of await ctx.db.query("messageTemplates").collect()) out[m.key] = m.channel;
  return out;
}
