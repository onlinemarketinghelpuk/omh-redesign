"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { makeEditableAction, setFlowStatusAction } from "@/app/lead-dashboard/control/actions";
import { attempt } from "@/lib/dashboard/attempt";
import { IconAlert, IconCheck } from "./icons";

/* =========================================================================
   The buttons on a Control Panel row.

   Pausing a channel's flow is like the kill switch for one channel: one
   press, because the cost of a mistake is that channel falling back to its
   default for a minute. Switching one ON starts texting real people on the
   owner's words, so it asks first, and if another flow already serves one of
   its channels the server says which, and the owner chooses.
   ========================================================================= */

const btn =
  "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-line px-3 text-[13px] font-medium text-ink outline-none transition-colors duration-150 hover:bg-warm focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55";

type Note = { ok: boolean; text: string } | null;

export function MakeEditable({
  channel,
  canWrite,
  stay = false,
  label = "Make editable",
}: {
  channel: string;
  canWrite: boolean;
  /** Stay on this page and reload it, rather than opening the builder. */
  stay?: boolean;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<Note>(null);
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className={btn}
        disabled={!canWrite || pending}
        title={canWrite ? undefined : "Read only until a dashboard password is set."}
        onClick={() =>
          start(async () => {
            const r = await attempt(() => makeEditableAction(channel));
            if (r.ok && "flowId" in r) {
              if (stay) router.refresh();
              else router.push(`/lead-dashboard/flows/${r.flowId}`);
            }
            else setNote({ ok: false, text: r.message ?? "That did not work." });
          })
        }
      >
        {pending ? "Opening…" : label}
      </button>
      <Status note={note} />
    </div>
  );
}

export function FlowStatusButton({
  flowId,
  status,
  canWrite,
}: {
  flowId: string;
  status: string;
  canWrite: boolean;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<Note>(null);
  const [confirm, setConfirm] = useState<null | { replace: { name: string; triggers: string[] }[] }>(null);

  function run(next: "live" | "paused", replace?: boolean) {
    start(async () => {
      const r = await attempt(() => setFlowStatusAction(flowId, next, replace));
      if (r.ok) {
        setConfirm(null);
        setNote({ ok: true, text: next === "live" ? "Switched on. New leads on its channels get this flow." : "Paused. Its channels are back on their defaults." });
        return;
      }
      const res = r as { why?: string; conflicts?: { name: string; triggers: string[] }[]; errors?: { message: string }[]; message?: string };
      if (res.why === "trigger_taken" && res.conflicts) {
        setConfirm({ replace: res.conflicts });
        return;
      }
      setNote({ ok: false, text: res.errors?.map((e) => e.message).join(" ") || res.message || "That did not work." });
    });
  }

  if (!canWrite) return null;
  return (
    <div className="flex flex-col items-start gap-2">
      {status === "live" ? (
        <button type="button" className={btn} disabled={pending} onClick={() => run("paused")}>
          {pending ? "Pausing…" : "Pause"}
        </button>
      ) : confirm ? (
        <div className="max-w-[34ch] rounded-lg border border-line bg-surface p-3 text-[13px]">
          <p className="text-ink">
            {confirm.replace.map((c) => `“${c.name}” already runs on ${c.triggers.length === 1 ? "that channel" : "those channels"}`).join("; ")}.
            Switching this on pauses it.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={pending} onClick={() => run("live", true)}>
              Replace it
            </button>
            <button type="button" className={btn} onClick={() => setConfirm(null)}>Keep it</button>
          </div>
        </div>
      ) : (
        <button type="button" className={btn} disabled={pending} onClick={() => run("live")}>
          {pending ? "Switching on…" : "Switch on"}
        </button>
      )}
      <Status note={note} />
    </div>
  );
}

function Status({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p
      role="status"
      className={[
        "flex max-w-[40ch] items-start gap-1.5 text-[12.5px] leading-snug",
        note.ok ? "text-ink" : "text-[#912018] dark:text-[#fda29b]",
      ].join(" ")}
    >
      {note.ok ? <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <span>{note.text}</span>
    </p>
  );
}
