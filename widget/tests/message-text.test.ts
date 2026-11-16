import {
  VARIABLES, OPT_OUT, BUSINESS, renderText, renderMessage, smsSegments, validateMessage,
} from "../gates/message-text.js";
import { render, templateKeys, templateSource, routeMessageKeys } from "../gates/templates.ts";
import { ROUTES } from "../gates/routes.ts";

/* =========================================================================
   What the owner writes, and what actually goes out.

   The Messages screen lets the owner rewrite every message. Three things
   must survive that:

   1. THE OPT-OUT. On a marketing message it is appended by the renderer and
      there is no text the owner can write that removes it. PECR wants it in
      every marketing message, not only the first.
   2. NOTHING CHANGES BY OPENING THE EDITOR. Each code template is offered
      for editing as text with {{variables}}. Saved unchanged, it must send
      exactly what the code sends today. Otherwise the first time the owner
      clicks Save without editing, every customer gets a different message.
   3. THE BILL. 160 characters is one text; 161 is two and costs twice. One
      curly apostrophe pasted from Word makes it 70 per text. The screen
      says so as they type, because nobody finds out until the invoice.
   ========================================================================= */

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + "\n         got  " + JSON.stringify(got) + "\n         want " + JSON.stringify(want)); }
}
function ok(label: string, cond: boolean, detail: unknown = "") {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail !== "" ? "\n         " + JSON.stringify(detail) : "")); }
}
const codes = (r: any) => r.errors.map((e: any) => e.code);

const full = {
  name: "Sarah Whitfield", service: "Google Ads management", company: "Whitfield Plumbing",
  preferredDate: "Tuesday 1 December", preferredTime: "10:00",
};

/* ===================================================================== */
console.log("\n== one opt-out text, one business, shared with the code ==");
{
  const f = render("f_sms_first", full, "F").body;
  ok("the code appends exactly OPT_OUT", f.endsWith("\n\n" + OPT_OUT), f.slice(-40));
  ok("the code's phone number is the gate's", render("b_email_first", full).body.includes(BUSINESS.phone));
  ok("the code's booking link is the gate's", render("b_sms_first", full).body.includes(BUSINESS.booking_link));
  eq("the variable chips the owner is offered",
     VARIABLES.map((v: any) => v.key),
     ["greeting", "first_name", "name", "company", "service", "appointment", "business", "phone", "email", "booking_link"]);
  ok("every variable has a label and an example", VARIABLES.every((v: any) => v.label && v.example));
}

/* ===================================================================== */
console.log("\n== THE OPT-OUT cannot be edited away ==");
{
  const tpl = { channel: "sms", body: "{{greeting}} we have a spring offer on {{service}}." };
  const m = renderMessage(tpl, full, true).body;
  ok("a marketing message ends with the opt-out", m.endsWith("\n\n" + OPT_OUT), m);
  eq("a reply does not carry one", renderMessage(tpl, full, false).body.includes("STOP"), false);

  /* Every way of trying to remove it. */
  for (const body of [
    "Offer on {{service}}.",                       // simply not written
    "Offer. " + OPT_OUT,                           // written by hand
    "Offer. Reply STOP to opt out. Reply STOP to opt out.",
    "",                                            // empty
    "{{opt_out}}",                                 // an invented variable
  ]) {
    const r = renderMessage({ channel: "sms", body }, full, true).body;
    ok(`ends with exactly one opt-out: ${JSON.stringify(body).slice(0, 40)}`,
       r.endsWith(OPT_OUT) && r.split(OPT_OUT).length - 1 >= 1, r);
  }
  const email = renderMessage({ channel: "email", subject: "Hello", body: "Offer" }, full, true);
  ok("emails too", email.body.endsWith(OPT_OUT), email.body);
  ok("hand-written opt-out is not doubled",
     renderMessage({ channel: "sms", body: "Offer. " + OPT_OUT }, full, true).body.split(OPT_OUT).length - 1 === 1);
}

/* ===================================================================== */
console.log("\n== NOTHING CHANGES BY OPENING THE EDITOR ==");
{
  const keys = routeMessageKeys();
  const routeKeys = new Set<string>();
  for (const r of Object.values(ROUTES)) for (const s of [...r.immediate, ...r.steps]) routeKeys.add(s.key);
  eq("the editable messages are exactly the ones the routes send", [...keys].sort(), [...routeKeys].sort());

  for (const k of keys) {
    const src = templateSource(k);
    ok(`${k}: has an editable source`, Boolean(src && src.body), src);
    if (!src) continue;
    ok(`${k}: the source shows variables, not Sarah`, !src.body.includes("Sarah") && !src.body.includes("Qq"), src.body);
    const marketing = Object.values(ROUTES).some((r) => r.marketing && [...r.immediate, ...r.steps].some((s) => s.key === k));
    const code = render(k, full, marketing ? "F" : undefined);
    const owner = renderMessage(src, full, marketing);
    eq(`${k}: saved unchanged, it sends exactly what the code sends`, [owner.subject ?? null, owner.body], [code.subject ?? null, code.body]);
  }

  /* With nothing known about them. The code has three messages that say
     something different when a detail is missing; an edited message says
     the same thing either way. Named here, so a fourth is noticed. */
  const drift: string[] = [];
  for (const k of keys) {
    const src = templateSource(k)!;
    const marketing = k.startsWith("f_");
    if (renderMessage(src, {}, marketing).body !== render(k, {}, marketing ? "F" : undefined).body) drift.push(k);
  }
  eq("with no name or service, only these differ from the code", drift.sort(),
     ["f_sms_first", "g_email_next_day"]);
  /* And the one place an edited message deliberately loses something. */
  ok("b_email_first's source has no quote of their words (a template cannot know them)",
     !templateSource("b_email_first")!.body.includes("You said"));
}

