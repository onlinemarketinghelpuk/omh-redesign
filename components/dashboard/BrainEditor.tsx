"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { POLICIES, decideReply, salesBrief, validateBrain } from "@/widget/gates/brain.js";
import { TRIGGER_ORDER, triggerLabel } from "@/widget/gates/flows.js";
import { saveBrainAction } from "@/app/lead-dashboard/brain/actions";
import { attempt } from "@/lib/dashboard/attempt";
import { IconAlert, IconCheck } from "./icons";

/* =========================================================================
   The Brain: who answers a reply, and what the assistant is selling when it
   does.

   The decision and the brief shown in the test console are made by the same
   gate Convex runs on every real reply (widget/gates/brain.js). The console
   costs nothing: it shows the decision and what the assistant would be told,
   and the actual wording is the assistant's, live.
   ========================================================================= */

const input =
  "rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition-colors focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const primary =
  "inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-inverse px-4 text-[14px] font-medium text-oninverse transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55";

export type BrainValue = {
  enabled: boolean;
  policies: Record<string, string>;
  sales: { goal: string; offer: string; notes: string };
};

export function BrainEditor({
  initial,
  canWrite,
  demo,
  only,
}: {
  initial: BrainValue;
  canWrite: boolean;
  demo: boolean;
  /** Show one channel only, for a channel's own page. */
  only?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<BrainValue>(initial);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tryChannel, setTryChannel] = useState(only ?? "google_ads");
  const [tryText, setTryText] = useState("Yes please, how much would it be?");

  const check = validateBrain(v);
  const set = (p: Partial<BrainValue>) => { setV((x) => ({ ...x, ...p })); setDirty(true); setNote(null); };
  const setPolicy = (ch: string, p: string) => set({ policies: { ...v.policies, [ch]: p } });

  function save() {
    start(async () => {
      const r = await attempt(() => saveBrainAction(v));
      setNote({ ok: r.ok, text: r.message ?? (r as { errors?: string[] }).errors?.join(" ") ?? "That did not save." });
      if (r.ok) { setDirty(false); router.refresh(); }
    });
  }

  const d = decideReply({ brain: v, channel: tryChannel, text: tryText });
  const brief = d.answer ? salesBrief({ brain: v, channel: tryChannel, lead: { name: "Sarah Whitfield", service: "Google Ads management" } }) : "";
  const channels = only ? [only] : TRIGGER_ORDER;

  return (
    <div className="grid grid-cols-1 gap-5">
      {!only && (
        <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-sans text-[15px] font-medium text-ink">
                Automated answering is {v.enabled ? "on" : "off"}
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                {v.enabled
                  ? "Replies are handled by each channel's setting below."
                  : "Nothing automated answers. Every reply goes to Needs a person."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={v.enabled}
              disabled={!canWrite}
              onClick={() => set({ enabled: !v.enabled })}
              className={[
                "relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                v.enabled ? "bg-[var(--accent)]" : "bg-line",
              ].join(" ")}
            >
              <span className={["absolute top-1 size-6 rounded-full bg-white shadow transition-[left]", v.enabled ? "left-7" : "left-1"].join(" ")} />
              <span className="sr-only">Automated answering</span>
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
        <h2 className="font-sans text-[15px] font-medium text-ink">{only ? "Who answers replies" : "Who answers, per channel"}</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2">
          {channels.map((ch) => (
            <li key={ch} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-0">
              {!only && <span className="text-[13.5px] font-medium text-ink">{triggerLabel(ch)}</span>}
              <select
                className={`${input} min-h-10 ${only ? "w-full" : "w-full sm:w-auto"}`}
                aria-label={`Who answers replies from ${triggerLabel(ch)}`}
                value={v.policies[ch] ?? "assistant_only"}
                disabled={!canWrite || !v.enabled}
                onChange={(e) => setPolicy(ch, e.target.value)}
              >
                {POLICIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          {POLICIES.find((p) => p.key === (v.policies[channels[0]] ?? "assistant_only"))?.what}
        </p>
      </section>

      {!only && (
        <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
          <h2 className="font-sans text-[15px] font-medium text-ink">What the assistant is selling</h2>
          <p className="mt-1 text-[13px] text-muted">When it answers a reply, it answers the question, explains, and asks for this.</p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="grid min-w-0 gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Goal</span>
              <input className={`${input} min-h-10`} value={v.sales.goal} maxLength={200} disabled={!canWrite}
                onChange={(e) => set({ sales: { ...v.sales, goal: e.target.value } })} />
            </label>
            <label className="grid min-w-0 gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">The offer</span>
              <textarea className={`${input} min-h-20 py-2`} value={v.sales.offer} maxLength={500} disabled={!canWrite}
                onChange={(e) => set({ sales: { ...v.sales, offer: e.target.value } })} />
            </label>
            <label className="grid min-w-0 gap-1.5">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Anything else it should know</span>
              <textarea className={`${input} min-h-20 py-2`} value={v.sales.notes} maxLength={1500} disabled={!canWrite}
                placeholder="For example: we only take clients in Essex and London."
                onChange={(e) => set({ sales: { ...v.sales, notes: e.target.value } })} />
            </label>
            <p className="text-[12.5px] text-muted">
              It still never quotes a price or a timescale it did not look up. That rule comes last, after anything written here.
            </p>
          </div>
        </section>
      )}

      {canWrite ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={primary} disabled={pending || !dirty || !check.ok} onClick={save}>
            {pending ? "Saving…" : "Save"}
          </button>
          {!check.ok && <span className="text-[12.5px] text-[#912018] dark:text-[#fda29b]">{check.errors.join(" ")}</span>}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted">{demo ? "Example data: saving is switched off." : "Read only until a dashboard password is set."}</p>
      )}
      {note && (
        <p role="status" className={["flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px]", note.ok ? "bg-warm text-ink" : "bg-[#b42318]/10 text-[#912018] dark:text-[#fda29b]"].join(" ")}>
          {note.ok ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{note.text}</span>
        </p>
      )}

      {!only && (
        <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
          <h2 className="font-sans text-[15px] font-medium text-ink">Try it</h2>
          <p className="mt-1 text-[13px] text-muted">Type a reply as if you were the lead. Free: no AI is called here.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <select className={`${input} min-h-10`} value={tryChannel} onChange={(e) => setTryChannel(e.target.value)} aria-label="Channel">
              {TRIGGER_ORDER.map((t) => <option key={t} value={t}>{triggerLabel(t)}</option>)}
            </select>
            <input className={`${input} min-h-10`} value={tryText} onChange={(e) => setTryText(e.target.value)} aria-label="Their reply" />
          </div>
          <div className="mt-4 rounded-xl bg-warm p-4" aria-live="polite">
            <p className="text-[14px] font-medium text-ink">
              {d.answer ? "The assistant answers" : d.handOver ? "It goes to a person" : "Nothing answers"}
            </p>
            <p className="mt-1 text-[13px] text-muted">{d.reason}</p>
            {brief && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[13px] font-medium text-[var(--dash-accent-text)]">What the assistant is told</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">{brief}</pre>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
