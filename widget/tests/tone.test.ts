import { toneIssues, NEVER_USE, AVOID_PHRASES } from "../gates/tone.js";
import { render, templateKeys, templateSource, routeMessageKeys } from "../gates/templates.ts";
import { validateMessage } from "../gates/message-text.js";
import { readFileSync } from "node:fs";

/* =========================================================================
   The OMH voice, the half of it that is a rule rather than a judgement.

   docs/tone-of-voice.md is Melissa's staff guide. Half of it can be decided
   by a machine and half cannot, and this suite holds only the first half:

     em dashes, the never-use words, the say-this-not-that phrases, US date
     order, prices not written "£450 + VAT", exclamation marks, and American
     spellings.

   The other half ("straight talk, said kindly", matching the client's
   formality, leading with "the short version") is prompt text in
   retell/prompt-core.md, and is deliberately NOT tested here. A regex that
   thinks it can detect kindness fails on good copy and passes on bad, and a
   suite that cries wolf gets deleted, taking the decidable rules with it.

   Section 3 runs every template in templates.ts through the same function,
   one assertion per template, so a new message cannot be added in the wrong
   voice.
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
const codes = (t: string) => toneIssues(t).map((i: any) => i.code);
const has = (t: string, code: string) => codes(t).includes(code);

/* ===================================================================== */
console.log("\n== 1. each rule fires on what the guide forbids ==");
{
  ok("an em dash", has("We fixed it \u2014 it is live now.", "em_dash"));
  ok("a spaced en dash used as a dash", has("We fixed it \u2013 it is live now.", "em_dash"));
  ok("a double hyphen used as a dash", has("We fixed it -- it is live now.", "em_dash"));

  for (const w of ["leverage", "synergy", "unlock", "elevate", "seamless", "robust", "holistic",
                   "empower", "delve", "game-changing", "cutting-edge", "materially", "outsized", "underpins"]) {
    ok(`never-use: "${w}"`, has(`This will ${w} your results.`, "never_use"));
  }
  ok("never-use: an inflected form (leveraging)", has("We are leveraging your data.", "never_use"));
  ok("never-use: an inflected form (unlocked)", has("That unlocked growth.", "never_use"));
  ok("never-use: capitalised at the start", has("Seamless onboarding for you.", "never_use"));
  ok("never-use: \"not just X but Y\"", has("It is not just ads but a whole strategy.", "never_use"));
  ok("never-use: \"not only X but also Y\"", has("It is not only faster but also cheaper.", "never_use"));

  for (const p of ["just circling back", "touching base", "your request has been actioned",
                   "Hope this helps", "moving forward", "at this point in time", "results may vary",
                   "a quick sync", "we've got you covered", "unfortunately, mistakes happen",
                   "we'd love to explore", "an exciting opportunity", "please find below"]) {
    ok(`not-this phrase: "${p}"`, has(`Hi Sarah, ${p}.`, "avoid_phrase"));
  }

  ok("US date: month before day (November 4)", has("Your call is on November 4.", "us_date"));
  ok("US date: abbreviated month first (Dec 1st)", has("Booked for Dec 1st at 10:00.", "us_date"));
  ok("US date: numeric with the month first (11/16/2026)", has("Booked for 11/16/2026.", "us_date"));
  ok("date: machine form (2026-12-01)", has("Booked for 2026-12-01 at 10:00.", "date_format"));
  ok("date: day first but no ordinal (1 December)", has("Booked for Tuesday 1 December.", "date_format"));
  ok("date: no ordinal, with a year (13 October 2026)", has("Live on 13 October 2026.", "date_format"));

  ok("price: per month shorthand (£450/mo)", has("The plan is £450/mo.", "price_format"));
  ok("price: no VAT (£450 a month)", has("The plan is £450 a month.", "price_format"));
  ok("price: thousands without a comma (£3000 + VAT)", has("A build is £3000 + VAT.", "price_format"));
  ok("price: VAT squashed (£450+VAT)", has("The plan is £450+VAT.", "price_format"));
  ok("price: a range with no VAT at the end", has("SEO runs from £850 to £4,100 a month.", "price_format"));

  ok("an exclamation mark", has("Great news, it is live!", "exclamation"));

  for (const w of ["optimize", "optimization", "organization", "color", "favorite", "center",
                   "program", "analyze", "behavior", "inquiry", "canceled", "fulfill", "realize",
                   "customize", "prioritize"]) {
    ok(`US spelling: "${w}"`, has(`We will ${w} it for you.`, "us_spelling"));
  }
  ok("US spelling: capitalised", has("Optimize your ads.", "us_spelling"));
}

