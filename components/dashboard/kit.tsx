"use client";

/* =========================================================================
   The dashboard kit (plan 016): Ecomsixx's app-kit and dash primitives,
   ported, with the brand swapped from purple to OHM bronze.

   Source: bd-automation-panel/app/components/ecx/app-kit.tsx and dash.tsx.
   The shapes, sizes, radii, type and motion are Ecomsixx's as measured; the
   only change is the brand family (see the plan's swap table).

   Every chart draws only what it is given. Nothing here invents a number.
   ========================================================================= */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export const BRONZE = "#7d5c33";
export const BRONZE_DEEP = "#5e4526";
export const TAN = "#d2b48c";
export const TINT = "#f3eee7";
export const HOVER = "#faf8f5";
export const GREEN = "#047857";
export const AMBER = "#a14b00";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------- figures */

/** Counts a plain integer (optionally with a % suffix) up when it scrolls in. */
export function CountUp({ value, className }: { value: string | number; className?: string }) {
  const str = String(value);
  const m = str.match(/^(\d+)(%?)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(str);
  const [seen, setSeen] = useState(str);
  /* A new value from the server replaces the shown one at once. */
  if (seen !== str) {
    setSeen(str);
    setShown(str);
  }
  useEffect(() => {
    if (!m || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = parseInt(m[1], 10);
    if (target === 0) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / 900);
          setShown(`${Math.round(target * (1 - Math.pow(1 - p, 3)))}${m[2]}`);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [str]);
  return (
    <span ref={ref} className={cn("tnum", className)}>
      {shown}
    </span>
  );
}

function linePath(vals: number[], w: number, h: number, pad = 2) {
  const safe = vals.length > 1 ? vals : [vals[0] ?? 0, vals[0] ?? 0];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const xs = safe.map((_, i) => pad + (i * (w - pad * 2)) / (safe.length - 1));
  const ys = safe.map((v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2));
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    d += ` C${cx},${ys[i - 1]} ${cx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  return { d, area: `${d} L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z` };
}

/** Area sparkline, drawn relative to its own min and max. */
export function Spark({ vals, color = BRONZE, h = 30, className }: { vals: number[]; color?: string; h?: number; className?: string }) {
  const id = "sp" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const w = 120;
  const { d, area } = linePath(vals, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} style={{ height: h }} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Progress ring, 0 to 100. */
export function Ring({ pct, size = 52, color = BRONZE, label, track = TINT }: { pct: number; size?: number; color?: string; label?: ReactNode; track?: string }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r="22" fill="none" stroke={track} strokeWidth="6" />
        <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" pathLength={100} strokeDasharray={`${p} 100`} />
      </svg>
      {label !== undefined && <span className="tnum absolute inset-0 flex items-center justify-center text-[11px] font-medium text-[#141416]">{label}</span>}
    </div>
  );
}

/** Horizontal meter, 0 to 100. */
export function Meter({ pct, color = BRONZE, className }: { pct: number; color?: string; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full", className)} style={{ background: TINT }}>
      <span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </span>
  );
}

/* ------------------------------------------------------------- chips */

export type ChipTone = "ok" | "brand" | "warn" | "danger" | "muted" | "info";

export function Chip({ tone = "muted", children, dot = true, className }: { tone?: ChipTone; children: ReactNode; dot?: boolean; className?: string }) {
  const tones: Record<ChipTone, [string, string]> = {
    ok: ["bg-[#e7f8ef] text-[#047857]", "bg-emerald-500"],
    brand: [`bg-[#f3eee7] text-[#7d5c33]`, "bg-[#7d5c33]"],
    warn: ["bg-[#fdf3e1] text-[#a14b00]", "bg-amber-500"],
    danger: ["bg-[#fdecea] text-[#b91c1c]", "bg-red-500"],
    info: ["bg-[#e8f0fe] text-[#1d4ed8]", "bg-blue-500"],
    muted: ["bg-[#faf8f5] text-[#141416]", "bg-[#52525b]"],
  };
  const [cls, dotCls] = tones[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium", cls, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotCls)} />}
      {children}
    </span>
  );
}

/** "Answered from ..." source tag with a green tick. */
export function Source({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] text-[#047857]">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- surfaces */

/** Ecomsixx's card: 20px radius, tinted hairline, four-layer tinted shadow. */
export function KitCard({
  title,
  right,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("min-w-0 rounded-[20px] bg-white", className)}
      style={{ border: "1px solid var(--nx-line)", boxShadow: "var(--nx-shadow-card)" }}
    >
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 px-7 pb-3 pt-6">
          <h2 className="min-w-0 truncate font-heading text-[16px] font-medium tracking-[-0.01em] text-[color:var(--nx-ink)]">{title}</h2>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      )}
      {bodyClassName !== undefined ? <div className={bodyClassName}>{children}</div> : children}
    </section>
  );
}

export function CardNote({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap text-[11px] text-[#52525b]">{children}</span>;
}

/** KPI row: two columns on phones, four on wide screens (or `cols`). */
export function KpiRow({ children, cols = 4, className }: { children: ReactNode; cols?: 2 | 3 | 4 | 5; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3",
        cols === 2 && "xl:grid-cols-2",
        cols === 3 && "xl:grid-cols-3",
        cols === 4 && "xl:grid-cols-4",
        cols === 5 && "lg:grid-cols-3 xl:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The KPI card: mono label with an icon, a Geist figure that counts up, a muted line. */
export function Stat({
  label,
  value,
  sub,
  spark,
  ring,
  ringLabel,
  color = BRONZE,
  tone,
  icon,
  href,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  spark?: number[];
  ring?: number;
  ringLabel?: ReactNode;
  color?: string;
  tone?: "warn" | "ok";
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const plain = typeof value === "string" || typeof value === "number";
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--nx-ink-45)] [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
            <span className="truncate">{label}</span>
          </p>
          <p
            className={cn(
              "tnum mt-1.5 font-heading text-[28px] font-medium leading-[1.1] tracking-[-0.01em] sm:text-[30px]",
              tone === "warn" ? "text-[#a14b00]" : tone === "ok" ? "text-[#047857]" : "text-[color:var(--nx-ink)]",
            )}
          >
            {plain ? <CountUp value={value as string | number} /> : value}
          </p>
          {sub !== undefined && <p className="mt-2 text-[12px] leading-snug text-[color:var(--nx-ink-70)]">{sub}</p>}
        </div>
        {ring !== undefined && <Ring pct={ring} size={46} color={color} label={ringLabel} />}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-3">
          <Spark vals={spark} color={color} />
        </div>
      )}
    </>
  );
  return (
    <KitCard className={cn("px-5 pb-4 pt-4", href && "transition-[box-shadow,transform] duration-150 hover:-translate-y-[1px]", className)}>
      {href ? (
        <a href={href} className="dash-focus block rounded-[16px] outline-none">
          {body}
        </a>
      ) : (
        body
      )}
    </KitCard>
  );
}

/** Horizontal bars: label, bar, value. */
export function BarList({
  items,
  color = BRONZE,
  format = (v: number) => String(v),
  max,
}: {
  items: { label: ReactNode; value: number; color?: string; key?: string }[];
  color?: string;
  format?: (v: number) => ReactNode;
  max?: number;
}) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.key ?? i} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-2.5 text-[12px]">
          <span className="truncate text-[#141416]">{it.label}</span>
          <span className="block h-1.5 overflow-hidden rounded-full" style={{ background: TINT }}>
            <span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (it.value / m) * 100))}%`, background: it.color ?? color }} />
          </span>
          <span className="tnum min-w-[2.5rem] text-right text-[#141416]">{format(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- controls */

/** Ecomsixx's button: ink primary, hairline ghost. 36px, 10px radius. */
export function Btn({
  children,
  primary,
  className,
  type = "button",
  ...rest
}: { children: ReactNode; primary?: boolean; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "dash-focus inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-50",
        primary
          ? "bg-[color:var(--nx-ink)] text-white hover:bg-[color:var(--nx-brand-deep)]"
          : "border border-[color:var(--nx-line)] bg-white text-[color:var(--nx-ink)] hover:bg-[color:var(--nx-tint)]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Filter pills with counts, ink when active. */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { id: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("nx-canvas-scroll flex max-w-full gap-1.5 overflow-x-auto", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "dash-focus min-h-8 shrink-0 whitespace-nowrap rounded-[10px] px-3 text-[12px] font-medium transition-colors",
            value === o.id
              ? "bg-[color:var(--nx-ink)] text-white"
              : "border border-[color:var(--nx-line)] bg-white text-[color:var(--nx-ink)] hover:bg-[color:var(--nx-tint)]",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="tnum ml-1 opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** The switch (role=switch); the track is a child so the hit area can grow. */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="dash-focus group relative inline-flex shrink-0 items-center justify-center rounded-full disabled:opacity-50"
    >
      <span className="relative block h-5 w-9 rounded-full transition-colors" style={{ background: checked ? BRONZE : "#e7e2db" }}>
        <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
      </span>
    </button>
  );
}

/** Label and value for a detail pane. */
export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[#52525b]">{label}</p>
      <div className="mt-0.5 break-words text-[13px] text-[#141416]">{children}</div>
    </div>
  );
}

/** Round initials avatar. */
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials =
    (name || "?")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-white text-[10.5px] font-semibold ring-1 ring-[#141416]/10"
      style={{ width: size, height: size, color: BRONZE }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------- states */

export function Skel({ className }: { className?: string }) {
  return <span className={cn("dash-skel block", className)} />;
}

/** Drawn empty state on the dot grid: a small picture of the empty thing. */
export function EmptyPanel({ icon, title, body, action, className }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      className={cn("nx-canvas-grid flex flex-col items-center justify-center rounded-[12px] bg-white px-6 py-12 text-center", className)}
      style={{ border: "1px solid var(--nx-line)", boxShadow: "var(--nx-shadow-card)" }}
    >
      <div className="relative h-[92px] w-[180px]" aria-hidden>
        <div className="absolute inset-x-3 top-0 h-[26px] rounded-[10px] border border-[color:var(--nx-line)] bg-white/70" />
        <div className="absolute inset-x-1.5 top-[18px] h-[30px] rounded-[10px] border border-[color:var(--nx-line)] bg-white/85" />
        <div
          className="absolute inset-x-0 top-[38px] flex h-[50px] items-center gap-2.5 rounded-[12px] bg-white px-3"
          style={{ border: "1px solid var(--nx-line)", boxShadow: "var(--nx-shadow-lift)" }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] [&_svg]:h-4 [&_svg]:w-4" style={{ background: TINT, color: BRONZE }}>
            {icon}
          </span>
          <span className="flex-1 space-y-1.5">
            <span className="block h-1.5 w-3/4 rounded-full" style={{ background: TINT }} />
            <span className="block h-1.5 w-1/2 rounded-full" style={{ background: HOVER }} />
          </span>
        </div>
      </div>
      <p className="mt-5 font-heading text-[18px] font-medium tracking-[-0.01em] text-[color:var(--nx-ink)]">{title}</p>
      {body && <p className="mt-2 max-w-sm text-pretty text-[13px] leading-[1.55] text-[color:var(--nx-ink-70)]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
