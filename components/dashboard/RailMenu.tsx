"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_ICON } from "./icons";
import { PaletteButton } from "./Palette";
import type { Tab } from "./NavItem";

/* =========================================================================
   The navigation below 1024px, in the Ecomsixx dashboard's design (plan 016):
   a light bar that stays at the top (the mark, the current screen, search,
   the menu), and a sheet with every screen in its group. The bottom tab bar
   opens the same sheet from its "More" button, through a window event.

   It closes on Escape (focus back to the button), on the backdrop, and on
   arriving at a new screen: the sheet remembers which screen it was opened
   on, so a new pathname means closed, with no effect needed.
   ========================================================================= */

const OPEN = "omh:menu";
export function openMenu() {
  window.dispatchEvent(new Event(OPEN));
}

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
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const to = (href: string) => (demo ? `${href}?demo=1` : href);

  useEffect(() => {
    const show = () => setOpenOn(window.location.pathname);
    window.addEventListener(OPEN, show);
    return () => window.removeEventListener(OPEN, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const current = tabs.find((t) => t.href === active);

  return (
    <header className="sticky top-0 z-40 border-b border-[#141416]/[0.07] bg-white/90 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href={to("/lead-dashboard")} className="dash-focus flex shrink-0 items-center gap-2 rounded-md">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[#7d5c33] font-heading text-[13px] font-semibold text-white">O</span>
        </Link>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#141416]">{current?.label ?? "Dashboard"}</span>
        <PaletteButton variant="icon" />
        <button
          ref={button}
          type="button"
          onClick={() => setOpenOn(open ? null : pathname)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="dash-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#141416] transition-colors hover:bg-[#faf8f5]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close the menu"
            tabIndex={-1}
            onClick={() => setOpenOn(null)}
            className="fixed inset-x-0 bottom-0 top-14 z-30 cursor-default bg-[#1c140b]/30 backdrop-blur-sm"
          />
          <nav
            id={panelId}
            aria-label="All screens"
            className="relative z-40 max-h-[80dvh] space-y-3 overflow-y-auto border-t border-[#141416]/[0.07] bg-[#fdfcfa] px-3 py-3"
          >
            {groups.map((g) => (
              <div key={g.key}>
                <div className="dash-eyebrow mb-1 px-3">{g.label}</div>
                <div className="grid grid-cols-1 gap-0.5 min-[520px]:grid-cols-2">
                  {tabs.filter((t) => t.group === g.key).map((t) => {
                    const Icon = NAV_ICON[t.href as keyof typeof NAV_ICON];
                    const n = counts[t.href];
                    const isUrgent = urgent.includes(t.href);
                    const show = typeof n === "number" && !(isUrgent && n === 0);
                    return (
                      <Link
                        key={t.href}
                        href={to(t.href)}
                        onClick={() => setOpenOn(null)}
                        aria-current={t.href === active ? "page" : undefined}
                        className={`dash-nav dash-focus min-h-11 ${t.href === active ? "dash-nav-active" : ""}`}
                      >
                        {Icon ? <Icon /> : null}
                        <span className="flex-1">{t.label}</span>
                        {show ? <span className={`dash-count ${isUrgent && (n ?? 0) > 0 ? "dash-count-urgent" : ""}`}>{(n ?? 0) > 99 ? "99+" : n}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 border-t border-[#141416]/[0.07] px-1 pt-3">{children}</div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
