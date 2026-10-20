// Body of /ai-voice-agents/real-estate-letting-agents, part 2 (21 Oct 2026): the main page's kept sections (agency
// types grid, client feedback as a grid, ROI calculator, FAQ, sticky bar), written for estate and
// letting agents. Same structure, classes and data-* hooks as lib/content/ai-voice-agents-legacy.ts.
import { roiCalculator } from "@/lib/content/roi-calculator";
import { estateFaqs as voiceFaqs } from "@/lib/content/voice-estate/markup";


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
        <h2 style="max-width:28ch">Built for every kind of<br class="max-sm:hidden"> <span class="hl">real estate agency</span></h2>
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

<section id="feedback" data-component="ClientFeedback" class="bg-surface">
  <div class="container-omh py-14 lg:py-20">
    <div>
      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Client feedback</p>
        <h2>Hear it take <span class="hl">a real estate call</span></h2>
      </div>
      <p class="mt-5 text-muted">Press play on a recorded call with our AI voice agent, set up for a real estate agency. Recordings for lettings, valuations, property management, new homes and multi-branch agencies are being prepared and stay marked as coming soon until they're checked.</p>
    </div>

    <dl class="mt-12 grid border-y border-[var(--va-line-strong)] sm:grid-cols-3">
      <div class="py-5 sm:pr-6"><dd class="font-display text-[30px] font-semibold leading-none">2:21</dd><dt class="mt-1.5 text-[16px] text-muted">real estate call you can play below</dt></div>
      <div class="border-t border-line py-5 sm:border-l sm:border-t-0 sm:px-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">8</dd><dt class="mt-1.5 text-[16px] text-muted">kinds of agency call it's scripted for</dt></div>
      <div class="border-t border-line py-5 sm:border-l sm:border-t-0 sm:pl-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">10</dd><dt class="mt-1.5 text-[16px] text-muted">UK cities with local numbers</dt></div>
    </dl>

    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
  </div>
</section>



${roiCalculator("real-estate")}


<section id="faq" data-component="FAQ" class="bg-surface">
  <div class="container-omh grid gap-10 py-20 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8 lg:py-28">
    <div>
      <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Questions</p>
      <h2>What real estate agents<br class="max-sm:hidden"> <span class="hl">ask us first</span></h2>
      <p class="mt-5 text-muted">Straight answers on viewings, offers, tenant emergencies, property software and client data.</p>
    </div>

    <div class="order-last lg:order-none lg:col-start-1 lg:row-start-2 lg:sticky lg:top-28 lg:self-start">
      <div class="rounded-[16px] bg-band p-6 text-band-ink on-band">
        <p class="font-display text-body font-semibold">Ask us about your branch</p>
        <p class="mt-1.5 text-[16px] leading-snug text-band-muted">Talk to a person on our UK team about your viewings, valuations and lettings calls. No sales script.</p>
        <p class="mt-4 text-[15px] font-semibold uppercase tracking-[0.12em] text-band-muted">On the demo, try</p>
        <ol class="mt-2 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><span class="font-display font-semibold text-[#f2c675]">1</span><span>Book a viewing for the flat on Halden Road</span></li>
          <li class="flex gap-2.5"><span class="font-display font-semibold text-[#f2c675]">2</span><span>Report a leak as a tenant and hear how it routes you</span></li>
          <li class="flex gap-2.5"><span class="font-display font-semibold text-[#f2c675]">3</span><span>Ask something it can't know, and hear what it does</span></li>
        </ol>
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
