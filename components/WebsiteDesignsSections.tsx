import Image from "@/components/ui/SiteImage";
import Link from "next/link";
import {
  ArrowDown,
  Calculator,
  Dumbbell,
  HardHat,
  Heart,
  Home,
  Mail,
  Megaphone,
  Music,
  Phone,
  Scale,
  ShoppingCart,
  SprayCan,
  Stethoscope,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { CaseStudyVisual } from "@/components/case-studies/CaseStudyVisual";
import { DemoViewer } from "@/components/DemoViewer";
import { GalleryImage } from "@/components/GalleryImage";
import { RelatedServices } from "@/components/RelatedServices";
import { SiteTestimonials } from "@/components/Testimonials";
import { ServiceBand } from "@/components/services/ServiceBand";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceHeroArt } from "@/components/services/ServiceHeroArt";
import { AccentTitle, CheckIcon } from "@/components/services/ServicePrimitives";
import { ArrowRight, Button, TextLink } from "@/components/ui/Button";
import { FinalCta } from "@/components/ui/FinalCta";
import { ShowMore } from "@/components/ui/ShowMore";
import { Split } from "@/components/ui/Split";
import { Eyebrow } from "@/components/ui/Proof";
import { caseStudies } from "@/lib/content/case-studies";
import { company } from "@/lib/content/nav";
import { websiteDesigns as page } from "@/lib/content/website-designs";
import portfolioDemos from "@/lib/content/portfolio-demos.json";
import { wordpressDevelopment } from "@/lib/content/wordpress-development";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

/*
  Phase 7 — /website-designs. Scaffold rule: every section is a `ServiceBand`,
  one label treatment (`topline`) for the whole page, alternating grounds so no
  two consecutive bands share one.

  Client audit, 26 Oct 2026: hero art, sector cards, a price strip under the
  pricing copy, case-study cards with photos, a contact card, the guarantee
  with its badge, plus related services and an FAQ.
*/

const LABEL = "topline" as const;
const ACCENT = "bg-amber";

// The portfolio: the HTML demo designs (public/portfolio/<folder>/, listed in portfolio-demos.json by
// scripts/portfolio-shots.mjs). Each folder is named after an industry card ("Non-Profit Websites" ->
// non-profit), so the card links down to its designs and the section takes the card's name, in card order.
const sectorSlug = (sector: string) => sector.replace(/ Websites$/, "").toLowerCase().replace(/\s+/g, "-");
const gallery = portfolioDemos
  .map((c) => {
    const sector = page.help.sectors.find((s) => sectorSlug(s) === c.slug);
    return {
      id: `designs-${c.slug}`,
      title: sector ? sector.replace(/Websites$/, "Designs") : c.title,
      order: sector ? page.help.sectors.indexOf(sector) : page.help.sectors.length,
      items: c.items.map((d) => ({ key: d.demo, src: d.shot, alt: d.alt, width: d.width, height: d.height, demo: d.demo })),
    };
  })
  .sort((a, b) => a.order - b.order);
const designCount = (n: number) => `${n} design${n === 1 ? "" : "s"}`;

const sectorIcons: Record<string, LucideIcon> = {
  Construction: HardHat,
  Accountancy: Calculator,
  eCommerce: ShoppingCart,
  "Non-Profit": Heart,
  Marketing: Megaphone,
  Fitness: Dumbbell,
  Cleaning: SprayCan,
  Legal: Scale,
  Medical: Stethoscope,
  "Real Estate": Home,
  Nightclub: Music,
  Restaurant: UtensilsCrossed,
};

