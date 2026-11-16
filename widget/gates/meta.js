/* Facebook and Instagram, turned into something routes C and D can use.

   One webhook carries both things we want. A lead ad form fill arrives as a
   `changes` entry with field `leadgen`, and a Messenger or Instagram DM
   arrives as a `messaging` entry. They go to different routes (C and D) and
   have nothing else in common, so the first job here is telling them apart
   and refusing everything else Meta sends down the same pipe.

   THE WEBHOOK IS A PUBLIC URL, like Google's. Meta signs every POST with
   the app secret, so the signature is the only thing standing between the
   internet and rows in the client's lead table. It is checked before the
   body is read, and a server with no secret configured refuses everything
   rather than accepting everything. Failing open here is silent: by the time
   anybody notices, the table is full of invented people and the follow-up
   engine has texted all of them.

   Plain JavaScript, no imports, like everything in gates/: the same text is
   asserted by the tests and embedded in the n8n Code node. The one thing it
   cannot do without an import is HMAC, so the caller passes a function in.
   That keeps the gate testable and keeps `require` out of the sandbox. */

/* Meta's 24 hour standard messaging window, measured from the person's LAST
   message, not their first. Route D's final step fires at 20 hours, which is
   why the margin matters: a window computed from the wrong end of the
   conversation would have us send after it shut, and Meta returns an error
   rather than quietly dropping it. */
var WINDOW_MS = 24 * 60 * 60 * 1000;

/* How long before the window shuts we still consider it safe to send. A send
   decided at 23:59:59 can easily be delivered at 24:00:01 once the queue and
   the Graph call have taken their time. */
var WINDOW_MARGIN_MS = 5 * 60 * 1000;

/* ------------------------------------------------------------------ verify

   Meta calls the webhook once with GET to prove we own it. Answer with the
   challenge and only with the challenge: anything else and the subscription
   silently never activates, which looks exactly like "Meta is not sending us
   anything" for as long as nobody checks. */
function verifyChallenge(query, verifyToken) {
  var q = query && typeof query === "object" ? query : {};
  if (!verifyToken || String(verifyToken).indexOf("PENDING") !== -1) {
    return { ok: false, why: "not_configured" };
  }
  if (String(q["hub.mode"] || "") !== "subscribe") return { ok: false, why: "bad_mode" };
  if (String(q["hub.verify_token"] || "") !== String(verifyToken)) {
    return { ok: false, why: "bad_token" };
  }
  var c = String(q["hub.challenge"] || "");
  if (!c) return { ok: false, why: "no_challenge" };
  return { ok: true, challenge: c };
}

/* --------------------------------------------------------------- signature

   X-Hub-Signature-256 is `sha256=<hex>` of the RAW body with the app secret.
   Raw matters: re-serialising the parsed JSON changes the bytes (key order,
   whitespace, unicode escaping) and the digest stops matching for reasons
   that look like a Meta bug rather than our own.

   @param raw      the exact body bytes as a string
   @param header   the X-Hub-Signature-256 header
   @param secret   the Meta app secret
   @param hmacHex  (raw, secret) => hex digest. Injected so this file needs
                   no imports; the test and the n8n node both pass node's
                   crypto.
*/
function signatureOk(raw, header, secret, hmacHex) {
  if (!secret || String(secret).indexOf("PENDING") !== -1) {
    return { ok: false, why: "not_configured" };
  }
  if (typeof hmacHex !== "function") return { ok: false, why: "no_hmac" };
  var h = String(header || "");
  if (h.indexOf("sha256=") !== 0) return { ok: false, why: "bad_header" };
  var sent = h.slice(7).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sent)) return { ok: false, why: "bad_header" };

  var want;
  try { want = String(hmacHex(String(raw == null ? "" : raw), secret)).toLowerCase(); }
  /* The binding is omitted, not ignored: whatever hmacHex threw, the
     answer is the same refusal, and a named-but-unread error reads like
     something was meant to be done with it. */
  catch { return { ok: false, why: "hmac_failed" }; }
  if (!/^[0-9a-f]{64}$/.test(want)) return { ok: false, why: "hmac_failed" };

  /* Constant time compare. Both are 64 hex characters by the time we are
     here, so the lengths are equal and the loop does not leak that much,
     but a plain === on a secret-derived value is the habit worth not
     having. */
  var diff = 0;
  for (var i = 0; i < 64; i++) diff |= sent.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, why: "bad_signature" };
}

