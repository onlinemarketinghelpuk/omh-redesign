/* =========================================================================
   The OMH voice: the half of it a machine can decide.

   Source: docs/tone-of-voice.md, Melissa's staff guide of 12 November 2026.
   This file holds ONLY the rules in it that have a right answer:

     em dashes, the never-use words, the say-this-not-that phrases, US date
     order, prices not written "£450 + VAT", exclamation marks, and American
     spellings.

   The other half of the guide (straight talk said kindly, matching the
   client's formality, leading with "the short version") is judgement. It
   lives as prompt text in retell/prompt-core.md and is deliberately not
   here. A rule that pretends to detect kindness fails on good copy and
   passes on bad, and a check that cries wolf gets switched off, taking the
   real rules with it.

   So everything this reports is a WARNING, never a block. It is the guide's
   pre-send checklist run by a machine, for the parts a machine can run.

   Where it runs, from this one text:
   - widget/tests/tone.test.ts, over every template in templates.ts.
   - validateMessage in message-text.js, so the owner editing a message on
     the dashboard sees the rules as they type.
   - the "Clean Reply" Code node in 01-chat, inlined by gate_inline(), where
     it records what the model wrote without changing a word of it.

   Plain JavaScript, no imports, one export line, like everything in gates/.
   ========================================================================= */

/* Never use. Each entry is a pattern for the word and its forms, plus the
   word as the guide writes it, for the message. */
var NEVER_USE = [
  { word: "leverage", re: /\bleverag(?:e|es|ed|ing)\b/gi },
  { word: "synergy", re: /\bsynerg(?:y|ies|istic)\b/gi },
  { word: "unlock", re: /\bunlock(?:s|ed|ing)?\b/gi },
  { word: "elevate", re: /\belevat(?:e|es|ed|ing)\b/gi },
  { word: "seamless", re: /\bseamless(?:ly)?\b/gi },
  { word: "robust", re: /\brobust(?:ly|ness)?\b/gi },
  { word: "holistic", re: /\bholistic(?:ally)?\b/gi },
  { word: "empower", re: /\bempower(?:s|ed|ing|ment)?\b/gi },
  { word: "delve", re: /\bdelv(?:e|es|ed|ing)\b/gi },
  { word: "game-changing", re: /\bgame[- ]?chang(?:ing|er|ers)\b/gi },
  { word: "cutting-edge", re: /\bcutting[- ]edge\b/gi },
  { word: "materially", re: /\bmaterially\b/gi },
  { word: "outsized", re: /\boutsized\b/gi },
  { word: "underpins", re: /\bunderpin(?:s|ned|ning)?\b/gi },
  /* "not just X but Y", and its twin "not only X but also Y", inside one
     sentence. "It is not just you" with no "but" is ordinary English. */
  { word: "not just X but Y", re: /\bnot (?:just|only)\b[^.?!\n]{1,80}?\bbut\b/gi },
];

/* Say this, not that. The left column is what the guide forbids; `say` is
   its own replacement from the same table, so the warning tells the owner
   what to write instead of only what not to. */
