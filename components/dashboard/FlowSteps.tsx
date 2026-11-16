import { flowTimeline } from "@/widget/gates/flows.js";

/* A flow as a short list: when, and how. One row per message.
   What a person scans, in place of a sentence that has to be read. */

const DOT: Record<string, string> = {
  sms: "bg-[var(--accent)]",
  email: "bg-[#3b82f6]",
  call: "bg-[#c4572f]",
  messenger: "bg-[#8b5cf6]",
};

export function FlowSteps({
  flow,
  compact = false,
}: {
  flow: { name: string; triggers: string[]; nodes: unknown[] };
  compact?: boolean;
}) {
  const rows = flowTimeline(flow);
  if (rows.length === 0) {
    return <p className="text-[13px] text-muted">Nothing is sent.</p>;
  }
  return (
    <ol className={compact ? "grid gap-1" : "grid gap-1.5"}>
      {rows.map((r, i) => (
        <li key={r.nodeId ?? i} className="flex items-center gap-2.5 text-[13px]">
          <span className="w-[7.5rem] shrink-0 tabular-nums text-muted">{r.when}</span>
          <span className={`size-2 shrink-0 rounded-full ${DOT[r.channel] ?? "bg-line"}`} aria-hidden />
          <span className="font-medium text-ink">{r.label}</span>
          {r.onlyIfCallUnanswered && <span className="text-[12px] text-muted">if call missed</span>}
        </li>
      ))}
    </ol>
  );
}

/** "3 texts, 2 emails, 1 call" */
export function flowCounts(flow: { name: string; triggers: string[]; nodes: unknown[] }): string {
  const rows = flowTimeline(flow);
  if (!rows.length) return "Nothing sent";
  const n = (ch: string) => rows.filter((r) => r.channel === ch).length;
  const parts: string[] = [];
  const add = (k: number, one: string, many: string) => k && parts.push(`${k} ${k === 1 ? one : many}`);
  add(n("sms"), "text", "texts");
  add(n("email"), "email", "emails");
  add(n("call"), "call", "calls");
  add(n("messenger"), "DM", "DMs");
  return parts.join(", ");
}
