import Link from "next/link";
import { IconSignOut, NAV_ICON, IconPower } from "./icons";
import type { Tab } from "./NavItem";
import { RailMenu } from "./RailMenu";
import { BottomTabs } from "./BottomTabs";
import { Palette, PaletteButton } from "./Palette";
import { getInbox } from "@/lib/dashboard/handover";
import { getOutbound } from "@/lib/dashboard/routing";
import { dashboardLocked, dashboardUser } from "@/lib/dashboard/auth";
import { signOut } from "@/app/lead-dashboard/login/actions";
import { TABS, TAB_GROUPS } from "@/lib/dashboard/screens";

/* =========================================================================
   The frame every dashboard screen sits in, in the Ecomsixx dashboard's
   design (plan 016), with OHM's bronze as the brand colour.

   Desktop: a light 232px sidebar (the mark and a Live marker, the workspace,
   "Search or jump", the screens in three groups, the signed-in user), a top
   bar (breadcrumbs, the search pill, whether automated messages are running),
   then the screen: a 24px Geist title, a 13px description, "Updated just
   now", the content rising in.

   Phone: a light bar at the top with a menu sheet, the current group's
   screens as a row of pills, and a bottom tab bar.

   Every link carries ?demo=1 while the example data is on, so a meeting
   never drops back to the real (mostly empty) figures by accident.
   ========================================================================= */

export async function Shell({
  children,
  active,
  title,
  lead,
  counts = {},
  urgent = [],
  toolbar,
  demo = false,
}: {
  children: React.ReactNode;
  active: string;
  title: string;
  lead?: string;
  /** Optional figure beside a nav item, so the rail itself carries data. */
  counts?: Partial<Record<string, number>>;
  /** Nav items whose figure means someone is waiting, not just a total. */
  urgent?: string[];
  /** Controls that belong to this page, shown on the right of its header. */
  toolbar?: React.ReactNode;
  /** Serving the example data rather than the real thing. See lib/dashboard/demo.ts. */
  demo?: boolean;
}) {
  /* How many people are waiting for an answer, fetched here so the figure is
     on the rail on every screen; and whether anything automated is going
     out, the one state worth seeing from anywhere. */
  const [inbox, outbound] = await Promise.all([getInbox(), demo ? Promise.resolve({ enabled: true }) : getOutbound()]);
  const rail = { "/lead-dashboard/handover": inbox.waiting, ...counts };
  const allUrgent = ["/lead-dashboard/handover", ...urgent];
  const tabs = TABS as readonly Tab[];

  return (
    <div id="omh-dashboard" className="min-h-dvh bg-white text-[#141416]">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#141416] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <Rail active={active} counts={rail} urgent={allUrgent} demo={demo} />

      <div className="pb-16 lg:pb-0 lg:pl-[232px]">
        {/* The desktop top bar. */}
        <div className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b border-[#141416]/[0.07] bg-white/90 px-8 backdrop-blur-xl lg:flex">
          <Breadcrumbs active={active} title={title} demo={demo} />
          <div className="ml-auto flex items-center gap-2">
            <PaletteButton variant="topbar" />
            <OutboundState enabled={outbound ? outbound.enabled : null} demo={demo} />
          </div>
        </div>

        {/* Loud on purpose, at the top of every screen: a figure read off a
            demonstration must never be repeated later as something that happened. */}
        {demo ? <DemoBanner /> : null}

        <main id="dashboard-main" tabIndex={-1} className="mx-auto w-full max-w-[1320px] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-5">
            <div className="min-w-0">
              <h1 className="text-balance font-heading text-[22px] font-medium leading-[1.1] tracking-[-0.01em] text-[color:var(--nx-ink)] sm:text-[24px]">
                {title}
              </h1>
              {lead && <p className="mt-2 max-w-2xl text-pretty text-[13px] leading-[1.55] text-[color:var(--nx-ink-70)]">{lead}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--nx-ink-45)] sm:flex">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                {demo ? "Example data" : "Updated just now"}
              </span>
              {toolbar}
            </div>
          </div>
          <div className="nx-view-in">{children}</div>
        </main>
      </div>

      <BottomTabs active={active} counts={rail} urgent={allUrgent} demo={demo} />
      <Palette tabs={[...tabs]} groups={[...TAB_GROUPS]} demo={demo} />
    </div>
  );
}

