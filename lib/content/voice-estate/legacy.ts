// Body of /ai-voice-agents/real-estate-letting-agents, part 2 (21 Oct 2026): the main page's kept sections (agency
// types grid, client feedback, fit checker, ROI calculator, comparison, FAQ, sticky bar), written for estate and
// letting agents. Same structure, classes and data-* hooks as lib/content/ai-voice-agents-legacy.ts.
import { roiCalculator } from "@/lib/content/roi-calculator";
import { estateFaqs as voiceFaqs } from "@/lib/content/voice-estate/markup";

// Comparison table from the SEO brief (19 Oct 2026). Guide figures: Connect Communications call answering
// from £14.99 + VAT; UK receptionist base pay about £19k to £24k a year (Payscale) before employer costs;
// RingCentral AI Receptionist from £32 a month. Recheck every six months.
const cmpCols = ["OMH AI voice agent", "Voicemail", "Answering service", "Receptionist", "DIY platform"];
const cmpRows = [
  ["Typical monthly cost", "From £249 + VAT", "Free", "From about £15, rising with call volume", "Around £2,000+ with employer costs", "From about £30, plus usage"],
  ["Evenings, Sundays and bank holidays", "Yes, every one", "Records a message, if callers leave one", "Depends on the plan", "Branch hours only", "Yes"],
  ["Books viewings into your diary", "Yes, while the buyer is on the line", "No", "Sometimes, by hand", "Yes", "If you connect it yourself"],
  ["When a new listing goes live", "Every caller answered at once", "One message at a time", "Depends on staffing", "One call at a time", "Many at once"],
  ["Knows your listings and fees", "Loaded and kept up to date by us", "No", "A short script", "Best of all", "As well as you set it up"],
  ["Offers and tenant emergencies", "Put through by your rules (Growth and Scale)", "Wait until someone listens", "A message passed on", "Handled in person", "If you build the routing"],
  ["Setup and upkeep", "We build, test and tune it", "None", "Low", "Recruiting, training and holiday cover", "You build and maintain it"],
  ["Results in your marketing report", "Beside your ads and website (Scale)", "No", "Call logs only", "Kept by hand", "A separate dashboard"],
];

const faqItem = ({ q, a, cat }: (typeof voiceFaqs)[number], i: number) => `      <details class="group rounded-[14px] border border-line bg-paper transition-colors open:border-[var(--va-line-strong)] open:bg-surface open:shadow-[0_18px_40px_-30px_rgb(16_24_40/0.45)]" data-faq-item data-cat="${cat}"${i ? "" : " open"} data-track-name="${q}">
        <summary class="flex min-h-[64px] items-center gap-4 px-5 py-4">
          <span class="num hidden w-7 shrink-0 text-[15px] sm:block" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <span class="min-w-0 flex-1">
            <h3 class="!text-[clamp(18px,17px+.3vw,20.5px)] !leading-[1.3]">${q}</h3>
          </span>
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--va-line-strong)] group-open:border-gold group-open:bg-gold group-open:text-navy"><svg class="icon faq-chevron" aria-hidden="true" focusable="false"><use href="#i-chevron-down"/></svg></span>
        </summary>
        <div class="px-5 pb-6 text-[16px] text-muted sm:pl-[4.25rem]">
          <p data-faq-answer>${a}</p>
        </div>
      </details>`;

