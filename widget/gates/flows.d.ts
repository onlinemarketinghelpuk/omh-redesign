/* Types for flows.js. */

export type Basis = "they_contacted_us" | "we_are_contacting_them";
export type SendChannel = "sms" | "email" | "call" | "messenger";
export type Condition = "replied" | "booked" | "opted_out";

export type SendNode = {
  id: string;
  type: "send";
  channel: SendChannel | string;
  message: string;
  onlyIfCallUnanswered?: boolean;
  label?: string;
  why?: string;
};
export type WaitNode =
  | { id: string; type: "wait"; after: { minutes: number }; at?: undefined }
  | { id: string; type: "wait"; at: { addDays: number; hour: number; minute?: number }; after?: undefined };
export type StopIfNode = { id: string; type: "stop_if"; conditions: Condition[] };
export type FlowNode = SendNode | WaitNode | StopIfNode;

export type FlowInput = {
  id?: string;
  name: string;
  triggers: string[];
  nodes: FlowNode[] | unknown[];
};

export type FlowError = { code: string; message: string; nodeId?: string; liveOnly: boolean };
export type FlowWarning = { code: string; message: string };

export type FlowCheck = {
  ok: boolean;
  canSaveDraft: boolean;
  errors: FlowError[];
  warnings: FlowWarning[];
  basis: Basis | null;
  marketing: boolean;
  sends: number;
};

export type CompiledStep = {
  key: string;
  when: { afterMs: number } | { addDays: number; hour: number; minute?: number };
  channel: SendChannel;
  gate: "always" | "no_reply" | "call_no_answer";
  label: string;
  why: string;
};

export type Compiled = {
  id: string;
  name: string;
  intent: string;
  rule: string;
  marketing: boolean;
  immediate: CompiledStep[];
  steps: CompiledStep[];
};

export declare const BASES: Basis[];
export declare const TRIGGERS: Record<string, { label: string; basis: Basis; route: string }>;
export declare const TRIGGER_ORDER: string[];
export declare const MERGED: Record<string, string>;
export declare const CONDITIONS: Condition[];
export declare const NODE_TYPES: string[];
export declare const QUIET_START: number;
export declare const QUIET_END: number;
export declare const WARN_SENDS: number;
export declare const MAX_SENDS: number;
export declare const PECR_CALL_RULE: string;

export declare function canonicalTrigger(s?: string | null): string;
export declare function basisOf(trigger: string): Basis | null;
export declare function basisFor(triggers: unknown): Basis | null;
export declare function defaultRouteFor(trigger: string): string | null;
export declare function triggerLabel(trigger: string): string;
export declare function palette(triggers: unknown): { basis: Basis | null; nodes: string[]; channels: SendChannel[] };
export declare function validateFlow(flow: unknown, opts?: { messages?: Record<string, string> }): FlowCheck;
export declare function compileFlow(flow: FlowInput): Compiled;
export declare function routeToNodes(route: { id: string; immediate: unknown[]; steps: unknown[] }): FlowNode[];
export declare function describeFlow(flow: unknown): string;
export type TimelineRow = {
  nodeId: string;
  when: string;
  channel: string;
  label: string;
  message: string;
  onlyIfCallUnanswered: boolean;
  unlessReplied: boolean;
};
export declare function flowTimeline(flow: unknown): TimelineRow[];
export declare function clockTime(h: number, m: number): string;
export declare function duration(mins: number): string;
