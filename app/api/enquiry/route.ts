import { NextResponse } from "next/server";

/*
  The single destination for every form on the site — contact, the five solution
  pages, the six quote forms and the three questionnaires.

  Field-agnostic on purpose: forms here range from 3 fields to 34, and the
  questionnaires' labels are verbatim legacy copy. Rather than model each one, the
  client posts whatever the form contains and this lays it out in the email. A new
  form needs no change here.

  Every submission is stored as an `enquiry` document first (the Studio's "Form
  submissions" list is the dashboard), then emailed over SMTP. Set on the server
  (/opt/omh/.env):
    SANITY_API_WRITE_TOKEN — an Editor token from sanity.io/manage
    SANITY_ENQUIRY_DATASET — defaults to "enquiries" (private; must exist)
    SMTP_HOST        — defaults to smtp.hostinger.com
    SMTP_PORT        — defaults to 465 (implicit TLS); use 587 for STARTTLS
    SMTP_USER        — the full mailbox address
    SMTP_PASS        — that mailbox's password
    ENQUIRY_TO       — defaults to support@onlinemarketinghelp.co.uk
    ENQUIRY_FROM     — defaults to the mailbox in SMTP_USER

  nodejs runtime is required: the edge runtime cannot open an SMTP socket.
*/

import { createClient } from "next-sanity";
import { clean, cleanFields, guard, readJson } from "@/lib/api-guard";
import { customerAddress, firstName, mayThank, renderEnquiryEmail, renderThankYouEmail } from "@/lib/enquiry-email";
import nodemailer from "nodemailer";
/* The same file the tests assert, so the mapping that decides which label
   is the person and which is the company cannot drift from what is proven. */
import { enquiryToLead } from "@/widget/gates/enquiry-form.js";

export const runtime = "nodejs";

// `||`, not `??`: an unset variable in a .env file arrives as an empty string,
// and `?? ` would keep that — sending from nobody, to nobody.
const TO = process.env.ENQUIRY_TO || "support@onlinemarketinghelp.co.uk";
const FROM = process.env.ENQUIRY_FROM || undefined;

type Payload = { form?: string; page?: string; fields?: Record<string, string | string[]>; hp?: string };

