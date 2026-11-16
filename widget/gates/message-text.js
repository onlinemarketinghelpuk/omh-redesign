/* =========================================================================
   Messages the owner writes: variables, the opt-out, and what a text costs.

   Plain JavaScript, one export line. Rendered in Convex when a step is
   sent, previewed in the dashboard as the owner types, and asserted by
   widget/tests/message-text.test.ts, all from this one text.

   ONE IMPORT, AND WHY IT IS SAFE. Unlike the rest of gates/, this file
   imports tone.js, so the owner's words are checked against the OMH tone of
   voice by the same rules the tests hold the code's templates to. That is
   fine here because every consumer bundles (Convex, the Next dashboard,
   esbuild in the tests). It would be a syntax error inside an n8n Code
   node, so this file must never go through gate_inline(); tone.test.ts
   asserts that build-workflows.py does not do it.

   THE OPT-OUT. On a marketing message it is appended here, by the renderer,
   after everything the owner wrote. There is no variable for it, no setting
   for it, and nothing the owner can type that removes it. PECR wants it in
   every marketing message, not only the first, and the only way to make that
   impossible to get wrong is to make it impossible to leave off.

   THE BILL. A text is 160 characters in the plain alphabet (GSM-7) and 70 the
   moment one character outside it appears, a curly apostrophe pasted from
   Word being the usual one. Past one part, each part holds 153 or 67. The
   screen shows it as they type, because nobody finds out until the invoice.
   ========================================================================= */

import { toneIssues } from "./tone.js";

var OPT_OUT = "Reply STOP to opt out.";

/* The business, once. templates.ts reads these too, so the code's messages
   and the owner's cannot disagree about the phone number. */
var BUSINESS = {
  business: "Online Marketing Help",
  phone: "020 3489 3934",
  email: "support@onlinemarketinghelp.co.uk",
  booking_link: "https://onlinemarketinghelp.co.uk/omh-free-consultation",
};

/* The chips the owner is offered, in the order they are offered. */
var VARIABLES = [
  { key: "greeting", label: "Greeting", example: "Hi Sarah,", fallback: "Hi," },
  { key: "first_name", label: "First name", example: "Sarah", fallback: "there" },
  { key: "name", label: "Full name", example: "Sarah Whitfield", fallback: "there" },
  { key: "company", label: "Their company", example: "Whitfield Plumbing", fallback: "your business" },
  { key: "service", label: "What they asked about", example: "Google Ads management", fallback: "your enquiry" },
  { key: "appointment", label: "Their appointment", example: "for Tuesday 1st December at 10:00", fallback: "(left out)" },
  { key: "business", label: "Business name", example: BUSINESS.business, fallback: BUSINESS.business },
  { key: "phone", label: "Our phone number", example: BUSINESS.phone, fallback: BUSINESS.phone },
  { key: "email", label: "Our email", example: BUSINESS.email, fallback: BUSINESS.email },
  { key: "booking_link", label: "Booking link", example: BUSINESS.booking_link, fallback: BUSINESS.booking_link },
];

var EXAMPLE = {
  name: "Sarah Whitfield",
  service: "Google Ads management",
  company: "Whitfield Plumbing",
  preferredDate: "Tuesday 1st December",
  preferredTime: "10:00",
};

var CHANNELS = ["sms", "email", "call", "messenger"];
var MAX_PARTS = 10;

/* An empty value is marked rather than dropped, so the tidy can take the
   space before it with it ("booked {{appointment}}." becomes "booked.")
   without touching spacing the owner wrote on purpose. */
var HOLE = "\u0000";

/** First name only, and nothing at all rather than a wrong guess. */
function firstName(name) {
  var n = String(name || "").trim();
  if (!n) return "";
  var head = n.split(/\s+/)[0];
  /* A single letter is more likely a form artefact than a name, and "Hi A,"
     reads worse than "Hi,". */
  if (head.length < 2) return "";
  return head.charAt(0).toUpperCase() + head.slice(1).toLowerCase();
}

function value(key, c) {
  var ctx = c || {};
  var f = firstName(ctx.name);
  switch (key) {
    case "greeting": return f ? "Hi " + f + "," : "Hi,";
    case "first_name": return f || "there";
    case "name": return String(ctx.name || "").trim() || "there";
    case "company": return String(ctx.company || "").trim() || "your business";
    case "service": return String(ctx.service || "").trim() || "your enquiry";
    case "appointment":
      if (ctx.preferredDate && ctx.preferredTime) return "for " + ctx.preferredDate + " at " + ctx.preferredTime;
      if (ctx.preferredDate) return "for " + ctx.preferredDate;
      if (ctx.preferredTime) return "for " + ctx.preferredTime;
      return HOLE;
    default:
      if (Object.prototype.hasOwnProperty.call(BUSINESS, key)) return BUSINESS[key];
      return HOLE;
  }
}

/** Text with {{variables}} filled. An unknown one renders as nothing, never as braces. */
function renderText(text, ctx) {
  var out = String(text || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (_, k) { return value(k, ctx); });
  return out
    .replace(/ ?\u0000(?=[.,!?;:])/g, "")
    .replace(/ \u0000 /g, " ")
    .replace(/\u0000/g, "");
}

/**
 * One message, ready to send.
 *
 * `marketing` comes from the flow's trigger, never from the message: the
 * same words are a reply on one flow and marketing on another, and the
 * opt-out follows the flow.
 */
