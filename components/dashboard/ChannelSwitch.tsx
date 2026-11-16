"use client";

import { useState, useTransition } from "react";
import { setChannelAction } from "@/app/lead-dashboard/integrations/actions";
import { attempt } from "@/lib/dashboard/attempt";
import { IconAlert, IconCheck } from "./icons";

/* =========================================================================
   One channel's switch.

   Same asymmetry as the kill switch on Settings, for the same reason.
   Switching OFF stops everything automated on the channel: one press,
   because the cost of a mistake is a few messages waiting for a person, and
   it is undone by switching back on. Switching ON starts answering and
   following people up again, so it asks first.

   It always says what happened, in numbers: how many people were paused, or
   carried on.
   ========================================================================= */

export function ChannelSwitch({
  channel,
  label,
  on: initial,
  canWrite,
}: {
  channel: string;
  label: string;
  on: boolean;
  canWrite: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function apply(next: boolean) {
    setConfirming(false);
    start(async () => {
      const r = await attempt(() => setChannelAction(channel, next));
      /* A dropped request comes back as { ok: false, message } with no
         `on`: the switch then keeps showing what it showed, which is the
         last state we know to be true. */
      if (r.ok && "on" in r && typeof r.on === "boolean") setOn(r.on);
      setNote({ ok: r.ok, text: r.message ?? "" });
    });
  }

  const btn =
    "inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-3 text-[13px] font-semibold transition-colors duration-150 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {!canWrite ? (
        <span className="text-[12.5px] text-muted">{on ? "On" : "Off"} · read only</span>
      ) : on ? (
        <button
          type="button"
          onClick={() => apply(false)}
          disabled={pending}
          aria-label={`Switch ${label} off`}
          className={`${btn} border-line bg-surface text-ink hover:bg-warm`}
        >
          {pending ? "Switching off…" : "Switch off"}
        </button>
      ) : confirming ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="text-[12.5px] text-ink">Answer and follow up {label} again?</span>
          <button
            type="button"
            onClick={() => apply(true)}
            disabled={pending}
            className={`${btn} border-transparent bg-inverse text-oninverse hover:opacity-90`}
          >
            {pending ? "Switching on…" : "Yes, switch on"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={`${btn} border-line text-ink hover:bg-warm`}
          >
            Leave it off
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          aria-label={`Switch ${label} on`}
          className={`${btn} border-transparent bg-inverse text-oninverse hover:opacity-90`}
        >
          Switch on
        </button>
      )}

      {note ? (
        <p
          role="status"
          className={[
            "flex max-w-[52ch] items-start gap-1.5 rounded-lg px-3 py-2 text-[12.5px] leading-snug",
            note.ok ? "bg-warm text-ink" : "bg-[#b42318]/10 text-[#912018] dark:bg-[#f97066]/12 dark:text-[#fda29b]",
          ].join(" ")}
        >
          {note.ok ? <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>{note.text}</span>
        </p>
      ) : null}
    </div>
  );
}
