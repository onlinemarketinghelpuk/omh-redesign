import { Reveal } from "@/components/Reveal";
import { ServiceBand, type ServiceBandTone } from "@/components/services/ServiceBand";
import { HighlightedText } from "@/components/services/ServicePrimitives";
import { PlanCards } from "@/components/services/PlanCards";
import { CardGrid } from "@/components/ui/CardGrid";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { Button } from "@/components/ui/Button";
import { ReviewProof } from "@/components/ui/Proof";
import { socialMediaPaidAdvertising as content } from "@/lib/content/social-media-paid-advertising";

function Band({
  tone = "white",
  ...props
}: Omit<Parameters<typeof ServiceBand>[0], "accent" | "tone"> & { tone?: ServiceBandTone }) {
  return <ServiceBand {...props} tone={tone} accent="bg-amber" />;
}

function PaidCampaignVisual() {
  return (
    <div
      className="service-media-frame relative w-full min-w-0 max-w-full overflow-hidden rounded-card border border-line bg-inverse p-5 text-oninverse shadow-xl"
      role="img"
      aria-label="Illustrated paid social media advertising dashboard tracking campaign performance and return on ad spend"
    >
      <div className="flex items-center justify-between border-b border-oninverse/10 pb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-deep">
          Paid social control room
        </span>
        <span className="rounded-full bg-amber/20 px-2.5 py-1 text-[10px] font-semibold text-amber-deep">
          Live campaign
        </span>
      </div>
      <div className="mt-5 rounded-xl bg-surface p-5 text-ink">
        <div className="flex items-end justify-between gap-4 max-sm:block">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-deep">Performance signal</p>
            <p className="mt-2 font-sans text-[30px] font-semibold">ROAS</p>
          </div>
          <div className="flex h-20 items-end gap-2 max-sm:mt-4 max-sm:gap-1">
            {[35, 52, 43, 68, 58, 82].map((height, index) => (
              <span
                key={index}
                style={{ height: `${height}%` }}
                className={`w-5 rounded-t max-sm:w-3 ${index === 5 ? "bg-amber" : "bg-amber/35"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        {[
          ["Audience", "Defined"],
          ["Creative", "Testing"],
          ["Budget", "Optimised"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-oninverse/12 bg-oninverse/[0.04] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-oninverse/62">{label}</p>
            <p className="mt-2 text-[14px] font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-oninverse/62">
        <span className="size-2 shrink-0 rounded-full bg-amber" />
        Facebook · Instagram · TikTok · LinkedIn
      </div>
    </div>
  );
}

export function PaidSocialHero() {
  return (
    <PageHero
      eyebrow={content.hero.eyebrow}
      title={<HighlightedText text={content.hero.title} highlight="visibility and conversions" />}
      body={content.hero.body}
      actions={
        <>
          <Button href="/contact" arrow data-event="paid_social_hero_cta_click">
            Request a Paid Social Review
          </Button>
          <Button href="#packages" variant="secondary" data-event="paid_social_packages_click">
            View Paid Social Packages
          </Button>
        </>
      }
      stats={[
        ["Packages from", "£850"],
        ["Minimum ad spend", "£1,000"],
        ["Published term", "3 months"],
      ]}
      statsStyle="divided"
      media={<PaidCampaignVisual />}
      proof={<ReviewProof serviceId="paid-social" heading="Paid social backed by verified client trust" />}
    />
  );
}

export function PaidSocialGoals() {
  return (
    <Band label="Define the goal" tone="navy">
      <Reveal>
        <Split ratio="5/7">
          <SectionHeader
            inverse
            kicker="Brand visibility, interaction, visits and conversions"
            title="Make the platform, audience and budget answer the business goal."
            body="We plan every paid social campaign around the platform where your buyers actually spend time, whether that is Facebook, Instagram, TikTok or LinkedIn, then build the targeting, creative and budget to match the goal. Getting paid advertising on social media right starts with three questions."
          />
          <div>
            <p className="mb-5 text-body leading-relaxed text-oninverse/58">
              Three questions worth answering before a campaign launches:
            </p>
            <ol className="grid gap-4">
              {content.strategyQuestions.map((question, index) => (
                <li
                  key={question}
                  className="flex gap-5 rounded-card border border-oninverse/12 bg-oninverse/[0.04] p-card"
                >
                  <span className="text-body font-semibold text-amber-deep">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-body leading-relaxed text-oninverse/82">{question}</p>
                </li>
              ))}
            </ol>
          </div>
        </Split>
        <div className="mt-10 border-t border-oninverse/12 pt-6">
          <p className="text-body leading-relaxed text-oninverse/62">
            Platform audiences shift constantly, so we work from current Meta and platform figures at the point of
            planning rather than quoting a fixed number here.
          </p>
        </div>
      </Reveal>
    </Band>
  );
}

export function PaidSocialCapabilities() {
  return (
    <Band label="How we can help" tone="mist">
      <Reveal>
        <SectionHeader
          title="Six connected levers for better paid social advertising."
          body="As a paid social marketing agency, we treat audience, creative, measurement, budget, testing and ongoing optimisation as one campaign system rather than six separate tasks."
        />
        <CardGrid cols={2} className="mt-header">
          {content.capabilities.map((item, index) => (
            <article
              key={item.title}
              className={`${index === 0 || index === 5 ? "bg-inverse text-oninverse" : "bg-surface text-ink"} surface-card rounded-card border border-line p-card`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-body font-semibold text-amber-deep">{String(index + 1).padStart(2, "0")}</span>
                <span className={`h-px w-12 ${index === 0 || index === 5 ? "bg-oninverse/15" : "bg-line"}`} />
              </div>
              <h3 className="mt-5 font-sans text-h4 font-semibold">{item.title}</h3>
              <p
                className={`mt-3 text-body leading-relaxed ${index === 0 || index === 5 ? "text-oninverse/68" : "text-ink/70"}`}
              >
                {item.body}
              </p>
            </article>
          ))}
        </CardGrid>
      </Reveal>
    </Band>
  );
}

export function PaidSocialPricing() {
  return (
    <Band label="Published packages" id="packages">
      <Reveal>
        <SectionHeader
          title="Transparent paid social advertising packages for businesses ready to grow."
          body="Our paid social media marketing services come in three published packages. The management price, minimum ad spend and every inclusion are shown separately, so you can see exactly what you are paying for."
        />
        <PlanCards
          className="mt-header"
          plans={content.packages}
          kicker="Paid social"
          price={(pkg) => (
            <div className="mt-6 grid grid-cols-2 border-y border-line py-5">
              <div>
                <p className="eyebrow text-muted">Management</p>
                <p className="mt-1 font-sans text-h3 font-semibold">{pkg.price}</p>
              </div>
              <div className="border-l border-line pl-4">
                <p className="eyebrow text-muted">Minimum ad spend</p>
                <p className="mt-1 font-sans text-h3 font-semibold">{pkg.adSpend}</p>
              </div>
            </div>
          )}
          cta={(pkg) => `Discuss ${pkg.name}`}
          event="paid_social_package_select"
        />
        <div className="mt-8 rounded-card border border-line bg-warm p-6 text-body leading-relaxed text-muted">
          <p>
            Packages include copywriting and content creation aligned to your existing brand. If you need a new brand
            palette, the account manager can explain the separate branding packages available.
          </p>
          <p className="mt-3">
            Social creative includes one review. Assets may be adapted across platforms and optimised for each
            placement. The published packages have a minimum three-month term.
          </p>
        </div>
      </Reveal>
    </Band>
  );
}
