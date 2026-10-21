import type { Metadata } from "next";
import { type Runs, VoiceLanding, sectionsOf } from "@/components/voice-agents/VoiceLanding";
import { LandingExtrasScript } from "@/components/voice-agents/LandingExtrasScript";
import { carsExtrasMarkup } from "@/lib/content/voice-cars/extras";
import { carsLandingMarkup } from "@/lib/content/voice-cars/landing";
import { carsLegacyMarkup } from "@/lib/content/voice-cars/legacy";
import { carsFaqs, carsMarkup } from "@/lib/content/voice-cars/markup";
import { SITE, faqSchema } from "@/lib/schema";

/*
  /ai-voice-agents/car-dealerships (21 Oct 2026): the /ai-voice-agents layout, section for section, with content
  written for UK franchised and independent car dealerships (lib/content/voice-cars/). Rendered by
  app/ai-voice-agents/[industry]/page.tsx.
*/

const path = "/ai-voice-agents/car-dealerships";
const url = `${SITE}${path}`;
const ogTitle = "AI Voice Agent for Car Dealerships | OMH";
const ogDescription = "Every sales and service call answered, even on a busy Saturday. Built, tested and managed by a UK team.";

export const carsMetadata: Metadata = {
  title: { absolute: "AI Voice Agent & AI Receptionist for Car Dealerships | UK | OMH" },
  description:
    "An AI voice agent for UK car dealerships. Answers sales, service and parts calls 24/7, books test drives and MOTs and takes part-exchange details. Never gives finance advice. Built and managed by OMH.",
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
      name: "AI Voice Agent for Car Dealerships",
      serviceType: "AI voice agent and AI receptionist for car dealerships",
      description:
        "Managed AI voice agents that answer sales, service and parts calls, book test drives and workshop slots, take part-exchange details and route finance questions for UK franchised and independent car dealerships. They never give finance advice or value a car.",
      url,
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: { "@type": "BusinessAudience", audienceType: "Franchised and independent car dealerships" },
      provider: { "@id": `${SITE}/#organisation` },
      offers: [offer("Starter", 249, 300, "£795"), offer("Growth", 449, 500, "£1,295"), offer("Scale", 849, 900, "£1,995")],
    },
    { ...faqSchema(carsFaqs), "@id": `${url}#faq` },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "AI Voice Agents", item: `${SITE}/ai-voice-agents` },
        { "@type": "ListItem", position: 3, name: "Car Dealerships", item: url },
      ],
    },
  ],
};

const fresh = sectionsOf(carsMarkup, "va-page");
const legacy = sectionsOf(carsLegacyMarkup, "va-page");
const v4 = sectionsOf(carsLandingMarkup, "v4l");
const extras = sectionsOf(carsExtrasMarkup, "va-page"); // cars only: a dealership's day of calls

// The same order as the real estate, dental and clinics pages: the /ai-voice-agents sections, with the comparison
// table and fit checker swapped for the dealership's day of calls (no industry types, "Your team" or "Getting ready").
const runs: Runs = [
  [v4, ["top"]],
  [fresh, ["what-is"]],
  [extras, ["day"]],
  [fresh, ["features"]],
  [v4, ["how"]],
  [fresh, ["use-cases"]],
  [legacy, ["feedback", "roi-calculator"]],
  [fresh, ["pricing"]],
  [v4, ["cities"]],
  [legacy, ["faq"]],
];

export function CarsPage() {
  return (
    <VoiceLanding
      runs={runs}
      graph={graph}
      page={path}
      demoHeading={
        <>
          Book a 30-minute demo <span className="text-[#f2c675]">for your dealership</span>
        </>
      }
    >
      <LandingExtrasScript />
    </VoiceLanding>
  );
}
