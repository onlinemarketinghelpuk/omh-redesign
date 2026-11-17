import type { MetadataRoute } from "next";
import { readyPages } from "@/lib/content/nav";
import { allCaseStudyPages } from "@/lib/content/case-study-pages";
import { getInsightsIndex } from "@/lib/sanity/insights";
import { SITE } from "@/lib/schema";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

// Audit T-01: the live page-sitemap.xml holds 15 URLs and omits
// /wordpress-development/, About, Contact, FAQ and Case Studies. Deriving the
// sitemap from readyPages means a page can't be published and left out again.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const insights = await getInsightsIndex();

  const paths = [
    ...readyPages.map((p) => p.href),
    ...(CASE_STUDIES_LIVE ? allCaseStudyPages : []).map((c) => `/case-studies/${c.slug}`),
    "/get-more-leads", // ad landing page, outside the menu
  ];

  return [
    ...paths.map((path) => ({
      url: `${SITE}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    // Posts carry their real last edit from Sanity (15 Nov 2026): Google uses lastmod when it is accurate and
    // ignores changefreq/priority. Code-built pages get none, rather than a build date that makes every page look new.
    ...insights.map((post) => ({
      url: `${SITE}/${post.slug}`,
      lastModified: post.modifiedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
