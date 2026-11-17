import { Reveal } from "@/components/Reveal";
import { MediaFrame } from "@/components/ServiceMedia";
import { ServiceBand, type ServiceBandTone } from "@/components/services/ServiceBand";
import { withLinks } from "@/components/services/ServicePrimitives";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { BookDemo } from "@/components/BookDemo";
import { FinalCta } from "@/components/ui/FinalCta";
import { Eyebrow } from "@/components/ui/Proof";
import { Split } from "@/components/ui/Split";
import { faqPage } from "@/lib/content/faq-page";

function slug(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function FaqHero() {
  return (
    <section className="hero-grid border-b border-line bg-warm">
      <div className="container-omh section-md">
        <Reveal>
          <Eyebrow>{faqPage.eyebrow}</Eyebrow>
          <Split ratio="7/5" align="center" className="mt-8">
            <div>
              <h1 className="font-sans text-display font-semibold text-balance">
                Most Common <span className="text-amber-deep">Questions</span>
              </h1>
              {/* A contents list, not a stock paragraph — on a page this long the
                  useful thing at the top is a way to reach the right group. */}
              <nav aria-label="Question categories" className="mt-9">
                <p className="eyebrow mb-4 text-muted">Jump to</p>
                <ul className="flex flex-wrap gap-2">
                  {faqPage.groups.map((group) => (
                    <li key={group.heading}>
                      <a
                        href={`#${slug(group.heading)}`}
                        className="tap-target inline-block rounded-full border border-line bg-surface px-3.5 py-1.5 text-body text-ink/75 transition-colors hover:border-teal hover:text-ink"
                      >
                        {group.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <MediaFrame
                kind="image"
                theme="wordpress"
                ratio="4/3"
                title="The questions we get asked most"
                note="Add a short video answering the three most common questions." source="/images/home/agency-collaboration.webp" alt="Agency team discussing a project" />
          </Split>
        </Reveal>
      </div>
    </section>
  );
}

// Bands alternate tone so eight consecutive question groups don't read as one
// undifferentiated scroll, and a media band breaks the run in half.
const groupTones: ServiceBandTone[] = ["warm", "white", "mist", "warm"];

export function FaqGroups() {
  return (
    <>
      {faqPage.groups.map((group, index) => (
        <div key={group.heading}>
          {index === 4 && <FaqMediaBreak />}
          <ServiceBand
            label={group.heading}
            id={slug(group.heading)}
            tone={groupTones[index % groupTones.length]}
            accent={index % 2 ? "bg-teal" : "bg-amber"}
            labelStyle="none"
          >
            <Reveal>
              <Split ratio="4/8" sticky>
                <h2 className="font-sans text-h2 font-semibold text-balance">
                  {group.heading}
                </h2>
                <div>
                  <Accordion
                    group={slug(group.heading)}
                    items={group.items.map((item) => ({
                      q: item.q,
                      a: item.a.map((paragraph) => (
                        <p key={paragraph} className="mt-3 leading-relaxed first:mt-0">
                          {withLinks(paragraph)}
                        </p>
                      )),
                    }))}
                  />
                </div>
              </Split>
            </Reveal>
          </ServiceBand>
        </div>
      ))}
    </>
  );
}

function FaqMediaBreak() {
  return (
    <ServiceBand label="How we work" tone="dark" accent="bg-amber" labelStyle="pill">
      <Reveal>
        <Split ratio="5/7" align="center">
          <div>
            <h2 className="font-sans text-h2 font-semibold text-balance">
              Rather see it than read it?
            </h2>
            <p className="mt-6 text-body leading-relaxed text-oninverse/70">
              A walkthrough of a project from first consultation to launch, and the reporting that
              follows it.
            </p>
          </div>
          <MediaFrame
            kind="image"
            theme="maintenance"
            ratio="16/9"
            title="Project walkthrough"
            note="Replace with a consultation-to-launch screen recording."
            source="/images/Services/wordpress development.jpg" alt="Website development workspace" />
        </Split>
      </Reveal>
    </ServiceBand>
  );
}

export function FaqPricingLink() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="container-omh section-md">
        <Split ratio="7/5" align="center">
          <div>
            <h2 className="font-sans text-h2 font-semibold">
              Prefer to see the numbers before you ask?
            </h2>
            <p className="mt-5 text-body leading-relaxed text-ink/75">
              Every package and price we quote is published in full, service by service.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Button href="/pricing" data-event="faq_pricing_click">
              See the full price list
            </Button>
          </div>
        </Split>
      </div>
    </section>
  );
}

export function FaqFinalCta() {
  return (
    <>
      <FinalCta
        title="Still have a question we haven't answered?"
        titleAccent="we haven't answered?"
        body="Book a 30 minute consultation at a time convenient for you and we will talk it through."
        primary={{ label: "Book a Call", href: "/book-a-consultation", event: "faq_final_cta_click" }}
        contactEvents={{ phone: "faq_phone_click", email: "faq_email_click" }}
      />
      <BookDemo />
    </>
  );
}
