/* Types for agent.js. */

export type Agent = {
  fromNumber: string;
  days: number[];
  start: number;
  end: number;
  opening: string;
  goal: string;
};

export declare const DEFAULT_AGENT: Agent;
export declare const EARLIEST: number;
export declare const LATEST: number;
export declare function normaliseNumber(raw: unknown): string;
export declare function validateAgent(a: unknown): { ok: boolean; errors: string[] };
export declare function callBrief(agent: Partial<Agent> | null | undefined, lead: { name?: string; service?: string } | null | undefined): { opening: string; goal: string };
export declare function retellOutcome(call: unknown): "answered" | "no_answer" | "failed";
