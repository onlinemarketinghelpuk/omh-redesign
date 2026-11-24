import type { ReactNode } from "react";
import { Pointer } from "@/components/Pointer";
import { MediaFrame } from "@/components/ServiceMedia";
import { Reveal } from "@/components/Reveal";
import { FinalCta, type CtaAction } from "@/components/ui/FinalCta";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceBand, type ServiceBandTone } from "@/components/services/ServiceBand";
import { HighlightedText, withLinks } from "@/components/services/ServicePrimitives";
import { PlanCards } from "@/components/services/PlanCards";
import { CardGrid } from "@/components/ui/CardGrid";
import { NumberedList } from "@/components/ui/NumberedList";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { Button } from "@/components/ui/Button";
import { ReviewProof, type ServiceProofId } from "@/components/ui/Proof";
import { SiteTestimonials } from "@/components/Testimonials";
import { socialMediaMarketing as content } from "@/lib/content/social-media-marketing";

/* These sections are the social family's shared scaffold: /social-media-marketing-services
   renders them with its own copy by default, and the Facebook and Instagram agency pages
   pass their copy in. Layout, accent and rhythm stay identical across the three. */

export function Band({
  tone = "white",
  ...props
}: Omit<Parameters<typeof ServiceBand>[0], "accent" | "tone"> & { tone?: ServiceBandTone }) {
  return <ServiceBand {...props} tone={tone} accent="bg-amber" />;
}

function SocialDashboard() {
  return (
    <div
      className="service-media-frame relative overflow-hidden rounded-card border border-line bg-inverse p-5 text-oninverse shadow-xl"
      role="img"
      aria-label="Illustrated social media campaign planning dashboard"
    >
      <div className="flex items-center justify-between border-b border-oninverse/10 pb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-deep">Campaign studio</span>
        <span className="flex gap-1.5">
          <i className="size-2 rounded-full bg-amber" />
          <i className="size-2 rounded-full bg-oninverse/60" />
          <i className="size-2 rounded-full bg-oninverse/30" />
        </span>
      </div>
      <div className="mt-5 grid grid-cols-[1.2fr_.8fr] gap-4 max-sm:grid-cols-1">
        <div className="rounded-xl bg-surface p-5 text-ink">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-deep">Content calendar</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className={`aspect-square rounded-md ${[1, 4, 6, 9, 10].includes(i) ? "bg-amber" : i === 7 ? "bg-amber/40" : "bg-soft"}`}
              />
            ))}
          </div>
          <div className="mt-5 h-2 rounded-full bg-soft">
            <span className="block h-full w-[72%] rounded-full bg-amber" />
          </div>
        </div>
        <div className="grid gap-4">
          <div className="rounded-xl border border-oninverse/12 bg-oninverse/[0.045] p-4">
            <p className="text-[10px] uppercase tracking-[0.13em] text-oninverse/50">Channels</p>
            <p className="mt-2 font-sans text-[26px] font-semibold">4</p>
          </div>
          <div className="rounded-xl border border-oninverse/12 bg-oninverse/[0.045] p-4">
            <p className="text-[10px] uppercase tracking-[0.13em] text-oninverse/50">Status</p>
            <p className="mt-2 text-[18px] font-semibold text-amber-deep">Ready for review</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-oninverse/55">
        <span className="rounded-lg border border-oninverse/10 py-3">Create</span>
        <span className="rounded-lg border border-oninverse/10 py-3">Approve</span>
        <span className="rounded-lg border border-oninverse/10 py-3">Report</span>
      </div>
    </div>
  );
}

// Published-package facts shared by every page in the family.
export const socialHeroStats: readonly (readonly [string, string])[] = [
  ["Packages from", "£450"],
  ["Term", "3 months"],
  ["Onboarding", "24 hours"],
];

