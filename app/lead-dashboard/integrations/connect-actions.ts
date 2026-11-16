"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite } from "@/lib/dashboard/auth";
import { connect, disconnect, activateWorkflow, type ConnectResult } from "@/lib/dashboard/connect";

/* =========================================================================
   Connect, disconnect, and switch a workflow on (plan 015).

   The password is checked here as well as in proxy.ts: a server action is
   its own POST endpoint. Nothing the owner typed is sent back: the result
   carries a message, field errors and per-workflow outcomes, never a value.
   ========================================================================= */

/* What reaches the browser. Built field by field rather than spread from
   the result, so a value can never ride along by accident. */
export type ScreenResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  workflows?: { workflow: string; saved: boolean; why?: string }[];
};

function forScreen(r: ConnectResult): ScreenResult {
  return {
    ok: r.ok,
    message: r.message,
    errors: r.errors,
    workflows: r.workflows?.map((w) => ({ workflow: w.workflow, saved: w.saved, why: w.why })),
  };
}

export async function connectAction(key: string, values: Record<string, string>): Promise<ScreenResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const r = await connect(key, values, auth.who);
  revalidatePath("/lead-dashboard/integrations");
  return forScreen(r);
}

export async function disconnectAction(key: string): Promise<ScreenResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const r = await disconnect(key, auth.who);
  revalidatePath("/lead-dashboard/integrations");
  return forScreen(r);
}

/* Only these two may be switched on from the screen. The rest are either
   already on or need an engineer's eye before they are. */
const MAY_ACTIVATE = ["Sequence Worker", "Email Inbound"];

export async function activateAction(workflow: string): Promise<ScreenResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  if (!MAY_ACTIVATE.includes(workflow)) return { ok: false, message: "That workflow is not switched on from here." };
  const r = await activateWorkflow(workflow);
  revalidatePath("/lead-dashboard/integrations");
  return { ok: r.ok, message: r.message };
}
