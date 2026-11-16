/* =========================================================================
   The owner's flows: what they may build, and how it becomes a route.

   Plain JavaScript, no imports, one export line, like every gate here: the
   validator runs in Convex on save, in the dashboard while the owner drags,
   and in the tests, and all three must be running the same text. A validator
   that exists twice is a validator that disagrees with itself the first time
   somebody fixes one copy.

   THE LINE THIS FILE HOLDS.

   The owner controls the business decisions: which channels, how many
   messages, in what order, how far apart, what they say. The system keeps
   the legal envelope, and it keeps it here:

   1. A flow's BASIS comes from its trigger, the channel the lead arrived on.
      It is never read from the flow object. A flow that claims to be a reply
      is judged by where it starts, not by what it says about itself.
   2. On a marketing flow the call is not in the palette at all. Not greyed
      out, not disabled with a tooltip: absent. A control that exists and
      refuses invites somebody to look for the way round it.
   3. The refusal is here, and Convex calls it on every save, so it rejects a
      marketing flow with a call step whatever produced it: the builder, the
      API, an import, a migration, a bug.
   4. It names the rule. PECR regulation 19: an automated marketing call
      needs consent that specifically covers automated calls. The ICO's
      largest PECR fines are for exactly this.

   If a later change turns any of that into a setting, the change is the
   mistake, not the thing it enables.

   WHAT A FLOW IS. A single line of nodes, no branching:

     send     { channel, message, onlyIfCallUnanswered?, label?, why? }
     wait     { after: { minutes } }  or  { at: { addDays, hour, minute } }
     stop_if  { conditions: ["replied" | "booked" | "opted_out"] }

   The trigger is the start. Quiet hours are not a node: they apply to the
   whole flow, so nobody can forget one.

   It compiles to exactly the Route shape in routes.ts, and from there the
   engine, the clock, the lease and the gates are the ones already tested.
   Nothing new is invented, and `routeToNodes` proves it: every route the
   system runs today, turned into nodes and compiled back, is the same route.
   ========================================================================= */

var BASES = ["they_contacted_us", "we_are_contacting_them"];

/* The fifteen channels, in the dashboard's order (lib/dashboard/channels.ts,
   asserted by the test), with the route each gets today from the router and
   the basis that follows from how the conversation started.

   Only reactivation is ours to start. Everything else is somebody who
   contacted us, and replying to their own enquiry, by any channel, is not
   marketing. */
var TRIGGERS = {
  website_chat:  { label: "Website chat",       basis: "they_contacted_us",     route: "A" },
  website_voice: { label: "Website voice",      basis: "they_contacted_us",     route: "A" },
  website_form:  { label: "Website form",       basis: "they_contacted_us",     route: "B" },
  google_ads:    { label: "Google Ads",         basis: "they_contacted_us",     route: "B" },
  facebook_ads:  { label: "Facebook ad",        basis: "they_contacted_us",     route: "C" },
  instagram_ads: { label: "Instagram ad",       basis: "they_contacted_us",     route: "C" },
  facebook:      { label: "Facebook message",   basis: "they_contacted_us",     route: "D" },
  instagram:     { label: "Instagram message",  basis: "they_contacted_us",     route: "D" },
  whatsapp:      { label: "WhatsApp",           basis: "they_contacted_us",     route: "D" },
  phone_inbound: { label: "Inbound call",       basis: "they_contacted_us",     route: "E" },
  phone_missed:  { label: "Missed call",        basis: "they_contacted_us",     route: "E" },
  reactivation:  { label: "Reactivation",       basis: "we_are_contacting_them", route: "F" },
  organic:       { label: "Found us on Google", basis: "they_contacted_us",     route: "B" },
  referral:      { label: "Referral",           basis: "they_contacted_us",     route: "B" },
  direct:        { label: "Direct",             basis: "they_contacted_us",     route: "B" },
};
var TRIGGER_ORDER = [
  "website_chat", "website_voice", "website_form",
  "google_ads", "facebook_ads", "instagram_ads",
  "facebook", "instagram", "whatsapp",
  "phone_inbound", "phone_missed",
  "reactivation", "organic", "referral", "direct",
];

/* Channel names merged away, and what they became. The same table as
   MERGED in lib/dashboard/channels.ts, asserted equal by the test: Convex
   cannot import the dashboard, and a lead written under an old name must
   still find its channel's flow. */
