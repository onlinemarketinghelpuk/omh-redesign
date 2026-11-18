// Pre-sized WebP copies of the /website-designs gallery screenshots (client, 18 Nov 2026: the first visit after a
// deploy waited for the server to convert every tall screenshot, about 3s each for AVIF). For each .jpg in the theme
// folder and in public/portfolio/<category>/ this writes <name>-480.webp and <name>-960.webp beside it, which
// components/GalleryImage.tsx serves directly. Skips files that are already up to date.
//   node scripts/gallery-images.mjs        (scripts/portfolio-shots.mjs runs it too)
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC = join(import.meta.dirname, "..", "public");
const dirs = [join(PUBLIC, "images", "website-designs", "pages")];
const portfolio = join(PUBLIC, "portfolio");
if (existsSync(portfolio)) for (const d of readdirSync(portfolio)) if (statSync(join(portfolio, d)).isDirectory()) dirs.push(join(portfolio, d));

let made = 0;
for (const dir of dirs) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".jpg"))) {
    const src = join(dir, file);
    for (const width of [480, 960]) {
      const out = src.replace(/\.jpg$/, `-${width}.webp`);
      if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
      await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
      made++;
    }
  }
}
console.log(`gallery images: ${made} written`);