/* ===================================================================== */
console.log("\n== 2. and stays quiet on what the guide asks for ==");
{
  /* Every one of these is quoted from docs/tone-of-voice.md itself. If the
     guide's own examples fail, the rules are wrong, not the guide. */
  const guide = [
    "I want to be straight with you: what you are after and what sits inside our current scope are two different things.",
    "The short version: the agency is genuine, so this isn't a scam.",
    "Google only reports on what it's told. That's the gap, and it's why this is a build rather than a setting someone switches on.",
    "We can update this for you as a one-off for £250 + VAT, or set you up on a monthly maintenance plan.",
    "The fix is a one-off build at £450 + VAT, and I'm happy to walk you through it on tomorrow's call.",
    "A build is £3,000 + VAT.",
    "All done, live on the 4th.",
    "Your call is on Tuesday 13th October.",
    "Monthly SEO Report: October",
    "There is nothing you need to do right now.",
    "Please accept our apologies for the oversight.",
    "On that basis, we recommend: 1. Pause the campaign.",
    "We will optimise your enquiry forms, and the colour of the button.",
    "Happy to walk you through it on a call.",
  ];
  for (const g of guide) eq(`clean: "${g.slice(0, 48)}..."`, codes(g), []);

  /* Things that look like a violation and are not. */
  eq("a hyphenated word is not a dash", codes("A one-off, follow-up, 30-minute call."), []);
  eq("a range with an unspaced en dash is not a dash", codes("Open 9\u20135 on weekdays."), []);
  eq("a URL is not American spelling", codes("Book here: https://example.com/center/program?color=1"), []);
  eq("an email address is not a word", codes("Write to support@onlinemarketinghelp.co.uk"), []);
  eq("\"just\" on its own is fine", codes("Just reply to this text."), []);
  eq("\"not just\" without a \"but\" is fine", codes("It is not just you, everyone asks."), []);
  eq("\"programme\" is the UK spelling", codes("Our training programme."), []);
  eq("\"enquiry\" is the UK spelling", codes("Thanks for your enquiry."), []);
  eq("\"may\" the verb is not a month", codes("You may 2 days later change it."), []);
  eq("a price followed by + VAT is right", codes("It is £850 + VAT a month."), []);
  eq("a range carries VAT once, on the last figure", codes("SEO runs from £850 to £4,100 + VAT a month."), []);
  eq("a range of three carries it once too", codes("Between £450, £850 or £1,200 + VAT a month."), []);
  eq("a day with its ordinal is right (1st, 2nd, 3rd, 13th)",
     codes("1st December, 2nd May, 3rd June, 13th October, 22nd March, 31st July."), []);
  eq("a number before a month that is not a date is fine", codes("Report for 2026, 12 months of data."), []);
  eq("a time is not a date", codes("Booked at 10:00 on the 4th."), []);
  eq("an empty string has nothing wrong with it", codes(""), []);
  eq("null has nothing wrong with it", toneIssues(null as any), []);
}

/* ===================================================================== */
console.log("\n== 2b. an issue says what it found and what to do ==");
{
  const [i] = toneIssues("We fixed it \u2014 it is live.");
  ok("it names the code", i?.code === "em_dash", i);
  ok("it quotes what it found", i?.found === "\u2014", i);
  ok("it explains in words the owner understands", typeof i?.message === "string" && i.message.length > 20, i);
  ok("the message itself obeys the guide", toneIssues(i?.message || "").length === 0, toneIssues(i?.message || ""));
  eq("the same word twice is reported once", toneIssues("leverage this, leverage that").length, 1);
  ok("the lists are exported for the prompt and the screen", NEVER_USE.length >= 14 && AVOID_PHRASES.length >= 10);
}