export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const raw = await readJson(request);
  if (raw instanceof NextResponse) return raw;
  const body: Payload = {
    form: raw.form ? clean(raw.form, 120) : undefined,
    page: raw.page ? clean(raw.page, 2000) : undefined, // the query string carries gclid and utm_ values
    fields: cleanFields(raw.fields),
    hp: raw.hp ? "1" : undefined,
  };

  // Honeypot: a field no human sees, filled by bots. It is a flag, never a
  // bin — browser autofill kept filling it and real enquiries vanished twice.
  // Flagged submissions are still stored, just not emailed, so a false positive
  // costs a look in the Studio rather than a lost lead.
  const suspectedSpam = Boolean(body.hp);
  if (suspectedSpam) console.warn("Honeypot filled — stored as spam, not emailed:", body.form);

  const fields = body.fields ?? {};
  const entries = Object.entries(fields).filter(([, v]) => (Array.isArray(v) ? v.length : String(v).trim()));
  if (!entries.length) {
    return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  }

  const formName = body.form?.slice(0, 120) ?? "Website form";

  const reply = entries.find(([label]) => /e-?mail/i.test(label))?.[1];
  const email = typeof reply === "string" ? customerAddress(reply) : undefined;

  // Stored before it is emailed, so an SMTP outage cannot lose a lead and the
  // Studio doubles as the submissions dashboard. Without a token (local dev)
  // this is skipped. ponytail: no database, no third-party form service.
  let stored = false;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (token) {
    try {
      await createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
        // A separate, private dataset: `production` is public so the site can
        // read the blog with no token, which would make every lead readable too.
        dataset: process.env.SANITY_ENQUIRY_DATASET ?? "enquiries",
        apiVersion: "2024-10-01",
        token,
        useCdn: false,
      }).create({
        _type: "enquiry",
        spam: suspectedSpam,
        form: formName,
        page: body.page ?? "",
        submittedAt: new Date().toISOString(),
        email,
        fields: entries.map(([label, value]) => ({
          _type: "field",
          _key: label.replace(/\W+/g, "-").slice(0, 40) || "field",
          label,
          value: Array.isArray(value) ? value.join(", ") : String(value),
        })),
      });
      stored = true;
    } catch (error) {
      console.error("Could not store the enquiry in Sanity:", error);
    }
  }

  if (suspectedSpam) return NextResponse.json({ ok: true });

  /* Before the email, not after it.
   *
   * It was written after, which read as the careful order: email the team
   * first, then do the clever thing. But this route RETURNS EARLY when SMTP
   * is not configured or rejects, so on a mail outage the enquiry would have
   * been lost to the system as well as to the inbox: no lead row, no route,
   * no follow-up, and nobody aware that any of it had happened.
   *
   * The lead is the thing that matters most, so it goes first, and it cannot
   * throw. */
  await handOverToTheRouter(body, formName);

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.error("SMTP_USER/SMTP_PASS are not set — enquiry not emailed:", formName);
    // Stored is an honest yes to the visitor; nothing stored is a real failure.
    return stored
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Email is not configured." }, { status: 503 });
  }

  // ponytail: a fresh connection per request. Serverless invocations are not
  // reused predictably, so a pooled transport would mostly go to waste.
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const { subject, html, text } = renderEnquiryEmail({
    formName,
    page: body.page,
    entries,
    replyTo: email,
  });

  try {
    await transport.sendMail({
      from: FROM ?? user,
      to: TO,
      subject,
      html,
      text,
      ...(email ? { replyTo: email } : {}),
    });
  } catch (error) {
    // Hostinger rejects on a bad password, an unauthorised From, or the hourly
    // send cap. The message says which, so log it rather than a bare status.
    console.error("SMTP rejected the enquiry:", error);
    if (!stored) return NextResponse.json({ error: "Could not send." }, { status: 502 });
  }

  console.log("Enquiry emailed:", formName, "->", TO);

  // The visitor's thank-you. Replies go to the team inbox, not the sending mailbox. A failure here is logged
  // and never shown to the visitor: the team already has the enquiry.
  if (email && mayThank(email)) {
    try {
      await transport.sendMail({ from: FROM ?? user, to: email, replyTo: TO, ...renderThankYouEmail({ name: firstName(entries) }) });
    } catch (error) {
      console.error("Thank-you email not sent:", error);
    }
  }

  return NextResponse.json({ ok: true });
}

/* The step this route did not have, and the largest hole in the product.
 *
 * Six forms on this site post here. Until now the whole of what happened to
 * a submission was: an email to the team. No lead row, so nothing on the
 * Leads screen; no attribution, so the advert that produced them was lost at
 * the moment they converted; and no route, so the follow-up never started.
 *
 * Route B is named "Website form, or a Google Ads landing page" and promises
 * a text and an email inside two minutes and a call at fifteen. It was
 * built, it was tested, and nothing fed it. The client would have found that
 * out by filling in their own form.
 *
 * Two rules this obeys:
 *
 * 1. **It cannot fail the visitor's submission.** By the time this runs the
 *    enquiry is stored and emailed, so the team has it. If the router is
 *    down, the right outcome is a lead that is followed up by hand, not a
 *    form that told somebody their message did not send.
 *
 * 2. **It is off until it is configured.** With no URL set, nothing is
 *    attempted and nothing is logged as broken. That keeps local development
 *    and any deployment without the automation exactly as they are today.
 */
async function handOverToTheRouter(body: Payload, formName: string) {
  const url = process.env.OHM_LEAD_ROUTER_URL;
  if (!url) return;

  const shaped = enquiryToLead(body as Record<string, unknown>, {});
  if (!shaped.ok) {
    /* Spam, or nothing to reply to. Both are deliberate refusals rather than
       errors: the team still has the email either way. */
    console.log("Enquiry not routed:", formName, "-", shaped.why);
    return;
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(shaped.lead),
      /* A form submission is a person waiting on a spinner. The router does
         its sending in the background, so this only needs to get the row in;
         it is not worth holding the page for. */
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error("Lead router refused the enquiry:", formName, r.status, (await r.text()).slice(0, 200));
      return;
    }
    console.log("Enquiry routed:", formName, "->", shaped.lead.sourceChannel);
  } catch (error) {
    /* Logged, not thrown. The enquiry is already stored and emailed. */
    console.error("Lead router unreachable, enquiry emailed only:", formName, error);
  }
}
