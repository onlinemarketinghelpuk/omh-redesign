"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite } from "@/lib/dashboard/auth";
import * as routing from "@/lib/dashboard/routing";

/* What came of a lead.

   The only field on a lead a person owns outright. The assistant knows what
   was said; it does not know what was signed, so nothing automated writes
   this. */

export type Result = { ok: boolean; message?: string; outcome?: string };

export type OutcomeService = {
  serviceKey?: string;
  packageLabel?: string;
  monthlyGbp?: number;
  months?: number;
  /* "monthly" the client confirmed the monthly figure as the value.
     "term"    the client confirmed the whole-contract total.
     "custom"  the figure was hand-typed; the catalogue must not overwrite it
               on the next save. */
  valueBasis?: "monthly" | "term" | "custom";
};

export async function setLeadOutcome(
  leadId: string,
  outcome: string,
  valueGbp?: number,
  service?: OutcomeService,
): Promise<Result> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };

  const res = await routing.setLeadOutcome(leadId, outcome, valueGbp, auth.who, service);
  if (!res) return { ok: false, message: "Could not reach the lead store." };
  if (!res.ok) return { ok: false, message: res.why ?? "That did not save." };

  revalidatePath("/lead-dashboard/leads");
  revalidatePath("/lead-dashboard/channels");
  return { ok: true, outcome };
}

export async function addLeadNote(
  leadId: string,
  body: string,
): Promise<Result & { noteId?: string }> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  if (!body.trim()) return { ok: false, message: "A note has to have some words." };

  const res = await routing.addLeadNote(leadId, body, auth.who);
  if (!res) return { ok: false, message: "Could not reach the lead store." };
  if (!res.ok) return { ok: false, message: res.why ?? "That did not save." };

  revalidatePath("/lead-dashboard/leads");
  revalidatePath(`/lead-dashboard/sessions`);
  return { ok: true, noteId: res.noteId };
}

export async function deleteLeadNote(noteId: string): Promise<Result> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };

  const res = await routing.deleteLeadNote(noteId, auth.who);
  if (!res) return { ok: false, message: "Could not reach the lead store." };
  if (!res.ok) return { ok: false, message: res.why ?? "That did not delete." };

  revalidatePath("/lead-dashboard/leads");
  revalidatePath(`/lead-dashboard/sessions`);
  return { ok: true };
}

/**
 * The same thing for many leads at once.
 *
 * One request rather than one per lead: twenty server actions in flight is
 * twenty revalidations of the same two pages, and the page would re-render
 * underneath the person while they were still reading the result.
 */
export async function setLeadOutcomes(
  leadIds: string[],
  outcome: string,
): Promise<Result & { changed?: number }> {
  const auth = await assertCanWrite();
  if (!auth.ok) return { ok: false, message: auth.why };
  if (!leadIds.length) return { ok: false, message: "Nothing was selected." };

  const res = await routing.setLeadOutcomes(leadIds, outcome, auth.who);
  if (!res) return { ok: false, message: "Could not reach the lead store." };
  if (!res.ok) return { ok: false, message: res.why ?? "That did not save." };

  revalidatePath("/lead-dashboard/leads");
  revalidatePath("/lead-dashboard/channels");
  return { ok: true, outcome, changed: res.changed ?? 0 };
}
