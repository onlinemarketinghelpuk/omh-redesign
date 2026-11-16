"use client";

import { useId, useState, useTransition } from "react";
import { connectAction, disconnectAction, activateAction, type ScreenResult } from "@/app/lead-dashboard/integrations/connect-actions";
import { attempt } from "@/lib/dashboard/attempt";
import { Pill } from "./ui";
import { IconAlert, IconCheck } from "./icons";

/* =========================================================================
   One channel to connect (plan 015), in the shape the Ecomsixx dashboard
   uses: its status, what it does, "Set up" opening the steps and the fields,
   Connect, the values to copy back into Meta or Google, and a two-step
   Disconnect.

   The status is the 014 measurement, not this card's opinion: after Connect
   the page reloads its facts, and the pill says what n8n now actually holds.

   Secret fields are password inputs that the browser is told not to fill or
   remember, and they are cleared after every attempt, successful or not.
   ========================================================================= */

type Field = { key: string; label: string; kind: string; required: boolean; placeholder?: string; help?: string };
type StateKey = "connected" | "not_connected" | "could_not_check";

const PILL: Record<StateKey, string> = { connected: "confirmed", not_connected: "hot", could_not_check: "cold" };
const WORDS: Record<StateKey, string> = { connected: "Connected", not_connected: "Not connected", could_not_check: "Could not check" };