/* ------------------------------------------------------------------- read

   One payload can carry several entries, and one entry several events. Meta
   batches, so returning only the first would quietly drop messages under
   load, which is the hardest kind of bug to see: it only happens when the
   client is busy.
*/
function readMetaEvent(body) {
  var b = body && typeof body === "object" ? body : {};
  var object = String(b.object || "");

  /* `page` carries Messenger and lead ads. `instagram` carries IG DMs.
     Anything else is a subscription we did not ask for. */
  if (object !== "page" && object !== "instagram") {
    return { ok: false, why: "unknown_object", events: [] };
  }

  var entries = Array.isArray(b.entry) ? b.entry : [];
  var events = [];
  var skipped = [];

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i] || {};
    var pageId = String(e.id || "");

    /* --- lead ad forms ------------------------------------------------ */
    var changes = Array.isArray(e.changes) ? e.changes : [];
    for (var c = 0; c < changes.length; c++) {
      var ch = changes[c] || {};
      if (String(ch.field || "") !== "leadgen") { skipped.push("field:" + ch.field); continue; }
      var v = ch.value || {};
      var leadId = String(v.leadgen_id || "");
      if (!leadId) { skipped.push("leadgen:no_id"); continue; }
      events.push({
        kind: "leadgen",
        route: "C",
        /* Meta retries a webhook it did not get a 200 for, for days. Without
           an idempotency key the same form fill becomes a second lead and a
           second set of texts to a real person. */
        idem: "meta-lead:" + leadId,
        leadgenId: leadId,
        pageId: String(v.page_id || pageId),
        formId: String(v.form_id || ""),
        adId: String(v.ad_id || ""),
        adgroupId: String(v.adgroup_id || ""),
        /* Meta sends created_time in SECONDS. Treating it as milliseconds
           puts every lead in 1970, which sorts them to the bottom of the
           dashboard and makes every speed measure meaningless. */
        createdAt: v.created_time ? Number(v.created_time) * 1000 : null,
        sourceChannel: object === "instagram" ? "instagram_ads" : "facebook_ads",
      });
    }

    /* --- messages ----------------------------------------------------- */
    var msgs = Array.isArray(e.messaging) ? e.messaging : [];
    for (var m = 0; m < msgs.length; m++) {
      var mm = msgs[m] || {};

      /* Delivery and read receipts arrive on the same array. They are not
         messages and counting them would mark a lead as having replied to
         a message we sent them. */
      if (mm.delivery || mm.read) { skipped.push("receipt"); continue; }

      var msg = mm.message || {};

      /* OUR OWN OUTBOUND COMES BACK. Meta echoes every message the Page
         sends, on the same webhook, as a normal-looking inbound event. With
         this line missing the assistant reads its own reply as the visitor
         speaking, answers it, reads that answer, and the two of them talk to
         each other until the rate limit stops it. */
      if (msg.is_echo) { skipped.push("echo"); continue; }

      var psid = String((mm.sender || {}).id || "");
      if (!psid) { skipped.push("message:no_sender"); continue; }

      /* A postback is a button press, not typed text, but it is still the
         person choosing to engage, so it starts the same route. */
      var text = String(msg.text || "");
      var post = mm.postback || null;
      if (!text && post) text = String(post.title || post.payload || "");

      /* An attachment with no text is still a message. Treating it as empty
         loses the turn entirely and the person gets silence back. */
      var atts = Array.isArray(msg.attachments) ? msg.attachments : [];
      if (!text && !atts.length && !post) { skipped.push("message:empty"); continue; }

      var at = mm.timestamp ? Number(mm.timestamp) : null;
      events.push({
        kind: "message",
        route: "D",
        /* `mid` is Meta's own id for the message and is stable across the
           retries. A postback has none, so the sender plus the timestamp
           stands in. */
        idem: "meta-msg:" + (msg.mid || (psid + ":" + String(at || ""))),
        psid: psid,
        pageId: String((mm.recipient || {}).id || pageId),
        text: text,
        hasAttachment: atts.length > 0,
        /* Messenger timestamps are already milliseconds, unlike leadgen's
           created_time. The asymmetry is Meta's, not ours. */
        at: at,
        surface: object === "instagram" ? "instagram" : "messenger",
        sourceChannel: object === "instagram" ? "instagram" : "facebook",
      });
    }
  }

  if (!events.length) return { ok: false, why: "nothing_actionable", events: [], skipped: skipped };
  return { ok: true, events: events, skipped: skipped };
}

