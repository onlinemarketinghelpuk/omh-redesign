import { ctx } from "./convex-mock";
import { findPerson, psidFromSession } from "../convex/visitors";
import { saveLead } from "../convex/functions";

/* =========================================================================
   One person across Messenger and the website.

   `findPerson` merged on phone, email and browser id. A Meta DM carries none
   of those: the only identity Meta gives is a PSID, a per-Page id for that
   human, and it reached Convex only buried inside `sessionId` as
   `"meta:<psid>"`. So somebody who wrote on Messenger, chatted, and came
   back a week later through the website form became two rows, and the
   client's dashboard reported two enquiries where there was one person.

   Two properties are asserted here, and the second one is the dangerous one.

   1. A PSID merges. Same human, one row, across both surfaces.

   2. A PSID merges EXACTLY ONE person, and an absent one merges nobody.
      The match is a scan over recent leads, so a falsy key that slipped
      through would match the first row with no psids and hand a stranger's
      name, phone and email to whoever DMs the Page next. `""`, `"meta:"`
      with nothing after it, and a session id that merely contains the word
      are each asserted to find no one.
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

const call = (fn: any, c: any, args: any) => fn._handler(c, args);

/* ------------------------------------------------- reading the psid out */

console.log("\n== the psid is already in the session id ==");
{
  eq("a Meta thread yields its psid", psidFromSession("meta:7281994412"), "7281994412");
  eq("a website session yields nothing", psidFromSession("web-ab12cd34"), undefined);
  eq("an empty session yields nothing", psidFromSession(""), undefined);
  eq("undefined yields nothing", psidFromSession(undefined), undefined);

  /* The ones that would be a leak. A prefix with nothing after it must not
     become an empty-string key that matches the first lead in a scan. */
  eq("'meta:' with nothing after it yields nothing", psidFromSession("meta:"), undefined);
  eq("'meta:' with only spaces yields nothing", psidFromSession("meta:   "), undefined);
  /* And it is a prefix, not a substring: a website session that happens to
     contain the word is not a Meta thread. */
  eq("a session that merely contains the word is not a thread",
     psidFromSession("web-metadata-99"), undefined);
}

/* ------------------------------------------------------- findPerson itself */

console.log("\n== findPerson matches on a psid ==");
{
  const { db, ctx: c } = ctx();
  db.insert("leads", {
    name: "Shahana Begum", at: 2_000, psids: ["7281994412"], visitorIds: [],
  });
  db.insert("leads", { name: "Somebody Else", at: 3_000, psids: [], visitorIds: [] });

  eq("the right person is found",
     (await findPerson(c, { psid: "7281994412" }))?.name, "Shahana Begum");
  eq("an unknown psid finds nobody",
     await findPerson(c, { psid: "9999999999" }), null);

  /* The leak. An empty key must not fall through to the first row. */
  eq("an empty psid finds nobody", await findPerson(c, { psid: "" }), null);
  eq("no psid at all finds nobody", await findPerson(c, {}), null);
}

console.log("\n== a confirmed phone still beats a platform id ==");
{
  const { db, ctx: c } = ctx();
  /* A phone is what a human typed and confirmed. A PSID is what Meta
     assigned. If the two point at different rows, the phone wins. */
  db.insert("leads", {
    /* The key is what `phoneKey` produces, plus sign and all. Written as a
       literal here and not computed, so the fixture cannot silently agree
       with a normaliser that has changed underneath it. */
    name: "By Phone", at: 2_000, phone: "07700 900123", phoneKey: "+447700900123",
    psids: [], visitorIds: [],
  });
  db.insert("leads", { name: "By Psid", at: 3_000, psids: ["7281994412"], visitorIds: [] });

  eq("phone wins when both match different people",
     (await findPerson(c, { phone: "+447700900123", psid: "7281994412" }))?.name,
     "By Phone");
  eq("the psid still works on its own",
     (await findPerson(c, { psid: "7281994412" }))?.name, "By Psid");
}

/* --------------------------------------------- the whole journey, in order */

console.log("\n== Messenger first, then the website form ==");
{
  const { db, ctx: c } = ctx();

  /* They DM the Page. No phone, no email: the assistant captures a name and
     nothing else, which is the realistic case and the one that used to be
     unmergeable. */
  const first: any = await call(saveLead, c, {
    sessionId: "meta:7281994412",
    name: "Shahana",
    channel: "chat",
    sourceChannel: "facebook_dm",
  });
  eq("the DM produced one lead", db.all("leads").length, 1);
  eq("and it recorded the psid, derived from the session id",
     db.all("leads")[0].psids, ["7281994412"]);
  eq("nothing had to pass the psid explicitly for that to happen",
     first.returning, false);

  /* A week later they come back to the same Messenger thread and this time
     give a phone number. */
  const second: any = await call(saveLead, c, {
    sessionId: "meta:7281994412",
    name: "Shahana Begum",
    phone: "07700 900123",
    channel: "chat",
  });
  eq("the same thread is the same person", second.returning, true);
  eq("still one row", db.all("leads").length, 1);
  eq("and the fuller name won", db.all("leads")[0].name, "Shahana Begum");
  eq("this is their second visit", db.all("leads")[0].visits, 2);
}