export function ConnectCard({
  connectorKey,
  label,
  what,
  steps,
  fields,
  state,
  missing,
  summary,
  copy,
  connected,
  activate,
  canWrite,
  notYet,
}: {
  connectorKey: string;
  label: string;
  what: string;
  steps: string[];
  fields: Field[];
  state: StateKey;
  missing: { what: string; from: string }[];
  /** What was connected, already redacted on the server: "From +44...", "Token set, ends in ...a91c". */
  summary: string[];
  /** Values the owner must paste into Meta or Google. */
  copy: { label: string; value: string }[];
  /** Connected from this dashboard, so Disconnect applies. */
  connected: boolean;
  /** A workflow this card may switch on, when it is off. */
  activate?: string;
  canWrite: boolean;
  /** Shown instead of a form, for a channel this screen cannot connect yet. */
  notYet?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmingOn, setConfirmingOn] = useState(false);
  const [pending, start] = useTransition();
  const formId = useId();

  function run(fn: () => Promise<ScreenResult>, closeOnOk = false) {
    start(async () => {
      const r = await attempt(fn);
      setResult({ ok: r.ok, message: r.message ?? "", errors: "errors" in r ? r.errors : undefined, workflows: "workflows" in r ? r.workflows : undefined });
      /* Secrets never linger in the page, whatever happened. */
      setValues((v) => Object.fromEntries(Object.entries(v).filter(([k]) => !fields.find((f) => f.key === k && f.kind === "secret"))));
      if (r.ok && closeOnOk) setOpen(false);
      setConfirming(false);
    });
  }

  const input =
    "min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink outline-none transition-colors " +
    "focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:opacity-60";
  const btn =
    "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-4 text-[13.5px] font-medium transition-colors duration-150 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4 shadow-[var(--e1)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-sans text-[14.5px] font-medium text-ink">{label}</h3>
        <Pill kind={PILL[state]}>{WORDS[state]}</Pill>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-muted">{what}</p>

      {summary.length ? (
        <ul className="mt-2 grid gap-0.5 text-[12.5px] text-ink">
          {summary.map((s) => <li key={s}>{s}</li>)}
        </ul>
      ) : null}

      {state !== "connected" && missing.length ? (
        <ul className="mt-2 grid gap-1">
          {missing.map((m) => (
            <li key={m.what} className="text-[12.5px] leading-snug text-ink">{m.what}.</li>
          ))}
        </ul>
      ) : null}

      {copy.length ? (
        <dl className="mt-3 grid gap-2">
          {copy.map((c) => (
            <div key={c.label} className="min-w-0">
              <dt className="font-mono text-[11.5px] font-medium uppercase tracking-[0.1em] text-muted">{c.label}</dt>
              <dd className="mt-0.5 flex min-w-0 items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-warm px-2 py-1.5 font-mono text-[12px] text-ink">{c.value}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(c.value)}
                  className={`${btn} min-h-9 border border-line px-2.5 text-[12px] text-ink hover:bg-warm`}
                  aria-label={`Copy ${c.label}`}
                >
                  Copy
                </button>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {notYet ? (
          <p className="text-[12.5px] text-muted">{notYet}</p>
        ) : !canWrite ? (
          <p className="text-[12.5px] text-muted">Read only until a dashboard password is set and the routing store can be reached.</p>
        ) : (
          <>
            {fields.length || connectorKey === "google_lead_form" ? (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={formId}
                className={`${btn} ${connected ? "border border-line text-ink hover:bg-warm" : "bg-inverse text-oninverse hover:opacity-90"}`}
              >
                {open ? "Close" : connected ? "Change" : "Set up"}
              </button>
            ) : null}
            {activate ? (
              /* Asks first: switching a workflow on starts messages going to
                 real people, which is the direction a mis-click costs. */
              confirmingOn ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] text-ink">
                    {activate === "Sequence Worker" ? "Start sending follow-ups to real people?" : "Start reading the reply mailbox?"}
                  </span>
                  <button type="button" disabled={pending} onClick={() => { setConfirmingOn(false); run(() => activateAction(activate)); }} className={`${btn} bg-inverse text-oninverse hover:opacity-90`}>
                    {pending ? "Switching on…" : "Yes, switch it on"}
                  </button>
                  <button type="button" onClick={() => setConfirmingOn(false)} className={`${btn} border border-line text-ink hover:bg-warm`}>Not yet</button>
                </span>
              ) : (
                <button type="button" disabled={pending} onClick={() => setConfirmingOn(true)} className={`${btn} bg-inverse text-oninverse hover:opacity-90`}>
                  {`Switch ${activate} on`}
                </button>
              )
            ) : null}
            {connected ? (
              confirming ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] text-ink">Disconnect {label}? It stops working straight away.</span>
                  <button type="button" disabled={pending} onClick={() => run(() => disconnectAction(connectorKey))} className={`${btn} bg-[#b42318] text-white hover:bg-[#912018]`}>
                    {pending ? "Disconnecting…" : "Yes, disconnect"}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className={`${btn} border border-line text-ink hover:bg-warm`}>Keep it</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(true)} className={`${btn} border border-line text-muted hover:bg-warm hover:text-ink`}>
                  Disconnect
                </button>
              )
            ) : null}
          </>
        )}
      </div>

      {open ? (
        <form
          id={formId}
          className="mt-4 grid gap-3 border-t border-line pt-4"
          autoComplete="off"
          onSubmit={(e) => { e.preventDefault(); run(() => connectAction(connectorKey, values), true); }}
        >
          <ol className="grid list-decimal gap-1 pl-5 text-[13px] leading-snug text-ink">
            {steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          {fields.map((f) => {
            const id = `${formId}-${f.key}`;
            const err = result?.errors?.[f.key];
            return (
              <div key={f.key} className="grid gap-1">
                <label htmlFor={id} className="text-[12.5px] font-medium text-ink">
                  {f.label}{f.required ? "" : " (optional)"}
                </label>
                <input
                  id={id}
                  name={f.key}
                  type={f.kind === "secret" ? "password" : f.kind === "email" ? "email" : f.kind === "number" ? "number" : f.kind === "url" ? "url" : "text"}
                  inputMode={f.kind === "phone" ? "tel" : f.kind === "number" ? "numeric" : undefined}
                  autoComplete={f.kind === "secret" ? "new-password" : "off"}
                  spellCheck={false}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  aria-invalid={err ? true : undefined}
                  aria-describedby={err || f.help ? `${id}-note` : undefined}
                  className={input}
                  disabled={pending}
                />
                {err || f.help ? (
                  <p id={`${id}-note`} className={`text-[12px] ${err ? "text-[#912018] dark:text-[#fda29b]" : "text-muted"}`}>{err ?? f.help}</p>
                ) : null}
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={pending} className={`${btn} bg-inverse text-oninverse hover:opacity-90`}>
              {pending ? "Checking with the provider…" : connected ? "Save the new values" : "Connect"}
            </button>
            <span className="text-[12px] text-muted">The values are checked with the provider before anything is saved.</span>
          </div>
        </form>
      ) : null}

      {result ? (
        <div
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-[12.5px] leading-snug ${
            result.ok ? "bg-warm text-ink" : "bg-[#b42318]/10 text-[#912018] dark:bg-[#f97066]/12 dark:text-[#fda29b]"
          }`}
        >
          <p className="flex items-start gap-1.5">
            {result.ok ? <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>{result.message}</span>
          </p>
          {result.workflows?.length ? (
            <ul className="mt-1 grid gap-0.5 pl-5 text-[12px]">
              {result.workflows.map((w) => (
                <li key={w.workflow}>{w.workflow}: {w.saved ? "updated" : w.why ?? "not updated"}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
