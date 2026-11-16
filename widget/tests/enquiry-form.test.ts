import { enquiryToLead, readFields, readAttribution } from "../gates/enquiry-form.js";

/* =========================================================================
   The website's own forms, and whether they reach the system at all.

   Found by testing the product as a visitor rather than by reading it. Six
   forms on the marketing site post to /api/enquiry; that route emailed the
   team and stopped. No lead row, no attribution, no route, no follow-up.

   Route B is named "Website form, or a Google Ads landing page" and promises
   a text and an email inside two minutes and a call at fifteen. It was
   built, it was tested, and nothing fed it. The client would have found out
   by filling in their own form.

   The hard part is not the plumbing, it is the reading: six forms written at
   different times post arbitrary label/value pairs, so "Company name" must
   become the company and not the name, and an email field containing "n/a"
   must become no email at all rather than a key that later merges two
   strangers into one person.
   ========================================================================= */

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  if (good) { pass++; console.log("  ok   " + label); }
  else {
    fail++;
    console.log("  FAIL " + label +
      "\n         got  " + JSON.stringify(got) +
      "\n         want " + JSON.stringify(want));
  }
}
function ok(label: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail ? "\n         " + detail : "")); }
}

const OPTS = { now: 1_700_000_000_000, nonce: "abc123" };

/* ------------------------------------------------- reading the labels */

console.log("\n== a label is read, not guessed ==");
{
  const f = readFields({
    "Your name": "Daniel Okafor",
    "Company name": "Okafor Plumbing",
    "Email address": "daniel@okaforplumbing.co.uk",
    "Phone number": "07700 900123",
    "What service are you interested in?": "Google Ads management",
    "Tell us about your project": "Emergency plumbing, Leeds, want calls not clicks.",
  });
  eq("the person's name", f.name, "Daniel Okafor");
  /* The one that goes wrong. "Company name" matches /name/i, so a looser
     rule order gives the company as the person's name and the client rings
     up asking for Mr Plumbing. */
  eq("the company, which also contains the word name", f.company, "Okafor Plumbing");
  eq("the email", f.email, "daniel@okaforplumbing.co.uk");
  eq("the phone", f.phone, "07700 900123");
  eq("the service", f.service, "Google Ads management");
  ok("the message", String(f.message).startsWith("Emergency plumbing"));
}

console.log("\n== a field that says nothing is not a field ==");
{
  const f = readFields({
    "Name": "Sarah Whitfield",
    "Email": "n/a",
    "Phone": "prefer email",
    "Message": "   ",
  });
  /* "n/a" in an email column is worse than an empty one: `emailKey` would
     take it, and the next person who also typed "n/a" merges onto her
     record and is shown her conversation. */
  eq("an email with no @ is not an email", f.email, undefined);
  eq("a phone with no digits is not a phone", f.phone, undefined);
  eq("whitespace is nothing", f.message, undefined);
  eq("and the name still came through", f.name, "Sarah Whitfield");
}

console.log("\n== every form on the site, not just the tidy one ==");
{
  /* Labels taken from the real forms: ContactForm, GrowthReviewForm, the
     quote questionnaires and the voice-agents script. */
  const shapes: [string, Record<string, string>, string][] = [
    ["contact", { "Full name": "Tom Pike", "Email": "tom@pike.co", "How can we help?": "SEO" }, "Tom Pike"],
    ["growth review", { "Name": "Priya Raman", "Work email": "priya@r.co", "Business": "Raman Dental" }, "Priya Raman"],
    ["quote", { "Contact name": "Greg Mullen", "Contact number": "07700 900456", "Your website": "mullen.co.uk" }, "Greg Mullen"],
    ["voice agents", { "First name": "Ayesha", "Email address": "a@b.co", "Monthly budget": "£2,000" }, "Ayesha"],
  ];
  for (const [which, fields, name] of shapes) {
    const f = readFields(fields);
    eq(`${which}: the name`, f.name, name);
  }
  /* The live /contact form, field for field, taken off the rendered page
     rather than from memory. Driving a real submission through the browser
     is what found these: the goal textarea and the service select matched
     nothing, so the most valuable answer on the form arrived empty and the
     service fell back to the form's own name. Written down here so a label
     nobody thought of cannot quietly cost the same thing twice. */
  const live = readFields({
    "Full name": "Nadia Hargreaves",
    "Work email": "nadia@hargreavesroofing.example",
    "Phone": "07700 900321",
    "Company": "Hargreaves Roofing",
    "Website URL": "hargreavesroofing.example",
    "What do you need?": "Google Ads",
    "Rough budget": "£1,000 to £3,000",
    "When do you want to start?": "As soon as possible",
    "What's the goal or problem?": "We want more emergency roofing calls in Leeds, not clicks.",
  });
  eq("the live contact form: name", live.name, "Nadia Hargreaves");
  eq("the live contact form: email", live.email, "nadia@hargreavesroofing.example");
  eq("the live contact form: phone", live.phone, "07700 900321");
  eq("the live contact form: company", live.company, "Hargreaves Roofing");
  eq("'What do you need?' is the service", live.service, "Google Ads");
  ok("'What's the goal or problem?' is the message",
     String(live.message).startsWith("We want more emergency roofing"), String(live.message));
  eq("and the website is not mistaken for the email", live.email.includes("@"), true);

  eq("a work email is an email", readFields({ "Work email": "priya@r.co" }).email, "priya@r.co");
  eq("a contact number is a phone", readFields({ "Contact number": "07700 900456" }).phone, "07700 900456");
  eq("a website is not an email", readFields({ "Your website": "mullen.co.uk" }).email, undefined);
}

