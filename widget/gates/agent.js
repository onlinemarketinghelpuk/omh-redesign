/* =========================================================================
   The outbound agent: its settings, what it is told on each call, and how
   Retell's end-of-call report is read.

   Plain JavaScript, no imports, one export line. The settings are checked in
   Convex on save and in the dashboard as they are typed; `retellOutcome` runs
   inside the Retell Events workflow in n8n (embedded with gate_inline) and in
   widget/tests/agent.test.ts, from this one text.

   The agent itself lives in Retell, created by widget/retell/
   create-outbound-agent.py. It is the same assistant as the website's voice
   agent, with the same tools (the knowledge base, the price list, booking
   the consultation, handing over to a person), told one thing more: this
   time WE are ringing THEM, about their own enquiry, and the job is to
   explain and book.
   ========================================================================= */

var DEFAULT_AGENT = {
  fromNumber: "",
  /* Monday to Friday: 0 is Sunday, as in JavaScript. */
  days: [1, 2, 3, 4, 5],
  start: 9,
  end: 17,
  opening:
    "Hi, is that {first_name}? It's Melissa from Online Marketing Help, calling about your enquiry on {service}. Have you got a couple of minutes?",
  goal:
    "Understand what they need, explain how Online Marketing Help would help, and book the free 30 minute consultation.",
};

/* Calls are never placed outside these, whatever is typed. */
var EARLIEST = 8;
var LATEST = 20;

/** A UK number, written any usual way, as +44 E.164. "" when it is not one. */
function normaliseNumber(raw) {
  var s = String(raw || "").replace(/[\s().-]/g, "");
  if (!s) return "";
  if (s.indexOf("+44") === 0) s = "0" + s.slice(3);
  else if (s.indexOf("0044") === 0) s = "0" + s.slice(4);
  else if (s.indexOf("44") === 0 && s.length === 12) s = "0" + s.slice(2);
  /* Geographic 01 and 02, non-geographic 03, and mobile 07. Not 08 or 09:
     a premium or freephone number is not something to ring people from. */
  if (!/^0(1\d{8,9}|2\d{9}|3\d{9}|7\d{9})$/.test(s)) return "";
  return "+44" + s.slice(1);
}

function validateAgent(a) {
  var errors = [];
  var x = a && typeof a === "object" ? a : {};
  var raw = String(x.fromNumber || "").trim();
  if (raw) {
    if (/[a-z]/i.test(raw)) {
      errors.push("A name such as \"" + raw + "\" cannot be rung back, and people reply to the number that called them. Use a UK phone number.");
    } else if (!normaliseNumber(raw)) {
      errors.push("Use a UK number starting 01, 02, 03 or 07. Twilio does not offer international numbers for calling UK customers, and a premium number would put people off answering.");
    }
  }
  var days = x.days;
  if (!isArray(days) || !days.length || days.some(function (d) { return !isInt(d) || d < 0 || d > 6; })) {
    errors.push("Choose at least one day to make calls on.");
  }
  if (!isInt(x.start) || !isInt(x.end) || x.start >= x.end) {
    errors.push("Calling hours must start before they end.");
  } else if (x.start < EARLIEST || x.end > LATEST) {
    errors.push("Calls are made between 8am and 8pm at the widest. A call outside that is a complaint, not a lead.");
  }
  if (typeof x.opening !== "string" || !x.opening.trim()) errors.push("Write the first thing the agent says.");
  else if (x.opening.length > 300) errors.push("Keep the opening under 300 characters: it is spoken, and a long opening loses them.");
  if (typeof x.goal !== "string" || !x.goal.trim()) errors.push("Say what the agent is trying to achieve on the call.");
  else if (x.goal.length > 400) errors.push("Keep the goal under 400 characters.");
  return { ok: errors.length === 0, errors: errors };
}

/** What the agent says first and is trying to do, for this person. */
function callBrief(agent, lead) {
  var a = agent || DEFAULT_AGENT;
  var l = lead || {};
  var name = String(l.name || "").trim().split(/\s+/)[0] || "";
  if (name.length < 2) name = "";
  else name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  var opening = String(a.opening || DEFAULT_AGENT.opening)
    .replace(/\{first_name\}/g, name || "there")
    .replace(/\{service\}/g, String(l.service || "").trim() || "your enquiry")
    .replace(/is that there\?/, "is that the right number for the enquiry?");
  return { opening: opening, goal: String(a.goal || DEFAULT_AGENT.goal) };
}

/**
 * Retell's end-of-call report as one of ours: answered, no_answer, failed.
 *
 * Voicemail counts as no answer: nobody heard the agent, so "a text saying we
 * tried" is exactly right.
 */
function retellOutcome(call) {
  var r = String((call && call.disconnection_reason) || "");
  if (!r) return "failed";
  if (r === "dial_no_answer" || r === "dial_busy" || r === "voicemail_reached" ||
      r === "error_user_not_joined" || r === "inactivity" && !(call && call.transcript)) return "no_answer";
  if (r === "dial_failed" || r.indexOf("error") === 0) return "failed";
  return "answered";
}

function isArray(x) { return Object.prototype.toString.call(x) === "[object Array]"; }
function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }

export { DEFAULT_AGENT, EARLIEST, LATEST, normaliseNumber, validateAgent, callBrief, retellOutcome };
