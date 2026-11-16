// Ratchet on one-off styling in page code (docs/responsive-plan.md, Phase 0). Counts each pattern per file and
// compares with scripts/design-ratchet.json: a file may lose occurrences, never gain them. No dependencies.
//   node scripts/check-design.mjs            check; exit 1 if any file has more than recorded
//   node scripts/check-design.mjs --update   record the current counts (only after a check passes)
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const FILE = join(ROOT, "scripts", "design-ratchet.json");
const DIRS = ["app", "components", "lib/content"];
// Frozen backups ("do not edit") are skipped along with the dashboard, Studio and the home-2 preview copy.
const SKIP = /node_modules|\.next|lead-dashboard|[\\/]dashboard[\\/]|home-2|-old|oldv\d|studio|voice-industry[\\/](dental-clinics|estate-letting-agents|clinics-healthcare)\.ts$/;

// Each pattern is something the shared tokens and components replace. Add new ones at zero.
const PATTERNS = {
  "one-off font size text-[Npx]": /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
  "one-off clamp() font size": /\btext-\[clamp\(/g,
  "one-off clamp() spacing": /\b(?:p|m)[xytblr]?-\[clamp\(/g,
  "desktop-first stacked row max-lg:block": /\bmax-lg:block\b/g,
  "paragraph/heading width cap max-w-[Nch]": /\bmax-w-\[\d+ch\]/g,
  "hex colour class": /-\[#[0-9a-fA-F]{3,8}\]/g,
  "serif font": /\bfont-serif\b/g,
};

function* files(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (SKIP.test(p)) continue;
    if (e.isDirectory()) yield* files(p);
    else if (/\.(tsx?|mjs)$/.test(e.name)) yield p;
  }
}

const now = {};
for (const d of DIRS) for (const f of files(join(ROOT, d))) {
  const src = readFileSync(f, "utf8");
  const rel = relative(ROOT, f).replace(/\\/g, "/");
  for (const [name, re] of Object.entries(PATTERNS)) {
    const n = (src.match(re) || []).length;
    if (n) (now[name] ??= {})[rel] = n;
  }
}

const total = (m = {}) => Object.values(m).reduce((a, b) => a + b, 0);
const was = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
const worse = [];
for (const name of Object.keys(PATTERNS)) {
  for (const [f, n] of Object.entries(now[name] || {})) { const before = was[name]?.[f] ?? 0; if (n > before) worse.push(`${name}: ${f} ${before} -> ${n}`); }
  console.log(`${name.padEnd(42)} ${String(total(was[name])).padStart(5)} -> ${String(total(now[name])).padStart(5)}`);
}

if (process.argv.includes("--update")) {
  if (worse.length && existsSync(FILE)) { console.error("Refusing to record higher counts:\n  " + worse.join("\n  ")); process.exit(1); }
  writeFileSync(FILE, JSON.stringify(now, null, 1) + "\n");
  console.log("recorded", FILE);
} else if (worse.length) {
  console.error("\nNew one-off styling (use the global tokens or shared components instead):\n  " + worse.join("\n  "));
  process.exit(1);
}
