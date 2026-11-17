import { Activity, Database, Gauge, Puzzle, RefreshCw, ShieldCheck } from "lucide-react";
import { CapabilityShowcase, MonitorMock } from "@/components/services/CapabilityShowcase";
import { ServiceHeroArt } from "@/components/services/ServiceHeroArt";
import { Pointer } from "@/components/Pointer";
import { Reveal } from "@/components/Reveal";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceFitSection as SharedServiceFitSection } from "@/components/services/ServiceFitSection";
import { ServiceNextStepsCTA } from "@/components/services/ServiceNextStepsCTA";
import { ServiceProcessTimeline } from "@/components/services/ServiceProcessTimeline";
import { ServiceReasonGrid } from "@/components/services/ServiceReasonGrid";
import { ServiceSectionIntro as SectionIntro } from "@/components/services/ServicePrimitives";
import { PackageComparison } from "@/components/services/PackageComparison";
import { NumberedList } from "@/components/ui/NumberedList";
import { PageHero } from "@/components/ui/PageHero";
import { Split } from "@/components/ui/Split";
import { Button, TextLink } from "@/components/ui/Button";
import { Eyebrow, Fpo, ReviewProof } from "@/components/ui/Proof";
import { ServiceBand as Band } from "@/components/services/ServiceBand";
import { wordpressMaintenance as content } from "@/lib/content/wordpress-maintenance";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

export function MaintenanceHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      title={
        <>
          WordPress maintenance packages that keep your website{" "}
          <span className="text-amber-deep">under control</span>
        </>
      }
      body={content.hero.body}
      actions={
        <>
          <Button href={content.hero.primary.href} arrow data-event="maintenance_hero_cta_click">
            {content.hero.primary.label}
          </Button>
          <Button href={content.hero.secondary.href} variant="secondary" arrow data-event="maintenance_view_packages_click">
            {content.hero.secondary.label}
          </Button>
        </>
      }
      stats={[
        ["Packages from", "£300"],
        ["Included hours from", "2"],
        ["Package meetings", "Monthly"],
      ]}
      media={
        <Pointer>
          <div className="pointer-parallax">
            <ServiceHeroArt variant="maintenance" />
          </div>
        </Pointer>
      }
      proof={<ReviewProof serviceId="maintenance" heading="WordPress support with verified trust" />}
    />
  );
}

export function MaintenanceIssueSection() {
  return (
    <Band label="Problems">
      <Reveal>
        <Split ratio="4/8" gap={10} sticky>
          <div>
            <SectionIntro
              size="md"
              title="WordPress problems rarely arrive at a convenient time"
              accent="convenient time"
              body="These are the WordPress support issues our maintenance packages are designed to catch early, before they become urgent. Grouping them by likely area makes it easier to recognise the problem without pretending every fault has the same fix."
            />
            <p className="mt-7 border-l-2 border-amber pl-5 text-body leading-snug text-ink/85">
              A maintenance plan reduces avoidable risk, but every inherited
              or urgent issue still needs proper diagnosis.
            </p>
          </div>
          <NumberedList variant="ruled" items={content.issues} />
        </Split>
      </Reveal>
    </Band>
  );
}

export function MaintenanceFitSection() {
  return (
    <SharedServiceFitSection
      title="For businesses that need WordPress maintenance packages to stay dependable"
      titleAccent="stay dependable"
      body="Maintenance works best when the site matters to the business, access is available and routine care is separated from larger development projects."
      good={content.fit.good}
      notFit={content.fit.notFit}
      notFitTitle="Needs a different first step"
    />
  );
}

export function MaintenanceCapabilityGrid() {
  const [featured, ...rest] = content.capabilities;
  const icons = [Gauge, RefreshCw, ShieldCheck, Database, Puzzle, Activity];
  return (
    <CapabilityShowcase
      label="Care"
      intro={{
        title: "WordPress maintenance services covering routine care, monitoring and practical support",
        accent: "practical support",
        body: "The service range includes issue investigation, performance, software updates, security checks, backups, uptime monitoring and a monthly support rhythm.",
      }}
      featured={{
        eyebrow: "When something is already wrong",
        title: featured.title,
        body: featured.body,
        detail: featured.detail,
        primary: { label: "See the packages", href: "#packages", event: "maintenance_care_packages_click" },
        secondary: { label: "Talk to us", href: "/contact", event: "maintenance_care_contact_click" },
        aside: <MonitorMock />,
      }}
      items={rest.map((item, i) => ({ ...item, icon: icons[i] ?? Activity }))}
    />
  );
}

export function MaintenanceProcessSteps() {
  return (
    <ServiceProcessTimeline
      label="Monthly rhythm"
      title="A repeatable WordPress maintenance cycle"
      titleAccent="maintenance cycle"
      body="The initial review creates a baseline. From there, routine work follows the same clear sequence each month."
      steps={content.process}
      action={{ label: "Start with an audit", event: "maintenance_form_start" }}
    />
  );
}

