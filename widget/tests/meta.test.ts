import { createHmac } from "node:crypto";
import {
  verifyChallenge, signatureOk, readMetaEvent, windowOpen, sendBody, leadFields, WINDOW_MS,
} from "../gates/meta.js";

/* =========================================================================
   One webhook, two completely different things, and several ways to turn a
   client's Page into an embarrassment.

   The refusals are the subject of this file, not the matching. Reading a
   lead ad form fill correctly is easy; the things that cost real money are:

   - **Our own replies come back.** Meta echoes every message the Page sends
     on the same webhook, shaped like a normal inbound message. Read one and
     the assistant answers itself, reads that, answers again, and two bots
     hold a conversation on the client's Page until a rate limit stops them.

   - **Meta retries for days.** A webhook that did not get a 200 is sent
     again, so without an idempotency key one form fill becomes two leads and
     two sets of texts to a real person.

   - **The timestamps are not the same unit.** Leadgen sends seconds,
     Messenger sends milliseconds. Mixing them puts leads in 1970.

   - **The signature is the only lock on a public URL.** No secret must mean
     refuse everything, never accept everything.
   ========================================================================= */

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + "\n         got  " + JSON.stringify(got) + "\n         want " + JSON.stringify(want)); }
}
function ok(label: string, cond: boolean) { eq(label, !!cond, true); }

const hmacHex = (raw: string, secret: string) =>
  createHmac("sha256", secret).update(raw, "utf8").digest("hex");

const SECRET = "app-secret-for-tests";

/* ===================================================================== */
console.log("\n== the subscription handshake ==");

eq("the challenge is echoed back",
  verifyChallenge({ "hub.mode": "subscribe", "hub.verify_token": "tok", "hub.challenge": "1234" }, "tok"),
  { ok: true, challenge: "1234" });

