// /ai-voice-agents/receptionist: the client's AI receptionist page (21 Oct 2026), as supplied, minus its own header,
// footer and theme script (the site's are used). Demo buttons point at the page's BookDemo form. Styles:
// app/ai-voice-agents/receptionist/receptionist.css. Rendered by app/ai-voice-agents/receptionist/page.tsx.
export const receptionistMeta = {
  "title": "AI Receptionist UK | 24/7 Call Answering Service | OMH",
  "description": "Our UK AI receptionist answers every call on the first ring, books appointments and takes proper messages, day or night. Set up and managed by a UK team."
};

export const receptionistGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist#webpage",
      "url": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist",
      "name": "AI Receptionist UK | 24/7 Call Answering Service | OMH",
      "description": "Our UK AI receptionist answers every call on the first ring, books appointments and takes proper messages, day or night. Set up and managed by a UK team.",
      "inLanguage": "en-GB",
      "isPartOf": {
        "@type": "WebSite",
        "url": "https://onlinemarketinghelp.co.uk/",
        "name": "Online Marketing Help"
      },
      "breadcrumb": {
        "@id": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist#breadcrumb"
      },
      "about": {
        "@id": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist#service"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://onlinemarketinghelp.co.uk/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "AI Voice Agents",
          "item": "https://onlinemarketinghelp.co.uk/ai-voice-agents"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "AI Receptionist",
          "item": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist"
        }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist#service",
      "name": "AI Receptionist",
      "alternateName": [
        "AI phone receptionist",
        "AI virtual receptionist"
      ],
      "serviceType": "AI receptionist and 24/7 call answering service",
      "description": "Our UK AI receptionist answers every call on the first ring, books appointments and takes proper messages, day or night. Set up and managed by a UK team.",
      "url": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist",
      "provider": {
        "@id": "https://onlinemarketinghelp.co.uk/#organisation"
      },
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      },
      "audience": {
        "@type": "BusinessAudience",
        "name": "UK small and medium-sized businesses"
      },
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter",
          "price": "249",
          "priceCurrency": "GBP",
          "description": "300 minutes a month included. One-off setup fee £795. Prices exclude VAT.",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "249",
            "priceCurrency": "GBP",
            "unitText": "MONTH",
            "valueAddedTaxIncluded": false
          }
        },
        {
          "@type": "Offer",
          "name": "Growth",
          "price": "449",
          "priceCurrency": "GBP",
          "description": "500 minutes a month included. One-off setup fee £1,295. Prices exclude VAT.",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "449",
            "priceCurrency": "GBP",
            "unitText": "MONTH",
            "valueAddedTaxIncluded": false
          }
        },
        {
          "@type": "Offer",
          "name": "Scale",
          "price": "849",
          "priceCurrency": "GBP",
          "description": "900 minutes a month included. One-off setup fee £1,995. Prices exclude VAT.",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "849",
            "priceCurrency": "GBP",
            "unitText": "MONTH",
            "valueAddedTaxIncluded": false
          }
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://onlinemarketinghelp.co.uk/ai-voice-agents/receptionist#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What does an AI receptionist do?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "An AI receptionist answers your business calls in a natural British voice. It greets callers, answers questions from information you have approved, such as services, prices and opening hours, books appointments into your calendar and takes a proper message when it can't help. You get a summary of every call, so nothing is lost."
          }
        },
        {
          "@type": "Question",
          "name": "What is the difference between an AI receptionist and an AI voice agent?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "An AI receptionist is the front-desk job: answering inbound calls, booking appointments and taking messages. An AI voice agent can also call new web leads back, follow up quotes and route calls between departments. Our Starter plan works as an AI receptionist, and the Growth and Scale plans add the wider voice agent features."
          }
        },
        {
          "@type": "Question",
          "name": "How much does an AI receptionist cost in the UK?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Self-serve AI receptionist apps in the UK usually cost between £19 and £99 a month, and you build and maintain them yourself. Our managed AI receptionist starts at £249 a month plus VAT with 300 minutes included, and a one-off setup fee of £795. Extra minutes cost 60p each. A full-time human receptionist typically costs over £2,000 a month once salary, National Insurance and pension are counted."
          }
        },
        {
          "@type": "Question",
          "name": "Is there a free AI receptionist?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Some apps offer free trials or limited free plans, but a free tool won't know your business, connect to your diary or be tested on your real calls. If you want to hear what a properly built one sounds like, ring our demo agent or book a 30-minute demo."
          }
        },
        {
          "@type": "Question",
          "name": "How do I set up an AI receptionist?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "With OMH you don't set it up yourself. We connect your phone line and calendar, train the receptionist on your services, prices and booking rules, test it with you, then go live. On the Starter plan that takes as little as 3 working days."
          }
        },
        {
          "@type": "Question",
          "name": "Will callers know they are talking to an AI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Every receptionist we build says it is an AI assistant at the start of the call. Callers deserve to know, and it avoids awkward moments later in the conversation."
          }
        },
        {
          "@type": "Question",
          "name": "Can I keep my existing business number?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In most cases, yes. You divert calls to the AI receptionist, either all of them or only the ones your team can't answer. If you want a new local number, such as a 0161 number for Manchester, we can arrange one during setup."
          }
        },
        {
          "@type": "Question",
          "name": "Is an AI receptionist GDPR compliant?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It can be, when it is set up properly. Callers are told at the start if calls are recorded. You remain the data controller and OMH acts as your processor under a written agreement, and we agree retention periods with you before go-live."
          }
        },
        {
          "@type": "Question",
          "name": "What happens if it can't answer a question?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It only answers from your approved information. If a caller asks something outside that, it takes a proper message with their name, number and reason for calling. On the Growth and Scale plans it can also transfer the call live to a person, passing on everything the caller has already said."
          }
        },
        {
          "@type": "Question",
          "name": "Does it answer out of hours and more than one call at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. It answers 24 hours a day, including evenings, weekends and bank holidays, and it can handle several calls at the same time, so callers never hear an engaged tone."
          }
        }
      ]
    }
  ]
};

