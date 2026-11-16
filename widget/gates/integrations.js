/* =========================================================================
   Integrations: every channel, whether it is actually connected, and what
   is missing if it is not.

   CONNECTED IS MEASURED, NEVER DECLARED. Nothing here stores a `connected`
   flag. A status is worked out, every time, from facts observed at request
   time by lib/dashboard/integrations.ts:

     n8n      the OHM workflows as they are on the instance: active or not,
              and which *_PENDING placeholders are still baked into them
     retell   the agents and phone numbers Retell lists
     env      the website's own settings
     agent    the outbound number saved in Convex
     booking  whether the Google booking script answers

   Why the workflows and not the environment: TWILIO_CRED_ID, META_PAGE_TOKEN
   and the rest are read by the n8n BUILDER, which falls back to a *_PENDING
   placeholder and bakes it into the workflow it pushes. The website never
   sees them. The workflow on the instance is the thing that actually
   decides, so it is the thing that is read. (The plan says "env"; the code
   says otherwise, and the code wins.)

   A fact that could not be gathered makes a status "could_not_check",
   never "connected". A screen that guesses green is the one failure this
   exists to prevent: voice was dead for four days under an assumption.

   Plain JavaScript, no imports, one export line, like everything in gates/.
   ========================================================================= */

/* The address the builder sends from until OMH's own mailbox exists. It
   works, so email reads as connected, and the note says whose address it is. */
var STAND_IN_SENDER = "videoeditoromh@gmail.com";

/* Who supplies each missing value. The sections are those of
   OHM/CLIENT-ACCESS-REQUEST.md, "What we need from OMH". */
var FROM = {
  twilio: "OMH: a Twilio account and a UK number (access request, section 1)",
  retell: "OMH: credit on the Retell account (access request, section 2)",
  mailbox: "OMH: the sending mailbox and its IMAP login (access request, section 3)",
  meta: "OMH: the Facebook Page and Meta app (access request, section 4)",
  google: "OMH: the Google Ads lead form key (access request, section 5)",
  calendar: "OMH: the booking calendar script (docs/google-calendar-booking.md)",
  us: "us: a setting or a step on our side, no client input needed",
};

/* The placeholders the builder bakes in, and what each one means in words.
   ERROR_WF_PENDING is not here: push.py resolves it by name at push time,
   so it never describes a missing integration. */
var PLACEHOLDERS = {
  TWILIO_CRED_PENDING: { what: "Twilio is not connected to n8n (TWILIO_CRED_ID)", from: FROM.twilio },
  TWILIO_NUMBER_PENDING: { what: "There is no number to text from (TWILIO_FROM_NUMBER)", from: FROM.twilio },
  GOOGLE_LEAD_FORM_KEY_PENDING: { what: "Google Ads lead forms have no key, so their leads are refused (GOOGLE_LEAD_FORM_KEY)", from: FROM.google },
  META_PAGE_TOKEN_PENDING: { what: "There is no Facebook Page token, so nothing can be read or replied to (META_PAGE_TOKEN)", from: FROM.meta },
  META_APP_SECRET_PENDING: { what: "There is no Meta app secret, so Meta's messages cannot be verified (META_APP_SECRET)", from: FROM.meta },
  META_VERIFY_PENDING: { what: "Meta's webhook has not been verified (META_VERIFY_TOKEN)", from: FROM.meta },
  IMAP_CRED_PENDING: { what: "There is no login for the reply mailbox (IMAP_CRED_ID)", from: FROM.mailbox },
};

var INTEGRATIONS = [
  { key: "chat", group: "in", label: "Website chat", what: "The chat box on the website, answered by the assistant." },
  { key: "voice", group: "in", label: "Website voice", what: "The talk button on the website, answered by the voice assistant." },
  { key: "lead_router", group: "in", label: "Website form and Google Ads landing pages", what: "Forms on the website, sent on for follow-up." },
  { key: "google_lead_forms", group: "in", label: "Google Ads lead forms", what: "Leads from forms inside Google Ads itself." },
  { key: "meta", group: "in", label: "Facebook and Instagram", what: "Messages and lead ads from the Facebook Page and Instagram." },
  { key: "texts", group: "out", label: "Text messages and missed calls", what: "Follow-up texts, replies to them, and texts after a missed call." },
  { key: "outbound_calls", group: "out", label: "Outbound calls", what: "The assistant ringing people back about their own enquiry." },
  { key: "email_followups", group: "out", label: "Email follow-ups", what: "The follow-up emails a sequence sends." },
  { key: "email_replies", group: "out", label: "Email replies", what: "Reading what people write back, so a reply stops the chasing." },
  { key: "appointments", group: "out", label: "Appointments", what: "Putting booked consultations in OMH's calendar." },
];

