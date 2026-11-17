import Link from "next/link";
import { Megaphone, Puzzle, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { CaseStudyVisual } from "@/components/case-studies/CaseStudyVisual";
import { CapabilityShowcase } from "@/components/services/CapabilityShowcase";
import { ServiceHeroArt } from "@/components/services/ServiceHeroArt";
import { caseStudies } from "@/lib/content/case-studies";
import { Pointer } from "@/components/Pointer";
import { Reveal } from "@/components/Reveal";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceFitSection as SharedServiceFitSection } from "@/components/services/ServiceFitSection";
import { ServiceNextStepsCTA } from "@/components/services/ServiceNextStepsCTA";
import { ServiceProcessTimeline } from "@/components/services/ServiceProcessTimeline";
import { ServiceReasonGrid } from "@/components/services/ServiceReasonGrid";
import {
  CheckIcon as Check,
  HighlightedText,
  ServiceSectionIntro as SectionIntro,
} from "@/components/services/ServicePrimitives";
import { ArrowRight, Button, TextLink } from "@/components/ui/Button";
import { Eyebrow, Fpo, ReviewProof } from "@/components/ui/Proof";
import { ServiceBand as Band } from "@/components/services/ServiceBand";
import { PackageComparison } from "@/components/services/PackageComparison";
import { PageHero } from "@/components/ui/PageHero";
import { Split } from "@/components/ui/Split";
import { wordpressDevelopment as content } from "@/lib/content/wordpress-development";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

/*
  Each section uses a different structural device on purpose — ruled editorial
  list, bento, numbered spine, comparison table, chip rows. Every device is
  grid/flex + hairline borders only, so all of it maps to Elementor containers.
*/

/* `size="md"` steps the heading down to h3 for sections whose heading sits in a
   narrow sidebar column — at h2 those wrapped to three and four lines. */
// ── Section 1: Hero ─────────────────────────────────────────────────────────
// Future Elementor widget: "OMH Service Hero"
export function ServiceHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      title={<HighlightedText text={content.hero.title} highlight="drive growth" />}
      body={content.hero.body}
      actions={
        <>
          <Button href={content.hero.primary.href} data-event="wpdev_hero_cta_click">
            {content.hero.primary.label}
          </Button>
          <Button href={content.hero.secondary.href} variant="secondary" data-event="wpdev_view_packages_click">
            {content.hero.secondary.label}
          </Button>
        </>
      }
      stats={[
        ["Packages from", "£200"],
        ["Turnaround from", "4 weeks"],
        ["Based in", "Essex, UK"],
      ]}
      media={
        <Pointer>
          <div className="pointer-parallax">
            <ServiceHeroArt variant="wordpress" />
          </div>
        </Pointer>
      }
      proof={<ReviewProof serviceId="wordpress" heading="Proven WordPress experience" />}
    />
  );
}

// ── Section 2: Problems ─────────────────────────────────────────────────────
// Future Elementor widget: "OMH Pain List"
export function PainPointSection() {
  return (
    <Band label="Problems">
      <Reveal>
        <Split ratio="5/7" gap={10} sticky>
          <div>
            <SectionIntro title="A WordPress website can look fine and still hold the business back" accent="business back" />
            <p className="mt-7 border-l-2 border-amber pl-5 text-body leading-snug text-ink/85">
              Most businesses do not come to us because the website failed. They come
              because it is slow, hard to update, or quietly costing them enquiries.
            </p>
            <div className="mt-8 max-lg:max-w-md">
              <Fpo
                ratio="4/3"
                tag="Annotated screen"
                title="Website issue snapshot"
                note="Add a real annotated screenshot from a reviewed WordPress site." source="/images/Services/Images on the pages/WordPress Development.png" alt="Illustrative WordPress development screen" />
            </div>
          </div>
          <ol className="border-t border-line">
            {content.pains.map((pain, index) => (
              <li
                key={pain}
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-b border-line py-6 px-6 transition-colors hover:bg-surface"
              >
                <span
                  aria-hidden
                  className="font-sans text-body font-semibold tabular-nums tracking-[0.1em] text-muted transition-colors group-hover:text-amber"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-body leading-snug text-ink/90">
                  {pain}
                </p>
              </li>
            ))}
          </ol>
        </Split>
      </Reveal>
    </Band>
  );
}

