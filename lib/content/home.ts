import type { CaseMeta } from "@/components/ui/Case";
import { caseStudies } from "@/lib/content/case-studies";
import { CASE_STUDIES_LIVE } from "@/lib/flags";
import { siteTestimonials } from "@/lib/content/testimonials";

// Homepage SEO brief (Oct 2026): focus "full service digital marketing agency",
// co-primary "digital marketing agency uk".
export const homeMeta = {
  title: "Full-Service Digital Marketing Agency UK | Online Marketing Help",
  description:
    "Full-service digital marketing agency helping UK businesses grow with Google Ads, Meta Ads, SEO and websites that convert. One senior team, clear reporting.",
  ogDescription:
    "One senior team for Google Ads, Meta Ads, SEO and conversion-focused websites. Helping UK service businesses and ecommerce brands grow.",
};

export const hero = {
  eyebrow: "Full-service digital marketing agency, UK",
  headline: "Full-service digital marketing agency for UK businesses",
  standfirst:
    "Online Marketing Help is a full-service digital marketing agency for service businesses and ecommerce brands across the UK. We plan, build and run your Google Ads, Meta Ads, SEO and website under one roof, then show you clearly what each pound brings back. You run the business. We handle the strategy, delivery, tracking and reporting.",
  primaryCta: { label: "Book a Growth Consultation", href: "/book-a-consultation" },
  secondaryCta: { label: "View Client Results", href: "#proof" },
};

export const programs = [
  {
    range: "Lead generation",
    title: "Service Business Growth",
    body: "For UK service companies that need a steady flow of enquiries and a clear view of which leads are worth chasing.",
    href: "/solutions/generate-qualified-leads",
  },
  {
    range: "Online sales",
    title: "Ecommerce Growth",
    body: "For online brands that want more profitable sales from Google, Meta, Amazon and organic search, with tracking you can trust.",
    href: "/solutions/increase-ecommerce-sales",
  },
  {
    range: "Websites",
    title: "Conversion Website Build",
    body: "For businesses whose website gets visits but not enough enquiries, bookings or orders.",
    href: "/website-designs",
  },
  {
    range: "Ongoing support",
    title: "Marketing Partnership",
    body: "For teams that want campaigns, development, reporting and technical support handled by one full-service digital agency instead of several suppliers.",
    // Brief: link the partnership card to the page that explains it; CTAs keep /contact.
    href: "/pricing",
  },
];

// Audit T-02 / brief §6: "£4M+ in marketing spend" and "150+ businesses scaled"
// were unverifiable — invented spend and customer counts are exactly what the
// brief forbids. Replaced with facts this repo can stand behind: the team roster,
// the Companies House incorporation year and the service count in the nav.
// [CONFIRM COMPANY INFORMATION] — restore a spend or client-count figure only
// with a real number the client will put their name to.
export const stats = [
  // Client's figure (1 Nov 2026), not a count of the profiles on the About page. Also in components/ui/Proof.tsx.
  { value: "36", label: "Specialists in the team" },
  { value: "13", label: "Services under one roof" },
  { value: "Est. 2019", label: "Companies House no. 12328533" },
  { value: "100%", label: "UK business focus" },
];

const fineDining = caseStudies.find((s) => s.slug === "fine-dining")!;
const bakery = caseStudies.find((s) => s.slug === "bakery")!;
const carShowroom = caseStudies.find((s) => s.slug === "car-showroom")!;
const craft = caseStudies.find((s) => s.slug === "craft-business")!;

function headlineResult(study: (typeof caseStudies)[number]) {
  const result = study.results.find((r) => r.value.includes("%")) ?? study.results[0];
  return `${result.value} ${result.label.replace("Published ", "").replace(/^./, (c) => c.toLowerCase())}`;
}

const fineDiningTraffic = fineDining.results.find((r) => /organic-traffic/i.test(r.label))!;
export const featuredHeading = `Fine dining restaurant: ${fineDiningTraffic.value} more organic traffic`;

