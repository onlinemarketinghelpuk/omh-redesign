import "server-only";

/* =========================================================================
   Where the booking calendar's Apps Script is: the dashboard first, then the
   environment.

   Plan 015 lets the owner connect the booking calendar from the dashboard.
   That stores the script's URL and secret in Convex, where an environment
   variable cannot be changed at run time. So the dashboard's value is asked
   for first, and the old GOOGLE_BOOKING_WEBHOOK / GOOGLE_BOOKING_SECRET are
   the fallback, which keeps every deployment that already has them working.

   Kept separate from lib/dashboard/connect.ts on purpose: this runs on the
   public booking form, and that file carries the mail and TLS code.

   Asked once a minute at most. The booking form asks on every date it
   shows, and a Convex round trip on each would be slower for no gain: a
   newly connected script being picked up a minute later is fine.
   ========================================================================= */

const SITE = process.env.OHM_WIDGET_CONVEX_SITE || "https://cool-ferret-103.convex.site";
const SECRET = process.env.OHM_WIDGET_SECRET || "";
const TTL_MS = 60_000;

type Script = { webhook: string; secret: string; from: "dashboard" | "environment" };
let cache: { at: number; value: { url?: string; secret?: string } | null } | null = null;

async function fromDashboard(): Promise<{ url?: string; secret?: string } | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value: { url?: string; secret?: string } | null = null;
  if (SECRET) {
    try {
      const r = await fetch(`${SITE}/integrations/get`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-ohm-secret": SECRET },
        body: "{}",
        signal: AbortSignal.timeout(4_000),
        cache: "no-store",
      });
      if (r.ok) value = ((await r.json()) as { config?: Record<string, { url?: string; secret?: string }> }).config?.booking ?? null;
    } catch {
      /* Convex unreachable: fall back to the environment, below. */
    }
  }
  cache = { at: Date.now(), value };
  return value;
}

export async function bookingScript(): Promise<Script | null> {
  const d = await fromDashboard();
  if (d?.url && d?.secret) return { webhook: d.url, secret: d.secret, from: "dashboard" };
  const webhook = process.env.GOOGLE_BOOKING_WEBHOOK;
  const secret = process.env.GOOGLE_BOOKING_SECRET;
  return webhook && secret ? { webhook, secret, from: "environment" } : null;
}
