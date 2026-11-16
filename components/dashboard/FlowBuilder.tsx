"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TRIGGER_ORDER, TRIGGERS, palette, validateFlow, triggerLabel, basisFor,
  MAX_SENDS, WARN_SENDS, clockTime,
} from "@/widget/gates/flows.js";
import { saveFlowAction, setFlowStatusAction } from "@/app/lead-dashboard/control/actions";
import { attempt } from "@/lib/dashboard/attempt";
import { FlowSteps } from "./FlowSteps";
import { IconAlert, IconCheck, IconLock, IconSend, IconClock, IconPower } from "./icons";

/* =========================================================================
   The Flow Builder.

   Deliberately small. One line of steps, three kinds, no branching: a
   branch reads well on a screen and is unanswerable in practice ("which
   branch is this person on?"). The trigger is the start; quiet hours are a
   band over the whole flow, not a step somebody can forget.

   THE PALETTE IS FILTERED. On a flow that starts from a list we contact,
   the call is not offered at all: not greyed out, absent. The channels come
   from `palette()` in widget/gates/flows.js, the same function the server's
   validator uses, so this screen cannot offer what the server would refuse.
   It does not need to be trusted either: Convex validates every save.

   The sentence beside the canvas is built by `describeFlow`, the same walk
   the compiler does. It is the test of whether the flow is what they meant.
   ========================================================================= */

/* Loose on purpose: the shape is owned and checked by widget/gates/flows.js,
   on this screen and again on the server. */
type Node = {
  id: string;
  type: "send" | "wait" | "stop_if";
  channel?: string;
  message?: string;
  onlyIfCallUnanswered?: boolean;
  label?: string;
  why?: string;
  after?: { minutes: number };
  at?: { addDays: number; hour: number; minute?: number };
  conditions?: string[];
};

export type BuilderMessage = { key: string; channel: string; label: string; preview: string };

const CHANNEL_WORD: Record<string, string> = { sms: "Text", email: "Email", call: "Call", messenger: "DM" };
const COND_WORD: Record<string, string> = { replied: "They replied", booked: "They booked", opted_out: "They opted out" };

const input =
  "min-h-10 rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition-colors focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const btn =
  "inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink outline-none transition-colors duration-150 hover:bg-warm focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55";
const primary =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-inverse px-4 text-[14px] font-medium text-oninverse transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55";

