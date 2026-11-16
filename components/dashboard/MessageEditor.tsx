"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  VARIABLES, EXAMPLE, OPT_OUT, renderMessage, smsSegments, validateMessage,
} from "@/widget/gates/message-text.js";
import { saveMessageAction, resetMessageAction } from "@/app/lead-dashboard/messages/actions";
import { attempt } from "@/lib/dashboard/attempt";
import { IconAlert, IconCheck, IconLock } from "./icons";

/* =========================================================================
   One message, editable.

   Everything on this screen that counts or renders is the same code Convex
   runs when the message is sent (widget/gates/message-text.js), so what the
   preview shows is what the person gets, and the segment count is the one
   the bill is made of.

   THE OPT-OUT. On a message any marketing flow sends, the preview shows it
   greyed, after the owner's words, with "added automatically". It is not in
   the text box, so there is nothing to delete; the renderer adds it on every
   send whatever the box says.
   ========================================================================= */

export type EditorEntry = {
  key: string;
  channel: string;
  marketing: boolean;
  inCode: boolean;
  original: { subject?: string; body: string } | null;
  override: { subject: string | null; body: string } | null;
};

const input =
  "rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition-colors focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const btn =
  "inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-line px-3 text-[13px] font-semibold text-ink outline-none transition-colors duration-150 hover:bg-warm focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55";
const primary =
  "inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-inverse px-4 text-[14px] font-semibold text-oninverse transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55";

function times(n: number) {
  return n === 2 ? "twice" : n === 3 ? "three times" : `${n} times`;
}

