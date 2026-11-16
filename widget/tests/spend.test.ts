import { ctx } from "./convex-mock";
import { setChannelSpend, channelSpend as getChannelSpend } from "../convex/routing";

/* =========================================================================
   What each channel costs, which is the one figure the system cannot work
   out for itself.

   Workstream 002's plan named this file and described exactly what it should
   assert. It was never written, so `not_a_cost` and the cross-channel
   isolation below had zero assertions behind them until a reviewer went
   looking for the file and found nothing. A test named in a plan and absent
   from disk is worse than one that was never planned: the checklist says it
   is covered.

   Everything here protects one rule from ADR-008: **nothing is called
   profitable without a spend figure.** What the system knows is leads,
   bookings and the value typed on a win. What it does not know is what any
   of that cost, and a zero in place of "we were never told" reads as "it
   cost us nothing", which turns an unknown into a free channel and sends
   next month's budget to the wrong place.
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

/* ------------------------------------------------- absent, not zero */

console.log("\n== a channel nobody has priced is absent, not free ==");
{
  const { ctx: c } = ctx();
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 3100 });
  const read: any = await call(getChannelSpend, c, {});

  eq("the one we set is there", read.spend.google_ads, 3100);
  eq("one we never set is undefined, not 0",
     Object.prototype.hasOwnProperty.call(read.spend, "facebook_ads"), false);
  /* The distinction the whole rule rests on. `?? 0` anywhere downstream
     turns "we were never told" into "it cost nothing", and every profit
     figure built on it is then wrong in the flattering direction. */
  ok("so a reader can tell 'not told' from 'told it was nothing'",
     read.spend.facebook_ads === undefined);
}

console.log("\n== clearing it puts the channel back to absent ==");
{
  const { ctx: c } = ctx();
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 3100 });
  await call(setChannelSpend, c, { channel: "google_ads", pounds: null });
  const read: any = await call(getChannelSpend, c, {});
  eq("null removes the figure rather than storing a null",
     Object.prototype.hasOwnProperty.call(read.spend, "google_ads"), false);

  /* Zero is treated the same way on purpose: somebody clearing a box types
     nothing or types 0, and both mean "I am not telling you a figure". A
     stored 0 would read as a priced, free channel. */
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 3100 });
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 0 });
  const read2: any = await call(getChannelSpend, c, {});
  eq("and so does zero",
     Object.prototype.hasOwnProperty.call(read2.spend, "google_ads"), false);
}

/* --------------------------------------------------- what is refused */

console.log("\n== a figure that is not a cost is refused ==");
{
  const { ctx: c } = ctx();
  for (const bad of [-1, -0.01, -3100, NaN, Infinity, -Infinity]) {
    const r: any = await call(setChannelSpend, c, { channel: "google_ads", pounds: bad });
    eq(`${String(bad)} is refused`, [r.ok, r.why], [false, "not_a_cost"]);
  }
  const read: any = await call(getChannelSpend, c, {});
  eq("and nothing was written by any of them", read.spend, {});

  const blank: any = await call(setChannelSpend, c, { channel: "   ", pounds: 100 });
  eq("a blank channel name is refused", [blank.ok, blank.why], [false, "no_channel"]);
}

console.log("\n== a legitimate figure is kept exactly ==");
{
  const { ctx: c } = ctx();
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 3100.5 });
  const read: any = await call(getChannelSpend, c, {});
  eq("pence survive", read.spend.google_ads, 3100.5);
}

/* ------------------------------------------- one channel, one figure */

console.log("\n== a figure set for one channel does not appear against another ==");
{
  const { ctx: c } = ctx();
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 3100 });
  await call(setChannelSpend, c, { channel: "facebook_ads", pounds: 2400 });
  await call(setChannelSpend, c, { channel: "whatsapp", pounds: 350 });

  const read: any = await call(getChannelSpend, c, {});
  eq("each one holds its own number",
     [read.spend.google_ads, read.spend.facebook_ads, read.spend.whatsapp],
     [3100, 2400, 350]);
  eq("and only those three are priced", Object.keys(read.spend).sort(),
     ["facebook_ads", "google_ads", "whatsapp"]);

  /* Changing one must not disturb the others. They share a single settings
     row, so a write that replaced the object instead of merging into it
     would silently unprice every other channel, and the screens would
     report those as unknown rather than as an error. */
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 4000 });
  const after: any = await call(getChannelSpend, c, {});
  eq("the one changed", after.spend.google_ads, 4000);
  eq("the others untouched",
     [after.spend.facebook_ads, after.spend.whatsapp], [2400, 350]);

  /* And clearing one clears only that one. */
  await call(setChannelSpend, c, { channel: "facebook_ads", pounds: null });
  const after2: any = await call(getChannelSpend, c, {});
  eq("clearing is just as narrow", Object.keys(after2.spend).sort(),
     ["google_ads", "whatsapp"]);
}

console.log("\n== the name is taken as written, minus the whitespace ==");
{
  const { ctx: c } = ctx();
  await call(setChannelSpend, c, { channel: "  google_ads  ", pounds: 3100 });
  const read: any = await call(getChannelSpend, c, {});
  eq("stored trimmed, so one channel is not two rows",
     Object.keys(read.spend), ["google_ads"]);
}

console.log("\n== who changed it, and when ==");
{
  const { ctx: c } = ctx();
  const before = Date.now();
  await call(setChannelSpend, c, { channel: "google_ads", pounds: 3100, by: "omh" });
  const read: any = await call(getChannelSpend, c, {});
  /* A figure the client's budget is judged against needs an author. "The
     number changed and nobody knows who typed it" is not a position to be
     in during a billing conversation. */
  eq("the author is recorded", read.updatedBy, "omh");
  ok("and the time is", typeof read.updatedAt === "number" && read.updatedAt >= before,
     String(read.updatedAt));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
