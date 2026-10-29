import type { Metadata } from "next";
import { type Runs, VoiceLanding, sectionsOf } from "@/components/voice-agents/VoiceLanding";
import { LandingExtrasScript } from "@/components/voice-agents/LandingExtrasScript";
import { clinicExtrasMarkup } from "@/lib/content/voice-clinics/extras";
import { clinicLandingMarkup } from "@/lib/content/voice-clinics/landing";
import { clinicLegacyMarkup } from "@/lib/content/voice-clinics/legacy";
import { clinicFaqs, clinicMarkup } from "@/lib/content/voice-clinics/markup";
import { SITE, faqSchema } from "@/lib/schema";

/*
  /ai-voice-agents/healthcare (21 Oct 2026): the /ai-voice-agents layout, section for section, with content
  written for private clinics (lib/content/voice-clinics/). Rendered by app/ai-voice-agents/[industry]/page.tsx.
  The page it replaced is frozen as git tag `clinics-oldv1` and the noindex route
  /ai-voice-agents/clinics-healthcare-oldv1.
*/

const path = "/ai-voice-agents/healthcare";
const url = `${SITE}${path}`;
const ogTitle = "AI Voice Agent & AI Receptionist for Medical Clinics | OMH";
const ogDescription = "An AI receptionist for medical clinics: every patient call answered, even over the lunch hour. Built, tested and managed by a UK team.";

export const clinicsMetadata: Metadata = {
  title: { absolute: "AI Voice Agent & AI Receptionist for Medical Clinics | UK | OMH" },
  description:
    "An AI receptionist for medical clinics and private clinics in the UK. Answers patient calls 24/7, books the right appointment type and fills cancellations. No clinical advice.",
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
      name: "AI Voice Agent for Private Clinics",
      serviceType: "AI voice agent and AI receptionist for private clinics and healthcare",
      description:
        "Managed AI voice agents that answer patient calls, handle self-pay and insured patients, book the right appointment type, fill cancellations and route urgent calls for UK private clinics. They never give clinical advice.",
      url,
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: { "@type": "BusinessAudience", audienceType: "Private clinics and healthcare providers" },
      provider: { "@id": `${SITE}/#organisation` },
      offers: [offer("Starter", 249, 300, "£795"), offer("Growth", 449, 500, "£1,295"), offer("Scale", 849, 900, "£1,995")],
    },
    { ...faqSchema(clinicFaqs), "@id": `${url}#faq` },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "AI Voice Agents", item: `${SITE}/ai-voice-agents` },
        { "@type": "ListItem", position: 3, name: "Clinics & Healthcare", item: url },
      ],
    },
  ],
};

const fresh = sectionsOf(clinicMarkup, "va-page");
const legacy = sectionsOf(clinicLegacyMarkup, "va-page");
const v4 = sectionsOf(clinicLandingMarkup, "v4l");
const extras = sectionsOf(clinicExtrasMarkup, "va-page"); // clinics only: a clinic's day of calls

// The same order as the real estate and dental pages: the /ai-voice-agents sections, with the comparison table and
// fit checker swapped for the clinic's day of calls (no industry types, "Your team" or "Getting ready", client 21 Oct 2026).
const runs: Runs = [
  [v4, ["top"]],
  [fresh, ["what-is"]],
  [extras, ["day"]],
  [fresh, ["features"]],
  [v4, ["how"]],
  [fresh, ["use-cases", "clinic-types"]],
  [legacy, ["feedback", "roi-calculator"]],
  [fresh, ["pricing"]],
  [v4, ["cities"]],
  [legacy, ["faq"]],
];

export function ClinicsPage() {
  return (
    <VoiceLanding
      runs={runs}
      breadcrumb
      graph={graph}
      page={path}
      demoHeading={
        <>
          Book a 30-minute demo <span className="text-[#f2c675]">for your clinic</span>
        </>
      }
    >
      <LandingExtrasScript />
    </VoiceLanding>
  );
}