var MERGED = {
  facebook_dm: "facebook", facebook_page: "facebook",
  instagram_dm: "instagram", instagram_page: "instagram",
  whatsapp_ads: "whatsapp", google_organic: "organic", roi_calculator: "website_form",
};

/** The channel a lead counts under today, old names included. */
function canonicalTrigger(s) {
  if (!s) return "unknown";
  return Object.prototype.hasOwnProperty.call(MERGED, s) ? MERGED[s] : s;
}

/* Meta's own thread. A DM step only has somewhere to go when the person
   came from Meta. */
var META = ["facebook", "instagram", "whatsapp", "facebook_ads", "instagram_ads"];

var NODE_TYPES = ["send", "wait", "stop_if"];
var CONDITIONS = ["replied", "booked", "opted_out"];

/* Mirrors QUIET_START_HOUR / QUIET_END_HOUR in clock.ts, asserted equal by
   the test. Copied rather than imported because a gate has no imports. */
var QUIET_START = 20;
var QUIET_END = 8;

/* Past the fifth or sixth message opt-outs rise faster than replies. The
   defaults stop at five or six; the panel lets the owner go further, once,
   with a warning, and no further than eight. */
var WARN_SENDS = 6;
var MAX_SENDS = 8;
var MAX_WAIT_MIN = 30 * 24 * 60;

var PECR_CALL_RULE =
  "Automated marketing calls need consent that specifically covers automated calls (PECR regulation 19).";

var NOUN = { sms: "a text", email: "an email", call: "a call", messenger: "a message in their DMs" };
var LABEL = { sms: "Text", email: "Email", call: "Agent calls", messenger: "Message in the DM" };

/* ------------------------------------------------------------- the basis */

function basisOf(trigger) {
  var t = TRIGGERS[trigger];
  return t ? t.basis : null;
}

function defaultRouteFor(trigger) {
  var t = TRIGGERS[trigger];
  return t ? t.route : null;
}

function triggerLabel(trigger) {
  var t = TRIGGERS[trigger];
  return t ? t.label : String(trigger);
}

/** One basis for the whole flow, or null when there is none or a mixture. */
function basisFor(triggers) {
  if (!isArray(triggers) || triggers.length === 0) return null;
  var b = null;
  for (var i = 0; i < triggers.length; i++) {
    var x = basisOf(triggers[i]);
    if (!x) return null;
    if (b && b !== x) return null;
    b = x;
  }
  return b;
}

/**
 * What the builder may offer.
 *
 * On a marketing flow `call` is simply not in the list. There is no
 * "disabled" list beside it, because a disabled control is a question about
 * how to enable it.
 */
function palette(triggers) {
  var b = basisFor(triggers);
  if (!b) return { basis: null, nodes: NODE_TYPES.slice(), channels: [] };
  var ch = ["sms", "email"];
  if (b === "they_contacted_us") ch.push("call");
  if (allIn(triggers, META)) ch.push("messenger");
  return { basis: b, nodes: NODE_TYPES.slice(), channels: ch };
}

/* ------------------------------------------------------------ validation */

function err(out, code, message, nodeId, liveOnly) {
  out.push({ code: code, message: message, nodeId: nodeId || undefined, liveOnly: liveOnly === true });
}

function stepName(i, n) {
  var what = n && n.type === "send" ? (LABEL[n.channel] || "send") :
    n && n.type === "wait" ? "wait" : n && n.type === "stop_if" ? "stop if" : "node";
  return "Step " + (i + 1) + " (" + String(what).toLowerCase() + ")";
}

/**
 * Is this flow allowed, and can it go live?
 *
 * `opts.messages`, when given, is `{ key: channel }` for every message that
 * exists (the code's and the owner's). Without it, existence is not checked,
 * which is what the compiler wants; the save path always passes it.
 *
 * Each error carries `liveOnly`: true for an unfinished draft (no message
 * chosen yet), false for anything that must never be saved at all. A legal
 * problem is never liveOnly.
 */
