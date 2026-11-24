import { ArrowRightLeft, Blocks, Palette, Plug, Puzzle, Wrench } from "lucide-react";
import { CapabilityShowcase, StorefrontMock } from "@/components/services/CapabilityShowcase";
import { Pointer } from "@/components/Pointer";
import { Reveal } from "@/components/Reveal";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceFitSection as SharedServiceFitSection } from "@/components/services/ServiceFitSection";
import { ServiceNextStepsCTA } from "@/components/services/ServiceNextStepsCTA";
import { ServiceProcessTimeline } from "@/components/services/ServiceProcessTimeline";
import { ServiceReasonGrid } from "@/components/services/ServiceReasonGrid";
import { HighlightedText, ServiceSectionIntro as SectionIntro } from "@/components/services/ServicePrimitives";
import { PackageComparison } from "@/components/services/PackageComparison";
import { PageHero } from "@/components/ui/PageHero";
import { Split } from "@/components/ui/Split";
import { Button, TextLink } from "@/components/ui/Button";
import { Eyebrow, ReviewProof } from "@/components/ui/Proof";
import { MediaFrame } from "@/components/ServiceMedia";
import { ServiceBand as Band } from "@/components/services/ServiceBand";
import { shopifyDevelopment as content } from "@/lib/content/shopify-development";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

export function ShopifyHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      title={<HighlightedText text={content.hero.title} highlight={"high-⁠performing stores"} />}
      body={content.hero.body}
      actions={
        <>
          <Button href={content.hero.primary.href} data-event="shopify_hero_cta_click">
            {content.hero.primary.label}
          </Button>
          <Button href={content.hero.secondary.href} variant="secondary" data-event="shopify_view_packages_click">
            {content.hero.secondary.label}
          </Button>
        </>
      }
      stats={[
        ["Packages from", "£300"],
        ["Turnaround from", "4 weeks"],
        ["Primary market", "UK businesses"],
      ]}
      media={
        <Pointer>
          <div className="pointer-parallax">
            <MediaFrame kind="image" theme="shopify" ratio="16/11" title="Shopify development" note="" source="/images/Services/shopify-development-hero.png" alt="A monitor showing an online store admin with a product image uploader beside a laptop displaying the customer-facing storefront with product cards and prices." />
          </div>
        </Pointer>
      }
      proof={<ReviewProof serviceId="shopify" heading="Verified client trust" />}
    />
  );
}

export function ShopifyNeedSection() {
  return (
    <Band label="Need">
      <Reveal>
        <Split ratio="5/7" gap={10} sticky>
          <div>
            <SectionIntro title="Common Shopify problems we fix" accent="we fix" />
            <p className="mt-7 border-l-2 border-amber pl-5 text-body leading-snug text-ink/85">
A store can look great and still be hard to grow. Confusing navigation, slow pages, a clunky checkout, a theme nobody on your team can actually edit. Sound familiar? That&apos;s usually where we come in.

            </p>
            <div className="mt-8 max-lg:max-w-md">
              <MediaFrame kind="image" theme="shopify" ratio="4/3" title="Shopify friction snapshot" note="Add a real annotated mobile or desktop screen from a reviewed store." source="/images/Services/shopify/Shopify-friction-snapshot.png" alt="A store review on desktop and mobile, annotated with four problems: a menu that is hard to use on mobile, a slow hero image, products buried below the fold and a hidden add-to-cart button." />
            </div>
          </div>
          <ol className="border-t border-line">
            {content.needs.map((need, index) => (
              <li key={need} className="group grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-b border-line px-6 py-6 transition-colors hover:bg-surface">
                <span aria-hidden className="font-sans text-body font-semibold tabular-nums tracking-[0.1em] text-muted transition-colors group-hover:text-amber">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-body leading-snug text-ink/90">{need}</p>
              </li>
            ))}
          </ol>
        </Split>
      </Reveal>
    </Band>
  );
}

export function ShopifyFitSection() {
  return (
    <SharedServiceFitSection
      title="For businesses treating ecommerce as a serious sales channel"
      titleAccent="serious sales channel"
      body="A clear commercial reason for the project makes design and development decisions easier. This section helps qualify the fit before either side commits time to a proposal."
      good={content.fit.good}
      notFit={content.fit.notFit}
    />
  );
}

export function ShopifyCapabilityGrid() {
  const [featured, ...rest] = content.capabilities;
  const icons = [Palette, Wrench, Puzzle, Blocks, ArrowRightLeft, Plug];
  return (
    <CapabilityShowcase
      label="Build"
      intro={{
        title: "Our Shopify development services",
        accent: "Shopify development",
        body: "From a brand-new store to one tricky integration, our Shopify development services cover the full picture: builds, themes, apps, migrations and everything in between.",
      }}
      featured={{
        eyebrow: "Most projects start here",
        title: featured.title,
        body: featured.body,
        detail: featured.detail,
        primary: { label: "Explore store development", href: "#packages", event: "shopify_build_packages_click" },
        secondary: { label: "Talk to us", href: "/contact-us", event: "shopify_build_contact_click" },
        aside: <StorefrontMock />,
      }}
      items={rest.map((item, i) => ({ ...item, icon: icons[i] ?? Blocks }))}
    />
  );
}