function GuaranteeBadge() {
  return (
    <svg viewBox="0 0 240 240" className="mx-auto w-[min(260px,70%)]" role="img" aria-label="Money-back guarantee, backed by our CEO">
      <defs>
        <path id="badge-ring" d="M120,120 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
      </defs>
      <circle cx="120" cy="120" r="112" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 6" opacity=".7" />
      <circle cx="120" cy="120" r="104" fill="none" stroke="var(--accent)" strokeWidth="1" opacity=".5" />
      {/* The panel is black in both themes: white ring text (brown on black was 3.4:1), and the inner label on
          two white lines so it fits inside the r=60 ring (one line was wider than the circle). */}
      <text fill="var(--color-oninverse)" fontSize="13" fontWeight="700" letterSpacing="3" fontFamily="var(--font-instrument), sans-serif">
        <textPath href="#badge-ring" startOffset="2%">MONEY-BACK GUARANTEE • ONLINE MARKETING HELP •</textPath>
      </text>
      <circle cx="120" cy="120" r="68" fill="var(--accent)" />
      <circle cx="120" cy="120" r="60" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M120 76l20 7.5v15c0 13.5-8.5 23.5-20 27.5-11.5-4-20-14-20-27.5V83.5z" fill="#000" />
      <path d="M111.5 101.5l6 6 11.5-12.5" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <text textAnchor="middle" fill="var(--color-oninverse)" fontSize="10" fontWeight="700" letterSpacing="1.6" fontFamily="var(--font-instrument), sans-serif">
        <tspan x="120" y="147">BACKED BY</tspan>
        <tspan x="120" y="160">OUR CEO</tspan>
      </text>
    </svg>
  );
}