export function SocialHero({
  eyebrow = content.hero.eyebrow,
  title = content.hero.title,
  highlight = "Growing UK Businesses",
  body = content.hero.body,
  primary = { label: "Discuss Social Media Marketing Services", event: "social_hero_cta_click" },
  secondary = { label: "View Social Media Packages", event: "social_packages_click" },
  stats = [["Social media marketing services packages from", "£450"], ...socialHeroStats.slice(1)],
  visual = <Pointer><div className="pointer-parallax"><MediaFrame kind="image" theme="seo" ratio="16/11" title="Social media management" note="" source="/images/Services/social-media-management-hero.png" alt="A laptop showing a social media scheduling dashboard with a weekly content calendar beside a tablet with a visual content planner and a smartphone displaying a business post." /></div></Pointer>,
  proofId = "social-media",
  proofHeading = "Social media work backed by verified client trust",
}: {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  body?: string;
  primary?: { label: string; event: string };
  secondary?: { label: string; event: string };
  stats?: readonly (readonly [string, string])[];
  visual?: ReactNode;
  proofId?: ServiceProofId;
  proofHeading?: string;
}) {
  return (
    <PageHero
      eyebrow={eyebrow}
      title={<HighlightedText text={title} highlight={highlight} />}
      body={body}
      actions={
        <>
          <Button href="/book-a-consultation" data-event={primary.event}>
            {primary.label}
          </Button>
          <Button href="#packages" variant="secondary" data-event={secondary.event}>
            {secondary.label}
          </Button>
        </>
      }
      stats={stats}
      statsStyle="divided"
      media={visual}
      proof={<ReviewProof serviceId={proofId} heading={proofHeading} />}
    />
  );
}

export function SocialGoals({
  label = "Define the goal for your social media marketing services",
  eyebrow = "Need help?",
  title = "Start with the outcome, not the posting schedule.",
  body = "Social media marketing services can include text, images, video, community activity and organic promotion. A clear strategy keeps those activities connected to the business goal and makes sure every post works toward a measurable result.",
  goals = content.goals,
  note = "Platform audiences shift constantly, so we work from current platform figures at the point of planning rather than quoting a fixed number here.",
}: {
  label?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  goals?: readonly string[];
  note?: ReactNode;
}) {
  return (
    <Band label={label} id="need-help" tone="navy">
      <Reveal>
        <Split ratio="5/7">
          <SectionHeader inverse kicker={eyebrow} title={title} body={body} />
          <CardGrid as="ol" cols={2}>
            {goals.map((goal, index) => (
              <li key={goal} className="rounded-card border border-oninverse/12 bg-oninverse/[0.04] p-card">
                <span className="text-body font-semibold text-amber-deep">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-4 text-body leading-relaxed text-oninverse/82">{goal}</p>
              </li>
            ))}
          </CardGrid>
        </Split>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-5 ">
          <p className="text-body leading-relaxed text-oninverse/62">{note}</p>
          <Button href="/book-a-consultation" variant="secondary">
            Talk Through Your Goals
          </Button>
        </div>
      </Reveal>
    </Band>
  );
}

export function SocialSupport({
  label = "Social Media Marketing Management Services",
  title = "Creative, optimisation and account management in one joined-up social media marketing agency service.",
  body = "From branded assets and profile design through to account refreshes and review management.",
  items = content.support,
}: {
  label?: string;
  title?: string;
  body?: string;
  items?: readonly { title: string; body: string }[];
}) {
  return (
    <Band label={label} id="how-can-help" tone="mist">
      <Reveal>
        <SectionHeader title={title} body={body || undefined} />
        <NumberedList variant="card" cols={3} items={items} className="mt-header" />
      </Reveal>
    </Band>
  );
}

export function SocialPricing({
  label = "Social Media Marketing Services Packages",
  title = "Affordable social media marketing services packages for small businesses that want to grow.",
  body = "Three packages with clear prices, channel volumes and inclusions, so you can compare them side by side.",
  notes = [
    "Our social media marketing services packages include copywriting and content creation aligned to your existing brand. If you do not have an established brand palette, we can discuss the options available.",
    "Social creative includes one review. Content is adapted across platforms and optimised for each channel. All packages have a minimum three-month term. View our [social media marketing services pricing](/pricing) for the full breakdown.",
  ],
  event = "social",
}: {
  label?: string;
  title?: string;
  body?: string;
  notes?: readonly string[];
  event?: string;
}) {
  return (
    <Band label={label} id="packages">
      <Reveal>
        <SectionHeader title={title} body={body} />
        <PlanCards
          className="mt-header"
          plans={content.packages}
          kicker="Social media marketing"
          price={(pkg) => (
            <p className="mt-6 border-y border-line py-5 font-sans text-price font-semibold">
              {pkg.price}
              <span className="ml-1 text-body font-normal text-muted">published price</span>
            </p>
          )}
          cta={(pkg) => `Discuss ${pkg.name} Package`}
          event={`${event}_package_select`}
        />
        <div className="mt-8 rounded-card border border-line bg-warm p-6 text-body leading-relaxed text-muted">
          {notes.map((note, i) => (
            <p key={note} className={i ? "mt-3" : undefined}>
              {withLinks(note)}
            </p>
          ))}
        </div>
      </Reveal>
    </Band>
  );
}