/* ------------------------------------------------------- attribution */

console.log("\n== the advert that produced them survives the form ==");
{
  const a = readAttribution(
    "https://onlinemarketinghelp.co.uk/google-adwords-ppc?gclid=Cj0KCQ&utm_source=google&utm_campaign=Emergency+plumber",
    undefined,
  );
  eq("the click id", a.gclid, "Cj0KCQ");
  eq("the source", a.source, "google");
  eq("the campaign, with its plus signs turned back into spaces",
     a.campaign, "Emergency plumber");
  ok("and the page they were on", String(a.landingPage).includes("/google-adwords-ppc"));

  eq("a page with no campaign on it carries no invented one",
     readAttribution("https://onlinemarketinghelp.co.uk/contact", undefined).gclid, undefined);
  eq("and nothing at all is undefined, not an empty object",
     readAttribution("", undefined), undefined);

  /* A broken escape is a reason to lose a query value, never the lead. */
  const broken = readAttribution("https://x.co/?gclid=%E0%A4%A&utm_source=google", undefined);
  eq("a malformed escape does not throw", broken.source, "google");
}

/* ------------------------------------------------------- the whole thing */

console.log("\n== a real submission becomes a routable lead ==");
{
  const r: any = enquiryToLead({
    form: "Google Ads quote request",
    page: "https://onlinemarketinghelp.co.uk/ppc-request-quote?gclid=abc123",
    fields: {
      "Your name": "Daniel Okafor",
      "Company name": "Okafor Plumbing",
      "Email address": "daniel@okaforplumbing.co.uk",
      "Phone number": "07700 900123",
      "Tell us about your project": "Want calls, not clicks.",
    },
  }, OPTS);

  eq("it is accepted", r.ok, true);
  eq("the channel is the website form, which is what picks route B",
     r.lead.sourceChannel, "website_form");
  eq("the person", [r.lead.name, r.lead.company], ["Daniel Okafor", "Okafor Plumbing"]);
  eq("both ways to reach them", [r.lead.email, r.lead.phone],
     ["daniel@okaforplumbing.co.uk", "07700 900123"]);
  /* The form's own name is context the team reads before ringing back. */
  ok("the message names the form it came from",
     r.lead.message.startsWith("Google Ads quote request:"), r.lead.message);
  eq("the advert came with it", r.lead.attribution.gclid, "abc123");
  ok("it has a session of its own, so it can be merged later",
     /^form-/.test(r.lead.sessionId), r.lead.sessionId);
}

console.log("\n== what must never be enrolled ==");
{
  /* The honeypot. A bot that fills a hidden field must not be able to make
     this system text a stranger. These are still stored and emailed by the
     route; they are simply not put on a sequence. */
  const spam: any = enquiryToLead({ hp: "x", form: "Contact", fields: { Email: "a@b.co" } }, OPTS);
  eq("a honeypot submission is refused", [spam.ok, spam.why], [false, "spam"]);

  /* Nowhere to send. Route B's first move is a text and an email; with
     neither, enrolling puts a row on the sequence board that can never
     progress and reads as a fault. */
  const noReply: any = enquiryToLead({
    form: "Contact", fields: { "Your name": "Anonymous", "Message": "call me" },
  }, OPTS);
  eq("a submission with no email and no phone is refused",
     [noReply.ok, noReply.why], [false, "no_way_to_reply"]);

  /* One of the two is enough. */
  ok("a phone alone is enough",
     enquiryToLead({ fields: { Name: "A", Phone: "07700 900123" } }, OPTS).ok === true);
  ok("an email alone is enough",
     enquiryToLead({ fields: { Name: "A", Email: "a@b.co" } }, OPTS).ok === true);
}

console.log("\n== a nameless submission is still a lead ==");
{
  /* A form with no name field at all is still somebody who asked to be
     contacted. Dropping it would be the same bug this whole file exists to
     fix, one level down. */
  const r: any = enquiryToLead({ fields: { Email: "a@b.co", Message: "Call me" } }, OPTS);
  eq("accepted", r.ok, true);
  eq("and labelled honestly rather than left blank", r.lead.name, "Unknown");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
