import { IconInbox } from "./icons";

/* The small pieces every dashboard screen is built from, in the Ecomsixx
   dashboard's design (plan 016). Same props as before, so no screen had to
   change to take the new look: what changed is what they draw.

   Card is Ecomsixx's: 20px radius, a brand-tinted hairline and four-layer
   shadow, a Geist title row with no divider. Pill is its status chip. The
   table header is its 11.5px muted row. Empty sits on the dot grid. */

export function Card({
  children,
  title,
  note,
  action,
  className = "",
  pad = true,
  rise,
}: {
  children: React.ReactNode;
  title?: string;
  note?: string;
  action?: React.ReactNode;
  className?: string;
  pad?: boolean;
  /** Position in the entrance wave. See the keyframes in dashboard/layout. */
  rise?: number;
}) {
  return (
    <section
      /* min-w-0: a grid item defaults to min-width:auto, so without this the
         card grows to its longest unbroken line and pushes the page sideways. */
      className={`min-w-0 rounded-[20px] bg-white ${className}`}
      data-rise={rise === undefined ? undefined : ""}
      style={{
        border: "1px solid var(--nx-line)",
        boxShadow: "var(--nx-shadow-card)",
        ...(rise === undefined ? {} : ({ "--i": rise } as React.CSSProperties)),
      }}
    >
      {title && (
        /* Wraps rather than squeezes: the action drops to its own line
           before the title turns into a column of single words. */
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
          <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
            <h2 className="font-heading text-[16px] font-medium tracking-[-0.01em] text-[color:var(--nx-ink)]">{title}</h2>
            {note && <p className="mt-1 text-[12.5px] leading-snug text-[color:var(--nx-ink-70)]">{note}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? (title ? "px-5 pb-5 sm:px-7 sm:pb-6" : "p-5 sm:p-6") : ""}>{children}</div>
    </section>
  );
}

/** A status word, as Ecomsixx's status chip. The word carries the meaning; the colour agrees. */
export function Pill({ kind, children }: { kind?: string; children?: React.ReactNode }) {
  const label = children ?? kind ?? "";
  const map: Record<string, [string, string]> = {
    hot: ["bg-[#fdf3e1] text-[#a14b00]", "bg-amber-500"],
    warm: ["bg-[#f3eee7] text-[#7d5c33]", "bg-[#7d5c33]"],
    cold: ["bg-[#faf8f5] text-[#141416]", "bg-[#52525b]"],
    voice: ["bg-[#faf8f5] text-[#141416]", "bg-[#52525b]"],
    chat: ["bg-[#faf8f5] text-[#141416]", "bg-[#52525b]"],
    confirmed: ["bg-[#e7f8ef] text-[#047857]", "bg-emerald-500"],
    cancelled: ["bg-[#faf8f5] text-[#52525b] line-through", "bg-[#a1a1aa]"],
  };
  const [cls, dot] = map[String(kind)] || map.cold;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

/** An empty state with a reason and, where there is one, a next step: Ecomsixx's drawn panel. */
export function Empty({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="nx-canvas-grid flex flex-col items-center rounded-[12px] bg-white px-6 py-12 text-center"
      style={{ border: "1px solid var(--nx-line)", boxShadow: "var(--nx-shadow-card)" }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: "var(--nx-warm)", color: "var(--nx-brand)", boxShadow: "inset 0 0 0 1px rgb(94 69 38 / .12)" }}
      >
        <IconInbox className="h-5 w-5" />
      </span>
      <p className="mt-3 max-w-[46ch] text-pretty text-[13px] leading-[1.55] text-[color:var(--nx-ink-70)]">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** A table that keeps its header in view and scrolls sideways when narrow. */
export function Table({ children, minWidth = 760 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    /* overflow-x-auto makes this div a scroll container, and a sticky <th> then
       sticks to the div rather than the page. Above xl the table fits and the
       wrapper goes back to visible, which hands the sticky headers to the
       viewport. Below it the wrapper scrolls sideways. */
    <div
      className="overflow-x-auto rounded-[20px] bg-white xl:overflow-x-visible"
      style={{ border: "1px solid var(--nx-line)", boxShadow: "var(--nx-shadow-card)" }}
    >
      <table className="w-full border-collapse text-left text-[13px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

/* Ecomsixx's table: an 11.5px muted header row on a near-opaque ground so it
   stays legible as rows pass under it; 13px cells; a hairline between rows. */
export const th =
  "sticky top-0 z-10 whitespace-nowrap border-b border-[#141416]/[0.06] bg-white/95 px-4 py-2.5 text-left text-[11.5px] font-medium text-[#52525b] backdrop-blur-sm first:rounded-tl-[20px] last:rounded-tr-[20px]";
export const td = "border-b border-[#141416]/[0.05] px-4 py-2.5 align-top";
/** Rows light up under the pointer, which is how a long list stays readable. */
export const tr = "transition-colors duration-150 hover:bg-[#faf8f5] [&:last-child>td]:border-0";
export const num = "tabular-nums text-right";

/* "Nothing yet" plus a way to see what full looks like. An empty screen and a
   broken one look identical; this is how somebody tells them apart. */
export function ShowExample({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="dash-focus mt-4 inline-flex h-9 cursor-pointer items-center rounded-[10px] border border-[color:var(--nx-line)] bg-white px-3 text-[13px] font-medium text-[color:var(--nx-ink)] transition-colors duration-150 hover:bg-[color:var(--nx-tint)]"
    >
      See it with example data
    </a>
  );
}
