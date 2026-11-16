import { Shell } from "@/components/dashboard/Shell";
import { Card } from "@/components/dashboard/ui";
import { AgentEditor } from "@/components/dashboard/AgentEditor";
import { IconLock } from "@/components/dashboard/icons";
import { getAgent, getFlows, canWrite } from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo } from "@/lib/dashboard/demo";
import { demoAgent, demoFlows } from "@/lib/dashboard/control-panel";
import { ROUTES } from "@/widget/gates/routes";
import { triggerLabel } from "@/widget/gates/flows.js";

export const dynamic = "force-dynamic";

/* =========================================================================
   The calling agent: the Retell voice agent that rings leads back, explains,
   and books the consultation.

   Mostly honesty about state: which number, which hours, and which follow-ups
   may call at all. That last one is read only, with the reason, because it is
   the law and not a setting.
   ========================================================================= */

export default async function AgentPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demo = isDemo(await searchParams);
  const [agent, flowsRaw] = demo ? [demoAgent(), { flows: demoFlows() }] : await Promise.all([getAgent(), getFlows()]);
  const writable = !demo && canWrite && dashboardLocked && agent !== null;

  /* What may call: the code's routes with a call step, and the owner's
     flows with one. Every one of them starts from somebody who contacted us. */
  const callingRoutes = Object.values(ROUTES).filter((r) => [...r.immediate, ...r.steps].some((s) => s.channel === "call"));
  const callingFlows = (flowsRaw?.flows ?? []).filter((f) => f.nodes.some((n) => n.type === "send" && n.channel === "call"));

  return (
    <Shell active="/lead-dashboard/agent" title="Calling agent" lead="The voice agent that rings leads back to explain and book." demo={demo}>
      {agent === null ? (
        <p role="status" className="rounded-xl border border-line bg-warm px-4 py-3 text-[13.5px] text-ink">
          The settings store cannot be reached. Until a number is saved there, no automated call is placed.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <AgentEditor
            initial={{ fromNumber: agent.fromNumber, days: agent.days, start: agent.start, end: agent.end, opening: agent.opening, goal: agent.goal }}
            canWrite={writable}
            demo={demo}
          />
          <div className="grid grid-cols-1 content-start gap-5">
            <Card title="Who it may ring" note="Fixed by law, not a setting." rise={1}>
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
                <IconLock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-muted" />
                Only people who contacted you first. An automated call to a list needs consent that specifically
                covers automated calls (PECR regulation 19), so a marketing follow-up cannot have a call in it.
              </p>
              <ul className="mt-3 grid gap-1.5 text-[13px] text-muted">
                {callingRoutes.map((r) => <li key={r.id}>Route {r.id}: {r.name}</li>)}
                {callingFlows.map((f) => <li key={f.id}>{f.name} ({f.triggers.map(triggerLabel).join(", ")})</li>)}
              </ul>
            </Card>
            <Card title="On every call" rise={2}>
              <ul className="grid gap-2 text-[13px] leading-relaxed text-ink">
                <li>Retell&apos;s own do-not-call list is checked: a number on it is not rung.</li>
                <li>Anybody who texted STOP or asked not to be contacted is never rung.</li>
                <li>It has the same knowledge base and price list as the website assistant, and never guesses a figure.</li>
                <li>It can book the consultation on the call, and hand over to a person when it cannot help.</li>
                <li>If nobody answers, they get a text saying we tried, with the booking link.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </Shell>
  );
}
