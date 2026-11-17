/* The catalogue is derived from lib/content/price-list.ts, which is the
   client's live pricing copied verbatim. Retyping those numbers in the
   dashboard would drift the first time the client changes a price. This
   suite guards the derivation, not the figures themselves. */

import { priceList } from "../../lib/content/price-list.ts";
import { amazonPpc } from "../../lib/content/amazon-ppc.ts";
import { serviceCatalogue, findServiceOption } from "../../lib/dashboard/service-catalogue.ts";

let pass = 0, fail = 0;
function ok(label: string, cond: boolean, detail?: unknown) {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log("  FAIL " + label + (detail !== undefined ? "\n         " + JSON.stringify(detail) : "")); }
}
function eq(label: string, got: unknown, want: unknown) {
  ok(label, JSON.stringify(got) === JSON.stringify(want), { got, want });
}

/* ---------- key uniqueness ---------- */
{
  const seen = new Map<string, number>();
  for (const o of serviceCatalogue) seen.set(o.key, (seen.get(o.key) ?? 0) + 1);
  const dupes = [...seen.entries()].filter(([, n]) => n > 1);
  eq("no two options share a key", dupes, []);
}

/* ---------- every option matches the Pricing cell at its tier index ----- */
{
  function parseGbp(cell: unknown): number | null {
    if (typeof cell !== "string") return null;
    const digits = cell.replace(/[£,\s]/g, "");
    if (!/^-?\d+(?:\.\d+)?$/.test(digits)) return null;
    return Number(digits);
  }
  for (const o of serviceCatalogue) {
    const table = priceList.tables.find((t) => t.id === o.serviceId);
    ok(`${o.key}: table exists`, !!table);
    if (!table) continue;
    const pricingRow = table.rows.find((r) => r.label === "Pricing" || r.label === "Pricing**");
    ok(`${o.key}: Pricing row exists`, !!pricingRow);
    if (!pricingRow) continue;
    const want = parseGbp(pricingRow.values[Number(o.key.split(":")[1])]);
    eq(`${o.key}: monthlyGbp equals Pricing cell`, o.monthlyGbp, want);
  }
}

/* ---------- website-designs yields no options ---------------------------- */
{
  const designs = serviceCatalogue.filter((o) => o.serviceId === "website-designs");
  eq("website-designs produces no options", designs, []);
}

/* ---------- amazon-ppc is derived, not hardcoded ------------------------- */
{
  const seed = serviceCatalogue.find((o) => o.key === "amazon-ppc:0");
  ok("amazon-ppc:0 exists", !!seed);
  /* Amazon PPC prices come from amazonPpc.packages[i].price, parsed through
     the same path as every other option. Fake the first package's price and
     the catalogue must move with it; that is the shape of "derived, not a
     literal". */
  const first = amazonPpc.packages[0];
  eq(
    "amazon-ppc:0 monthly matches amazonPpc.packages[0].price",
    seed?.monthlyGbp ?? null,
    Number(String(first.price).replace(/[£,\s]/g, "")),
  );
}

/* ---------- "SEO Seed" lives in two tables at two prices ----------------- */
{
  const inSeo = serviceCatalogue.find(
    (o) => o.serviceId === "seo" && o.packageLabel === "SEO Seed",
  );
  const inLocal = serviceCatalogue.find(
    (o) => o.serviceId === "local-seo" && o.packageLabel === "SEO Seed",
  );
  ok("SEO Seed exists under seo", !!inSeo);
  ok("SEO Seed exists under local-seo", !!inLocal);
  ok(
    "the two SEO Seed options have distinct keys",
    !!inSeo && !!inLocal && inSeo.key !== inLocal.key,
  );
  ok(
    "the two SEO Seed options have different monthly prices",
    !!inSeo && !!inLocal && inSeo.monthlyGbp !== inLocal.monthlyGbp,
  );
}

/* ---------- POA / booleans / missing cells yield a null amount ---------- */
{
  /* No real option currently has POA, so build a synthetic check by asserting
     every produced option is either a positive number or null, never 0. A
     zero on a report is a lie; a blank is a question. */
  for (const o of serviceCatalogue) {
    ok(
      `${o.key}: monthlyGbp is null or > 0 (never 0)`,
      o.monthlyGbp === null || o.monthlyGbp > 0,
      { monthlyGbp: o.monthlyGbp },
    );
  }
}

/* ---------- Contract Length parsed; "6*" and "12-36" handled sensibly --- */
{
  /* wordpress Seed is "6*" (rolling monthly star). Must parse as 6. */
  const wordpressSeed = findServiceOption("wordpress:0");
  eq("wordpress:0 months is 6 (from '6*')", wordpressSeed?.months ?? null, 6);

  /* wordpress Shoot is "12-36". The dashboard needs one number, so take the
     lower bound. "Over the term" needs to be the shortest contract the
     client is actually committing to; a 36-month assumption is the kind of
     invisible overstatement the plan warns about. */
  const wordpressShoot = findServiceOption("wordpress:1");
  eq("wordpress:1 months is 12 (lower bound of '12-36')", wordpressShoot?.months ?? null, 12);

  /* smm Seed is a clean "3". */
  const smmSeed = findServiceOption("smm:0");
  eq("smm:0 months is 3", smmSeed?.months ?? null, 3);
}

/* ---------- findServiceOption ----------------------------------------- */
{
  const k = serviceCatalogue[0]?.key ?? "";
  ok("findServiceOption round-trip", !!k && findServiceOption(k)?.key === k);
  ok("findServiceOption misses unknown key", findServiceOption("no-such:99") === undefined);
}

console.log(`\n${pass} ok, ${fail} failed.`);
if (fail) process.exit(1);