/* ------------------------------------------------------------------ window

   Whether we may still message this person for free.

   @param lastInboundAt  when THEY last messaged us
   @param now            now
*/
function windowOpen(lastInboundAt, now) {
  var last = Number(lastInboundAt);
  var t = Number(now);
  if (!isFinite(last) || !last) return { open: false, why: "never_messaged", msLeft: 0 };
  var left = (last + WINDOW_MS) - t;
  if (left <= 0) return { open: false, why: "window_shut", msLeft: 0 };
  if (left <= WINDOW_MARGIN_MS) return { open: false, why: "too_close", msLeft: left };
  return { open: true, msLeft: left };
}

/* -------------------------------------------------------------- lead fields

   THE WEBHOOK DOES NOT CONTAIN THE PERSON. It carries a `leadgen_id` and
   nothing else about them: no name, no phone, no email. Those come from a
   second Graph call on that id, which returns `field_data` as a list of
   `{ name, values }` pairs rather than named fields.

   Miss this and a lead is still created, on time, correctly attributed, and
   completely empty. It then enters a follow-up sequence that has nobody to
   text. That is worse than failing, because it looks like it worked.

   Meta's field names vary by how the form was built, so each is matched on
   what it contains rather than on an exact string. */
function leadFields(fieldData) {
  var rows = Array.isArray(fieldData) ? fieldData : [];
  var out = {};
  var first = "", last = "";

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i] || {};
    var key = String(r.name || "").toLowerCase();
    var vals = Array.isArray(r.values) ? r.values : [];
    var v = String(vals.length ? vals[0] : "").trim();
    if (!v) continue;

    if (key === "full_name" || key === "name") out.name = v;
    else if (key === "first_name") first = v;
    else if (key === "last_name") last = v;
    else if (key.indexOf("email") !== -1) out.email = v;
    else if (key.indexOf("phone") !== -1 || key.indexOf("mobile") !== -1) out.phone = v;
    else if (key.indexOf("company") !== -1) out.company = v;
    else if (key.indexOf("post_code") !== -1 || key.indexOf("postcode") !== -1 || key === "zip") out.postcode = v;
    else if (key.indexOf("city") !== -1) out.city = v;
    /* Anything else the client added to their form is kept as the message,
       because it is usually the one question that says what they want. */
    else if (!out.message) out.message = v;
  }

  if (!out.name && (first || last)) out.name = (first + " " + last).trim();
  return out;
}

/* --------------------------------------------------------------- send body

   What we POST to the Send API. The recipient shape differs between a reply
   in a thread and anything else, and the tag is deliberately absent: a
   message sent outside the window needs an approved tag, and we would rather
   not send than send under a tag that does not honestly describe the
   message. Route D stops at 20 hours for exactly that reason. */
function sendBody(psid, text, surface) {
  return {
    recipient: { id: String(psid) },
    messaging_type: "RESPONSE",
    message: { text: String(text == null ? "" : text).slice(0, 2000) },
    /* Instagram and Messenger take the same shape on the Page's token; the
       surface is carried so the caller picks the right Page id and so the
       touch is recorded against the channel the person actually used. */
    _surface: surface === "instagram" ? "instagram" : "messenger",
  };
}

/* One line, like every other gate. gate_inline() drops lines starting with
   `export {`, so a multi-line export block would leave its members behind as
   dangling syntax inside the Code node. */
export { WINDOW_MS, WINDOW_MARGIN_MS, verifyChallenge, signatureOk, readMetaEvent, windowOpen, sendBody, leadFields };
