import Link from "next/link";
import { BarChart3, FileSearch, Link2, PackageSearch, type LucideIcon } from "lucide-react";
import { Pointer } from "@/components/Pointer";
import { MediaFrame } from "@/components/ServiceMedia";
import { Reveal } from "@/components/Reveal";
import { CaseStudyVisual } from "@/components/case-studies/CaseStudyVisual";
import { CapabilityShowcase } from "@/components/services/CapabilityShowcase";
import { ServiceBand as Band } from "@/components/services/ServiceBand";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceFitSection } from "@/components/services/ServiceFitSection";
import { ServiceNextStepsCTA } from "@/components/services/ServiceNextStepsCTA";
import { ServiceProcessTimeline } from "@/components/services/ServiceProcessTimeline";
import { ServiceReasonGrid } from "@/components/services/ServiceReasonGrid";
import {
  CheckIcon as Check,
  HighlightedText,
  ServiceSectionIntro as SectionIntro,
  withLinks,
} from "@/components/services/ServicePrimitives";
import { ArrowRight, Button } from "@/components/ui/Button";
import { ReviewProof } from "@/components/ui/Proof";
import { CardGrid } from "@/components/ui/CardGrid";
import { NumberedList } from "@/components/ui/NumberedList";
import { PageHero } from "@/components/ui/PageHero";
import { Split } from "@/components/ui/Split";
import { ComparisonTable } from "@/components/PriceListSections";
import { ecommerceSeoPackages } from "@/lib/content/price-list";
import { caseStudies } from "@/lib/content/case-studies";
import { ecommerceSeo as page } from "@/lib/content/ecommerce-seo";
import { CASE_STUDIES_LIVE } from "@/lib/flags";

/* /ecommerce-seo-services on the service-page scaffold (hero with proof badge, ruled
   problem list, capability showcase, fit columns, process timeline, package cards,
   reason grid, FAQ band, final CTA). Copy comes from lib/content/ecommerce-seo.ts. */

const event = "ecommerce_seo";

export function EcommerceSeoHero() {
  const h = page.hero;
  return (
    <PageHero
      eyebrow={h.eyebrow}
      title={<HighlightedText text={h.title} highlight={h.titleAccent} />}
      body={h.body}
      actions={
        <>
          <Button href={h.primary.href} data-event={`${event}_hero_cta_click`}>{h.primary.label}</Button>
          <Button href={h.secondary.href} variant="secondary" data-event={`${event}_view_packages_click`}>{h.secondary.label}</Button>
        </>
      }
      stats={CASE_STUDIES_LIVE ? h.stats : undefined}
      statsNote={h.statsNote}
      media={
        <Pointer>
          <div className="pointer-parallax" role="img" aria-label={h.visualLabel}>
            <MediaFrame kind="image" theme="seo" ratio="16/11" title="Ecommerce SEO services" note="" source="/images/Services/ecommerce-seo-hero.png" alt="A laptop showing an online store analytics dashboard with rising organic revenue beside a smartphone displaying product search results with star ratings and prices." />
          </div>
        </Pointer>
      }
      proof={<ReviewProof serviceId="ecommerce-seo" heading="Ecommerce SEO backed by verified client trust" />}
    />
  );
}

