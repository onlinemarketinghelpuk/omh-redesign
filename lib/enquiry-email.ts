import { company } from "@/lib/content/nav";
import { whatsapp } from "@/lib/content/whatsapp";

/*
  The email every website form turns into. Branded, because these land in an
  inbox next to a hundred other notifications and should be recognisable at a
  glance — and because the subject line has to say which form and which page it
  came from, with 15 forms feeding one address.

  Table layout and inline styles throughout: email clients strip <style> blocks
  and ignore most modern CSS. ponytail: no MJML, no react-email — one template.
*/

const INK = "#000";
const MUTED = "#667085";
const LINE = "#d9ddd8";
const WARM = "#f7f6f2";
// Hex, not var(--…): email clients never see the site's CSS, so a variable renders as no colour. This is --accent.
const GOLD = "#7d5c33";
const GOLD_DEEP = GOLD;
const TAN = "#d2b48c"; // the light tan from globals.css, for accent text on black, where the brown is too dark to read
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const escape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const flatten = (value: string | string[]) => (Array.isArray(value) ? value.join(", ") : String(value));

export type EnquiryEmail = { subject: string; html: string; text: string };

export function renderEnquiryEmail({
  formName,
  page,
  entries,
  replyTo,
  receivedAt = new Date(),
}: {
  formName: string;
  page?: string;
  entries: [string, string | string[]][];
  replyTo?: string;
  receivedAt?: Date;
}): EnquiryEmail {
  const received = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(receivedAt);

  const source = page && page !== "/" ? page : "the homepage";

  const answers = entries
    .map(
      ([label, value]) => `<tr><td style="padding:0 0 16px">
        <div style="font:600 12px/1.4 ${FONT};color:${MUTED};letter-spacing:.02em">${escape(label)}</div>
        <div style="font:400 15px/1.55 ${FONT};color:${INK};margin-top:4px">${escape(flatten(value)).replace(
          /\n/g,
          "<br>",
        )}</div>
      </td></tr>`,
    )
    .join("");

  const replyRow = replyTo
    ? `<tr><td style="padding:0 28px 4px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${WARM};border:1px solid ${LINE};border-radius:8px">
          <tr><td style="padding:12px 16px;font:400 13px/1.5 ${FONT};color:${MUTED}">
            Reply to <a href="mailto:${escape(replyTo)}" style="color:${GOLD_DEEP};font-weight:600;text-decoration:underline">${escape(replyTo)}</a>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const html = `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(
    formName,
  )} — submitted from ${escape(source)} at ${escape(received)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${WARM};margin:0;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden">
      <tr><td style="background:${INK};padding:20px 28px">
        <div style="font:700 21px/1 ${FONT};color:#ffffff;letter-spacing:-.01em">OMH<span style="color:${GOLD}">.</span></div>
        <div style="font:600 10px/1.4 ${FONT};color:${GOLD};letter-spacing:.16em;text-transform:uppercase;margin-top:6px">${escape(
          company.name,
        )}</div>
      </td></tr>
      <tr><td style="padding:28px 28px 4px">
        <div style="font:700 11px/1.4 ${FONT};color:${GOLD_DEEP};letter-spacing:.14em;text-transform:uppercase">New enquiry</div>
        <h1 style="font:600 20px/1.35 ${FONT};color:${INK};margin:10px 0 0">${escape(formName)}</h1>
        <p style="font:400 13px/1.5 ${FONT};color:${MUTED};margin:10px 0 20px">Submitted from <span style="color:${INK}">${escape(
          source,
        )}</span> · ${escape(received)}</p>
      </td></tr>
      ${replyRow}
      <tr><td style="padding:20px 28px 8px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${answers}</table>
      </td></tr>
      <tr><td style="background:${WARM};border-top:1px solid ${LINE};padding:18px 28px">
        <div style="font:400 12px/1.6 ${FONT};color:${MUTED}">
          ${escape(company.name)} · ${escape(company.address)}<br>
          ${escape(company.phoneDisplay)} · ${escape(company.email)} · Company No. ${escape(company.companyNo)}
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>`;

  const text = [
    `New enquiry — ${formName}`,
    `Submitted from ${source} · ${received}`,
    replyTo ? `Reply to ${replyTo}` : "",
    "",
    ...entries.map(([label, value]) => `${label}\n${flatten(value)}\n`),
    "—",
    `${company.name} · ${company.phoneDisplay} · ${company.email}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  // Which form, and which page it came from — both in the subject, because one
  // inbox receives all 15 forms.
  const subject = `New enquiry — ${formName}${page ? ` (${page})` : ""}`.slice(0, 160);

  return { subject, html, text };
}

