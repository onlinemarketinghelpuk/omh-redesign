import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/dashboard/Shell";
import { Card, Pill } from "@/components/dashboard/ui";
import { FlowBuilder, type BuilderMessage } from "@/components/dashboard/FlowBuilder";
import { MakeEditable } from "@/components/dashboard/FlowControls";
import { FlowSteps } from "@/components/dashboard/FlowSteps";
import { MessageEditor } from "@/components/dashboard/MessageEditor";
import { IconBack, IconLock } from "@/components/dashboard/icons";
import {
  getFlows, getMessages, getSequenceBoard, getBrain, getAgent, canWrite, when, canonicalSource, stopReasonLabel,
  type FlowRow, type SequenceRow,
} from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo, demoSequenceBoard } from "@/lib/dashboard/demo";
import { demoFlows, demoMessages, demoBrain, demoAgent, messageCatalog } from "@/lib/dashboard/control-panel";
import { BrainEditor } from "@/components/dashboard/BrainEditor";
import { TRIGGERS, defaultRouteFor, routeToNodes, triggerLabel } from "@/widget/gates/flows.js";
import { ROUTES } from "@/widget/gates/routes";
import { renderText, EXAMPLE } from "@/widget/gates/message-text.js";

export const dynamic = "force-dynamic";

/* =========================================================================
   One channel, everything about it, on one page.

   Its follow-up steps (edited here, in the builder), the words of every
   message those steps send (edited here too), who is on it right now, and
   the switch for it. Clicking a channel on the Control panel lands here.
   ========================================================================= */

