import type { Metadata } from "next";
import { EstatePage, estateMetadata } from "@/components/voice-agents/EstatePage";
import { IndustryPage, industryMetadata } from "@/components/voice-agents/IndustryPage";
import { industryPaths } from "@/lib/content/voice-industry";

type Props = { params: Promise<{ industry: string }> };

// Not `dynamicParams = false`: once revalidateTag("posts") expires this page, Next 16
// treats the path as unknown and app/[...slug] caches "Coming soon" in its place.
// Unknown industries still 404 through notFound() in IndustryPage.

// Real estate uses the /ai-voice-agents layout with its own content (21 Oct 2026); the others use IndustryPage.
const ESTATE = "real-estate-letting-agents";

export function generateStaticParams() {
  return [...industryPaths.filter((p) => !p.includes("/")), ESTATE].map((industry) => ({ industry }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  return industry === ESTATE ? estateMetadata : industryMetadata(industry);
}

export default async function Page({ params }: Props) {
  const { industry } = await params;
  return industry === ESTATE ? <EstatePage /> : <IndustryPage path={industry} />;
}
