/* =========================================================================
   The Control Panel's view of things: one row per channel, and every
   message with the routes and flows that send it.

   No secret and no server import, so the builder and the message editor
   (client components) can use the same functions the pages use. The rules
   themselves are not here: they are in widget/gates/flows.js and
   widget/gates/message-text.js, which Convex runs on every save.
   ========================================================================= */

import {
  TRIGGER_ORDER, TRIGGERS, defaultRouteFor, routeToNodes, describeFlow,
} from "@/widget/gates/flows.js";
import { ROUTES } from "@/widget/gates/routes";
import { routeMessageKeys, templateSource, messageChannel } from "@/widget/gates/templates";
import type { FlowRow, MessageOverride, MessageHistoryRow } from "./routing";

export type ChannelRow = {
  channel: string;
  label: string;
  basis: "they_contacted_us" | "we_are_contacting_them";
  /** The route the router gives this channel when no flow is live. */
  defaultRoute: string;
  defaultName: string;
  defaultSentence: string;
  live: FlowRow | null;
  /** Drafts and paused flows that list this channel, for "edit" links. */
  others: FlowRow[];
};

/** The sentence for a code route, as it runs for this channel. */
export function routeSentence(routeId: string, channel: string): string {
  const r = (ROUTES as Record<string, (typeof ROUTES)["B"]>)[routeId];
  if (!r) return "";
  if (!r.immediate.length && !r.steps.length) return "Finished in the conversation. Nothing follows.";
  return describeFlow({ name: r.name, triggers: [channel], nodes: routeToNodes(r) });
}

export function channelRows(flows: FlowRow[]): ChannelRow[] {
  return TRIGGER_ORDER.map((channel) => {
    const t = TRIGGERS[channel];
    const route = defaultRouteFor(channel) ?? "B";
    const mine = flows.filter((f) => f.triggers.includes(channel));
    /* The newest live one, which is what the engine picks too. saveFlow
       refuses two live flows on one channel, so there is normally one. */
    const live = mine.filter((f) => f.status === "live").sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
    return {
      channel,
      label: t.label,
      basis: t.basis,
      defaultRoute: route,
      defaultName: ROUTES[route as keyof typeof ROUTES]?.name ?? route,
      defaultSentence: routeSentence(route, channel),
      live,
      others: mine.filter((f) => f !== live),
    };
  });
}

/**
 * What "Make editable" starts from: the channel's route from code, as nodes,
 * on every channel that currently runs that same route with no live flow of
 * its own. One flow then serves them all, which is what the code does today.
 */
export function draftFromDefault(channel: string, flows: FlowRow[]) {
  const route = defaultRouteFor(channel) ?? "B";
  const r = ROUTES[route as keyof typeof ROUTES];
  const covered = new Set(flows.filter((f) => f.status === "live").flatMap((f) => f.triggers));
  const triggers = TRIGGER_ORDER.filter(
    (t) => defaultRouteFor(t) === route && (t === channel || !covered.has(t)),
  );
  return { name: r.name, triggers, nodes: routeToNodes(r) };
}

/* ---------------------------------------------------------------- messages */

export type MessageEntry = {
  key: string;
  channel: string;
  /** Where it is sent from: route steps and the owner's flows. */
  usedBy: { kind: "route" | "flow"; id: string; name: string; step: string; marketing: boolean }[];
  /** Any sender is marketing, so the opt-out is shown on the preview. */
  marketing: boolean;
  inCode: boolean;
  /** The code's words, as editable text. Null for a message only the owner wrote. */
  original: { subject?: string; body: string } | null;
  override: MessageOverride | null;
  history: MessageHistoryRow[];
};

export function messageCatalog(
  overrides: MessageOverride[],
  history: MessageHistoryRow[],
  flows: FlowRow[],
): MessageEntry[] {
  const byKey = new Map(overrides.map((o) => [o.key, o]));
  const keys = [...routeMessageKeys()];
  for (const o of overrides) if (!keys.includes(o.key)) keys.push(o.key);

  return keys.map((key) => {
    const usedBy: MessageEntry["usedBy"] = [];
    for (const r of Object.values(ROUTES)) {
      for (const s of [...r.immediate, ...r.steps]) {
        if (s.key === key) usedBy.push({ kind: "route", id: r.id, name: r.name, step: s.label, marketing: r.marketing });
      }
    }
    for (const f of flows) {
      for (const n of f.nodes) {
        if (n.type === "send" && n.message === key) {
          usedBy.push({ kind: "flow", id: f.id, name: f.name, step: String(n.label ?? ""), marketing: f.basis === "we_are_contacting_them" });
        }
      }
    }
    const src = templateSource(key);
    const override = byKey.get(key) ?? null;
    return {
      key,
      channel: override?.channel ?? (src ? messageChannel(key) : "sms"),
      usedBy,
      marketing: usedBy.some((u) => u.marketing),
      inCode: Boolean(src),
      original: src ? { subject: src.subject, body: src.body } : null,
      override,
      history: history.filter((h) => h.key === key).sort((a, b) => b.at - a.at),
    };
  });
}

