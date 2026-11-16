/* Types for connectors.js. */

export type ConnectorField = {
  key: string;
  label: string;
  kind: "text" | "secret" | "number" | "email" | "url" | "phone";
  required: boolean;
  placeholder?: string;
  help?: string;
};

export type Connector = {
  key: string;
  integration: string;
  label: string;
  what: string;
  workflows: string[];
  steps: string[];
  fields: ConnectorField[];
};

export type Rule =
  | { kind: "credential"; type: string; from: string; to?: string; name?: string; fromName?: string }
  | { kind: "param"; param: string; from: string; to?: string }
  | { kind: "text"; from: string; to?: string };

export type Redacted = Record<string, Record<string, unknown>>;

export declare const CONNECTORS: Connector[];
export declare const SECRET_FIELDS: string[];
export declare const STAND_IN_SMTP: { id: string; name: string; from: string };
export declare const CRED_NAMES: { twilioApi: string; imap: string };

export declare function connector(key: string): Connector | null;
export declare function ukNumber(raw: unknown): string;
export declare function validateConnector(key: string, values: Record<string, unknown>): {
  ok: boolean;
  errors: Record<string, string>;
  clean: Record<string, string | number>;
};
export declare function rulesFor(key: string, values: Record<string, unknown> | null | undefined, disconnect?: boolean): Rule[];
export declare function patchWorkflow(raw: unknown, rules: Rule[]): {
  body: { name: string; nodes: unknown[]; connections: unknown; settings: unknown };
  counts: number[];
  changed: number;
};
export declare function redactConfig(config: Record<string, Record<string, unknown>> | null | undefined): Redacted;
