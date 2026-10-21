// Body of /ai-voice-agents/contractors-builders, part 2 (21 Oct 2026): client feedback as a grid,
// ROI calculator, FAQ and sticky bar, written for builders and contractors. Same structure, classes and data-* hooks
// as lib/content/ai-voice-agents-legacy.ts (via lib/content/voice-clinics/legacy.ts).
import { roiCalculator } from "@/lib/content/roi-calculator";
import { buildersFaqs as voiceFaqs } from "@/lib/content/voice-builders/markup";


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

export const buildersLegacyMarkup = String.raw`
<section id="feedback" data-component="ClientFeedback" class="bg-surface">
  <div class="container-omh py-14 lg:py-20">
    <div>
      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Client feedback</p>
        <h2>Builder call recordings, <span class="hl">on the way</span></h2>
      </div>
      <p class="mt-5 text-muted">Voice agents are a new service for us, so we haven't filled this wall with invented praise. Recordings of each of these builder calls are being prepared and stay marked as coming soon until they're checked. Book a demo to hear one set up for a building firm today.</p>
    </div>

    <dl class="mt-12 grid border-y border-[var(--va-line-strong)] sm:grid-cols-3">
      <div class="py-5 sm:pr-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">8</dd><dt class="mt-1.5 text-[16px] text-muted">kinds of builder call it's scripted for</dt></div>
      <div class="border-t border-line py-5 sm:border-l sm:border-t-0 sm:px-6"><dd class="font-display text-[30px] font-semibold leading-none">0</dd><dt class="mt-1.5 text-[16px] text-muted">prices or start dates made up, on any call</dt></div>
      <div class="border-t border-line py-5 sm:border-l sm:border-t-0 sm:pl-6"><dd class="font-display text-[30px] font-semibold leading-none tnum">10</dd><dt class="mt-1.5 text-[16px] text-muted">UK cities with local numbers</dt></div>
    </dl>

    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-1)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-home"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Quote Requests</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent taking the details for a kitchen extension and booking a site survey.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-3)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-map-pin"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Qualifying Enquiries</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent checking the postcode, budget and planning status before a survey is booked.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-2)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-calendar"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Site Surveys</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent moving a site survey to a time that suits the homeowner.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-4)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-clipboard"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Job Updates</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent taking a message for the site manager when a customer asks about their job.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-1)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-truck"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Suppliers and Deliveries</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent logging a delivery time and passing it to the site lead.</p>
        </figcaption>
      </figure>
      <figure class="flex flex-col rounded-[16px] border border-line bg-surface p-3 transition-colors hover:border-[var(--va-line-strong)]" data-audio-card data-audio-pending>
        <div class="audio-panel relative aspect-video overflow-hidden rounded-[11px] bg-[var(--va-tint-3)]">
          <span class="pointer-events-none absolute -right-6 -top-4 text-ink/10" aria-hidden="true"><svg class="icon !h-[150px] !w-[150px]" aria-hidden="true" focusable="false"><use href="#i-wrench"/></svg></span>
          <button type="button" class="audio-toggle" aria-disabled="true" aria-label="Recording coming soon" title="Recording coming soon"><svg class="icon i-play" aria-hidden="true" focusable="false"><use href="#i-play"/></svg><svg class="icon i-pause" aria-hidden="true" focusable="false"><use href="#i-pause"/></svg></button>
          <div class="absolute inset-x-4 bottom-3 flex items-center gap-3">
            <div class="audio-wave" aria-hidden="true"><i style="--h:65%"></i><i style="--h:30%"></i><i style="--h:75%"></i><i style="--h:45%"></i><i style="--h:85%"></i><i style="--h:55%"></i><i style="--h:40%"></i><i style="--h:30%"></i><i style="--h:55%"></i><i style="--h:80%"></i><i style="--h:45%"></i><i style="--h:65%"></i><i style="--h:90%"></i><i style="--h:50%"></i><i style="--h:35%"></i><i style="--h:70%"></i><i style="--h:85%"></i><i style="--h:40%"></i><i style="--h:60%"></i><i style="--h:75%"></i><i style="--h:30%"></i><i style="--h:50%"></i><i style="--h:65%"></i><i style="--h:45%"></i><i style="--h:80%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:60%"></i><i style="--h:40%"></i><i style="--h:70%"></i><i style="--h:90%"></i><i style="--h:50%"></i></div>
            <span class="audio-time tnum">0:00 / --:--</span>
          </div>
        </div>
        <figcaption class="flex flex-1 flex-col px-2 pb-2 pt-4">
          <h3 class="!text-[20px] !leading-[1.3]">AI Voice Agent for Snagging and Aftercare</h3>
          <p class="mt-2 text-[16px] leading-[1.5] text-muted">Our AI voice agent logging a leaking shower tray and booking an aftercare visit.</p>
        </figcaption>
      </figure>
    </div>
  </div>
</section>



${roiCalculator("contractors")}


<section id="faq" data-component="FAQ" class="bg-surface">
  <div class="container-omh grid gap-10 py-20 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8 lg:py-28">
    <div>
      <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Questions</p>
      <h2>What builders and contractors<br class="max-sm:hidden"> <span class="hl">ask us first</span></h2>
      <p class="mt-5 text-muted">Straight answers on prices and start dates, site surveys, qualifying enquiries, job software and customer data.</p>
    </div>

    <div class="order-last lg:order-none lg:col-start-1 lg:row-start-2 lg:sticky lg:top-28 lg:self-start">
      <div class="rounded-[16px] bg-band p-6 text-band-ink on-band">
        <p class="font-display text-body font-semibold">Ask us about your business</p>
        <p class="mt-1.5 text-[16px] leading-snug text-band-muted">Talk to a person on our UK team about your quote, survey and job update calls. No sales script.</p>
        <p class="mt-4 text-[15px] font-semibold uppercase tracking-[0.12em] text-band-muted">On the demo, try</p>
        <ol class="mt-2 space-y-1.5 text-[16px] leading-snug">
          <li class="flex gap-2.5"><span class="font-display font-semibold text-[#f2c675]">1</span><span>Ask for a loft conversion quote and book a survey</span></li>
          <li class="flex gap-2.5"><span class="font-display font-semibold text-[#f2c675]">2</span><span>Ask what an extension costs and hear what it says</span></li>
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
        <input id="faq-search" type="search" placeholder="Search, for example quotes, surveys or GDPR" autocomplete="off" class="field !min-h-[54px] !rounded-[12px] !pl-12" data-faq-search data-track="faq_search">
      </div>
      <div role="group" aria-label="Filter questions by topic" class="mt-4 flex flex-wrap gap-2" data-faq-filters>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="all" aria-pressed="true" data-track="faq_filter" data-track-name="All questions">All questions <span class="ml-1 opacity-70 tnum" data-faq-count="all"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="customers" aria-pressed="false" data-track="faq_filter" data-track-name="Customers and AI">Customers and AI <span class="ml-1 opacity-70 tnum" data-faq-count="customers"></span></button>
        <button type="button" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15px] font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper" data-faq-filter="quotes" aria-pressed="false" data-track="faq_filter" data-track-name="Quotes and surveys">Quotes and surveys <span class="ml-1 opacity-70 tnum" data-faq-count="quotes"></span></button>
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
