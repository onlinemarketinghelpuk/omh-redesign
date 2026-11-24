import { Pointer } from "@/components/Pointer";
import { Reveal } from "@/components/Reveal";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceFitSection as SharedServiceFitSection } from "@/components/services/ServiceFitSection";
import { ServiceNextStepsCTA } from "@/components/services/ServiceNextStepsCTA";
import { ServiceProcessTimeline } from "@/components/services/ServiceProcessTimeline";
import { ServiceReasonGrid } from "@/components/services/ServiceReasonGrid";
import { PackageComparison } from "@/components/services/PackageComparison";
import { Button, TextLink } from "@/components/ui/Button";
import { CheckList } from "@/components/ui/CheckList";
import { NumberedList } from "@/components/ui/NumberedList";
import { PageHero } from "@/components/ui/PageHero";
import { Eyebrow, Fpo, ReviewProof } from "@/components/ui/Proof";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { MediaFrame } from "@/components/ServiceMedia";
import { ServiceBand as Band } from "@/components/services/ServiceBand";
import { googleAdsPpc as content } from "@/lib/content/google-ads-ppc";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

// Pilot of the responsive rebuild (docs/responsive-plan.md, Phase 3): every section is built from the shared
// components, so phone, tablet and laptop behaviour comes from them and this file only carries content.

export function PpcHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      // &nbsp; keeps "agency UK" on one line so the keyword phrase never splits.
      title={<>Google Ads agency&nbsp;UK: PPC management built around <span className="text-amber-deep">measurable action</span></>}
      body={content.hero.body}
      actions={
        <>
          <Button href={content.hero.primary.href} data-event="ppc_hero_cta_click">{content.hero.primary.label}</Button>
          <Button href={content.hero.secondary.href} variant="secondary" data-event="ppc_view_packages_click">{content.hero.secondary.label}</Button>
        </>
      }
      stats={[["Published packages from", "£750"], ["Required ad spend from", "£500"], ["Published set-up time", "14 days"]]}
      media={<Pointer><div className="pointer-parallax"><MediaFrame kind="screen" theme="ppc" ratio="16/11" title="Google Ads campaign view" note="Replace with a real, anonymised account view with spend, date range and conversion definition visible." source="/images/Services/google-ads-hero.png" alt="A laptop showing a search advertising dashboard with rising conversions beside a smartphone displaying text ads with call buttons on a search results page." /></div></Pointer>}
      proof={<ReviewProof serviceId="google-ads" heading="Google Ads experience with verified client trust" />}
    />
  );
}

export function PpcNeedSection() {
  return (
    <Band label="Need help?">
      <Reveal>
        <Split ratio="4/8" gap={10} sticky>
          <div>
            <SectionHeader size="md" title="Getting Google Ads to work for your business" accent="work for your business" body="Before the task list, these are the commercial problems Google Ads management has to solve." />
            <p className="mt-7 border-l-2 border-amber pl-5 text-body leading-snug text-ink/85">More clicks are not the goal. Useful enquiries, bookings or sales, and reliable evidence of them, are what make optimisation possible.</p>
          </div>
          <NumberedList variant="ruled" items={content.problems} />
        </Split>
      </Reveal>
    </Band>
  );
}

export function PpcFitSection() {
  return (
    <SharedServiceFitSection
      title="For businesses ready to measure, learn and improve"
      titleAccent="measure, learn and improve"
      body="A useful PPC engagement needs a clear offer, a usable destination, appropriate measurement and realistic expectations about testing."
      good={content.fit.good}
      notFit={content.fit.notFit}
      notFitTitle="Not the right engagement"
    />
  );
}

export function PpcCapabilityGrid() {
  const [featured, ...rest] = content.capabilities;
  return (
    <Band label="Campaign formats">
      <Reveal>
        <SectionHeader title="The Google Ads formats our PPC management services cover" accent="Google Ads formats" body="The right mix depends on search demand, audience eligibility, creative, product data, budget and the commercial goal." />
        <Pointer className="pointer-spotlight relative mt-header overflow-hidden rounded-card bg-inverse p-card-lg text-oninverse">
          <Split ratio="6/5" gap={10} align="start" className="relative z-10">
            <div>
              <p className="eyebrow text-oninverse/55">High-intent demand</p>
              <h3 className="mt-5 font-sans text-h2 font-semibold">{featured.title}</h3>
              <p className="mt-5 text-lead leading-relaxed text-oninverse/75">{featured.body}</p>
            </div>
            <CheckList inverse items={featured.detail ?? []} className="border-t border-oninverse/15 pt-6" />
          </Split>
        </Pointer>
        <NumberedList variant="card" cols={3} start={2} items={rest.map((item) => [item.title, item.body] as const)} className="mt-8" />
      </Reveal>
    </Band>
  );
}

