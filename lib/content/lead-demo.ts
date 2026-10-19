// The "hear it before you buy it" section on the AI voice agent industry pages.
//
// It used to type a greeting into a phone mock and read it with the browser's
// speechSynthesis. That proved the voice existed and nothing else: a visitor
// could not ask it anything, and "ring our demo agency" was still [DEMO NUMBER].
// This replaces it with an assistant the visitor talks to as their own lead.
//
// The id stays `hear`: both hero buttons and the video section link to #hear.
//
// It embeds a working assistant for a fictional business in that trade, so a
// visitor can type their name, then chat or talk to it exactly as one of their
// own callers would. The demos are separate deployments with their own Retell
// agent, n8n workflows and knowledge base:
//   github.com/online-marketing-help/ohm-demo-real-estate
//   github.com/online-marketing-help/ohm-demo-healthcare
//
// It is an iframe, not the widget's own script, on purpose. OMH's assistant is
// pinned to the bottom right of every page by components/layout/SiteAssistant.
// Loading a second widget would put two pills side by side, and a fictional
// agency's fees would look like ours. Inside the frame the panel is docked,
// with no pill of its own (the demo's /embed.html, data-mount).
//
// The frame is cross-origin, so fitRoiFrames cannot measure it the way it
// measures the ROI calculators. The height is set here instead and is the one
// number to adjust if the panel ever outgrows it.

type Demo = {
  /** The demo deployment, without a trailing slash. */
  host: string;
  /** The fictional business inside the frame. */
  business: string;
  /** What the visitor is playing: "caller", "patient". */
  role: string;
  /** Three things worth asking, shown as prompts. */
  tries: string[];
  /** "an agency", "a clinic". Written out so the article is always right. */
  what: string;
  /** The refusal the second prompt triggers, in this trade's own words. */
  refusal: string;
};

export const leadDemos = {
  "real-estate": {
    host: "https://ohm-demo-real-estate.vercel.app",
    business: "Marlborough & Hale",
    role: "vendor ringing about a valuation",
    tries: [
      "What do you charge to sell my house?",
      "What's my house worth?",
      "Can I book a viewing on Saturday?",
    ],
    what: "an agency",
    refusal: "It will not put a price on your house: it says so and books the valuation instead",
  },
  healthcare: {
    host: "https://ohm-demo-healthcare.vercel.app",
    business: "Brookfield Clinic",
    role: "patient ringing to book",
    tries: [
      "How much is a first appointment?",
      "My blood test results are back, are they alright?",
      "Which insurers do you take?",
    ],
    what: "a clinic",
    refusal: "It will not read or interpret your results: it says so and gets a clinician to ring you",
  },
} satisfies Record<string, Demo>;

/**
 * `key` picks the demo, `cls` the section background so it can alternate with
 * the band above it.
 */
export const leadDemo = (key: keyof typeof leadDemos, cls = "bg-paper") => {
  const d = leadDemos[key];
  const tries = d.tries
    .map(
      (t) =>
        `<li class="rounded-[12px] border border-line bg-surface px-4 py-3 text-body">&ldquo;${t}&rdquo;</li>`,
    )
    .join("");

  return `<section id="hear" data-component="HearIt" class="${cls}">
  <div class="container-omh py-20 lg:py-24">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14">

      <div>
        <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>Live demo</p>
        <h2>Hear it <span class="hl">before you buy it</span></h2>
        <p class="mt-5 text-body text-muted">
          This is a real agent, not a recording. Give it your name, then ask it
          what one of your own leads would ask, by typing or out loud. It answers
          as <strong>${d.business}</strong>, ${d.what} we invented for this, so
          you can push it as hard as you like.
        </p>

        <p class="mt-7 font-display text-[16.5px] font-semibold">Worth trying, as a ${d.role}</p>
        <ul class="mt-3 grid gap-2">${tries}</ul>

        <p class="mt-6 text-body text-muted">
          The second one is the one to watch. ${d.refusal}, which is the thing
          you actually want an agent on your phone to do.
        </p>

        <p class="mt-7 text-[14px] text-muted">
          ${d.business} is not a real business, and the number it gives out cannot
          ring anybody. Your own agent would be built from your information, your
          prices and your diary.
        </p>
      </div>

      <div class="lg:sticky lg:top-24">
        <iframe
          src="${d.host}/embed.html"
          title="Talk to the ${d.business} assistant"
          loading="lazy"
          allow="microphone"
          class="h-[680px] w-full rounded-[18px] border border-line bg-surface sm:h-[720px]"
        ></iframe>
        <p class="mt-3 text-center text-[14px] text-muted">
          Voice needs the microphone. Nothing is recorded.
        </p>
      </div>

    </div>
  </div>
</section>`;
};
