import type { ReactNode } from "react";
import { Pointer } from "@/components/Pointer";
import { Reveal } from "@/components/Reveal";
import { FinalCta } from "@/components/ui/FinalCta";
import { MediaFrame } from "@/components/ServiceMedia";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceBand } from "@/components/services/ServiceBand";
import {
  CheckIcon as Check,
  FeatureValue,
} from "@/components/services/ServicePrimitives";
import { Button, TextLink } from "@/components/ui/Button";
import { Eyebrow, ReviewProof } from "@/components/ui/Proof";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { amazonPpc as content } from "@/lib/content/amazon-ppc";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

type Package = (typeof content.packages)[number];

function SectionShell({
  label,
  id,
  dark = false,
  children,
}: {
  label: string;
  id?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <ServiceBand label={label} id={id} tone={dark ? "dark" : "white"} accent="bg-amber">
      {children}
    </ServiceBand>
  );
}

export function AmazonPpcHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      // &nbsp; keeps "UK Sellers" on one line so the keyword phrase never splits.
      title={<>Amazon PPC Advertising Agency for <span className="text-amber-deep">UK&nbsp;Sellers</span></>}
      subtitle={<>Amazon PPC built around <span className="text-amber-deep">products, profit and control</span></>}
      body={content.hero.body}
      actions={
        <>
          <Button href={content.hero.primary.href} data-event="amazon_hero_cta_click">{content.hero.primary.label}</Button>
          <Button href={content.hero.secondary.href} variant="secondary" data-event="amazon_packages_click">{content.hero.secondary.label}</Button>
        </>
      }
      stats={[["Packages from", "£750"], ["Required ad spend from", "£500"], ["Published set-up time", "14 days"]]}
      statsStyle="divided"
      media={<Pointer><div className="pointer-parallax"><MediaFrame kind="screen" theme="amazon" ratio="16/11" title="Amazon advertising account view" note="Replace with an approved, anonymised account showing date range, spend and attributed sales." source="/images/Services/Amazon PPC 1 (1).png" alt="Amazon PPC agency reviewing an account diagnosis on a laptop beside printed performance charts" /></div></Pointer>}
      proof={<ReviewProof serviceId="amazon" heading="Amazon PPC with verified client trust" />}
    />
  );
}

export function AmazonAccountDiagnosis() {
  return (
    <SectionShell label="Account diagnosis">
      <Reveal>
        <Split ratio="4/8">
          <div>
            <SectionHeader
              kicker="Is the account learning?"
              title="Six signs your Amazon PPC account needs attention"
              body="Dozens of tasks sit under Amazon PPC. This diagnosis groups them around the problems a seller can actually recognise."
            />
            <div className="mt-8"><TextLink href="/book-a-consultation" data-event="amazon_account_review_click">Request an account review</TextLink></div>
          </div>
          <div className="grid border-l border-t border-line md:grid-cols-2">
            {content.problems.map(([title, body], index) => (
              <article key={title} className="group border-b border-r border-line p-card transition-colors hover:bg-tint-amber">
                <span className="text-body font-semibold tracking-[0.14em] text-amber-deep">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-sans text-h4 font-semibold">{title}</h3>
                <p className="mt-3 text-body leading-relaxed text-ink/70">{body}</p>
              </article>
            ))}
          </div>
        </Split>
      </Reveal>
    </SectionShell>
  );
}

