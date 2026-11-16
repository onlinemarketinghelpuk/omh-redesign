/* =========================================================================
   Connecting a channel from the dashboard: what each one needs, how its
   values are checked, and exactly which part of which workflow they fill.

   docs/engineering/015-connect-channels-from-the-dashboard/plan.md.

   The provider test (does Twilio accept these keys?) and the writes (the n8n
   credential, the workflow, the Convex setting) live in
   lib/dashboard/connect.ts. This file is the part with a right answer, so it
   is the part the tests hold: the registry, the validation, the patch, and
   what is never shown back to a browser.

   THE PATCH IS PRECISE ON PURPOSE. A workflow is changed only at the fields
   a rule names: a credential's id, a parameter whose whole value is the
   placeholder, or the placeholder inside one node's text. Never a find and
   replace over a whole workflow: the chat workflow carries the integrations
   gate inlined, and a careless replace would rewrite that code.

   Plain JavaScript, no imports, one export line.
   ========================================================================= */

var PENDING = "_" + "PENDING";
function token(name) { return name + PENDING; }

/* The stand-in sender the builder uses until OMH's own mailbox is connected.
   Connecting a sending mailbox replaces these; disconnecting puts them back. */
/* The names the builder gives the placeholder credentials, so disconnect
   restores them exactly, and Connect can create the real one under the same
   name. */
var CRED_NAMES = { twilioApi: "Twilio \u2014 OMH", imap: "IMAP \u2014 OMH replies" };

var STAND_IN_SMTP = { id: "I7yvfVmEpZslNAxV", name: "Gmail SMTP \u2014 Ads System (app pw 2026-08-04)", from: "videoeditoromh@gmail.com" };

/* Fields a browser is never sent back. Twilio's token and the mailbox
   passwords are not stored at all (they become n8n credentials); these are
   the ones that ARE stored, in Convex, and so must be redacted on the way
   out. */
var SECRET_FIELDS = ["pageToken", "appSecret", "authToken", "password", "secret"];

