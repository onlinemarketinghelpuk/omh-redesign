/* =========================================================================
   The Brain: who answers a reply.

   Plain JavaScript, no imports, one export line. Convex runs it to decide
   (convex/brain.ts, called by 09-twilio-inbound), the dashboard runs it in
   the test console, and widget/tests/brain.test.ts asserts it, all from one
   text.

   Two rules hold under every policy:

   1. An opt-out is never answered or handed over here. STOP is handled
      upstream by suppression, which also stops every sequence. Replying to
      it with anything but the confirmation is the one reply that makes a
      complaint certain.
   2. When unsure, hand over. A missed hand-over costs a customer; an
      unnecessary one costs thirty seconds of somebody's time.

   Intent is read with word rules, not a model. That is a decision, not a
   shortcut: rules cost nothing per reply, never time out, and their answer
   to "I am not sure" is a person, which is the right answer anyway. A model
   can be put in front of `unsure` later, and nothing else changes.
   ========================================================================= */

var POLICIES = [
  { key: "assistant_only", label: "Assistant answers",
    what: "The assistant answers every reply, and passes it to a person only when it cannot help." },
  { key: "assistant_until_reply", label: "Assistant until they reply",
    what: "The follow-up messages go out automatically, and the first reply they send goes to a person." },
  { key: "owner_only", label: "You answer",
    what: "Nothing automated answers. Every reply lands in Needs a person for you to pick up." },
  { key: "owner_for_interested", label: "You answer the interested ones",
    what: "The assistant answers, and passes the conversation to you when the reply sounds ready to buy, or when it is not sure." },
];
var DEFAULT_POLICY = "assistant_only";

/* The channels, by name, and the old names they replaced. Copied from
   flows.js (asserted equal through it by the tests) because a gate has no
   imports. */
var CHANNELS = [
  "website_chat", "website_voice", "website_form", "google_ads", "facebook_ads", "instagram_ads",
  "facebook", "instagram", "whatsapp", "phone_inbound", "phone_missed",
  "reactivation", "organic", "referral", "direct",
];
var MERGED = {
  facebook_dm: "facebook", facebook_page: "facebook",
  instagram_dm: "instagram", instagram_page: "instagram",
  whatsapp_ads: "whatsapp", google_organic: "organic", roi_calculator: "website_form",
};

/* The same opt-out reading as 09-twilio-inbound: the whole message, not a
   substring, so "what time do you stop today" is a question. */
var OPT_OUT_WORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT"];

function isOptOut(text) {
  var words = String(text || "").toUpperCase().replace(/[^A-Z ]/g, " ").trim().split(/\s+/);
  if (!words[0]) return false;
  return words.length <= 3 && words.some(function (w) { return OPT_OUT_WORDS.indexOf(w) !== -1; });
}

