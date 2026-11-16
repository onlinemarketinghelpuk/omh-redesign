/* =========================================================================
   Request counters, and the ceilings on every public route.

   This is its own module for a reason that cost an afternoon. The counter
   used to live in `functions.ts`, which imports `visitors.ts` for
   `findPerson` and `attributionArg`. The moment `visitors.ts` needed the
   counter back, the two modules imported each other, and an import cycle in
   Convex does not fail loudly: the second module to load sees `undefined`
   where a value should be, so `v.optional(attributionArg)` is
   `v.optional(undefined)` and the whole deployment fails to build with
   `Cannot read properties of undefined (reading 'asOptional')`, naming
   neither file.

   So the ceilings live here, in a module that imports nothing of ours. Every
   route can reach them and no cycle is possible.

   One counter, one table. Two rate limiters over the same table, with their
   own windows and their own idea of what a session is, is how a visitor ends
   up over one limit and under the other.
   ========================================================================= */

export const WINDOW_MS = 60 * 60 * 1000;   // one hour

/* ------------------------------------------------------------ the chat path

   The route that spends money on a model for every message. These have been
   here from the start. */
export const PER_SESSION = 30;             // a real visitor never needs more
export const PER_IP = 60;                  // an office behind one address
export const PER_DEPLOYMENT = 1500;        // circuit breaker on the whole thing

/* ---------------------------------------------------- the visitor routes

   `/visitorHello` and `/visitorSay` had no ceiling at all. Neither spends
   model money, which is why neither was noticed; both WRITE rows, and a
   public route that writes rows without a ceiling is unbounded table growth,
   a bill, and a dashboard whose counts are whatever a script decided they
   should be.

   The caps below are deliberately high. The hazard on this particular limit
   is NOT abuse: it is a cap set too low, because a refused visitor does not
   look like a bug, it looks like somebody who went quiet. So each one is set
   against what a real visitor could plausibly do in an hour, with room, and
   the tests assert both directions.

   They use their own key prefixes rather than sharing `s:`/`global` with the
   chat limiter. Sharing would mean a burst of page views spending a real
   visitor's chat budget, so they would stop being able to talk to us because
   they read too much of the site. */

/* One per page load. Forty page views in an hour is a heavy reader; a
   hundred and eighty is three a minute, sustained, for an hour. */
export const HELLO_PER_SESSION = 180;
/* The visitor id survives a closed tab, so this is the one a human hits
   across several tabs. A script sending fresh session ids walks past the
   line above and into this one. */
export const HELLO_PER_VISITOR = 400;
/* Fresh ids on both, every time: only a deployment-wide number sees that.
   OMH's site does not do four thousand page views an hour, and if it ever
   does, the right answer is to raise this deliberately. */
export const HELLO_PER_DEPLOYMENT = 4000;

/* Typing to a human who is reading. Sixty is one message a minute for an
   hour, which no real conversation sustains. */
export const SAY_PER_SESSION = 60;
/* Every live handover at once, several times over. */
export const SAY_PER_DEPLOYMENT = 600;

/** One counter, one window, one row per key. Returns whether there is room.
 *
 *  Over the limit it does NOT write, so a refused request costs a read, and
 *  the row count stays at one per key rather than growing with traffic.
 */
export async function bump(ctx: any, key: string, max: number, now: number) {
  const row = await ctx.db
    .query("limits")
    .withIndex("by_key", (i: any) => i.eq("key", key))
    .first();
  if (!row) {
    await ctx.db.insert("limits", { key, windowStart: now, count: 1 });
    return { ok: true, count: 1 };
  }
  if (now - row.windowStart > WINDOW_MS) {
    await ctx.db.patch(row._id, { windowStart: now, count: 1 });
    return { ok: true, count: 1 };
  }
  if (row.count >= max) return { ok: false, count: row.count };
  await ctx.db.patch(row._id, { count: row.count + 1 });
  return { ok: true, count: row.count + 1 };
}