var AVOID_PHRASES = [
  { re: /\bcircling back\b/gi, say: "As promised, please find attached" },
  { re: /\btouch(?:ing)? base\b/gi, say: "As promised, please find attached" },
  { re: /\bactioned\b/gi, say: "This has been done for you" },
  { re: /\bhope this helps\b/gi, say: "Let me know if I've captured everything correctly" },
  { re: /\bmoving forward\b/gi, say: "Your side / Our side" },
  { re: /\bat this point in time\b/gi, say: "Here is where we sit" },
  { re: /\bresults may vary\b/gi, say: "One honest caveat while we're here" },
  { re: /\b(?:quick sync|hop on a)\b/gi, say: "Happy to walk you through it on a call" },
  { re: /\bgot you covered\b/gi, say: "There is nothing you need to do right now" },
  { re: /\bmistakes happen\b/gi, say: "Please accept our apologies for the oversight" },
  { re: /\b(?:we'd|we would) love to\b/gi, say: "I want to be straight with you" },
  { re: /\bexciting opportunit(?:y|ies)\b/gi, say: "I want to be straight with you" },
  { re: /\bcomprehensive overview\b/gi, say: "The short version:" },
  { re: /\bplease find below\b/gi, say: "The short version:" },
  { re: /\bpresents a challenge\b/gi, say: "That's the gap, and it's why..." },
  { re: /\bmight want to consider\b/gi, say: "On that basis, we recommend:" },
];

/* American spelling, and the UK form OMH writes. Stems are explicit rather
   than "every -ize", because "size" and "prize" are not American. */
var US_SPELLINGS = [
  { re: /\boptimiz\w*/gi, uk: "optimise" },
  { re: /\borganiz\w*/gi, uk: "organise, organisation" },
  { re: /\brealiz\w*/gi, uk: "realise" },
  { re: /\brecogniz\w*/gi, uk: "recognise" },
  { re: /\bprioritiz\w*/gi, uk: "prioritise" },
  { re: /\bcustomiz\w*/gi, uk: "customise" },
  { re: /\bpersonaliz\w*/gi, uk: "personalise" },
  { re: /\bminimiz\w*/gi, uk: "minimise" },
  { re: /\bmaximiz\w*/gi, uk: "maximise" },
  { re: /\butiliz\w*/gi, uk: "use" },
  { re: /\bspecializ\w*/gi, uk: "specialise" },
  { re: /\bfinaliz\w*/gi, uk: "finalise" },
  { re: /\bsummariz\w*/gi, uk: "summarise" },
  { re: /\bapologiz\w*/gi, uk: "apologise" },
  { re: /\banalyz\w*/gi, uk: "analyse" },
  { re: /\bcolor(?:s|ed|ful)?\b/gi, uk: "colour" },
  { re: /\bfavor(?:s|ed|ite|ites|able)?\b/gi, uk: "favour, favourite" },
  { re: /\bbehavior(?:s|al)?\b/gi, uk: "behaviour" },
  { re: /\blabor\b/gi, uk: "labour" },
  { re: /\bcenter(?:s|ed)?\b/gi, uk: "centre" },
  { re: /\bprograms?\b/gi, uk: "programme" },
  { re: /\binquir(?:y|ies)\b/gi, uk: "enquiry" },
  { re: /\b(?:cancel|travel|model|label)(?:ed|ing)\b/gi, uk: "cancelled, travelled, modelled, labelled" },
  { re: /\bfulfill(?:s|ment)?\b/gi, uk: "fulfil, fulfilment" },
  { re: /\bcatalogs?\b/gi, uk: "catalogue" },
  { re: /\bdefense\b/gi, uk: "defence" },
  { re: /\benroll(?:s|ment)?\b/gi, uk: "enrol, enrolment" },
];

/* Capitalised on purpose: "you may 2 days later" is a verb, "May 2" is a
   date. A sentence that starts "May 2..." is the price of that, and rare. */
var MONTH_FIRST =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.? \d{1,2}(?:st|nd|rd|th)?\b(?!:)/g;

/* "1 December", "13 Oct": a day with no ordinal. "1st December" does not
   match, because the ordinal sits between the number and the month. */
var DAY_NO_ORDINAL =
  /\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/g;

/* What is not prose: links, email addresses and {{variables}}. Replaced
   with a space rather than removed, so the words either side stay apart. */
function prose(text) {
  return String(text == null ? "" : text)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/\S+@\S+\.\S+/g, " ")
    .replace(/\{\{[^{}]*\}\}/g, " ");
}

/**
 * Everything in this text that the guide's decidable rules forbid.
 *
 * Returns [{ code, found, message }], one entry per distinct thing found,
 * in the order the rules are listed above. An empty array is the pass.
 */
function toneIssues(text) {
  var t = prose(text);
  var out = [], seen = {};
  function add(code, found, message) {
    var k = code + "|" + String(found).toLowerCase();
    if (seen[k]) return;
    seen[k] = true;
    out.push({ code: code, found: found, message: message });
  }
  function each(re, fn) {
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(t))) { fn(m); if (m[0] === "") re.lastIndex++; }
  }

  /* Em dashes, and the two things people type instead of one. A hyphen in
     "one-off" and an unspaced en dash in "9-5" are not dashes. */
  each(/\u2014|\s\u2013\s|\s--\s/g, function (m) {
    add("em_dash", m[0].trim(),
      "OMH writing never uses a dash to join two thoughts. Use a comma, a full stop, a colon or brackets.");
  });

  for (var i = 0; i < NEVER_USE.length; i++) {
    (function (w) {
      each(w.re, function (m) {
        add("never_use", m[0],
          "\"" + m[0] + "\" is on the guide's never-use list (" + w.word + "). Say the plain thing it stands for.");
      });
    })(NEVER_USE[i]);
  }

  for (var j = 0; j < AVOID_PHRASES.length; j++) {
    (function (p) {
      each(p.re, function (m) {
        add("avoid_phrase", m[0],
          "\"" + m[0] + "\" reads like an agency template. The guide says: \"" + p.say + "\".");
      });
    })(AVOID_PHRASES[j]);
  }

  each(MONTH_FIRST, function (m) {
    add("us_date", m[0], "\"" + m[0] + "\" puts the month first. Write the day first, like 4th November.");
  });
  each(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/g, function (m) {
    if (+m[1] <= 12 && +m[2] > 12) {
      add("us_date", m[0], "\"" + m[0] + "\" is in US order. Write the date in words, day first, like 4th November.");
    }
  });

  /* The guide's date form is "4th November" or "Tuesday 13th October". Two
     shapes the system itself produces miss it: the machine form a booking is
     stored in, and a day with no ordinal. Both are decidable. */
  each(/\b\d{4}-\d{2}-\d{2}\b/g, function (m) {
    add("date_format", m[0], "\"" + m[0] + "\" is a machine date. Write it in words, like Tuesday 1st December.");
  });
  each(DAY_NO_ORDINAL, function (m) {
    add("date_format", m[0], "\"" + m[0] + "\" needs the day's ending: 1st, 2nd, 3rd, 4th. Like 1st December.");
  });

  /* Prices. Always "£450 + VAT", thousands with a comma. Anything else
     (per month shorthand, a price with no VAT, "£450+VAT") is a miss. */
  each(/£\s?(\d+(?:,\d{3})*(?:\.\d+)?)(k\b)?/gi, function (m) {
    var after = t.slice(m.index + m[0].length, m.index + m[0].length + 12);
    var whole = m[1].split(".")[0];
    var shown = m[0] + (after.match(/^\S*/) || [""])[0];
    /* "£850 to £4,100 + VAT a month": a range carries VAT once, on its last
       figure, so a price that leads straight into another is not judged on
       its own. The last one still is. */
    var inRange = /^\s*(?:,|to|and|or|-)\s*£/.test(after);
    if (m[2]) {
      add("price_format", shown, "Write the price in full, like £3,000 + VAT.");
    } else if (whole.indexOf(",") === -1 && whole.length >= 4) {
      add("price_format", shown, "Thousands take a comma: £3,000 + VAT.");
    } else if (!inRange && !/^ \+ VAT\b/.test(after)) {
      add("price_format", shown, "Prices are always written with VAT shown, like £450 + VAT.");
    }
  });

  if (t.indexOf("!") !== -1) {
    add("exclamation", "!", "OMH does not use exclamation marks to sell. A full stop reads as more sure of itself.");
  }

  for (var k = 0; k < US_SPELLINGS.length; k++) {
    (function (s) {
      each(s.re, function (m) {
        add("us_spelling", m[0], "\"" + m[0] + "\" is the American spelling. OMH writes " + s.uk + ".");
      });
    })(US_SPELLINGS[k]);
  }

  return out;
}

export { toneIssues, NEVER_USE, AVOID_PHRASES, US_SPELLINGS };
