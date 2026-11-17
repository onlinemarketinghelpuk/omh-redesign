"use client";

import { useRef, useState, useTransition } from "react";
import { addLeadNote, deleteLeadNote } from "@/app/lead-dashboard/leads/actions";
import type { LeadNote } from "@/lib/dashboard/routing";
import { attempt } from "@/lib/dashboard/attempt";

/* =========================================================================
   Notes on a lead. Append-only.

   Every other record of what happened in this system is append-only for the
   same reason: two people on the same dashboard would otherwise silently
   overwrite each other, and the note that is lost is the one somebody typed
   after a phone call. The author may delete their own row.

   The initial list is rendered server-side so the page lands with content;
   edits optimistically update the list here and fall back if the server
   refuses.
   ========================================================================= */

export function LeadNotes({
  leadId,
  initial,
  canWrite,
  demo = false,
  authorHint,
}: {
  leadId: string;
  initial: LeadNote[];
  canWrite: boolean;
  demo?: boolean;
  /* The current user's login name, used to decide whether the delete
     control appears beside a row. The server re-checks ownership. */
  authorHint?: string;
}) {
  const [notes, setNotes] = useState<LeadNote[]>(initial);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  function post() {
    const body = draft.trim();
    if (!body) return;
    if (demo) {
      setStatus({ text: "Example data. Nothing was saved.", ok: false });
      return;
    }
    start(async () => {
      const r = await attempt(() => addLeadNote(leadId, body));
      if (r.ok && "noteId" in r && r.noteId) {
        setNotes((prev) => [
          {
            id: r.noteId as string,
            leadId,
            body,
            by: authorHint ?? null,
            at: Date.now(),
          },
          ...prev,
        ]);
        setDraft("");
        setStatus({ text: "Saved", ok: true });
      } else {
        setStatus({ text: r.message ?? "That did not save", ok: false });
      }
    });
  }

  function remove(id: string) {
    if (demo) {
      setStatus({ text: "Example data. Nothing was saved.", ok: false });
      return;
    }
    start(async () => {
      const r = await attempt(() => deleteLeadNote(id));
      if (r.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setStatus({ text: "Deleted", ok: true });
      } else {
        setStatus({ text: r.message ?? "That did not delete", ok: false });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {canWrite || demo ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] text-muted" htmlFor={`note-${leadId}`}>
            Add a note
          </label>
          <textarea
            id={`note-${leadId}`}
            ref={field}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              /* Cmd+Enter / Ctrl+Enter posts. A bare Enter is a newline: a
                 phone call note has more than one line, and committing on
                 Enter would lose them. */
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post();
            }}
            placeholder="Called at 10:02, left a voicemail. They said they would ring back after lunch."
            className="min-h-[72px] resize-y rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] text-ink outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-rgb)/.35)]"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">
              Append-only. {draft.length}/4000. ⌘⏎ to post.
            </p>
            <button
              type="button"
              onClick={post}
              disabled={pending || !draft.trim()}
              className="min-h-9 cursor-pointer rounded-lg bg-inverse px-3 text-[13px] font-medium text-oninverse outline-none hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {pending ? "Saving…" : "Post note"}
            </button>
          </div>
          {status && (
            <p
              role="status"
              className={`text-[12.5px] ${status.ok ? "text-[var(--dash-accent-text)]" : "text-error"}`}
            >
              {status.ok ? "✓ " : ""}
              {status.text}
            </p>
          )}
        </div>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-[12.5px] text-muted">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((n) => {
            const mine = !!authorHint && n.by === authorHint;
            return (
              <li
                key={n.id}
                className="rounded-xl border border-line bg-warm/40 px-3 py-2"
              >
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
                  {n.body}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-muted">
                  <span>
                    {n.by ?? "Unknown"} ·{" "}
                    {new Date(n.at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/London",
                    })}
                  </span>
                  {mine && canWrite && (
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      className="cursor-pointer rounded px-1.5 py-0.5 text-[11.5px] text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
