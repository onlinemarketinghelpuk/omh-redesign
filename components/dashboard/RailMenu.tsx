"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { NavItem, type Tab } from "./NavItem";

/* =========================================================================
   The navigation below 1024px.

   It used to be the desktop rail laid sideways: one row of fifteen tabs that
   scrolled. On a 900px window six were visible, nothing said there were nine
   more, and Integrations sat 800px off the right edge. Sign out was hidden
   below 1024px altogether, so on a phone there was no way to sign out.

   Now: a bar that stays at the top while the page scrolls, saying which
   screen you are on, with a Menu button. The menu shows every screen at
   once, in the same three groups as the rail, with Sign out kept apart at
   the bottom. It closes on Escape, on the backdrop, on its own Close button,
   and when a screen is chosen.
   ========================================================================= */

export function RailMenu({
  tabs,
  groups,
  active,
  counts,
  urgent,
  demo,
  children,
}: {
  tabs: Tab[];
  groups: { key: string; label: string }[];
  active: string;
  counts: Partial<Record<string, number>>;
  urgent: string[];
  demo: boolean;
  /** The footer: example-data switch and Sign out. Rendered by the server. */
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  /* The menu remembers which screen it was opened on, so arriving on a new
     screen closes it whatever caused the navigation, with no effect needed. */
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((was: boolean) => boolean)) =>
    setOpenOn((prev) => {
      const was = prev === pathname;
      const v = typeof next === "function" ? next(was) : next;
      return v ? pathname : null;
    });
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const to = (href: string) => (demo ? `${href}?demo=1` : href);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = tabs.find((t) => t.href === active);
  /* Somebody waiting is the one thing worth seeing with the menu shut, so
     the urgent figure is carried onto the bar itself. */
  const waiting = urgent.reduce((n, h) => n + (counts[h] ?? 0), 0);

  return (
    <div className="sticky top-0 z-40 lg:hidden">
      <div className="flex min-h-14 items-center gap-3 border-b border-white/10 bg-inverse px-4">
        <Link
          href="/"
          className="font-sans text-[20px] font-bold tracking-[-.025em] text-oninverse outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          OMH<span style={{ color: "var(--accent)" }}>.</span>
        </Link>
        <span className="min-w-0 flex-1 truncate font-sans text-[14px] font-medium text-white/70">
          {current?.label ?? "Dashboard"}
        </span>
        {waiting > 0 ? (
          <Link
            href={to("/lead-dashboard/handover")}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 font-sans text-[12px] font-semibold text-[var(--color-inverse)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{ background: "var(--accent)" }}
          >
            {waiting} waiting
          </Link>
        ) : null}
        <button
          ref={button}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 px-3 font-sans text-[13.5px] font-semibold text-oninverse outline-none transition-colors duration-150 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6 6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <>
          {/* The page behind, dimmed; pressing it closes the menu. */}
          <button
            type="button"
            aria-label="Close the menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-0 cursor-default bg-black/45"
          />
          <div
            id={panelId}
            className="absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-white/10 bg-inverse px-3 pb-5 pt-3 text-oninverse shadow-[0_24px_48px_-12px_rgb(0_0_0/.5)]"
          >
            <div className="mx-auto grid max-w-[960px] gap-4">
              {groups.map((g) => {
                const items = tabs.filter((t) => t.group === g.key);
                return (
                  <section key={g.key} aria-label={g.label}>
                    <p className="px-3 pb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[.12em] text-white/45">
                      {g.label}
                    </p>
                    <ul className="grid grid-cols-1 gap-1 min-[520px]:grid-cols-2 md:grid-cols-3">
                      {items.map((t) => (
                        <li key={t.href}>
                          <NavItem
                            tab={t}
                            href={to(t.href)}
                            active={t.href === active}
                            count={counts[t.href]}
                            urgent={urgent.includes(t.href)}
                            onNavigate={() => setOpen(false)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
              {/* Sign out and the example switch, apart from the screens. */}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-1 pt-3">{children}</div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