export function EcommerceSeoWhy() {
  const w = page.why;
  return (
    <Band label={w.eyebrow}>
      <Reveal>
        <Split ratio="6/6" gap={10}>
          <SectionIntro title={w.title} accent={w.titleAccent} body={w.body} bodyClassName="text-body" />
          <div className="grid gap-5 self-center">
            {w.cards.map(([title, body], index) => (
              <article key={title} className="surface-card grid grid-cols-[auto_1fr] gap-x-5 rounded-card border border-line bg-surface p-card">
                <span className="font-sans text-body font-semibold tabular-nums tracking-[0.1em] text-amber">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-sans text-h4 font-semibold">{title}</h3>
                  <p className="mt-2.5 text-body leading-relaxed text-ink/75">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </Split>
      </Reveal>
    </Band>
  );
}

/* Illustrative audit findings for the feature card's aside. */
function AuditMock() {
  const rows: [string, string, boolean][] = [
    ["Category pages missing copy", "High impact", true],
    ["Filter URLs indexed", "High impact", true],
    ["Product schema invalid", "Medium", false],
    ["Images over 300 KB", "Medium", false],
  ];
  return (
    <div className="rounded-[8px] border border-oninverse/12 bg-oninverse/[0.06] p-4">
      <div className="flex items-center justify-between border-b border-oninverse/12 pb-3">
        <span className="font-sans text-[14px] font-semibold">Audit findings, ranked by revenue impact</span>
      </div>
      <ul className="mt-2">
        {rows.map(([k, v, high]) => (
          <li key={k} className="flex items-center justify-between gap-3 border-b border-oninverse/10 py-2.5 text-[13px] last:border-b-0">
            <span className="text-oninverse/85">{k}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${high ? "bg-amber text-white" : "border border-oninverse/20 text-oninverse/65"}`}>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EcommerceSeoServices() {
  const s = page.services;
  const [featured, ...rest] = s.items;
  const icons: LucideIcon[] = [FileSearch, PackageSearch, Link2];
  return (
    <CapabilityShowcase
      label={s.eyebrow}
      intro={{ title: s.title, accent: s.titleAccent, body: s.body }}
      featured={{
        eyebrow: "Every engagement starts here",
        title: featured.title,
        body: featured.body,
        primary: { label: page.hero.primary.label, href: page.hero.primary.href, event: `${event}_audit_cta_click` },
        secondary: { label: "See the packages", href: "#packages", event: `${event}_services_packages_click` },
        aside: <AuditMock />,
      }}
      items={rest.map((item, i) => ({ ...item, icon: icons[i] ?? BarChart3 }))}
    />
  );
}

export function EcommerceSeoFit() {
  const f = page.fit;
  return (
    <ServiceFitSection
      label={f.eyebrow}
      title={f.title}
      titleAccent={f.titleAccent}
      good={f.good}
      notFit={f.notFit}
      notFitTitle="Not the right engagement"
    />
  );
}

export function EcommerceSeoProblems() {
  const p = page.problems;
  return (
    <Band label={p.eyebrow} tone="warm">
      <Reveal>
        <Split ratio="4/8" gap={10} sticky>
          <SectionIntro size="md" title={p.title} accent={p.titleAccent} />
          <NumberedList variant="ruled" items={p.items} />
        </Split>
      </Reveal>
    </Band>
  );
}

export function EcommerceSeoBenefits() {
  const b = page.benefits;
  return <ServiceReasonGrid label={b.eyebrow} tone="white" title={b.title} titleAccent={b.titleAccent} body={b.body} reasons={b.items} />;
}

export function EcommerceSeoConsultant() {
  const c = page.consultant;
  return (
    <Band label={c.eyebrow} tone="navy">
      <Reveal>
        <Split ratio="7/5">
          <div>
            <h2 className="font-sans text-h2 font-semibold text-balance">
              <HighlightedText text={c.title} highlight={c.titleAccent} highlightClassName="text-[var(--accent-light)]" />
            </h2>
            <p className="mt-5 text-body leading-relaxed text-oninverse/72">{c.body}</p>
          </div>
          <div className="self-end rounded-card border border-oninverse/15 bg-oninverse/[0.05] p-card">
            <p className="eyebrow text-oninverse/60">Experience</p>
            <p className="mt-4 text-body leading-relaxed text-oninverse/85">{c.brands}</p>
          </div>
        </Split>
      </Reveal>
    </Band>
  );
}

export function EcommerceSeoPlatforms() {
  const p = page.platforms;
  return (
    <Band label={p.eyebrow} tone="white">
      <Reveal>
        <SectionIntro title={p.title} accent={p.titleAccent} body={p.body} bodyClassName="text-body" />
        <CardGrid cols={3} className="mt-header">
          {p.items.map(([letter, title, body]) => (
            <article key={title} className="surface-card rounded-card border border-line bg-surface p-card">
              <span className="flex size-11 items-center justify-center rounded-[10px] bg-soft font-sans text-[20px] font-semibold text-amber-deep" aria-hidden="true">{letter}</span>
              <h3 className="mt-5 font-sans text-h4 font-semibold">{title}</h3>
              <p className="mt-3 text-body leading-relaxed text-ink/75">{withLinks(body)}</p>
            </article>
          ))}
        </CardGrid>
      </Reveal>
    </Band>
  );
}

export function EcommerceSeoProcess() {
  const p = page.process;
  return (
    <ServiceProcessTimeline
      label={p.eyebrow}
      title={p.title}
      titleAccent={p.titleAccent}
      body={p.body}
      steps={p.steps}
      action={{ label: p.cta, event: `${event}_process_cta_click`, href: page.hero.primary.href }}
    />
  );
}

export function EcommerceSeoPackages() {
  const p = page.packages;
  return (
    <Band label={p.eyebrow} id="packages" tone="warm">
      <div data-event={`${event}_pricing_view`}>
        <SectionIntro title={p.title} accent={p.titleAccent} body={p.body} bodyClassName="text-body" />
        <div className="mt-header"><ComparisonTable table={ecommerceSeoPackages} /></div>
        <p className="mt-6 text-bsm text-muted">{ecommerceSeoPackages.notes.find((note) => note.startsWith("*"))}</p>
        <Button href="/book-a-consultation" className="mt-6" data-event={`${event}_packages_cta_click`}>Discuss your package</Button>
      </div>
    </Band>
  );
}

export function EcommerceSeoWhyOmh() {
  const w = page.whyOmh;
  return <ServiceReasonGrid label={w.eyebrow} title={w.title} titleAccent={w.titleAccent} body={w.body} reasons={w.reasons} />;
}

export function EcommerceSeoResults() {
  if (!CASE_STUDIES_LIVE) return null;
  const r = page.results;
  const study = caseStudies.find((c) => c.slug === r.caseSlug)!;
  return (
    <Band label={r.eyebrow} tone="white">
      <Reveal>
        <SectionIntro title={r.title} accent={r.titleAccent} />
        <div className="mt-10 grid grid-cols-12 overflow-hidden rounded-card border border-line bg-surface max-lg:block">
          <CaseStudyVisual study={study} ratio="4/3" frameClassName="h-full rounded-none lg:aspect-auto!" className="col-span-5" />
          <div className="col-span-7 p-9 max-sm:p-6">
            <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-amber-deep">{r.label}</p>
            <h3 className="mt-4 font-sans text-h3 font-semibold text-balance">{r.heading}</h3>
            <p className="mt-4 text-body leading-relaxed text-ink/75">{r.body}</p>
            {CASE_STUDIES_LIVE && (
            <Link href={`/case-studies/${study.slug}`} data-event={`${event}_case_study_click`} className="group mt-5 inline-flex items-center gap-2 font-semibold text-amber-deep hover:underline underline-offset-4">
              {r.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            )}
            <dl className="mt-8 grid grid-cols-4 gap-4 border-t border-line pt-6 max-md:grid-cols-2">
              {study.results.map((result) => (
                <div key={result.label}>
                  <dd className="font-sans text-[clamp(28px,2vw,36px)] font-semibold leading-none">{result.value}</dd>
                  <dt className="mt-2 text-bsm leading-snug text-ink/70">{result.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-bsm text-muted">{r.note}</p>
          </div>
        </div>
      </Reveal>
    </Band>
  );
}

export function EcommerceSeoPromise() {
  const p = page.promise;
  return (
    <Band label={p.eyebrow} tone="mist">
      <Reveal>
        <Split ratio="6/6">
          <SectionIntro title={p.title} accent={p.titleAccent} body={p.body} bodyClassName="text-body" />
          <ul className="self-center rounded-card border border-line bg-surface p-card">
            {p.items.map((item) => (
              <li key={item} className="flex gap-3.5 border-b border-line py-3.5 font-sans text-body font-semibold leading-snug last:border-b-0">
                <Check className="mt-1 size-4 shrink-0 text-amber-deep" />
                {item}
              </li>
            ))}
          </ul>
        </Split>
      </Reveal>
    </Band>
  );
}

export function EcommerceSeoFAQ() {
  const f = page.faq;
  return (
    <ServiceFaqSection
      label={f.eyebrow}
      title={f.title}
      titleAccent={f.titleAccent}
      description={f.description}
      items={f.items}
      group="ecommerce-seo-faq"
      phoneEvent={`${event}_faq_phone_click`}
      headingSize="lg"
      headingMaxWidthClassName=""
    />
  );
}

export function EcommerceSeoFinalCTA() {
  const f = page.final;
  return (
    <ServiceNextStepsCTA
      title={f.title}
      titleAccent={f.titleAccent}
      body={f.body}
      primary={{ label: f.primary, href: "/book-a-consultation", event: `${event}_final_cta_click` }}
      secondary={{ label: f.secondary, event: `${event}_final_secondary_click` }}
      phoneEvent={`${event}_phone_click`}
      emailEvent={`${event}_email_click`}
      steps={f.steps}
    />
  );
}