/* What each channel needs to take a lead in. Keyed and ordered exactly as
   TRIGGER_ORDER in flows.js (asserted by the tests), so this screen and the
   Control panel cannot list different channels. A channel with nothing
   listed has no integration built for it. */
var CHANNEL_NEEDS = {
  website_chat: ["chat"],
  website_voice: ["voice"],
  website_form: ["lead_router"],
  google_ads: ["lead_router", "google_lead_forms"],
  facebook_ads: ["meta"],
  instagram_ads: ["meta"],
  facebook: ["meta"],
  instagram: ["meta"],
  whatsapp: [],
  phone_inbound: ["texts"],
  phone_missed: ["texts"],
  reactivation: ["texts"],
  organic: ["lead_router"],
  referral: ["lead_router"],
  direct: ["lead_router"],
};

/* Old channel names, and what they became: the same table as MERGED in
   flows.js (asserted equal by the tests), copied because a gate has no
   imports. An old name must find its new name's switch. */
var MERGED = {
  facebook_dm: "facebook", facebook_page: "facebook",
  instagram_dm: "instagram", instagram_page: "instagram",
  whatsapp_ads: "whatsapp", google_organic: "organic", roi_calculator: "website_form",
};

var SITE_AGENT = "OMH Site Assistant";

/* ------------------------------------------------------------ the facts */

/** Every *_PENDING placeholder in a piece of text, sorted, once each. */
function pendingTokens(text) {
  var found = {}, re = /\b[A-Z][A-Z_]*_PENDING\b/g, m;
  var s = String(text == null ? "" : text);
  while ((m = re.exec(s))) if (m[0] !== "ERROR_WF_PENDING") found[m[0]] = true;
  return Object.keys(found).sort();
}

/** One n8n workflow, as returned by its API, reduced to what this screen reads. */
function workflowFacts(raw) {
  var w = raw || {};
  var text = JSON.stringify(w);
  var senders = {};
  var nodes = w.nodes || [];
  for (var i = 0; i < nodes.length; i++) {
    var p = (nodes[i] && nodes[i].parameters) || {};
    var f = typeof p.fromEmail === "string" ? p.fromEmail.trim() : "";
    /* An expression is worked out at run time; only a literal is an address. */
    if (f && f.charAt(0) !== "=") senders[f] = true;
  }
  return {
    name: String(w.name || ""),
    active: w.active === true,
    pending: pendingTokens(text),
    agentOverride: text.indexOf("override_agent_id") !== -1,
    senders: Object.keys(senders).sort(),
  };
}

/* ------------------------------------------------------------ the checks
   Each returns { ok: true }, { ok: false, what, from }, or { ok: null, why }.
   `null` is "could not check", and it is never read as a pass. */

function shortName(name) {
  var s = String(name || "");
  var i = s.lastIndexOf("\u2014 ");
  return i === -1 ? s : s.slice(i + 2);
}

function findWorkflow(facts, wanted) {
  var list = (facts && facts.n8n && facts.n8n.workflows) || [];
  for (var i = 0; i < list.length; i++) {
    var n = shortName(list[i].name);
    if (n === wanted || n.indexOf(wanted + " ") === 0) return list[i];
  }
  return null;
}

function n8nUnchecked(facts) {
  var n = facts && facts.n8n;
  if (n && n.checked) return null;
  return { ok: null, why: "Could not read n8n: " + ((n && n.why) || "no answer") + "." };
}

function workflowOn(name) {
  return function (facts) {
    var u = n8nUnchecked(facts);
    if (u) return u;
    var w = findWorkflow(facts, name);
    if (!w) return { ok: false, what: "The " + name + " workflow is not on n8n", from: FROM.us };
    if (!w.active) return { ok: false, what: "The " + name + " workflow is switched off in n8n", from: FROM.us };
    return { ok: true };
  };
}

function noPlaceholder(name, token) {
  return function (facts) {
    var u = n8nUnchecked(facts);
    if (u) return u;
    var w = findWorkflow(facts, name);
    if (!w) return { ok: true }; // reported once, by workflowOn
    if ((w.pending || []).indexOf(token) !== -1) {
      return { ok: false, what: PLACEHOLDERS[token].what, from: PLACEHOLDERS[token].from };
    }
    return { ok: true };
  };
}

function followUpsRun(facts) {
  var r = workflowOn("Sequence Worker")(facts);
  if (r.ok === false) {
    return { ok: false, what: r.what + ", so queued follow-ups wait and nothing is sent", from: r.from };
  }
  return r;
}

function siteSetting(name, key) {
  return function (facts) {
    var e = (facts && facts.env) || {};
    return e[key] ? { ok: true } : { ok: false, what: name + " is not set on the website", from: FROM.us };
  };
}