/* ===================================================================== */
console.log("\n== 3. every template we send, in the guide's voice ==");
{
  /* Rendered three times: with every detail from each date source, and with none, because the two read
     differently ("Hi Sarah," against "Hi,", a date or no date). */
  /* The dates are the two shapes the system really hands a template, not a
     nicely written one. A test that feeds the template a perfect date proves
     the template and nothing about what the customer reads:
       - routing.ts appointmentWords(), for every route counted back from an
         appointment (G and H), and
       - the booking row itself, for booking_confirmed, stored YYYY-MM-DD. */
  const { appointmentWords, bookingWords } = await import("../convex/routing.ts");
  const appt = appointmentWords(Date.UTC(2026, 11, 1, 10, 0)); // 10:00 London, 1 Dec
  const booked = bookingWords({ preferredDate: "2026-12-01", preferredTime: "10:00" });
  const person = {
    name: "Sarah Whitfield", service: "Google Ads management", company: "Whitfield Plumbing",
    message: "Our ads stopped converting in October.", reference: "OMH-4821",
  };
  const full = { ...person, ...appt };
  const fromBooking = { ...person, ...booked };
  const bare = {};
  const report: Record<string, string[]> = {};
  for (const key of templateKeys()) {
    const found: string[] = [];
    for (const ctx of [full, fromBooking, bare]) {
      const r = render(key, ctx as any);
      for (const i of toneIssues((r.subject ? r.subject + "\n" : "") + r.body)) {
        const tag = `${i.code}: ${i.found}`;
        if (!found.includes(tag)) found.push(tag);
      }
    }
    if (found.length) report[key] = found;
    ok(`template ${key}`, found.length === 0, found);
  }
  const n = Object.values(report).reduce((a, b) => a + b.length, 0);
  console.log(`\n  templates checked: ${templateKeys().length}, with an issue: ${Object.keys(report).length}, issues: ${n}`);
}

/* ===================================================================== */
console.log("\n== 4. the owner sees the same rules while typing ==");
{
  const m = (body: string, extra: any = {}) => validateMessage({ key: "spring_offer", channel: "sms", body, ...extra });
  const w = (r: any) => r.warnings.map((x: any) => x.code);
  ok("an em dash is a warning", w(m("{{greeting}} it is live \u2014 have a look.")).includes("tone_em_dash"));
  ok("a never-use word is a warning", w(m("{{greeting}} we can unlock more leads.")).includes("tone_never_use"));
  ok("an email subject is checked too",
     w(m("{{greeting}} details below.", { channel: "email", subject: "Exciting news!" })).includes("tone_exclamation"));
  ok("a tone warning never blocks saving", m("{{greeting}} it is live \u2014 have a look!").ok === true);
  eq("a message in the guide's voice has no tone warning",
     w(m("{{greeting}} this has been done for you and is now live. Let me know if I've captured everything correctly."))
       .filter((c: string) => c.startsWith("tone_")), []);
  /* What the owner sees the first time they open each message. A warning
     on our own words would teach them to ignore the warnings. */
  const noisy = routeMessageKeys().filter((k) => {
    const src = templateSource(k);
    if (!src) return false;
    return validateMessage({ key: k, ...src }).warnings.some((x: any) => x.code.startsWith("tone_"));
  });
  eq("every code message, opened in the editor, has no tone warning", noisy, []);
  eq("the example values filled in for the preview are not judged",
     w(m("{{greeting}} about {{service}} for {{company}}.")).filter((c: string) => c.startsWith("tone_")), []);
}

/* ===================================================================== */
console.log("\n== 5. the gate is shaped for n8n, and inlined, not copied ==");
{
  const src = readFileSync(new URL("../gates/tone.js", import.meta.url), "utf8");
  ok("no import statement", !/^\s*import\s/m.test(src));
  const exportsLines = src.split("\n").filter((l) => /^\s*export\b/.test(l));
  eq("exactly one export line", exportsLines.length, 1);
  ok("and it is the single-line form gate_inline strips", /^export \{.*\};?$/.test(exportsLines[0] || ""), exportsLines);

  /* The node runs the inlined text wrapped in a function, which is how n8n
     runs it. This is the shape that would have caught the 2026-11-11 outage. */
  const inlined = src.split("\n").filter((l) => !l.startsWith("export {")).join("\n");
  const run = new Function(inlined + "\nreturn toneIssues('it is live \u2014 have a look!').map(function (i) { return i.code; });");
  eq("inlined the way gate_inline does, it runs in a Code node body", run(), ["em_dash", "exclamation"]);

  const builder = readFileSync(new URL("../n8n/build-workflows.py", import.meta.url), "utf8");
  ok("the chat's Clean Reply node inlines tone.js", builder.includes('gate_inline("tone.js")'));
  /* message-text.js imports tone.js, which is fine for Convex, the dashboard
     and the tests, which all bundle. It would be a syntax error inside a
     Code node. If anybody ever inlines it, this says why it broke. */
  ok("message-text.js is never inlined into n8n (it has an import)", !builder.includes('gate_inline("message-text.js")'));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