export function ShopifyProcessSteps() {
  return (
    <ServiceProcessTimeline
      label="Process"
      title="A controlled route from store planning to launch"
      titleAccent="planning to launch"
      body="Six steps, one clear route: discovery, structure, theme and UX, development and integration, migration and testing, then launch and support."
      steps={content.process}
      action={{ label: "Start at discovery", event: "shopify_form_start" }}
    />
  );
}

export function ShopifyPricingPackages() {
  return (
    <Band label="Packages" id="packages">
      <div data-event="shopify_pricing_view">
        <SectionIntro className="lg:w-7/12" title="Website packages" accent="packages" body="Four packages, starting from £300, give you a sensible starting point. Migration, integrations, and catalogue size still need a proper scope before we quote." />
        <PackageComparison
          caption="Shopify website package comparison by inclusion and price"
          packages={content.packages}
          groups={content.packageGroups}
          notes={content.pricingNotes}
          event="shopify_package_select"
        />
      </div>
    </Band>
  );
}

export function ShopifyCaseStudyFeature() {
  if (!CASE_STUDIES_LIVE) return null;
  return (
    <Band label="Proof" tone="white">
      <Reveal>
        <div className="overflow-hidden rounded-card border border-soft-dark bg-soft/60">
          <div className="grid grid-cols-12 gap-x-10 gap-y-8 p-10 max-lg:block max-sm:p-6">
            <div className="col-span-12">
              <Eyebrow>Client work</Eyebrow>
              <h2 className="mb-5 mt-6 font-sans text-h3 font-semibold text-balance">
                Show the store, the challenge and <span className="text-amber-deep">what changed</span>
              </h2>
              <p className="text-body leading-relaxed text-ink/75">
                Every Shopify case study we publish covers the same ground: the starting problem, what we built, the timeline, and a result the client can stand behind.
              </p>
              <ul className="mt-7 border-t border-soft-dark">
                {["Original platform or store problem", "Theme, migration or functionality delivered", "Timeline and package or scope", "Verified commercial or usability result"].map((field) => (
                  <li key={field} className="border-b border-soft-dark py-3 text-body text-ink/70">{field}</li>
                ))}
              </ul>
              {CASE_STUDIES_LIVE && <div className="mt-7"><TextLink href="/case-studies" data-event="shopify_case_study_click">View case studies</TextLink></div>}
            </div>

            <div className="col-span-12 mt-9">
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                {/* The frame drops its badge once media lands, but before/after is content here, so caption it. */}
                <figure>
                  <MediaFrame kind="image" theme="shopify" ratio="4/3" title="Before Shopify screenshot" note="Use the real previous store or platform." source="/images/Services/shopify/before.png" alt="An outdated online store with a crowded menu, a sale banner and a newsletter pop-up covering the products." />
                  <figcaption className="mt-3 text-[14px] font-semibold uppercase tracking-[0.14em] text-muted">Before</figcaption>
                </figure>
                <figure>
                  <MediaFrame kind="image" theme="shopify" ratio="4/3" title="After Shopify screenshot" note="Use the real launched Shopify store." source="/images/Services/shopify/after.png" alt="The same store rebuilt on Shopify with a clean header, a lifestyle hero image and a tidy row of products." />
                  <figcaption className="mt-3 text-[14px] font-semibold uppercase tracking-[0.14em] text-muted">After</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>

      </Reveal>
    </Band>
  );
}

export function ShopifyWhyChooseSection() {
  return (
    <ServiceReasonGrid
      title="Shopify development is connected to the wider job of selling online"
      titleAccent="selling online"
      body="Good ecommerce development thinks beyond the theme. Products, operations, customer trust, marketing and measurement all matter. It's why UK businesses come to a Shopify development agency like ours instead of briefing a single freelancer for the build and hoping the rest sorts itself out."
      reasons={content.reasons}
    />
  );
}

export function ShopifyFAQAccordion() {
  return (
    <ServiceFaqSection
      title="Questions before you brief a Shopify project"
      titleAccent="Shopify project"
      description="Support and commercial terms carried over from the current service page are clearly marked where confirmation is still needed."
      items={content.faqs.map(([q, a]) => ({ q, a }))}
      group="shopify-faq"
      phoneEvent="shopify_phone_click"
    />
  );
}

export function ShopifyFinalCTA() {
  return (
    <ServiceNextStepsCTA
      title="Ready to plan a better Shopify store?"
      titleAccent="Shopify store?"
      body="Tell us what you sell, what's currently getting in the way, and what the new store needs to do. As a Shopify development company built for UK businesses, we'll take a look and come back with a practical next step. No hard sell."
      primary={{ label: "Discuss Your Shopify Project", event: "shopify_final_cta_click" }}
      secondary={{
        label: "Send a Store Brief",
        href: "/contact-us",
        event: "shopify_form_start",
      }}
      phoneEvent="shopify_phone_click"
      emailEvent="shopify_email_click"
      steps={[
        "Your store brief is reviewed by a real person.",
        "We discuss the products, platform, goals and technical requirements.",
        "You receive a recommendation on package, scope or discovery work.",
      ]}
    />
  );
}