export function AmazonCampaignMap() {
  return (
    <SectionShell label="Advertising formats" dark>
      <Reveal>
        <div>
          <h2 className="font-sans text-h2 font-semibold">The Amazon PPC campaign types we manage</h2>
          <p className="mt-4 text-body leading-snug text-oninverse/85">A campaign mix shaped around the shopper journey.</p>
          <p className="mt-5 text-body leading-relaxed text-oninverse/65">Four Amazon advertising formats. Availability and suitability depend on account eligibility, catalogue, brand registration, creative and budget.</p>
        </div>
        <div className="mt-header grid grid-cols-12 gap-grid">
          {content.campaignTypes.map((item, index) => (
            <article key={item.title} className={`${index === 0 || index === 3 ? "col-span-7" : "col-span-5"} rounded-card border border-oninverse/12 bg-oninverse/[0.035] p-card transition-colors hover:border-amber/55 hover:bg-amber/[0.045] max-lg:col-span-6 max-md:col-span-12`}>
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="eyebrow text-amber-deep">{item.label}</p>
                  <h3 className="mt-4 font-sans text-h3 font-semibold">{item.title}</h3>
                </div>
                <span aria-hidden className="font-sans text-[38px] font-semibold leading-none text-oninverse/[0.08]">0{index + 1}</span>
              </div>
              <p className="mt-4 text-body leading-relaxed text-oninverse/68">{item.body}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {item.detail.map((detail) => <li key={detail} className="rounded-full border border-oninverse/12 px-3 py-1.5 text-body font-medium text-oninverse/72">{detail}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}

export function AmazonProcess() {
  return (
    <SectionShell label="How it is delivered">
      <Reveal>
        <Split ratio="4/8" gap={10}>
          <div>
            <h2 className="font-sans text-h2 font-semibold">How our Amazon PPC management works</h2>
            <p className="mt-4 text-body leading-snug text-ink/85">From catalogue context to controlled optimisation.</p>
            <p className="mt-5 text-body leading-relaxed text-ink/70">Each stage should end with a decision, not another page of unexplained metrics.</p>
          </div>
          <ol className="grid gap-x-8 md:grid-cols-2">
            {content.process.map(([title, body], index) => (
              <li key={title} className={`${index === content.process.length - 1 ? "md:col-span-2" : ""} border-t border-line py-6`}>
                <div className="flex gap-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint-amber text-body font-semibold text-amber-deep">{index + 1}</span>
                  <div><h3 className="font-sans text-h4 font-semibold">{title}</h3><p className="mt-2.5 text-body leading-relaxed text-ink/70">{body}</p></div>
                </div>
              </li>
            ))}
          </ol>
        </Split>
      </Reveal>
    </SectionShell>
  );
}

function PackageCard({ pkg, index }: { pkg: Package; index: number }) {
  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-[0_20px_65px_-55px_rgb(var(--accent-rgb)/.8)]">
      <div className={`${index === 3 ? "bg-[#211a12] text-oninverse" : "bg-tint-amber"} p-6`}>
        <p className="eyebrow text-amber-deep">{pkg.stage}</p>
        <h3 className="mt-3 font-sans text-h4 font-semibold">{pkg.name}</h3>
        <p className="mt-4 font-sans text-price font-semibold">{pkg.price}</p>
        <p className={`mt-4 text-body leading-relaxed ${index === 3 ? "text-oninverse/68" : "text-ink/68"}`}>{pkg.bestFor}</p>
      </div>
      <dl className="grid grid-cols-2 border-b border-line p-6 text-label">
        <div><dt className="text-muted">Included hours*</dt><dd className="mt-1 font-semibold">{pkg.features.includedHours}</dd></div>
        <div><dt className="text-muted">Required ad spend</dt><dd className="mt-1 font-semibold">{pkg.features.requiredAdSpend}</dd></div>
      </dl>
      <details className="group flex-1 border-b border-line px-6 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">Full package details <span aria-hidden className="text-xl text-amber-deep transition-transform group-open:rotate-45">+</span></summary>
        <div className="mt-4">
          {content.packageGroups.map((group) => (
            <div key={group.label} className="border-t border-line py-4 first:border-t-0 first:pt-0">
              <p className="mb-2 eyebrow text-muted">{group.label}</p>
              {group.rows.map(([label, key]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-1.5 text-label"><dt className="text-muted">{label}</dt><dd className="text-right font-semibold"><FeatureValue value={pkg.features[key]} includedClassName="text-amber-deep" /></dd></div>
              ))}
            </div>
          ))}
        </div>
      </details>
      <div className="p-6"><Button href="/book-a-consultation" className="w-full justify-center" data-event="amazon_package_select" data-package={pkg.name}>Discuss this package</Button></div>
    </article>
  );
}

export function AmazonPricing() {
  return (
    <section id="packages" className="bg-tint-amber">
      <div className="container-omh section-md" data-event="amazon_pricing_view">
        <Reveal>
          <div>
            <div><Eyebrow>Published Amazon PPC packages</Eyebrow><h2 className="mt-6 font-sans text-h2 font-semibold">Amazon PPC management packages and pricing</h2><p className="mt-4 text-body leading-snug text-ink/85">Four tiers with the detail available on demand.</p></div>
            <p className="mt-5 text-body leading-relaxed text-ink/70">Core figures stay visible; full inclusions expand inside each card, keeping the page easier to scan without dropping the original package content.</p>
          </div>
          <CardGrid cols={4} className="mt-header">
            {content.packages.map((pkg, index) => <PackageCard key={pkg.name} pkg={pkg} index={index} />)}
          </CardGrid>
          <ul className="mt-8 grid gap-2 border-l-2 border-amber pl-5 text-body leading-relaxed text-muted">
            {content.pricingNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

export function AmazonProofGuide() {
  if (!CASE_STUDIES_LIVE) return null;
  return (
    <SectionShell label="Proof and preparation" dark>
      <Reveal>
        <div className="grid grid-cols-12 items-center gap-x-12 gap-y-10 max-lg:block">
          <div className="col-span-5 max-lg:mb-9">
            <p className="text-[14px] font-semibold uppercase tracking-[0.15em] text-amber-deep">Before increasing spend</p>
            <h2 className="mt-5 font-sans text-h2 font-semibold">Use a real account story, with the measurement explained.</h2>
            <p className="mt-5 text-body leading-relaxed text-oninverse/68">Every Amazon example we share states the products, date range, spend, attribution window and commercial context, so the result can be read in proportion.</p>
            <ul className="mt-7 grid gap-3 border-t border-oninverse/12 pt-5 text-body text-oninverse/72">
              {["Starting account and catalogue context", "Campaign and listing work completed", "Spend and comparison period", "Verified outcome with metric definitions"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-amber-deep" />{item}</li>)}
            </ul>
            {CASE_STUDIES_LIVE && <div className="mt-7"><TextLink href="/case-studies" className="text-amber-deep hover:text-oninverse" data-event="amazon_case_study_click">View case studies</TextLink></div>}
          </div>
          <div className="col-span-7">
            <MediaFrame kind="image" theme="amazon" ratio="16/10" title="Verified Amazon PPC case study" note="Replace with approved product imagery and a comparable before-and-after account view." source="/images/Services/Images on the pages/Verified Amazon PPC case study.png" alt="An Amazon PPC case-study summary showing spend, sales, ACoS, orders and ROAS for a single product over a 30-day period." />
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}

export function AmazonFAQ() {
  return (
    <ServiceFaqSection
      label="Amazon PPC FAQ"
      title="Questions before appointing an Amazon PPC agency."
      description="Confirm access, ownership, ad spend, VAT, agreement length, platform eligibility and attribution definitions in the written proposal."
      items={content.faqs.map(([q, a]) => ({ q, a }))}
      group="amazon-faq"
      phoneEvent="amazon_phone_click"
      headingSize="lg"
      headingMaxWidthClassName=""
      bandAccent="bg-amber"
    />
  );
}

export function AmazonFinalCTA() {
  return (
    <FinalCta
      title="Ready to make Amazon ad spend easier to understand?"
      titleAccent="easier to understand?"
      body="Tell us what you sell, where you advertise, your current spend and the account problem you want to solve. We will recommend a practical next step."
      primary={{ label: "Discuss Amazon PPC", event: "amazon_final_cta_click" }}
      secondary={{
        label: "Send an Account Brief",
        href: "/contact-us",
        event: "amazon_brief_start",
      }}
      contactEvents={{ phone: "amazon_phone_click", email: "amazon_email_click" }}
    />
  );
}