eq("a wrong token is refused",
  verifyChallenge({ "hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "1234" }, "tok"),
  { ok: false, why: "bad_token" });

eq("a token that was never configured refuses, it does not pass",
  verifyChallenge({ "hub.mode": "subscribe", "hub.verify_token": "x", "hub.challenge": "1" }, "META_VERIFY_PENDING"),
  { ok: false, why: "not_configured" });

eq("an empty configured token also refuses",
  verifyChallenge({ "hub.mode": "subscribe", "hub.verify_token": "", "hub.challenge": "1" }, ""),
  { ok: false, why: "not_configured" });

eq("the wrong mode is refused",
  verifyChallenge({ "hub.mode": "unsubscribe", "hub.verify_token": "tok", "hub.challenge": "1" }, "tok"),
  { ok: false, why: "bad_mode" });

/* ===================================================================== */
console.log("\n== the signature is the only lock on a public URL ==");

const raw = JSON.stringify({ object: "page", entry: [] });

eq("a correct signature passes",
  signatureOk(raw, "sha256=" + hmacHex(raw, SECRET), SECRET, hmacHex), { ok: true });

eq("a body changed by one byte fails",
  signatureOk(raw + " ", "sha256=" + hmacHex(raw, SECRET), SECRET, hmacHex),
  { ok: false, why: "bad_signature" });

eq("a signature made with a different secret fails",
  signatureOk(raw, "sha256=" + hmacHex(raw, "other"), SECRET, hmacHex),
  { ok: false, why: "bad_signature" });

eq("NO SECRET CONFIGURED REFUSES EVERYTHING",
  signatureOk(raw, "sha256=" + hmacHex(raw, SECRET), "", hmacHex),
  { ok: false, why: "not_configured" });

eq("and a placeholder secret counts as no secret",
  signatureOk(raw, "sha256=" + hmacHex(raw, "META_APP_SECRET_PENDING"), "META_APP_SECRET_PENDING", hmacHex),
  { ok: false, why: "not_configured" });

eq("a missing header is refused",
  signatureOk(raw, "", SECRET, hmacHex), { ok: false, why: "bad_header" });

eq("sha1, the old algorithm, is not accepted",
  signatureOk(raw, "sha1=" + "a".repeat(40), SECRET, hmacHex), { ok: false, why: "bad_header" });

eq("a header that is not 64 hex characters is refused before any compare",
  signatureOk(raw, "sha256=zzzz", SECRET, hmacHex), { ok: false, why: "bad_header" });

/* ===================================================================== */
console.log("\n== THE BUG THAT WOULD HAVE THE PAGE TALK TO ITSELF ==");

const echo = {
  object: "page",
  entry: [{
    id: "PAGE1",
    messaging: [{
      sender: { id: "PAGE1" }, recipient: { id: "USER1" },
      timestamp: 1_700_000_000_000,
      message: { mid: "m_echo", text: "Thanks for getting in touch!", is_echo: true },
    }],
  }],
};
eq("our own outbound, echoed back, produces no event",
  readMetaEvent(echo), { ok: false, why: "nothing_actionable", events: [], skipped: ["echo"] });

eq("a delivery receipt is not a message",
  readMetaEvent({ object: "page", entry: [{ id: "P", messaging: [{ sender: { id: "U" }, delivery: { mids: ["m1"] } }] }] }),
  { ok: false, why: "nothing_actionable", events: [], skipped: ["receipt"] });

eq("a read receipt is not a message either",
  readMetaEvent({ object: "page", entry: [{ id: "P", messaging: [{ sender: { id: "U" }, read: { watermark: 1 } }] }] }),
  { ok: false, why: "nothing_actionable", events: [], skipped: ["receipt"] });

/* ===================================================================== */
console.log("\n== a real DM ==");

const dm = readMetaEvent({
  object: "page",
  entry: [{
    id: "PAGE1",
    messaging: [{
      sender: { id: "USER1" }, recipient: { id: "PAGE1" },
      timestamp: 1_700_000_000_000,
      message: { mid: "m_abc", text: "do you do boilers" },
    }],
  }],
});
ok("it is read", dm.ok);
eq("it goes to route D", dm.events[0].route, "D");
eq("the words survive", dm.events[0].text, "do you do boilers");
eq("the person is the sender, not the page", dm.events[0].psid, "USER1");
eq("the idempotency key is Meta's own message id", dm.events[0].idem, "meta-msg:m_abc");
eq("messenger timestamps are already milliseconds", dm.events[0].at, 1_700_000_000_000);
eq("the surface is messenger", dm.events[0].surface, "messenger");

const ig = readMetaEvent({
  object: "instagram",
  entry: [{ id: "IG1", messaging: [{ sender: { id: "U9" }, recipient: { id: "IG1" }, timestamp: 1, message: { mid: "m9", text: "hi" } }] }],
});
eq("an Instagram DM is the same route, different surface", [ig.events[0].route, ig.events[0].surface], ["D", "instagram"]);
eq("and is attributed to instagram, not facebook", ig.events[0].sourceChannel, "instagram");

eq("a photo with no caption is still a message, not silence",
  readMetaEvent({ object: "page", entry: [{ id: "P", messaging: [{ sender: { id: "U" }, timestamp: 5, message: { mid: "m2", attachments: [{ type: "image" }] } }] }] }).events[0].hasAttachment,
  true);

eq("a button press carries its title through",
  readMetaEvent({ object: "page", entry: [{ id: "P", messaging: [{ sender: { id: "U" }, timestamp: 5, postback: { title: "Book a call", payload: "BOOK" } }] }] }).events[0].text,
  "Book a call");

/* ===================================================================== */
console.log("\n== a lead ad form fill ==");

const lead = readMetaEvent({
  object: "page",
  entry: [{
    id: "PAGE1",
    changes: [{
      field: "leadgen",
      value: { leadgen_id: "L123", page_id: "PAGE1", form_id: "F1", ad_id: "AD1", adgroup_id: "AG1", created_time: 1_700_000_000 },
    }],
  }],
});
ok("it is read", lead.ok);
eq("it goes to route C, never D", lead.events[0].route, "C");
eq("SECONDS ARE CONVERTED TO MILLISECONDS", lead.events[0].createdAt, 1_700_000_000_000);
eq("the advert is carried, which is the whole point of the channel report",
  [lead.events[0].adId, lead.events[0].adgroupId, lead.events[0].formId], ["AD1", "AG1", "F1"]);
eq("the idempotency key is Meta's lead id, so a retry is not a second person",
  lead.events[0].idem, "meta-lead:L123");
eq("it is attributed to the ads channel", lead.events[0].sourceChannel, "facebook_ads");

eq("a change that is not leadgen is skipped, not guessed at",
  readMetaEvent({ object: "page", entry: [{ id: "P", changes: [{ field: "feed", value: {} }] }] }),
  { ok: false, why: "nothing_actionable", events: [], skipped: ["field:feed"] });

/* ===================================================================== */
console.log("\n== Meta batches, and dropping the rest is invisible under load ==");

const batch = readMetaEvent({
  object: "page",
  entry: [
    { id: "P", messaging: [{ sender: { id: "A" }, timestamp: 1, message: { mid: "m1", text: "one" } }] },
    { id: "P", messaging: [
      { sender: { id: "B" }, timestamp: 2, message: { mid: "m2", text: "two" } },
      { sender: { id: "C" }, timestamp: 3, message: { mid: "m3", text: "three" } },
    ] },
    { id: "P", changes: [{ field: "leadgen", value: { leadgen_id: "L1", created_time: 1 } }] },
  ],
});
eq("every event in the batch comes back", batch.events.length, 4);
eq("and they keep their own kinds", batch.events.map((e: any) => e.kind), ["message", "message", "message", "leadgen"]);

eq("an object we never subscribed to is refused whole",
  readMetaEvent({ object: "whatsapp_business_account", entry: [] }),
  { ok: false, why: "unknown_object", events: [] });

eq("rubbish does not throw", readMetaEvent(null as any).ok, false);

/* ===================================================================== */
console.log("\n== the 24 hour window, measured from THEIR last message ==");

const now = 1_700_000_000_000;
eq("fresh message, wide open", windowOpen(now - 60_000, now).open, true);
eq("twenty hours in, still open", windowOpen(now - 20 * 3600_000, now).open, true);
eq("past twenty four hours, shut", windowOpen(now - WINDOW_MS - 1, now), { open: false, why: "window_shut", msLeft: 0 });

/* Route D's last step fires at 20 hours. This is the assertion that says the
   step can actually be delivered when it fires. */
ok("route D's 20 hour step still has the window open when it fires",
  windowOpen(now - 20 * 3600_000, now).open);

eq("a person who never messaged us has no window at all",
  windowOpen(0, now), { open: false, why: "never_messaged", msLeft: 0 });

eq("two minutes before it shuts we decline rather than race the queue",
  windowOpen(now - (WINDOW_MS - 2 * 60_000), now).open, false);
eq("and we say why, rather than looking like the window was already shut",
  windowOpen(now - (WINDOW_MS - 2 * 60_000), now).why, "too_close");

/* ===================================================================== */
console.log("\n== what we send back ==");

const body = sendBody("USER1", "Yes, we do boilers. What is the postcode?", "messenger");
eq("addressed to the person", body.recipient.id, "USER1");
eq("typed as a response, which is what keeps it inside the free window", body.messaging_type, "RESPONSE");
eq("no tag is attached", (body as any).tag, undefined);
eq("a long reply is cut to Meta's limit rather than rejected by the API",
  sendBody("U", "x".repeat(5000), "messenger").message.text.length, 2000);

/* ===================================================================== */
console.log("\n== THE WEBHOOK DOES NOT CONTAIN THE PERSON ==");

/* The event carries a leadgen_id and nothing else about them. These are the
   `field_data` pairs the second Graph call returns. Getting this wrong
   creates a lead that is on time, correctly attributed and empty, which then
   enters a follow-up sequence with nobody to text. */

eq("a plain form", leadFields([
  { name: "full_name", values: ["Jane Hill"] },
  { name: "email", values: ["jane@example.com"] },
  { name: "phone_number", values: ["07700 900123"] },
]), { name: "Jane Hill", email: "jane@example.com", phone: "07700 900123" });

eq("first and last are joined when there is no full name", leadFields([
  { name: "first_name", values: ["Jane"] },
  { name: "last_name", values: ["Hill"] },
]), { name: "Jane Hill" });

eq("a mobile field is still a phone number",
  leadFields([{ name: "mobile_number", values: ["07700 900123"] }]), { phone: "07700 900123" });

eq("Meta's work email variant is still an email",
  leadFields([{ name: "work_email", values: ["j@co.uk"] }]), { email: "j@co.uk" });

eq("a question the client added to their form is kept, not dropped",
  leadFields([{ name: "what_do_you_need", values: ["New boiler"] }]), { message: "New boiler" });

eq("empty values do not become empty fields",
  leadFields([{ name: "email", values: [""] }, { name: "phone_number", values: [] }]), {});

eq("rubbish does not throw", leadFields(null as any), {});

/* ===================================================================== */
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