function validateFlow(flow, opts) {
  var errors = [];
  var warnings = [];
  var f = flow && typeof flow === "object" ? flow : {};
  var messages = opts && opts.messages ? opts.messages : null;

  var name = typeof f.name === "string" ? f.name.trim() : "";
  if (!name) err(errors, "no_name", "Give the flow a name, so the Control Panel can show which one a channel uses.");
  if (name.length > 80) err(errors, "long_name", "Keep the name under 80 characters; it has to fit in a table cell.");

  var triggers = isArray(f.triggers) ? f.triggers : [];
  if (triggers.length === 0) {
    err(errors, "no_triggers", "Choose at least one channel that starts this flow. The channel decides what the flow is allowed to do.");
  }
  var unknown = triggers.filter(function (t) { return !TRIGGERS[t]; });
  if (unknown.length) {
    err(errors, "unknown_trigger", "These are not channels the system knows: " + unknown.join(", ") + ".");
  }

  /* The basis, from the triggers and nothing else. `f.basis` and
     `f.marketing` are deliberately never read. */
  var basis = basisFor(triggers);
  var anyMarketing = triggers.some(function (t) { return basisOf(t) === "we_are_contacting_them"; });
  if (!basis && triggers.length && !unknown.length) {
    var ours = triggers.filter(function (t) { return basisOf(t) === "we_are_contacting_them"; });
    var theirs = triggers.filter(function (t) { return basisOf(t) === "they_contacted_us"; });
    err(errors, "mixed_basis",
      "This flow mixes channels where the person contacted us (" + theirs.map(triggerLabel).join(", ") +
      ") with channels where we contact them (" + ours.map(triggerLabel).join(", ") +
      "). Replying to somebody's own enquiry is not marketing; starting a conversation they did not ask for is. " +
      "They follow different rules, so they need separate flows.");
  }
  var marketing = basis === "we_are_contacting_them" || anyMarketing;
  var allowed = palette(triggers).channels;

  var nodes = isArray(f.nodes) ? f.nodes : [];
  if (f.nodes !== undefined && !isArray(f.nodes)) err(errors, "bad_nodes", "The flow's steps are not a list.");

  var ids = {};
  var sends = 0;
  var sawCall = false;
  var sawAt = null;       // the last "at" wait, for ordering
  var sawWait = false;
  var queuedSinceWait = 0;

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var where = stepName(i, n);
    if (!n || typeof n !== "object") {
      err(errors, "unknown_node_type", where + " is not a step the builder knows.", "#" + i);
      continue;
    }
    var id = typeof n.id === "string" && n.id ? n.id : "#" + i;
    if (ids[id]) err(errors, "duplicate_id", where + " has the same id as an earlier step (" + id + ").", id);
    ids[id] = true;

    if (NODE_TYPES.indexOf(n.type) === -1) {
      err(errors, "unknown_node_type", where + " is a \"" + String(n.type) + "\" step. A flow has sends, waits and stop-ifs, and nothing else.", id);
      continue;
    }

    if (n.type === "send") {
      sends++;
      var ch = n.channel;

      /* THE RULE. Checked before anything else about the step, and against
         every trigger rather than the agreed basis, so a mixed flow that is
         already refused for mixing is refused for this as well. */
      if (ch === "call" && marketing) {
        var mk = triggers.filter(function (t) { return basisOf(t) === "we_are_contacting_them"; });
        err(errors, "marketing_call",
          PECR_CALL_RULE + " This flow starts from " + mk.map(triggerLabel).join(", ") +
          ", so a call step cannot be saved on it. A live person can still ring them from the dashboard after a TPS check.",
          id);
      } else if (!NOUN[ch]) {
        err(errors, "unknown_channel", where + " sends by \"" + String(ch) + "\". A step can send a text, an email" +
          (marketing ? "" : ", or a call") + ".", id);
      } else if (basis && allowed.indexOf(ch) === -1) {
        err(errors, "channel_not_here", where + ": " + LABEL[ch] +
          " only exists for people who came from Facebook, Instagram or WhatsApp, and this flow also starts from other channels.", id);
      }
      if (ch === "call") sawCall = true;

      var key = typeof n.message === "string" ? n.message.trim() : "";
      if (!key) {
        err(errors, "no_message", where + " has no message chosen. It can be saved as a draft, but not switched on.", id, true);
      } else if (messages) {
        if (!Object.prototype.hasOwnProperty.call(messages, key)) {
          err(errors, "unknown_message", where + " uses a message called \"" + key + "\" that does not exist.", id, true);
        } else if (NOUN[ch] && messages[key] !== ch) {
          err(errors, "message_wrong_channel", where + " is " + NOUN[ch] + " but \"" + key + "\" is written as " +
            (NOUN[messages[key]] || messages[key]) + ".", id, true);
        }
      }

      if (n.onlyIfCallUnanswered === true && !sawCall) {
        err(errors, "no_call_before", where + " only goes if the call before it went unanswered, and there is no call before it.", id);
      }

      /* Two queued sends with no wait between them land on the same moment,
         and the engine only ever sends one thing per moment: the second
         would be skipped without a word. Sends before the first wait on an
         enquiry go together, inline, which is what route B's text-and-email
         is. */
      var inline = !sawWait && !marketing;
      if (!inline) {
        queuedSinceWait++;
        if (queuedSinceWait > 1) {
          err(errors, "same_moment", where + " is due at the same moment as the step before it. Put a wait between them.", id);
        }
      }
    } else if (n.type === "wait") {
      var a = n.after, t = n.at;
      if (a && typeof a === "object") {
        var m = a.minutes;
        if (!isInt(m) || m <= 0 || m > MAX_WAIT_MIN) {
          err(errors, "bad_wait", where + " waits " + String(m) + " minutes. A wait is between 1 minute and 30 days.", id);
        }
        if (sawAt) {
          err(errors, "after_follows_at", where + " counts minutes, but an earlier wait already set a time of day. " +
            "Once a flow says \"day 2 at 10am\", the next wait has to be another day and time too.", id);
        }
      } else if (t && typeof t === "object") {
        var d = t.addDays, h = t.hour, mi = t.minute === undefined ? 0 : t.minute;
        if (!isInt(d) || d < 0 || d > 30 || !isInt(h) || h < 0 || h > 23 || !isInt(mi) || mi < 0 || mi > 59) {
          err(errors, "bad_wait", where + " is not a day and time the builder understands.", id);
        } else {
          if (h < QUIET_END || h >= QUIET_START) {
            err(errors, "wait_in_quiet_hours", where + " is at " + clockTime(h, mi) +
              ", inside quiet hours (8pm to 8am). Nothing is sent then; choose a time between 8am and 8pm.", id);
          }
          var key2 = d * 1440 + h * 60 + mi;
          if (sawAt !== null && key2 <= sawAt) {
            err(errors, "not_after_previous", where + " is not later than the time set by the wait before it.", id);
          }
          sawAt = key2;
        }
      } else {
        err(errors, "bad_wait", where + " needs either a length of time or a day and time.", id);
      }
      sawWait = true;
      queuedSinceWait = 0;
    } else if (n.type === "stop_if") {
      var c = isArray(n.conditions) ? n.conditions : [];
      if (!c.length || c.some(function (x) { return CONDITIONS.indexOf(x) === -1; })) {
        err(errors, "bad_condition", where + " needs one or more of: they replied, they booked, they opted out.", id);
      }
    }
  }

  if (sends === 0) err(errors, "no_sends", "This flow does not send anything yet. Add a send step before switching it on.", undefined, true);
  if (sends > MAX_SENDS) {
    err(errors, "too_many_sends", "This flow sends " + sends + " messages. The limit is " + MAX_SENDS +
      ": past that, more people opt out than reply.");
  } else if (sends >= WARN_SENDS) {
    warnings.push({ code: "many_sends", message: sends + " messages. Every message past the fifth raises the opt-out rate; the defaults stop at five or six." });
  }
  if (nodes.length && nodes[nodes.length - 1] && nodes[nodes.length - 1].type === "wait") {
    warnings.push({ code: "ends_waiting", message: "The flow ends on a wait, which does nothing. It stops after the last send either way." });
  }

  return {
    ok: errors.length === 0,
    canSaveDraft: errors.every(function (e) { return e.liveOnly; }),
    errors: errors,
    warnings: warnings,
    basis: basis,
    marketing: marketing,
    sends: sends,
  };
}

