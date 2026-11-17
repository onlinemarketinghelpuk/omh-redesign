import { priceList, type PriceCell } from "@/lib/content/price-list";

/* =========================================================================
   The service and package catalogue the dashboard offers on a win.

   Derived from `lib/content/price-list.ts`, which is the client's live
   pricing copied verbatim from `/all-services-price-list/` with a comment
   at the top saying the figures must not be edited. A second copy of those
   numbers in the dashboard would drift the first time the client changes a
   price, and then the dashboard would be prefilling a figure the website
   does not charge.

   So this file picks the figures OUT of that file. It never retypes a
   number. The suite in `widget/tests/service-catalogue.test.ts` asserts the
   amount on every option equals the Pricing cell it came from.

   Plain TypeScript, no React, no server-only: the server action, the React
   dropdown and the test runner share the same catalogue.
   ========================================================================= */

export type ServiceOption = {
  /* `${sectionId}:${tierIndex}`, never the tier name. "SEO Seed" is a tier of
     both the `seo` and the `local-seo` tables at different prices, and a
     tier-name key would collide them silently and inflate revenue reports. */
  key: string;
  serviceId: string;
  serviceTitle: string;
  packageLabel: string;
  /* `null` rather than `0` when the figure cannot be parsed. A zero on a
     report is a lie and a blank is a question: this file never answers a
     missing price with the wrong number. */
  monthlyGbp: number | null;
  /* Contract length in months. The lower bound is used where the client
     published a range ("12-36"), and a trailing star ("6*") is stripped. */
  months: number | null;
};

function parseGbp(cell: PriceCell | undefined): number | null {
  if (typeof cell !== "string") return null;
  const digits = cell.replace(/[£,\s]/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(digits)) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseMonths(cell: PriceCell | undefined): number | null {
  if (typeof cell !== "string") return null;
  /* "6*" → 6, "12-36" → 12, "3" → 3, "TBC" → null. */
  const m = cell.match(/^\s*(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildCatalogue(): ServiceOption[] {
  const options: ServiceOption[] = [];
  for (const table of priceList.tables) {
    if (!table.tiers.length || !table.rows.length) continue;
    const pricing = table.rows.find(
      (r) => r.label === "Pricing" || r.label === "Pricing**",
    );
    if (!pricing) continue;
    const contract = table.rows.find((r) => r.label === "Contract Length (Months)");
    for (let i = 0; i < table.tiers.length; i++) {
      options.push({
        key: `${table.id}:${i}`,
        serviceId: table.id,
        serviceTitle: table.title,
        packageLabel: table.tiers[i],
        monthlyGbp: parseGbp(pricing.values[i]),
        months: contract ? parseMonths(contract.values[i]) : null,
      });
    }
  }
  return options;
}

export const serviceCatalogue: ServiceOption[] = buildCatalogue();

const byKey = new Map(serviceCatalogue.map((o) => [o.key, o]));
export function findServiceOption(key: string): ServiceOption | undefined {
  return byKey.get(key);
}

/* The total over the contract term, where both parts are known. Rounds to
   the nearest pound: the catalogue does not carry pence, and pence in a
   headline revenue figure are fiction. */
export function termTotalGbp(opt: ServiceOption): number | null {
  if (opt.monthlyGbp === null || opt.months === null) return null;
  return Math.round(opt.monthlyGbp * opt.months);
}
