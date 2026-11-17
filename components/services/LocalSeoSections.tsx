import { Pointer } from "@/components/Pointer";
import { Reveal } from "@/components/Reveal";
import { FinalCta } from "@/components/ui/FinalCta";
import { MediaFrame } from "@/components/ServiceMedia";
import { SiteTestimonials } from "@/components/Testimonials";
import { PackageComparison } from "@/components/services/PackageComparison";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceFitSection as SharedServiceFitSection } from "@/components/services/ServiceFitSection";
import { ServiceBand, type ServiceBandTone } from "@/components/services/ServiceBand";
import { ServiceProcessTimeline } from "@/components/services/ServiceProcessTimeline";
import { ServiceReasonGrid } from "@/components/services/ServiceReasonGrid";
import { Button } from "@/components/ui/Button";
import { CardGrid } from "@/components/ui/CardGrid";
import { CheckList } from "@/components/ui/CheckList";
import { NumberedList } from "@/components/ui/NumberedList";
import { PageHero } from "@/components/ui/PageHero";
import { ReviewProof } from "@/components/ui/Proof";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { localSeo as content } from "@/lib/content/local-seo";

function Band({
  tone = "white",
  ...props
}: Omit<Parameters<typeof ServiceBand>[0], "accent" | "tone"> & { tone?: ServiceBandTone }) {
  return <ServiceBand {...props} tone={tone} accent="bg-amber" />;
}

export function LocalSeoHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      title={
        <>
          Local SEO services that help <span className="text-amber-deep">nearby customers find your business</span>
        </>
      }
      body={content.hero.body}
      actions={
        <>
          <Button href={content.hero.primary.href} data-event="local_seo_hero_cta_click">
            {content.hero.primary.label}
          </Button>
          <Button href={content.hero.secondary.href} variant="secondary" data-event="local_seo_support_click">
            {content.hero.secondary.label}
          </Button>
        </>
      }
      stats={[
        ["Packages from", "£450"],
        ["Published term", "3 months"],
        ["Published range", "10 to 20 hours*"],
      ]}
      statsStyle="divided"
      media={
        <Pointer>
          <div className="pointer-parallax">
            <MediaFrame
              kind="screen"
              theme="seo"
              ratio="16/11"
              title="Local search visibility view"
              note="Replace with an approved local rank, Google Business Profile or location-performance screen with dates and metric definitions visible."
              source="/images/Services/SEO 3.jpg"
              alt="Someone running a Google search on a phone, the moment a nearby business needs to appear."
            />
          </div>
        </Pointer>
      }
      proof={<ReviewProof serviceId="seo" heading="Local SEO work backed by verified client trust" />}
    />
  );
}

export function LocalSeoMap() {
  return (
    <Band label="Local search footprint" tone="mist">
      <Reveal>
        <Split ratio="5/7" align="end">
          <SectionHeader
            title="Your profile, website and business details should tell the same story."
            body="We review the surfaces customers use before calling, requesting directions or visiting your website."
          />
          <MediaFrame
            kind="screen"
            theme="seo"
            ratio="16/9"
            title="Google Business Profile and local performance"
            note="Use an approved profile or reporting screen showing the business, date range and meaningful actions."
            source="/images/Services/Images on the pages/Google Business Profile and local performance local SEO.png"
            alt="Illustrative Google Business Profile performance view showing calls, direction requests, website clicks and search queries for a dated period."
          />
        </Split>
        <div className="mt-7 grid grid-cols-12 gap-5">
          <MediaFrame
            kind="image"
            theme="seo"
            ratio="5/4"
            title="Business details and directory review"
            note="Add an approved NAP and citation audit view."
            source="/images/Services/Images on the pages/Business details and directory review.png"
            alt="Illustrative business details and directory audit showing name, address and phone consistency across listings."
            className="col-span-5 max-md:col-span-12"
          />
          <MediaFrame
            kind="image"
            theme="seo"
            ratio="16/9"
            title="Local visibility review"
            note="Replace with a short profile, website and location-page walkthrough."
            className="col-span-7 max-md:col-span-12"
            source="/images/Services/local seo 2.jpg"
            alt="Local search optimisation"
          />
        </div>
      </Reveal>
    </Band>
  );
}

export function LocalSeoSignals() {
  return (
    <Band label="Local visibility signals">
      <Reveal>
        <Split ratio="4/8" gap={10} sticky>
          <SectionHeader
            size="md"
            kicker="Need help?"
            title="Fix the local SEO gaps that stop nearby customers finding and trusting you."
            body="A local SEO audit identifies whether the main issue sits in the profile, website, business data, reviews or reporting."
          />
          <NumberedList variant="ruled" items={content.signals} />
        </Split>
      </Reveal>
    </Band>
  );
}

export function LocalSeoFit() {
  return (
    <SharedServiceFitSection
      label="Who this is for"
      bandAccent="bg-amber"
      intro={
        <SectionHeader
          kicker="A useful starting point"
          title="Local SEO services work best when the market and responsibilities are clear."
          body="Local SEO services are designed for small businesses serving real customers in defined locations. This is not a route to invented locations or guaranteed rankings."
        />
      }
      good={content.fit.good}
      notFit={content.fit.notFit}
      notFitTitle="Not the right engagement"
      tone="warm"
    />
  );
}

