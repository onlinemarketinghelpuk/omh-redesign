import Link from "next/link";
import { Shell } from "@/components/dashboard/Shell";
import { Card, Table, th, td, tr } from "@/components/dashboard/ui";
import { KillSwitch } from "@/components/dashboard/KillSwitch";
import { flowCounts } from "@/components/dashboard/FlowSteps";
import { IconLock } from "@/components/dashboard/icons";
import { getOutbound, getFlows, canWrite, when } from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo } from "@/lib/dashboard/demo";
import { channelRows, demoFlows } from "@/lib/dashboard/control-panel";
import { triggerLabel, routeToNodes } from "@/widget/gates/flows.js";
import { ROUTES } from "@/widget/gates/routes";

const defaultNodes = (route: string) => {
  const r = ROUTES[route as keyof typeof ROUTES];
  return r ? routeToNodes(r) : [];
};

export const dynamic = "force-dynamic";

/* =========================================================================
   The Control Panel.

   One row per channel: what happens to somebody who arrives on it, and
   which flow decides that. The only screen most days need.

   The owner decides the business: which channels get which messages, in
   what order, how far apart, and what they say. The system keeps the legal
   envelope, and this screen shows where that line is rather than hiding
   it: how a conversation STARTED is fixed per channel and is not editable,
   because it is what decides whether a flow is marketing.
   ========================================================================= */

export default async function ControlPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const demo = isDemo(await searchParams);
  const [outbound, flowsRaw] = demo
    ? [{ enabled: true, updatedAt: null, updatedBy: "owner" }, { flows: demoFlows() }]
    : await Promise.all([getOutbound(), getFlows()]);

  const writable = !demo && canWrite && dashboardLocked;
  const reachable = flowsRaw !== null;
  const flows = flowsRaw?.flows ?? [];
  const rows = channelRows(flows);
  const q = demo ? "?demo=1" : "";

  return (
    <Shell
      active="/lead-dashboard/control"
      title="Control panel"
      lead="What happens to a lead on each channel, and the switch that stops it all."
      demo={demo}
    >
      {/* grid-cols-1 is minmax(0,1fr): a plain `grid` track is auto, and an
          auto track grows to the table's minimum width, which stretched every
          card on this page to 1000px on a phone. */}
      <div className="grid grid-cols-1 gap-5">
        {/* Where it already was on Settings, and here too: somebody looking
            for the off switch should find it on the screen that starts
            things. */}
        <Card title="Automated messages" note="Every text, email and callback, on every channel." rise={0}>
          {outbound ? (
            <KillSwitch enabled={outbound.enabled} updatedBy={outbound.updatedBy ?? null} canWrite={writable} />
          ) : (
            <p className="rounded-xl bg-warm px-4 py-3 text-[13.5px] leading-relaxed text-muted">
              The routing store cannot be reached from here, so the switch is not shown rather than shown in a
              state that might be wrong.
            </p>
          )}
        </Card>

        {!reachable && (
          <p
            role="status"
            className="rounded-xl border border-line bg-warm px-4 py-3 text-[13.5px] leading-relaxed text-ink"
          >
            The flow store cannot be reached, so every channel below is shown on its default from the code,
            which is what is running. Changes cannot be made until it is back.
          </p>
        )}

        <section aria-labelledby="by-channel" className="min-w-0" data-rise="" style={{ ["--i" as string]: 1 }}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="by-channel" className="font-sans text-[15px] font-semibold tracking-[-.01em] text-ink">
              By channel
            </h2>
            <p className="text-[12.5px] text-muted">Open a channel to change everything about it.</p>
          </div>
          {/* A list, not a report. Each channel opens its own page, where
              everything about it is: its steps, its messages, its people. */}
          <Table minWidth={720}>
            <thead>
              <tr>
                <th className={th} scope="col">Channel</th>
                <th className={th} scope="col">How it starts</th>
                <th className={th} scope="col">Follow-up</th>
                <th className={th} scope="col">Messages</th>
                <th className={th} scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const href = `/lead-dashboard/control/${r.channel}${q}`;
                const flow = r.live ?? r.others[0] ?? null;
                const counts = r.live
                  ? flowCounts(r.live)
                  : flowCounts({ name: r.defaultName, triggers: [r.channel], nodes: defaultNodes(r.defaultRoute) });
                return (
                  <tr key={r.channel} className={tr}>
                    <th scope="row" className={`${td} text-left font-sans text-[14px] font-semibold`}>
                      <Link href={href} className="text-ink underline-offset-2 hover:underline">
                        {r.label}
                      </Link>
                    </th>
                    <td className={`${td} text-[13px]`}>
                      {r.basis === "we_are_contacting_them" ? (
                        <span className="inline-flex items-center gap-1.5 text-ink">
                          <IconLock className="h-3.5 w-3.5 text-muted" /> Marketing
                        </span>
                      ) : (
                        <span className="text-muted">They contacted us</span>
                      )}
                    </td>
                    <td className={`${td} text-[13px]`}>
                      {r.live ? (
                        <span className="text-ink">{r.live.name}</span>
                      ) : flow ? (
                        <span className="text-muted">Default · {flow.name} ({flow.status})</span>
                      ) : (
                        <span className="text-muted">Default</span>
                      )}
                    </td>
                    <td className={`${td} text-[13px] text-muted`}>{counts}</td>
                    <td className={`${td} text-right`}>
                      <Link
                        href={href}
                        className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-warm"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {!writable && (
            <p className="mt-3 text-[12.5px] text-muted">
              {demo ? "Example data: nothing here is connected to anything." : "Read only until a dashboard password is set."}
            </p>
          )}
        </section>

        <Card
          title="Your flows"
          note="Every flow, switched on or not. A flow can serve several channels."
          rise={2}
          action={
            <Link
              href={`/lead-dashboard/messages${q}`}
              className="text-[13px] font-semibold text-[var(--dash-accent-text)] underline-offset-2 hover:underline"
            >
              Edit what they say
            </Link>
          }
        >
          {flows.length === 0 ? (
            <p className="text-[13.5px] leading-relaxed text-muted">
              None yet. Every channel is running its default. Press{" "}
              <strong className="font-semibold text-ink">Make editable</strong> on a channel to start from what it
              does today.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {[...flows]
                .sort((a, b) => (a.status === "live" ? 0 : 1) - (b.status === "live" ? 0 : 1) || b.updatedAt - a.updatedAt)
                .map((f) => (
                  <li key={f.id} className="flex flex-col gap-2 rounded-xl border border-line bg-warm/60 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/lead-dashboard/flows/${f.id}${q}`}
                        className="font-sans text-[14px] font-semibold text-ink underline-offset-2 hover:underline"
                      >
                        {f.name}
                      </Link>
                      <span className="text-[12px] font-semibold uppercase tracking-[.07em] text-muted">
                        {f.status === "live" ? "On" : f.status === "paused" ? "Paused" : "Draft"} · v{f.version}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-muted">{f.triggers.map(triggerLabel).join(", ")}</p>
                    <p className="text-[13px] text-ink">{flowCounts(f)}</p>
                    <p className="text-[12px] text-muted">
                      Changed {when(f.updatedAt)}
                      {f.updatedBy ? ` by ${f.updatedBy}` : ""}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </Card>


      </div>
    </Shell>
  );
}
