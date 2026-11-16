import Link from "next/link";
import { IconSignOut } from "./icons";
import { NavItem, type Tab } from "./NavItem";
import { RailMenu } from "./RailMenu";
import { getInbox } from "@/lib/dashboard/handover";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { signOut } from "@/app/lead-dashboard/login/actions";
import { TABS, TAB_GROUPS } from "@/lib/dashboard/screens";

/* The frame every dashboard screen sits in.

   It is deliberately not the website's layout. A marketing page is a column
   you read top to bottom; a dashboard is a workspace you stay inside and move
   around, so this is the workspace shape: a persistent rail on the left that
   never moves, and a content column that scrolls under a sticky page header.

   The palette is the site's own, down to the token names. The rail uses
   `inverse` / `oninverse`, the same pair the site footer sits on, which is
   what lets the dashboard read as a different kind of surface without
   introducing a single colour that is not already OMH's.

   Below 1024px the rail becomes a bar with a Menu (RailMenu.tsx), because a
   248px rail on a laptop in a meeting room is fine and on a phone is not. It
   was a sideways-scrolling row of fifteen tabs, which hid most of them. */


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
  /* How many people are waiting for an answer, fetched here rather than by
     each page, so the figure is on the rail on every screen. Somebody waiting
     is the one thing worth interrupting whatever you were reading. */
  const inbox = await getInbox();
  const rail = { "/lead-dashboard/handover": inbox.waiting, ...counts };

  return (
    <div id="omh-dashboard" className="min-h-dvh bg-warm text-ink">
      <Rail
        active={active}
        counts={rail}
        urgent={["/lead-dashboard/handover", ...urgent]}
        demo={demo}
      />

      <div className="lg:pl-[248px]">
        {/* Not sticky: its height changes with the length of the lead
            sentence, and the tables' own sticky column headers would need a
            fixed offset to clear it. Column headers are the ones worth
            keeping in view, so they get the viewport top to themselves. */}
        {demo ? <DemoBanner /> : null}

        <header className="border-b border-line">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 py-6 sm:px-7 sm:py-7">
            <div className="min-w-0">
              {/* An eyebrow above the title. It costs one line and it is what
                  turns a page into a section of something: the client reads
                  which report they are in before they read its name. */}
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--dash-accent-text)]">
                AI assistant
              </p>
              <h1 className="mt-1.5 font-sans text-[26px] font-semibold leading-[1.1] tracking-[-.025em] sm:text-[30px]">
                {title}
              </h1>
              {lead && (
                <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-muted">{lead}</p>
              )}
            </div>
            {toolbar && <div className="flex shrink-0 items-center gap-2">{toolbar}</div>}
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-5 py-6 sm:px-7 sm:py-7">{children}</main>
      </div>
    </div>
  );
}

/* Example data is on.

   Loud on purpose, and at the top of every screen rather than once at the
   door. The failure this prevents is somebody reading a figure off a
   demonstration, writing it down, and repeating it later as something that
   happened. A banner you can scroll past at the top of a session is not
   enough; this one is on the screen the figure is on. */
function DemoBanner() {
  return (
    <div className="border-b border-[rgb(var(--accent-rgb)/.3)] bg-[rgb(var(--accent-rgb)/.1)]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 sm:px-7">
        <span className="rounded-md bg-inverse px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-[.1em] text-oninverse">
          Example
        </span>
        <p className="text-[13px] font-medium text-ink">
          Made-up data, for showing how the system works.
        </p>
        <p className="text-[13px] text-muted">
          Nothing here happened, and none of it is stored.
        </p>
        <Link
          href="/lead-dashboard"
          className="ml-auto text-[13px] font-medium text-[var(--dash-accent-text)] underline underline-offset-4 hover:no-underline"
        >
          Show the real figures
        </Link>
      </div>
    </div>
  );
}

/** Only shown when there is a session to end. With no password configured
    there is nothing to sign out of, and a dead button is worse than none. */
function SignOut() {
  if (!dashboardLocked) return null;
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 font-sans text-[12.5px] font-medium text-white/60 outline-none transition-colors duration-150 hover:bg-white/5 hover:text-white/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <IconSignOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}