/* ── The visitor's copy ──────────────────────────────────────────────────────
  An acknowledgement to the person who filled the form in. Fixed wording on
  purpose: the only thing taken from the submission is a first name that has
  passed a letters-only check. Anyone can post any address to /api/enquiry, so
  echoing their message back would let a stranger mail spam from our domain. */

const SITE = "https://onlinemarketinghelp.co.uk";

/** A single, plain address, or nothing. Rejects commas and the like, which nodemailer would read as extra recipients. */
export function customerAddress(value?: string) {
  const v = value?.trim();
  return v && v.length <= 254 && /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[a-z]{2,}$/i.test(v) ? v : undefined;
}

/** "jane smith" → "Jane". Anything that isn't a plain name gives undefined, and the email says "Hello". */
export function firstName(entries: [string, string | string[]][]) {
  const value = entries.find(([label]) => /name/i.test(label) && !/company|business|organi[sz]ation|trading|web|domain|file/i.test(label))?.[1];
  const first = String(Array.isArray(value) ? value[0] ?? "" : value ?? "").trim().split(/\s+/)[0];
  return /^\p{L}[\p{L}'’-]{0,29}$/u.test(first) ? first[0].toUpperCase() + first.slice(1) : undefined;
}

/* ponytail: in-memory, fine for the single container on the VPS (resets on each deploy). One thank-you per
   address per day, and at most 30 an hour in total so a flood of fake submissions can't burn the SMTP send
   quota the team's own enquiry emails depend on. Move to a shared store if the site ever runs on several instances. */
const thanked = new Map<string, number>();
let hourStart = 0;
let sentThisHour = 0;
export function mayThank(address: string, now = Date.now()) {
  const key = address.toLowerCase();
  if (now - (thanked.get(key) ?? -Infinity) < 86_400_000) return false;
  if (now - hourStart >= 3_600_000) [hourStart, sentThisHour] = [now, 0];
  if (sentThisHour >= 30) return false;
  sentThisHour++;
  if (thanked.size > 5000) thanked.clear();
  thanked.set(key, now);
  return true;
}

/* Both thank-yous are a letter on the site's own letterhead: the black band with the white logo and a two-tone
   headline (white, then tan), the same move as the site's section headings, then plain paragraphs in the site's
   type (Instrument Sans headings, Source Sans text, system fallbacks where a client has neither). Card and button
   radii match the site (14px, 10px).

   Responsive the email way: the layout is a single fluid column that works everywhere, and the <style> block only
   tightens it on phones (full-width card, smaller padding and headline). Clients that drop <style> still get a
   readable single column. Text first, one small hosted logo and few links, so spam filters read it as a letter. */

const HEAD = "'Instrument Sans','Helvetica Neue',Helvetica,Arial,sans-serif";
const BODY = "'Source Sans 3','Source Sans Pro','Segoe UI',Helvetica,Arial,sans-serif";
const TEXT = "#1f1f1f";
const LOGO = `${SITE}/email/omh-logo-white.png`; // 360x92, shown at half size for sharp screens

const CSS = `body{margin:0;padding:0;background:${WARM};-webkit-text-size-adjust:100%}
a{color:${GOLD}}
@media (max-width:620px){
.canvas{padding:0!important}
.card{border-radius:0!important;border:0!important}
.band{padding:22px 22px 30px!important}
.h1{font-size:26px!important;margin-top:30px!important}
.main{padding:30px 22px 28px!important}
.foot{padding:20px 22px 28px!important}
.btn{width:100%!important}
.btn a{display:block!important;text-align:center!important}
}`;

const p = (html: string, extra = "") => `<p style="font:400 16px/1.6 ${BODY};color:${TEXT};margin:0 0 16px;${extra}">${html}</p>`;
const h2 = (text: string) => `<h2 style="font:600 18px/1.35 ${HEAD};color:${INK};margin:34px 0 12px">${text}</h2>`;
const link = (href: string, label: string) => `<a href="${href}" style="color:${GOLD};font-weight:600;text-decoration:underline">${label}</a>`;
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" class="btn" style="margin:22px 0 0"><tr><td style="background:${GOLD};border-radius:10px">
    <a href="${href}" style="display:inline-block;padding:15px 26px;font:600 16px/1 ${BODY};color:#ffffff;text-decoration:none;border-radius:10px">${label}</a>
  </td></tr></table>`;

function letter({ subject, preheader, label, greeting, headline, accent, body, reason }: {
  subject: string;
  preheader: string;
  label: string;
  greeting: string;
  headline: string;
  accent?: string;
  body: string;
  reason: string;
}) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${escape(subject)}</title>
<style>${CSS}</style>
</head>
<body style="margin:0;padding:0;background:${WARM}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="canvas" style="background:${WARM};padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="560" class="card" style="width:100%;max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden">
      <tr><td class="band" style="background:${INK};padding:28px 36px 38px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="vertical-align:middle"><img src="${LOGO}" width="150" height="38" alt="${escape(company.name)}" style="display:block;border:0;width:150px;height:38px;font:700 18px/38px ${HEAD};color:#ffffff"></td>
          <td align="right" style="vertical-align:middle;font:400 13px/1.4 ${BODY};color:${TAN}">${label}</td>
        </tr></table>
        <p style="font:400 16px/1.4 ${BODY};color:${TAN};margin:40px 0 8px">${greeting}</p>
        <h1 class="h1" style="font:600 30px/1.16 ${HEAD};color:#ffffff;letter-spacing:-.01em;margin:0">${headline}${
          accent ? `<br><span style="color:${TAN}">${accent}</span>` : ""
        }</h1>
      </td></tr>
      <tr><td class="main" style="padding:36px 36px 34px">${body}</td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="width:100%;max-width:560px">
      <tr><td class="foot" style="padding:22px 36px 0;font:400 12px/1.6 ${BODY};color:${MUTED};text-align:center">
        ${reason}<br>
        ${escape(company.name)}, ${escape(company.address)}. Company No. ${escape(company.companyNo)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const signature = (signOff: string, contact?: string) =>
  `<p style="font:400 16px/1.6 ${BODY};color:${TEXT};margin:30px 0 0;padding-top:24px;border-top:1px solid ${LINE}">${signOff}<br>
    <span style="font:600 16px/1.6 ${HEAD};color:${INK}">The ${escape(company.name)} team</span><br>
    <span style="font-size:15px;color:${MUTED}">${contact ? `${contact} &middot; ` : ""}${link(SITE, "onlinemarketinghelp.co.uk")}</span></p>`;

const reasonLine = (what: string) =>
  `You're receiving this because ${what} at onlinemarketinghelp.co.uk. If that wasn't you, you can ignore this email.`;

/** Every form except the car-wash one. A short letter: it's with us, a person will reply, here's how to reach us sooner. */
export function renderThankYouEmail({ name }: { name?: string }): EnquiryEmail {
  const subject = `Thanks for contacting ${company.name}`;
  const html = letter({
    subject,
    preheader: "Your enquiry has reached our team. Here's what happens now.",
    label: "Enquiry received",
    greeting: name ? `Hi ${escape(name)},` : "Hello,",
    headline: "Thanks for getting in touch.",
    body: [
      p("Your enquiry has reached our team. One of us will read it properly and come back to you with the clearest next step. You don't need to do anything else."),
      p(`If it's urgent, ring us on ${link(company.phoneHref, escape(company.phoneDisplay))}. And if you forgot to mention something, reply to this email and it will come straight to us.`, "margin:0"),
      signature("Kind regards,"),
    ].join("\n"),
    reason: reasonLine("you sent us an enquiry"),
  });

  const text = [
    name ? `Hi ${name},` : "Hello,",
    "",
    "Thanks for getting in touch.",
    "",
    "Your enquiry has reached our team. One of us will read it properly and come back to you with the clearest next step. You don't need to do anything else.",
    "",
    `If it's urgent, ring us on ${company.phoneDisplay}. And if you forgot to mention something, reply to this email and it will come straight to us.`,
    "",
    "Kind regards,",
    `The ${company.name} team`,
    SITE,
    "",
    reasonLine("you sent us an enquiry"),
    `${company.name}, ${company.address}. Company No. ${company.companyNo}`,
  ].join("\n");

  return { subject, html, text };
}

