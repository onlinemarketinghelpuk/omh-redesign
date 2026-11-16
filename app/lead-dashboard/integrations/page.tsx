import Link from "next/link";
import { Shell } from "@/components/dashboard/Shell";
import { Card, Pill } from "@/components/dashboard/ui";
import { ChannelSwitch } from "@/components/dashboard/ChannelSwitch";
import { ConnectCard } from "@/components/dashboard/ConnectCard";
import { connectedForScreen } from "@/lib/dashboard/connect";
import { CONNECTORS } from "@/widget/gates/connectors.js";
import { canWrite } from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo } from "@/lib/dashboard/demo";
import { gatherFacts, switches as readSwitches, type Facts, type Switches } from "@/lib/dashboard/integrations";
import { TRIGGER_ORDER, TRIGGERS } from "@/widget/gates/flows.js";
import {
  INTEGRATIONS, STATE_LABELS, channelStatus, integrationStatus,
  type ChannelState, type Missing,
} from "@/widget/gates/integrations.js";

export const dynamic = "force-dynamic";

/* =========================================================================
   Integrations: every channel, whether it is REALLY connected, and a switch.

   docs/engineering/014-integrations-and-a-switch-per-channel/plan.md.

   Nothing on this page is stored. Each status is worked out when the page
   is opened, from n8n, Retell, Convex and the booking script, by
   widget/gates/integrations.js. A source that cannot be reached is shown as
   "Could not check" with the reason. It is never shown as connected.

   Plan 015 adds "Connect a channel": the owner enters a channel's values,
   the provider checks them, and they go into n8n through its own API (see
   lib/dashboard/connect.ts). The statuses above are still measured, so a
   Connect shows here only once n8n actually holds it.
   ========================================================================= */

/* Pill colours. The word carries the meaning; the colour only agrees. */
const PILL: Record<ChannelState, string> = {
  connected: "confirmed",
  partial: "warm",
  not_connected: "hot",
  could_not_check: "cold",
  off: "cold",
  not_built: "cold",
};

/* What the example screen shows: a believable mix, clearly labelled. */
function exampleFacts(): Facts {
  const W = (name: string, extra: Partial<{ active: boolean; pending: string[]; agentOverride: boolean; senders: string[] }> = {}) => ({
    name: "OHM Assistant \u2014 " + name, active: true, pending: [] as string[], agentOverride: false, senders: [] as string[], ...extra,
  });
  return {
    n8n: {
      checked: true,
      workflows: [
        W("Chat"), W("Voice (Retell tools + web call token)"), W("Lead Router"), W("Twilio Inbound"),
        W("Email Inbound"), W("Meta", { pending: ["META_PAGE_TOKEN_PENDING"] }),
        W("Sequence Worker", { agentOverride: true, senders: ["hello@onlinemarketinghelp.co.uk"] }),
      ],
    },
    retell: { checked: true, agents: ["OMH Site Assistant (Melissa)"], numbers: ["+442034893934"] },
    env: { leadRouterUrl: true },
    agent: { checked: true, fromNumber: "+442034893934" },
    booking: { checked: true, ok: true },
  };
}