var CONNECTORS = [
  {
    key: "twilio",
    integration: "texts",
    label: "Text messages (Twilio)",
    what: "Sends the follow-up texts, reads replies, and texts after a missed call.",
    workflows: ["Lead Router", "Sequence Worker", "Twilio Inbound"],
    steps: [
      "Sign in to Twilio and open Account, then API keys and tokens.",
      "Copy the Account SID (it starts AC) and the Auth Token.",
      "Copy the UK number you text from, as it appears under Phone Numbers.",
    ],
    fields: [
      { key: "accountSid", label: "Account SID", kind: "text", required: true, placeholder: "AC followed by 32 characters" },
      { key: "authToken", label: "Auth Token", kind: "secret", required: true, help: "Kept by n8n, encrypted. This screen never shows it again." },
      { key: "fromNumber", label: "Number to text from", kind: "phone", required: true, placeholder: "07700 900123" },
    ],
  },
  {
    key: "meta",
    integration: "meta",
    label: "Facebook and Instagram",
    what: "Reads and answers Messenger and Instagram messages, and takes lead ad forms.",
    workflows: ["Meta"],
    steps: [
      "In Meta for Developers, open the OMH app and copy the App Secret (App settings, then Basic).",
      "Generate a Page access token for the OMH Facebook Page, with messaging and leads permissions.",
      "Copy the Page ID from the Page's About section.",
      "After connecting, paste the callback URL and verify token shown here into the app's Webhooks settings.",
    ],
    fields: [
      { key: "pageId", label: "Facebook Page ID", kind: "text", required: true, placeholder: "Numbers only" },
      { key: "pageToken", label: "Page access token", kind: "secret", required: true },
      { key: "appSecret", label: "App secret", kind: "secret", required: true },
    ],
  },
  {
    key: "google_lead_form",
    integration: "google_lead_forms",
    label: "Google Ads lead forms",
    what: "Takes the leads from forms inside Google Ads itself.",
    workflows: ["Lead Router"],
    steps: [
      "Press Connect: a key is made for you.",
      "In Google Ads, open the lead form, then Lead delivery, then Webhook integration.",
      "Paste the webhook URL and the key shown here, and send a test lead.",
    ],
    fields: [],
  },
  {
    key: "imap",
    integration: "email_replies",
    label: "Reply mailbox",
    what: "Reads what people write back, so a reply stops the chasing.",
    workflows: ["Email Inbound"],
    steps: [
      "Use the mailbox the follow-up emails are sent from, so replies land in it.",
      "For Gmail or Google Workspace, make an app password; the normal password will be refused.",
    ],
    fields: [
      { key: "host", label: "IMAP server", kind: "text", required: true, placeholder: "imap.gmail.com" },
      { key: "port", label: "Port", kind: "number", required: true, placeholder: "993" },
      { key: "user", label: "Email address", kind: "email", required: true },
      { key: "password", label: "Password or app password", kind: "secret", required: true, help: "Kept by n8n, encrypted. This screen never shows it again." },
    ],
  },
  {
    key: "smtp",
    integration: "email_followups",
    label: "Sending mailbox",
    what: "The address follow-up emails come from. Until this is connected they come from a stand-in Gmail account.",
    workflows: ["Lead Router", "Sequence Worker", "Notify", "Error Handler"],
    steps: [
      "Use an address on OMH's own domain, so replies and trust stay with OMH.",
      "For Gmail or Google Workspace, make an app password; the normal password will be refused.",
    ],
    fields: [
      { key: "from", label: "Send from", kind: "email", required: true, placeholder: "hello@onlinemarketinghelp.co.uk" },
      { key: "host", label: "SMTP server", kind: "text", required: true, placeholder: "smtp.gmail.com" },
      { key: "port", label: "Port", kind: "number", required: true, placeholder: "465" },
      { key: "user", label: "Login", kind: "email", required: true },
      { key: "password", label: "Password or app password", kind: "secret", required: true, help: "Kept by n8n, encrypted. This screen never shows it again." },
    ],
  },
  {
    key: "booking",
    integration: "appointments",
    label: "Booking calendar",
    what: "Puts booked consultations in OMH's Google Calendar, and offers only free times.",
    workflows: [],
    steps: [
      "Follow docs/google-calendar-booking.md to deploy the Apps Script on OMH's Google account.",
      "Copy the web app URL (it ends in /exec) and the SECRET you set in the script.",
    ],
    fields: [
      { key: "url", label: "Script web app URL", kind: "url", required: true, placeholder: "https://script.google.com/macros/s/.../exec" },
      { key: "secret", label: "Script secret", kind: "secret", required: true },
    ],
  },
];

function connector(key) {
  for (var i = 0; i < CONNECTORS.length; i++) if (CONNECTORS[i].key === key) return CONNECTORS[i];
  return null;
}

/* ------------------------------------------------------------ validation */

/** A UK number, written any usual way, as +44 E.164; "" when it is not one. */
function ukNumber(raw) {
  var s = String(raw || "").replace(/[\s().-]/g, "");
  if (s.indexOf("+44") === 0) s = "0" + s.slice(3);
  else if (s.indexOf("0044") === 0) s = "0" + s.slice(4);
  if (!/^0(1\d{8,9}|2\d{9}|3\d{9}|7\d{9})$/.test(s)) return "";
  return "+44" + s.slice(1);
}

