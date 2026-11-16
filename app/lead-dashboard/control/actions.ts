"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite } from "@/lib/dashboard/auth";
import * as routing from "@/lib/dashboard/routing";
import { draftFromDefault } from "@/lib/dashboard/control-panel";
import type { SaveFlowResult } from "@/lib/dashboard/routing";

/* =========================================================================
   Writes from the Control Panel and the Flow Builder.

   The password is checked here as well as in proxy.ts: a server action is a
   POST endpoint of its own. The rules are checked in Convex, and its verdict
   comes back unchanged, so what the owner reads is the server's own reason,
   not a paraphrase of it.
   ========================================================================= */

const UNREACHABLE = "Could not reach the routing store, so nothing has changed.";

function refresh(flowId?: string) {
  revalidatePath("/lead-dashboard/control");
  revalidatePath("/lead-dashboard/sequences");
  revalidatePath("/lead-dashboard/messages");
  if (flowId) revalidatePath(`/lead-dashboard/flows/${flowId}`);
}

export type FlowActionResult = SaveFlowResult | { ok: false; why: "auth" | "unreachable"; message: string };

export async function saveFlowAction(input: {
  flowId?: string;
  name: string;
  triggers: string[];
  nodes: unknown[];
  live?: boolean;
  replace?: boolean;
}): Promise<FlowActionResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, why: "auth", message: auth.why };
  /* Only these fields are sent. The basis is not one of them, because the
     server derives it and would ignore it anyway. */
  const r = await routing.saveFlow({
    flowId: input.flowId,
    name: input.name,
    triggers: input.triggers,
    nodes: input.nodes,
    live: input.live,
    replace: input.replace,
    by: auth.who,
  });
  if (!r) return { ok: false, why: "unreachable", message: UNREACHABLE };
  if (r.ok) refresh(r.flowId);
  return r;
}

export async function setFlowStatusAction(
  flowId: string,
  status: "live" | "paused" | "draft",
  replace?: boolean,
): Promise<FlowActionResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, why: "auth", message: auth.why };
  const r = await routing.setFlowStatus(flowId, status, replace, auth.who);
  if (!r) return { ok: false, why: "unreachable", message: UNREACHABLE };
  if (r.ok) refresh(flowId);
  return r;
}

/**
 * Turn a channel's route from code into a draft flow the owner can edit,
 * for the builder to open. Nothing changes for any lead until that draft is switched on.
 */
export async function makeEditableAction(
  channel: string,
): Promise<{ ok: true; flowId: string; message?: string } | { ok: false; message: string }> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const flows = await routing.getFlows();
  if (!flows) return { ok: false, message: UNREACHABLE };
  const d = draftFromDefault(channel, flows.flows);
  const r = await routing.saveFlow({ ...d, live: false, by: auth.who });
  if (!r) return { ok: false, message: UNREACHABLE };
  if (!r.ok) return { ok: false, message: r.errors?.map((e) => e.message).join(" ") || "That did not save." };
  refresh(r.flowId);
  /* The id comes back and the browser navigates. Calling redirect() here
     would throw by design, and `attempt` on the client would report that
     throw as a failed save. */
  return { ok: true, flowId: r.flowId };
}
