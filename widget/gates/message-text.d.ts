/* Types for message-text.js. */

export type MessageContext = {
  name?: string;
  service?: string;
  company?: string;
  message?: string;
  preferredDate?: string;
  preferredTime?: string;
};

export type Variable = { key: string; label: string; example: string; fallback: string };

export type Segments = {
  encoding: "GSM-7" | "UCS-2";
  chars: number;
  units: number;
  segments: number;
  perSegment: number;
};

export type MessageCheck = {
  ok: boolean;
  errors: { code: string; message: string }[];
  warnings: { code: string; message: string }[];
};

export declare const OPT_OUT: string;
export declare const BUSINESS: { business: string; phone: string; email: string; booking_link: string };
export declare const VARIABLES: Variable[];
export declare const EXAMPLE: Required<Omit<MessageContext, "message">>;
export declare const CHANNELS: string[];

export declare function firstName(name?: string | null): string;
export declare function renderText(text: string | null | undefined, ctx: MessageContext): string;
export declare function renderMessage(
  tpl: { channel?: string; subject?: string | null; body?: string | null },
  ctx: MessageContext,
  marketing: boolean,
): { subject?: string; body: string };
export declare function smsSegments(text: string): Segments;
export declare function validateMessage(m: unknown, opts?: { marketing?: boolean }): MessageCheck;
