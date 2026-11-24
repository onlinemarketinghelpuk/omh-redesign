import { NextResponse } from "next/server";

/*
  The front door for the public POST routes (/api/enquiry, /api/book-demo).
  Each accepted post costs a Sanity document and SMTP sends against the
  mailbox's daily cap, and since 24 Nov 2026 it also emails whatever address
  was typed in. Restored that day: the 22 Oct guard had gone missing.

    const blocked = guard(request);
    if (blocked) return blocked;
    const body = await readJson(request);
    if (body instanceof NextResponse) return body;
*/

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/* ponytail: in-memory per IP, fine for the single container on the VPS; resets on each deploy. The IP comes from
   Cloudflare's header, which someone hitting the VPS directly could fake: Cloudflare WAF / an origin lock is the upgrade. */
const LIMITS = [
  { windowMs: 60_000, max: 5 },
  { windowMs: 3_600_000, max: 20 },
];
const hits = new Map<string, number[]>();

function clientIp(request: Request) {
  const h = request.headers;
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

/** Same-site browser posts only, and not too many of them. Returns a response to send back, or null to carry on. */
export function guard(request: Request, now = Date.now()): NextResponse | null {
  // Every browser sends Origin on a fetch POST. A missing or foreign one is a script or another site.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameSite = false;
  try {
    sameSite = Boolean(origin && host && new URL(origin).host === host);
  } catch {}
  if (!sameSite) return fail("Forbidden.", 403);

  const ip = clientIp(request);
  const longest = LIMITS[LIMITS.length - 1].windowMs;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < longest);
  if (LIMITS.some(({ windowMs, max }) => recent.filter((t) => now - t < windowMs).length >= max)) {
    hits.set(ip, recent);
    return fail("Too many submissions. Please wait a little and try again.", 429);
  }
  recent.push(now);
  if (hits.size > 10_000) hits.clear();
  hits.set(ip, recent);
  return null;
}

const MAX_BODY = 64 * 1024;

/** The parsed JSON object, or a response to send back. */
export async function readJson(request: Request): Promise<Record<string, unknown> | NextResponse> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail("Too large.", 413);
  try {
    const body: unknown = JSON.parse(raw);
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  return fail("Invalid request.", 400);
}

/** Strips control characters (keeps tab and newline), which have no place in a form answer or an email. */
export const clean = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max);

/** A form's answers, capped: 60 fields, 200-character labels, 5,000-character answers. */
export function cleanFields(fields: unknown): Record<string, string | string[]> {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return {};
  return Object.fromEntries(
    Object.entries(fields)
      .slice(0, 60)
      .map(([label, value]) => [
        clean(label, 200),
        Array.isArray(value) ? value.slice(0, 60).map((v) => clean(v, 5000)) : clean(value, 5000),
      ]),
  );
}