function renderMessage(tpl, ctx, marketing) {
  var t = tpl || {};
  var body = renderText(t.body, ctx);
  var out = {};
  if (t.channel === "email" && t.subject) out.subject = renderText(t.subject, ctx);
  if (marketing) {
    /* Written by hand at the end already: take it off and put it back, so
       it appears once, last, in our words. */
    var trimmed = body.replace(/\s+$/, "");
    if (trimmed.slice(-OPT_OUT.length) === OPT_OUT) trimmed = trimmed.slice(0, -OPT_OUT.length).replace(/\s+$/, "");
    body = trimmed ? trimmed + "\n\n" + OPT_OUT : OPT_OUT;
  }
  out.body = body;
  return out;
}

/* ------------------------------------------------------------- segments */

var GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
var GSM_EXT = "^{}\\[~]|€\f";

/** How many texts this is, and in which alphabet. */
function smsSegments(text) {
  var s = String(text || "");
  var chars = Array.from(s);
  var gsm = true, units = 0;
  for (var i = 0; i < chars.length; i++) {
    var ch = chars[i];
    if (GSM_BASIC.indexOf(ch) !== -1) units += 1;
    else if (GSM_EXT.indexOf(ch) !== -1) units += 2;
    else { gsm = false; break; }
  }
  if (!gsm) units = s.length; // UTF-16 code units: an emoji is two
  var single = gsm ? 160 : 70, multi = gsm ? 153 : 67;
  var segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  return {
    encoding: gsm ? "GSM-7" : "UCS-2",
    chars: chars.length,
    units: units,
    segments: segments,
    perSegment: segments > 1 ? multi : single,
  };
}

/** The first character that forces UCS-2, for the warning. */
function firstExpensive(text) {
  var chars = Array.from(String(text || ""));
  for (var i = 0; i < chars.length; i++) {
    if (GSM_BASIC.indexOf(chars[i]) === -1 && GSM_EXT.indexOf(chars[i]) === -1) return chars[i];
  }
  return null;
}

function times(n) {
  return n === 2 ? "twice" : n === 3 ? "three times" : n + " times";
}

/* ------------------------------------------------------------ validation */

/**
 * Can this message be saved?
 *
 * The SMS length is judged on the message as it would actually go out: with
 * realistic details filled in, and with the opt-out added when `marketing`.
 */
function validateMessage(m, opts) {
  var errors = [], warnings = [];
  var x = m && typeof m === "object" ? m : {};
  var marketing = !!(opts && opts.marketing);
  function e(code, message) { errors.push({ code: code, message: message }); }

  var key = typeof x.key === "string" ? x.key : "";
  if (!/^[a-z][a-z0-9_]{1,59}$/.test(key)) {
    e("bad_key", "The message id must be lower-case letters, numbers and underscores, like spring_offer_sms.");
  }
  if (CHANNELS.indexOf(x.channel) === -1) e("bad_channel", "A message is a text, an email, a call brief or a DM.");

  var body = typeof x.body === "string" ? x.body : "";
  if (!body.trim()) e("empty", "The message is empty. Write what they should read.");

  var known = VARIABLES.map(function (v) { return v.key; });
  var re = /\{\{\s*([^{}]*?)\s*\}\}/g, hit, bad = [];
  var all = body + " " + (typeof x.subject === "string" ? x.subject : "");
  while ((hit = re.exec(all))) if (known.indexOf(hit[1]) === -1) bad.push(hit[1]);
  if (bad.length) {
    e("unknown_variable", "These are not variables the system can fill: " +
      bad.map(function (b) { return "{{" + b + "}}"; }).join(", ") +
      ". Use the chips above the editor.");
  }
  if (/\{\{(?![^{}]*\}\})/.test(all) || /(^|[^}])\}\}/.test(all.replace(/\{\{[^{}]*\}\}/g, ""))) {
    e("unclosed_variable", "A variable is missing its closing or opening braces.");
  }

  if (x.channel === "email" && !(typeof x.subject === "string" && x.subject.trim())) {
    e("no_subject", "An email needs a subject line.");
  }

  if (body.indexOf("Reply STOP") !== -1) {
    warnings.push({ code: "opt_out_added", message: "You do not need to write the opt-out. On marketing messages it is added automatically, at the end, every time." });
  }

  /* The OMH tone of voice, its decidable half (gates/tone.js). Judged on
     what the owner TYPED, with {{variables}} left out, never on the example
     values filled in for the preview: those are ours, not theirs. Always a
     warning and never an error, because the guide is a standard to write
     to, and the owner may have a reason the rule cannot see. */
  var said = (typeof x.subject === "string" && x.channel === "email" ? x.subject + "\n" : "") + body;
  var tone = toneIssues(said);
  for (var ti = 0; ti < tone.length; ti++) {
    warnings.push({ code: "tone_" + tone[ti].code, message: tone[ti].message });
  }

  if (x.channel === "sms" && body.trim()) {
    var sample = renderMessage({ channel: "sms", body: body }, EXAMPLE, marketing).body;
    var seg = smsSegments(sample);
    if (seg.segments > MAX_PARTS) {
      e("too_long", "This text is " + seg.segments + " parts long. The most a phone will join together is " + MAX_PARTS + ".");
    } else if (seg.segments > 1) {
      warnings.push({ code: "multi_part", message: "This is " + seg.segments + " texts joined together, so it costs " + times(seg.segments) + " a single text." });
    }
    if (seg.encoding === "UCS-2") {
      var c = firstExpensive(sample);
      warnings.push({ code: "ucs2", message: "\"" + c + "\" is outside the plain text alphabet, so each part holds 70 characters instead of 160. A straight apostrophe or quote fixes it." });
    }
  }

  return { ok: errors.length === 0, errors: errors, warnings: warnings };
}

export { OPT_OUT, BUSINESS, VARIABLES, EXAMPLE, CHANNELS, firstName, renderText, renderMessage, smsSegments, validateMessage };
