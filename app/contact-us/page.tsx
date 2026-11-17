import type { Metadata } from "next";
import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { GeneralContactForm } from "@/components/forms/GeneralContactForm";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Proof";
import { company } from "@/lib/content/nav";

export const metadata: Metadata = {
  title: "Contact Us",
  alternates: { canonical: "https://onlinemarketinghelp.co.uk/contact-us" },
  description:
    "Contact Online Marketing Help: call 020 3489 3934, email support@onlinemarketinghelp.co.uk or send us a message. UK-based web design and digital marketing.",
};

// Contact Us (client, 17 Nov 2026): general contact, linked from the Company menu. Consultations are booked on
// /book-a-consultation, so this page has its own layout: contact cards across the hero, then message + booking.
const channels: { label: string; value: string; href?: string; icon: LucideIcon; event?: string; long?: boolean }[] = [
  { label: "Call us", value: company.phoneDisplay, href: company.phoneHref, icon: Phone, event: "contact_us_phone_click" },
  { label: "Email us", value: company.email, href: `mailto:${company.email}`, icon: Mail, event: "contact_us_email_click", long: true },
  { label: "Where we are", value: company.address, icon: MapPin },
];

export default function ContactUsPage() {
  return (
    <>
      <section className="hero-grid overflow-x-clip border-b border-line bg-warm">
        <div className="container-omh section-hero">
          <Eyebrow>Contact Us</Eyebrow>
          <h1 className="mt-7 max-w-[18ch] font-sans text-display font-semibold text-balance">
            Get in touch with <span className="text-amber-deep">Online Marketing Help</span>
          </h1>
          <p className="mt-6 max-w-[62ch] text-lead leading-relaxed text-ink/75">
            A question, help with an existing project or something else: call, email or send us a message and a real
            person will reply.
          </p>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {channels.map(({ label, value, href, icon: Icon, event, long }) => {
              const body = (
                <>
                  <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-line bg-warm text-amber-deep">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="mt-5 block text-[14px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
                  <span className={`mt-1.5 block break-words font-sans font-semibold ${long ? "text-lead" : "text-h4"}`}>
                    {/* An email breaks after the @ on phones, never inside the domain. */}
                    {long ? <>{value.split("@")[0]}@<wbr />{value.split("@")[1]}</> : value}
                  </span>
                </>
              );
              return (
                <li key={label} className="rounded-card border border-line bg-surface">
                  {href ? (
                    <a href={href} data-event={event} className="block h-full p-7 transition-colors hover:text-amber-deep">
                      {body}
                    </a>
                  ) : (
                    <div className="p-7">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-omh section-md grid gap-12 lg:grid-cols-12 lg:gap-x-14">
          <div className="lg:col-span-7">
            <h2 className="font-sans text-h2 font-semibold">Send us a message</h2>
            <p className="mb-8 mt-4 text-body leading-relaxed text-ink/75">Tell us what it&apos;s about and how to reach you.</p>
            <GeneralContactForm />
          </div>

          <aside className="grid content-start gap-6 lg:col-span-5">
            <div className="rounded-card bg-inverse p-8 text-oninverse max-sm:p-6">
              <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-oninverse/70">Planning your growth?</p>
              <h2 className="mt-4 font-sans text-h3 font-semibold">Book a Growth Consultation instead</h2>
              <p className="mt-4 text-body leading-relaxed text-oninverse/75">
                For advice on your website, ads or SEO, book a free 30-minute consultation and we&apos;ll come back
                with a practical recommendation.
              </p>
              <Button href="/book-a-consultation" data-event="contact_us_booking_click" className="mt-7">
                Book a Growth Consultation
              </Button>
            </div>
            <div className="rounded-card border border-line p-8 max-sm:p-6">
              <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-muted">Follow us</p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {company.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="tap-target text-body font-semibold underline underline-offset-4 hover:text-amber-deep">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
