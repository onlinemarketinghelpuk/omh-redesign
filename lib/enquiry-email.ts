import { company } from "@/lib/content/nav";

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

export function renderThankYouEmail({ name }: { name?: string }): EnquiryEmail {
  const hello = name ? `Thank you, ${escape(name)}.` : "Thank you for getting in touch.";
  const steps = ["We read your enquiry in full", "We look at where your marketing is today", "We come back to you with the clearest next step"];

  const stepRows = steps
    .map(
      (step, i) => `<tr><td style="padding:0 0 12px;vertical-align:top;width:40px">
          <div style="width:28px;height:28px;border:1px solid ${LINE};border-radius:14px;text-align:center;font:600 13px/28px ${FONT};color:${GOLD}">${i + 1}</div>
        </td><td style="padding:4px 0 12px;font:400 15px/1.5 ${FONT};color:${INK}">${step}</td></tr>`,
    )
    .join("");

  const html = `<div style="display:none;max-height:0;overflow:hidden;opacity:0">We've received your enquiry. Here's what happens next.</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${WARM};margin:0;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden">
      <tr><td style="background:${INK};padding:20px 28px">
        <div style="font:700 21px/1 ${FONT};color:#ffffff;letter-spacing:-.01em">OMH<span style="color:${GOLD}">.</span></div>
        <div style="font:600 10px/1.4 ${FONT};color:#ffffff;opacity:.7;letter-spacing:.16em;text-transform:uppercase;margin-top:6px">${escape(company.name)}</div>
      </td></tr>
      <tr><td style="padding:32px 28px 8px">
        <div style="font:700 11px/1.4 ${FONT};color:${GOLD};letter-spacing:.14em;text-transform:uppercase">Enquiry received</div>
        <h1 style="font:600 22px/1.35 ${FONT};color:${INK};margin:10px 0 0">${hello}</h1>
        <p style="font:400 15px/1.6 ${FONT};color:${INK};margin:14px 0 0">We've received your enquiry and it's now with our team. A real person will read it and get back to you personally. There's nothing more you need to do.</p>
      </td></tr>
      <tr><td style="padding:24px 28px 4px">
        <div style="font:600 12px/1.4 ${FONT};color:${MUTED};letter-spacing:.12em;text-transform:uppercase;margin:0 0 14px">What happens next</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${stepRows}</table>
      </td></tr>
      <tr><td style="padding:8px 28px 4px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${WARM};border:1px solid ${LINE};border-radius:8px">
          <tr><td style="padding:16px 18px;font:400 14px/1.6 ${FONT};color:${INK}">
            <strong>Need to talk sooner?</strong> Call us on <a href="${company.phoneHref}" style="color:${GOLD};font-weight:600;text-decoration:underline">${escape(company.phoneDisplay)}</a>, or reply to this email to add anything we should know.
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 28px 28px;font:400 15px/1.6 ${FONT};color:${INK}">
        Kind regards,<br><strong>The ${escape(company.name)} team</strong><br>
        <a href="${SITE}" style="color:${GOLD};text-decoration:underline">onlinemarketinghelp.co.uk</a>
      </td></tr>
      <tr><td style="background:${WARM};border-top:1px solid ${LINE};padding:18px 28px">
        <div style="font:400 12px/1.6 ${FONT};color:${MUTED}">
          You're receiving this because this address was entered on a form at onlinemarketinghelp.co.uk. If that wasn't you, please ignore this email.<br><br>
          ${escape(company.name)} · ${escape(company.address)}<br>
          ${escape(company.phoneDisplay)} · ${escape(company.email)} · Company No. ${escape(company.companyNo)}
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>`;

  const text = [
    name ? `Thank you, ${name}.` : "Thank you for getting in touch.",
    "",
    "We've received your enquiry and it's now with our team. A real person will read it and get back to you personally. There's nothing more you need to do.",
    "",
    "What happens next",
    ...steps.map((step, i) => `${i + 1}. ${step}`),
    "",
    `Need to talk sooner? Call us on ${company.phoneDisplay}, or reply to this email to add anything we should know.`,
    "",
    "Kind regards,",
    `The ${company.name} team`,
    SITE,
    "",
    "—",
    "You're receiving this because this address was entered on a form at onlinemarketinghelp.co.uk. If that wasn't you, please ignore this email.",
    `${company.name} · ${company.address} · Company No. ${company.companyNo}`,
  ].join("\n");

  return { subject: `Thanks for contacting ${company.name}`, html, text };
}