export function PpcProcessSteps() {
  return (
    <ServiceProcessTimeline
      label="How we help"
      title="How our Google Ads management works, from account access to optimisation"
      titleAccent="account access to optimisation"
      body="Our Google Ads campaign management services cover planning, analytics, copywriting, management and reporting: the recurring work in every package."
      steps={content.process}
      action={{ label: "Request an account review", event: "ppc_form_start" }}
    />
  );
}

export function PpcPricingPackages() {
  return (
    <Band label="Packages" id="packages">
      <div data-event="ppc_pricing_view">
        <SectionHeader title="Our Google Ads management packages, compared clearly" accent="compared clearly" body="Four packages across sixteen comparison points, including the two exclusions in PPC Seed." />
        <p className="mt-5 text-body leading-relaxed text-ink/70">Package names do not imply a recommendation. Scope, billing frequency, VAT, ad-spend period and agreement terms should be confirmed in the written proposal.</p>
        <PackageComparison
          caption="Google Ads PPC package comparison by inclusion and price"
          packages={content.packages}
          groups={content.packageGroups}
          notes={content.pricingNotes}
          event="ppc_package_select"
        />
      </div>
    </Band>
  );
}

export function PpcProofSection() {
  if (!CASE_STUDIES_LIVE) return null;
  return (
    <Band label="Proof" tone="white">
      <Reveal>
        <div className="overflow-hidden rounded-card border border-soft-dark bg-soft/60 p-card-lg">
          <Eyebrow>Client work</Eyebrow>
          <h2 className="mb-5 mt-6 font-sans text-h3 font-semibold text-balance">Show spend, measurement and the <span className="text-amber-deep">verified commercial outcome</span></h2>
          <p className="text-body leading-relaxed text-ink/75">Every Google Ads case study we publish includes the date range and what counted as a conversion, so the result can actually be evaluated.</p>
          <ul className="mt-7 border-t border-soft-dark">{["Starting account and business goal", "Campaign and landing-page work", "Spend and measurement period", "Verified lead, sale or efficiency outcome"].map((field) => <li key={field} className="border-b border-soft-dark py-3 text-body text-ink/70">{field}</li>)}</ul>
          <div className="mt-7"><TextLink href="/case-studies" data-event="ppc_case_study_click">View case studies</TextLink></div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <Fpo ratio="4/3" tag="Before" title="Account baseline" note="Show an approved starting view and date range." source="/images/Services/Images on the pages/Account baseline Before.png" alt="Illustrative Google Ads account baseline" />
            <Fpo ratio="4/3" tag="After" title="Verified PPC result" note="Use the same metric definition and a comparable period." source="/images/Services/Images on the pages/Verified PPC result after.png" alt="Illustrative Google Ads reporting example" />
          </div>
        </div>
      </Reveal>
    </Band>
  );
}

export function PpcWhyChooseSection() {
  return (
    <ServiceReasonGrid
      title="Campaign management connected to the website behind every click"
      titleAccent="website behind every click"
      body="The old page covers keyword choice, landing-page analysis, tracking, copywriting and regular optimisation. Keeping those parts joined up makes the service easier to evaluate."
      reasons={content.reasons}
    >
      <div className="mt-header rounded-card bg-inverse p-card-lg text-oninverse">
        <p className="eyebrow text-oninverse/55">Before increasing spend</p>
        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>:last-child:nth-child(odd)]:col-span-2">
          {content.warnings.map(([title, body]) => (
            <article key={title} className="border-t border-oninverse/15 pt-5">
              <h3 className="font-sans text-h4 font-semibold">{title}</h3>
              <p className="mt-3 text-body leading-relaxed text-oninverse/72">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </ServiceReasonGrid>
  );
}

export function PpcFAQAccordion() {
  return (
    <ServiceFaqSection
      title="Questions before appointing a PPC agency"
      titleAccent="PPC agency"
      description="Ask for written confirmation of scope, access, ad-spend ownership, billing, VAT, agreement length and conversion definitions before signing."
      items={content.faqs.map(([q, a]) => ({ q, a }))}
      group="ppc-faq"
      phoneEvent="ppc_phone_click"
    />
  );
}

export function PpcFinalCTA() {
  return (
    <ServiceNextStepsCTA
      title="Need a clearer plan for Google Ads?"
      titleAccent="Google Ads?"
      body="Tell us what you sell, where you advertise, what you spend and what a useful conversion means. As a UK Google Ads services agency, we will review your starting point and recommend a practical next step."
      primary={{ label: "Discuss Google Ads Management", event: "ppc_final_cta_click" }}
      secondary={{
        label: "Send a Campaign Brief",
        href: "/contact-us",
        event: "ppc_form_start",
      }}
      phoneEvent="ppc_phone_click"
      emailEvent="ppc_email_click"
      steps={[
        "Your account, website and campaign goal are reviewed by a real person.",
        "We discuss measurement, budget, targeting, access and the appropriate package.",
        "You receive a scoped recommendation with exclusions and next actions.",
      ]}
    />
  );
}
