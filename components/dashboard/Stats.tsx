import { IconUp, IconDown, IconFlat } from "./icons";
import { CountUp, Spark } from "./kit";

/* A number on its own says very little. "26 calls" is only useful next to
   what it was before, and next to the shape of how it got there. So every
   figure on the overview carries three things: the value, the change against
   the period before it, and a sparkline of the period itself. */

export type Delta = { pct: number; dir: "up" | "down" | "flat" } | null;

/** The change between two periods, or null when there is nothing to compare. */
export function deltaOf(now: number, before: number): Delta {
  if (before === 0) return null;
  const pct = Math.round(((now - before) / before) * 100);
  return { pct, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export function Kpi({
  label,
  value,
  sub,
  delta,
  series,
  icon: Icon,
  accent,
  goodWhenUp = true,
  rise,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: Delta;
  series?: number[];
  icon: (p: { className?: string }) => React.ReactElement;
  accent?: boolean;
  goodWhenUp?: boolean;
  /** Position in the entrance wave. See the keyframes in dashboard/layout. */
  rise?: number;
}) {
  /* Ecomsixx's KPI card (plan 016): a white 20px card, the label in mono
     uppercase beside its icon, a Geist figure that counts up, the change and
     the line under it, and the sparkline full width at the foot. `accent` is
     kept so every caller compiles; Ecomsixx marks no card above another. */
  void accent;
  const plain = /^\d+%?$/.test(value);
  return (
    <div
      data-rise={rise === undefined ? undefined : ""}
      className="group relative min-w-0 rounded-[20px] bg-white px-5 pb-4 pt-4 transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-px"
      style={
        {
          border: "1px solid var(--nx-line)",
          boxShadow: "var(--nx-shadow-card)",
          ...(rise === undefined ? {} : { "--i": rise }),
        } as React.CSSProperties
      }
    >
      <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--nx-ink-45)]">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className="tnum mt-1.5 font-heading text-[28px] font-medium leading-[1.1] tracking-[-0.01em] text-[color:var(--nx-ink)] sm:text-[30px]">
        {plain ? <CountUp value={value} /> : value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta && <DeltaChip delta={delta} goodWhenUp={goodWhenUp} />}
        {sub && <span className="text-[12px] leading-snug text-[color:var(--nx-ink-70)]">{sub}</span>}
      </div>
      {/* A flat line along the bottom says less than no line at all. */}
      {series && series.length > 1 && series.some((v) => v > 0) && (
        <div className="mt-3">
          <Spark vals={series} />
        </div>
      )}
    </div>
  );
}

function DeltaChip({ delta, goodWhenUp }: { delta: NonNullable<Delta>; goodWhenUp: boolean }) {
  const good = delta.dir === "flat" ? null : (delta.dir === "up") === goodWhenUp;
  /* The arrow carries the direction, so the colour is reinforcement rather
     than the only signal. */
  const Icon = delta.dir === "up" ? IconUp : delta.dir === "down" ? IconDown : IconFlat;
  const tone =
    good === null
      ? "text-muted"
      : good
        ? "text-[#047857]"
        : "text-[#b91c1c]";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {delta.pct > 0 ? "+" : ""}
      {delta.pct}%
    </span>
  );
}

/** Thirty-two pixels of trend. Decorative: the figures beside it are the data. */
export function Sparkline({
  values,
  className = "",
  w = 72,
  h = 32,
}: {
  values: number[];
  className?: string;
  w?: number;
  h?: number;
}) {
  const top = Math.max(1, ...values);
  const step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 2 - (v / top) * (h - 6)] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <polyline
        points={`0,${h} ${line} ${w},${h}`}
        fill="rgb(var(--accent-rgb)/.18)"
        stroke="none"
      />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Lead temperature as one bar rather than three boxes, so the proportions
    are the point and the counts are still written out. */
export function Mix({
  parts,
}: {
  parts: { label: string; value: number; fill: string; text?: string }[];
}) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-warm" aria-hidden="true">
        {total > 0 &&
          parts.map((p) => (
            <span
              key={p.label}
              style={{ width: `${(p.value / total) * 100}%`, background: p.fill }}
              className="h-full"
            />
          ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2.5 text-[13.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: p.fill }}
              aria-hidden="true"
            />
            <span className="font-medium">{p.label}</span>
            <span className="ml-auto font-sans font-semibold tabular-nums">{p.value}</span>
            <span className="w-11 text-right text-muted tabular-nums">
              {total > 0 ? Math.round((p.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