var RULES = {
  twilio: {
    accountSid: function (v) { return /^AC[0-9a-f]{32}$/i.test(v) ? null : "An Account SID is AC followed by 32 letters and numbers."; },
    authToken: function (v) { return /^[0-9a-f]{32}$/i.test(v) ? null : "An Auth Token is 32 letters and numbers."; },
    fromNumber: function (v) { return ukNumber(v) ? null : "Use a UK number starting 01, 02, 03 or 07."; },
  },
  meta: {
    pageId: function (v) { return /^\d{5,30}$/.test(v) ? null : "A Page ID is numbers only."; },
    /* Letters and numbers only: the token is written into a header and into
       code inside n8n, so nothing that could end a string gets in. */
    pageToken: function (v) { return /^[A-Za-z0-9]{40,1000}$/.test(v) ? null : "That does not look like a Page access token. Copy it again, in full."; },
    appSecret: function (v) { return /^[0-9a-f]{32}$/i.test(v) ? null : "An App Secret is 32 letters and numbers."; },
  },
  google_lead_form: {},
  imap: {
    host: function (v) { return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v) ? null : "Use the server name, like imap.gmail.com."; },
    port: function (v) { var n = +v; return n >= 1 && n <= 65535 && Math.floor(n) === n ? null : "A port is a number, usually 993."; },
    user: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Use the full email address."; },
    password: function (v) { return v.length >= 4 ? null : "Enter the password."; },
  },
  smtp: {
    from: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Use a full email address."; },
    host: function (v) { return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v) ? null : "Use the server name, like smtp.gmail.com."; },
    port: function (v) { var n = +v; return n >= 1 && n <= 65535 && Math.floor(n) === n ? null : "A port is a number, usually 465 or 587."; },
    user: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Use the full login address."; },
    password: function (v) { return v.length >= 4 ? null : "Enter the password."; },
  },
  booking: {
    url: function (v) { return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(v) ? null : "Use the web app URL from Apps Script; it ends in /exec."; },
    secret: function (v) { return v.length >= 8 ? null : "The secret is at least 8 characters."; },
  },
};

/**
 * Are these values usable, before anything is asked of the provider?
 * Returns { ok, errors: { field: message }, clean } with values trimmed and
 * normalised (a UK number as +44, a port as a number).
 */
function validateConnector(key, values) {
  var c = connector(key);
  if (!c) return { ok: false, errors: { _: "There is no such connection." }, clean: {} };
  var v = values || {};
  var errors = {}, clean = {};
  for (var i = 0; i < c.fields.length; i++) {
    var f = c.fields[i];
    var raw = v[f.key] == null ? "" : String(v[f.key]).trim();
    if (!raw) { if (f.required) errors[f.key] = f.label + " is needed."; continue; }
    var rule = (RULES[key] || {})[f.key];
    var bad = rule ? rule(raw) : null;
    if (bad) { errors[f.key] = bad; continue; }
    clean[f.key] = f.kind === "number" ? +raw : f.kind === "phone" ? ukNumber(raw) : raw;
  }
  return { ok: Object.keys(errors).length === 0, errors: errors, clean: clean };
}

/* ------------------------------------------------------------ the patch */

/**
 * The changes one connector makes, as rules.
 *
 * `values` is the connector's stored config: what was typed, plus what was
 * made on the way (an n8n credential id, a generated key). With `disconnect`
 * the same rules run backwards and put the placeholders back.
 *
 *   { kind: "credential", type, from, to, name }   a node's credentials[type].id
 *   { kind: "param", param, from, to }             a parameter whose WHOLE value is `from`
 *   { kind: "text", from, to }                     `from` inside a node's parameter text
 */
function rulesFor(key, values, disconnect) {
  var v = values || {};
  var r = [];
  if (key === "twilio") {
    r.push({ kind: "credential", type: "twilioApi", from: token("TWILIO_CRED"), to: v.credentialId, name: v.credentialName, fromName: CRED_NAMES.twilioApi });
    r.push({ kind: "param", param: "from", from: token("TWILIO_NUMBER"), to: v.fromNumber });
  } else if (key === "meta") {
    r.push({ kind: "text", from: token("META_PAGE_TOKEN"), to: v.pageToken });
    r.push({ kind: "text", from: token("META_APP_SECRET"), to: v.appSecret });
    r.push({ kind: "text", from: token("META_VERIFY"), to: v.verifyToken });
  } else if (key === "google_lead_form") {
    r.push({ kind: "text", from: token("GOOGLE_LEAD_FORM_KEY"), to: v.key });
  } else if (key === "imap") {
    r.push({ kind: "credential", type: "imap", from: token("IMAP_CRED"), to: v.credentialId, name: v.credentialName, fromName: CRED_NAMES.imap });
  } else if (key === "smtp") {
    r.push({ kind: "credential", type: "smtp", from: STAND_IN_SMTP.id, to: v.credentialId, name: v.credentialName, fromName: STAND_IN_SMTP.name });
    r.push({ kind: "param", param: "fromEmail", from: STAND_IN_SMTP.from, to: v.from });
  }
  if (!disconnect) return r;
  return r.map(function (x) {
    var back = { kind: x.kind, type: x.type, param: x.param, from: x.to, to: x.from };
    if (x.kind === "credential") back.name = x.fromName || x.from;
    return back;
  });
}

