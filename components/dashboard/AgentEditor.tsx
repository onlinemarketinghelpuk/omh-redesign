"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validateAgent, normaliseNumber, callBrief, EARLIEST, LATEST } from "@/widget/gates/agent.js";
import { saveAgentAction } from "@/app/lead-dashboard/brain/actions";
import { attempt } from "@/lib/dashboard/attempt";
import { IconAlert, IconCheck } from "./icons";

/* The outbound agent's settings. Checked as typed by the same gate Convex
   checks with on save (widget/gates/agent.js). */

const input =
  "rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition-colors focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const primary =
  "inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-inverse px-4 text-[14px] font-semibold text-oninverse transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55";
const DAYS = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"],
] as const;

export type AgentValue = { fromNumber: string; days: number[]; start: number; end: number; opening: string; goal: string };

const hour = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;

export function AgentEditor({ initial, canWrite, demo }: { initial: AgentValue; canWrite: boolean; demo: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<AgentValue>(initial);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const check = validateAgent(v);
  const set = (p: Partial<AgentValue>) => { setV((x) => ({ ...x, ...p })); setDirty(true); setNote(null); };
  const preview = callBrief(v, { name: "Sarah Whitfield", service: "Google Ads management" });
  const norm = normaliseNumber(v.fromNumber);
  const hours = Array.from({ length: LATEST - EARLIEST + 1 }, (_, i) => EARLIEST + i);

  function save() {
    start(async () => {
      const r = await attempt(() => saveAgentAction(v));
      setNote({ ok: r.ok, text: r.message ?? (r as { errors?: string[] }).errors?.join(" ") ?? "That did not save." });
      if (r.ok) { setDirty(false); router.refresh(); }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
        <h2 className="font-sans text-[15px] font-semibold text-ink">The number it calls from</h2>
        <input
          className={`${input} mt-3 min-h-10 w-full max-w-sm`}
          value={v.fromNumber}
          placeholder="e.g. 020 3489 3934"
          disabled={!canWrite}
          onChange={(e) => set({ fromNumber: e.target.value })}
          aria-label="Number the agent calls from"
        />
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          {v.fromNumber.trim()
            ? norm ? `Saved as ${norm}.` : ""
            : "No number yet, so no call is placed. Call steps are skipped and the texts carry on."}{" "}
          It must be a UK number imported into Retell. A name instead of a number cannot be rung back.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
        <h2 className="font-sans text-[15px] font-semibold text-ink">When it may call</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAYS.map(([d, l]) => (
            <label key={d} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[13px] text-ink has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[rgb(var(--accent-rgb)/.08)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent)]"
                checked={v.days.includes(d)}
                disabled={!canWrite}
                onChange={() => set({ days: v.days.includes(d) ? v.days.filter((x) => x !== d) : [...v.days, d] })}
              />
              {l}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink">
          <span>From</span>
          <select className={`${input} min-h-10`} value={v.start} disabled={!canWrite} onChange={(e) => set({ start: Number(e.target.value) })} aria-label="From">
            {hours.slice(0, -1).map((h) => <option key={h} value={h}>{hour(h)}</option>)}
          </select>
          <span>to</span>
          <select className={`${input} min-h-10`} value={v.end} disabled={!canWrite} onChange={(e) => set({ end: Number(e.target.value) })} aria-label="To">
            {hours.slice(1).map((h) => <option key={h} value={h}>{hour(h)}</option>)}
          </select>
        </div>
        <p className="mt-2 text-[12.5px] text-muted">A call due outside these hours waits for the next window. Texts keep their own hours.</p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
        <h2 className="font-sans text-[15px] font-semibold text-ink">What it says and what it is for</h2>
        <label className="mt-3 grid min-w-0 gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted">First thing it says</span>
          <textarea className={`${input} min-h-20 py-2`} value={v.opening} maxLength={300} disabled={!canWrite} onChange={(e) => set({ opening: e.target.value })} />
          <span className="text-[12px] text-muted">{"{first_name}"} and {"{service}"} are filled in for each person.</span>
        </label>
        <label className="mt-3 grid min-w-0 gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-muted">Its goal</span>
          <textarea className={`${input} min-h-16 py-2`} value={v.goal} maxLength={400} disabled={!canWrite} onChange={(e) => set({ goal: e.target.value })} />
        </label>
        <div className="mt-3 rounded-xl bg-warm p-3.5 text-[13px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-muted">Calling Sarah about Google Ads, it opens with</p>
          <p className="mt-1.5 text-ink">“{preview.opening}”</p>
        </div>
      </section>

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
    </div>
  );
}
