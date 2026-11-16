"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite } from "@/lib/dashboard/auth";
import * as routing from "@/lib/dashboard/routing";

/* Writes from the Brain and Outbound agent screens. The password is checked
   here; everything else is checked in Convex by the same gates the screens
   use, and its reasons come back unchanged. */

export type SettingsResult = { ok: boolean; message?: string; errors?: string[] };

const UNREACHABLE = "Could not reach the settings store, so nothing has changed.";

export async function saveBrainAction(input: {
  enabled: boolean;
  policies: Record<string, string>;
  sales: { goal: string; offer: string; notes: string };
}): Promise<SettingsResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const r = await routing.setBrain({ ...input, by: auth.who });
  if (!r) return { ok: false, message: UNREACHABLE };
  if (r.ok) {
    revalidatePath("/lead-dashboard/brain");
    revalidatePath("/lead-dashboard/control", "layout");
  }
  return { ok: r.ok, errors: r.errors, message: r.ok ? "Saved. The next reply is handled this way." : undefined };
}

export async function saveAgentAction(input: {
  fromNumber: string;
  days: number[];
  start: number;
  end: number;
  opening: string;
  goal: string;
}): Promise<SettingsResult> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  const r = await routing.setAgent({ ...input, by: auth.who });
  if (!r) return { ok: false, message: UNREACHABLE };
  if (r.ok) {
    revalidatePath("/lead-dashboard/agent");
    revalidatePath("/lead-dashboard/control", "layout");
  }
  return {
    ok: r.ok,
    errors: r.errors,
    message: r.ok
      ? r.fromNumber
        ? `Saved. Calls go out from ${r.fromNumber} once the workflows are pushed.`
        : "Saved. No number yet, so no call is placed; call steps are skipped and the texts carry on."
      : undefined,
  };
}