export function MessageEditor({
  entry,
  canWrite,
  demo,
  isNew = false,
}: {
  entry: EditorEntry;
  canWrite: boolean;
  demo: boolean;
  isNew?: boolean;
}) {
  const router = useRouter();
  const start0 = entry.override ?? entry.original ?? { subject: "", body: "" };
  const [key, setKey] = useState(entry.key);
  const [channel, setChannel] = useState(entry.channel);
  const [subject, setSubject] = useState(start0.subject ?? "");
  const [body, setBody] = useState(start0.body);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [serverErrors, setServerErrors] = useState<{ code: string; message: string }[]>([]);
  const area = useRef<HTMLTextAreaElement>(null);

  const msg = { key, channel, subject: channel === "email" ? subject : undefined, body };
  const check = validateMessage(msg, { marketing: entry.marketing });
  const out = renderMessage({ channel, subject, body }, EXAMPLE, false);
  const sent = renderMessage({ channel, subject, body }, EXAMPLE, entry.marketing);
  const seg = channel === "sms" ? smsSegments(sent.body) : null;
  const changed =
    body !== start0.body || (channel === "email" && subject !== (start0.subject ?? "")) || isNew;

  function insert(v: string) {
    const el = area.current;
    const token = `{{${v}}}`;
    if (!el) { setBody((b) => b + token); return; }
    const s = el.selectionStart ?? body.length;
    const e = el.selectionEnd ?? body.length;
    const next = body.slice(0, s) + token + body.slice(e);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length);
    });
  }

  function save() {
    setNote(null);
    start(async () => {
      const r = await attempt(() => saveMessageAction({ key, channel, subject: channel === "email" ? subject : undefined, body }));
      setServerErrors(r.ok ? [] : (r as { errors?: { code: string; message: string }[] }).errors ?? []);
      setNote({ ok: r.ok, text: r.message ?? (r.ok ? "Saved." : "The server refused this. The reasons are below.") });
      if (r.ok) router.refresh();
      if (r.ok && isNew) router.push(`/lead-dashboard/messages?key=${encodeURIComponent(key)}`);
    });
  }

  function reset() {
    start(async () => {
      const r = await attempt(() => resetMessageAction(key));
      setNote({ ok: r.ok, text: r.message ?? "" });
      if (r.ok && entry.original) {
        setBody(entry.original.body);
        setSubject(entry.original.subject ?? "");
        router.refresh();
      }
    });
  }

  const errors = [...check.errors, ...serverErrors];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {isNew && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="grid min-w-0 grid-cols-1 gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted">Message id</span>
            <input className={`${input} min-h-10`} value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="spring_offer_sms" disabled={!canWrite} />
          </label>
          <label className="grid min-w-0 grid-cols-1 gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted">Sent as</span>
            <select className={`${input} min-h-10`} value={channel} onChange={(e) => setChannel(e.target.value)} disabled={!canWrite}>
              <option value="sms">Text</option>
              <option value="email">Email</option>
            </select>
          </label>
        </div>
      )}

      {channel === "email" && (
        <label className="grid min-w-0 grid-cols-1 gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted">Subject</span>
          <input className={`${input} min-h-10`} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canWrite} />
        </label>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-1.5">
        <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted">
          {channel === "call" ? "What the agent is told" : "Words"}
        </span>
        {canWrite && (
          <div className="flex flex-wrap gap-1.5" aria-label="Insert a detail">
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insert(v.key)}
                title={`For example: ${v.example}. If unknown: ${v.fallback}`}
                className="min-h-8 cursor-pointer rounded-md border border-line bg-warm px-2 text-[12px] font-medium text-ink transition-colors hover:border-[var(--accent)]"
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={area}
          className={`${input} min-h-[11rem] py-2.5 font-mono text-[13px] leading-relaxed`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!canWrite}
          aria-describedby="seg"
        />
        {seg && (
          <p id="seg" className="text-[12.5px] text-muted" aria-live="polite">
            <strong className="font-semibold text-ink">
              {seg.segments} {seg.segments === 1 ? "text" : "texts joined"}
            </strong>
            {seg.segments > 1 ? `, so it costs ${times(seg.segments)} a single text` : ""}
            {" · "}{seg.units} of {seg.segments > 1 ? seg.segments * seg.perSegment : seg.perSegment} characters
            {seg.encoding === "UCS-2" ? " · special characters: 70 per text, not 160" : ""}
            {" · counted with example details"}{entry.marketing ? " and the opt-out" : ""}.
          </p>
        )}
      </div>

      {/* The preview: what a real person would read. */}
      <section aria-label="Preview" className="rounded-xl border border-line bg-warm/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-muted">Preview, with example details</p>
        {channel === "email" && out.subject && (
          <p className="mt-2 text-[13.5px] font-semibold text-ink">{out.subject}</p>
        )}
        <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{out.body}</p>
        {entry.marketing && (
          <p className="mt-3 flex flex-wrap items-center gap-2 whitespace-pre-wrap text-[13.5px] text-muted/80">
            <span className="opacity-70">{OPT_OUT}</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[.06em]">
              <IconLock className="h-3 w-3" /> Added automatically
            </span>
          </p>
        )}
      </section>

      {(errors.length > 0 || check.warnings.length > 0) && (
        <ul className="grid min-w-0 grid-cols-1 gap-1.5">
          {errors.map((e, i) => (
            <li key={"e" + i} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-[#912018] dark:text-[#fda29b]">
              <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{e.message}</span>
            </li>
          ))}
          {check.warnings.map((w, i) => (
            <li key={"w" + i} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-muted">
              <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}

      {!canWrite ? (
        <p className="text-[12.5px] text-muted">{demo ? "Example data: saving is switched off." : "Read only until a dashboard password is set."}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={primary} disabled={pending || !check.ok || !changed} onClick={save}>
            {pending ? "Saving…" : "Save"}
          </button>
          {entry.override && !isNew && (
            <button type="button" className={btn} disabled={pending} onClick={reset}>
              {entry.inCode ? "Go back to the original words" : "Delete this message"}
            </button>
          )}
          <span className="text-[12.5px] text-muted">The next message sent uses what is saved.</span>
        </div>
      )}

      {note && (
        <p
          role="status"
          className={[
            "flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] leading-snug",
            note.ok ? "bg-warm text-ink" : "bg-[#b42318]/10 text-[#912018] dark:bg-[#f97066]/12 dark:text-[#fda29b]",
          ].join(" ")}
        >
          {note.ok ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{note.text}</span>
        </p>
      )}
    </div>
  );
}
