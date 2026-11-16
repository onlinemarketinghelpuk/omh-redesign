import Link from "next/link";
import { Shell } from "@/components/dashboard/Shell";
import { Card } from "@/components/dashboard/ui";
import { MessageEditor } from "@/components/dashboard/MessageEditor";
import { getMessages, getFlows, canWrite, when } from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo } from "@/lib/dashboard/demo";
import { messageCatalog, demoFlows, demoMessages, type MessageEntry } from "@/lib/dashboard/control-panel";
import { renderText, EXAMPLE } from "@/widget/gates/message-text.js";

export const dynamic = "force-dynamic";

/* =========================================================================
   Every message the follow-ups send, in one place, in words the owner can
   change.

   The code's templates (widget/gates/templates.ts) stay the source and the
   fallback: a message with no saved words sends the code's, and going back
   to the original deletes the saved words rather than copying the code's
   over them, so a later fix to the code reaches every message nobody edited.
   ========================================================================= */

const CHANNEL_WORD: Record<string, string> = { sms: "Text", email: "Email", call: "Call brief", messenger: "DM" };

function title(m: MessageEntry) {
  const r = m.usedBy.find((u) => u.kind === "route");
  return r ? r.step : m.key.replace(/_/g, " ");
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; key?: string }>;
}) {
  const sp = await searchParams;
  const demo = isDemo(sp);
  const q = demo ? "&demo=1" : "";

  const [msgs, flowsRaw] = demo
    ? [demoMessages(), { flows: demoFlows() }]
    : await Promise.all([getMessages(), getFlows()]);
  const reachable = msgs !== null;
  const catalog = messageCatalog(msgs?.messages ?? [], msgs?.history ?? [], flowsRaw?.flows ?? []);
  const writable = !demo && canWrite && dashboardLocked && reachable;

  const isNew = sp.key === "new";
  const selected = isNew ? null : catalog.find((m) => m.key === sp.key) ?? catalog[0];

  /* Grouped by the route that sends them, in route order; the owner's own
     messages last. */
  const groups = new Map<string, MessageEntry[]>();
  for (const m of catalog) {
    const r = m.usedBy.find((u) => u.kind === "route");
    const g = r ? `Route ${r.id}: ${r.name}` : "Your own messages";
    groups.set(g, [...(groups.get(g) ?? []), m]);
  }

  return (
    <Shell
      active="/lead-dashboard/messages"
      title="Messages"
      lead="Every text and email the follow-ups send, in words you can change."
      demo={demo}
    >
      {!reachable && (
        <p role="status" className="mb-5 rounded-xl border border-line bg-warm px-4 py-3 text-[13.5px] leading-relaxed text-ink">
          The message store cannot be reached, so the original words are shown. Those are what is being sent
          unless somebody saved their own, which cannot be checked right now. Editing is switched off until it is
          back.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <nav aria-label="Messages" className="flex min-w-0 flex-col gap-4">
          {writable && (
            <Link
              href={`/lead-dashboard/messages?key=new${q}`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-dashed border-line px-3 text-[13px] font-medium text-ink transition-colors hover:bg-warm"
            >
              + Write a new message
            </Link>
          )}
          {[...groups.entries()].map(([g, items]) => (
            <section key={g}>
              <h2 className="font-mono mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{g}</h2>
              <ul className="grid gap-1">
                {items.map((m) => {
                  const on = selected?.key === m.key;
                  return (
                    <li key={m.key}>
                      <Link
                        href={`/lead-dashboard/messages?key=${encodeURIComponent(m.key)}${q}`}
                        aria-current={on ? "page" : undefined}
                        className={[
                          "flex min-h-11 flex-col justify-center rounded-lg px-3 py-2 transition-colors",
                          on ? "bg-[rgb(var(--accent-rgb)/.12)]" : "hover:bg-warm",
                        ].join(" ")}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13.5px] font-medium text-ink">{title(m)}</span>
                          <span className="font-mono shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                            {CHANNEL_WORD[m.channel] ?? m.channel}
                          </span>
                        </span>
                        <span className="truncate text-[12px] text-muted">
                          {m.override ? `Your words · ${when(m.override.updatedAt)}` : "Original words"}
                          {m.marketing ? " · marketing" : ""}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-5">
          {isNew ? (
            <Card title="A new message" note="Once saved, a flow can send it." rise={0}>
              <MessageEditor
                entry={{ key: "", channel: "sms", marketing: false, inCode: false, original: null, override: null }}
                canWrite={writable}
                demo={demo}
                isNew
              />
            </Card>
          ) : selected ? (
            <>
              <Card
                title={title(selected)}
                note={
                  selected.usedBy.length
                    ? `Sent by ${selected.usedBy.map((u) => (u.kind === "route" ? `route ${u.id}` : `“${u.name}”`)).join(", ")}. Id: ${selected.key}`
                    : `Not sent by anything yet. Id: ${selected.key}`
                }
                rise={0}
              >
                <MessageEditor
                  key={selected.key}
                  entry={{
                    key: selected.key,
                    channel: selected.channel,
                    marketing: selected.marketing,
                    inCode: selected.inCode,
                    original: selected.original,
                    override: selected.override ? { subject: selected.override.subject, body: selected.override.body } : null,
                  }}
                  canWrite={writable}
                  demo={demo}
                />
              </Card>

              <Card title="Changes" note="Who changed this message, and when." rise={1}>
                {selected.history.length === 0 ? (
                  <p className="text-[13.5px] text-muted">Never changed. It sends the original words.</p>
                ) : (
                  <ol className="grid gap-3">
                    {selected.history.map((h, i) => (
                      <li key={i} className="rounded-xl border border-line bg-warm/60 p-3.5">
                        <p className="text-[13px] font-medium text-ink">
                          {h.action === "reset" ? "Went back to the original words" : "Saved"}
                          <span className="font-normal text-muted"> · {when(h.at)}{h.by ? ` by ${h.by}` : ""}</span>
                        </p>
                        {h.body && (
                          <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
                            {renderText(h.body, EXAMPLE)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
