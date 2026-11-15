import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { ServiceBand, type ServiceBandTone } from "@/components/services/ServiceBand";
import {
  CheckIcon,
  MinusIcon,
  ServiceSectionIntro,
} from "@/components/services/ServicePrimitives";

export function ServiceFitSection({
  label = "Fit",
  title,
  titleAccent,
  body,
  intro,
  good,
  notFit,
  goodTitle = "A good fit",
  notFitTitle = "Probably not yet",
  footer,
  tone = "white",
  bandAccent = "bg-amber",
}: {
  label?: string;
  title?: string;
  titleAccent?: string;
  body?: ReactNode;
  intro?: ReactNode;
  good: readonly string[];
  notFit: readonly string[];
  goodTitle?: string;
  notFitTitle?: string;
  footer?: ReactNode;
  tone?: ServiceBandTone;
  bandAccent?: string;
}) {
  return (
    <ServiceBand label={label} tone={tone} accent={bandAccent}>
      <Reveal>
        {intro ??
          (title ? (
            <ServiceSectionIntro title={title} accent={titleAccent} body={body} />
          ) : null)}

        {/* One card split into two equal halves, like the solution pages' fit block (client, 15 Nov 2026): the
            good-fit list used to sit in a padded card beside an unpadded one, so the headings and rows never lined up. */}
        <div className="mt-12 grid grid-cols-2 overflow-hidden rounded-card border border-line bg-surface max-md:grid-cols-1">
          <div className="bg-soft/70 p-9 max-sm:p-6">
            <h3 className="flex items-center gap-2.5 font-sans text-h3 font-semibold">
              <CheckIcon className="size-5 text-amber-deep" />
              {goodTitle}
            </h3>
            <ul className="mt-6">
              {good.map((item) => (
                <li key={item} className="flex gap-3.5 border-b border-line py-3.5 text-body leading-snug text-ink/85 last:border-b-0">
                  <CheckIcon className="mt-1 size-4 shrink-0 text-amber-deep" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-l border-line p-9 max-md:border-l-0 max-md:border-t max-sm:p-6">
            <h3 className="flex items-center gap-2.5 font-sans text-h3 font-semibold text-muted">
              <MinusIcon className="size-5" />
              {notFitTitle}
            </h3>
            <ul className="mt-6">
              {notFit.map((item) => (
                <li key={item} className="flex gap-3.5 border-b border-line py-3.5 text-body leading-snug text-muted last:border-b-0">
                  <MinusIcon className="mt-1 size-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {footer}
      </Reveal>
    </ServiceBand>
  );
}