const CHANNEL_WORD: Record<string, string> = { sms: "Text", email: "Email", call: "Call", messenger: "DM" };

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ channel: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const channel = decodeURIComponent((await params).channel);
  if (!TRIGGERS[channel]) notFound();
  const demo = isDemo(await searchParams);
  const q = demo ? "?demo=1" : "";

  const [flowsRaw, msgs, board, brain, agent] = demo
    ? [{ flows: demoFlows() }, demoMessages(), demoSequenceBoard(), demoBrain(), demoAgent()]
    : await Promise.all([getFlows(), getMessages(), getSequenceBoard(300), getBrain(), getAgent()]);

  const reachable = flowsRaw !== null && msgs !== null;
  const writable = !demo && canWrite && dashboardLocked && reachable;
  const flows = flowsRaw?.flows ?? [];
  const label = triggerLabel(channel);
  const marketing = TRIGGERS[channel].basis === "we_are_contacting_them";

  /* The flow this page edits: the live one, else the newest draft or
     paused one that lists this channel. */
  const mine = flows.filter((f) => f.triggers.includes(channel)).sort((a, b) => b.updatedAt - a.updatedAt);
  const live = mine.find((f) => f.status === "live") ?? null;
  const flow: FlowRow | null = live ?? mine[0] ?? null;

  const route = defaultRouteFor(channel) ?? "B";
  const def = ROUTES[route as keyof typeof ROUTES];
  const running = live
    ? { name: live.name, triggers: live.triggers, nodes: live.nodes }
    : { name: def.name, triggers: [channel], nodes: routeToNodes(def) };

  /* Messages: every one the running steps send, editable in place. */
  const catalog = messageCatalog(msgs?.messages ?? [], msgs?.history ?? [], flows);
  const used = (flow ?? running).nodes
    .filter((n) => n.type === "send" && typeof n.message === "string" && n.message)
    .map((n) => String(n.message));
  const messages = [...new Set(used)].map((k) => catalog.find((m) => m.key === k)).filter(Boolean) as typeof catalog;

  const builderMessages: BuilderMessage[] = catalog.map((m) => {
    const u = m.usedBy.find((x) => x.kind === "route");
    return {
      key: m.key,
      channel: m.channel,
      label: u ? `${u.step} · ${m.key}` : m.key,
      preview: renderText(m.override?.body ?? m.original?.body ?? "", EXAMPLE).slice(0, 220),
    };
  });

  /* People on this channel's follow-ups now. */
  const people: SequenceRow[] = (board?.rows ?? [])
    .filter((r) => canonicalSource(r.sourceChannel) === channel)
    .sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1) || (a.nextDueAt ?? 9e15) - (b.nextDueAt ?? 9e15));
  const active = people.filter((r) => r.status === "active");
  const optedOut = people.filter((r) => r.stopReason === "opted_out").length;

  const others = flow ? flow.triggers.filter((t) => t !== channel) : [];

  return (
    <Shell active="/lead-dashboard/control" title={label} lead="Everything this channel does, in one place." demo={demo}>
      <Link
        href={`/lead-dashboard/control${q}`}
        className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
      >
        <IconBack className="h-4 w-4" /> All channels
      </Link>

      {!reachable && !demo && (
        <p role="status" className="mb-5 rounded-xl border border-line bg-warm px-4 py-3 text-[13.5px] text-ink">
          The store cannot be reached. What is shown is the default from the code, which is what is running.
          Changes are switched off until it is back.
        </p>
      )}

      {/* ---------------------------------------------------------- summary */}
      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Follow-up">
          {live ? live.name : "Default"}
          <span className="mt-1 block text-[12px] font-normal text-muted">
            {live ? `On · version ${live.version}` : flow ? `${flow.name} is ${flow.status}` : `Route ${route}, from the code`}
          </span>
        </Stat>
        <Stat label="How it starts">
          <span className="inline-flex items-center gap-1.5">
            <IconLock className="h-3.5 w-3.5 text-muted" />
            {marketing ? "Marketing" : "They contacted us"}
          </span>
          <span className="mt-1 block text-[12px] font-normal text-muted">
            {marketing ? "Consent needed. No automated calls." : "Text, email and call allowed."}
          </span>
        </Stat>
        <Stat label="Being followed up now">
          {active.length}
          <span className="mt-1 block text-[12px] font-normal text-muted">{people.length} in the last 300</span>
        </Stat>
        <Stat label="Opted out">
          {optedOut}
          <span className="mt-1 block text-[12px] font-normal text-muted">
            {people.length ? `${((optedOut / people.length) * 100).toFixed(1)}% of them` : "Nobody yet"}
          </span>
        </Stat>
      </section>

      {/* ------------------------------------------------------------ steps */}
      {flow ? (
        <>
          {others.length > 0 && (
            <p className="mb-3 rounded-xl border border-line bg-warm px-4 py-2.5 text-[13px] text-ink">
              “{flow.name}” also runs on {others.map(triggerLabel).join(", ")}. Changes here change those too.
            </p>
          )}
          <FlowBuilder
            key={flow.id}
            flow={{ id: flow.id, name: flow.name, triggers: flow.triggers, nodes: flow.nodes as never, status: flow.status, version: flow.version }}
            messages={builderMessages}
            canWrite={writable}
            demo={demo}
            optOuts={{ people: people.length, optedOut }}
          />
        </>
      ) : (
        <Card
          title="Follow-up steps"
          note={`The default, route ${route} from the code. It is what runs today.`}
          rise={1}
          action={
            reachable || demo ? (
              <MakeEditable channel={channel} canWrite={writable} stay label="Change these steps" />
            ) : null
          }
        >
          <FlowSteps flow={running} />
        </Card>
      )}


      {/* --------------------------------------------------------- messages */}
      <Card title="What the messages say" note="Click one to change its words." className="mt-5" rise={2}>
        {messages.length === 0 ? (
          <p className="text-[13.5px] text-muted">This channel sends nothing.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {messages.map((m) => {
              const u = m.usedBy.find((x) => x.kind === "route");
              return (
                <li key={m.key} className="min-w-0">
                  <details className="group rounded-xl border border-line bg-surface open:bg-warm/40">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{u ? u.step : m.key}</span>
                        <span className="block truncate text-[12.5px] text-muted">
                          {renderText(m.override?.body ?? m.original?.body ?? "", EXAMPLE).slice(0, 90)}…
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {m.override ? <Pill kind="warm">Your words</Pill> : null}
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                          {CHANNEL_WORD[m.channel] ?? m.channel}
                        </span>
                      </span>
                    </summary>
                    <div className="border-t border-line p-4">
                      <MessageEditor
                        key={m.key}
                        entry={{
                          key: m.key,
                          channel: m.channel,
                          marketing: m.marketing,
                          inCode: m.inCode,
                          original: m.original,
                          override: m.override ? { subject: m.override.subject, body: m.override.body } : null,
                        }}
                        canWrite={writable}
                        demo={demo}
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ----------------------------------------------------------- people */}
      <Card
        title="People on it"
        note="Who this channel is following up, soonest first."
        className="mt-5"
        rise={3}
        action={
          <Link href={`/lead-dashboard/sequences${q}`} className="text-[13px] font-medium text-[var(--dash-accent-text)] underline-offset-2 hover:underline">
            All follow-ups
          </Link>
        }
      >
        {people.length === 0 ? (
          <p className="text-[13.5px] text-muted">Nobody from {label} yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-1">
            {people.slice(0, 12).map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-line py-2.5 last:border-0">
                <span className="min-w-0 text-[13.5px] font-medium text-ink">{r.name ?? "Unknown"}</span>
                <span className="text-[12.5px] text-muted">
                  {r.status === "active"
                    ? `${r.stepLabel ?? `Step ${r.step + 1}`}${r.stepCount ? `, ${r.step + 1} of ${r.stepCount}` : ""} · ${when(r.nextDueAt)}`
                    : stopReasonLabel(r.stopReason) || "Finished"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ------------------------------------------------- replies, calls */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="min-w-0">
          {brain ? (
            <BrainEditor
              initial={{ enabled: brain.enabled, policies: brain.policies, sales: brain.sales }}
              canWrite={!demo && canWrite && dashboardLocked}
              demo={demo}
              only={channel}
            />
          ) : (
            <Card title="Who answers replies"><p className="text-[13px] text-muted">The settings store cannot be reached.</p></Card>
          )}
          {brain && !brain.enabled && (
            <p className="mt-2 text-[12.5px] text-muted">Automated answering is off for every channel, on the Replies screen.</p>
          )}
        </div>
        <Card
          title="Calls"
          rise={4}
          action={
            <Link href={`/lead-dashboard/agent${q}`} className="text-[13px] font-medium text-[var(--dash-accent-text)] underline-offset-2 hover:underline">
              Calling agent
            </Link>
          }
        >
          <p className="text-[13px] leading-relaxed text-muted">
            {marketing
              ? "Never. A marketing follow-up cannot call: that needs consent that specifically covers automated calls."
              : !(flow ?? running).nodes.some((n) => n.type === "send" && n.channel === "call")
                ? "This channel's follow-up has no call step."
                : agent?.fromNumber
                  ? `The agent rings from ${agent.fromNumber}, ${agent.start}:00 to ${agent.end}:00 on calling days, to explain and book the consultation.`
                  : "There is a call step, but no number yet, so it is skipped and the texts carry on."}
          </p>
        </Card>
      </div>
    </Shell>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-line bg-surface p-4" style={{ boxShadow: "var(--e1), var(--ring-inset)" }}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium text-ink">{children}</p>
    </div>
  );
}