/* --------------------------------------------------------------- compile */

/**
 * A flow, as the Route shape the engine already runs.
 *
 * Throws on anything that must never be saved, the PECR rule above all, so
 * a flow that reached the engine round the validator still cannot come out
 * of here as a marketing route that dials. An unfinished draft (no message
 * yet) also throws: there is nothing to run.
 */
function compileFlow(flow) {
  var v = validateFlow(flow);
  if (!v.ok) {
    throw new Error("This flow cannot run: " + v.errors.map(function (e) { return e.message; }).join(" "));
  }
  var marketing = v.basis === "we_are_contacting_them";
  var immediate = [];
  var steps = [];
  var cum = 0;            // minutes since enrolment, while waits are "after"
  var at = null;          // the "at" moment, once one has been set
  var waited = false;
  var stopping = false;

  for (var i = 0; i < flow.nodes.length; i++) {
    var n = flow.nodes[i];
    if (n.type === "stop_if") { stopping = true; continue; }
    if (n.type === "wait") {
      waited = true;
      if (n.after) cum += n.after.minutes;
      else at = { addDays: n.at.addDays, hour: n.at.hour, minute: n.at.minute === undefined ? 0 : n.at.minute };
      continue;
    }
    var gate = n.onlyIfCallUnanswered === true ? "call_no_answer" : stopping ? "no_reply" : "always";
    var step = {
      key: n.message.trim(),
      when: null,
      channel: n.channel,
      gate: gate,
      label: n.label || LABEL[n.channel],
      why: n.why || "",
    };
    if (!waited && !marketing) {
      step.when = { afterMs: 0 };
      immediate.push(step);
      continue;
    }
    if (at) {
      step.when = at.minute ? { addDays: at.addDays, hour: at.hour, minute: at.minute } : { addDays: at.addDays, hour: at.hour };
    } else {
      step.when = { afterMs: cum * 60 * 1000 };
    }
    steps.push(step);
  }

  return {
    id: "flow:" + (flow.id || flow.name),
    name: flow.name,
    intent: "",
    rule: describeFlow(flow),
    marketing: marketing,
    immediate: immediate,
    steps: steps,
  };
}