function retellAgent(agentName) {
  return function (facts) {
    var r = facts && facts.retell;
    if (!r || !r.checked) return { ok: null, why: "Could not read Retell: " + ((r && r.why) || "no answer") + "." };
    /* Retell lists it as "OMH Site Assistant (Melissa)": the name, then
       anything after a space. Starting with the name is not enough on its
       own ("OMH Site Assistant 2" would pass), so it is the name exactly or
       the name followed by a space. */
    var found = (r.agents || []).some(function (n) {
      return n === agentName || String(n).indexOf(agentName + " ") === 0;
    });
    if (!found) {
      return { ok: false, what: "Retell has no agent called " + agentName, from: FROM.us };
    }
    return { ok: true };
  };
}

function outboundNumber(facts) {
  var a = facts && facts.agent;
  if (!a || !a.checked) return { ok: null, why: "Could not read the outbound number: " + ((a && a.why) || "no answer") + "." };
  if (!a.fromNumber) return { ok: false, what: "No number to call from is saved on the Calling agent screen", from: FROM.twilio };
  var r = facts.retell;
  if (!r || !r.checked) return { ok: null, why: "Could not read Retell: " + ((r && r.why) || "no answer") + "." };
  if ((r.numbers || []).indexOf(a.fromNumber) === -1) {
    return { ok: false, what: "The number " + a.fromNumber + " has not been imported into Retell, so it cannot place calls", from: FROM.retell };
  }
  return { ok: true };
}

function outboundAgent(facts) {
  var u = n8nUnchecked(facts);
  if (u) return u;
  var w = findWorkflow(facts, "Sequence Worker");
  if (w && !w.agentOverride) {
    return { ok: false, what: "The outbound agent has not been created, so a call would be answered by whichever agent the number belongs to", from: FROM.us };
  }
  return { ok: true };
}

function sender(facts) {
  var u = n8nUnchecked(facts);
  if (u) return u;
  var w = findWorkflow(facts, "Sequence Worker");
  if (w && !(w.senders || []).length) return { ok: false, what: "The follow-up email step has no address to send from (MAIL_FROM)", from: FROM.mailbox };
  return { ok: true };
}

function bookingAnswers(facts) {
  var b = facts && facts.booking;
  if (!b || !b.checked) return { ok: null, why: "Could not reach the booking script: " + ((b && b.why) || "no answer") + "." };
  /* The gatherer's reason is already a sentence ("... are not set on the
     website", "The booking script answered without ..."), so it is used as
     it is. Prefixing "did not answer properly" made a missing setting read
     as a script that had been asked and failed. */
  if (!b.ok) return { ok: false, what: b.why || "The booking script did not answer properly", from: FROM.calendar };
  return { ok: true };
}

var TWILIO = [
  noPlaceholder("Twilio Inbound", "TWILIO_CRED_PENDING"), noPlaceholder("Twilio Inbound", "TWILIO_NUMBER_PENDING"),
  noPlaceholder("Sequence Worker", "TWILIO_CRED_PENDING"), noPlaceholder("Sequence Worker", "TWILIO_NUMBER_PENDING"),
];

var CHECKS = {
  chat: [workflowOn("Chat")],
  voice: [workflowOn("Voice"), retellAgent(SITE_AGENT)],
  lead_router: [siteSetting("OHM_LEAD_ROUTER_URL", "leadRouterUrl"), workflowOn("Lead Router")],
  google_lead_forms: [workflowOn("Lead Router"), noPlaceholder("Lead Router", "GOOGLE_LEAD_FORM_KEY_PENDING")],
  meta: [workflowOn("Meta"), noPlaceholder("Meta", "META_PAGE_TOKEN_PENDING"),
         noPlaceholder("Meta", "META_APP_SECRET_PENDING"), noPlaceholder("Meta", "META_VERIFY_PENDING")],
  texts: [workflowOn("Twilio Inbound"), followUpsRun].concat(TWILIO),
  outbound_calls: [followUpsRun].concat(TWILIO, [outboundNumber, outboundAgent]),
  email_followups: [followUpsRun, sender],
  email_replies: [workflowOn("Email Inbound"), noPlaceholder("Email Inbound", "IMAP_CRED_PENDING")],
  appointments: [bookingAnswers],
};

/* ------------------------------------------------------------ the status */

/**
 * One integration's status: connected, not_connected or could_not_check,
 * with what is missing (each with who supplies it) and what could not be
 * asked. A definite gap outranks an unknown: one missing token is enough to
 * say "not connected", whatever else could not be read.
 */
