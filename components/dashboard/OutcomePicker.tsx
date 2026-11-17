"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { setLeadOutcome, type OutcomeService } from "@/app/lead-dashboard/leads/actions";
import { outcomeLabel, money } from "@/lib/dashboard/channels";
import { IconCheck, IconSort } from "./icons";
import { attempt } from "@/lib/dashboard/attempt";
import {
  serviceCatalogue,
  findServiceOption,
  termTotalGbp,
  type ServiceOption,
} from "@/lib/dashboard/service-catalogue";

/* =========================================================================
   What came of a lead.

   A small control, and the one that turns every channel figure on this
   dashboard from volume into business: without it, "which channel works"
   can only be answered in leads, and leads are not what anybody is paid in.

   Three decisions worth stating:

   1. **It is a menu, not free text.** Five outcomes, always the same five, so
      a report can group by them. Free text would make the Channels report
      impossible within a week.
   2. **A value is asked for only on a win**, and only then. Nothing else has
      a number worth storing, and a figure left behind on a lead that later
      went to "lost" would quietly inflate every revenue total.
   3. **It saves on choosing, with no separate save button where possible.**
      The service dropdown and the two prefilled figures (monthly and term)
      save on the click. Typing a custom amount needs an Enter or a Save, so
      a half-typed number is not committed.

   Service catalogue is derived from `lib/content/price-list.ts` at build
   time; the dashboard never retypes a price. The field is still editable
   and still skippable: a win with no number is honest, and a figure that
   was negotiated down is a `custom` basis that is not overwritten on the
   next save.
   ========================================================================= */

const CHOICES = ["open", "quoted", "won", "lost", "unqualified"] as const;

/* The list the dropdown renders, grouped by service title in catalogue
   order. Computed once per module load; the catalogue never changes at
   runtime. */
const GROUPS: { title: string; serviceId: string; options: ServiceOption[] }[] = (() => {
  const by = new Map<string, ServiceOption[]>();
  for (const o of serviceCatalogue) {
    by.set(o.serviceId, [...(by.get(o.serviceId) ?? []), o]);
  }
  return [...by.entries()].map(([serviceId, options]) => ({
    serviceId,
    title: options[0]?.serviceTitle ?? serviceId,
    options,
  }));
})();