/**
 * A route from the code, as nodes the owner can edit.
 *
 * The inverse of compileFlow. A route counted back from an appointment
 * (route H, the reminders) has no node for that and is refused rather than
 * approximated.
 */
function routeToNodes(route) {
  var nodes = [];
  var k = 0;
  function id() { k++; return "n" + k; }
  function sendOf(s) {
    var n = { id: id(), type: "send", channel: s.channel, message: s.key };
    if (s.gate === "call_no_answer") n.onlyIfCallUnanswered = true;
    if (s.label) n.label = s.label;
    if (s.why) n.why = s.why;
    return n;
  }
  for (var i = 0; i < route.immediate.length; i++) nodes.push(sendOf(route.immediate[i]));

  var cum = 0;
  var stopped = false;
  for (var j = 0; j < route.steps.length; j++) {
    var s = route.steps[j];
    if (s.when.beforeMs !== undefined) {
      throw new Error("Route " + route.id + " counts back from an appointment, which a flow cannot express.");
    }
    if (!stopped && s.gate !== "always") {
      nodes.push({ id: id(), type: "stop_if", conditions: ["replied"] });
      stopped = true;
    }
    if (s.when.afterMs !== undefined) {
      var mins = s.when.afterMs / 60000;
      if (mins > cum) { nodes.push({ id: id(), type: "wait", after: { minutes: mins - cum } }); cum = mins; }
    } else {
      nodes.push({ id: id(), type: "wait", at: { addDays: s.when.addDays, hour: s.when.hour, minute: s.when.minute || 0 } });
    }
    nodes.push(sendOf(s));
  }
  return nodes;
}

/* -------------------------------------------------------------- describe */

/**
 * The flow in one sentence, the way the owner would say it.
 *
 * "They get a text and an email straight away, then, unless they reply, a
 * call at 15 minutes, ..., then it stops." The sentence is the test of
 * whether the flow is what they meant, so it is built from the same walk the
 * compiler does, not from a separate reading of the nodes.
 */
function describeFlow(flow) {
  var nodes = flow && isArray(flow.nodes) ? flow.nodes : [];
  var marketing = basisFor(flow && flow.triggers) === "we_are_contacting_them";
  var before = [], after = [];
  var cum = 0, at = null, waited = false, stopping = false;

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if (!n) continue;
    if (n.type === "stop_if") { stopping = true; continue; }
    if (n.type === "wait") {
      waited = true;
      if (n.after && isInt(n.after.minutes)) cum += n.after.minutes;
      else if (n.at) at = n.at;
      continue;
    }
    if (n.type !== "send") continue;
    var when;
    if (!waited) when = marketing ? "as soon as it is in sending hours" : "straight away";
    else if (at) when = "at " + clockTime(at.hour, at.minute || 0) + (at.addDays === 0 ? " the same day" : " on day " + (at.addDays + 1));
    else when = "at " + duration(cum);
    if (n.onlyIfCallUnanswered === true) when += " if the call went unanswered";
    (stopping ? after : before).push({ noun: NOUN[n.channel] || "a message", when: when });
  }
  if (!before.length && !after.length) return "Nothing is sent.";

  var a = group(before), b = group(after);
  var s;
  if (a && b) s = "They get " + a + ", then, unless they reply, " + b;
  else if (a) s = "They get " + a;
  else s = "Unless they reply, they get " + b;
  return s + ", then it stops.";
}