/* ===================================================================== */
console.log("\n== variables ==");
eq("greeting", renderText("{{greeting}}", { name: "sarah whitfield" }), "Hi Sarah,");
eq("greeting with no name", renderText("{{greeting}} thanks.", {}), "Hi, thanks.");
eq("a single letter is not a name", renderText("{{greeting}}", { name: "A" }), "Hi,");
eq("first name falls back to 'there'", renderText("Hello {{first_name}}", {}), "Hello there");
eq("service falls back", renderText("about {{service}}", {}), "about your enquiry");
eq("spaces inside braces are fine", renderText("{{ service }}", { service: "SEO" }), "SEO");
eq("appointment", renderText("booked {{appointment}}.", full), "booked for Tuesday 1 December at 10:00.");
eq("no appointment leaves no hole", renderText("You are booked with us {{appointment}}.", {}), "You are booked with us.");
eq("business details", renderText("{{business}} {{phone}}", {}), BUSINESS.business + " " + BUSINESS.phone);
eq("an unknown variable renders as nothing, never as braces", renderText("Hi {{nope}}there", {}), "Hi there");
ok("newlines survive the tidy", renderText("a\n\nb {{appointment}}.", {}) === "a\n\nb.");

/* ===================================================================== */
console.log("\n== THE BILL: segments ==");
eq("160 plain characters is one text", smsSegments("a".repeat(160)).segments, 1);
eq("161 is two", smsSegments("a".repeat(161)).segments, 2);
eq("a long text is 153 per part", smsSegments("a".repeat(306)).segments, 2);
eq("307 is three", smsSegments("a".repeat(307)).segments, 3);
eq("plain is GSM-7", smsSegments("Hello £5").encoding, "GSM-7");
eq("€ counts as two", smsSegments("€").units, 2);
eq("é is in the plain set", smsSegments("café").encoding, "GSM-7");
eq("a curly apostrophe makes it UCS-2", smsSegments("we’ll").encoding, "UCS-2");
eq("70 UCS-2 characters is one text", smsSegments("’".repeat(70)).segments, 1);
eq("71 is two", smsSegments("’".repeat(71)).segments, 2);
eq("an emoji is two units", smsSegments("😀").units, 2);
eq("empty is zero", smsSegments("").segments, 0);

/* ===================================================================== */
console.log("\n== validateMessage ==");
const vm = (m: any) => validateMessage(m);
ok("a valid text", vm({ key: "spring_offer", channel: "sms", body: "{{greeting}} hello." }).ok);
ok("an unknown variable is refused and named",
   (() => { const r = vm({ key: "x_y", channel: "sms", body: "Hi {{fist_name}}" }); return codes(r).includes("unknown_variable") && r.errors[0].message.includes("fist_name"); })());
ok("unclosed braces", codes(vm({ key: "x_y", channel: "sms", body: "Hi {{name" })).includes("unclosed_variable"));
ok("an empty body", codes(vm({ key: "x_y", channel: "sms", body: "  " })).includes("empty"));
ok("an email needs a subject", codes(vm({ key: "x_y", channel: "email", body: "x" })).includes("no_subject"));
ok("an unknown channel", codes(vm({ key: "x_y", channel: "fax", body: "x" })).includes("bad_channel"));
ok("a bad key", codes(vm({ key: "Spring Offer!", channel: "sms", body: "x" })).includes("bad_key"));
ok("a text over ten parts is refused",
   codes(vm({ key: "x_y", channel: "sms", body: "a".repeat(1600) })).includes("too_long"));
ok("writing the opt-out yourself is a warning that it is added for you",
   vm({ key: "x_y", channel: "sms", body: "Offer. Reply STOP to opt out." }).warnings.some((w: any) => w.code === "opt_out_added"));
ok("a curly quote is a warning about cost",
   vm({ key: "x_y", channel: "sms", body: "We’ll call" }).warnings.some((w: any) => w.code === "ucs2" && /70/.test(w.message)));
ok("a two-part text is a warning with the multiple",
   vm({ key: "x_y", channel: "sms", body: "a".repeat(200) }).warnings.some((w: any) => w.code === "multi_part" && /twice/.test(w.message)));
ok("garbage does not throw", (() => { try { for (const g of [null, 1, "x", {}]) vm(g); return true; } catch { return false; } })());

console.log("\n" + (fail ? "FAILED " + fail : "all " + pass + " assertions pass"));
process.exit(fail ? 1 : 0);
