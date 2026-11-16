# Plan

The largest hole in the product, found by using it as a visitor rather than
by reading it, plus the four majors from workstream 002's review.

## The hole

Six form components on the marketing site post to `/api/enquiry`. That route
stored the submission in Sanity and emailed the team. That was all of it.

| What should have happened | What did |
|---|---|
| a lead row, so it appears on Leads and in the counts | nothing |
| its attribution kept, so the advert that produced them is known | nothing |
| route B: text and email inside 2 minutes, call at 15 | nothing |

Route B is literally named "Website form, or a Google Ads landing page". It
was built, it was tested, and **nothing fed it**. The client would have found
this out by filling in their own form.

The booking page had the same shape: `/api/book-demo` wrote to Google
Calendar only, while the dashboard's Bookings screen reads Convex. So a demo
booked by talking to the assistant appeared and a demo booked on the booking
page did not, on the screen the client uses to count what the system did.

## Tasks

- [x] 1. `widget/gates/enquiry-form.js`: read six differently-written forms'
      arbitrary label/value pairs into a lead. "Company name" must lose to
      company and not win name; an email field holding "n/a" must become no
      email, because `emailKey` would otherwise merge two strangers.
- [x] 2. Refuse what must never be enrolled: a honeypot submission, and one
      with neither an email nor a phone, because route B's first move is a
      text and an email and a sequence that cannot send is a board row that
      reads as a fault.
- [x] 3. `/api/enquiry` hands over to the router, and **cannot fail the
      visitor's submission**.
- [x] 4. `/api/book-demo` records the booking in Convex after the calendar
      write, so the Bookings screen shows it.
- [x] 5. Off until configured: no `OHM_LEAD_ROUTER_URL`, no behaviour change.
- [x] 6. Drive a real form in a real browser and read what the router
      actually received.

## What driving it found, that reading it would not

**The hand-over was in the wrong place.** It was written after the email, the
apparently careful order. But this route RETURNS EARLY when SMTP is missing
or rejects, so on a mail outage the enquiry would have been lost to the
system as well as to the inbox. Moved ahead of the email: the lead is the
thing that matters most, and it cannot throw.

**Two of the live form's labels matched nothing.** The first real submission
came back with the form's own name where the service should have been, and
no message at all, because the contact form calls them "What do you need?"
and "What's the goal or problem?" and the rules expected the word "message".
The most valuable answer on the form was arriving empty.

**Attribution was being thrown away one line earlier than this work.**
`lib/send-enquiry.tsx` posted `window.location.pathname` without `.search`,
so the gclid and the utm_ values were dropped at the moment somebody
converted. Every form on the site posts through that helper, so that one
line is every form's attribution.

Captured from the router after the fixes, from a real browser submission:

```json
{ "name": "Nadia Hargreaves", "email": "nadia@hargreavesroofing.example",
  "phone": "07700 900321", "company": "Hargreaves Roofing",
  "service": "New website",
  "message": "Contact enquiry: We want more emergency roofing calls in Leeds, not clicks.",
  "sourceChannel": "website_form",
  "attribution": { "gclid": "TESTCLICK123", "source": "google",
                   "campaign": "Emergency plumber Leeds",
                   "landingPage": "/contact?gclid=TESTCLICK123&utm_source=..." } }
```

## The four majors from 002's review

- [x] **"Costing you" over channels with no spend.** The chart's region label
      is computed now: every channel sitting in it must have a spend figure
      before it can make a cost claim, otherwise it reads "not converting".
      ADR-008 says profit is not claimed without spend, and the chart is the
      part that gets screenshotted.
- [x] **Three rates without denominators.** All three carry them: "82% of 325
      leads answered inside 2 min", "34% / 175 of 518 texts, target 15 to 30
      per cent", "9% / 30 of 341 emails". The text one can read above 100,
      because one person answering a single text twice is two replies to one
      text; "175 of 518" is a fact somebody can reason about, "147%" looks
      like a broken dashboard.
- [x] **`widget/tests/spend.test.ts` did not exist**, though the plan named
      it. Written, 22 assertions: absent is not zero, clearing returns a
      channel to absent, a negative or non-finite figure is refused, and one
      channel's figure never appears against another.
- [x] **`tooEarly` was never reachable on the demo data**, so the ranking
      floor had never been drawn on screen. `referral` is now 6 leads with 4
      bookings: sixty-seven per cent, which would rank first and means
      nothing. The screen now prints "Referral, too early to say" and "Not
      ranked, under 8 leads each".

## Not done

- **Nothing is deployed or pushed.** `OHM_LEAD_ROUTER_URL` is set locally;
  the same value has to be added in Vercel, and `OHM Assistant - Lead Router`
  has to be activated, before a real form reaches the system.
- **Once both are true, every website form fill texts and emails the person
  within two minutes.** That is what route B is, and it is what was sold, but
  it changes from nothing happening to outbound messaging the moment it is
  switched on. That is Rafiul's call, not mine.
