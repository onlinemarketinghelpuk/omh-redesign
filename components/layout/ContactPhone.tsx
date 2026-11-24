"use client";

import { usePathname } from "next/navigation";
import { company } from "@/lib/content/nav";
import { whatsapp } from "@/lib/content/whatsapp";

/** The site's phone link, except on the car-wash landing page, where it opens the campaign's WhatsApp chat. */
export function ContactPhone({ className, onClick }: { className?: string; onClick?: () => void }) {
  if (usePathname() === whatsapp.page) {
    return (
      <a
        href={whatsapp.href}
        target="_blank"
        rel="noopener"
        aria-label={`Message us on WhatsApp: ${whatsapp.display}`}
        data-event="get_more_leads_whatsapp_click"
        className={className}
        onClick={onClick}
      >
        {whatsapp.display}
      </a>
    );
  }
  return (
    <a href={company.phoneHref} className={className} onClick={onClick}>
      {company.phoneDisplay}
    </a>
  );
}
