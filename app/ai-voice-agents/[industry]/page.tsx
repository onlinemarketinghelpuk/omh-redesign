import type { Metadata } from "next";
import { ClinicsPage, clinicsMetadata } from "@/components/voice-agents/ClinicsPage";
import { DentalPage, dentalMetadata } from "@/components/voice-agents/DentalPage";
import { EstatePage, estateMetadata } from "@/components/voice-agents/EstatePage";
import { IndustryPage, industryMetadata } from "@/components/voice-agents/IndustryPage";
import { industryPaths } from "@/lib/content/voice-industry";

type Props = { params: Promise<{ industry: string }> };

// Not `dynamicParams = false`: once revalidateTag("posts") expires this page, Next 16
// treats the path as unknown and app/[...slug] caches "Coming soon" in its place.
// Unknown industries still 404 through notFound() in IndustryPage.

// Industries rebuilt on the /ai-voice-agents layout with their own content (21 Oct 2026); the others use IndustryPage.
const LANDINGS = {
  "real-estate-letting-agents": { Page: EstatePage, metadata: estateMetadata },
  "dental-clinics": { Page: DentalPage, metadata: dentalMetadata },
  "clinics-healthcare": { Page: ClinicsPage, metadata: clinicsMetadata },
} as const;
const landing = (industry: string) => LANDINGS[industry as keyof typeof LANDINGS];

export function generateStaticParams() {
  return [...industryPaths.filter((p) => !p.includes("/")), ...Object.keys(LANDINGS)].map((industry) => ({ industry }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  return landing(industry)?.metadata ?? industryMetadata(industry);
}

export default async function Page({ params }: Props) {
  const { industry } = await params;
  const own = landing(industry);
  return own ? <own.Page /> : <IndustryPage path={industry} />;
}