export const estateLegacyMarkup = String.raw`
<section id="industries" data-component="Industries" class="bg-surface">
  <div class="container-omh py-14 lg:py-20">
    <div>
      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Agencies</p>
        <h2 style="max-width:28ch">Built for every kind of<br class="max-sm:hidden"> <span class="hl">estate agency</span></h2>
      </div>
      <p class="mt-5 text-muted">We set up AI voice agents for sales agents, lettings and property management teams, mixed branches, multi-branch groups and new homes sales, each one scripted around the calls that team gets.</p>
    </div>

    <div role="group" aria-label="Filter by type of agency" class="mt-10 flex flex-wrap gap-2" data-industry-filters data-nouns="agency type,agency types">
      <button type="button" class="filter-btn min-h-[48px] rounded-full border border-[var(--va-line-strong)] px-5 text-[16.5px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-filter="all" aria-pressed="true" data-track="industry_filter" data-track-name="all">All agencies</button>
      <button type="button" class="filter-btn min-h-[48px] rounded-full border border-[var(--va-line-strong)] px-5 text-[16.5px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-filter="sales" aria-pressed="false" data-track="industry_filter" data-track-name="sales">Sales</button>
      <button type="button" class="filter-btn min-h-[48px] rounded-full border border-[var(--va-line-strong)] px-5 text-[16.5px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-filter="lettings" aria-pressed="false" data-track="industry_filter" data-track-name="lettings">Lettings</button>
      <button type="button" class="filter-btn min-h-[48px] rounded-full border border-[var(--va-line-strong)] px-5 text-[16.5px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-filter="groups" aria-pressed="false" data-track="industry_filter" data-track-name="groups">Branches and groups</button>
    </div>
    <p class="sr-only" aria-live="polite" data-industry-count></p>

    <div class="mt-8 grid gap-5 lg:grid-cols-2" data-industry-list>
      <article class="grid items-start gap-4 rounded-[18px] border border-line bg-surface p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6" data-industry data-group="sales">
        <span class="block h-[120px] w-full rounded-[12px] bg-paper p-2 sm:w-[160px]" aria-hidden="true"><svg viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="78" ry="14.04" class="il-shadow"/>
    <rect x="38" y="64" width="86" height="64" rx="3" class="il-wall"/>
    <path d="M30 68 L81 26 L132 68 Z" class="il-roof"/>
    <rect x="70" y="92" width="22" height="36" rx="2" class="il-ink"/>
    <rect x="48" y="78" width="16" height="14" rx="2" class="il-win"/><rect x="98" y="78" width="16" height="14" rx="2" class="il-win"/>
    <rect x="152" y="70" width="4" height="60" class="il-ink"/>
    <rect x="132" y="70" width="44" height="26" rx="3" class="il-gold"/>
    <text x="154" y="87" text-anchor="middle" class="il-label">FOR SALE</text>
    <g class="il-bubble" transform="translate(128 14)">
    <rect x="0" y="0" width="54" height="38" rx="10" class="il-card"/>
    <path d="M14 38 L10 48 L24 38 Z" class="il-card"/>
    <rect x="10" y="9" width="22" height="20" rx="3" class="il-line"/><path d="M10 15 H32" class="il-stroke"/><circle cx="40" cy="19" r="9" class="il-ok"/><path d="M36 19 l3 3 l5 -6" class="il-tick"/>
  </g>
  </svg></span>
        <div class="min-w-0">
        <h3 class="!text-[21px]">Sales Agents</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-muted">Buyers ring the moment a listing goes live. Every enquiry is answered and the viewing booked, even when the whole office is out.</p>
        <ul class="mt-4 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Book viewings and valuations</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Qualify buyers: chain, mortgage and timescale</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Put offers through to the negotiator</span></li>
        </ul>
        </div>
      </article>
      <article class="grid items-start gap-4 rounded-[18px] border border-line bg-surface p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6" data-industry data-group="lettings">
        <span class="block h-[120px] w-full rounded-[12px] bg-paper p-2 sm:w-[160px]" aria-hidden="true"><svg viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="78" ry="14.04" class="il-shadow"/>
    <rect x="38" y="64" width="86" height="64" rx="3" class="il-wall"/>
    <path d="M30 68 L81 26 L132 68 Z" class="il-roof"/>
    <rect x="70" y="92" width="22" height="36" rx="2" class="il-ink"/>
    <rect x="48" y="78" width="16" height="14" rx="2" class="il-win"/><rect x="98" y="78" width="16" height="14" rx="2" class="il-win"/>
    <rect x="152" y="70" width="4" height="60" class="il-ink"/>
    <rect x="132" y="70" width="44" height="26" rx="3" class="il-gold"/>
    <text x="154" y="87" text-anchor="middle" class="il-label">TO LET</text>
    <g class="il-bubble" transform="translate(128 14)">
    <rect x="0" y="0" width="54" height="38" rx="10" class="il-card"/>
    <path d="M14 38 L10 48 L24 38 Z" class="il-card"/>
    <circle cx="20" cy="19" r="7" class="il-goldline"/><path d="M27 19 H44 M38 19 V25 M43 19 V24" class="il-stroke"/>
  </g>
  </svg></span>
        <div class="min-w-0">
        <h3 class="!text-[21px]">Lettings Agents</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-muted">Applicants ring about several flats at once. The agent asks your questions and books viewings for the ones who fit.</p>
        <ul class="mt-4 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Qualify applicants before a viewing</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Book viewings and landlord valuations</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Answer the fee questions you approve</span></li>
        </ul>
        </div>
      </article>
      <article class="grid items-start gap-4 rounded-[18px] border border-line bg-surface p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6" data-industry data-group="lettings">
        <span class="block h-[120px] w-full rounded-[12px] bg-paper p-2 sm:w-[160px]" aria-hidden="true"><svg viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="78" ry="14.04" class="il-shadow"/>
    <rect x="46" y="30" width="76" height="98" rx="3" class="il-wall"/>
    <rect x="46" y="30" width="76" height="10" rx="3" class="il-ink"/>
    <rect x="56" y="50" width="14" height="10" rx="2" class="il-win"/><rect x="77" y="50" width="14" height="10" rx="2" class="il-win"/><rect x="98" y="50" width="14" height="10" rx="2" class="il-win"/>
    <rect x="56" y="66" width="14" height="10" rx="2" class="il-win"/><rect x="77" y="66" width="14" height="10" rx="2" class="il-win"/><rect x="98" y="66" width="14" height="10" rx="2" class="il-win"/>
    <rect x="56" y="82" width="14" height="10" rx="2" class="il-win"/><rect x="77" y="82" width="14" height="10" rx="2" class="il-win"/><rect x="98" y="82" width="14" height="10" rx="2" class="il-win"/>
    <rect x="56" y="98" width="14" height="10" rx="2" class="il-win"/><rect x="77" y="98" width="14" height="10" rx="2" class="il-win"/><rect x="98" y="98" width="14" height="10" rx="2" class="il-win"/>
    <rect x="76" y="112" width="16" height="16" rx="2" class="il-ink"/>
    <g class="il-bubble" transform="translate(130 12)">
    <rect x="0" y="0" width="54" height="38" rx="10" class="il-card"/>
    <path d="M14 38 L10 48 L24 38 Z" class="il-card"/>
    <path d="M15 29 L30 14" class="il-stroke"/><circle cx="34" cy="11" r="6" class="il-goldline"/><circle cx="42" cy="28" r="6" class="il-ok"/><path d="M39 28 l2 2 l4 -4" class="il-tick"/>
  </g>
  </svg></span>
        <div class="min-w-0">
        <h3 class="!text-[21px]">Property Management</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-muted">Tenants ring about repairs at all hours. Emergencies reach whoever is on call and the rest are logged for the morning.</p>
        <ul class="mt-4 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Log repairs with access details</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Route emergencies to the on-call manager</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Pass landlords to their property manager</span></li>
        </ul>
        <p class="mt-3 flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 text-[16px] font-semibold"><svg class="icon text-hl" aria-hidden="true" focusable="false"><use href="#i-shield"/></svg><span>Never authorises repair costs.</span></p>
        </div>
      </article>
      <article class="grid items-start gap-4 rounded-[18px] border border-line bg-surface p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6" data-industry data-group="groups">
        <span class="block h-[120px] w-full rounded-[12px] bg-paper p-2 sm:w-[160px]" aria-hidden="true"><svg viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="78" ry="14.04" class="il-shadow"/>
    <rect x="38" y="64" width="86" height="64" rx="3" class="il-wall"/>
    <path d="M30 68 L81 26 L132 68 Z" class="il-roof"/>
    <rect x="70" y="92" width="22" height="36" rx="2" class="il-ink"/>
    <rect x="48" y="78" width="16" height="14" rx="2" class="il-win"/><rect x="98" y="78" width="16" height="14" rx="2" class="il-win"/>
    <rect x="152" y="70" width="4" height="60" class="il-ink"/>
    <rect x="128" y="70" width="52" height="26" rx="3" class="il-gold"/>
    <text x="154" y="87" text-anchor="middle" class="il-label">SALE · LET</text>
    <g class="il-bubble" transform="translate(124 12)">
    <rect x="0" y="0" width="54" height="38" rx="10" class="il-card"/>
    <path d="M14 38 L10 48 L24 38 Z" class="il-card"/>
    <path d="M10 13 H40 M34 8 L40 13 L34 18 M44 26 H14 M20 21 L14 26 L20 31" class="il-stroke"/>
  </g>
  </svg></span>
        <div class="min-w-0">
        <h3 class="!text-[21px]">Sales &amp; Lettings Branches</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-muted">One phone line, two teams. The agent works out at the first question whether it's sales or lettings and routes the call.</p>
        <ul class="mt-4 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Routes sales and lettings calls apart</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Books into each team's own diary</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Sends each team its own summary</span></li>
        </ul>
        </div>
      </article>
      <article class="grid items-start gap-4 rounded-[18px] border border-line bg-surface p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6" data-industry data-group="groups">
        <span class="block h-[120px] w-full rounded-[12px] bg-paper p-2 sm:w-[160px]" aria-hidden="true"><svg viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="78" ry="14.04" class="il-shadow"/>
    <rect x="22" y="72" width="46" height="56" rx="3" class="il-wall"/><rect x="20" y="64" width="50" height="12" rx="3" class="il-gold"/><rect x="28" y="86" width="16" height="14" rx="2" class="il-win"/><rect x="49" y="98" width="13" height="30" rx="2" class="il-ink"/>
    <rect x="78" y="72" width="46" height="56" rx="3" class="il-wall"/><rect x="76" y="64" width="50" height="12" rx="3" class="il-gold"/><rect x="84" y="86" width="16" height="14" rx="2" class="il-win"/><rect x="105" y="98" width="13" height="30" rx="2" class="il-ink"/>
    <rect x="134" y="72" width="46" height="56" rx="3" class="il-wall"/><rect x="132" y="64" width="50" height="12" rx="3" class="il-gold"/><rect x="140" y="86" width="16" height="14" rx="2" class="il-win"/><rect x="161" y="98" width="13" height="30" rx="2" class="il-ink"/>
    <g class="il-bubble" transform="translate(73 6)">
    <rect x="0" y="0" width="54" height="38" rx="10" class="il-card"/>
    <path d="M14 38 L10 48 L24 38 Z" class="il-card"/>
    <path d="M12 19 H42" class="il-stroke"/><circle cx="12" cy="19" r="5" class="il-ok"/><circle cx="27" cy="19" r="5" class="il-goldline"/><circle cx="42" cy="19" r="5" class="il-goldline"/>
  </g>
  </svg></span>
        <div class="min-w-0">
        <h3 class="!text-[21px]">Multi-Branch Groups</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-muted">Each branch keeps its own greeting, diary and rules, on one managed service with one monthly report.</p>
        <ul class="mt-4 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>A greeting and diary for each branch</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Routing by area or by what the caller asks</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Per-branch reports on calls and bookings</span></li>
        </ul>
        </div>
      </article>
      <article class="grid items-start gap-4 rounded-[18px] border border-line bg-surface p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6" data-industry data-group="sales">
        <span class="block h-[120px] w-full rounded-[12px] bg-paper p-2 sm:w-[160px]" aria-hidden="true"><svg viewBox="0 0 200 150" class="h-full w-full" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="78" ry="14.04" class="il-shadow"/>
    <rect x="38" y="64" width="86" height="64" rx="3" class="il-wall"/>
    <path d="M30 68 L81 26 L132 68 Z" class="il-roof"/>
    <rect x="70" y="92" width="22" height="36" rx="2" class="il-ink"/>
    <rect x="48" y="78" width="16" height="14" rx="2" class="il-win"/><rect x="98" y="78" width="16" height="14" rx="2" class="il-win"/>
    <path d="M32 128 V56 M130 128 V56 M32 100 H130 M32 76 H130" class="il-scaffold"/>
    <rect x="152" y="70" width="4" height="60" class="il-ink"/>
    <rect x="125" y="70" width="58" height="26" rx="3" class="il-gold"/>
    <text x="154" y="87" text-anchor="middle" class="il-label">NEW HOMES</text>
  </svg></span>
        <div class="min-w-0">
        <h3 class="!text-[21px]">New Homes &amp; Developers</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-muted">Interest spikes when a development launches. The agent answers the plot and site questions you approve and books sales suite appointments.</p>
        <ul class="mt-4 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Answers from your approved plot list</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Books sales suite appointments</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] text-hl" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span>Registers interest for the next release</span></li>
        </ul>
        </div>
      </article>
            <aside class="on-band grid items-center gap-4 rounded-[18px] bg-band p-5 text-band-ink sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6 lg:col-span-2" aria-labelledby="industries-cta-title">
        <span class="grid size-[88px] place-items-center rounded-[12px] bg-white/5 sm:size-[120px]" aria-hidden="true"><span class="grid size-14 place-items-center rounded-[14px] sm:size-16 bg-gold text-navy"><svg class="icon !h-7 !w-7" aria-hidden="true" focusable="false"><use href="#i-phone"/></svg></span></span>
        <div class="min-w-0">
        <h3 id="industries-cta-title" class="!text-[21px]">Run your branch a different way?</h3>
        <p class="mt-2 text-[16px] leading-[1.5] text-band-muted">Tell us how your branch works and who rings it. We'll show you what an agent would handle and what it would pass to your team.</p>
        <div class="pt-4">
          <a href="#book-demo-form" class="btn btn-primary" data-track="industries_cta_book_demo">Book a Voice Agent Demo</a>
        </div>
        </div>
      </aside>
    </div>
  </div>
</section>

<section id="feedback" data-component="ClientFeedback">
  <div class="container-omh py-14 lg:py-20">
    <div>
      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Client feedback</p>
        <h2>Proof goes here <span class="hl">when it's real</span></h2>
      </div>
      <p class="mt-5 text-muted">Voice agents are a new service for us, so we haven't filled this wall with invented praise. The first recording is a real estate call; the others are reserved for agencies and stay pending until we have checked their results.</p>
    </div>

    <dl class="mt-12 grid border-y border-[var(--va-line-strong)] sm:grid-cols-3">
      <div class="py-5 sm:pr-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">1,284</dd><dt class="mt-1.5 text-[16px] text-muted">calls answered</dt></div>
      <div class="border-t border-line py-5 sm:border-l sm:border-t-0 sm:px-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">317</dd><dt class="mt-1.5 text-[16px] text-muted">bookings made</dt></div>
      <div class="border-t border-line py-5 sm:border-l sm:border-t-0 sm:pl-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">38%</dd><dt class="mt-1.5 text-[16px] text-muted">answered out of hours</dt></div>
    </dl>

    <div class="va-car mt-10" data-carousel data-autoplay>
    <div class="va-car-track" style="--car-w:380px" tabindex="0" aria-label="Client feedback, scroll sideways">
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-1)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-home"/></svg></span>
          <button type="button" class="audio-toggle" data-audio-toggle aria-label="Play the recording" data-track="feedback_audio_play" data-track-name="AI Voice Agent for Real Estate"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" data-audio-wave role="slider" tabindex="0" aria-label="Recording position" aria-valuemin="0" aria-valuemax="141" aria-valuenow="0" aria-valuetext="0:00 of 2:21"><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i></div>
            <span class="audio-time tnum" data-audio-time>0:00 / 2:21</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Real Estate</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">A recorded call with our AI voice agent answering a property enquiry for a real estate agency.</p>
        </figcaption>
        <audio preload="none" src="/audio/Realest%20voice%20agent.m4a" data-audio></audio>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-2)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-key"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Letting Agents</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent qualifying a rental applicant and booking the viewing.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-3)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-clipboard"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Valuations</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent booking a valuation for a homeowner thinking of selling.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-4)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-wrench"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Property Management</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent putting a tenant's out-of-hours leak through to the on-call manager.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-1)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-map-pin"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for New Homes</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent answering plot questions and booking a sales suite appointment.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-3)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-users"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Multi-Branch Agencies</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent sending a caller to the right branch by the area they ask about.</p>
        </figcaption>
      </figure>
    </div>
    <div class="va-car-ui">
      <button type="button" class="va-car-btn" data-car-prev aria-label="Previous testimonial"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-arrow-left"/></svg></button>
      <div class="va-car-wave" aria-hidden="true" data-car-wave><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:55%"></i><i style="--h:90%"></i><i style="--h:45%"></i><i style="--h:75%"></i></div>
      <span class="va-car-status" data-car-status aria-live="polite">1 / 6</span>
      <button type="button" class="va-car-btn" data-car-next aria-label="Next testimonial"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-arrow-right"/></svg></button>
    </div>
    </div>
  </div>
</section>


<section id="right-fit" data-component="RightFit" class="bg-surface">
  <div class="container-omh py-14 lg:py-20">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:items-start" data-fit>
      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Is it the right fit?</p>
        <h2>A voice agent <span class="hl">isn't for everyone</span></h2>
        <p class="mt-5 text-muted">We'd rather tell you now than three months in. Answer five quick questions about your branch and see for yourself. Nothing is sent anywhere.</p>
        <form class="hover-card mt-8 rounded-[18px] border border-line bg-paper p-5 sm:p-6" data-fit-form>
          <ol class="divide-y divide-line">
          <li>
            <fieldset class="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <legend class="float-left pr-2 text-[16px] leading-snug"><span class="num mr-2 text-[14px]">01</span>Do calls ring out while your team is on viewings or closed?</legend>
              <span class="flex shrink-0 gap-1.5">
                <label class="relative"><input type="radio" name="fit-q0" value="yes" class="peer sr-only" data-fit-q="0" data-track="fit_check_answer" data-track-name="Q1 yes"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">Yes</span></label>
                <label class="relative"><input type="radio" name="fit-q0" value="no" class="peer sr-only" data-fit-q="0" data-track="fit_check_answer" data-track-name="Q1 no"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">No</span></label>
              </span>
            </fieldset>
          </li>
          <li>
            <fieldset class="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <legend class="float-left pr-2 text-[16px] leading-snug"><span class="num mr-2 text-[14px]">02</span>Are most calls viewings, valuations and the same few questions?</legend>
              <span class="flex shrink-0 gap-1.5">
                <label class="relative"><input type="radio" name="fit-q1" value="yes" class="peer sr-only" data-fit-q="1" data-track="fit_check_answer" data-track-name="Q2 yes"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">Yes</span></label>
                <label class="relative"><input type="radio" name="fit-q1" value="no" class="peer sr-only" data-fit-q="1" data-track="fit_check_answer" data-track-name="Q2 no"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">No</span></label>
              </span>
            </fieldset>
          </li>
          <li>
            <fieldset class="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <legend class="float-left pr-2 text-[16px] leading-snug"><span class="num mr-2 text-[14px]">03</span>Could one missed call cost you a sale, a let or an instruction?</legend>
              <span class="flex shrink-0 gap-1.5">
                <label class="relative"><input type="radio" name="fit-q2" value="yes" class="peer sr-only" data-fit-q="2" data-track="fit_check_answer" data-track-name="Q3 yes"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">Yes</span></label>
                <label class="relative"><input type="radio" name="fit-q2" value="no" class="peer sr-only" data-fit-q="2" data-track="fit_check_answer" data-track-name="Q3 no"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">No</span></label>
              </span>
            </fieldset>
          </li>
          <li>
            <fieldset class="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <legend class="float-left pr-2 text-[16px] leading-snug"><span class="num mr-2 text-[14px]">04</span>Do you book viewings in a diary or property software?</legend>
              <span class="flex shrink-0 gap-1.5">
                <label class="relative"><input type="radio" name="fit-q3" value="yes" class="peer sr-only" data-fit-q="3" data-track="fit_check_answer" data-track-name="Q4 yes"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">Yes</span></label>
                <label class="relative"><input type="radio" name="fit-q3" value="no" class="peer sr-only" data-fit-q="3" data-track="fit_check_answer" data-track-name="Q4 no"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">No</span></label>
              </span>
            </fieldset>
          </li>
          <li>
            <fieldset class="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <legend class="float-left pr-2 text-[16px] leading-snug"><span class="num mr-2 text-[14px]">05</span>Are you happy for callers to be told they are speaking to an AI?</legend>
              <span class="flex shrink-0 gap-1.5">
                <label class="relative"><input type="radio" name="fit-q4" value="yes" class="peer sr-only" data-fit-q="4" data-track="fit_check_answer" data-track-name="Q5 yes"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">Yes</span></label>
                <label class="relative"><input type="radio" name="fit-q4" value="no" class="peer sr-only" data-fit-q="4" data-track="fit_check_answer" data-track-name="Q5 no"><span class="flex min-h-[40px] min-w-[56px] items-center justify-center rounded-full border border-[var(--va-line-strong)] px-3 text-[15px] font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--va-hl)]">No</span></label>
              </span>
            </fieldset>
          </li>
          </ol>
          <div class="mt-5 flex flex-col items-start gap-4 rounded-[14px] bg-sand p-5 sm:flex-row sm:items-center sm:gap-5" aria-live="polite" data-fit-result data-state="empty">
            <svg viewBox="-6 0 212 136" class="shrink-0" role="img" aria-label="Fit gauge" data-fit-gauge>
              <path d="M20 100 A80 80 0 0 1 180 100" class="fit-track"/>
              <path d="M20 100 A80 80 0 0 1 180 100" class="fit-fill" style="stroke-dasharray:251.3;stroke-dashoffset:251.3" data-fit-arc data-arc="251.3"/>
              <g class="fit-needle" style="transform:rotate(-90deg)" data-fit-needle><line x1="100" y1="100" x2="100" y2="34"/><circle cx="100" cy="100" r="7"/></g>
              <text x="20" y="132" class="fit-tick" text-anchor="middle">0</text>
              <text x="180" y="132" class="fit-tick" text-anchor="middle">5</text>
            </svg>
            <div class="min-w-0 flex-1">
              <p class="font-display text-[24px] font-semibold leading-tight" data-fit-title>Start with question 1</p>
              <p class="mt-1.5 text-[16px] leading-snug text-muted" data-fit-text>Tap Yes or No on each question. Your fit builds here as you answer.</p>
              <div class="fit-dots mt-3" aria-hidden="true" data-fit-dots><i></i><i></i><i></i><i></i><i></i></div>
              <p class="mt-1.5 text-[15px] font-semibold text-muted tnum" data-fit-count>0 of 5 answered</p>
              <a href="#book-demo-form" class="btn btn-primary mt-3" data-fit-cta data-track="fit_check_book_demo" hidden>Book a 30-Minute Demo</a>
            </div>
            <button type="reset" class="inline-flex min-h-[44px] items-center gap-1.5 self-start text-[15px] font-semibold text-muted hover:text-ink" data-track="fit_check_reset"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-replay"/></svg>Start again</button>
          </div>
        </form>
      </div>
      <div class="grid gap-5 lg:mt-[4.5rem]">
        <div class="hover-card rounded-[18px] border border-[color-mix(in_srgb,var(--va-ok)_35%,transparent)] bg-[color-mix(in_srgb,var(--va-ok)_7%,var(--va-surface))] p-5 sm:p-6">
          <h3 class="flex items-center gap-3 !text-[20px]"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-surface"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg></span>A good fit if</h3>
          <ul class="mt-4 space-y-2.5 text-[16px] leading-snug text-muted [&_.icon]:text-ok">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span><strong class="font-semibold text-ink">You miss calls</strong> while negotiators are on viewings, at lunch or after the branch closes.</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span><strong class="font-semibold text-ink">Most calls repeat themselves:</strong> viewings, valuations, fees and availability.</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span><strong class="font-semibold text-ink">An instruction or a let is worth real money,</strong> so one missed call can cost more than the agent.</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-check"/></svg><span><strong class="font-semibold text-ink">You keep a viewing diary or property software</strong> the agent can book into.</span></li>
          </ul>
        </div>
        <div class="hover-card rounded-[18px] border border-line bg-paper p-5 sm:p-6">
          <h3 class="flex items-center gap-3 !text-[20px]"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-[var(--va-line-strong)] text-muted"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-x"/></svg></span>Not the right fit if</h3>
          <ul class="mt-4 space-y-2.5 text-[16px] leading-snug text-muted [&_.icon]:text-muted">
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-x"/></svg><span><strong class="font-semibold text-ink">Your phone is quiet</strong> and you already answer every call.</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-x"/></svg><span><strong class="font-semibold text-ink">Every call needs a negotiator from the first sentence.</strong> A good receptionist or answering service will serve you better.</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-x"/></svg><span><strong class="font-semibold text-ink">You want it to discuss offers or prices.</strong> It never will. Those calls always go to a person.</span></li>
          <li class="flex gap-2.5"><svg class="icon mt-[3px] shrink-0" aria-hidden="true" focusable="false"><use href="#i-x"/></svg><span><strong class="font-semibold text-ink">You want callers to think it's a person, or want to cold call people who haven't agreed to hear from you.</strong> We won't build either.</span></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

${roiCalculator("real-estate")}

<section id="compare" data-component="Compare">
  <div class="container-omh py-14 lg:py-20">
    <div>
      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Compare your options</p>
        <h2>How an AI voice agent compares with <span class="hl">the usual answers</span></h2>
      </div>
      <p class="mt-5 text-muted">Most agencies handle missed calls with voicemail, an answering service, more staff on the phones or a DIY tool. Here's an honest side-by-side for a sales and lettings branch, including where each option wins.</p>
    </div>

    <div class="mt-12 hidden overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_30px_60px_-45px_rgb(16_24_40/0.45)] lg:block">
      <table class="cmp-table w-full border-separate border-spacing-0 text-left text-[16px] leading-snug">
        <caption class="sr-only">OMH AI voice agent compared with voicemail, an answering service, a receptionist and a DIY platform</caption>
        <thead>
          <tr>
            <th scope="col" class="w-[16%] px-5 pb-4 pt-5 align-bottom text-[16px] font-semibold uppercase tracking-[0.14em] text-muted">What matters</th>
            <th scope="col" class="cmp-omh w-[16.8%] px-5 pb-4 pt-5 align-bottom text-ink"><span class="mb-2 inline-flex rounded-full bg-gold px-2.5 py-0.5 text-[16px] font-semibold text-navy">Managed for you</span><span class="block font-display text-[18px] font-semibold">OMH AI voice agent</span></th>${cmpCols.slice(1).map((c) => `<th scope="col" class="w-[16.8%] px-5 pb-4 pt-5 align-bottom"><span class="font-display text-[18px] font-semibold text-ink">${c}</span></th>`).join("\n")}
          </tr>
        </thead>
        <tbody>
${cmpRows.map(([k, ...v]) => `          <tr>
            <th scope="row" class="border-t border-line px-5 py-4 align-top font-display text-[16px] font-semibold">${k}</th>
            ${v.map((t, i) => `<td class="${i ? "text-muted" : "cmp-omh font-semibold"} border-t border-line px-5 py-4 align-top">${t}</td>`).join("\n")}
          </tr>`).join("\n")}
        </tbody>
      </table>
    </div>

    <div class="mt-10 lg:hidden" data-cmp>
      <p class="font-semibold" id="cmp-pick-label">Compare OMH with</p>
      <div role="radiogroup" aria-labelledby="cmp-pick-label" class="mt-3 flex flex-wrap gap-2" data-cmp-group>
${cmpCols.slice(1).map((c, i) => `        <button type="button" role="radio" aria-checked="${!i}" tabindex="${i ? -1 : 0}" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[16px] font-semibold aria-checked:border-ink aria-checked:bg-ink aria-checked:text-paper" data-cmp-opt="${i + 1}" data-track="compare_option" data-track-name="${c}">${c}</button>`).join("\n")}
      </div>
      <p class="sr-only" aria-live="polite">Comparing OMH with <span data-cmp-name>${cmpCols[1]}</span></p>
      <dl class="mt-5 space-y-3">
