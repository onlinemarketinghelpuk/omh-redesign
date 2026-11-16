/* The website's own forms, turned into a lead the router can route.

   Until now this did not exist, and the consequence was the largest hole in
   the product: six forms on the marketing site all posted to /api/enquiry,
   which sent an email to the team and stopped. No lead row, no attribution,
   no route, no follow-up. Route B is called "Website form, or a Google Ads
   landing page" and promises a text and an email inside two minutes and a
   call at fifteen. It was built, tested, and had no input at all.

   The forms post arbitrary label/value pairs, because they are six different
   forms written at different times. So the labels have to be read rather
   than assumed, and that reading is the whole of this file.

   Plain JavaScript, no imports, like everything in gates/: the same text is
   asserted by the tests and runs in the route. */

/* Matched in order, first hit wins, so a more specific pattern must come
   before a looser one. "Company name" has to lose to company and not win
   name, and "What service do you need" has to lose to service and not win
   name on the word "need". */
var FIELD_RULES = [
  ["email", /e-?mail/i],
  ["phone", /phone|mobile|telephone|\btel\b|contact number/i],
  ["company", /company|business|organisation|organization|trading name/i],
  ["website", /web\s*site|url|domain/i],
  ["budget", /budget|spend|per month|monthly/i],
  /* "What do you need?" is the live contact form's own wording, and it
     matched none of this until a real submission was driven through the
     browser and came back with the form name where the service should
     have been. */
  ["service", /service|interested in|help with|looking for|package|enquiry about|what do you need|which .*(service|package)|type of work/i],
  /* Same again: the goal textarea is the most valuable field on the
     form and it was arriving empty, because no real form on this site
     calls it "message". */
  ["message", /message|tell us|details?|comments?|anything else|describe|goal|problem|project|brief|requirements?|about your/i],
  /* Last, because almost every other label contains a word that could be
     read as a name. */
  ["name", /name/i],
];

function tidy(v) {
  if (v === undefined || v === null) return undefined;
  var s = Array.isArray(v) ? v.join(", ") : String(v);
  s = s.trim();
  return s ? s.slice(0, 2000) : undefined;
}

/** Read one form's label/value pairs into the fields a lead has. */
function readFields(fields) {
  var out = {};
  var keys = Object.keys(fields || {});
  for (var r = 0; r < FIELD_RULES.length; r++) {
    var want = FIELD_RULES[r][0];
    var rx = FIELD_RULES[r][1];
    if (out[want] !== undefined) continue;
    for (var i = 0; i < keys.length; i++) {
      var label = keys[i];
      /* A label already claimed by an earlier, more specific rule cannot be
         claimed again: "Company name" is the company, not the name. */
      if (out.__used && out.__used.indexOf(label) !== -1) continue;
      if (!rx.test(label)) continue;
      var val = tidy(fields[label]);
      if (val === undefined) continue;
      out[want] = val;
      out.__used = (out.__used || []).concat([label]);
      break;
    }
  }
  delete out.__used;

  /* An email field that does not hold an email is not an email. People type
     "n/a", and a lead with "n/a" in the email column is worse than one with
     nothing, because every later merge keys on it. */
  if (out.email && out.email.indexOf("@") === -1) delete out.email;
  /* Same for a phone with no digits in it. */
  if (out.phone && !/\d/.test(out.phone)) delete out.phone;

  return out;
}

/* The query values worth keeping off the page they submitted from. The
   click ids are the reliable ones: a utm_ can be typed by anyone. */
var ATTR_KEYS = {
  gclid: "gclid", fbclid: "fbclid",
  utm_source: "source", utm_medium: "medium", utm_campaign: "campaign",
  utm_term: "keyword", utm_content: "adGroup",
};

function readAttribution(page, extra) {
  var attr = {};
  var q = {};
  var s = String(page || "");
  var qm = s.indexOf("?");
  if (qm !== -1) {
    var parts = s.slice(qm + 1).split("&");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split("=");
      if (!kv[0]) continue;
      try { q[decodeURIComponent(kv[0]).toLowerCase()] = decodeURIComponent((kv[1] || "").replace(/\+/g, " ")); }
      catch { /* a malformed escape is not a reason to lose the lead */ }
    }
  }
  var src = Object.assign({}, q, extra || {});
  for (var k in ATTR_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(ATTR_KEYS, k)) continue;
    var v = tidy(src[k]);
    if (v) attr[ATTR_KEYS[k]] = v.slice(0, 500);
  }
  if (page) attr.landingPage = String(page).slice(0, 500);
  return Object.keys(attr).length ? attr : undefined;
}

/**
 * One form submission, as the lead router's webhook wants it.
 *
 * @returns { ok: true, lead } or { ok: false, why }
 */
function enquiryToLead(body, opts) {
  var o = opts || {};
  var b = body || {};

  /* The honeypot. These are stored and looked at by hand, and they are
     certainly not texted. A bot that fills a hidden field must not be able
     to make the system ring somebody. */
  if (b.hp) return { ok: false, why: "spam" };

  var f = readFields(b.fields);

  /* Route B's first move is a text and an email. With neither there is
     nowhere to send, and enrolling anyway would put a row on the sequence
     board that can never progress and will be read as a system fault. The
     team still gets the email from the route itself, so nothing is lost. */
  if (!f.email && !f.phone) return { ok: false, why: "no_way_to_reply" };

  var formName = tidy(b.form) || "Website form";

  return {
    ok: true,
    lead: {
      /* Its own id, so this submission is one person's conversation and
         `saveLead` can merge it onto whoever they turn out to be. */
      sessionId: "form-" + (o.now || Date.now()).toString(36) + "-" +
                 String(o.nonce || Math.random().toString(36).slice(2, 8)),
      name: f.name || "Unknown",
      email: f.email,
      phone: f.phone,
      company: f.company,
      service: f.service || formName,
      /* What they actually wrote, with the form it came from in front of
         it, because "Shopify quote questionnaire" is half the context. */
      message: f.message ? formName + ": " + f.message : formName,
      sourceChannel: "website_form",
      attribution: readAttribution(b.page, b.attribution),
    },
  };
}

export { enquiryToLead, readFields, readAttribution, FIELD_RULES };
