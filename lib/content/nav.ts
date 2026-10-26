// Navigation and company facts, kept out of layout code (brief §21/§22).
// IA matches the master brief §7. `ready: true` marks pages that are actually
// designed in this preview; every other route falls through to the coming-soon
// page (app/[...slug]), so the client can walk the full planned structure
// without hitting a 404.

export type NavLink = { label: string; href: string; ready?: boolean };
export type NavColumn = { heading?: string; links: NavLink[] };
export type NavItem = { label: string; href?: string; columns?: NavColumn[] };

// Shared by the Services mega menu and the footer.
const serviceColumns: NavColumn[] = [
  {
    heading: "Websites",
    links: [
      { label: "Website Designs", href: "/website-designs", ready: true },
      { label: "Shopify Development", href: "/shopify-development", ready: true },
      { label: "Website Maintenance", href: "/wordpress-website-maintenance", ready: true },
      { label: "WordPress Development", href: "/wordpress-development", ready: true },
    ],
  },
  {
    heading: "Paid Advertising",
    links: [
      { label: "Paid Social Advertising", href: "/social-media-paid-advertising", ready: true },
      { label: "Amazon PPC Advertising", href: "/amazon-ppc-advertising-agency-uk", ready: true },
      { label: "Google Ads Management", href: "/google-adwords-ppc", ready: true },
    ],
  },
  {
    heading: "Organic Growth",
    links: [
      { label: "Local SEO", href: "/local-seo", ready: true },
      { label: "SEO Services", href: "/seo-services", ready: true },
      { label: "Ecommerce SEO", href: "/ecommerce-seo-services", ready: true },
    ],
  },
  {
    heading: "Creative & Social",
    links: [
      { label: "Facebook Marketing", href: "/facebook-marketing-agency", ready: true },
      { label: "Instagram Marketing", href: "/instagram-marketing-agency", ready: true },
      { label: "Social Media Management", href: "/social-media-marketing-services", ready: true },
    ],
  },
];

export const primaryNav: NavItem[] = [
  {
    label: "Solutions",
    columns: [
      {
        links: [
          { label: "Grow Local Visibility", href: "/solutions/grow-local-visibility", ready: true },
          { label: "Increase Ecommerce Sales", href: "/solutions/increase-ecommerce-sales", ready: true },
          { label: "Improve Website Conversion", href: "/solutions/improve-website-conversion", ready: true },
          { label: "Generate More Qualified Leads", href: "/solutions/generate-qualified-leads", ready: true },
          { label: "Outsource Your Digital Marketing", href: "/solutions/outsource-digital-marketing", ready: true },
        ],
      },
    ],
  },
  {
    label: "Services",
    columns: serviceColumns,
  },
  {
    // Mega menu (client, 22 Oct 2026): voice agents and their industry pages, then the sections of /ai-services.
    // "Custom AI Voice Agents" leads; the rest of each column runs widest to narrowest by rendered width in the
    // menu font (measured, not character count). Re-measure if a label changes.
    label: "AI Services",
    columns: [
      {
        heading: "AI Receptionist",
        links: [
          { label: "Custom AI Voice Agents", href: "/ai-voice-agents", ready: true },
          { label: "AI Agent for Builders & Construction", href: "/ai-voice-agents/builders-construction", ready: true },
          { label: "AI Agent for Estate & Letting Agents", href: "/ai-voice-agents/estate-letting-agents", ready: true },
          { label: "AI Agent for Healthcare & Clinics", href: "/ai-voice-agents/healthcare", ready: true },
          { label: "AI Agent for Heating & HVAC", href: "/ai-voice-agents/heating-hvac", ready: true },
          { label: "AI Agent for Car Dealerships", href: "/ai-voice-agents/car-dealerships", ready: true },
          { label: "AI Agent for Law Firms", href: "/ai-voice-agents/law-firms", ready: true },
          { label: "AI Agent for Plumbers", href: "/ai-voice-agents/plumbers", ready: true },
          { label: "AI Agent for Dentists", href: "/ai-voice-agents/dentists", ready: true },
        ],
      },
      {
        heading: "Build with AI",
        links: [
          { label: "AI Technology Consulting", href: "/ai-services#ai-consulting", ready: true },
          { label: "AI Websites & Software", href: "/ai-services#ai-websites-software", ready: true },
          { label: "AI Chatbot", href: "/ai-services#ai-chatbot", ready: true },
          { label: "AI UGC", href: "/ai-services#ai-ugc", ready: true },
        ],
      },
    ],
  },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Insights", href: "/insights" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Company",
    columns: [
      {
        heading: "About OMH",
        links: [
          { label: "FAQ", href: "/faq", ready: true },
          { label: "Contact", href: "/contact", ready: true },
          { label: "About Us", href: "/about-us", ready: true },
        ],
      },
      {
        heading: "Policies",
        links: [
          { label: "Warranty", href: "/warranty", ready: true },
          { label: "Cookie Policy", href: "/cookies", ready: true },
          { label: "Privacy Policy", href: "/privacy", ready: true },
          { label: "Terms & Conditions", href: "/terms", ready: true },
        ],
      },
    ],
  },
];

