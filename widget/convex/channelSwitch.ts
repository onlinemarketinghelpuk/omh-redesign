/* =========================================================================
   The per-channel switch, read by everything that has to obey it.

   Its own module rather than a part of routing.ts because brain.ts needs it
   too, and routing.ts already imports brain.ts. Importing back would be a
   cycle, and in Convex a cycle does not fail loudly: it surfaces as
   `v.optional(undefined)` naming neither file. So this imports nothing from
   either of them.

   Stored as { [channel]: false } under settings key "channelSwitch". A
   channel absent from it is ON.
   ========================================================================= */

import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { canonicalTrigger } from "../gates/flows.js";

export const CHANNEL_SWITCH = "channelSwitch";

/** Why a sequence the switch paused is paused, so switching back on resumes only those. */
export const CHANNEL_OFF = "channel_off";

export async function channelSwitchRow(ctx: QueryCtx) {
  return await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", CHANNEL_SWITCH))
    .unique();
}

export async function channelSwitchMap(ctx: QueryCtx): Promise<Record<string, boolean>> {
  const row = await channelSwitchRow(ctx);
  const v = (row?.value ?? {}) as Record<string, unknown>;
  const out: Record<string, boolean> = {};
  for (const [k, on] of Object.entries(v)) if (on === false) out[k] = false;
  return out;
}

/** The channel a lead or a sequence counts under, for its switch. */
export function enrolmentChannel(lead: Doc<"leads">, route: string): string {
  /* A reactivation campaign is the reactivation channel, whatever page the
     person first came in on two years ago. */
  if (route === "F") return "reactivation";
  return canonicalTrigger(lead.sourceChannel);
}
