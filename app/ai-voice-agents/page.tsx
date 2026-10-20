import type { Metadata } from "next";
import { BookDemo } from "@/components/BookDemo";
import { LandingV4Script } from "@/components/voice-agents/LandingV4Script";
import { VoiceAgentsScript } from "@/components/voice-agents/VoiceAgentsScript";
import { landingV4Markup } from "@/lib/content/ai-voice-agents-landing-v4";
import { voiceAgentsMarkup, voiceFaqs } from "@/lib/content/ai-voice-agents-markup";
import { JsonLd, SITE, faqSchema } from "@/lib/schema";

const path = "/ai-voice-agents";
// No trailing slash: /ai-voice-agents/ redirects here, and a canonical must name the final URL (SEO brief §2.3).
const url = `${SITE}${path}`;
const ogTitle = "AI Voice Agent for UK Businesses | OMH";
const ogDescription = "An AI voice agent that answers, books and follows up, day and night. Built, tested and managed by a UK team.";

// SEO pack from the brief (OMH-AI-Voice-Agent-Page-SEO-Optimisation, 19 Oct 2026). The share image and its
// alt text come from ./opengraph-image.tsx.
export const metadata: Metadata = {
  title: { absolute: "AI Voice Agent & AI Receptionist for UK Businesses | OMH" },
  description:
    "An AI voice agent that answers every call on the first ring, books appointments and follows up leads, day and night. Set up and managed by a UK team.",
  alternates: { canonical: url },
  openGraph: { type: "website", locale: "en_GB", siteName: "Online Marketing Help", title: ogTitle, description: ogDescription, url },
  twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription },
};

const offer = (name: string, price: number, minutes: number, setup: string) => ({
  "@type": "Offer",
  name,
  description: `${minutes} minutes included, then 60p a minute. ${setup} one-off setup. Prices exclude VAT.`,
  url,
  priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "GBP", unitText: "MONTH", valueAddedTaxIncluded: false },
});

// Part 6 of the brief. The Organization item is left out: the layout already publishes one as #organisation.
const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: "AI Voice Agent for UK Businesses",
      serviceType: "AI voice agent",
      description:
        "An AI voice agent is software that answers and makes phone calls for your business in natural, spoken conversation. It understands what the caller wants, answers from information you have approved, books appointments into your calendar and passes anything it can't handle to a person on your team, with a summary of the call.",
      url,
      areaServed: { "@type": "Country", name: "United Kingdom" },
      provider: { "@id": `${SITE}/#organisation` },
      offers: [offer("Starter", 249, 300, "£795"), offer("Growth", 449, 500, "£1,295"), offer("Scale", 849, 900, "£1,995")],
    },
    { ...faqSchema(voiceFaqs), "@id": `${url}#faq` },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "AI Voice Agents", item: url },
      ],
    },
  ],
};

// Splits a markup string at each top-level <section>, keyed by its id (or aria-labelledby).
// `head` is whatever comes before the first section (the icon sprite).
function sectionsOf(html: string, className: string) {
  const [head, ...parts] = html.split(/(?=<section[\s>])/);
  const byKey = new Map(parts.map((p) => [p.match(/^<section[^>]*?\s(?:id|aria-labelledby)="([^"]+)"/)![1], p]));
  return { head, byKey, className };
}

const v4 = sectionsOf(landingV4Markup, "v4l");
const va = sectionsOf(voiceAgentsMarkup, "va-page");

// The running order from the SEO brief (Part 3). The two designs are styled by their own wrapper class, so each
// run of one design's sections gets its own wrapper.
const runs: [typeof v4, string[]][] = [
  [v4, ["top"]],
  [va, ["what-is"]],
  [v4, ["features-title"]],
  [va, ["branding"]],
  [v4, ["how", "use-cases"]],
  // Industries, Client feedback and the six Local cover cards came back from /ai-voice-agents-old on 20 Oct 2026 (client's call).
  [va, ["industries", "feedback", "why-omh", "compare", "right-fit", "roi-calculator", "pricing"]],
  [v4, ["cities"]],
  [va, ["faq", "related"]],
];
const placed = runs.flatMap(([, keys]) => keys);
for (const src of [v4, va])
  for (const key of src.byKey.keys()) if (!placed.includes(key)) throw new Error(`/ai-voice-agents: section "${key}" has no place in runs`);
const runHtml = runs.map(([src, keys], i) => {
  const html = keys.map((k) => {
    const part = src.byKey.get(k);
    if (!part) throw new Error(`/ai-voice-agents: no section "${k}"`);
    return part;
  });
  // The icon sprite goes in the first wrapper of its design.
  return (runs.findIndex(([s]) => s === src) === i ? src.head : "") + html.join("");
});

export default function AiVoiceAgentsPage() {
  return (
    <>
      <JsonLd data={graph} />
      {/* One root for both page scripts; they find their widgets by data-* hooks inside it. */}
      <div id="va-page">
        {runs.map(([src], i) => (
          <div key={i} className={src.className} dangerouslySetInnerHTML={{ __html: runHtml[i] }} />
        ))}
      </div>
      <LandingV4Script />
      {/* The booking tabs every "Book a Demo" / "Call Me Now" button on the page points at. */}
      <BookDemo
        id="book-demo-form"
        heading={
          <>
            Hear an AI voice agent answer <span className="text-[#f2c675]">as your business</span>
          </>
        }
      />
      <VoiceAgentsScript />
    </>
  );
}