function MissingList({ missing, unchecked }: { missing: Missing[]; unchecked: string[] }) {
  if (!missing.length && !unchecked.length) return null;
  return (
    <ul className="mt-2 grid gap-1.5">
      {missing.map((m) => (
        <li key={m.what} className="text-[13px] leading-snug text-ink">
          {m.what}.
          <span className="mt-0.5 block text-[12.5px] text-muted">From {m.from}.</span>
        </li>
      ))}
      {unchecked.map((u) => (
        <li key={u} className="text-[13px] leading-snug text-muted">{u}</li>
      ))}
    </ul>
  );
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const demo = isDemo(await searchParams);
  const [facts, sw, connected]: [Facts, Switches, Record<string, Record<string, unknown>> | null] = demo
    ? [exampleFacts(), { known: true, switches: { whatsapp: false }, updatedAt: null, updatedBy: "owner" }, {}]
    : await Promise.all([gatherFacts(), readSwitches(), connectedForScreen()]);
  /* Not a secret: the address the owner pastes into Meta and Google. */
  const n8nBase = (process.env.N8N_BASE_URL || "").replace(/\/+$/, "");
  const wfOff = (name: string) =>
    (facts.n8n.workflows ?? []).some((w) => w.name.endsWith("\u2014 " + name) && !w.active);
  const checkedAt = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  const writable = !demo && canWrite && dashboardLocked && sw.known;

  const channels = (TRIGGER_ORDER as string[]).map((c) => ({
    channel: c,
    label: (TRIGGERS as Record<string, { label: string }>)[c]?.label ?? c,
    status: channelStatus(c, facts, sw.switches),
  }));
  const out = INTEGRATIONS.filter((i) => i.group === "out").map((i) => integrationStatus(i.key, facts));
  const live = channels.filter((c) => c.status.state === "connected").length;
  const off = channels.filter((c) => c.status.state === "off").length;

  return (
    <Shell
      active="/lead-dashboard/integrations"
      title="Integrations"
      lead="Every channel, whether it is really connected, what is missing, and a switch for each."
      demo={demo}
    >
      <p className="mb-5 max-w-[80ch] text-[13.5px] leading-relaxed text-muted">
        {demo ? "Example data, not checked" : `Checked live at ${checkedAt}`}: {live} of {channels.length} channels
        connected{off ? `, ${off} switched off` : ""}. Nothing here is a saved setting. Every line is read from
        n8n, Retell, the routing store and the booking calendar when you open this page, and anything that could
        not be reached says so instead of showing as connected.
      </p>

      {!sw.known && !demo ? (
        <p className="mb-5 rounded-xl bg-warm px-4 py-3 text-[13.5px] text-muted">
          The switches could not be read from the routing store, so they are not shown rather than shown in a
          state that might be wrong.
        </p>
      ) : null}

      <Card
        title="Where leads come in"
        note="Switching a channel off stops everything automated on it. The assistant stops answering there and anything new goes to Needs a person; anyone part way through a follow-up is paused, and carries on when you switch it back on."
        rise={0}
      >
        <ul className="divide-y divide-line">
          {channels.map(({ channel, label, status }) => (
            <li key={channel} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-sans text-[14.5px] font-semibold text-ink">{label}</p>
                  <Pill kind={PILL[status.state]}>{STATE_LABELS[status.state]}</Pill>
                </div>
                {status.state === "not_built" ? (
                  <p className="mt-1.5 text-[13px] text-muted">Nothing has been built to take leads from this channel yet.</p>
                ) : null}
                {status.state === "off" && status.missing.length ? (
                  <p className="mt-1.5 text-[12.5px] text-muted">Before switching it back on, note:</p>
                ) : null}
                <MissingList missing={status.missing} unchecked={status.unchecked} />
              </div>
              {sw.known || demo ? (
                <ChannelSwitch channel={channel} label={label} on={status.on} canWrite={writable} />
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="How follow-ups go out"
        note="What every channel above relies on to text, email, call and book. These have no switch of their own: stop everything from Settings."
        className="mt-5"
        rise={1}
      >
        <ul className="divide-y divide-line">
          {out.map((s) => (
            <li key={s.key} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-sans text-[14.5px] font-semibold text-ink">{s.label}</p>
                <Pill kind={PILL[s.state]}>{STATE_LABELS[s.state]}</Pill>
              </div>
              <p className="mt-1 text-[13px] text-muted">{s.what}</p>
              {s.note ? <p className="mt-1.5 text-[13px] text-ink">{s.note}</p> : null}
              <MissingList missing={s.missing} unchecked={s.unchecked} />
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Connect a channel"
        note="Each one is checked with the provider before anything is saved. Passwords and tokens go to n8n or are stored out of reach of this page, and are never shown again."
        className="mt-5"
        rise={2}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {CONNECTORS.map((c) => {
            const st = integrationStatus(c.integration, facts);
            const v = (connected ?? {})[c.key] as Record<string, unknown> | undefined;
            const secret = (x: unknown) => (x && typeof x === "object" && (x as { set?: boolean }).set ? `set, ends in ${(x as { last4: string }).last4}` : "not set");
            const summary: string[] = [];
            if (v) {
              if (c.key === "twilio") summary.push(`Texts from ${v.fromNumber}`, `Account ending ${v.accountSidLast4}`);
              if (c.key === "meta") summary.push(`Page: ${v.pageName || v.pageId}`, `Page token ${secret(v.pageToken)}`, `App secret ${secret(v.appSecret)}`);
              if (c.key === "imap") summary.push(`Reading ${v.user} on ${v.host}`);
              if (c.key === "smtp") summary.push(`Sending as ${v.from}`);
              if (c.key === "booking") summary.push(`Script secret ${secret(v.secret)}`);
              if (v.by) summary.push(`Connected by ${v.by}`);
            }
            const copy: { label: string; value: string }[] = [];
            if (c.key === "meta" && v) {
              copy.push({ label: "Callback URL", value: n8nBase ? `${n8nBase}/webhook/ohm-meta` : "(n8n address not set on the website)" });
              copy.push({ label: "Verify token", value: String(v.verifyToken ?? "") });
            }
            if (c.key === "google_lead_form" && v) {
              copy.push({ label: "Webhook URL", value: n8nBase ? `${n8nBase}/webhook/ohm-google-lead-form` : "(n8n address not set on the website)" });
              copy.push({ label: "Key", value: String(v.key ?? "") });
            }
            /* Offered only when the workflow being off is the LAST thing
               missing. Switching the Sequence Worker on while Twilio is a
               placeholder would only make every queued text fail. */
            const onlyThis = (wf: string, key: string) => {
              const m = integrationStatus(key, facts).missing;
              return m.length > 0 && m.every((x) => x.what.includes(`The ${wf} workflow is switched off`));
            };
            /* The Sequence Worker sends EVERY follow-up, texts and emails
               alike, so it is offered only when both are otherwise ready:
               switching it on with Twilio still a placeholder would email
               real people and fail every text. */
            const followUpsReady = onlyThis("Sequence Worker", "texts") && onlyThis("Sequence Worker", "email_followups");
            const activate =
              (c.key === "twilio" || c.key === "smtp") && wfOff("Sequence Worker") && followUpsReady ? "Sequence Worker"
              : c.key === "imap" && wfOff("Email Inbound") && onlyThis("Email Inbound", "email_replies") ? "Email Inbound"
              : undefined;
            return (
              <ConnectCard
                key={c.key}
                connectorKey={c.key}
                label={c.label}
                what={c.what}
                steps={c.steps}
                fields={c.fields}
                state={st.state}
                missing={st.missing}
                summary={summary}
                copy={copy}
                connected={Boolean(v)}
                activate={activate}
                canWrite={!demo && canWrite && dashboardLocked}
              />
            );
          })}
          <ConnectCard
            connectorKey="outbound_calls"
            label="Outbound calls"
            what="The assistant ringing people back about their own enquiry."
            steps={[]}
            fields={[]}
            state={integrationStatus("outbound_calls", facts).state}
            missing={integrationStatus("outbound_calls", facts).missing}
            summary={[]}
            copy={[]}
            connected={false}
            canWrite={false}
            notYet="Set up by us, not here yet: it needs a number imported into Retell and the outbound agent created, which have a cost to agree first."
          />
          <ConnectCard
            connectorKey="whatsapp"
            label="WhatsApp"
            what="Answering WhatsApp messages."
            steps={[]}
            fields={[]}
            state="not_connected"
            missing={[]}
            summary={[]}
            copy={[]}
            connected={false}
            canWrite={false}
            notYet="Nothing has been built for WhatsApp yet."
          />
        </div>
      </Card>

      <p className="mt-5 text-[12.5px] text-muted">
        The number calls come from is set on{" "}
        <Link href={demo ? "/lead-dashboard/agent?demo=1" : "/lead-dashboard/agent"} className="font-semibold text-ink underline underline-offset-2">
          Calling agent
        </Link>
        .
      </p>
    </Shell>
  );
}