export function SocialGuaranteeAndReporting({
  guarantee,
  reporting,
}: {
  guarantee?: { label?: string; title?: string; body: string | readonly string[] };
  reporting?: {
    label?: string;
    eyebrow?: string;
    title: string;
    intro?: string;
    body?: readonly string[];
    items?: readonly { term: string; body: string }[];
  };
}) {
  const guaranteeBody =
    typeof guarantee?.body === "string"
      ? [guarantee.body, "Start working with Online Marketing Help to move your business forward."]
      : (guarantee?.body ?? [
          "Our experience gives us confidence in the work. [CONFIRM SERVICE DETAIL: exact guarantee terms] Deciding to work together easier.",
          "Start working with Online Marketing Help to move your business forward.",
        ]);
  const reportingBody = reporting?.body ?? [
    "Your account manager provides regular monthly updates and a consultation call so there is enough data to explain what has been achieved, where your objectives stand and whether the campaign is meeting or exceeding them.",
    "Your report is tailored to the goals you set, without burying you in irrelevant detail. If you want to understand a specific part of the work, use the monthly call to ask. The purpose is to make achievements, results and month-on-month progress clear.",
  ];
  const eyebrow = reporting && "eyebrow" in reporting ? reporting.eyebrow : "Looking for more information?";
  return (
    <>
      <Band label={guarantee?.label ?? "Guarantee"} tone="navy">
        <Reveal>
          <Split ratio="5/7">
            <SectionHeader
              inverse
              kicker="Don’t just take our word for it"
              title={guarantee?.title ?? "A published money-back promise, ready for final terms."}
            />
            <div>
              {guaranteeBody.map((paragraph, i) => (
                <p key={paragraph} className={`text-body leading-relaxed text-oninverse/72 ${i ? "mt-4" : ""}`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </Split>
        </Reveal>
      </Band>
      <Band label={reporting?.label ?? "Resources"} tone="mist">
        <Reveal>
          <Split ratio="4/8">
            <SectionHeader
              kicker={eyebrow}
              title={reporting?.title ?? "Reporting that stays tied to your goals."}
              body={reporting?.intro}
            />
            <div className="space-y-5 text-body leading-relaxed text-ink/70">
              {reporting?.items
                ? reporting.items.map((item) => (
                    <div key={item.term} className="rounded-card border border-line bg-surface p-card">
                      <h3 className="font-sans text-h4 font-semibold text-ink">{item.term}</h3>
                      <p className="mt-3">{item.body}</p>
                    </div>
                  ))
                : reportingBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </Split>
        </Reveal>
      </Band>
    </>
  );
}

export function SocialReviews({
  label,
  title = "What customers say.",
  eventPrefix = "social",
}: {
  label?: string;
  title?: string;
  eventPrefix?: string;
}) {
  return (
    <SiteTestimonials
      label={label}
      eventPrefix={eventPrefix}
      title={title}
      body="Comments from businesses we have worked with. They describe their experience, not a guaranteed result."
      accent="bg-amber"
    />
  );
}

export function SocialFAQ({
  label = "FAQs",
  title = "Looking for more information?",
  description = "The eleven questions we are asked most often.",
  items = content.faqs,
  group = "social-faq",
}: {
  label?: string;
  title?: string;
  description?: string;
  items?: readonly { q: string; a: string }[];
  group?: string;
}) {
  return (
    <ServiceFaqSection
      label={label}
      title={title}
      description={description}
      items={items}
      group={group}
      tone="mist"
      bandAccent="bg-amber"
      headingSize="lg"
      headingMaxWidthClassName=""
      descriptionClassName="text-body text-ink/68"
      sticky={false}
    />
  );
}

export function SocialFinalCTA({
  title = "Want your social media handled consistently?",
  titleAccent = "handled consistently?",
  body = "Book a call at a convenient time, or speak to the team directly. We will look at what you are posting now before recommending a plan.",
  primaryLabel = "Discuss Social Media Support",
  secondary = {
    label: "Request a Paid Social Quote",
    href: "/contact-us",
    event: "social_quote_start",
  },
  stepsHeading,
  eventPrefix = "social",
}: {
  title?: string;
  titleAccent?: string;
  body?: string;
  primaryLabel?: string;
  secondary?: CtaAction;
  stepsHeading?: string;
  eventPrefix?: string;
}) {
  return (
    <FinalCta
      title={title}
      titleAccent={titleAccent}
      body={body}
      primary={{ label: primaryLabel, event: `${eventPrefix}_final_cta_click` }}
      secondary={secondary}
      stepsHeading={stepsHeading}
      contactEvents={{ phone: `${eventPrefix}_phone_click`, email: `${eventPrefix}_email_click` }}
    />
  );
}