export function LocalSeoBenefits() {
  return (
    <ServiceReasonGrid
      label="Local SEO benefits"
      bandAccent="bg-amber"
      title="How local SEO services make your business easier to find, check and contact."
      titleAccent="easier to find, check and contact."
      body="Traffic, leads, maps, reputation, geography and visibility are where local SEO marketing services pay off for small businesses. Here is what each one means in practice."
      reasons={content.benefits}
    />
  );
}

export function LocalSeoWorkstreams() {
  return (
    <Band label="Local SEO coverage">
      <Reveal>
        <SectionHeader
          title="What local SEO services can include."
          body="Your local SEO package and written proposal confirm which profile, website, directory, review and reporting tasks are included."
        />
        <CardGrid cols={4} className="mt-header">
          {content.workstreams.map((stream, index) => (
            <article key={stream.title} className="surface-card rounded-card border border-line bg-surface p-card">
              <span className="text-body font-semibold tracking-[0.14em] text-amber-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="eyebrow mt-4 text-amber-deep">{stream.label}</p>
              <h3 className="mt-3 font-sans text-h4 font-semibold">{stream.title}</h3>
              <p className="mt-3 text-body leading-relaxed text-ink/68">{stream.body}</p>
              <CheckList items={stream.items} className="mt-5 border-t border-line pt-4" />
            </article>
          ))}
        </CardGrid>
      </Reveal>
    </Band>
  );
}

export function LocalSeoProcess() {
  return (
    <ServiceProcessTimeline
      label="How local SEO is delivered"
      bandAccent="bg-amber"
      title="From local SEO audit to monthly improvement."
      body="We agree the locations, access and measurement first, then work through the profile, website and local business data in priority order. Each step is documented so you can see what your local SEO consultant has done and what comes next."
      steps={content.process}
      action={{ label: "Request a local visibility review", event: "local_seo_review_click" }}
    />
  );
}

export function LocalSeoPricing() {
  return (
    <Band label="Packages" id="packages" tone="warm">
      <Reveal>
        <SectionHeader
          title="Compare the three published local SEO packages."
          body="Three packages across sixteen comparison points, from included hours to keywords tracked."
        />
        <p className="mt-5 text-body leading-relaxed text-ink/65">
          The package name is not a recommendation. Your local SEO specialist will confirm billing frequency, VAT,
          exact deliverables and agreement terms in the written proposal before work begins.
        </p>
        <PackageComparison
          caption="Local SEO package comparison by inclusion and price"
          packages={content.packages}
          groups={content.packageGroups}
          notes={content.notes}
          event="local_seo_package_select"
        />
      </Reveal>
    </Band>
  );
}

export function LocalSeoReviews() {
  return (
    <SiteTestimonials
      title="What customers said about working with OMH."
      body="These eight reviews are reproduced from the original Local SEO page. They are customer comments, not evidence of a guaranteed ranking or commercial result."
      eventPrefix="local_seo"
      tone="navy"
    />
  );
}

export function LocalSeoWhyOmh() {
  return (
    <ServiceReasonGrid
      label="Why work with OMH"
      tone="white"
      bandAccent="bg-amber"
      title="Know who is responsible and what is included in your local SEO package."
      titleAccent="what is included"
      body="The strongest reasons to choose a local SEO consultant are clear access, communication, scope and reporting, not vague claims about being different."
      reasons={content.differentiators}
    />
  );
}

export function LocalSeoPromise() {
  return (
    <Band label="What we can promise" tone="mist">
      <Reveal>
        <Split ratio="5/7">
          <SectionHeader
            kicker="An honest replacement for the guarantee"
            title="Clear local SEO work and communication, not a guaranteed Google position."
          />
          <div>
            <p className="text-body leading-relaxed text-ink/72">
              Rankings cannot be guaranteed, so no money-back claim is included here. Any future guarantee would need
              clear, verified terms before publication.
            </p>
            <CheckList
              divided
              cols={2}
              className="mt-7 border-t border-line pt-5"
              items={[
                "The agreed local SEO audit and package tasks",
                "A named contact and scheduled communication",
                "Reporting against the agreed measures",
                "Clear notice when scope or access blocks work",
              ]}
            />
          </div>
        </Split>
      </Reveal>
    </Band>
  );
}

export function LocalSeoFAQ() {
  return (
    <ServiceFaqSection
      label="Local SEO FAQ"
      title="Questions before choosing a local SEO package."
      description="Confirm locations, profile ownership, website access, exact deliverables, review responsibilities, reporting definitions and agreement terms before signing."
      items={content.faqs.map(([q, a]) => ({ q, a }))}
      group="local-seo-faq"
      phoneEvent="local_seo_phone_click"
      headingSize="lg"
      headingMaxWidthClassName=""
      bandAccent="bg-amber"
      tone="mist"
    />
  );
}

export function LocalSeoFinalCTA() {
  return (
    <FinalCta
      title="Check where your local SEO needs work."
      titleAccent="local SEO needs work."
      body="Tell us the services and locations that matter, share your website and Google Business Profile, and explain which calls, visits or enquiries you want to improve. A local SEO specialist will review your position and recommend the right package."
      primary={{ label: "Check My Local Visibility", event: "local_seo_final_cta_click" }}
      secondary={{
        label: "Discuss Local SEO Services",
        href: "/contact-us",
        event: "local_seo_brief_start",
      }}
      contactEvents={{ phone: "local_seo_phone_click", email: "local_seo_email_click" }}
    />
  );
}