// Pages designed in this preview. The coming-soon page points visitors here.
export const readyPages: NavLink[] = [
  { label: "Home", href: "/", ready: true },
  { label: "WordPress Development", href: "/wordpress-development", ready: true },
  { label: "Website Designs", href: "/website-designs", ready: true },
  { label: "Shopify Development", href: "/shopify-development", ready: true },
  { label: "WordPress Maintenance", href: "/wordpress-website-maintenance", ready: true },
  { label: "Google Ads PPC", href: "/google-adwords-ppc", ready: true },
  { label: "Amazon PPC Advertising", href: "/amazon-ppc-advertising-agency-uk", ready: true },
  { label: "Local SEO", href: "/local-seo", ready: true },
  { label: "Social Media Marketing", href: "/social-media-marketing-services", ready: true },
  { label: "Paid Social Advertising", href: "/social-media-paid-advertising", ready: true },
  { label: "About", href: "/about-us", ready: true },
  { label: "Case Studies", href: "/case-studies", ready: true },
  { label: "Insights", href: "/insights", ready: true },
  { label: "Contact", href: "/contact", ready: true },
  { label: "Generate More Qualified Leads", href: "/solutions/generate-qualified-leads", ready: true },
  { label: "Increase Ecommerce Sales", href: "/solutions/increase-ecommerce-sales", ready: true },
  { label: "Improve Website Conversion", href: "/solutions/improve-website-conversion", ready: true },
  { label: "Grow Local Visibility", href: "/solutions/grow-local-visibility", ready: true },
  { label: "Outsource Your Digital Marketing", href: "/solutions/outsource-digital-marketing", ready: true },
  { label: "Pricing", href: "/pricing", ready: true },
  { label: "FAQ", href: "/faq", ready: true },
  { label: "Warranty", href: "/warranty", ready: true },
  { label: "Privacy Policy", href: "/privacy", ready: true },
  { label: "Cookie Policy", href: "/cookies", ready: true },
  { label: "Terms & Conditions", href: "/terms", ready: true },
  { label: "SEO Services", href: "/seo-services", ready: true },
  { label: "Ecommerce SEO", href: "/ecommerce-seo-services", ready: true },
  { label: "AI Services", href: "/ai-services", ready: true },
  { label: "Custom AI Voice Agents", href: "/ai-voice-agents", ready: true },
  { label: "AI Receptionist", href: "/ai-voice-agents/receptionist", ready: true },
  { label: "Facebook Marketing", href: "/facebook-marketing-agency", ready: true },
  { label: "Instagram Marketing", href: "/instagram-marketing-agency", ready: true },
];

// href → friendly label, so the coming-soon page can title itself correctly.
export const navLabels: Record<string, string> = (() => {
  const out: Record<string, string> = { "/": "Home", "/contact": "Contact" };
  for (const item of primaryNav) {
    if (item.href) out[item.href] = item.label;
    for (const col of item.columns ?? []) {
      for (const link of col.links) out[link.href] = link.label;
    }
  }
  return out;
})();

export const company = {
  name: "Online Marketing Help",
  phoneDisplay: "020 3489 3934",
  phoneHref: "tel:+442034893934",
  email: "support@onlinemarketinghelp.co.uk",
  address: "The Hut, Central Ave, Hullbridge SS5 6AU", // ◈ confirm current
  companyNo: "12328533", // ◈ confirm
  // Profiles as listed on the live thank-you page; the footer links and the
  // schema's sameAs both read this list.
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/onlinemarketinghelpuk/" },
    { label: "Instagram", href: "https://www.instagram.com/onlinemarketinghelpuk/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/34580209/" },
    { label: "X", href: "https://twitter.com/MarketingHelp1" },
  ],
  positioning:
    "Full-service digital marketing and web development for UK service businesses and ecommerce brands.",
};

// Footer link groups after the brand intro: the first three service groups as
// in the mega menu, then Solutions, then the top five AI Services pages (client
// audit, 26 Oct 2026: this replaced the Company column). Within every column the
// links run narrowest to widest by rendered width (measured in the footer font,
// not character count — "Paid Social Advertising" renders narrower than
// "Google Ads Management"). Re-measure if a label changes.
export const footerCols: NavColumn[] = [
  ...serviceColumns.slice(0, 3),
  {
    heading: "Solutions",
    links: [
      { label: "Grow Local Visibility", href: "/solutions/grow-local-visibility" },
      { label: "Increase Ecommerce Sales", href: "/solutions/increase-ecommerce-sales" },
      { label: "Improve Website Conversion", href: "/solutions/improve-website-conversion" },
      { label: "Generate More Qualified Leads", href: "/solutions/generate-qualified-leads" },
      { label: "AI Voice Agents", href: "/ai-voice-agents" },
    ],
  },
  {
    heading: "AI Services",
    links: [
      { label: "Custom AI Voice Agents", href: "/ai-voice-agents" },
      { label: "AI Agent for Heating & HVAC", href: "/ai-voice-agents/heating-hvac" },
      { label: "AI Agent for Healthcare & Clinics", href: "/ai-voice-agents/healthcare" },
      { label: "AI Agent for Builders & Construction", href: "/ai-voice-agents/builders-construction" },
      { label: "AI Agent for Estate & Letting Agents", href: "/ai-voice-agents/estate-letting-agents" },
    ],
  },
];

export const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
  { label: "Terms", href: "/terms" }
];