function integrationStatus(key, facts) {
  var def = null;
  for (var i = 0; i < INTEGRATIONS.length; i++) if (INTEGRATIONS[i].key === key) def = INTEGRATIONS[i];
  if (!def) return null;
  var missing = [], unchecked = [], seen = {};
  var checks = CHECKS[key] || [];
  for (var j = 0; j < checks.length; j++) {
    var r = checks[j](facts || {});
    if (r.ok === false && !seen[r.what]) { seen[r.what] = true; missing.push({ what: r.what, from: r.from }); }
    else if (r.ok === null && unchecked.indexOf(r.why) === -1) unchecked.push(r.why);
  }
  var state = missing.length ? "not_connected" : unchecked.length ? "could_not_check" : "connected";
  var out = { key: key, label: def.label, what: def.what, group: def.group, state: state, missing: missing, unchecked: unchecked };
  if (key === "email_followups" && state === "connected") {
    var w = findWorkflow(facts, "Sequence Worker");
    if (w && (w.senders || []).indexOf(STAND_IN_SENDER) !== -1) {
      out.note = "Sending from " + STAND_IN_SENDER + ", a stand-in Gmail account, until OMH's own mailbox is connected.";
    }
  }
  return out;
}

function canonical(channel) {
  var c = String(channel || "");
  return Object.prototype.hasOwnProperty.call(MERGED, c) ? MERGED[c] : c;
}

/** Is this channel switched on? Absent from the switches means on. */
function isOn(switches, channel) {
  var s = switches || {};
  return s[canonical(channel)] !== false;
}

/**
 * One channel's row: its integrations' statuses rolled up, or "off" when
 * the owner has switched it off. Off wins over broken on purpose: the owner
 * switched it off, and reading it as an outage would send somebody to fix a
 * channel that is doing exactly what it was told. What is missing is kept,
 * so switching it back on does not come as a surprise.
 */
function channelStatus(channel, facts, switches) {
  var c = canonical(channel);
  var needs = CHANNEL_NEEDS[c] || [];
  var parts = [];
  for (var i = 0; i < needs.length; i++) parts.push(integrationStatus(needs[i], facts));
  /* Once each: two integrations behind one channel often share a cause (the
     Lead Router being off, or n8n unreachable), and the row should say it
     once, not once per integration. */
  var missing = [], unchecked = [], seen = {};
  for (var j = 0; j < parts.length; j++) {
    for (var m = 0; m < parts[j].missing.length; m++) {
      var gap = parts[j].missing[m];
      if (!seen[gap.what]) { seen[gap.what] = true; missing.push(gap); }
    }
    for (var u = 0; u < parts[j].unchecked.length; u++) {
      if (unchecked.indexOf(parts[j].unchecked[u]) === -1) unchecked.push(parts[j].unchecked[u]);
    }
  }
  var on = isOn(switches, c);
  var state;
  if (!on) state = "off";
  else if (!needs.length) state = "not_built";
  else {
    var connected = parts.filter(function (p) { return p.state === "connected"; }).length;
    var broken = parts.filter(function (p) { return p.state === "not_connected"; }).length;
    if (connected === parts.length) state = "connected";
    else if (connected && broken) state = "partial";
    else if (broken) state = "not_connected";
    else state = "could_not_check";
  }
  return { channel: c, on: on, state: state, integrations: needs, missing: missing, unchecked: unchecked };
}

/* ------------------------------------------------- the switch, in n8n

   The chat workflow inlines this file (gate_inline) to obey the switch, so
   these run inside a Code node as well as in the tests. */

/**
 * Which channel a call to the chat webhook belongs to, for its switch.
 *
 * Three callers share that webhook. The website widget (website_chat); the
 * Meta workflow for a Facebook or Instagram DM, which sends a session id of
 * "meta:<psid>" and the surface as page_url; and Twilio Inbound for a text
 * reply, page_url "sms", which the reply brain has ALREADY judged against
 * the switch, so it returns null and is not judged twice.
 */
function chatChannel(body) {
  var b = body || {};
  var sid = String(b.session_id || "");
  var page = String(b.page_url || "");
  if (page === "sms") return null;
  if (sid.indexOf("meta:") === 0) return page === "instagram" ? "instagram" : "facebook";
  return "website_chat";
}

/** What somebody reads when they write on a switched-off channel. */
function switchedOffReply() {
  return "Thanks for your message. I have passed it to the team, and a person will reply to you here.";
}

var STATE_LABELS = {
  connected: "Connected",
  partial: "Partly connected",
  not_connected: "Not connected",
  could_not_check: "Could not check",
  off: "Switched off",
  not_built: "Not built yet",
};

export { INTEGRATIONS, CHANNEL_NEEDS, MERGED, PLACEHOLDERS, STAND_IN_SENDER, STATE_LABELS, SITE_AGENT, pendingTokens, workflowFacts, integrationStatus, channelStatus, isOn, chatChannel, switchedOffReply };