export const featuredCase: CaseMeta = {
  sector: fineDining.sector,
  challenge: fineDining.challenges[0],
  work: fineDining.work.map((w) => w.title).join(", "),
  period: fineDining.duration,
  result: headlineResult(fineDining),
  href: `/case-studies/${fineDining.slug}`,
};

export const supportingCases: CaseMeta[] = [bakery, carShowroom, craft].map((study) => ({
  sector: study.sector,
  challenge: study.challenges[0],
  work: study.work.map((w) => w.title).join(", "),
  period: study.duration,
  result: headlineResult(study),
  href: `/case-studies/${study.slug}`,
}));

export const difference = [
  {
    title: "Campaigns Built Around Commercial Intent",
    body: "We focus on the searches, audiences and customer journeys most likely to produce real enquiries or profitable sales, not vanity clicks.",
  },
  {
    title: "Websites Designed to Convert",
    body: "Every page is planned around trust, clarity, speed and the next step a customer needs to take, whether that is a call, a form or a checkout.",
  },
  {
    title: "Tracking That Supports Decisions",
    body: "Reports show what is working, what is wasting budget and what we plan to do next, written in plain English.",
  },
  {
    title: "SEO With Proper Structure",
    body: "Service, location, and category pages are organised so customers and search engines can understand the offer.",
  },
  {
    title: "Clean WordPress Development",
    body: "We build and maintain WordPress sites with performance, usability, and long-term editing in mind.",
  },
  {
    title: "Joined-Up Delivery",
    body: "Marketing, development, conversion, and reporting are treated as one connected system instead of separate tasks.",
  },
];

// Tile labels are the anchor text into each service page, so each one carries
// that page's own focus keyword (brief §7). Eight services, names set by the client
// (18 Nov 2026). Rows run from the narrowest title to the widest, by rendered width at
// 1440px (client; measured 18 Nov 2026: 141, 201, 302, 322, 377, 392, 436, 437px).
// Re-measure if a label changes.
export const services = [
  { label: "AI Services", href: "/ai-services", body: "Chatbots, voice agents, integrations and automation, built and managed for you." },
  { label: "AI Voice Agents", href: "/ai-voice-agents", body: "Answers every call and books appointments, day and night." },
  { label: "Google Ads Advertising", href: "/google-adwords-ppc", body: "Search, Shopping and Performance Max campaigns built around profit." },
  { label: "Amazon PPC Advertising", href: "/amazon-ppc-advertising-agency-uk", body: "Sponsored ads that grow sales without wasting spend." },
  { label: "Paid Social Media Advertising", href: "/social-media-paid-advertising", body: "Meta, Instagram and TikTok ads that turn attention into leads." },
  { label: "Shopify Development Services", href: "/shopify-development", body: "Shopify stores built around your products and your customers." },
  { label: "WordPress Development Services", href: "/wordpress-development", body: "Custom WordPress and WooCommerce builds." },
  { label: "Search Engine Optimisation (SEO)", href: "/seo-services", body: "Technical, on-page and content SEO for long-term organic growth." },
];

// While case studies are unpublished (lib/flags.ts) the quotes come from published Trustpilot/Google reviews instead.
export const testimonials = CASE_STUDIES_LIVE
  ? caseStudies
      .filter((s) => s.testimonial)
      .slice(0, 3)
      .map((s) => ({ quote: s.testimonial!.quote, name: s.testimonial!.attribution }))
  : ["Kiera Taylor-Elton", "Sanjay", "Tania Smyths"].map((n) => {
      const t = siteTestimonials.find((x) => x.name === n)!;
      return { quote: t.quote, name: t.name };
    });

