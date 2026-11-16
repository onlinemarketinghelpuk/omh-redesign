"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite } from "@/lib/dashboard/auth";
import * as routing from "@/lib/dashboard/routing";

/* Writes from the Messages screen. Checked here for the password and in
   Convex for everything else; the server's reason comes back unchanged. */

export type MessageActionResult = {
  ok: boolean;
  message?: string;
  errors?: { code: string; message: string }[];
  warnings?: { code: string; message: string }[];
};

function refresh() {
  revalidatePath("/lead-dashboard/messages");
  revalidatePath("/lead-dashboard/control");
}

export async function saveMessageAction(input: {
  key: string;
  channel: string;
  subject?: string;
  body: string;
}): Promise<MessageActionResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const r = await routing.saveMessage({ ...input, by: auth.who });
  if (!r) return { ok: false, message: "Could not reach the message store, so nothing has changed." };
  if (r.ok) refresh();
  return {
    ok: r.ok,
    message: r.ok ? "Saved. The next message sent uses these words." : undefined,
    errors: r.errors,
    warnings: r.warnings,
  };
}

export async function resetMessageAction(key: string): Promise<MessageActionResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const r = await routing.resetMessage(key, auth.who);
  if (!r) return { ok: false, message: "Could not reach the message store, so nothing has changed." };
  if (!r.ok) {
    return {
      ok: false,
      message:
        r.why === "in_use"
          ? `A live flow sends this message (${(r.flows ?? []).join(", ")}). Change that flow first, so no step is left with nothing to send.`
          : r.why === "no_override"
            ? "This message already uses the original words."
            : "That did not reset.",
    };
  }
  refresh();
  return { ok: true, message: "Back to the original words." };
}
