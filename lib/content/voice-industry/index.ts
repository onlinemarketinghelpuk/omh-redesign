import type { IndustryCopy } from "@/components/voice-agents/IndustryScript";
import * as clinics from "./clinics-healthcare";
import * as dental from "./dental-clinics";
import * as dentalLondon from "./dental-clinics-london";
import * as dentalLondonV2 from "./dental-clinics-london-v2";
import * as dentalV2 from "./dental-clinics-v2";
import * as estate from "./estate-letting-agents";
import * as estateLondon from "./estate-letting-agents-london";
import * as estateLondonV2 from "./estate-letting-agents-london-v2";

/*
  AI voice agent industry and city pages, keyed by their path under
  /ai-voice-agents/. Not in the menu or sitemap yet (both come from
  lib/content/nav.ts), so they are reachable by URL only. The v2 pages are
  alternative designs and keep the first version as their canonical.

  `blocks` turns on the page-specific parts of industry-script.js, and
  `classes` the matching styles in app/ai-voice-agents/industry.css.
*/

const estateCopy: IndustryCopy = {
  org: "agency",
  units: "branches",
  demoName: "Wren & Marlow",
  greeting: "I'm Ella, the branch's AI assistant. Are you calling about a property, a valuation or a rental?",
};

const clinicCopy: IndustryCopy = {
  org: "clinic",
  units: "consulting rooms",
  demoName: "Brookfield Clinic",
  greeting: "I'm Ruth, the clinic's AI assistant. Are you calling to book, or about an existing appointment?",
};

const dentalCopy: IndustryCopy = {
  org: "practice",
  units: "surgeries",
  demoName: "Albion Square Dental",
  greeting: "I'm Amy, the practice's AI assistant. Are you calling to book an appointment, or about something urgent?",
};

export const industryPages = {
  // Frozen backup of the estate page before it moved onto the /ai-voice-agents layout (21 Oct 2026, git tag
  // estate-oldv1). Hidden from search, no JSON-LD. The live page is app/ai-voice-agents/[industry]/page.tsx →
  // components/voice-agents/EstatePage.tsx. Do not edit ./estate-letting-agents.ts.
  "real-estate-letting-agents-oldv1": {
    ...estate,
    meta: { ...estate.meta, title: "AI Receptionist for Real Estate (oldv1 backup) | OMH", noindex: true },
    schema: [],
    copy: estateCopy,
    blocks: [],
    classes: "",
  },
  "real-estate-letting-agents/london": { ...estateLondon, copy: estateCopy, blocks: ["london"], classes: "vi-london" },
  "real-estate-letting-agents/london-v2": {
    ...estateLondonV2,
    copy: estateCopy,
    blocks: ["london", "estate-london-v2"],
    classes: "vi-london vi-london-v2",
  },
  "clinics-healthcare": { ...clinics, copy: clinicCopy, blocks: [], classes: "" },
  "dental-clinics": { ...dental, copy: dentalCopy, blocks: [], classes: "" },
  "dental-clinics-v2": { ...dentalV2, copy: dentalCopy, blocks: ["dental-v2"], classes: "vi-dental-v2" },
  "dental-clinics/london": { ...dentalLondon, copy: dentalCopy, blocks: ["london"], classes: "vi-london" },
  "dental-clinics/london-v2": {
    ...dentalLondonV2,
    copy: dentalCopy,
    blocks: ["london", "dental-london-v2"],
    classes: "vi-london vi-london-v2",
  },
};

export type IndustryPath = keyof typeof industryPages;
export const industryPaths = Object.keys(industryPages) as IndustryPath[];
