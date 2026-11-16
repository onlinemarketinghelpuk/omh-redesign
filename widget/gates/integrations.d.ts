/* Types for integrations.js. */

export type IntegrationState = "connected" | "not_connected" | "could_not_check";
export type ChannelState = "connected" | "partial" | "not_connected" | "could_not_check" | "off" | "not_built";

export type Missing = { what: string; from: string };

export type WorkflowFacts = {
  name: string;
  active: boolean;
  pending: string[];
  agentOverride: boolean;
  senders: string[];
};

export type Integration = { key: string; group: "in" | "out"; label: string; what: string };

export type IntegrationStatus = Integration & {
  state: IntegrationState;
  missing: Missing[];
  unchecked: string[];
  note?: string;
};

export type ChannelStatus = {
  channel: string;
  on: boolean;
  state: ChannelState;
  integrations: string[];
  missing: Missing[];
  unchecked: string[];
};

export declare const INTEGRATIONS: Integration[];
export declare const CHANNEL_NEEDS: Record<string, string[]>;
export declare const MERGED: Record<string, string>;
export declare const PLACEHOLDERS: Record<string, Missing>;
export declare const STAND_IN_SENDER: string;
export declare const STATE_LABELS: Record<ChannelState, string>;
export declare const SITE_AGENT: string;

export declare function pendingTokens(text: unknown): string[];
export declare function workflowFacts(raw: unknown): WorkflowFacts;
export declare function integrationStatus(key: string, facts: unknown): IntegrationStatus;
export declare function channelStatus(channel: string, facts: unknown, switches: Record<string, boolean> | null | undefined): ChannelStatus;
export declare function isOn(switches: Record<string, boolean> | null | undefined, channel: string): boolean;

export declare function chatChannel(body: { session_id?: string; page_url?: string } | null | undefined): string | null;
export declare function switchedOffReply(): string;