function replaceIn(value, from, to, count) {
  if (typeof value === "string") {
    if (value.indexOf(from) === -1) return value;
    count.n += value.split(from).length - 1;
    return value.split(from).join(to);
  }
  if (Array.isArray(value)) return value.map(function (x) { return replaceIn(x, from, to, count); });
  if (value && typeof value === "object") {
    var out = {};
    for (var k in value) if (Object.prototype.hasOwnProperty.call(value, k)) out[k] = replaceIn(value[k], from, to, count);
    return out;
  }
  return value;
}

/**
 * One workflow with the rules applied. Returns the body n8n's PUT accepts
 * (name, nodes, connections, settings: never `active`, which a save must not
 * change) and how many places each rule changed.
 *
 * A rule whose `to` is missing changes nothing: a half-made connection must
 * not write "undefined" into a workflow.
 */
function patchWorkflow(raw, rules) {
  var wf = raw || {};
  var counts = [];
  var nodes = (wf.nodes || []).map(function (n) { return JSON.parse(JSON.stringify(n)); });
  for (var i = 0; i < (rules || []).length; i++) {
    var rule = rules[i];
    var c = { n: 0 };
    if (rule.to == null || rule.to === "") { counts.push(0); continue; }
    for (var j = 0; j < nodes.length; j++) {
      var node = nodes[j];
      if (rule.kind === "credential") {
        var cred = node.credentials && node.credentials[rule.type];
        if (cred && cred.id === rule.from) {
          cred.id = rule.to;
          if (rule.name) cred.name = rule.name;
          c.n++;
        }
      } else if (rule.kind === "param") {
        if (node.parameters && node.parameters[rule.param] === rule.from) {
          node.parameters[rule.param] = rule.to;
          c.n++;
        }
      } else if (rule.kind === "text") {
        if (node.parameters) node.parameters = replaceIn(node.parameters, rule.from, rule.to, c);
      }
    }
    counts.push(c.n);
  }
  return {
    body: { name: wf.name, nodes: nodes, connections: wf.connections || {}, settings: wf.settings || {} },
    counts: counts,
    changed: counts.reduce(function (a, b) { return a + b; }, 0),
  };
}

/* ------------------------------------------------------------ redaction */

/** A stored config made safe for a browser: secrets become { set, last4 }. */
function redactConfig(config) {
  var out = {};
  var c = config || {};
  for (var key in c) {
    if (!Object.prototype.hasOwnProperty.call(c, key)) continue;
    var section = c[key] || {};
    var safe = {};
    for (var f in section) {
      if (!Object.prototype.hasOwnProperty.call(section, f)) continue;
      var val = section[f];
      if (SECRET_FIELDS.indexOf(f) !== -1) {
        var s = String(val == null ? "" : val);
        safe[f] = s ? { set: true, last4: s.slice(-4) } : { set: false };
      } else {
        safe[f] = val;
      }
    }
    out[key] = safe;
  }
  return out;
}

export { CONNECTORS, SECRET_FIELDS, STAND_IN_SMTP, CRED_NAMES, connector, ukNumber, validateConnector, rulesFor, patchWorkflow, redactConfig };
