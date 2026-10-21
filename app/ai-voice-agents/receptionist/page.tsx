import type { Metadata } from "next";
import { BookDemo } from "@/components/BookDemo";
import { receptionistGraph, receptionistMarkup, receptionistMeta } from "@/lib/content/ai-receptionist";
import { JsonLd, SITE } from "@/lib/schema";
import "./receptionist.css";

/*
  /ai-voice-agents/receptionist (21 Oct 2026): the client's AI receptionist page, as supplied
  (lib/content/ai-receptionist.ts), inside the site's own header and footer, with the shared booking form at the end.
  Its own stylesheet is scoped to .rcp (./receptionist.css). A static route, so it wins over [industry].
*/

const url = `${SITE}/ai-voice-agents/receptionist`;
const { title, description } = receptionistMeta;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { type: "website", locale: "en_GB", siteName: "Online Marketing Help", title, description, url },
  twitter: { card: "summary_large_image", title, description },
};

export default function AiReceptionistPage() {
  return (
    <>
      <JsonLd data={receptionistGraph} />
      <div className="rcp" dangerouslySetInnerHTML={{ __html: receptionistMarkup }} />
      <BookDemo
        id="book-demo-form"
        heading={
          <>
            Book an AI receptionist demo, <span className="text-[#f2c675]">by video or phone</span>
          </>
        }
      />
    </>
  );
}
