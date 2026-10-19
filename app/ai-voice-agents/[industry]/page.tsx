import type { Metadata } from "next";
import { IndustryPage, industryMetadata } from "@/components/voice-agents/IndustryPage";
import { industryPaths } from "@/lib/content/voice-industry";

type Props = { params: Promise<{ industry: string }> };

// Not `dynamicParams = false`: once revalidateTag("posts") expires this page, Next 16
// treats the path as unknown and app/[...slug] caches "Coming soon" in its place.
// Unknown industries still 404 through notFound() in IndustryPage.

export function generateStaticParams() {
  return industryPaths.filter((p) => !p.includes("/")).map((industry) => ({ industry }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return industryMetadata((await params).industry);
}

export default async function Page({ params }: Props) {
  return <IndustryPage path={(await params).industry} />;
}