/** `{ key: channel }` for every message, for validateFlow in the builder. */
export function messageChannels(entries: MessageEntry[]): Record<string, string> {
  return Object.fromEntries(entries.map((m) => [m.key, m.channel]));
}

/* -------------------------------------------------------------------- demo

   Example data, for ?demo=1. Never written anywhere. */

const H = 60 * 60 * 1000;

export function demoFlows(now = Date.now()): FlowRow[] {
  return [
    {
      id: "demo-flow-ads",
      name: "Google Ads, faster",
      basis: "they_contacted_us",
      triggers: ["google_ads"],
      nodes: [
        { id: "n1", type: "send", channel: "sms", message: "b_sms_first" },
        { id: "n2", type: "send", channel: "email", message: "b_email_first" },
        { id: "n3", type: "stop_if", conditions: ["replied", "booked", "opted_out"] },
        { id: "n4", type: "wait", after: { minutes: 10 } },
        { id: "n5", type: "send", channel: "call", message: "b_call" },
        { id: "n6", type: "wait", after: { minutes: 2 } },
        { id: "n7", type: "send", channel: "sms", message: "b_sms_we_tried", onlyIfCallUnanswered: true },
        { id: "n8", type: "wait", at: { addDays: 1, hour: 10, minute: 0 } },
        { id: "n9", type: "send", channel: "email", message: "b_email_day2" },
      ],
      status: "live",
      version: 3,
      updatedAt: now - 26 * H,
      updatedBy: "owner",
    },
    {
      id: "demo-flow-dormant",
      name: "Dormant clients",
      basis: "we_are_contacting_them",
      triggers: ["reactivation"],
      nodes: [
        { id: "n1", type: "send", channel: "sms", message: "f_sms_first" },
        { id: "n2", type: "stop_if", conditions: ["replied", "opted_out"] },
        { id: "n3", type: "wait", at: { addDays: 6, hour: 11, minute: 0 } },
        { id: "n4", type: "send", channel: "sms", message: "" },
      ],
      status: "draft",
      version: 1,
      updatedAt: now - 3 * H,
      updatedBy: "owner",
    },
  ];
}

export function demoMessages(now = Date.now()): { messages: MessageOverride[]; history: MessageHistoryRow[] } {
  const body = "{{greeting}} it is {{business}}. Thanks for asking about {{service}}. Reply here, or book a free call: {{booking_link}}";
  return {
    messages: [{ key: "b_sms_first", channel: "sms", subject: null, body, updatedAt: now - 5 * H, updatedBy: "owner" }],
    history: [
      { key: "b_sms_first", action: "saved", channel: "sms", subject: null, body, at: now - 5 * H, by: "owner" },
    ],
  };
}

/* Example Brain and agent settings, for ?demo=1. */
export function demoBrain() {
  return {
    enabled: true,
    policies: { google_ads: "owner_for_interested", reactivation: "owner_only", website_form: "assistant_only" } as Record<string, string>,
    sales: {
      goal: "Book the free 30 minute consultation.",
      offer: "A free 30 minute consultation with the team, by phone or video, where they recommend the right package. No charge and no obligation.",
      notes: "",
    },
    updatedAt: Date.now() - 2 * H,
    updatedBy: "owner",
  };
}

export function demoAgent() {
  return {
    fromNumber: "+442034893934",
    days: [1, 2, 3, 4, 5],
    start: 9,
    end: 17,
    opening: "Hi, is that {first_name}? It's Melissa from Online Marketing Help, calling about your enquiry on {service}. Have you got a couple of minutes?",
    goal: "Understand what they need, explain how Online Marketing Help would help, and book the free 30 minute consultation.",
    updatedAt: Date.now() - 6 * H,
    updatedBy: "owner",
  };
}
