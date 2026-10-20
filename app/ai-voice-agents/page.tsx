import type { Metadata } from "next";
import { BookDemo } from "@/components/BookDemo";
import { RelatedServices } from "@/components/RelatedServices";
import { VoiceAgentsScript } from "@/components/voice-agents/VoiceAgentsScript";
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

// The three services that make the phone ring, kept as plain internal links (the previous mock-up cards and
// "joined-up plan" CTA competed with the booking band).
const related = [
  { title: "Google Ads", href: "/google-adwords-ppc", body: "Paid search that puts your number in front of people ready to buy." },
  { title: "Local SEO", href: "/local-seo", body: "Show up in the map results when people nearby search for what you do." },
  { title: "Website Design", href: "/website-designs", body: "A site that turns visitors into calls and bookings, with your number where people expect it." },
];

/*
  Rebuilt 20 Oct 2026 for conversion: 10 sections plus the booking band, one primary CTA wording, one industry
  panel. Audit, section map and QA: docs/ai-voice-agents-cro/. The previous page is frozen as git tag `oldv2`
  and route /ai-voice-agents-oldv2 (noindex).
*/
export default function AiVoiceAgentsPage() {
  return (
    <>
      <JsonLd data={graph} />
      {/* One root; the page script finds its widgets by data-* hooks inside it. */}
      <div id="va-page" className="va-page" dangerouslySetInnerHTML={{ __html: voiceAgentsMarkup }} />
      <RelatedServices
        title="What makes the phone ring in the first place"
        body="Ads, local search and your website bring in the calls. Your AI voice agent makes sure every one of them is answered. We run all four, so the numbers join up in one report."
        links={related}
        eventPrefix="voice"
      />
      {/* The booking band every "Book a 30-Minute Demo" button on the page points at. */}
      <BookDemo
        id="book-demo-form"
        heading={
          <>
            Book a 30-minute demo, <span className="text-[#f2c675]">by video or phone</span>
          </>
        }
      />
      <VoiceAgentsScript />
    </>
  );
}