var NOT_INTERESTED = /\b(not interested|no thanks|no thank you|no ta|don'?t (contact|text|call|message)|leave me alone|wrong number|already sorted|found someone)\b/i;
var INTERESTED = /\b(yes|yeah|yep|yes please|interested|book|booking|call me|ring me|give me a (call|ring)|price|prices|quote|how much|cost|costs|available|availability|when can|sign me up|go ahead|let'?s (do|go)|sounds good|i'?d like)\b/i;

/** opt_out | not_interested | interested | question | unsure */
function quickIntent(text) {
  var t = String(text || "").trim();
  if (!t) return "unsure";
  if (isOptOut(t)) return "opt_out";
  if (NOT_INTERESTED.test(t)) return "not_interested";
  if (INTERESTED.test(t)) return "interested";
  if (/\?\s*$/.test(t) || /^(what|when|where|who|how|do|does|can|could|is|are|will|would)\b/i.test(t)) return "question";
  return "unsure";
}

function policyFor(brain, channel) {
  var c = Object.prototype.hasOwnProperty.call(MERGED, channel) ? MERGED[channel] : channel;
  var p = brain && brain.policies ? brain.policies[c] : undefined;
  return isPolicy(p) ? p : DEFAULT_POLICY;
}

function isPolicy(p) {
  for (var i = 0; i < POLICIES.length; i++) if (POLICIES[i].key === p) return true;
  return false;
}

function policyLabel(p) {
  for (var i = 0; i < POLICIES.length; i++) if (POLICIES[i].key === p) return POLICIES[i].label;
  return String(p);
}

/**
 * What happens to this reply.
 *
 * Returns `answer` (the assistant replies), `handOver` (it goes to Needs a
 * person), the policy used, the intent read, and the reason in words for
 * the test console and the conversation log.
 */
function decideReply(input) {
  var x = input || {};
  var brain = x.brain || { enabled: true, policies: {} };
  var policy = policyFor(brain, x.channel);
  var intent = quickIntent(x.text);
  function out(answer, handOver, reason) {
    return { answer: answer, handOver: handOver, policy: policy, intent: intent, reason: reason };
  }

  if (intent === "opt_out") return out(false, false, "An opt-out. It is handled by suppression, which stops everything; nothing answers it here.");
  if (brain.enabled === false) return out(false, true, "Automated answering is off, so every reply goes to a person.");
  /* The owner's per-channel switch (plan 014): off means everything
     automated on that channel stops, the assistant included. The reply is
     handed to a person rather than dropped. Only an explicit false counts,
     so a caller that does not know the switch changes nothing. */
  if (x.channelOn === false) return out(false, true, "This channel is switched off on the dashboard, so a person answers.");

  if (policy === "owner_only") return out(false, true, "This channel is set to: you answer.");
  if (policy === "assistant_until_reply") return out(false, true, "They replied, and this channel hands a reply to a person.");
  if (policy === "owner_for_interested") {
    if (intent === "interested") return out(false, true, "The reply sounds interested, so it goes to you.");
    if (intent === "unsure") return out(false, true, "Not sure what they mean, so it goes to you rather than guessing.");
    return out(true, false, intent === "not_interested"
      ? "Not interested: the assistant answers politely and leaves it there."
      : "A question the assistant can answer from the knowledge base.");
  }
  return out(true, false, "This channel is set to: assistant answers.");
}

/* ------------------------------------------------------------- selling

   The Brain is a sales brain. When the assistant answers a reply to one of
   our follow-ups, the person has already enquired, been texted, and written
   back: the most valuable moment in the whole sequence. So the assistant is
   told what it is FOR: answer what they asked, explain what OMH would do
   for them, and move them to a booked consultation.

   What does not change is the core prompt's one rule: never guess. A sales
   brief that made the assistant invent a price to close a booking would be
   the most expensive sentence it ever sent. The brief repeats that rule,
   last, so it is the thing read most recently. */

var DEFAULT_SALES = {
  goal: "Book the free 30 minute consultation.",
  offer: "A free 30 minute consultation with the team, by phone or video, where they recommend the right package. No charge and no obligation.",
  notes: "",
};

var CHANNEL_WORDS = {
  website_form: "the contact form on the website", google_ads: "a Google Ads landing page",
  facebook_ads: "a Facebook lead form", instagram_ads: "an Instagram lead form",
  facebook: "Facebook Messenger", instagram: "Instagram", whatsapp: "WhatsApp",
  phone_inbound: "a phone call", phone_missed: "a phone call we missed",
  reactivation: "being an existing customer", organic: "the website", referral: "a referral",
  direct: "the website", website_chat: "the website chat", website_voice: "a voice call on the website",
};

/**
 * The brief given to the assistant when it answers a follow-up reply.
 *
 * Built from the owner's sales settings and what we know about the lead. Plain
 * text, prepended to the conversation turn by the chat workflow.
 */
function salesBrief(input) {
  var x = input || {};
  var s = (x.brain && x.brain.sales) || {};
  var goal = String(s.goal || DEFAULT_SALES.goal).trim();
  var offer = String(s.offer || DEFAULT_SALES.offer).trim();
  var notes = String(s.notes || "").trim();
  var lead = x.lead || {};
  var c = Object.prototype.hasOwnProperty.call(MERGED, x.channel) ? MERGED[x.channel] : x.channel;
  var lines = [
    "SALES BRIEF FOR THIS REPLY (read before answering):",
    "This person enquired through " + (CHANNEL_WORDS[c] || "the website") +
      (lead.service ? " about " + lead.service : "") +
      ". We followed up by text and they have just replied. This is a text message conversation.",
    "Your goal: " + goal,
    "What we are offering: " + offer,
    "How to sell: answer exactly what they asked first. Then say in one sentence what OMH would do for them, using the knowledge base. Then ask for the booking with two specific weekday times between 9am and 5pm. One question per message.",
    "If they hesitate, find the reason with one short question and answer that reason. If they say no, thank them and stop: do not push twice.",
    "Keep it to two or three short sentences: it is a text. No links except the booking link.",
    /* OMH's tone of voice (docs/tone-of-voice.md). The full version is the
       TONE section of the system prompt this brief sits under; this line is
       the part that pulls against "sell", repeated where the selling is,
       plus the written house style a text needs. */
    "How to sound: OMH's own tone of voice, as in your TONE section. Advisory, never pushy: the consultation is an offer, not a close. If OMH is not the right fit for them, say so plainly and kindly. Write prices as £450 + VAT, dates as Tuesday 1st December, no dashes between thoughts and no exclamation marks.",
  ];
  if (lead.name) lines.splice(2, 0, "Their name: " + lead.name + ".");
  if (notes) lines.push("From the owner: " + notes);
  lines.push("The rule that overrides this brief: every fact, price and timescale must come from a tool. Never guess a figure to close a booking.");
  return lines.join("\n");
}

/** Is this a setting that can be saved? */
function validateBrain(v) {
  var errors = [];
  var x = v && typeof v === "object" ? v : {};
  if (typeof x.enabled !== "boolean") errors.push("Automated answering must be on or off.");
  if (x.sales !== undefined) {
    var sl = x.sales || {};
    if (typeof sl.goal !== "string" || !sl.goal.trim()) errors.push("Say what the assistant is trying to achieve, for example: book the free consultation.");
    if (typeof sl.goal === "string" && sl.goal.length > 200) errors.push("Keep the goal under 200 characters.");
    if (sl.offer !== undefined && (typeof sl.offer !== "string" || sl.offer.length > 500)) errors.push("Keep the offer under 500 characters.");
    if (sl.notes !== undefined && (typeof sl.notes !== "string" || sl.notes.length > 1500)) errors.push("Keep the notes under 1500 characters.");
  }
  var p = x.policies && typeof x.policies === "object" ? x.policies : {};
  for (var k in p) {
    if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
    if (CHANNELS.indexOf(k) === -1) errors.push("\"" + k + "\" is not a channel.");
    else if (!isPolicy(p[k])) errors.push("\"" + p[k] + "\" is not a way of answering. Choose one of the four.");
  }
  return { ok: errors.length === 0, errors: errors };
}

export { DEFAULT_SALES, salesBrief, POLICIES, DEFAULT_POLICY, CHANNELS, isOptOut, quickIntent, policyFor, policyLabel, decideReply, validateBrain };
