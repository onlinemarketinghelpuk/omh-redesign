"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { NAV_ICON, IconSearch } from "./icons";

/* =========================================================================
   "Search or jump", Ecomsixx's command palette (plan 016).

   One palette per page, mounted by the Shell. It opens on Command-K (or
   Control-K), and on any PaletteButton, which announce themselves with a
   window event so the sidebar, the top bar and the phone bar can each have a
   button without passing state between them.

   Type to filter the screens, arrows to move, Enter to go, Escape to close
   (focus goes back to what opened it).
   ========================================================================= */

type Tab = { href: string; label: string; group: string };
const OPEN = "omh:palette";

export function openPalette() {
  window.dispatchEvent(new Event(OPEN));
}

export function PaletteButton({ variant }: { variant: "sidebar" | "topbar" | "icon" }) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search or jump to a screen"
        className="dash-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#141416] transition-colors hover:bg-[#faf8f5]"
      >
        <IconSearch className="h-4 w-4" />
      </button>
    );
  }
  const topbar = variant === "topbar";
  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Search or jump to a screen (Command K)"
      className={
        topbar
          ? "dash-focus group flex h-9 min-w-[260px] items-center gap-2 rounded-full bg-white pl-3 pr-1.5 text-[13px] text-[#71717a] ring-1 ring-[#141416]/10 transition-[color,box-shadow] duration-150 hover:text-[#141416] hover:ring-[#7d5c33]/30"
          : "dash-focus flex h-8 w-full items-center justify-between gap-2 rounded-md bg-white px-2 text-[13px] text-[#71717a] ring-1 ring-[#141416]/10 transition-[color,box-shadow] duration-150 hover:text-[#141416] hover:ring-[#7d5c33]/30"
      }
    >
      <span className="inline-flex flex-1 items-center gap-2 text-left">
        <IconSearch className="h-3.5 w-3.5" />
        Search or jump…
      </span>
      {topbar ? (
        <span className="flex items-center gap-0.5">
          <span className="dash-kbd">⌘</span>
          <span className="dash-kbd">K</span>
        </span>
      ) : (
        <span className="font-mono text-[10.5px]">⌘K</span>
      )}
    </button>
  );
}

export function Palette({ tabs, groups, demo }: { tabs: Tab[]; groups: { key: string; label: string }[]; demo: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);
  const listId = useId();

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement;
      setQ("");
      setAt(0);
      setOpen(true);
    };
    /* Capture phase, and stop it there: the website's own search
       (components/layout/SiteSearch.tsx) stays mounted under the dashboard
       and opens a modal <dialog> on the same shortcut. That dialog took
       focus and made this palette inert, so typed keys went nowhere.
       `key` can be undefined on autofill's synthetic keydowns. */
    const onKey = (e: KeyboardEvent) => {
      if (typeof e.key !== "string") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopImmediatePropagation();
        show();
      }
    };
    window.addEventListener(OPEN, show);
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener(OPEN, show);
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, []);

  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? tabs.filter((t) => t.label.toLowerCase().includes(s)) : tabs;
  }, [q, tabs]);

  function close() {
    setOpen(false);
    (opener.current as HTMLElement | null)?.focus?.();
  }
  function go(t: Tab) {
    setOpen(false);
    router.push(demo ? `${t.href}?demo=1` : t.href);
  }

  if (!open) return null;
  const groupLabel = (k: string) => groups.find((g) => g.key === k)?.label ?? "";

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={close} className="absolute inset-0 cursor-default bg-[#1c140b]/25 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search or jump to a screen"
        className="nx-view-in relative w-full max-w-[560px] overflow-hidden rounded-[16px] bg-white"
        style={{ border: "1px solid var(--nx-line)", boxShadow: "var(--nx-shadow-lift)" }}
      >
        <div className="flex items-center gap-2.5 border-b border-[#141416]/[0.07] px-4">
          <IconSearch className="h-4 w-4 text-[#71717a]" />
          {/* autoFocus, not an effect: an effect focuses a frame after the
              palette appears, and keys typed straight after Command-K (as a
              fast typist does) landed nowhere. Found by driving it. */}
          <input
            ref={input}
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setAt(0); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); close(); }
              else if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(found.length - 1, i + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); }
              else if (e.key === "Enter" && found[at]) { e.preventDefault(); go(found[at]); }
            }}
            placeholder="Search or jump to a screen…"
            aria-controls={listId}
            aria-activedescendant={found[at] ? `${listId}-${at}` : undefined}
            className="h-12 flex-1 bg-transparent text-[14px] text-[#141416] outline-none placeholder:text-[#a1a1aa]"
          />
          <span className="dash-kbd">esc</span>
        </div>
        <ul id={listId} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {found.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px] text-[#52525b]">Nothing called that.</li>
          ) : (
            found.map((t, i) => {
              const Icon = NAV_ICON[t.href as keyof typeof NAV_ICON];
              return (
                <li key={t.href} id={`${listId}-${i}`} role="option" aria-selected={i === at}>
                  <button
                    type="button"
                    onMouseEnter={() => setAt(i)}
                    onClick={() => go(t)}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] text-[#141416] transition-colors ${i === at ? "bg-[#f3eee7]" : ""}`}
                  >
                    {Icon ? <Icon className="h-[15px] w-[15px] text-[#8f8578]" /> : null}
                    <span className="flex-1">{t.label}</span>
                    <span className="dash-eyebrow">{groupLabel(t.group)}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