export function OutcomePicker({
  leadId,
  outcome,
  valueGbp,
  serviceKey,
  packageLabel,
  valueBasis,
  canWrite,
  demo = false,
}: {
  leadId: string;
  outcome: string | null;
  valueGbp: number | null;
  serviceKey?: string | null;
  packageLabel?: string | null;
  valueBasis?: string | null;
  canWrite: boolean;
  /* On the example data the control opens and responds and saves nothing.

     A read-only word here was correct and useless: this is the one control
     the conversation page exists for, and somebody being shown the system
     could not press it. Saying "nothing was changed" at the moment of the
     press is better than a dead label, because the press is the moment
     anybody would assume it had been. */
  demo?: boolean;
}) {
  const [current, setCurrent] = useState(outcome);
  const [value, setValue] = useState<number | null>(valueGbp);
  const [storedServiceKey, setStoredServiceKey] = useState<string | null>(serviceKey ?? null);
  const [storedPackageLabel, setStoredPackageLabel] = useState<string | null>(packageLabel ?? null);
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [amount, setAmount] = useState("");
  const [pickedKey, setPickedKey] = useState<string>(serviceKey ?? "");
  /* Which figure the user confirms when they press Save in the amount box:
     an explicit choice of monthly or term is kept; a typed custom number
     stays "custom" and is not re-written by the catalogue later. */
  const [basis, setBasis] = useState<OutcomeService["valueBasis"]>(
    (valueBasis as OutcomeService["valueBasis"]) ?? "custom",
  );

  /* What to say about the last attempt.

     Success used to say nothing at all: the control simply became the new
     value. On a fast save that is indistinguishable from a click that did
     nothing, and picking the outcome a lead already had changed nothing on
     screen whatsoever. This is the field every channel figure is built on,
     so "did that land?" is a question worth never having to ask.

     `ok` clears itself after a moment; a failure stays until the next
     attempt, because an error that vanishes is an error nobody read. */
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const clearer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function say(text: string, ok: boolean) {
    clearTimeout(clearer.current);
    setNote({ text, ok });
    if (ok) clearer.current = setTimeout(() => setNote(null), 2600);
  }

  /* A timer outliving the row it belonged to would set state on something
     that is gone: these live in a table whose rows come and go with a
     filter. */
  useEffect(() => () => clearTimeout(clearer.current), []);
  const [pending, start] = useTransition();
  /* Which way the menu opens. A row can be anywhere in a table of sixty, and
     opening downward from the last row put the final option below the fold
     with no way to reach it. Measured on open rather than guessed. */
  const [up, setUp] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);

  const picked = useMemo(
    () => (pickedKey ? findServiceOption(pickedKey) : undefined),
    [pickedKey],
  );
  const pickedTerm = picked ? termTotalGbp(picked) : null;

  function openMenu() {
    const box = anchor.current?.getBoundingClientRect();
    /* Five options plus padding. Flip when there is not room for them. */
    if (box) setUp(window.innerHeight - box.bottom < 230);
    setOpen(true);
  }

  function save(next: string, gbp: number | undefined, service?: OutcomeService) {
    setOpen(false);
    setAsking(false);
    if (demo) {
      setCurrent(next);
      setValue(next === "won" ? (gbp ?? null) : null);
      setStoredServiceKey(next === "won" ? (service?.serviceKey ?? null) : null);
      setStoredPackageLabel(next === "won" ? (service?.packageLabel ?? null) : null);
      say("Example data. Nothing was saved.", false);
      return;
    }
    start(async () => {
      const r = await attempt(() => setLeadOutcome(leadId, next, gbp, service));
      if (r.ok) {
        setCurrent(next);
        setValue(next === "won" ? (gbp ?? null) : null);
        setStoredServiceKey(next === "won" ? (service?.serviceKey ?? null) : null);
        setStoredPackageLabel(next === "won" ? (service?.packageLabel ?? null) : null);
        say("Saved", true);
      } else {
        /* The value on screen is deliberately left alone: it still shows
           what is actually in the database, not what was asked for. */
        say(r.message ?? "That did not save", false);
      }
    });
  }

  function serviceFields(opt: ServiceOption | undefined, forBasis: OutcomeService["valueBasis"]): OutcomeService {
    if (!opt) return { valueBasis: "custom" };
    return {
      serviceKey: opt.key,
      packageLabel: opt.packageLabel,
      monthlyGbp: opt.monthlyGbp ?? undefined,
      months: opt.months ?? undefined,
      valueBasis: forBasis,
    };
  }

  if (!canWrite && !demo) {
    return (
      <span className="text-[13px] text-muted">{outcomeLabel(current)}</span>
    );
  }

  /* Asking for the amount. Skippable: a business that does not want to type
     numbers should still be able to record the win. */
  if (asking) {
    return (
      <div className="flex min-w-[260px] flex-col gap-2.5 rounded-xl border border-line bg-surface p-3 text-left" style={{ boxShadow: "var(--e2)" }}>
        {/* Service and package dropdown, grouped by service. Grouped so
            "SEO Seed" under SEO and the same name under Local SEO are not
            next to each other in a single flat list. */}
        <label className="flex flex-col gap-1 text-[12px] text-muted">
          Service and package
          <select
            value={pickedKey}
            onChange={(e) => {
              const key = e.target.value;
              setPickedKey(key);
              const opt = key ? findServiceOption(key) : undefined;
              if (opt && opt.monthlyGbp !== null) {
                setAmount(String(opt.monthlyGbp));
                setBasis("monthly");
              }
            }}
            aria-label="Service and package"
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-ink outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-rgb)/.35)]"
          >
            <option value="">— not from the catalogue —</option>
            {GROUPS.map((g) => (
              <optgroup key={g.serviceId} label={g.title}>
                {g.options.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.packageLabel}
                    {o.monthlyGbp !== null ? ` · ${money(o.monthlyGbp)}` : ""}
                    {o.months !== null ? ` / ${o.months}mo` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {picked && (
          <div className="text-[12.5px] text-muted">
            {/* Why the number is what it is, in a sentence, so anybody
                revisiting the lead in a month can see which figure was
                confirmed. "£450 a month, 3 month contract. £1,350 over the
                term." */}
            <p>
              <span className="font-medium text-ink">{picked.serviceTitle}, {picked.packageLabel}.</span>{" "}
              {picked.monthlyGbp !== null ? `${money(picked.monthlyGbp)} a month` : "price not published"}
              {picked.months !== null ? `, ${picked.months} month contract` : ""}
              {pickedTerm !== null ? `. ${money(pickedTerm)} over the term.` : "."}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {picked.monthlyGbp !== null && (
                <button
                  type="button"
                  onClick={() => save("won", picked.monthlyGbp!, serviceFields(picked, "monthly"))}
                  className="min-h-8 cursor-pointer rounded-lg border border-line bg-warm px-2.5 text-[12.5px] text-ink outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Use {money(picked.monthlyGbp)} / month
                </button>
              )}
              {pickedTerm !== null && pickedTerm !== picked.monthlyGbp && (
                <button
                  type="button"
                  onClick={() => save("won", pickedTerm, serviceFields(picked, "term"))}
                  className="min-h-8 cursor-pointer rounded-lg border border-line bg-warm px-2.5 text-[12.5px] text-ink outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Use {money(pickedTerm)} over the term
                </button>
              )}
            </div>
          </div>
        )}

        <span className="inline-flex items-center gap-1.5">
          <span className="text-[13px] text-muted">£</span>
          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              /* A typed figure is not a catalogue figure. If it matches the
                 one-press monthly or term the basis stays as it was, else
                 it becomes custom — and custom is not auto-overwritten. */
              const n = e.target.value ? Number(e.target.value) : NaN;
              if (!picked) { setBasis("custom"); return; }
              if (n === picked.monthlyGbp) setBasis("monthly");
              else if (pickedTerm !== null && n === pickedTerm) setBasis("term");
              else setBasis("custom");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") save("won", amount ? Number(amount) : undefined, serviceFields(picked, basis));
              if (e.key === "Escape") setAsking(false);
            }}
            placeholder="value"
            aria-label="Deal value in pounds"
            className="w-[110px] rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-ink outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-rgb)/.35)]"
          />
          <button
            type="button"
            onClick={() => save("won", amount ? Number(amount) : undefined, serviceFields(picked, basis))}
            className="min-h-8 cursor-pointer rounded-lg bg-inverse px-2.5 text-[12.5px] font-medium text-oninverse outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="min-h-8 cursor-pointer rounded-lg px-2 text-[12.5px] text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Cancel"
          >
            Cancel
          </button>
        </span>
      </div>
    );
  }

  if (open) {
    return (
      <span
        className="relative inline-flex"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <span
          role="menu"
          className={[
            "absolute right-0 z-20 flex min-w-[150px] flex-col overflow-hidden rounded-xl border border-line bg-surface py-1",
            up ? "bottom-0" : "top-0",
          ].join(" ")}
          style={{ boxShadow: "var(--e2), var(--ring-inset)" }}
        >
          {CHOICES.map((c) => (
            <button
              key={c}
              type="button"
              role="menuitem"
              autoFocus={c === CHOICES[0]}
              onClick={() => {
                if (c === "won") {
                  setAmount(value ? String(value) : "");
                  setAsking(true);
                  setOpen(false);
                } else {
                  save(c, undefined);
                }
              }}
              className="flex min-h-9 cursor-pointer items-center gap-2 px-3 text-left text-[13px] text-ink outline-none transition-colors duration-150 hover:bg-warm focus-visible:bg-warm"
            >
              {current === c ? (
                <IconCheck className="h-3.5 w-3.5 text-[var(--dash-accent-text)]" />
              ) : (
                <span className="w-3.5" />
              )}
              {outcomeLabel(c)}
            </button>
          ))}
        </span>
      </span>
    );
  }

  const won = current === "won";
  const decided = current === "won" || current === "lost" || current === "unqualified";

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
    <button
      type="button"
      ref={anchor}
      disabled={pending}
      onClick={openMenu}
      aria-expanded={open}
      aria-label={`Outcome: ${outcomeLabel(current)}. Change it.`}
      className={[
        "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[13px] outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        won
          ? "border-[rgb(var(--accent-rgb)/.4)] bg-[rgb(var(--accent-rgb)/.12)] font-medium text-ink"
          : decided
            ? "border-line bg-warm text-ink"
            : "border-dashed border-line text-muted hover:bg-warm hover:text-ink",
      ].join(" ")}
    >
      {pending ? "Saving…" : outcomeLabel(current)}
      {won && value ? (
        <span className="tabular-nums">{money(value)}</span>
      ) : null}
      <IconSort className="h-3 w-3 opacity-50" />
    </button>
    {won && storedPackageLabel && (
      /* The service and package beside the figure, so the number can be read
         back as "Seed SMM, £450" rather than just "£450". A month later this
         is the only way to say which service the money came from. */
      <span className="text-[12px] text-muted" title={storedServiceKey ?? undefined}>
        {storedPackageLabel}
      </span>
    )}
    {note && (
      <span
        role="status"
        className={`text-[12.5px] ${note.ok ? "text-[var(--dash-accent-text)]" : "text-error"}`}
      >
        {note.ok ? "✓ " : ""}
        {note.text}
      </span>
    )}
    </span>
  );
}