let seq = 0;
const newId = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`;

export function FlowBuilder({
  flow,
  messages,
  canWrite,
  demo,
  optOuts,
}: {
  flow: { id: string; name: string; triggers: string[]; nodes: Node[]; status: string; version: number };
  messages: BuilderMessage[];
  canWrite: boolean;
  demo: boolean;
  /** People who have been through this flow, and how many opted out. */
  optOuts: { people: number; optedOut: number } | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(flow.name);
  const [triggers, setTriggers] = useState<string[]>(flow.triggers);
  const [nodes, setNodes] = useState<Node[]>(flow.nodes);
  const [status, setStatus] = useState(flow.status);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [serverErrors, setServerErrors] = useState<{ code: string; message: string; nodeId?: string }[]>([]);
  const [conflict, setConflict] = useState<{ name: string; triggers: string[] }[] | null>(null);
  const [dirty, setDirty] = useState(false);

  const msgMap = useMemo(() => Object.fromEntries(messages.map((m) => [m.key, m.channel])), [messages]);
  const pal = palette(triggers);
  const check = validateFlow({ name, triggers, nodes }, { messages: msgMap });
  const basis = basisFor(triggers);
  const marketing = basis === "we_are_contacting_them";
  const sends = nodes.filter((n) => n.type === "send").length;
  const errorsFor = (id: string) => [...check.errors, ...serverErrors].filter((e) => e.nodeId === id);
  const flowErrors = check.errors.filter((e) => !e.nodeId);

  function change(fn: (ns: Node[]) => Node[]) {
    setNodes((ns) => fn(ns));
    setDirty(true);
    setServerErrors([]);
    setNote(null);
  }
  const patch = (id: string, p: Record<string, unknown>) =>
    change((ns) => ns.map((n) => (n.id === id ? ({ ...n, ...p } as Node) : n)));
  const move = (i: number, d: -1 | 1) =>
    change((ns) => {
      const j = i + d;
      if (j < 0 || j >= ns.length) return ns;
      const out = [...ns];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });
  const remove = (id: string) => change((ns) => ns.filter((n) => n.id !== id));
  const fresh = (type: Node["type"]): Node =>
    type === "send"
      ? { id: newId(), type, channel: pal.channels[0] ?? "sms", message: "" }
      : type === "wait"
        ? { id: newId(), type, after: { minutes: 60 } }
        : { id: newId(), type, conditions: ["replied"] };
  const add = (type: Node["type"]) => change((ns) => [...ns, fresh(type)]);

  /* Drag and drop. A step dragged onto another lands in its place; a new
     step dragged from the palette is inserted there. The arrows stay, for
     a keyboard and for a phone, where dragging is not reliable. */
  const [dragOver, setDragOver] = useState<number | null>(null);
  function onDrop(e: React.DragEvent, at: number) {
    e.preventDefault();
    setDragOver(null);
    const data = e.dataTransfer.getData("text/plain");
    if (data.startsWith("new:")) {
      const type = data.slice(4) as Node["type"];
      if (!["send", "wait", "stop_if"].includes(type)) return;
      if (type === "send" && sends >= MAX_SENDS) return;
      change((ns) => [...ns.slice(0, at), fresh(type), ...ns.slice(at)]);
      return;
    }
    if (data.startsWith("move:")) {
      const from = Number(data.slice(5));
      change((ns) => {
        if (!Number.isInteger(from) || from < 0 || from >= ns.length) return ns;
        const out = [...ns];
        const [n] = out.splice(from, 1);
        out.splice(at > from ? at - 1 : at, 0, n);
        return out;
      });
    }
  }
  const dropTarget = (at: number) =>
    canWrite
      ? {
          onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(at); },
          onDragLeave: () => setDragOver((x) => (x === at ? null : x)),
          onDrop: (e: React.DragEvent) => onDrop(e, at),
        }
      : {};

  function toggleTrigger(t: string) {
    setTriggers((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));
    setDirty(true);
    setServerErrors([]);
  }

  function save(live?: boolean, replace?: boolean) {
    setNote(null);
    start(async () => {
      const r = await attempt(() => saveFlowAction({ flowId: flow.id, name, triggers, nodes, live, replace }));
      if (r.ok && "status" in r) {
        setStatus(r.status);
        setDirty(false);
        setConflict(null);
        setServerErrors([]);
        setNote({
          ok: true,
          text:
            r.status === "live"
              ? `Saved as version ${r.version} and switched on. People who start from now get this; anybody already on it finishes the version they started.`
              : `Saved as version ${r.version}. Nothing changes for anybody until it is switched on.`,
        });
        router.refresh();
        return;
      }
      const res = r as { why?: string; errors?: { code: string; message: string; nodeId?: string }[]; conflicts?: { name: string; triggers: string[] }[]; message?: string };
      if (res.why === "trigger_taken" && res.conflicts) { setConflict(res.conflicts); return; }
      setServerErrors(res.errors ?? []);
      setNote({ ok: false, text: res.errors?.length ? "The server refused this. The reasons are next to the steps." : res.message ?? "That did not save." });
    });
  }

  function pause() {
    start(async () => {
      const r = await attempt(() => setFlowStatusAction(flow.id, "paused"));
      if (r.ok) { setStatus("paused"); setNote({ ok: true, text: "Paused. Its channels are back on their defaults." }); router.refresh(); }
      else setNote({ ok: false, text: (r as { message?: string }).message ?? "That did not work." });
    });
  }

  const optRate =
    optOuts && optOuts.people > 0
      ? `Of the last ${optOuts.people} ${optOuts.people === 1 ? "person" : "people"} on this flow, ${optOuts.optedOut} opted out (${((optOuts.optedOut / optOuts.people) * 100).toFixed(1)}%).`
      : "Nobody has been through this flow yet, so there is no opt-out rate.";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* ---------------------------------------------------- name, start */}
        <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
          <label className="block">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Name</span>
            <input
              className={`${input} mt-1.5 w-full`}
              value={name}
              maxLength={80}
              onChange={(e) => { setName(e.target.value); setDirty(true); }}
              disabled={!canWrite}
            />
          </label>

          <fieldset className="mt-5">
            <legend className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Starts when a lead arrives from</legend>
            {(["they_contacted_us", "we_are_contacting_them"] as const).map((b) => (
              <div key={b} className="mt-3">
                <p className="mb-2 text-[12.5px] text-muted">
                  {b === "they_contacted_us" ? "They contacted us" : "We contact them (marketing)"}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TRIGGER_ORDER.filter((t) => TRIGGERS[t].basis === b).map((t) => (
                    <label
                      key={t}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-[13px] text-ink has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[rgb(var(--accent-rgb)/.08)]"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--accent)]"
                        checked={triggers.includes(t)}
                        onChange={() => toggleTrigger(t)}
                        disabled={!canWrite}
                      />
                      {triggerLabel(t)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>

          {/* The basis, derived and shown. There is no control for it. */}
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-warm px-3.5 py-3 text-[13px] leading-relaxed text-ink">
            <IconLock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-muted" />
            <span>
              {basis === "they_contacted_us"
                ? "This flow replies to people who contacted you first. Replying to somebody's own enquiry is not marketing, so it may text, email and call."
                : basis === "we_are_contacting_them"
                  ? "This flow starts a conversation the person did not ask for, which is marketing. Every message needs recorded consent and carries an opt-out, and automated calls are not available: they need consent that specifically covers automated calls (PECR regulation 19)."
                  : "Choose the channels this flow starts from. They decide what it is allowed to do."}
            </span>
          </p>
        </section>

        {/* -------------------------------------------------------- canvas */}
        <section aria-label="Steps" className="relative">
          <p className="mb-3 flex items-start gap-2 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted">
            <IconClock className="mt-[2px] h-3.5 w-3.5 shrink-0" />
            <span>
              Quiet hours, 8pm to 8am, cover the whole flow.{" "}
              {marketing
                ? "Every message waits for sending hours, the first one included."
                : "Anything due then waits until 8am, except a step under an hour after they contacted you: somebody who rang at 2am is awake."}
            </span>
          </p>

          <ol className="relative flex flex-col gap-3 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-line">
            <li className="relative flex items-center gap-3 pl-0">
              <span className="font-mono z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                Start
              </span>
              <span className="text-[13px] text-ink">
                {triggers.length ? triggers.map(triggerLabel).join(", ") : <span className="text-muted">No channel chosen yet</span>}
              </span>
            </li>

            {nodes.map((n, i) => {
              const errs = errorsFor(n.id);
              const callBefore = nodes.slice(0, i).some((x) => x.type === "send" && x.channel === "call");
              return (
                <li
                  key={n.id}
                  className={["relative flex gap-3 rounded-xl transition-shadow", dragOver === i ? "shadow-[0_-3px_0_0_var(--accent)]" : ""].join(" ")}
                  {...dropTarget(i)}
                >
                  <span
                    className={[
                      "z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border bg-surface",
                      errs.length ? "border-[#b42318] text-[#b42318] dark:border-[#f97066] dark:text-[#f97066]" : "border-line text-muted",
                    ].join(" ")}
                    aria-hidden
                  >
                    {n.type === "send" ? <IconSend className="h-4 w-4" /> : n.type === "wait" ? <IconClock className="h-4 w-4" /> : <IconPower className="h-4 w-4" />}
                  </span>
                  <div
                    className={[
                      "min-w-0 flex-1 rounded-xl border bg-surface p-3.5",
                      errs.length ? "border-[#b42318]/50 dark:border-[#f97066]/50" : "border-line",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-sans text-[13px] font-medium text-ink">
                        {canWrite && (
                          <span
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData("text/plain", `move:${i}`); e.dataTransfer.effectAllowed = "move"; }}
                            className="cursor-grab select-none rounded px-1 text-muted hover:bg-warm active:cursor-grabbing"
                            title="Drag to move"
                            aria-hidden
                          >
                            ⠿
                          </span>
                        )}
                        Step {i + 1} · {n.type === "send" ? "Send" : n.type === "wait" ? "Wait" : "Stop if"}
                      </p>
                      {canWrite && (
                        <div className="flex gap-1">
                          <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move step ${i + 1} up`}>↑</button>
                          <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === nodes.length - 1} aria-label={`Move step ${i + 1} down`}>↓</button>
                          <button type="button" className={btn} onClick={() => remove(n.id)} aria-label={`Remove step ${i + 1}`}>Remove</button>
                        </div>
                      )}
                    </div>

                    {n.type === "send" && (
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <div role="radiogroup" aria-label="Send by" className="flex flex-wrap gap-2">
                          {/* Only what the palette offers. On a marketing flow
                              "call" is not in this list, so there is no button. */}
                          {pal.channels.map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              role="radio"
                              aria-checked={n.channel === ch}
                              disabled={!canWrite}
                              onClick={() => patch(n.id, { channel: ch, message: msgMap[n.message ?? ""] === ch ? n.message : "" })}
                              className={[btn, n.channel === ch ? "border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.1)]" : ""].join(" ")}
                            >
                              {CHANNEL_WORD[ch]}
                            </button>
                          ))}
                          {!pal.channels.includes(n.channel as never) && (
                            <span className="self-center text-[12.5px] text-[#912018] dark:text-[#fda29b]">
                              {CHANNEL_WORD[n.channel ?? ""] ?? n.channel}: not available on this flow
                            </span>
                          )}
                        </div>
                        <label className="grid min-w-0 gap-1.5">
                          <span className="text-[12.5px] text-muted">Message</span>
                          {/* w-full min-w-0: a select is as wide as its longest
                              option otherwise, and these are long. */}
                          <select
                            className={`${input} w-full min-w-0`}
                            value={n.message ?? ""}
                            disabled={!canWrite}
                            onChange={(e) => patch(n.id, { message: e.target.value })}
                          >
                            <option value="">Choose a message…</option>
                            {messages.filter((m) => m.channel === n.channel).map((m) => (
                              <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                          </select>
                        </label>
                        {n.message && (
                          <p className="line-clamp-3 rounded-lg bg-warm px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                            {messages.find((m) => m.key === n.message)?.preview}{" "}
                            <Link href={`/lead-dashboard/messages?key=${encodeURIComponent(n.message)}${demo ? "&demo=1" : ""}`} className="font-medium text-[var(--dash-accent-text)] underline-offset-2 hover:underline">
                              Edit the words
                            </Link>
                          </p>
                        )}
                        {(callBefore || n.onlyIfCallUnanswered) && n.channel !== "call" && (
                          <label className="flex items-center gap-2 text-[13px] text-ink">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[var(--accent)]"
                              checked={n.onlyIfCallUnanswered === true}
                              disabled={!canWrite}
                              onChange={(e) => patch(n.id, { onlyIfCallUnanswered: e.target.checked || undefined })}
                            />
                            Only if the call before it went unanswered
                          </label>
                        )}
                      </div>
                    )}

                    {n.type === "wait" && <WaitEditor node={n} canWrite={canWrite} onChange={(p) => patch(n.id, p)} />}

                    {n.type === "stop_if" && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(COND_WORD).map((c) => (
                            <label key={c} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[13px] text-ink">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-[var(--accent)]"
                                checked={(n.conditions ?? []).includes(c)}
                                disabled={!canWrite}
                                onChange={() =>
                                  patch(n.id, {
                                    conditions: (n.conditions ?? []).includes(c)
                                      ? (n.conditions ?? []).filter((x: string) => x !== c)
                                      : [...(n.conditions ?? []), c],
                                  })
                                }
                              />
                              {COND_WORD[c]}
                            </label>
                          ))}
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                          Steps after this one only go to people who have not replied. A reply, a booking or an opt-out
                          stops every follow-up wherever it comes, so this marks the point in the flow, not a new rule.
                        </p>
                      </div>
                    )}

                    {errs.length > 0 && (
                      <ul className="mt-3 grid gap-1.5">
                        {errs.map((e, k) => (
                          <li key={k} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-[#912018] dark:text-[#fda29b]">
                            <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{e.message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}

            <li
              className={["relative flex items-center gap-3 rounded-xl", dragOver === nodes.length ? "shadow-[0_-3px_0_0_var(--accent)]" : ""].join(" ")}
              {...dropTarget(nodes.length)}
            >
              <span className="font-mono z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                End
              </span>
              <span className="text-[13px] text-muted">It stops after the last step.</span>
            </li>
          </ol>

          {canWrite && (
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-warm/60 p-3.5">
              <div className="flex flex-wrap gap-2">
                {([["send", "+ Send"], ["wait", "+ Wait"], ["stop_if", "+ Stop if"]] as const).map(([t, label]) => (
                  <button
                    key={t}
                    type="button"
                    className={`${btn} cursor-grab`}
                    draggable={!(t === "send" && sends >= MAX_SENDS)}
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", `new:${t}`); e.dataTransfer.effectAllowed = "copy"; }}
                    onClick={() => add(t)}
                    disabled={t === "send" && sends >= MAX_SENDS}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-muted">Click to add at the end, or drag one into the line.</p>
              {/* Beside the button that adds one more message, on purpose. */}
              <p className="text-[12.5px] leading-relaxed text-muted">
                {sends} of at most {MAX_SENDS} messages. {optRate}
                {sends >= WARN_SENDS - 1 ? " Past the fifth message, more people opt out than reply." : ""}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ----------------------------------------------------------- aside */}
      <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
          <h2 className="font-sans text-[14px] font-medium text-ink">What a new lead gets</h2>
          <div className="mt-3" aria-live="polite" data-steps="">
            <FlowSteps flow={{ name, triggers, nodes }} />
          </div>

          {(flowErrors.length > 0 || check.warnings.length > 0) && (
            <ul className="mt-3 grid gap-1.5">
              {flowErrors.map((e, k) => (
                <li key={"e" + k} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-[#912018] dark:text-[#fda29b]">
                  <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{e.message}</span>
                </li>
              ))}
              {check.warnings.map((w, k) => (
                <li key={"w" + k} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-muted">
                  <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          )}
          {check.ok && <p className="mt-3 text-[12.5px] text-muted">Ready to switch on.</p>}
          {!check.ok && check.canSaveDraft && <p className="mt-3 text-[12.5px] text-muted">Can be saved as a draft. Not ready to switch on.</p>}
        </section>

        <section className="rounded-[20px] border border-line bg-surface p-4 sm:p-5" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
          <p className="text-[13px] text-ink">
            <span className="font-medium">{status === "live" ? "On" : status === "paused" ? "Paused" : "Draft"}</span>
            <span className="text-muted"> · version {flow.version}{dirty ? ", unsaved changes" : ""}</span>
          </p>

          {!canWrite ? (
            <p className="mt-3 text-[12.5px] text-muted">
              {demo ? "Example data: saving is switched off." : "Read only until a dashboard password is set."}
            </p>
          ) : conflict ? (
            <div className="mt-3 rounded-xl border border-line bg-warm p-3 text-[13px] text-ink">
              <p>
                {conflict.map((c) => `“${c.name}” already runs on ${c.triggers.map(triggerLabel).join(", ")}`).join("; ")}.
                Two flows on one channel would send two messages from one business at once.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={btn} disabled={pending} onClick={() => save(true, true)}>Replace it with this one</button>
                <button type="button" className={btn} onClick={() => setConflict(null)}>Keep it</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {status === "live" ? (
                <>
                  <button type="button" className={primary} disabled={pending || !check.ok || !dirty} onClick={() => save()}>
                    {pending ? "Saving…" : "Save changes"}
                  </button>
                  <button type="button" className={btn} disabled={pending} onClick={pause}>Pause</button>
                </>
              ) : (
                <>
                  <button type="button" className={primary} disabled={pending || !check.ok} onClick={() => save(true)}>
                    {pending ? "Saving…" : "Save and switch on"}
                  </button>
                  <button type="button" className={btn} disabled={pending || !check.canSaveDraft || !dirty} onClick={() => save(false)}>
                    Save draft
                  </button>
                </>
              )}
            </div>
          )}

          {status === "live" && canWrite && (
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              Saving applies to people who start from now. Anybody already on it finishes the version they started.
            </p>
          )}

          {note && (
            <p
              role="status"
              className={[
                "mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] leading-snug",
                note.ok ? "bg-warm text-ink" : "bg-[#b42318]/10 text-[#912018] dark:bg-[#f97066]/12 dark:text-[#fda29b]",
              ].join(" ")}
            >
              {note.ok ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{note.text}</span>
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}

/* ----------------------------------------------------------------- waits */

const UNITS = [
  { key: "minutes", per: 1 },
  { key: "hours", per: 60 },
  { key: "days", per: 1440 },
] as const;

function WaitEditor({
  node,
  canWrite,
  onChange,
}: {
  node: Node;
  canWrite: boolean;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const isAt = Boolean(node.at);
  const at = node.at ?? { addDays: 1, hour: 10, minute: 0 };
  const mins: number = node.after?.minutes ?? 60;
  const unit = UNITS.slice().reverse().find((u) => mins % u.per === 0) ?? UNITS[0];
  /* Sending hours only: a time of day inside quiet hours would be moved to
     8am anyway, so it is not offered. */
  const times: { h: number; m: number }[] = [];
  for (let h = 8; h < 20; h++) for (const m of [0, 30]) times.push({ h, m });

  return (
    <div className="mt-3 grid grid-cols-1 gap-3">
      <div role="radiogroup" aria-label="Wait kind" className="flex flex-wrap gap-2">
        {[
          { k: false, label: "For a length of time" },
          { k: true, label: "Until a day and time" },
        ].map((o) => (
          <button
            key={String(o.k)}
            type="button"
            role="radio"
            aria-checked={isAt === o.k}
            disabled={!canWrite}
            onClick={() => onChange(o.k ? { at: { addDays: 1, hour: 10, minute: 0 }, after: undefined } : { after: { minutes: 60 }, at: undefined })}
            className={[btn, isAt === o.k ? "border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.1)]" : ""].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>

      {isAt ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
          <select
            className={input}
            aria-label="Which day"
            disabled={!canWrite}
            value={at.addDays}
            onChange={(e) => onChange({ at: { ...at, addDays: Number(e.target.value) } })}
          >
            {Array.from({ length: 15 }, (_, d) => (
              <option key={d} value={d}>{d === 0 ? "The same day" : `Day ${d + 1}`}</option>
            ))}
          </select>
          <span>at</span>
          <select
            className={input}
            aria-label="What time"
            disabled={!canWrite}
            value={`${at.hour}:${at.minute ?? 0}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              onChange({ at: { ...at, hour: h, minute: m } });
            }}
          >
            {!times.some((t) => t.h === at.hour && t.m === (at.minute ?? 0)) && (
              <option value={`${at.hour}:${at.minute ?? 0}`}>{clockTime(at.hour, at.minute ?? 0)}</option>
            )}
            {times.map((t) => (
              <option key={`${t.h}:${t.m}`} value={`${t.h}:${t.m}`}>{clockTime(t.h, t.m)}</option>
            ))}
          </select>
          <span className="text-[12.5px] text-muted">Day 1 is the day they arrived.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            aria-label="How long"
            className={`${input} w-24`}
            disabled={!canWrite}
            value={mins / unit.per}
            onChange={(e) => onChange({ after: { minutes: Math.max(0, Math.round(Number(e.target.value) * unit.per)) } })}
          />
          <select
            className={input}
            aria-label="Unit"
            disabled={!canWrite}
            value={unit.key}
            onChange={(e) => {
              const u = UNITS.find((x) => x.key === e.target.value)!;
              onChange({ after: { minutes: Math.round((mins / unit.per) * u.per) } });
            }}
          >
            {UNITS.map((u) => <option key={u.key} value={u.key}>{u.key}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
