import { Fragment } from "react";
import { FeatureValue } from "@/components/services/ServicePrimitives";
import { Button } from "@/components/ui/Button";
import { ShowMore } from "@/components/ui/ShowMore";

/* Published packages: a comparison table on wide screens and one card per package below that, from one data set
   (the table + cards pair was copied into five service files, ~160 lines each). The table needs about 1100px, so
   it appears from 1280px (`xl`); below it the cards run two-up from 768px and one-up on phones, where each card's
   inclusion rows collapse behind "Show all" (docs/responsive-plan.md, Phase 5). */

export type ComparisonPackage = {
  name: string;
  stage: string;
  price: string;
  bestFor: string;
  features: Readonly<Record<string, boolean | string>>;
};
export type ComparisonGroup = { label: string; rows: ReadonlyArray<readonly [label: string, key: string]> };

export function PackageComparison({
  caption,
  packages,
  groups,
  notes,
  event,
  ctaHref = "/book-a-consultation",
  tableLabel = "Compare packages",
  cardCta = "Discuss this package",
}: {
  /** Screen-reader caption for the table. */
  caption: string;
  packages: ReadonlyArray<ComparisonPackage>;
  groups: ReadonlyArray<ComparisonGroup>;
  notes?: ReadonlyArray<string>;
  /** Analytics event for the package buttons, e.g. "ppc_package_select". */
  event: string;
  ctaHref?: string;
  tableLabel?: string;
  /** Button text on the cards (copy is verbatim per page). */
  cardCta?: string;
}) {
  return (
    <>
      <div className="mt-header hidden overflow-x-auto rounded-card border border-line bg-surface xl:block">
        <table className="w-full min-w-[1100px] border-collapse text-left text-bsm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className={`sticky left-0 z-10 bg-surface p-6 align-bottom ${packages.length > 3 ? "w-[240px]" : "w-[280px]"}`}>
                <span className="eyebrow text-muted">{tableLabel}</span>
              </th>
              {packages.map((pkg) => (
                <th key={pkg.name} scope="col" className="border-l border-line bg-soft/40 p-5 align-bottom">
                  <span className="block eyebrow text-muted">{pkg.stage}</span>
                  <span className="mt-2 block font-sans text-h4 font-semibold">{pkg.name}</span>
                  <span className="mt-4 block font-sans text-price font-semibold tracking-[-0.02em]">{pkg.price}</span>
                </th>
              ))}
            </tr>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface" />
              {packages.map((pkg) => (
                <td key={pkg.name} className="border-b-2 border-l border-b-ink border-line bg-soft/40 px-5 pb-5 align-top text-body font-normal leading-snug text-ink/70">
                  {pkg.bestFor}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.label}>
                <tr>
                  <th scope="colgroup" colSpan={packages.length + 1} className="border-b border-t border-line bg-warm/50 px-6 py-2.5 text-left eyebrow text-muted">
                    {group.label}
                  </th>
                </tr>
                {group.rows.map(([label, key]) => (
                  <tr key={label} className="border-b border-line transition-colors hover:bg-warm/60">
                    <th scope="row" className="sticky left-0 z-10 bg-surface p-6 py-4 font-semibold">{label}</th>
                    {packages.map((pkg) => (
                      <td key={pkg.name} className="border-l border-line p-5 py-4 text-ink/80"><FeatureValue value={pkg.features[key]} /></td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-surface p-6 font-semibold">Next step</th>
              {packages.map((pkg) => (
                <td key={pkg.name} className="border-l border-line p-5">
                  <Button href={ctaHref} data-event={event} data-package={pkg.name}>Discuss package</Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:hidden">
        {packages.map((pkg) => (
          <article key={pkg.name} className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="border-b border-line bg-soft/50 p-6">
              <p className="eyebrow text-muted">{pkg.stage}</p>
              <h3 className="mt-2 font-sans text-h3 font-semibold">{pkg.name}</h3>
              <p className="mt-3 font-sans text-price font-semibold tracking-[-0.02em]">{pkg.price}</p>
              <p className="mt-4 text-bsm leading-relaxed text-ink/70">{pkg.bestFor}</p>
            </div>
            <div className="p-6 text-bsm">
              {/* On phones each card shows its first group; the button opens the rest. */}
              <ShowMore as="div" limit={1} moreLabel="Show everything included" lessLabel="Show less">
                {groups.map((group) => (
                  <div key={group.label} className="border-b border-line py-4 first:pt-0 last:border-b-0">
                    <p className="mb-1 eyebrow text-muted/80">{group.label}</p>
                    <dl>
                      {group.rows.map(([label, key]) => (
                        <div key={label} className="flex items-baseline justify-between gap-6 py-2">
                          <dt className="text-muted">{label}</dt>
                          <dd className="text-right font-semibold text-ink"><FeatureValue value={pkg.features[key]} /></dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </ShowMore>
            </div>
            <div className="px-6 pb-6">
              <Button href={ctaHref} className="min-h-11 w-full justify-center" data-event={event} data-package={pkg.name}>{cardCta}</Button>
            </div>
          </article>
        ))}
      </div>

      {notes && notes.length > 0 && (
        <ul className="mt-8 grid gap-2 border-l-2 border-line pl-5 text-body leading-relaxed text-muted">
          {notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      )}
    </>
  );
}
