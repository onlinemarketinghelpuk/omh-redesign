"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite } from "@/lib/dashboard/auth";
import * as routing from "@/lib/dashboard/routing";

/* =========================================================================
   One channel's switch.

   The password is checked here as well as in proxy.ts: a server action is
   its own POST endpoint. Convex enforces the switch itself in `enrol`, so
   this only records the owner's decision; it is not what makes it true.
   ========================================================================= */

export type ChannelResult = { ok: boolean; on?: boolean; message: string; running?: number };

export async function setChannelAction(channel: string, on: boolean): Promise<ChannelResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };

  const res = await routing.setChannel(channel, on, auth.who);
  if (!res) {
    return { ok: false, message: "Could not reach the routing store, so nothing has changed." };
  }
  if (!res.ok) {
    return { ok: false, message: "That is not a channel the system knows, so nothing has changed." };
  }

  revalidatePath("/lead-dashboard/integrations");
  revalidatePath("/lead-dashboard/control");

  if (res.on) {
    return { ok: true, on: true, running: res.running, message: "Switched on. New enquiries on this channel are followed up again." };
  }
  const n = res.running;
  const people = n === 1 ? "1 person is" : `${n} people are`;
  return {
    ok: true,
    on: false,
    running: n,
    message:
      n > 0
        ? `Switched off. No new follow-ups start on this channel. ${people} part way through one and will finish it; stop them on Follow-ups if you need to.`
        : "Switched off. No new follow-ups start on this channel, and nobody is part way through one.",
  };
}
