import Link from "next/link";
import { NAV_ICON } from "./icons";

/* =========================================================================
   One link in the dashboard's navigation.

   Shared by the desktop rail (Shell.tsx) and the phone menu (RailMenu.tsx),
   so the two cannot drift: the same label, icon, count and active marker in
   both. No "use client" here on purpose; it renders in either.
   ========================================================================= */

export type Tab = { href: string; label: string; group: string };

export function NavItem({
  tab,
  active,
  count,
  urgent,
  href,
  onNavigate,
}: {
  tab: Tab;
  active: boolean;
  count?: number;
  urgent: boolean;
  href: string;
  onNavigate?: () => void;
}) {
  const Icon = NAV_ICON[tab.href as keyof typeof NAV_ICON];
  /* A count of nobody waiting is not shown at all. */
  const showCount = typeof count === "number" && !(urgent && count === 0);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      /* Read out as "Leads, 329" rather than "Leads329", and an urgent figure
         says what it means rather than being a number in another colour. */
      aria-label={showCount ? (urgent ? `${tab.label}, ${count} waiting` : `${tab.label}, ${count}`) : undefined}
      className={`group flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 py-2 font-sans text-[14px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:min-h-10 ${
        active
          ? "bg-white/[.09] text-oninverse shadow-[inset_0_1px_0_rgb(255_255_255/.09)]"
          : "text-white/60 hover:bg-white/5 hover:text-white/90"
      }`}
    >
      {Icon ? <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "" : "opacity-70"}`} /> : null}
      <span className="min-w-0 flex-1 truncate">{tab.label}</span>
      {showCount ? (
        /* An urgent figure is a person waiting, so it is filled; a running
           total is outlined. Never only a colour: the label says what it is. */
        <span
          className={`rounded-full px-1.5 py-0.5 font-sans text-[11px] font-semibold tabular-nums ${
            urgent && (count ?? 0) > 0 ? "text-[var(--color-inverse)]" : "bg-white/10 text-white/70"
          }`}
          style={urgent && (count ?? 0) > 0 ? { background: "var(--accent)" } : undefined}
        >
          {count}
        </span>
      ) : null}
      {/* The active marker is a shape, not only a colour. */}
      <span
        aria-hidden="true"
        className={`h-5 w-[3px] shrink-0 rounded-full ${active ? "" : "opacity-0"}`}
        style={{ background: "var(--accent)" }}
      />
    </Link>
  );
}