/**
 * The flow as a short list, one row per message: when, and how.
 *
 *   Straight away   Text
 *   Straight away   Email
 *   15 min          Call
 *   17 min          Text   (only if the call went unanswered)
 *   6pm same day    Text
 *
 * What the screens show. The sentence above is kept for the tests and the
 * records; a list is what a person scans.
 */
function flowTimeline(flow) {
  var nodes = flow && isArray(flow.nodes) ? flow.nodes : [];
  var marketing = basisFor(flow && flow.triggers) === "we_are_contacting_them";
  var out = [];
  var cum = 0, at = null, waited = false, stopping = false;
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if (!n) continue;
    if (n.type === "stop_if") { stopping = true; continue; }
    if (n.type === "wait") {
      waited = true;
      if (n.after && isInt(n.after.minutes)) cum += n.after.minutes;
      else if (n.at) at = n.at;
      continue;
    }
    if (n.type !== "send") continue;
    var when;
    if (!waited) when = marketing ? "First sending hour" : "Straight away";
    else if (at) when = (at.addDays === 0 ? "Same day" : "Day " + (at.addDays + 1)) + ", " + clockTime(at.hour, at.minute || 0);
    else when = shortDuration(cum);
    out.push({
      nodeId: n.id,
      when: when,
      channel: n.channel,
      label: LABEL[n.channel] === "Agent calls" ? "Call" : LABEL[n.channel] || String(n.channel),
      message: n.message || "",
      onlyIfCallUnanswered: n.onlyIfCallUnanswered === true,
      unlessReplied: stopping,
    });
  }
  return out;
}

function shortDuration(mins) {
  if (mins % 1440 === 0) return mins / 1440 + (mins === 1440 ? " day" : " days");
  if (mins % 60 === 0) return mins / 60 + " hr";
  return mins + " min";
}

/* Consecutive sends at the same moment read as one: "a text and an email
   straight away". */
function group(items) {
  var parts = [];
  for (var i = 0; i < items.length; i++) {
    var last = parts[parts.length - 1];
    if (last && last.when === items[i].when) last.nouns.push(items[i].noun);
    else parts.push({ when: items[i].when, nouns: [items[i].noun] });
  }
  var phrases = parts.map(function (p) { return p.nouns.join(" and ") + " " + p.when; });
  if (phrases.length <= 1) return phrases.join("");
  return phrases.slice(0, -1).join(", ") + ", and " + phrases[phrases.length - 1];
}

function clockTime(h, m) {
  var suffix = h < 12 ? "am" : "pm";
  var hh = h % 12 === 0 ? 12 : h % 12;
  return hh + (m ? ":" + (m < 10 ? "0" + m : m) : "") + suffix;
}

function duration(mins) {
  if (mins % 1440 === 0) return mins / 1440 === 1 ? "1 day" : mins / 1440 + " days";
  if (mins % 60 === 0) return mins / 60 === 1 ? "1 hour" : mins / 60 + " hours";
  return mins === 1 ? "1 minute" : mins + " minutes";
}

/* --------------------------------------------------------------- helpers */

function isArray(x) { return Object.prototype.toString.call(x) === "[object Array]"; }
function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }
function allIn(xs, set) {
  if (!isArray(xs) || !xs.length) return false;
  for (var i = 0; i < xs.length; i++) if (set.indexOf(xs[i]) === -1) return false;
  return true;
}

export { MERGED, canonicalTrigger, BASES, TRIGGERS, TRIGGER_ORDER, CONDITIONS, NODE_TYPES, QUIET_START, QUIET_END, WARN_SENDS, MAX_SENDS, PECR_CALL_RULE, basisOf, basisFor, defaultRouteFor, triggerLabel, palette, validateFlow, compileFlow, routeToNodes, describeFlow, flowTimeline, clockTime, duration };