export function WebsiteDesignsPage() {
  const websiteCases = caseStudies.filter((c) => c.category === "Website").slice(0, 2);
  const ceo = { name: "Melissa", role: "CEO, Online Marketing Help", photo: "/images/about/Melissa.jpg" };

  return (
    <main>
      <ServiceBand label={page.title} tone="warm" accent={ACCENT} labelStyle="plain" className="hero-grid">
        {/* CSS-only entrance, not <Reveal>: the hero paints before hydration. */}
        <Split ratio="6/6" from="lg" align="center">
          <div className="hero-in">
            <h1 className="font-sans text-display font-semibold text-balance"><AccentTitle text={page.heading} /></h1>
            <p className="mt-5 font-sans text-h3 font-semibold text-amber-deep text-balance">
              {page.standfirst}
            </p>
            <p className="mt-5 text-lead leading-relaxed text-ink/75">{page.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3.5 max-sm:flex-col max-sm:items-stretch">
              <Button href="/book-a-consultation" data-event="website_designs_consultation_click">
                {page.ctas.consultation}
              </Button>
              <Button href="/contact-us" variant="secondary" data-event="website_designs_contact_click">
                {page.ctas.contact}
              </Button>
            </div>
          </div>
          <div className="hero-in hero-in-2">
            <ServiceHeroArt variant="designs" />
          </div>
        </Split>

        <Split ratio="5/6" className="mt-14">
          <div>
            <Eyebrow>{page.statEyebrow}</Eyebrow>
            <h2 className="mt-5 font-sans text-h3 font-semibold text-balance">{page.statHeading}</h2>
          </div>
          <div>
            {page.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 text-body leading-relaxed text-ink/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Split>
      </ServiceBand>

      <ServiceBand
        id="how-we-can-help"
        label={page.help.eyebrow}
        tone="white"
        accent={ACCENT}
        labelStyle={LABEL}
      >
        <Split ratio="6/6" from="lg" align="end">
          <h2 className="font-sans text-h2 font-semibold text-balance">{page.help.heading}</h2>
          <p className="text-body leading-relaxed text-ink/75">{page.help.intro}</p>
        </Split>
        <ul className="mt-10 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {page.help.sectors.map((sector) => {
            const Icon = sectorIcons[sector.replace(/ Websites$/, "")] ?? HardHat;
            // Industries with designs in the portfolio link down to them (client, 18 Nov 2026).
            const designs = gallery.find((c) => c.id === `designs-${sectorSlug(sector)}`);
            const inner = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-soft text-amber-deep">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {sector}
                {designs && <ArrowDown className="ml-auto size-4 shrink-0 text-muted transition-transform group-hover/sector:translate-y-0.5" aria-hidden="true" />}
              </>
            );
            const card = "surface-card flex h-full items-center gap-3.5 rounded-card border border-line bg-warm/55 px-5 py-4 font-sans text-[17px] font-semibold";
            return (
              <li key={sector}>
                {designs ? (
                  <a href={`#${designs.id}`} aria-label={`${sector}: see ${designCount(designs.items.length)}`} data-event="website_designs_sector_click" className={`${card} group/sector transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber`}>
                    {inner}
                  </a>
                ) : (
                  <div className={card}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
        <Split ratio="4/8" gap={10} align="center" className="mt-6 rounded-card border border-line bg-warm/55 p-card">
          <div>
            <h3 className="font-sans text-h4 font-semibold">{page.help.tradesTitle}</h3>
            <p className="mt-3 text-body leading-relaxed text-ink/75">{page.help.tradesLead}</p>
          </div>
          <ul className="flex flex-wrap items-center gap-2.5">
            {page.help.trades.map((trade) => (
              <li key={trade} className="rounded-full border border-line bg-surface px-4 py-2 text-body text-ink/75">
                {trade}
              </li>
            ))}
            <li>
              <Button href="/contact-us" data-event="website_designs_trades_contact_click">
                {page.help.tradesCta}
              </Button>
            </li>
          </ul>
        </Split>
      </ServiceBand>

      <ServiceBand label={page.gallery.eyebrow} tone="mist" accent={ACCENT} labelStyle={LABEL}>
        <h2 className="font-sans text-h2 font-semibold text-balance">
          {page.gallery.heading}
        </h2>
        <p className="mt-4 hidden text-body text-muted pointer-fine:block">Hover over a design to scroll through the page.</p>
        <p className="mt-4 hidden text-body text-muted pointer-coarse:block">Tap a design to scroll through the page.</p>
        <div className="mt-12 flex flex-col gap-14">
          {gallery.map((category) => (
            <section key={category.id} id={category.id} aria-label={category.title} className="scroll-mt-28">
              <h3 className="flex items-center gap-4 font-sans text-h4 font-semibold">
                {category.title}
                <span aria-hidden className="flex-1" />
                <span className="whitespace-nowrap text-bsm font-medium text-muted tabular-nums">
                  {designCount(category.items.length)}
                </span>
              </h3>
              {/* Phones show two designs per category and a button for the rest (the gallery ran to 14 screens). */}
              <ShowMore as="ul" limit={2} noun="designs" className="mt-7 grid grid-cols-3 gap-6 max-md:grid-cols-2 max-sm:grid-cols-1">
                {category.items.map((item, i) => (
                  <li key={item.key}>
                    {/* Browser-window card. On hover the full-page screenshot slides up until its
                        bottom meets the frame: 100cqh is the frame height,
                        min() keeps screenshots shorter than the frame still. Focus does the same, so a tap
                        scrolls it on touch screens (no hover there) and keyboard users get it too. */}
                    <figure tabIndex={0} className="group overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow] duration-300 hover:border-ink/30 hover:shadow-[0_28px_60px_-34px_rgb(0_0_0/0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber">
                      <div aria-hidden className="flex items-center gap-1.5 border-b border-line px-4 py-3">
                        <span className="size-2.5 rounded-full bg-ink/15" />
                        <span className="size-2.5 rounded-full bg-ink/15" />
                        <span className="size-2.5 rounded-full bg-ink/15" />
                        <span className="ml-3 min-w-0 flex-1 truncate rounded-full bg-ink/[0.05] px-3 py-1 text-[14px] text-muted">
                          {category.title.replace(/ Designs$/, "")} · {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface [container-type:size]">
                        {/* Screenshots are whole pages (about eight screens), so the scroll is slow. */}
                        <GalleryImage
                          src={item.src}
                          alt={item.alt}
                          width={item.width}
                          height={item.height}
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="absolute inset-x-0 top-0 h-auto w-full transition-transform duration-700 ease-out group-hover:ease-in-out group-focus:ease-in-out group-hover:duration-[14000ms] group-focus:duration-[14000ms] motion-safe:group-hover:translate-y-[min(0px,calc(100cqh-100%))] motion-safe:group-focus:translate-y-[min(0px,calc(100cqh-100%))]"
                        />
                        {/* A button over the screenshot on hover or focus (always shown on touch screens; no dark
                            overlay, client 18 Nov 2026) opens the live demo in a popup. */}
                        <DemoViewer url={item.demo} title={item.alt} />
                      </div>
                    </figure>
                  </li>
                ))}
              </ShowMore>
            </section>
          ))}
        </div>
      </ServiceBand>

      <ServiceBand label={page.pricing.eyebrow} tone="warm" accent={ACCENT} labelStyle={LABEL}>
        <Split ratio="5/6">
          <h2 className="font-sans text-h2 font-semibold text-balance">
            {page.pricing.heading}
          </h2>
          <div>
            {page.pricing.body.map((paragraph) => (
              <p key={paragraph} className="mt-6 text-body leading-relaxed text-ink/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Split>
        {/* The published WordPress website packages, so "transparent pricing" shows a price. */}
        <ul className="mt-12 grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {wordpressDevelopment.packages.map((pkg) => (
            <li key={pkg.name} className="surface-card flex flex-col rounded-card border border-line bg-surface p-6">
              <p className="eyebrow text-muted">{pkg.stage}</p>
              <h3 className="mt-2 font-sans text-h4 font-semibold">{pkg.name}</h3>
              <p className="mt-3 font-sans text-price font-semibold tracking-[-0.02em]">
                {pkg.price}
                <span className="eyebrow ml-2 text-muted">from</span>
              </p>
              <p className="mt-4 text-bsm leading-relaxed text-ink/70">{pkg.bestFor}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button href="/pricing" data-event="website_designs_pricing_click">
            View the price list
          </Button>
          <TextLink href="/wordpress-development#packages" data-event="website_designs_packages_click">Compare what each package includes</TextLink>
        </div>
      </ServiceBand>

      {CASE_STUDIES_LIVE && (
      <ServiceBand label={page.caseStudies.eyebrow} tone="white" accent={ACCENT} labelStyle={LABEL}>
        <div className="flex items-end justify-between gap-10 max-lg:block">
          <h2 className="font-sans text-h2 font-semibold text-balance">
            {page.caseStudies.heading}
          </h2>
          <div className="shrink-0 max-lg:mt-5">
            <TextLink href="/case-studies" data-event="website_designs_all_case_studies_click">View all case studies</TextLink>
          </div>
        </div>
        <ul className="mt-11 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          {websiteCases.map((study) => (
            <li key={study.slug} className="surface-card flex flex-col overflow-hidden rounded-card border border-line bg-surface">
              <Link
                href={`/case-studies/${study.slug}`}
                data-event="website_designs_case_study_click"
                className="group flex h-full flex-col text-ink"
              >
                <CaseStudyVisual study={study} ratio="16/10" frameClassName="rounded-none" />
                <div className="flex flex-1 flex-col p-7">
                  <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-amber-deep">{study.sector}</p>
                  <h3 className="mt-4 font-sans text-h4 font-semibold transition-colors group-hover:text-amber-deep">{study.title}</h3>
                  <p className="mt-3 text-body leading-relaxed text-ink/70">{study.lede}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {study.work.flatMap((w) => w.items).slice(0, 3).map((item) => (
                      <li key={item} className="rounded-full border border-line bg-warm px-3 py-1 text-[14px] font-semibold text-ink/75">{item}</li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-body font-semibold text-amber-deep">
                    Read the case study
                    <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
          <li className="flex flex-col rounded-card bg-inverse p-8 text-oninverse">
            <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-light)]">{page.caseStudies.cta.eyebrow}</p>
            <h3 className="mt-4 font-sans text-h3 font-semibold text-balance">{page.caseStudies.cta.heading}</h3>
            <p className="mt-3 text-body leading-relaxed text-oninverse/70">{page.caseStudies.cta.body}</p>
            <div className="mt-auto pt-8">
              <Button href="/book-a-consultation" data-event="website_designs_case_cta_click">
                {page.caseStudies.cta.label}
              </Button>
            </div>
          </li>
        </ul>
      </ServiceBand>
      )}

      <ServiceBand label={page.contact.eyebrow} tone="navy" accent={ACCENT} labelStyle={LABEL}>
        <Split ratio="6/5" align="center">
          <div>
            <h2 className="font-sans text-h2 font-semibold text-balance">{page.contact.heading}</h2>
            <p className="mt-5 text-body leading-relaxed text-oninverse/70">{page.contact.body}</p>
            <div className="mt-8 flex flex-wrap gap-3.5 max-sm:flex-col">
              <Button href="/book-a-consultation" data-event="website_designs_booking_click">
                {page.consultation.eyebrow}
              </Button>
              <Button href="/contact-us" variant="secondary" data-event="website_designs_contact_band_click">
                {page.ctas.contact}
              </Button>
            </div>
          </div>
          <div className="rounded-card border border-oninverse/15 bg-oninverse/[0.05] p-card">
            <p className="eyebrow text-oninverse/55">{page.consultation.heading}</p>
            <ul className="mt-5 divide-y divide-oninverse/12">
              <li className="py-4">
                <Link href={company.phoneHref} data-event="website_designs_phone_click" className="group flex items-center gap-4 text-oninverse">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber text-white"><Phone className="size-5" aria-hidden="true" /></span>
                  <span>
                    <span className="block text-[14px] text-oninverse/60">Call us</span>
                    <span className="font-sans text-h4 font-semibold group-hover:text-[var(--accent-light)]">{page.contact.phone}</span>
                  </span>
                </Link>
              </li>
              <li className="py-4">
                <a href={`mailto:${company.email}`} data-event="website_designs_email_click" className="group flex items-center gap-4 text-oninverse">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber text-white"><Mail className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block text-[14px] text-oninverse/60">Email us</span>
                    <span className="block truncate font-sans text-h4 font-semibold group-hover:text-[var(--accent-light)]">{company.email}</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </Split>
      </ServiceBand>

      <ServiceBand label={page.guarantee.eyebrow} tone="warm" accent={ACCENT} labelStyle={LABEL}>
        <div className="grid overflow-hidden rounded-card border border-line bg-surface lg:grid-cols-12">
          <div className="flex items-center lg:col-span-5 bg-[radial-gradient(circle_at_50%_30%,#262626_0%,#000_70%)] p-10 max-sm:p-7">
            <GuaranteeBadge />
          </div>
          <div className="p-10 max-sm:p-6 lg:col-span-7">
            <h2 className="font-sans text-h2 font-semibold text-balance">{page.guarantee.heading}</h2>
            <p className="mt-5 text-body leading-relaxed text-ink/75">{page.guarantee.body[0]}</p>
            <ul className="mt-7 grid gap-3">
              {page.guarantee.points.map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <CheckIcon className="mt-1.5 size-4 shrink-0 text-amber-deep" />
                  <span><span className="font-semibold">{title}</span> <span className="text-ink/70">{body}</span></span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex items-center gap-4">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-soft">
                <Image src={ceo.photo} alt={`${ceo.name}, ${ceo.role}`} fill sizes="48px" className="object-cover" />
              </span>
              <p className="text-body leading-snug text-ink/75">
                <span className="font-semibold text-ink">{ceo.name}</span>, {ceo.role}. {page.guarantee.body[1]}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3.5 max-sm:flex-col">
              <Button href="/warranty" data-event="website_designs_warranty_click">
                Read the guarantee
              </Button>
              <Button href="/book-a-consultation" variant="secondary" data-event="website_designs_guarantee_consultation_click">
                {page.ctas.consultation}
              </Button>
            </div>
          </div>
        </div>
      </ServiceBand>

      <SiteTestimonials
        eventPrefix="website_designs"
        title={page.reviewsHeading}
        tone="white"
        accent={ACCENT}
        labelStyle={LABEL}
      />

      <RelatedServices
        eventPrefix="website_designs"
        title="Build it, keep it running and bring the right visitors"
        body="A website design project usually sits alongside development, ongoing care and the search work that brings customers to it."
        links={page.related}
      />

      <ServiceFaqSection
        title="Questions before you brief a website design project"
        titleAccent="website design project"
        description="If your question is not here, ask it on the consultation call and you will get a straight answer."
        items={page.faqs.map(([q, a]) => ({ q, a }))}
        group="website-designs-faq"
        phoneEvent="website_designs_faq_phone_click"
      />

      <FinalCta
        title={page.finalCta.title}
        titleAccent="your business actually needs."
        body={page.finalCta.body}
        primary={{ label: "Book a Free Consultation", event: "website_designs_final_consultation_click" }}
        secondary={{ label: page.ctas.contact, event: "website_designs_final_contact_click" }}
        contactEvents={{ phone: "website_designs_phone_click", email: "website_designs_email_click" }}
      />
    </main>
  );
}
