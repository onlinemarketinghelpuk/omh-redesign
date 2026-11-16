import Link from "next/link";
import { Shell } from "@/components/dashboard/Shell";
import { Card, Empty } from "@/components/dashboard/ui";
import { FlowBuilder, type BuilderMessage } from "@/components/dashboard/FlowBuilder";
import { IconBack } from "@/components/dashboard/icons";
import {
  getFlow, getFlows, getFlowHistory, getMessages, getSequenceBoard, canWrite, when,
  type FlowRow, type FlowVersionRow,
} from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo } from "@/lib/dashboard/demo";
import { demoFlows, demoMessages, messageCatalog } from "@/lib/dashboard/control-panel";
import { triggerLabel } from "@/widget/gates/flows.js";
import { flowCounts } from "@/components/dashboard/FlowSteps";
import { renderText, EXAMPLE } from "@/widget/gates/message-text.js";

export const dynamic = "force-dynamic";

/* =========================================================================
   One flow, in the builder, with every version it has had.

   The opt-out count is read from the follow-ups board rather than stored on
   the flow: it is a fact about what happened to people, and the board is
   where those facts already are.
   ========================================================================= */

export default async function FlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  /* Decoded: a route parameter arrives as it was in the URL, and an id with
     any reserved character in it would otherwise look up nothing. */
  const id = decodeURIComponent((await params).id);
  const demo = isDemo(await searchParams);
  const q = demo ? "?demo=1" : "";

  let flow: FlowRow | null;
  let flows: FlowRow[];
  let msgs: Awaited<ReturnType<typeof getMessages>>;
  let history: FlowVersionRow[] = [];
  let optOuts: { people: number; optedOut: number } | null = null;

  if (demo) {
    flows = demoFlows();
    flow = flows.find((f) => f.id === id) ?? null;
    msgs = demoMessages();
    if (flow) history = [{ version: flow.version, name: flow.name, triggers: flow.triggers, nodes: flow.nodes, status: flow.status, at: flow.updatedAt, by: flow.updatedBy }];
    optOuts = flow?.status === "live" ? { people: 140, optedOut: 2 } : null;
  } else {
    const [f, all, m, h, board] = await Promise.all([
      getFlow(id), getFlows(), getMessages(), getFlowHistory(id), getSequenceBoard(300),
    ]);
    flow = f;
    flows = all?.flows ?? [];
    msgs = m;
    history = h?.versions ?? [];
    if (board) {
      const mine = board.rows.filter((r) => r.flowId === id);
      optOuts = { people: mine.length, optedOut: mine.filter((r) => r.stopReason === "opted_out").length };
    }
  }

  const back = (
    <Link
      href={`/lead-dashboard/control${q}`}
      className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
    >
      <IconBack className="h-4 w-4" /> Control panel
    </Link>
  );

  if (!flow) {
    return (
      <Shell active="/lead-dashboard/control" title="Flow" lead="One flow, step by step." demo={demo}>
        {back}
        <Empty>
          {msgs === null && !demo
            ? "The flow store cannot be reached, so this flow cannot be shown. Nothing about what is running has changed."
            : "There is no flow with this id. It may have been opened from an old link."}
        </Empty>
      </Shell>
    );
  }

  const catalog = messageCatalog(msgs?.messages ?? [], msgs?.history ?? [], flows);
  const messages: BuilderMessage[] = catalog.map((m) => {
    const used = m.usedBy.find((u) => u.kind === "route");
    const body = m.override?.body ?? m.original?.body ?? "";
    return {
      key: m.key,
      channel: m.channel,
      label: used ? `${used.step} (route ${used.id}) · ${m.key}` : m.key,
      preview: renderText(body, EXAMPLE).slice(0, 220),
    };
  });

  const writable = !demo && canWrite && dashboardLocked && msgs !== null;

  return (
    <Shell
      active="/lead-dashboard/control"
      title={flow.name}
      lead="One flow, step by step."
      demo={demo}
    >
      {back}
      <FlowBuilder
        key={flow.id}
        flow={{ id: flow.id, name: flow.name, triggers: flow.triggers, nodes: flow.nodes as never, status: flow.status, version: flow.version }}
        messages={messages}
        canWrite={writable}
        demo={demo}
        optOuts={optOuts}
      />

      <Card title="Versions" note="Every save is kept. A person runs the version they started on." className="mt-5" rise={3}>
        {history.length === 0 ? (
          <p className="text-[13.5px] text-muted">No saved versions to show.</p>
        ) : (
          <ol className="grid gap-3">
            {history.map((v) => (
              <li key={v.version} className="rounded-xl border border-line bg-warm/60 p-3.5">
                <p className="text-[13px] font-medium text-ink">
                  Version {v.version}
                  <span className="font-normal text-muted">
                    {" "}· {v.status} · {when(v.at)}{v.by ? ` by ${v.by}` : ""}
                  </span>
                </p>
                <p className="mt-1 text-[12.5px] text-muted">{v.triggers.map(triggerLabel).join(", ")}</p>
                <p className="mt-1.5 text-[13px] text-ink">{flowCounts(v)}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </Shell>
  );
}