${cmpRows.map(([k, omh, ...v]) => `        <div class="rounded-[14px] border border-line bg-surface p-4">
          <dt class="text-[16px] font-semibold">${k}</dt>
          <dd class="mt-3 grid grid-cols-2 gap-2 text-[15px] leading-snug">
            <span class="cmp-omh rounded-[10px] p-3"><span class="block text-[13px] font-semibold uppercase tracking-[0.1em] text-hl">OMH</span><span class="mt-1 block font-semibold">${omh}</span></span>
            ${v.map((t, i) => `<span class="rounded-[10px] bg-paper p-3" data-cmp-cell="${i + 1}"${i ? " hidden" : ""}><span class="block text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">${cmpCols[i + 1]}</span><span class="mt-1 block text-muted">${t}</span></span>`).join("\n")}
          </dd>
        </div>`).join("\n")}
      </dl>
    </div>

  </div>
</section>

<section id="faq" data-component="FAQ" class="bg-surface">
  <div class="container-omh grid gap-10 py-20 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8 lg:py-28">
    <div>
      <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Questions</p>
      <h2>Real estate AI voice agent <span class="hl">FAQs</span></h2>
      <p class="mt-5 text-muted">Straight answers to the questions branch managers and agency directors ask us most.</p>
    </div>

    <div class="order-last lg:order-none lg:col-start-1 lg:row-start-2 lg:sticky lg:top-28 lg:self-start">
      <div class="rounded-[16px] bg-band p-6 text-band-ink on-band">
        <p class="font-display text-body font-semibold">Still have a question?</p>
        <p class="mt-1.5 text-[16px] leading-snug text-band-muted">Talk to a person on our UK team. No sales script.</p>
        <ul class="mt-4 space-y-1 text-[16px]">
          <li><a href="tel:+442034893934" class="text-link tnum" data-track="faq_phone_click"><svg class="icon " aria-hidden="true" focusable="false"><use href="#i-phone"/></svg>020 3489 3934</a></li>
          <li><a href="mailto:support@onlinemarketinghelp.co.uk" class="text-link [overflow-wrap:anywhere] max-sm:text-[15px]" data-track="faq_email_click"><svg class="icon " aria-hidden="true" focusable="false"><use href="#i-mail"/></svg>support@onlinemarketinghelp.co.uk</a></li>
        </ul>
        <a href="#book-demo-form" class="btn btn-primary mt-5 w-full" data-track="faq_book_demo">Book a Voice Agent Demo</a>
      </div>
    </div>

    <div class="lg:col-start-2 lg:row-span-2 lg:row-start-1" data-faq>
      <div class="relative">
        <label for="faq-search" class="sr-only">Search the questions</label>
        <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
        <input id="faq-search" type="search" placeholder="Search, for example viewings, offers or GDPR" autocomplete="off" class="field !min-h-[54px] !rounded-[12px] !pl-12" data-faq-search data-track="faq_search">
      </div>
      <div role="group" aria-label="Filter questions by topic" class="mt-4 flex flex-wrap gap-2" data-faq-filters>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="all" aria-pressed="true" data-track="faq_filter" data-track-name="All questions">All questions <span class="ml-1 opacity-70 tnum" data-faq-count="all"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="callers" aria-pressed="false" data-track="faq_filter" data-track-name="Callers and AI">Callers and AI <span class="ml-1 opacity-70 tnum" data-faq-count="callers"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="viewings" aria-pressed="false" data-track="faq_filter" data-track-name="Viewings and offers">Viewings and offers <span class="ml-1 opacity-70 tnum" data-faq-count="viewings"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="setup" aria-pressed="false" data-track="faq_filter" data-track-name="Setup and systems">Setup and systems <span class="ml-1 opacity-70 tnum" data-faq-count="setup"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="data" aria-pressed="false" data-track="faq_filter" data-track-name="Data and rules">Data and rules <span class="ml-1 opacity-70 tnum" data-faq-count="data"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="working" aria-pressed="false" data-track="faq_filter" data-track-name="Working with us">Working with us <span class="ml-1 opacity-70 tnum" data-faq-count="working"></span></button>
      </div>
      <div class="mt-5 flex items-center justify-between gap-4 text-[15px] text-muted">
        <p aria-live="polite" data-faq-status>Showing all ${voiceFaqs.length} questions</p>
        <button type="button" class="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-ink hover:text-hl" data-faq-expand data-track="faq_expand_all">Open all</button>
      </div>

      <div class="mt-2 space-y-3" data-faq-list>
${voiceFaqs.map(faqItem).join("\n")}
      </div>
      <div class="mt-3 rounded-[14px] border border-dashed border-[var(--va-line-strong)] p-6 text-center" data-faq-empty hidden>
        <p class="font-display text-[18px] font-semibold">No questions match that</p>
        <p class="mt-1 text-[16px] text-muted">Try another word, or ring us on <a href="tel:+442034893934" class="font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4 tnum">020 3489 3934</a> and ask a person.</p>
      </div>
    </div>
  </div>
</section>

<div data-component="MobileStickyBar" data-sticky-bar class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-18px_rgb(16_24_40/0.35)] md:hidden" inert>
  <div class="flex items-center gap-3">
    <a href="#book-demo-form" class="btn btn-primary flex-1 whitespace-nowrap !px-3" data-track="sticky_book_demo">Book a Demo</a>
    <a href="tel:+442034893934" class="btn btn-secondary shrink-0 whitespace-nowrap !px-3 tnum" data-track="sticky_phone_click" aria-label="Call 020 3489 3934"><span class="max-[374px]:hidden">Call&nbsp;</span>020 3489 3934</a>
  </div>
</div>
`;
