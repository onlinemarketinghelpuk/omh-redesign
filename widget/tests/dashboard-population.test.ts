import { ctx } from "./convex-mock";
import { recent, DASHBOARD_LIMIT } from "../convex/functions";

/* =========================================================================
   The Leads screen and the Channels screen must count the same people.

   Found by a reviewer reading the code, and NOT by any of the browser passes
   that came before it, because every one of those ran with `?demo=1`, and
   demo mode calls `demoLeads()` and never touches this query at all. A
   screen can be driven, looked at, screenshotted and still be measured in
   a population the real one never has.

   What was wrong: `functions:recent` was a hard `.take(25)` with no
   argument, and it is the only source for the Leads screen, the Bookings
   screen and the Overview's lead figures. The Channels screen reads
   `getChannelFacts(undefined, 1000)`. So on real data, Channels says 329
   leads and the Leads screen next to it says 25, with "Leads captured" over
   the top of it.

   It is worse than a display cap in two ways:

     1. test rows are filtered AFTER the take, so if nine of the newest
        twenty five are ours, the client is shown sixteen leads and told
        that is all of them;
     2. every Channels row links to the Leads screen filtered by channel,
        promising "this is where those 34 are", and the destination held
        twenty five rows in total.

   A client quoting "we got 25 leads" from a screen that means "the 25 most
   recent" is the kind of wrong that gets repeated in a meeting.
   ========================================================================= */

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  if (good) { pass++; console.log("  ok   " + label); }
  else {
    fail++;
    console.log("  FAIL " + label +
      "\n         got  " + JSON.stringify(got) +
      "\n         want " + JSON.stringify(want));
  }
}
function ok(label: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail ? "\n         " + detail : "")); }
}

const call = (fn: any, c: any, args: any = {}) => fn._handler(c, args);

function seeded(n: number) {
  const { db, ctx: c } = ctx();
  for (let i = 0; i < n; i++) {
    db.insert("leads", {
      name: `Person ${i}`, at: 1_000 + i, status: "new", visitorIds: [], psids: [],
    });
  }
  return { db, c };
}

console.log("\n== the number the client reads is not a page size ==");
{
  /* The size that broke it. Thirty leads is a quiet fortnight for one
     business, and it is already more than the old cap. */
  const { c } = seeded(30);
  const out: any = await call(recent, c, {});
  ok(`the default reaches past 25 (it is ${DASHBOARD_LIMIT})`, DASHBOARD_LIMIT > 25);
  eq("all thirty leads come back, not the newest twenty five", out.leads.length, 30);
}

console.log("\n== it matches what the Channels screen counts ==");
{
  /* Channels reads getChannelFacts(undefined, 1000). If this number is
     smaller, the two screens disagree on real data and the one that is
     wrong is the one labelled "Leads captured". */
  ok(`the default is at least the 1000 Channels asks for (it is ${DASHBOARD_LIMIT})`,
     DASHBOARD_LIMIT >= 1000);
}

console.log("\n== but it is still bounded ==");
{
  /* Unbounded is not the fix. A query with no ceiling is a page that gets
     slower every week until it times out, and the failure arrives as a
     blank dashboard rather than as a slow one. */
  const { c } = seeded(DASHBOARD_LIMIT + 40);
  const out: any = await call(recent, c, {});
  eq("the ceiling holds", out.leads.length, DASHBOARD_LIMIT);

  const asked: any = await call(recent, c, { limit: 10 });
  eq("a caller can ask for fewer", asked.leads.length, 10);

  const greedy: any = await call(recent, c, { limit: 999_999 });
  eq("and cannot ask for more than the ceiling", greedy.leads.length, DASHBOARD_LIMIT);
}

console.log("\n== newest first, because the screens say 'recent' ==");
{
  const { c } = seeded(40);
  const out: any = await call(recent, c, { limit: 3 });
  eq("the three newest, in order",
     out.leads.map((l: any) => l.name), ["Person 39", "Person 38", "Person 37"]);
}

console.log("\n== bookings and escalations are capped the same way ==");
{
  const { db, ctx: c } = ctx();
  for (let i = 0; i < 30; i++) {
    db.insert("bookings", { reference: `R${i}`, preferredDate: `2026-11-${(i % 28) + 1}`, status: "new" });
    db.insert("escalations", { sessionId: `s${i}`, reason: "r", question: "q", at: 1_000 + i });
  }
  const out: any = await call(recent, c, {});
  eq("thirty bookings, not twenty five", out.bookings.length, 30);
  eq("thirty escalations, not twenty five", out.escalations.length, 30);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
