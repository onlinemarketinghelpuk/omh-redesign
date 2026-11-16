/* Types for brain.js. */

export type Policy = "assistant_only" | "assistant_until_reply" | "owner_only" | "owner_for_interested";
export type Intent = "opt_out" | "not_interested" | "interested" | "question" | "unsure";
export type Sales = { goal: string; offer: string; notes: string };
export type Brain = { enabled: boolean; policies: Record<string, Policy | string>; sales?: Partial<Sales> };
export type Decision = { answer: boolean; handOver: boolean; policy: Policy; intent: Intent; reason: string };

export declare const POLICIES: { key: Policy; label: string; what: string }[];
export declare const DEFAULT_POLICY: Policy;
export declare const CHANNELS: string[];
export declare function isOptOut(text: unknown): boolean;
export declare function quickIntent(text: unknown): Intent;
export declare function policyFor(brain: Brain | null | undefined, channel: string): Policy;
export declare function policyLabel(p: string): string;
export declare function decideReply(input: { brain?: Brain | null; channel: string; text: string }): Decision;
export declare function validateBrain(v: unknown): { ok: boolean; errors: string[] };
export declare const DEFAULT_SALES: Sales;
export declare function salesBrief(input: { brain?: Brain | null; channel: string; lead?: { name?: string; service?: string } }): string;