console.log("\n== the website first, then Messenger ==");
{
  const { db, ctx: c } = ctx();
  db.insert("sessions", {
    sessionId: "web-1", visitorId: "v-1", channel: "chat",
    startedAt: 1_000, lastSeenAt: 1_000,
  });
  await call(saveLead, c, {
    sessionId: "web-1", name: "Imran Hossain", email: "imran@example.com",
    channel: "chat",
  });
  eq("one lead from the website", db.all("leads").length, 1);

  /* They then DM the Page, and the assistant captures the same email. The
     email is what merges them here; the point of this case is that the DM
     must ADD its psid to the existing row rather than start a second one. */
  const back: any = await call(saveLead, c, {
    sessionId: "meta:7281994412", name: "Imran", email: "imran@example.com",
    channel: "chat",
  });
  eq("merged onto the website lead", back.returning, true);
  eq("still one row", db.all("leads").length, 1);
  eq("which now carries the Messenger id too",
     db.all("leads")[0].psids, ["7281994412"]);
  eq("and kept the fuller name", db.all("leads")[0].name, "Imran Hossain");

  /* Which is the whole point: the NEXT DM, with no email given, finds them. */
  eq("so a later DM alone finds the same person",
     (await findPerson(c, { psid: "7281994412" }))?.name, "Imran Hossain");
}

console.log("\n== two different people on the same Page stay two people ==");
{
  const { db, ctx: c } = ctx();
  await call(saveLead, c, { sessionId: "meta:111", name: "First Person", channel: "chat" });
  await call(saveLead, c, { sessionId: "meta:222", name: "Second Person", channel: "chat" });
  eq("two rows", db.all("leads").length, 2);
  eq("first is found by their own id",
     (await findPerson(c, { psid: "111" }))?.name, "First Person");
  eq("second is found by theirs",
     (await findPerson(c, { psid: "222" }))?.name, "Second Person");
}

console.log("\n== a psid is added, never replaced ==");
{
  const { db, ctx: c } = ctx();
  /* Somebody who reaches the Page from Instagram and from Messenger has two
     PSIDs. Keeping only the newest would lose the older thread, so the next
     message in it would start a second person. */
  db.insert("leads", {
    name: "Two Threads", at: 2_000, email: "two@example.com", emailKey: "two@example.com",
    psids: ["111"], visitorIds: [],
  });
  await call(saveLead, c, {
    sessionId: "meta:222", name: "Two Threads", email: "two@example.com", channel: "chat",
  });
  eq("both ids are held", db.all("leads")[0].psids.sort(), ["111", "222"]);
  eq("the old thread still finds them",
     (await findPerson(c, { psid: "111" }))?.name, "Two Threads");
  eq("and so does the new one",
     (await findPerson(c, { psid: "222" }))?.name, "Two Threads");

  /* And it does not accumulate duplicates on every message. */
  await call(saveLead, c, {
    sessionId: "meta:222", name: "Two Threads", email: "two@example.com", channel: "chat",
  });
  eq("the same id twice is still one entry", db.all("leads")[0].psids.length, 2);
}

console.log("\n== a website lead gains no psid out of nowhere ==");
{
  const { db, ctx: c } = ctx();
  db.insert("sessions", {
    sessionId: "web-1", visitorId: "v-1", channel: "chat",
    startedAt: 1_000, lastSeenAt: 1_000,
  });
  await call(saveLead, c, { sessionId: "web-1", name: "Plain Website", channel: "chat" });
  eq("no psids on a website lead", db.all("leads")[0].psids, []);
  /* Which must not then be matched by an empty psid. */
  eq("and an empty psid does not find them", await findPerson(c, { psid: "" }), null);
}

console.log("\n== an explicit psid is honoured, for the router path ==");
{
  const { db, ctx: c } = ctx();
  /* The DM router does not have to go through a `meta:` session id. If it
     passes the psid directly, that is used. */
  await call(saveLead, c, {
    sessionId: "some-other-session", psid: "7281994412",
    name: "Direct From Router", channel: "chat",
  });
  eq("the explicit psid was recorded", db.all("leads")[0].psids, ["7281994412"]);
  eq("and it finds them",
     (await findPerson(c, { psid: "7281994412" }))?.name, "Direct From Router");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
