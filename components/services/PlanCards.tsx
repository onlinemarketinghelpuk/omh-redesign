import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CardGrid } from "@/components/ui/CardGrid";
import { CheckIcon } from "@/components/services/ServicePrimitives";
import { ShowMore } from "@/components/ui/ShowMore";

/* Published plans as cards (the social family's packages): the middle plan is highlighted, three-up from 1024px,
   two-up on tablets with the third card spanning both, one-up on phones where each feature list shows its first
   five rows behind "Show everything included" (docs/responsive-plan.md, Phase 5). */

export type Plan = { name: string; bestFor: string; features: readonly string[] };

export function PlanCards<P extends Plan>({
  plans,
  kicker,
  price,
  cta,
  event,
  className = "",
}: {
  plans: readonly P[];
  /** Small-caps line after the plan number, e.g. "Paid social" -> "01 · Paid social". */
  kicker: string;
  /** The price block under the description. */
  price: (plan: P) => ReactNode;
  /** Button text, kept per page (copy is verbatim). */
  cta: (plan: P) => string;
  /** Analytics event for the buttons. */
  event: string;
  className?: string;
}) {
  return (
    <CardGrid cols={3} className={className}>
      {plans.map((plan, index) => (
        <article
          key={plan.name}
          className={`rounded-card border p-card ${index === 1 ? "border-amber bg-tint-rose" : "border-line bg-surface"}`}
        >
          <p className="eyebrow text-amber-deep">
            {String(index + 1).padStart(2, "0")} · {kicker}
          </p>
          <h3 className="mt-4 font-sans text-h3 font-semibold">{plan.name}</h3>
          <p className="mt-2 text-body leading-relaxed text-muted">{plan.bestFor}</p>
          {price(plan)}
          <ShowMore as="ul" limit={5} className="mt-5 grid gap-2.5" moreLabel="Show everything included" lessLabel="Show less">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-body leading-relaxed text-ink/75">
                <CheckIcon className="mt-1 size-4 shrink-0 text-amber-deep" />
                <span className="min-w-0">{feature}</span>
              </li>
            ))}
          </ShowMore>
          <div className="mt-7">
            <Button href="/contact" small data-event={event} data-package={plan.name}>
              {cta(plan)}
            </Button>
          </div>
        </article>
      ))}
    </CardGrid>
  );
}