export function MaintenancePricingPackages() {
  return (
    <Band label="Packages" id="packages">
      <div data-event="maintenance_pricing_view">
        <div>
          <SectionIntro
            title="WordPress website maintenance packages with clear published allowances"
            accent="published allowances"
            body="Three packages across sixteen comparison points. Billing and contract terms still to be confirmed are marked."
          />
          <p className="mt-5 text-body leading-relaxed text-ink/70">
            No package has been labelled as recommended. The right option
            depends on the website, request volume and whether larger
            development work is already needed.
          </p>
        </div>
        <PackageComparison
          caption="WordPress maintenance package comparison by inclusion and price"
          packages={content.packages}
          groups={content.packageGroups}
          notes={content.pricingNotes}
          event="maintenance_package_select"
          cardCta="Discuss this maintenance package"
        />
      </div>
    </Band>
  );
}

export function MaintenanceProofSection() {
  if (!CASE_STUDIES_LIVE) return null;
  return (
    <Band label="Proof" tone="white">
      <Reveal>
        <div className="overflow-hidden rounded-card border border-soft-dark bg-soft/60">
          <div className="grid grid-cols-12 gap-x-10 gap-y-8 p-10 max-lg:block max-sm:p-6">
            <div className="col-span-12">
              <Eyebrow>Client work</Eyebrow>
              <h2 className="mb-5 mt-6 font-sans text-h3 font-semibold text-balance">
                Show the problem, the WordPress maintenance work and{" "}
                <span className="text-amber-deep">the verified outcome</span>
              </h2>
              <p className="text-body leading-relaxed text-ink/75">
                Every maintenance case study covers the same ground: what was breaking, what
                routine we introduced, what was fixed, and how the client experienced the support.
              </p>
              <ul className="mt-7 border-t border-soft-dark">
                {[
                  "Original website problem",
                  "Maintenance scope and package",
                  "Work completed and reporting rhythm",
                  "Verified result and client comment",
                ].map((field) => (
                  <li
                    key={field}
                    className="border-b border-soft-dark py-3 text-body text-ink/70"
                  >
                    {field}
                  </li>
                ))}
              </ul>
              {CASE_STUDIES_LIVE && (
              <div className="mt-7">
                <TextLink
                  href="/case-studies"
                  data-event="maintenance_case_study_click"
                >
                  View case studies
                </TextLink>
              </div>
              )}
            </div>
            <div className="col-span-12 mt-9">
              <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
                <Fpo
                  ratio="4/3"
                  tag="Before"
                  title="WordPress issue screenshot"
                  note="Use the real fault, warning or previous setup." source="/images/Services/Images on the pages/before website maintenance.png" alt="Illustrative WordPress dashboard before maintenance" />
                <Fpo
                  ratio="4/3"
                  tag="After"
                  title="Maintenance report or fix"
                  note="Use an approved result, report or resolved screen." source="/images/Services/Images on the pages/After website maintenance.png" alt="Illustrative WordPress dashboard after maintenance" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Band>
  );
}

export function MaintenanceWhyChooseSection() {
  return (
    <ServiceReasonGrid
      title="WordPress maintenance services connected to development and marketing"
      titleAccent="development and marketing"
      body="Routine website care is more useful when the team can recognise when a problem needs development, conversion work, SEO input or a wider rebuild."
      reasons={content.reasons}
    />
  );
}

export function MaintenanceFAQAccordion() {
  return (
    <ServiceFaqSection
      title="Questions before you choose a WordPress maintenance package"
      titleAccent="maintenance package"
      description="Ask for written confirmation of response coverage, billing, VAT, contract length and warranty terms before signing."
      items={content.faqs.map(([q, a]) => ({ q, a }))}
      group="maintenance-faq"
      phoneEvent="maintenance_phone_click"
    />
  );
}

export function MaintenanceFinalCTA() {
  return (
    <ServiceNextStepsCTA
      title="Need a clearer plan for WordPress maintenance and support?"
      titleAccent="maintenance and support?"
      body="Tell us what the website does, what has been going wrong and what support you need each month. We will review the setup and recommend a practical next step."
      primary={{ label: "Discuss WordPress Maintenance Packages", event: "maintenance_final_cta_click" }}
      secondary={{
        label: "Send a Website Brief",
        href: "/wordpress-website-maintenance-request-quote",
        event: "maintenance_form_start",
      }}
      phoneEvent="maintenance_phone_click"
      emailEvent="maintenance_email_click"
      steps={[
        "Your website and request are reviewed by a real person.",
        "We discuss access, current problems and the appropriate level of cover.",
        "You receive a recommendation on audit, repair work or a maintenance package.",
      ]}
    />
  );
}