/* The car-wash QR code's version (/get-more-leads, form "Free growth review"). The route picks it by form name. */
export const CAR_WASH_FORM = "Free growth review";

const carSteps: [string, string][] = [
  ["Today", "We look at your business the way a customer would. We search for you on Google, find you on the map and click through to your website."],
  ["Within 2 working days", "Your audit arrives by email, in plain English, with every issue ranked and a fix for each."],
  ["After that", "If you'd like, we'll talk you through it on a 15-minute call. If you'd rather just read it, the report stands on its own."],
];
const carCovers =
  "We check your Google Ads, your Google Maps listing, your SEO and rankings, how fast your site is on a phone, whether your conversion tracking counts real enquiries, and whether ChatGPT and Google's AI answers mention you.";
const carCheck =
  "Search Google on your phone for your main service and your town, the way a customer would (something like “emergency electrician Basildon”). Are you in the top three on the map? Are competitors running ads above you? Based on what you see, would you pick you?";
const carAsk = [
  "the service that makes you the most money",
  "the towns or postcodes you cover",
  "roughly what you spend on ads each month, even if it's nothing",
  "the competitor you'd most like to overtake",
];

export function renderCarWashThankYou({ name }: { name?: string }): EnquiryEmail {
  const subject = "Your audit request is with us";

  // One column on every screen: the when sits above the what, so nothing squeezes on a phone.
  const steps = carSteps
    .map(
      ([when, what], i) => `<tr><td style="padding:14px 0;${i ? `border-top:1px solid ${LINE};` : ""}">
        <div style="font:600 14px/1.4 ${HEAD};color:${GOLD};margin:0 0 4px">${when}</div>
        <div style="font:400 16px/1.55 ${BODY};color:${TEXT}">${escape(what)}</div>
      </td></tr>`,
    )
    .join("");

  const ask = carAsk
    .map(
      (item, i) => `<tr><td style="width:24px;padding:0 0 8px;vertical-align:top;font:600 16px/1.55 ${HEAD};color:${GOLD}">${i + 1}.</td>
        <td style="padding:0 0 8px;font:400 16px/1.55 ${BODY};color:${TEXT}">${escape(item[0].toUpperCase() + item.slice(1))}</td></tr>`,
    )
    .join("");

  const html = letter({
    subject,
    preheader: "Your audit request is with us. Here's what happens next, and a quick check you can do on your phone.",
    label: "Free audit request",
    greeting: name ? `Hi ${escape(name)},` : "Hello,",
    headline: "Your car got cleaner.",
    accent: "Now your marketing does.",
    body: [
      p("Thanks for scanning the code and sending your details. Your audit request is with us, and one of our team will work on it personally. There's no obligation at the end of it.", "margin:0"),
      h2("What happens next"),
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:2px solid ${INK};border-bottom:1px solid ${LINE}">${steps}</table>`,
      p(escape(carCovers), `margin:16px 0 0;font-size:15px;color:${MUTED}`),
      h2("A quick check while you wait"),
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td style="background:${WARM};border-left:3px solid ${GOLD};border-radius:0 10px 10px 0;padding:18px 20px;font:400 16px/1.6 ${BODY};color:${TEXT}">
          ${escape(carCheck)}
          <div style="font-size:15px;color:${MUTED};margin-top:8px">If the answer to any of those is no, that's usually where your audit starts.</div>
        </td></tr></table>`,
      h2("Want a sharper audit?"),
      p("Reply to this email and tell us:", "margin:0 0 12px"),
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${ask}</table>`,
      p("It's optional. You'll get the full audit either way.", `margin:6px 0 0;font-size:15px;color:${MUTED}`),
      p("Rather talk it through? Message us on WhatsApp.", "margin:28px 0 0"),
      button(whatsapp.href, `Message us on WhatsApp`),
      signature("Speak soon,", `WhatsApp ${link(whatsapp.href, whatsapp.display)}`),
    ].join("\n"),
    reason: reasonLine("you asked for a free audit"),
  });

  const text = [
    name ? `Hi ${name},` : "Hello,",
    "",
    "Your car got cleaner. Now your marketing does.",
    "",
    "Thanks for scanning the code and sending your details. Your audit request is with us, and one of our team will work on it personally. There's no obligation at the end of it.",
    "",
    "What happens next",
    ...carSteps.map(([when, what]) => `${when}: ${what}`),
    "",
    carCovers,
    "",
    "A quick check while you wait",
    carCheck,
    "If the answer to any of those is no, that's usually where your audit starts.",
    "",
    "Want a sharper audit?",
    "Reply to this email and tell us:",
    ...carAsk.map((item, i) => `${i + 1}. ${item}`),
    "It's optional. You'll get the full audit either way.",
    "",
    `Rather talk it through? Message us on WhatsApp on ${whatsapp.display}.`,
    "",
    "Speak soon,",
    `The ${company.name} team`,
    `WhatsApp ${whatsapp.display} · ${SITE}`,
    "",
    reasonLine("you asked for a free audit"),
    `${company.name}, ${company.address}. Company No. ${company.companyNo}`,
  ].join("\n");

  return { subject, html, text };
}
