// Portfolio demos (client, 18 Nov 2026): HTML designs dropped into public/portfolio/<category>/ appear on
// /website-designs as cards that scroll on hover and open the live design in a popup.
// Run after adding, changing or removing a file:   node scripts/portfolio-shots.mjs
// For every <category>/<n>-<name>.html (ordered by the number) it saves a full-page screenshot next to it
// (<n>-<name>.jpg, 990px wide, desktop layout) and rewrites lib/content/portfolio-demos.json, which the page reads.
// Dev only: headless Chrome through the DevTools protocol, a tiny static server, no dependencies.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "public");
const DIR = join(ROOT, "portfolio");
const OUT = join(import.meta.dirname, "..", "lib", "content", "portfolio-demos.json");
const VIEW_W = 1440; // desktop layout
const SHOT_W = 990; // same width as the other gallery screenshots
const MAX_H = 7200; // source pixels: about eight screens, so the hover scroll stays readable

// Category folder -> gallery heading ("ecommerce" -> "Ecommerce Designs").
const titleOf = (slug) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") + " Designs";
const order = (f) => parseInt(f, 10) || 999;

const categories = readdirSync(DIR).filter((d) => statSync(join(DIR, d)).isDirectory()).sort();
if (!categories.length) { console.log("no folders in public/portfolio"); process.exit(0); }

// Static server for public/ (the demos load their scripts as modules, which need http, not file://).
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".json": "application/json" };
const server = createServer((req, res) => {
  const file = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
if (!chrome) throw new Error("No Chrome or Edge found");
const port = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [`--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), "omh-portfolio-" + port)}`, "--headless=new", "--hide-scrollbars", "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
}
if (!target) { proc.kill(); throw new Error("Chrome did not start"); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const waiters = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); if (msg.error) rej(new Error(msg.error.message)); else res(msg.result); }
  if (msg.method) waiters.splice(0).forEach((w) => (w.method === msg.method ? w.res(msg.params) : waiters.push(w)));
};
const send = (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((res) => waiters.push({ method, res }));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: VIEW_W, height: 900, deviceScaleFactor: 1, mobile: false });

const manifest = [];
for (const slug of categories) {
  const files = readdirSync(join(DIR, slug)).filter((f) => f.endsWith(".html")).sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  const items = [];
  for (const file of files) {
    const path = `/portfolio/${slug}/${file}`;
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url: base + path });
    await loaded;
    await sleep(2500);
    // Walk the page so scroll reveals and lazy images fire, then back to the top and let it settle.
    // Height re-read each step: pages grow as images load, and a walk that stops short leaves the lower reveals hidden.
    // Two frames per step: scroll reveals are checked when a frame is drawn, and a slow WebGL/canvas page could
    // scroll a section past between frames, so it never revealed.
    await evaluate(`(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 1500)); })()`);
    // Remote photos still downloading came out as blank boxes; wait for every image (15s cap).
    await evaluate(`(async () => { document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager")); await Promise.race([Promise.all([...document.images].map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 15000))]); })()`);
    // Pinned scroll scenes (a full-screen sticky stage inside a track several screens tall, Ironstone's hero) came
    // out as screens of blank space under the stage: shrink each track to its stage. Sticky headers and sidebars are
    // shorter than the screen, so they are left alone.
    const pinned = await evaluate(`[...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).position === "sticky" && el.offsetHeight >= innerHeight * 0.9 && el.parentElement.offsetHeight > el.offsetHeight * 1.5).map((el) => (el.parentElement.style.height = el.offsetHeight + "px")).length`);
    // Scroll-driven count-ups read 0 at the top of the page; show their final figures in the screenshot.
    // Text-only elements: Flock (marketing 1) puts data-count on whole story cards, which this used to wipe.
    await evaluate(`document.querySelectorAll("[data-count]").forEach((el) => { if (!el.children.length) el.textContent = el.dataset.count; })`);
    // Finish CSS fades in progress (a review slider caught mid-crossfade showed two quotes on top of each other).
    // Not reduced motion: one demo's 3D hero loses its heading in that mode.
    await evaluate(`document.getAnimations().forEach((a) => { try { a.finish(); } catch {} })`);
    const title = await evaluate("document.title");
    const { cssContentSize } = await send("Page.getLayoutMetrics");
    const height = Math.min(Math.ceil(cssContentSize.height), MAX_H);
    const scale = SHOT_W / VIEW_W;
    const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 78, captureBeyondViewport: true, clip: { x: 0, y: 0, width: VIEW_W, height, scale } });
    const shot = path.replace(/\.html$/, ".jpg");
    writeFileSync(join(ROOT, shot), Buffer.from(data, "base64"));
    const [name, ...rest] = title.split(" | ");
    items.push({ demo: path, shot, width: SHOT_W, height: Math.round(height * scale), alt: `${name.trim()} ${slug.replace(/-/g, " ")} website design${rest.length ? `: ${rest.join(" | ").trim()}` : ""}` });
    console.log(`${shot}  ${SHOT_W}x${Math.round(height * scale)}  ${name.trim()}${pinned ? `  (${pinned} pinned scene shrunk)` : ""}`);
  }
  if (items.length) manifest.push({ slug, title: titleOf(slug), items });
}
ws.close(); proc.kill(); server.close();
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${OUT}`);
// The pre-sized WebP copies the gallery serves.
await import("./gallery-images.mjs");