// ── Section 3: Fit ──────────────────────────────────────────────────────────
// Future Elementor widget: "OMH Fit Columns"
export function FitSection() {
  return (
    <SharedServiceFitSection
      title="WordPress web development agency for serious businesses"
      titleAccent="serious businesses"
      body="This service works best when there is a clear business reason for the build and enough planning time to do the work properly. If that is not where you are yet, it is better to say so early."
      good={content.fit.good}
      notFit={content.fit.notFit}
      footer={
        <p className="mt-6 text-bsm leading-relaxed text-ink/70">
          Not sure which side you are on? Say so on the call and we will tell you plainly.
        </p>
      }
    />
  );
}

// ── Section 4: What we build ────────────────────────────────────────────────
// Future Elementor widget: "OMH Capability Bento"
export function ServiceCapabilityGrid() {
  const [featured, ...rest] = content.capabilities;
  const icons = [RefreshCw, Puzzle, Megaphone, Zap, ShieldCheck];
  const recent = caseStudies.find((study) => study.slug === "bar")!;
  return (
    <CapabilityShowcase
      label="Build"
      intro={{
        title: "Custom WordPress development services, built around you",
        accent: "built around you",
        body: "The scope can cover a new build, a careful redesign, technical improvements or the functionality needed to support your sales process.",
      }}
      featured={{
        eyebrow: "Most projects start here",
        tag: "From £200 · from 4 weeks",
        title: featured.title,
        body: featured.body,
        detail: ["Structure planned before design", "Built to be edited without a developer", "Set up for tracking from day one", "Speed, security and schema basics in the build"],
        primary: { label: "Start a project", href: "/contact-us", event: "wpdev_build_start_click" },
        secondary: { label: "See the packages", href: "#packages", event: "wpdev_build_packages_click" },
        aside: CASE_STUDIES_LIVE && (
          <Link href={`/case-studies/${recent.slug}`} data-event="wpdev_build_case_study_click" className="group block rounded-[10px] border border-oninverse/12 bg-oninverse/[0.06] p-4 transition-colors hover:bg-oninverse/[0.1]">
            <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-light)]">Recent build</p>
            <div className="mt-3 grid grid-cols-[96px_1fr] items-center gap-4 max-sm:grid-cols-1">
              <CaseStudyVisual study={recent} ratio="1/1" frameClassName="rounded-[8px]" />
              <div>
                <h4 className="font-sans text-[18px] font-semibold leading-snug">{recent.title}</h4>
                <p className="mt-1.5 text-[14px] text-oninverse/65">{recent.sector}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-light)]">
                  Read the case study
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ),
      }}
      items={rest.map((item, i) => ({ ...item, icon: icons[i] ?? Zap }))}
    />
  );
}

// ── Section 5: Process ──────────────────────────────────────────────────────
// Future Elementor widget: "OMH Process Spine" — order genuinely matters here,
// which is the only reason this section is numbered.
export function ProcessSteps() {
  return (
    <ServiceProcessTimeline
      label="Process"
      title="A clear process from planning to launch"
      titleAccent="planning to launch"
      body="The goal, content and design decisions are agreed before development becomes expensive to change."
      steps={content.process}
      action={{ label: "Start at discovery", event: "wpdev_form_start" }}
    />
  );
}

// ── Section 6: Packages ─────────────────────────────────────────────────────
// Future Elementor widget: "OMH Pricing Comparison"
export function PricingPackages() {
  return (
    <Band label="Packages" id="packages">
      <div>
        <div data-event="wpdev_pricing_view">
          <div>
            <SectionIntro
              title="Website packages for different stages of growth"
              accent="stages of growth"
              body="Every WordPress project needs the right scope. These packages are a starting point, and your account manager will recommend the right option during the consultation."
            />
            <p className="mt-5 text-body leading-relaxed text-ink/70">
              Some businesses only need a focused starter site. Others need more pages,
              deeper content, advanced functionality or ongoing support. Final scope
              depends on content, functionality and business needs.
            </p>
          </div>

          <PackageComparison
            caption="WordPress website package comparison by inclusion and price"
            packages={content.packages}
            groups={content.packageGroups}
            notes={content.pricingNotes}
            event="wpdev_package_select"
          />
        </div>
      </div>
    </Band>
  );
}