/* ----------------------------------------------------------- top bar */

function Breadcrumbs({ active, title, demo }: { active: string; title: string; demo: boolean }) {
  const tab = (TABS as readonly Tab[]).find((t) => t.href === active);
  const group = TAB_GROUPS.find((g) => g.key === tab?.group);
  const sep = <span aria-hidden="true" className="text-[#9ca3af]">/</span>;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-[#52525b]">
      <Link href={demo ? "/lead-dashboard?demo=1" : "/lead-dashboard"} className="shrink-0 transition-colors hover:text-[#141416]">
        Dashboard
      </Link>
      {group ? (
        <>
          {sep}
          <span className="shrink-0">{group.label}</span>
        </>
      ) : null}
      {sep}
      <span className="truncate text-[#141416]">{tab?.label ?? title}</span>
    </nav>
  );
}

/* Ecomsixx keeps "Pause AI" in the top bar. Here the same place says whether
   automated messages are going out, and goes to the switch on Settings. */
function OutboundState({ enabled, demo }: { enabled: boolean | null; demo: boolean }) {
  const label = enabled === null ? "Messages: could not check" : enabled ? "Messages running" : "Messages stopped";
  return (
    <Link
      href={demo ? "/lead-dashboard/settings?demo=1" : "/lead-dashboard/settings"}
      className="dash-focus inline-flex h-9 items-center gap-2 rounded-[10px] border border-[color:var(--nx-line)] bg-white px-3 text-[13px] font-medium text-[#141416] transition-colors hover:bg-[#faf8f5]"
    >
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${enabled === null ? "bg-[#a1a1aa]" : enabled ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
      />
      <IconPower className="h-3.5 w-3.5 text-[#52525b]" />
      {label}
    </Link>
  );
}

function DemoBanner() {
  return (
    <div className="border-b border-[#7d5c33]/20 bg-[#f3eee7]">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="rounded-md bg-[#1c140b] px-2 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-white">
          Example
        </span>
        <p className="text-[13px] font-medium text-[#141416]">Made-up data, for showing how the system works.</p>
        <p className="text-[13px] text-[#52525b]">Nothing here happened, and none of it is stored.</p>
        <Link href="/lead-dashboard" className="ml-auto text-[13px] font-medium text-[#7d5c33] underline underline-offset-4 hover:no-underline">
          Show the real figures
        </Link>
      </div>
    </div>
  );
}

/** Only shown when there is a session to end. A dead button is worse than none. */
function SignOut() {
  if (!dashboardLocked) return null;
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="dash-focus inline-flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] font-medium text-[#b91c1c] transition-colors hover:bg-[#fdecea] lg:min-h-9"
      >
        <IconSignOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}

/* ----------------------------------------------------------- the rail */

/* Exported so the loading state renders the real rail rather than a copy of
   it: a second hand-maintained rail is the one nobody notices has drifted. */
export function Rail({
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
  const tabs = TABS as readonly Tab[];
  const current = tabs.find((t) => t.href === active);
  const groupTabs = current ? tabs.filter((t) => t.group === current.group) : [];

  /* The example-data switch and Sign out, written once, placed in both layouts. */
  const footer = (
    <>
      <Link
        href={demo ? "/lead-dashboard" : "/lead-dashboard?demo=1"}
        className="dash-focus inline-flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-[13px] text-[#141416] transition-colors hover:bg-[#faf8f5] lg:min-h-9"
      >
        {demo ? "Back to the real figures" : "See it with example data"}
      </Link>
      <SignOut />
    </>
  );

  const count = (href: string) => {
    const n = counts[href];
    const isUrgent = urgent.includes(href);
    if (typeof n !== "number" || (isUrgent && n === 0)) return null;
    return (
      <span className={`dash-count ${isUrgent && n > 0 ? "dash-count-urgent" : ""}`} aria-hidden>
        {n > 99 ? "99+" : n}
      </span>
    );
  };

  return (
    <>
      {/* ---- desktop sidebar ---- */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[232px] lg:flex-col lg:border-r lg:border-[#141416]/[0.07] lg:bg-white">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-[#141416]/[0.07] px-4">
          <Link href={to("/lead-dashboard")} className="dash-focus flex items-center gap-2.5 rounded-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#7d5c33] font-heading text-[12.5px] font-semibold text-white">O</span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#141416]">OMH</span>
          </Link>
          <span className={`ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] ${demo ? "text-[#a14b00]" : "text-[#047857]"}`}>
            <span aria-hidden className={`h-2 w-2 rounded-full ${demo ? "bg-amber-500" : "bg-[#16a34a]"}`} />
            {demo ? "Example" : "Live"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-b border-[#141416]/[0.07] px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#141416] text-[11px] font-semibold text-white">O</span>
          <span className="min-w-0">
            <span className="dash-eyebrow block">Workspace</span>
            <span className="block truncate text-[13px] font-medium text-[#141416]">Online Marketing Help</span>
          </span>
        </div>

        <div className="shrink-0 px-3 pt-3">
          <PaletteButton variant="sidebar" />
        </div>

        <nav aria-label="Dashboard" className="flex-1 overflow-y-auto overscroll-contain py-3">
          {TAB_GROUPS.map((g) => (
            <div key={g.key} className="mb-3.5">
              <div className="dash-eyebrow mb-1 px-5">{g.label}</div>
              <div className="space-y-0.5 px-3">
                {tabs.filter((t) => t.group === g.key).map((t) => {
                  const Icon = NAV_ICON[t.href as keyof typeof NAV_ICON];
                  const n = counts[t.href];
                  return (
                    <Link
                      key={t.href}
                      href={to(t.href)}
                      aria-current={t.href === active ? "page" : undefined}
                      aria-label={typeof n === "number" && n > 0 ? `${t.label}, ${n}${urgent.includes(t.href) ? " waiting" : ""}` : undefined}
                      className={`dash-nav dash-focus ${t.href === active ? "dash-nav-active" : ""}`}
                    >
                      {Icon ? <Icon /> : null}
                      <span className="flex-1 truncate">{t.label}</span>
                      {count(t.href)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* The user, with Ecomsixx's menu above it. A <details>, so it opens
            without any script and closes on a second press. */}
        <details className="group relative shrink-0 border-t border-[#141416]/[0.07] p-3">
          <summary className="dash-focus flex cursor-pointer list-none items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-[#faf8f5] [&::-webkit-details-marker]:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3eee7] text-sm font-medium text-[#7d5c33] ring-1 ring-inset ring-[#7d5c33]/20">
              {(dashboardUser || "O").charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-[#141416]">{dashboardUser || "Owner"}</span>
              <span className="block truncate text-[11px] text-[#71717a]">Online Marketing Help</span>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-[#71717a] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl bg-white p-1"
            style={{ border: "1px solid var(--nx-line)", boxShadow: "0 12px 32px -8px rgb(28 20 11 / 0.18)" }}
          >
            {footer}
          </div>
        </details>
      </aside>

      {/* ---- phone: the bar and its menu sheet ---- */}
      <RailMenu tabs={[...tabs]} groups={[...TAB_GROUPS]} active={active} counts={counts} urgent={urgent} demo={demo}>
        {footer}
      </RailMenu>

      {/* ---- phone: this group's screens as a row of pills ---- */}
      {groupTabs.length > 1 ? (
        <div className="nx-canvas-scroll flex gap-1.5 overflow-x-auto border-b border-[#141416]/[0.07] bg-white px-4 py-2 lg:hidden" aria-label="Screens in this group">
          {groupTabs.map((t) => (
            <Link
              key={t.href}
              href={to(t.href)}
              aria-current={t.href === active ? "page" : undefined}
              className={`dash-focus inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors ${
                t.href === active ? "bg-[#141416] text-white" : "bg-[#faf8f5] text-[#141416]"
              }`}
            >
              {t.label}
              {typeof counts[t.href] === "number" && (counts[t.href] ?? 0) > 0 ? <span className="tnum opacity-70">{counts[t.href]}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
