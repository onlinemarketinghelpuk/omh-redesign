"use client";

import Link from "next/link";
import { NAV_ICON } from "./icons";
import { openMenu } from "./RailMenu";

/* =========================================================================
   The phone's bottom tab bar, as in the Ecomsixx dashboard (plan 016): the
   four screens used most, and "More" for the rest (it opens the same sheet
   as the menu button). A count rides on the icon; a person waiting is
   filled, so it is seen without reading it.
   ========================================================================= */

const TABS = [
  { href: "/lead-dashboard", label: "Home" },
  { href: "/lead-dashboard/handover", label: "Waiting" },
  { href: "/lead-dashboard/inbox", label: "Inbox" },
  { href: "/lead-dashboard/leads", label: "Leads" },
];

export function BottomTabs({
  active,
  counts,
  urgent,
  demo,
}: {
  active: string;
  counts: Partial<Record<string, number>>;
  urgent: string[];
  demo: boolean;
}) {
  const to = (href: string) => (demo ? `${href}?demo=1` : href);
  return (
    <nav
      aria-label="Main screens"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#141416]/[0.07] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="flex items-stretch">
        {TABS.map((t) => {
          const Icon = NAV_ICON[t.href as keyof typeof NAV_ICON];
          const on = t.href === active;
          const n = counts[t.href] ?? 0;
          const isUrgent = urgent.includes(t.href);
          return (
            <Link
              key={t.href}
              href={to(t.href)}
              aria-current={on ? "page" : undefined}
              aria-label={n > 0 ? `${t.label}, ${n}${isUrgent ? " waiting" : ""}` : undefined}
              className={`dash-focus relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10.5px] font-medium transition-colors ${
                on ? "text-[#7d5c33]" : "text-[#52525b]"
              }`}
            >
              <span className="relative">
                {Icon ? <Icon className="h-5 w-5" /> : null}
                {n > 0 ? (
                  <span
                    className={`tnum absolute -right-3 -top-1.5 min-w-[18px] rounded-full px-1 text-center text-[9.5px] font-semibold leading-[16px] ring-2 ring-white ${
                      isUrgent ? "bg-[#7d5c33] text-white" : "bg-[#f3eee7] text-[#7d5c33]"
                    }`}
                  >
                    {n > 9 ? "9+" : n}
                  </span>
                ) : null}
              </span>
              {t.label}
              {on ? <span aria-hidden className="absolute top-0 h-[2px] w-8 rounded-full bg-[#7d5c33]" /> : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openMenu}
          className="dash-focus flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10.5px] font-medium text-[#52525b]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          More
        </button>
      </div>
    </nav>
  );
}