export const receptionistMarkup = String.raw`
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/></symbol>
<symbol id="i-message" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/></symbol>
<symbol id="i-mic" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-pound" viewBox="0 0 24 24"><path d="M18 7a4 4 0 0 0-7.5-2c-.6 1-.5 2.5-.5 4v4c0 2-1 4-3 5h11M6 12h8"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></symbol>
<symbol id="i-tooth" viewBox="0 0 24 24"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4 2 7s1 7.5 2.5 7.5S9.5 16 12 16s3 6 4.5 6 2-4.5 2.5-7.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/></symbol>
<symbol id="i-cross" viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></symbol>
<symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 2.7s6 6.6 6 11.3a6 6 0 0 1-12 0c0-4.7 6-11.3 6-11.3z"/></symbol>
<symbol id="i-flame" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24"><path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10 6h4"/></symbol>
<symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/></symbol>
<symbol id="i-car" viewBox="0 0 24 24"><path d="M5 17h14v-5l-2-5H7l-2 5z"/><path d="M3 12h18M7 17v2M17 17v2"/></symbol>
<symbol id="i-fb" viewBox="0 0 24 24"><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/></symbol>
<symbol id="i-ig" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></symbol>
<symbol id="i-in" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></symbol>
</defs></svg>
<!-- ========== HERO ========== -->
<section class="hero" aria-labelledby="h1">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/ai-voice-agents">AI Voice Agents</a><span aria-hidden="true">/</span><span aria-current="page">AI Receptionist</span></nav>
    <span class="badge"><span class="vm"><i></i><i></i><i></i></span>AI receptionist · 24/7</span>
    <h1 class="h1" id="h1">AI Receptionist for UK Businesses <span class="hl">Never Miss Another Call</span></h1>
    <p class="lead">Our UK AI receptionist answers every call on the first ring, day or night. It answers questions from your approved information, books appointments into your calendar and takes a proper message when it can't help. We build it, test it with you and manage it every month.</p>
    <div class="ctas">
      <a class="btn btn-primary" href="#book-demo-form">Book a 30-Minute Demo</a>
      <a class="btn btn-secondary" href="tel:+442034893934"><svg class="icon"><use href="#i-phone"/></svg>Ring our demo agent</a>
    </div>
    <p class="fine">Live in as little as 3 working days · Keep your number · Billed monthly, 30 days' notice</p>

    <p class="inds-label">An AI receptionist for businesses that live on the phone</p>
    <div class="inds-row">
      <a href="/ai-voice-agents/estate-letting-agents"><svg class="icon"><use href="#i-home"/></svg>Estate &amp; Letting Agents</a>
      <a href="/ai-voice-agents/dentists"><svg class="icon"><use href="#i-tooth"/></svg>Dentists</a>
      <a href="/ai-voice-agents/healthcare"><svg class="icon"><use href="#i-cross"/></svg>Clinics &amp; Healthcare</a>
      <a href="/ai-voice-agents/plumbers"><svg class="icon"><use href="#i-drop"/></svg>Plumbers</a>
      <a href="/ai-voice-agents/heating-hvac"><svg class="icon"><use href="#i-flame"/></svg>Heating Engineers</a>
      <a href="/ai-voice-agents/builders-construction"><svg class="icon"><use href="#i-bell"/></svg>Builders</a>
      <a href="/ai-voice-agents/law-firms"><svg class="icon"><use href="#i-scale"/></svg>Law Firms</a>
      <a href="/ai-voice-agents/car-dealerships"><svg class="icon"><use href="#i-car"/></svg>Car Dealerships</a>
    </div>

    <div class="demo" role="group" aria-label="Example call handled by the AI receptionist">
      <div>
        <div class="d-top">
          <div class="d-who"><span class="d-av" aria-hidden="true">BH</span><span><b>Brook Heating, Billericay</b><small>Tuesday, 21:47 · answered on the first ring</small></span></div>
          <span class="live"><span class="dot"></span>Live call</span>
        </div>
        <div class="msgs">
          <p class="msg m-a"><b>AI receptionist</b>Good evening, Brook Heating. You're speaking to our AI assistant. How can I help?</p>
          <p class="msg m-c"><b>Caller</b>Hi, my boiler's stopped working. Can someone come out tomorrow?</p>
          <p class="msg m-a"><b>AI receptionist</b>Sorry to hear that. Do you have any hot water at all, and what's your postcode?</p>
          <p class="msg m-c"><b>Caller</b>No hot water. It's CM12 9AB.</p>
          <p class="msg m-a"><b>AI receptionist</b>Thanks. I have 8:30 or 11:00 tomorrow morning. Which suits you?</p>
          <p class="msg m-c"><b>Caller</b>8:30, please.</p>
        </div>
      </div>
      <div class="summary">
        <h3>Call summary</h3>
        <p class="sum-ok"><svg class="icon"><use href="#i-check"/></svg>Appointment booked: Wed 08:30</p>
        <dl>
          <dt>Reason</dt><dd>Boiler breakdown, no hot water</dd>
          <dt>Postcode</dt><dd>CM12 9AB</dd>
          <dt>Urgency</dt><dd>High</dd>
          <dt>Call length</dt><dd>1 min 48 sec</dd>
          <dt>Sent to</dt><dd>Diary and your inbox</dd>
        </dl>
      </div>
    </div>
    <p class="demo-note">Example call, written to show how the AI receptionist handles a typical enquiry.</p>
  </div>
</section>

<!-- ========== WHAT IS AN AI RECEPTIONIST ========== -->
<section class="section on-band" id="what-is" aria-labelledby="what-h">
  <div class="wrap what">
    <div>
      <h2 class="h2" id="what-h">What is an <span class="hl">AI receptionist?</span></h2>
      <div style="margin-top:1.5rem">
        <p class="def">An AI receptionist is software that answers your business phone in a natural, spoken conversation. It greets callers, answers their questions, books appointments into your calendar and takes messages, the same way a good front desk would, at any hour.</p>
        <p>Callers don't press buttons or leave voicemails. They say what they need and the receptionist responds. The difference with OMH is that we set it up and run it for you: we write the script around your real calls, connect your diary and keep improving it every month.</p>
        <p>Looking for more than inbound calls? Our <a class="ilink" href="/ai-voice-agents" style="color:var(--band-ink)">AI voice agents</a> can also call new leads back and follow up quotes.</p>
      </div>
    </div>
    <div>
      <h3 class="what-h3">How an AI receptionist handles a call</h3>
      <ol class="steps-v">
        <li><span class="n">1</span><div><h3>It answers on the first ring</h3><p>With your business name, and it tells callers it's an AI assistant.</p></div></li>
        <li><span class="n">2</span><div><h3>It understands what they need</h3><p>Speech recognition turns the caller's words into a request it can act on.</p></div></li>
        <li><span class="n">3</span><div><h3>It answers, books or takes a message</h3><p>Only from your approved information, and only into free slots in your diary.</p></div></li>
        <li><span class="n">4</span><div><h3>It reports back</h3><p>You get a summary of every call, with the caller's details and what happened.</p></div></li>
      </ol>
    </div>
  </div>
</section>

<!-- ========== FEATURES ========== -->
<section class="section bg-sand" id="features" aria-labelledby="feat-h">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">What's included</p>
      <h2 class="h2" id="feat-h">What your AI receptionist does, <span class="hl">and what we do for you</span></h2>
      <p class="lead">Everything a good front desk does on the phone, without adding to the payroll. Features marked Growth and Scale aren't on the Starter plan.</p>
    </div>
    <div class="feats">
      <article class="feat"><span class="icon-tile"><svg class="icon"><use href="#i-phone"/></svg></span><h3 class="h3">First-ring answering, 24/7</h3><p>Every call answered straight away, including nights, weekends and bank holidays, with no engaged tone.</p><div class="split"><span><b>We do</b>Forward your number and agree what it picks up, and when.</span></div></article>
      <article class="feat"><span class="icon-tile"><svg class="icon"><use href="#i-mic"/></svg></span><h3 class="h3">Sounds like your front desk</h3><p>A British voice with your business name, your greeting and your tone: warm, brisk or formal.</p><div class="split"><span><b>We do</b>Write the greeting and test it with you before go-live.</span></div></article>
      <article class="feat"><span class="icon-tile"><svg class="icon"><use href="#i-book"/></svg></span><h3 class="h3">Knows your services and prices</h3><p>Answers only from information you approve, so callers get the right answer and nothing made up.</p><div class="split"><span><b>We do</b>Build its knowledge from your real calls and FAQs.</span></div></article>
      <article class="feat"><span class="icon-tile"><svg class="icon"><use href="#i-calendar"/></svg></span><h3 class="h3">Books into your calendar</h3><p>Offers real free slots and books the one that suits the caller, with no double bookings.</p><div class="split"><span><b>We do</b>Connect your diary and set your booking rules.</span></div></article>
      <article class="feat"><span class="icon-tile"><svg class="icon"><use href="#i-message"/></svg></span><h3 class="h3">Takes a proper message</h3><p>When it can't help, it takes the caller's name, number and reason, and sends it to you straight away.</p><div class="split"><span><b>We do</b>Route messages to the right inbox or person.</span></div></article>
      <article class="feat"><span class="icon-tile"><svg class="icon"><use href="#i-users"/></svg></span><h3 class="h3">Live transfer to a person <span class="pill">Growth and Scale</span></h3><p>Passes urgent callers to your team, along with everything they've already said.</p><div class="split"><span><b>We do</b>Set your transfer and out-of-hours rules.</span></div></article>
    </div>
  </div>
</section>

<!-- ========== COMPARISON ========== -->
<section class="section" id="compare" aria-labelledby="cmp-h">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">Compare your options</p>
      <h2 class="h2" id="cmp-h">AI phone receptionist vs <span class="hl">the usual answers</span></h2>
      <p class="lead">How an AI phone receptionist compares with voicemail, a human receptionist, a call answering service and a DIY app, for a typical small UK business.</p>
    </div>
    <div class="tablewrap">
      <table>
        <caption class="sr">AI phone receptionist compared with voicemail, a human receptionist, an answering service and a DIY app</caption>
        <thead><tr><th scope="col"><span class="sr">Feature</span></th><th scope="col">Voicemail</th><th scope="col">Human receptionist</th><th scope="col">Answering service</th><th scope="col">DIY AI app</th><th scope="col" class="us">OMH AI receptionist</th></tr></thead>
        <tbody>
          <tr><th scope="row">Typical monthly cost</th><td>Free</td><td>£2,000+ with salary, NI and pension</td><td>Per call, per minute or a bundle</td><td>About £19 to £99</td><td class="us">From £249 + VAT</td></tr>
          <tr><th scope="row">Answers out of hours</th><td><span class="c no"><svg class="icon"><use href="#i-x"/></svg>No</span></td><td><span class="c no"><svg class="icon"><use href="#i-x"/></svg>Office hours only</span></td><td>Often, at extra cost</td><td><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>Yes</span></td><td class="us"><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>24/7, bank holidays too</span></td></tr>
          <tr><th scope="row">Books into your diary</th><td><span class="c no"><svg class="icon"><use href="#i-x"/></svg>No</span></td><td><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>Yes</span></td><td>Usually takes a message</td><td>If you connect it</td><td class="us"><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>Yes, set up for you</span></td></tr>
          <tr><th scope="row">Calls at the same time</th><td>n/a</td><td>One at a time</td><td>Depends on staff</td><td>Several</td><td class="us"><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>Several, no engaged tone</span></td></tr>
          <tr><th scope="row">Knows your business</th><td>n/a</td><td>Yes, once trained</td><td>A short script</td><td>Only what you teach it</td><td class="us"><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>Built from your real calls</span></td></tr>
          <tr><th scope="row">Tested before customers hear it</th><td>n/a</td><td>Learns on the job</td><td>Varies</td><td>By you</td><td class="us"><span class="c yes"><svg class="icon"><use href="#i-check"/></svg>Yes, with you</span></td></tr>
          <tr><th scope="row">Setup and upkeep</th><td>None</td><td>Hiring, training, cover</td><td>A few days</td><td>All yours</td><td class="us">Done for you, improved monthly</td></tr>
        </tbody>
      </table>
    </div>
    <p class="note">Human receptionist cost based on a full-time salary of around £24,000 a year plus employer National Insurance and pension. DIY app prices are typical UK list prices and vary by provider.</p>
  </div>
</section>

<!-- ========== AI RECEPTIONIST FOR SMALL BUSINESS ========== -->
<section class="section bg-surface" id="small-business" aria-labelledby="sb-h">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">Built for small teams</p>
      <h2 class="h2" id="sb-h">An AI receptionist for small business, <span class="hl">without the setup work</span></h2>
      <p class="lead">You can find AI receptionist apps that you configure yourself. Most small business owners don't have time to write call scripts, connect diaries and test every scenario. That's the part we do, so you just take the bookings.</p>
    </div>
    <div class="vs">
      <div class="vs-c">
        <h3 class="h3">DIY AI receptionist apps</h3>
        <p class="p">Typically £19 to £99 a month</p>
        <ul>
          <li><svg class="icon no"><use href="#i-x"/></svg>You write and test the call script yourself</li>
          <li><svg class="icon no"><use href="#i-x"/></svg>You connect the calendar, CRM and call forwarding</li>
          <li><svg class="icon no"><use href="#i-x"/></svg>Generic answers until you train it properly</li>
          <li><svg class="icon no"><use href="#i-x"/></svg>Help articles and email support</li>
        </ul>
      </div>
      <div class="vs-c us">
        <div class="vs-top"><h3 class="h3">OMH managed AI receptionist</h3><span class="pill">Done for you</span></div>
        <p class="p">From £249 a month + VAT</p>
        <ul>
          <li><svg class="icon yes"><use href="#i-check"/></svg>We learn your business and write the script around your real calls</li>
          <li><svg class="icon yes"><use href="#i-check"/></svg>We set up forwarding and connect your diary</li>
          <li><svg class="icon yes"><use href="#i-check"/></svg>We test it with you before any customer hears it</li>
          <li><svg class="icon yes"><use href="#i-check"/></svg>We review calls and improve it, with a monthly report</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ========== HOW IT WORKS / SETUP ========== -->
<section class="section" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">How it works</p>
      <h2 class="h2" id="how-h">Live in as little as 3 working days. <span class="hl">Answering every call after that.</span></h2>
    </div>
    <ol class="setup">
      <li><span class="k">Step 1</span><span class="icon-tile"><svg class="icon"><use href="#i-phone"/></svg></span><h3 class="h3">Connect</h3><p>We set up call forwarding on your number and connect your diary.</p></li>
      <li><span class="k">Step 2</span><span class="icon-tile"><svg class="icon"><use href="#i-book"/></svg></span><h3 class="h3">Train</h3><p>We load your services, prices, opening hours and booking rules.</p></li>
      <li><span class="k">Step 3</span><span class="icon-tile"><svg class="icon"><use href="#i-users"/></svg></span><h3 class="h3">Test together</h3><p>You ring it, try to trip it up and sign it off before customers hear it.</p></li>
      <li><span class="k">Step 4</span><span class="icon-tile"><svg class="icon"><use href="#i-check"/></svg></span><h3 class="h3">Go live</h3><p>Calls start flowing, and we check the first two weeks of live calls with you.</p></li>
    </ol>
    <p class="setup-note"><span><b>Starter:</b> 3 working days</span><span><b>Growth:</b> 5 to 7 working days</span><span><b>Scale:</b> 12 to 15 working days</span></p>
  </div>
</section>

<!-- ========== INDUSTRIES ========== -->
<section class="section bg-surface" id="industries" aria-labelledby="ind-h">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">Industries</p>
      <h2 class="h2" id="ind-h">An AI receptionist <span class="hl">trained for your industry</span></h2>
      <p class="lead">We start from a template built around the calls your sector actually gets, then tune it to your business.</p>
    </div>
    <div class="inds">
        <a class="ind" href="/ai-voice-agents/estate-letting-agents">
          <span class="icon-tile"><svg class="icon"><use href="#i-home"/></svg></span>
          <h3 class="ind-name">Estate &amp; Letting Agents</h3>
          <p class="ind-desc">Answers portal enquiries and books viewings and valuations while you are out with clients.</p>
          
          <span class="ind-link">AI receptionist for estate agents<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/dentists">
          <span class="icon-tile"><svg class="icon"><use href="#i-tooth"/></svg></span>
          <h3 class="ind-name">Dentists</h3>
          <p class="ind-desc">Books check-ups and hygiene visits, fills cancellations and passes on urgent calls.</p>
          <p class="ind-note">No clinical advice given.</p>
          <span class="ind-link">AI receptionist for dentists<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/healthcare">
          <span class="icon-tile"><svg class="icon"><use href="#i-cross"/></svg></span>
          <h3 class="ind-name">Clinics &amp; Healthcare</h3>
          <p class="ind-desc">GP, physio, pharmacy and private clinics: bookings, reminders and after-hours calls.</p>
          <p class="ind-note">No medical advice given.</p>
          <span class="ind-link">AI receptionist for clinics<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/plumbers">
          <span class="icon-tile"><svg class="icon"><use href="#i-drop"/></svg></span>
          <h3 class="ind-name">Plumbers</h3>
          <p class="ind-desc">Catches emergency calls and books jobs while you are on the tools.</p>
          
          <span class="ind-link">AI receptionist for plumbers<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/heating-hvac">
          <span class="icon-tile"><svg class="icon"><use href="#i-flame"/></svg></span>
          <h3 class="ind-name">Heating &amp; HVAC</h3>
          <p class="ind-desc">Takes boiler breakdown calls and books service visits through the winter rush.</p>
          
          <span class="ind-link">AI receptionist for heating engineers<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/builders-construction">
          <span class="icon-tile"><svg class="icon"><use href="#i-bell"/></svg></span>
          <h3 class="ind-name">Builders &amp; Construction</h3>
          <p class="ind-desc">Turns quote requests into booked site visits, with the job details captured.</p>
          
          <span class="ind-link">AI receptionist for builders<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/law-firms">
          <span class="icon-tile"><svg class="icon"><use href="#i-scale"/></svg></span>
          <h3 class="ind-name">Law Firms</h3>
          <p class="ind-desc">Takes new client intake calls for solicitors and books consultations.</p>
          <p class="ind-note">No legal advice given.</p>
          <span class="ind-link">AI receptionist for law firms<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
        <a class="ind" href="/ai-voice-agents/car-dealerships">
          <span class="icon-tile"><svg class="icon"><use href="#i-car"/></svg></span>
          <h3 class="ind-name">Car Dealerships</h3>
          <p class="ind-desc">Books test drives, MOTs and service slots, day or night.</p>
          
          <span class="ind-link">AI receptionist for car dealerships<svg class="icon"><use href="#i-arrow"/></svg></span>
        </a>
    </div>
  </div>
</section>

<!-- ========== UK ========== -->
<section class="section bg-sand" id="uk" aria-labelledby="uk-h">
  <div class="wrap">
    <div class="head">
      <p class="eyebrow">Made for the UK</p>
      <h2 class="h2" id="uk-h">A UK AI virtual receptionist, <span class="hl">not a US import</span></h2>
      <p class="lead">Many AI virtual receptionist tools are built for the US market. Ours is set up for how UK businesses and their customers work.</p>
    </div>
    <div class="uk">
      <div><span class="icon-tile"><svg class="icon"><use href="#i-pin"/></svg></span><h3 class="h3">Your number, or a local one</h3><p>Keep your existing number and divert calls, or get a new local number as part of setup.</p><div class="codes"><span>020 London</span><span>0121 Birmingham</span><span>0161 Manchester</span><span>0113 Leeds</span><span>0151 Liverpool</span><span>0117 Bristol</span></div></div>
      <div><span class="icon-tile"><svg class="icon"><use href="#i-mic"/></svg></span><h3 class="h3">A British voice</h3><p>Choose a voice and greeting that suit your business. It understands UK place names and postcodes.</p></div>
      <div><span class="icon-tile"><svg class="icon"><use href="#i-shield"/></svg></span><h3 class="h3">Set up for UK GDPR</h3><p>Callers are told when calls are recorded. You stay the data controller and we act as your processor under a written agreement.</p></div>
      <div><span class="icon-tile"><svg class="icon"><use href="#i-clock"/></svg></span><h3 class="h3">UK hours and bank holidays</h3><p>Follows your opening hours, your out-of-hours rules and the UK bank holiday calendar.</p></div>
      <div><span class="icon-tile"><svg class="icon"><use href="#i-pound"/></svg></span><h3 class="h3">Billed monthly in pounds</h3><p>One monthly price in £ plus VAT, no minimum contract and 30 days' notice.</p></div>
      <div><span class="icon-tile"><svg class="icon"><use href="#i-users"/></svg></span><h3 class="h3">A UK team behind it</h3><p>Talk to a person on our team in Essex, not a ticket queue. Call 020 3489 3934.</p></div>
    </div>
  </div>
</section>

<!-- ========== PRICING ========== -->
<section class="section" id="pricing" aria-labelledby="price-h">
  <div class="wrap">
    <div class="head center">
      <p class="eyebrow">Pricing</p>
      <h2 class="h2" id="price-h">AI receptionist pricing</h2>
      <p class="lead">Our Starter plan is a fully managed AI receptionist. Growth and Scale add live transfers, CRM updates and more locations. Billed monthly, no minimum contract. Prices exclude VAT.</p>
    </div>
    <div class="plans">
      <article class="plan feat-p">
        <span class="plan-flag">The AI receptionist plan</span>
        <h3 class="h3">Starter</h3>
        <p class="who">One location, one receptionist answering and booking.</p>
        <p class="amt">£249<small>a month + VAT, billed monthly</small></p>
        <div class="facts"><div><b>Included</b><span>300 min</span></div><div><b>Setup</b><span>£795</span></div><div><b>Live in</b><span>3 days</span></div></div>
        <ul>
          <li><svg class="icon"><use href="#i-check"/></svg>Answers every inbound call, day and night, on your existing number</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Answers only from your approved information</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Books appointments into one calendar</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Takes a proper message with name, number and reason</li>
        </ul>
        <a class="btn btn-primary" href="#book-demo-form">Book a 30-Minute Demo</a>
      </article>
      <article class="plan">
        <h3 class="h3">Growth</h3>
        <p class="who">For one site where the phone is a real sales channel.</p>
        <p class="amt">£449<small>a month + VAT, billed monthly</small></p>
        <div class="facts"><div><b>Included</b><span>500 min</span></div><div><b>Setup</b><span>£1,295</span></div><div><b>Live in</b><span>5 to 7 days</span></div></div>
        <ul>
          <li><svg class="icon"><use href="#i-check"/></svg>Everything in Starter</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Live transfer to a person, with the caller's details passed across</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Out-of-hours and overflow rules you set</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Writes each enquiry into your CRM or practice system</li>
        </ul>
        <a class="btn btn-secondary" href="#book-demo-form">Book a 30-Minute Demo</a>
      </article>
      <article class="plan">
        <h3 class="h3">Scale</h3>
        <p class="who">Several locations or departments, on one managed service.</p>
        <p class="amt">£849<small>a month + VAT, billed monthly</small></p>
        <div class="facts"><div><b>Included</b><span>900 min</span></div><div><b>Setup</b><span>£1,995</span></div><div><b>Live in</b><span>12 to 15 days</span></div></div>
        <ul>
          <li><svg class="icon"><use href="#i-check"/></svg>Everything in Growth</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Up to three locations, each with its own script, voice and diary</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Routing across branches</li>
          <li><svg class="icon"><use href="#i-check"/></svg>Per-site reporting</li>
        </ul>
        <a class="btn btn-secondary" href="#book-demo-form">Book a 30-Minute Demo</a>
      </article>
    </div>
    <div class="price-notes">
      <p><b>Minutes</b>Extra minutes cost 60p each on every plan. We warn you at 80% of your allowance.</p>
      <p><b>Setup</b>Covers discovery, the build, integrations and supervised checks on your first two weeks of live calls.</p>
      <p><b>Contract</b>Billed monthly, with 30 days' notice.</p>
      <p><b>Full details</b><a class="ilink" href="/ai-voice-agents#pricing">See everything included on every plan</a></p>
    </div>
  </div>
</section>

<!-- ========== FAQ ========== -->
<section class="section bg-surface" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq">
    <div class="faq-side">
      <p class="eyebrow">Questions</p>
      <h2 class="h2" id="faq-h">AI receptionist <span class="hl">FAQs</span></h2>
      <p class="lead">Straight answers to the questions business owners ask us most.</p>
      <div class="help">
        <h3 class="h3">Still have a question?</h3>
        <p>Talk to a person on our UK team. No sales script.</p>
        <a class="l" href="tel:+442034893934"><svg class="icon"><use href="#i-phone"/></svg>020 3489 3934</a>
        <a class="l" href="mailto:support@onlinemarketinghelp.co.uk"><svg class="icon"><use href="#i-mail"/></svg>support@onlinemarketinghelp.co.uk</a>
        <a class="btn btn-primary" href="#book-demo-form">Book a 30-Minute Demo</a>
      </div>
    </div>
    <div class="accs">
        <details class="acc" open>
          <summary><span class="acc-n">01</span><h3>What does an AI receptionist do?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>An AI receptionist answers your business calls in a natural British voice. It greets callers, answers questions from information you have approved, such as services, prices and opening hours, books appointments into your calendar and takes a proper message when it can&#x27;t help. You get a summary of every call, so nothing is lost.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">02</span><h3>What is the difference between an AI receptionist and an AI voice agent?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>An AI receptionist is the front-desk job: answering inbound calls, booking appointments and taking messages. An <a class="ilink" href="/ai-voice-agents">AI voice agent</a> can also call new web leads back, follow up quotes and route calls between departments. Our Starter plan works as an AI receptionist, and the Growth and Scale plans add the wider voice agent features.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">03</span><h3>How much does an AI receptionist cost in the UK?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>Self-serve AI receptionist apps in the UK usually cost between £19 and £99 a month, and you build and maintain them yourself. Our managed AI receptionist starts at £249 a month plus VAT with 300 minutes included, and a one-off setup fee of £795. Extra minutes cost 60p each. A full-time human receptionist typically costs over £2,000 a month once salary, National Insurance and pension are counted.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">04</span><h3>Is there a free AI receptionist?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>Some apps offer free trials or limited free plans, but a free tool won&#x27;t know your business, connect to your diary or be tested on your real calls. If you want to hear what a properly built one sounds like, ring our demo agent or book a 30-minute demo.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">05</span><h3>How do I set up an AI receptionist?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>With OMH you don&#x27;t set it up yourself. We connect your phone line and calendar, train the receptionist on your services, prices and booking rules, test it with you, then go live. On the Starter plan that takes as little as 3 working days.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">06</span><h3>Will callers know they are talking to an AI?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>Yes. Every receptionist we build says it is an AI assistant at the start of the call. Callers deserve to know, and it avoids awkward moments later in the conversation.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">07</span><h3>Can I keep my existing business number?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>In most cases, yes. You divert calls to the AI receptionist, either all of them or only the ones your team can&#x27;t answer. If you want a new local number, such as a 0161 number for Manchester, we can arrange one during setup.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">08</span><h3>Is an AI receptionist GDPR compliant?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>It can be, when it is set up properly. Callers are told at the start if calls are recorded. You remain the data controller and OMH acts as your processor under a written agreement, and we agree retention periods with you before go-live.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">09</span><h3>What happens if it can&#x27;t answer a question?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>It only answers from your approved information. If a caller asks something outside that, it takes a proper message with their name, number and reason for calling. On the Growth and Scale plans it can also transfer the call live to a person, passing on everything the caller has already said.</p></div>
        </details>
        <details class="acc">
          <summary><span class="acc-n">10</span><h3>Does it answer out of hours and more than one call at once?</h3><span class="acc-i" aria-hidden="true"><svg class="icon"><use href="#i-chev"/></svg></span></summary>
          <div class="acc-b"><p>Yes. It answers 24 hours a day, including evenings, weekends and bank holidays, and it can handle several calls at the same time, so callers never hear an engaged tone.</p></div>
        </details>
    </div>
  </div>
</section>

<!-- ========== FINAL CTA ========== -->
<section class="section" id="book-demo" aria-labelledby="cta-h">
  <div class="wrap">
    <div class="final">
      <h2 class="h2" id="cta-h">Stop sending callers to voicemail</h2>
      <p>Book a 30-minute demo by video or phone. We'll play you a receptionist built for your industry and show you exactly how it would handle your calls.</p>
      <div class="ctas" style="margin-top:.5rem"><a class="btn btn-primary" href="#book-demo-form">Book a 30-Minute Demo</a><a class="btn btn-secondary" href="tel:+442034893934"><svg class="icon"><use href="#i-phone"/></svg>Call 020 3489 3934</a></div>
    </div>
  </div>
</section>
`;