/* Exported so the loading state can render the real rail rather than a
   copy of it. A second hand-maintained rail would drift from this one, and
   the copy in the loading state is the one nobody would notice had
   drifted. */
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
  /* While the example data is on, every nav link carries it. Without this,
     the first tab clicked in a meeting silently drops back to the real
     figures, which in a half-built system means mostly empty screens. */
  const to = (href: string) => (demo ? `${href}?demo=1` : href);
  const tabs = TABS as readonly Tab[];

  /* The example-data switch and Sign out, written once and placed in both
     layouts. Sign out used to be hidden below 1024px, which left no way to
     sign out on a phone. */
  const footer = (
    <>
      {/* Nothing here yet is the normal state of a system that has not run
          yet, and it is also indistinguishable from a system that is broken.
          This is the way to tell them apart. */}
      <Link
        href={demo ? "/lead-dashboard" : "/lead-dashboard?demo=1"}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 font-sans text-[12.5px] font-medium text-white/60 outline-none transition-colors duration-150 hover:bg-white/5 hover:text-white/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {demo ? "Back to the real figures" : "See it with example data"}
      </Link>
      <SignOut />
    </>
  );

  return (
    <nav
      aria-label="Dashboard"
      /* On a short laptop screen (1366x768) fifteen items, the logo and the
         footer are taller than the window, and a fixed rail that does not
         scroll cut off Settings and Sign out. It scrolls now. */
      className="bg-inverse text-oninverse lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-[248px] lg:overflow-y-auto lg:overscroll-contain"
      style={{
        /* A single faint wash from the top, and a hairline down the right
           edge. The rail is the darkest thing on screen, and a flat fill that
           dark reads as a hole in the page rather than a surface in front of
           it. The hairline is what makes it sit on top. */
        backgroundImage:
          "linear-gradient(180deg, rgb(255 255 255 / .06), transparent 240px)",
        boxShadow: "inset -1px 0 0 rgb(255 255 255 / .08)",
      }}
    >
      {/* Below 1024px: a bar and a menu. */}
      <RailMenu
        tabs={[...tabs]}
        groups={[...TAB_GROUPS]}
        active={active}
        counts={counts}
        urgent={urgent}
        demo={demo}
      >
        {footer}
      </RailMenu>

      {/* 1024px and up: the rail, in three groups. */}
      <div className="hidden min-h-full flex-col lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <Link
            href="/"
            className="font-sans text-[21px] font-bold tracking-[-.025em] text-oninverse outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-inverse)]"
          >
            OMH<span style={{ color: "var(--accent)" }}>.</span>
          </Link>
          <span className="rounded-full border border-white/15 px-2.5 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[.14em] text-white/60">
            Dashboard
          </span>
        </div>

        <div className="grid gap-4 px-3">
          {TAB_GROUPS.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <p className="px-3 pb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[.14em] text-white/40">
                {g.label}
              </p>
              <ul className="grid gap-0.5">
                {tabs.filter((t) => t.group === g.key).map((t) => (
                  <li key={t.href}>
                    <NavItem
                      tab={t}
                      href={to(t.href)}
                      active={t.href === active}
                      count={counts[t.href]}
                      urgent={urgent.includes(t.href)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-auto px-6 pb-6 pt-8">
          {/* A live marker, because the figures above it are read live from
              the phone platform and the assistant's own store rather than
              from a nightly export, and that is worth saying in a meeting. */}
          <p className="flex items-center gap-2 border-t border-white/10 pt-5 font-sans text-[11px] font-semibold uppercase tracking-[.1em] text-white/60">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            {/* This label was hard-coded, so in demo mode the rail said "Live
                data" while the banner above said "Made-up data". Two labels on
                one screen disagreeing about whether the figures are real is the
                kind of thing somebody notices in a meeting, and then stops
                trusting the rest of the screen. */}
            {demo ? "Example data" : "Live data"}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/60">
            Online Marketing Help
            <span className="mt-0.5 block">AI assistant reporting</span>
          </p>
          <div className="mt-3 flex flex-col items-start">{footer}</div>
        </div>
      </div>
    </nav>
  );
}
