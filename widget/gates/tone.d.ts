/* Types for tone.js. */

export type ToneIssue = {
  code: "em_dash" | "never_use" | "avoid_phrase" | "us_date" | "date_format" | "price_format" | "exclamation" | "us_spelling";
  found: string;
  message: string;
};

export declare const NEVER_USE: { word: string; re: RegExp }[];
export declare const AVOID_PHRASES: { re: RegExp; say: string }[];
export declare const US_SPELLINGS: { re: RegExp; uk: string }[];

export declare function toneIssues(text: string | null | undefined): ToneIssue[];