// 14 tiles. The home page draws positions 1, 5, 10 and 12 double-height (the two AI
// tiles among them); with dense packing that is the spread that fills the three-column
// masonry in exactly six rows with no hole. Re-check if a tile is added or removed.
// Each tile links to the page that covers it (client, 18 Nov 2026). No page of its own for GA4, Tag Manager,
// reporting or account support: they go to the service whose packages include them.
export const recognition = [
  { label: "Google Ads", href: "/google-adwords-ppc" },
  { label: "AI Voice Agents", href: "/ai-voice-agents" },
  { label: "Meta Ads", href: "/social-media-paid-advertising" },
  { label: "GA4", href: "/google-adwords-ppc" },
  { label: "Tag Manager", href: "/google-adwords-ppc" },
  { label: "WordPress", href: "/wordpress-development" },
  { label: "WooCommerce", href: "/wordpress-development" },
  { label: "Local SEO", href: "/local-seo" },
  { label: "Landing Pages", href: "/solutions/improve-website-conversion" },
  { label: "Reporting", href: "/solutions/outsource-digital-marketing" },
  { label: "Conversion Rate", href: "/solutions/improve-website-conversion" },
  { label: "Technical SEO", href: "/seo-services" },
  { label: "AI Chatbots", href: "/ai-services" },
  { label: "Account Support", href: "/solutions/outsource-digital-marketing" },
];

export const whoWeWorkWith = {
  eyebrow: "Who we work with",
  title: "A digital marketing agency for small businesses and growing UK brands",
  body: "We work with small and medium-sized businesses across England, Scotland, Wales and Northern Ireland. Our office is in Essex, but we work with clients anywhere in the UK, with video calls, shared dashboards and monthly reporting keeping everyone on the same page.",
  items: [
    "Service businesses that need more enquiries from Google and social media",
    "Ecommerce brands that want more profitable sales from paid and organic channels",
    "Businesses replacing several marketing suppliers with one agency",
    "Growing teams that need senior marketing skills without hiring in-house",
  ],
  closing:
    "If you are comparing marketing companies in the UK, we are happy to look at what you are doing now and tell you honestly where the quickest wins are.",
  cta: { label: "Book a Growth Consultation", href: "/book-a-consultation" },
};

// Rendered in the page HTML (closed <details>, not fetched on click) and published
// word for word as FAQPage schema from this same array.
export const homeFaqs = [
  { q: "What does a full-service digital marketing agency do?", a: "A full-service digital marketing agency handles every part of your online marketing in one place. At OMH that covers strategy, Google Ads, Meta Ads, Amazon PPC, SEO, local SEO, social media, website design, WordPress and Shopify development, conversion improvement, tracking and reporting. You get one team and one plan, instead of managing separate suppliers who do not talk to each other." },
  { q: "Do you work with businesses outside Essex?", a: "Yes. Our office is in Hullbridge, Essex, but we work with clients across the UK. Planning calls, reporting and day-to-day delivery all run online, so where your business is based makes no difference to the service you get." },
  { q: "Are you a good fit for small businesses?", a: "Yes. Many of our clients are small and medium-sized UK businesses. We start with the channels most likely to bring enquiries or sales for your budget, then add more as results come in. You do not need to buy every service on day one." },
  { q: "How much does digital marketing cost?", a: "It depends on the services you need, how competitive your market is and, for paid ads, how much you want to spend on media. Our [pricing page](/pricing) shows our packages, or you can book a growth consultation and we will recommend a plan that fits your goals and budget." },
  { q: "How long does it take to see results?", a: "Paid channels such as Google Ads and Meta Ads can start bringing enquiries within the first few weeks. SEO takes longer, usually several months before rankings and organic traffic grow steadily. We agree realistic targets with you at the start and report against them every month." },
  { q: "How will I know if my marketing is working?", a: "We set up tracking with Google Analytics 4 and Google Tag Manager so enquiries, calls and sales are measured properly. Your reports show what is working, what is wasting budget and what we plan to do next, in plain English." },
];

export const finalCta = {
  headline: "Ready to work with a full-service digital marketing agency?",
  body: "Tell us what you are doing now, what is not working and what you want to improve. We will review it and recommend the clearest next step for your business.",
  primary: { label: "Book a Growth Consultation", href: "/book-a-consultation" },
  secondary: { label: "Send a Project Brief", href: "/contact-us" },
};