// ── Section 7: What is included ─────────────────────────────────────────────
// Future Elementor widget: "OMH Inclusion Rows"
export function IncludedFeatures() {
  return (
    <Band label="Included">
      <Reveal>
        <SectionIntro
          title="What is included"
          accent="included"
          body="Exact scope depends on the package you choose, but the work always groups into these five areas."
        />
        <div className="mt-12 border-t border-line">
          {content.included.map(([title, blurb, items]) => (
            <div
              key={title}
              className="grid gap-y-5 border-b border-line py-8 px-6 transition-colors duration-200 hover:bg-surface lg:grid-cols-12 lg:gap-x-10"
            >
              <div className="lg:col-span-4">
                <h3 className="font-sans text-h4 font-semibold">{title}</h3>
                <p className="mt-2 text-bsm leading-relaxed text-muted">{blurb}</p>
              </div>
              <ul className="flex flex-wrap content-start gap-2.5 lg:col-span-8">
                {items.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pl-3 pr-4 text-body leading-none text-ink/80 transition-colors duration-200 hover:border-teal/45 hover:bg-soft/50"
                  >
                    <Check className="size-3.5 shrink-0 text-amber-deep" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-bsm text-muted">
          Anything outside these areas is quoted separately rather than assumed.
        </p>
      </Reveal>
    </Band>
  );
}

// ── Section 8: Proof ────────────────────────────────────────────────────────
// Future Elementor widget: "OMH Case Study Feature"
export function CaseStudyFeature() {
  if (!CASE_STUDIES_LIVE) return null;
  return (
    <Band label="Proof" tone="white">
      <Reveal>
        <div className="overflow-hidden rounded-card border border-soft-dark bg-soft/60">
          <div className="grid grid-cols-12 gap-x-10 gap-y-8 p-10 max-lg:block max-sm:p-6">
            <div className="col-span-12">
              <Eyebrow>Case study placeholder</Eyebrow>
              <h2 className="mb-5 mt-6 font-sans text-h3 font-semibold text-balance">
                A real WordPress project, <span className="text-amber-deep">explained properly</span>
              </h2>
              <p className="text-body leading-relaxed text-ink/75">
                This slot is built for the real client name or anonymised sector, business
                type, location, original problem, website goal, scope, functionality,
                timeline, result and testimonial. Nothing here is filled with invented
                figures.
              </p>
              <ul className="mt-7 border-t border-soft-dark">
                {["Original problem", "Work completed", "Timeline and scope", "Verified result"].map(
                  (field) => (
                    <li
                      key={field}
                      className="border-b border-soft-dark py-3 text-body text-ink/70"
                    >
                      {field}
                    </li>
                  ),
                )}
              </ul>
              <div className="mt-7">
                <TextLink href="/case-studies" data-event="wpdev_case_study_click">
                  View case studies
                </TextLink>
              </div>
            </div>

            <div className="col-span-12 mt-9">
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                <Fpo ratio="4/3" tag="Before" title="Before website screenshot" note="Use the real previous website screen." source="/images/Services/shopify/before.png" alt="Illustrative website layout before redesign" />
                <Fpo ratio="4/3" tag="After" title="After website screenshot" note="Use the real launched website screen." source="/images/Services/shopify/after.png" alt="Illustrative website layout after redesign" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Band>
  );
}

// ── Section 9: Why OMH ──────────────────────────────────────────────────────
// Future Elementor widget: "OMH Reason Rows"
export function WhyChooseSection() {
  return (
    <ServiceReasonGrid
      title="A custom WordPress development company that gets marketing"
      titleAccent="gets marketing"
      body="A better website is not only a design job. It has to support the way people find the business, compare the offer and decide to enquire or buy."
      reasons={content.reasons}
    />
  );
}

// ── Section 10: FAQ ─────────────────────────────────────────────────────────
export function FAQAccordion() {
  return (
    <ServiceFaqSection
      title="WordPress development services FAQs"
      titleAccent="FAQs"
      description="If your question is not here, ask it on the consultation call and you will get a straight answer."
      items={content.faqs.map(([q, a]) => ({ q, a }))}
      group="wpdev-faq"
      phoneEvent="wpdev_phone_click"
    />
  );
}

// ── Section 11: Final CTA ───────────────────────────────────────────────────
export function FinalCTA() {
  return (
    <ServiceNextStepsCTA
      title="Ready to build a better WordPress website?"
      titleAccent="WordPress website?"
      body="Tell us what you need your website to do, what is not working now, and what you want to improve. We will review the details and recommend the most practical next step."
      primary={{ label: "Book a WordPress Consultation", event: "wpdev_final_cta_click" }}
      secondary={{
        label: "Send a Website Brief",
        href: "/contact-us",
        event: "wpdev_form_start",
      }}
      phoneEvent="wpdev_phone_click"
      emailEvent="wpdev_email_click"
      steps={[
        "Your enquiry is reviewed by a real person.",
        "We discuss your goals, website problems and practical options.",
        "You receive a clear recommendation on the next step.",
      ]}
    />
  );
}
