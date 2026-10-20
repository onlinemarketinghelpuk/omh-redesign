import type { Metadata } from "next";
import { type Runs, VoiceLanding, sectionsOf } from "@/components/voice-agents/VoiceLanding";
import { LandingExtrasScript } from "@/components/voice-agents/LandingExtrasScript";
import { estateExtrasMarkup } from "@/lib/content/voice-estate/extras";
import { estateLandingMarkup } from "@/lib/content/voice-estate/landing";
import { estateLegacyMarkup } from "@/lib/content/voice-estate/legacy";
import { estateFaqs, estateMarkup } from "@/lib/content/voice-estate/markup";
import { SITE, faqSchema } from "@/lib/schema";

/*
  /ai-voice-agents/real-estate-letting-agents (21 Oct 2026): the /ai-voice-agents layout, section for section,
  with content written for real estate and letting agents (lib/content/voice-estate/). Rendered by
  app/ai-voice-agents/[industry]/page.tsx. The page it replaced is frozen as git tag `estate-oldv1` and the
  noindex route /ai-voice-agents/real-estate-letting-agents-oldv1. The London page under it is unchanged.
*/

const path = "/ai-voice-agents/real-estate-letting-agents";
const url = `${SITE}${path}`;
const ogTitle = "AI Voice Agent for Real Estate & Letting Agents | OMH";
const ogDescription = "Every property enquiry answered, even when the team is out on viewings. Built, tested and managed by a UK team.";

export const estateMetadata: Metadata = {
  title: { absolute: "AI Voice Agent & AI Receptionist for Real Estate & Letting Agents | OMH" },
  description:
    "An AI voice agent for UK real estate and letting agents. Answers every enquiry 24/7, books viewings and valuations, qualifies buyers and tenants and routes tenant emergencies. Built and managed by OMH.",
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

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: "AI Voice Agent for Real Estate and Letting Agents",
      serviceType: "AI voice agent and AI receptionist for real estate and letting agents",
      description:
        "Managed AI voice agents that answer property enquiries, book viewings and valuations, qualify buyers and tenants and route urgent calls for UK real estate and letting agents.",
      url,
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: { "@type": "BusinessAudience", audienceType: "Real estate and letting agents" },
      provider: { "@id": `${SITE}/#organisation` },
      offers: [offer("Starter", 249, 300, "£795"), offer("Growth", 449, 500, "£1,295"), offer("Scale", 849, 900, "£1,995")],
    },
    { ...faqSchema(estateFaqs), "@id": `${url}#faq` },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "AI Voice Agents", item: `${SITE}/ai-voice-agents` },
        { "@type": "ListItem", position: 3, name: "Real Estate & Letting Agents", item: url },
      ],
    },
  ],
};

const fresh = sectionsOf(estateMarkup, "va-page");
const legacy = sectionsOf(estateLegacyMarkup, "va-page");
const v4 = sectionsOf(estateLandingMarkup, "v4l");
const extras = sectionsOf(estateExtrasMarkup, "va-page"); // real estate only: day of calls, when it answers, what we need

// The /ai-voice-agents order, with the comparison table and fit checker swapped for real estate sections
// (client, 21 Oct 2026): a branch's day of calls after the definition, when it answers after the agency types,
// and what we ask a branch for before the FAQ.
const runs: Runs = [
  [v4, ["top"]],
  [fresh, ["what-is"]],
  [extras, ["day"]],
  [fresh, ["features"]],
  [v4, ["how"]],
  [fresh, ["use-cases"]],
  [legacy, ["industries"]],
  [extras, ["your-team"]],
  [legacy, ["feedback", "roi-calculator"]],
  [fresh, ["pricing"]],
  [v4, ["cities"]],
  [extras, ["ready"]],
  [legacy, ["faq"]],
];

export function EstatePage() {
  return (
    <VoiceLanding
      runs={runs}
      graph={graph}
      page={path}
      demoHeading={
        <>
          Book a 30-minute demo <span className="text-[#f2c675]">for your agency</span>
        </>
      }
    >
      <LandingExtrasScript />
    </VoiceLanding>
  );
}
