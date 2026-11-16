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

export type ChannelResult = { ok: boolean; on?: boolean; message: string; paused?: number; resumed?: number };

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
  revalidatePath("/lead-dashboard/sequences");

  const people = (n: number) => (n === 1 ? "1 person" : `${n} people`);
  const are = (n: number) => (n === 1 ? "is" : "are");
  if (res.on) {
    return {
      ok: true, on: true, resumed: res.resumed,
      message:
        res.resumed > 0
          ? `Switched on. The assistant answers here again, and ${people(res.resumed)} paused part way through a follow-up ${res.resumed === 1 ? "carries" : "carry"} on from where they were.`
          : "Switched on. The assistant answers here again, and new enquiries are followed up.",
    };
  }
  return {
    ok: true, on: false, paused: res.paused,
    message:
      (res.paused > 0
        ? `Switched off. ${people(res.paused)} part way through a follow-up ${are(res.paused)} paused until you switch it back on. `
        : "Switched off. ") +
      "Nothing automated runs on this channel now, and anything new that arrives goes to Needs a person.",
  };
}
