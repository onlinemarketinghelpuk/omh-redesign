// Responsive audit for the whole site, through headless Chrome's DevTools protocol (no dependencies;
// Node 22+ has a global WebSocket). Run against a production server: `npm run build && npx next start -p 3111`.
//
//   node scripts/responsive-audit.mjs audit [--base URL] [--pages /a,/b] [--widths 320,390] [--out DIR]
//                                          [--compare DIR/summary.json] [--strict]
//       Measures every page at device widths (no scrollbar) and writes DIR/report.json + DIR/summary.json.
//       --compare fails when any count got worse than the given summary (the ratchet used while migrating).
//       --strict fails when a final target in TARGETS is missed (the end state in docs/responsive-plan.md).
//   node scripts/responsive-audit.mjs rects [--base URL] [--pages ...] [--widths 1280,1366,1440,1920] --out DIR
//       Saves the position and size of every element in header/main/footer plus a hash of the page text.
//   node scripts/responsive-audit.mjs diff-rects BEFORE_DIR AFTER_DIR [--tol 0.5] [--anchors]
//       The desktop gate: lists elements that moved or resized more than --tol px, and pages whose text changed.
//       --anchors compares text and images by content instead of DOM path (use it when wrappers changed).
//
// Pages default to every code-built page in /sitemap.xml plus a few templates the sitemap does not list.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const [mode = "audit", ...rest] = process.argv.slice(2);
const flag = (name, dflt) => { const i = rest.indexOf(`--${name}`); return i < 0 ? dflt : rest[i + 1]; };
const has = (name) => rest.includes(`--${name}`);
const BASE = flag("base", "http://localhost:3111");
const AUDIT_WIDTHS = [320, 360, 390, 430, 540, 640, 768, 820, 912, 1024, 1152, 1280];
const RECT_WIDTHS = [1280, 1366, 1440, 1920];
const EXTRA = ["/ai-voice-agents/dentists/london", "/ai-voice-agents/estate-letting-agents/london", "/contact-us-thank-you", "/design-system", "/this-page-does-not-exist"];
const POSTS = ["/shopify-vs-wordpress-uk", "/website-caching-explained", "/how-to-set-up-ai-receptionist"];

// End state (docs/responsive-plan.md section 5). `max` per width group; omitted widths are not checked.
const TARGETS = {
  overflowPages: { all: 0 }, spill: { all: 0 }, squeezed: { from: 360, max: 0 }, stackedWide: { from: 768, to: 912, max: 0 },
  padValues: { all: 4 }, h2Sizes: { all: 2 }, h3Sizes: { all: 2 }, under14Pct: { all: 0 }, capsWrap: { all: 0 },
  h1MaxLines: { at: 390, max: 5 }, taps: { at: 390, max: 0 }, fixedOverlap: { at: 390, max: 0 },
};

// ------------------------------------------------------------------ Chrome
const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function openChrome() {
  if (!chrome) throw new Error("No Chrome or Edge found");
  const port = 9333 + Math.floor(Math.random() * 500);
  const proc = spawn(chrome, [`--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), "omh-audit-" + port)}`, "--headless=new", "--hide-scrollbars", "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} }
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
  const evaluate = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  await send("Page.enable");
  // Reveal animations are scroll-driven and carousels move: freeze both so every run measures the same layout.
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const setWidth = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const open = async (url, width) => {
    await setWidth(width, width < 1024 ? 844 : 900);
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await Promise.race([loaded, sleep(30000)]);
    await sleep(900);
    await evaluate(`(() => { const s = document.createElement("style"); s.textContent = "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}.rv{opacity:1!important;transform:none!important}"; document.head.append(s); document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); return true; })()`);
  };
  return { send, evaluate, open, setWidth, close: () => { ws.close(); proc.kill(); } };
}

async function pageList() {
  // Git Bash rewrites a leading "/page" argument into "C:/Program Files/Git/page"; undo that.
  const pages = rest.includes("--pages") ? flag("pages").split(",").map((p) => "/" + p.replace(/^[A-Za-z]:\/.*?\/Git\//, "").replace(/^\//, "")) : null;
  if (pages) return pages;
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const code = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].filter((m) => !/<lastmod>/.test(m[1])).map((m) => new URL(m[1].match(/<loc>([^<]+)/)[1]).pathname);
  return [...new Set([...code, ...POSTS, ...EXTRA])];
}
const slug = (p) => (p === "/" ? "home" : p.slice(1).replace(/\//g, "__"));

// ------------------------------------------------------------------ in-page measurement (runs in the browser)
function measure() {
  const w = innerWidth, d = document, win = window;
  const out = { w, docOverflow: Math.max(0, d.documentElement.scrollWidth - w), pageH: d.documentElement.scrollHeight, over: [], small: {}, squeezed: [], spill: [], stackedWide: [], heads: [], sizes: {}, sections: [], capsWrap: [], taps: [], fixed: [] };
  const sig = (el) => { const c = String(el.className?.baseVal ?? el.className ?? "").trim().split(/\s+/).slice(0, 5).join("."); return (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (c ? "." + c : "")).slice(0, 120); };
  const push = (arr, v, max = 20) => { if (arr.length < max) arr.push(v); };
  const isSrOnly = (cs, r) => r.width <= 2 || r.height <= 2 || cs.clipPath === "inset(50%)" || (cs.clip && cs.clip !== "auto");
  const tops = [...d.querySelectorAll("main section, footer")].filter((s) => !s.parentElement.closest("section"));
  const secLeft = new Map(tops.map((s) => [s, 1e9]));
  const absRoots = new WeakSet(), scrollers = new WeakSet(), clipX = new WeakSet();
  const tw = d.createTreeWalker(d.body, 1, { acceptNode: (el) => (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName) || win.getComputedStyle(el).display === "none" ? 2 : 1) });
  let el;
  while ((el = tw.nextNode())) {
    if (el.ownerSVGElement) continue;
    const cs = win.getComputedStyle(el); if (cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (cs.position === "absolute" || cs.position === "fixed") absRoots.add(el);
    if (/auto|scroll/.test(cs.overflowX)) scrollers.add(el);
    if (cs.overflowX !== "visible") clipX.add(el);
    if (!r.width || !r.height || isSrOnly(cs, r)) continue;
    let abs = false, scr = false, clip = false, sec = null;
    for (let p = el; p && p !== d.body; p = p.parentElement) { if (absRoots.has(p)) abs = true; if (p !== el && scrollers.has(p)) scr = true; if (p !== el && clipX.has(p)) clip = true; if (!sec && secLeft.has(p)) sec = p; }
    if (r.right > w + 1.5 && !clip && cs.position !== "fixed" && !abs) push(out.over, sig(el) + " r=" + Math.round(r.right), 6);
    if (cs.display === "grid" && r.width >= 600) { const tracks = cs.gridTemplateColumns.trim().split(/\s+/).length; const kids = [...el.children].filter((k) => k.getBoundingClientRect().height > 40).length; if (tracks === 1 && kids >= 3 && !el.closest("form, details, dl, [data-faq], [data-mock]")) push(out.stackedWide, sig(el) + " x" + kids); }
    let chars = 0; for (const n of el.childNodes) if (n.nodeType === 3) chars += n.textContent.trim().length;
    const tag = el.tagName;
    if (/^H[1-3]$/.test(tag)) { const fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 1.2; out.heads.push({ t: tag, fs: Math.round(fs * 10) / 10, lines: Math.round(r.height / lh), s: sig(el) }); }
    if (!chars) continue;
    const fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 1.2, key = Math.round(fs * 2) / 2;
    out.sizes[key] = (out.sizes[key] || 0) + chars;
    if (fs < 14 && chars >= 3 && !el.closest("[data-mock], [aria-hidden=true]")) { const s = sig(el); out.small[s] = (out.small[s] || 0) + chars; }
    if (!cs.display.startsWith("inline")) {
      const cw = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (chars >= 40 && cw > 0 && cw / (fs * 0.5) < 18) push(out.squeezed, sig(el) + " cw=" + Math.round(cw) + " fs=" + fs);
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX === "visible") push(out.spill, sig(el) + " " + el.clientWidth + "/" + el.scrollWidth);
      const lines = Math.round((r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / lh);
      if (cs.textTransform === "uppercase" && parseFloat(cs.letterSpacing) > 0.8 && lines >= 3 && chars < 70) push(out.capsWrap, sig(el) + " lines=" + lines);
    }
    if (sec && !abs && !scr && r.left < secLeft.get(sec)) secLeft.set(sec, r.left);
  }
  const pad = (s, side) => { let sum = 0, e = s; for (let i = 0; i < 2 && e; i++) { const cs = win.getComputedStyle(e); sum += parseFloat(side === "t" ? cs.paddingTop : cs.paddingBottom) || 0; if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) break; const kids = [...e.children].filter((k) => { const c = win.getComputedStyle(k); return c.display !== "none" && c.position !== "absolute" && c.position !== "fixed"; }); e = side === "t" ? kids[0] : kids[kids.length - 1]; if (e && /^(H[1-6]|P|UL|OL|IMG|A|BUTTON|FIGURE|TABLE|FORM|ARTICLE)$/.test(e.tagName)) break; } return Math.round(sum); };
  tops.forEach((s) => { const r = s.getBoundingClientRect(); if (r.height < 20) return; const l = secLeft.get(s); out.sections.push({ s: sig(s).slice(0, 70), pt: pad(s, "t"), pb: pad(s, "b"), gl: l < 1e9 ? Math.round(l) : null }); });
  // Tap targets under 44px. Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
  for (const t of d.querySelectorAll("a[href], button, summary, select, input:not([type=hidden]), textarea, [role=button]")) {
    const r = t.getBoundingClientRect(), cs = win.getComputedStyle(t);
    if (!r.width || !r.height || cs.visibility === "hidden" || isSrOnly(cs, r) || t.closest("[data-mock]")) continue;
    if (cs.display === "inline" && (t.parentElement?.textContent || "").trim().length > (t.textContent || "").trim().length + 12) continue;
    if (/^(radio|checkbox)$/.test(t.type) && t.closest("label")) continue;
    if (t.tabIndex < 0 || t.closest("[aria-hidden=true]") || r.right < 0 || r.left > w) continue; // spam traps, hidden controls
    const hit = win.getComputedStyle(t, "::after"); // the tap-target utility's invisible 44px layer
    const hw = hit.content !== "none" && hit.position === "absolute" ? parseFloat(hit.width) : 0, hh = hw ? parseFloat(hit.height) : 0;
    if (Math.max(r.height, hh) < 44 || Math.max(r.width, hw) < 44) push(out.taps, sig(t) + " " + Math.round(r.width) + "x" + Math.round(r.height), 40);
  }
  return out;
}

// Fixed and sticky layers that cover each other on a phone, measured half way down the page.
async function fixedLayers() {
  scrollTo(0, document.documentElement.scrollHeight / 2);
  await new Promise((r) => setTimeout(r, 400)); // scroll-triggered buttons and bars appear on the scroll event
  const all = []; const walk = (root) => { for (const e of root.querySelectorAll("*")) { const cs = getComputedStyle(e); if (cs.position === "fixed" && cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05) { const r = e.getBoundingClientRect(); if (r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < innerHeight) all.push({ s: (e.tagName.toLowerCase() + "." + String(e.className).split(" ").slice(0, 3).join(".")).slice(0, 60), r: [r.left, r.top, r.right, r.bottom].map(Math.round) }); } if (e.shadowRoot) walk(e.shadowRoot); } };
  walk(document);
  const hits = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i].r, b = all[j].r; const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); if (ox > 4 && oy > 4 && !all[i].s.startsWith("header") && !all[j].s.startsWith("header")) hits.push(`${all[i].s} x ${all[j].s}`); }
  scrollTo(0, 0);
  return { layers: all.map((l) => l.s), hits };
}

// ------------------------------------------------------------------ summarise
function summarise(report) {
  const W = [...new Set(Object.values(report).flatMap((p) => Object.keys(p).map(Number)))].sort((a, b) => a - b);
  const sum = {};
  for (const w of W) {
    const ms = Object.values(report).map((p) => p[w]).filter(Boolean);
    const h = (t) => new Set(ms.flatMap((m) => m.heads.filter((x) => x.t === t).map((x) => x.fs)));
    const pads = new Set(ms.flatMap((m) => m.sections.filter((s) => !/^footer/.test(s.s) && s.pt + s.pb > 0).flatMap((s) => [s.pt, s.pb])));
    let chars = 0, small = 0; ms.forEach((m) => { for (const v of Object.values(m.sizes)) chars += v; for (const v of Object.values(m.small)) small += v; });
    sum[w] = {
      overflowPages: ms.filter((m) => m.docOverflow > 0).length,
      spill: ms.reduce((n, m) => n + m.spill.length, 0),
      squeezed: ms.reduce((n, m) => n + m.squeezed.length, 0),
      stackedWide: ms.reduce((n, m) => n + m.stackedWide.length, 0),
      padValues: pads.size,
      fontSizes: new Set(ms.flatMap((m) => Object.keys(m.sizes))).size,
      h2Sizes: h("H2").size, h3Sizes: h("H3").size,
      h1MaxLines: Math.max(0, ...ms.flatMap((m) => m.heads.filter((x) => x.t === "H1").map((x) => x.lines))),
      under14Pct: chars ? +(100 * small / chars).toFixed(2) : 0,
      capsWrap: ms.reduce((n, m) => n + m.capsWrap.length, 0),
      taps: ms.reduce((n, m) => n + m.taps.length, 0),
      fixedOverlap: ms.reduce((n, m) => n + (m.fixedLayers?.hits.length || 0), 0),
      medianScreens: (() => { const s = ms.map((m) => m.pageH / (w < 1024 ? 844 : 900)).sort((a, b) => a - b); return s.length ? Math.round(s[Math.floor(s.length / 2)]) : 0; })(),
    };
  }
  return sum;
}

function checkTargets(sum) {
  const fails = [];
  for (const [metric, t] of Object.entries(TARGETS)) for (const [w, row] of Object.entries(sum)) {
    const wn = +w;
    const applies = t.all !== undefined || (t.at !== undefined ? wn === t.at : wn >= (t.from ?? 0) && wn <= (t.to ?? 1e9));
    const max = t.all ?? t.max;
    if (applies && row[metric] > max) fails.push(`${metric}@${w}: ${row[metric]} > ${max}`);
  }
  return fails;
}

function compare(sum, base) {
  const worse = [], better = [];
  for (const [w, row] of Object.entries(sum)) for (const [k, v] of Object.entries(row)) {
    const b = base[w]?.[k]; if (b === undefined || k === "medianScreens") continue;
    if (v > b + (k === "under14Pct" ? 0.05 : 0)) worse.push(`${k}@${w}: ${b} -> ${v}`); else if (v < b) better.push(`${k}@${w}: ${b} -> ${v}`);
  }
  return { worse, better };
}

// ------------------------------------------------------------------ rects (desktop gate)
function rects() {
  const out = {}, d = document;
  const key = (el) => { const parts = []; for (let e = el; e && e !== d.body; e = e.parentElement) { let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++; parts.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + ":" + i); } return parts.join(">"); };
  for (const root of d.querySelectorAll("body > header, header:not(main header), main, footer")) for (const el of [root, ...root.querySelectorAll("*")]) {
    if (el.ownerSVGElement) continue;
    // The body of a closed <details> is not shown, but Chrome sometimes still reports a box for it: skip it.
    if (el.closest("details:not([open])") && el.tagName !== "DETAILS" && !el.closest("summary")) continue;
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
    out[key(el)] = [r.left, r.top + scrollY, r.width, r.height].map((v) => Math.round(v * 2) / 2);
  }
  // Anchors: every element with its own text, and every image, keyed by what it shows rather than where it sits
  // in the DOM. A refactor that adds or removes wrapper elements keeps these keys, so they are the desktop gate
  // for migrations (diff-rects --anchors).
  const anchors = {}, seen = {};
  for (const el of d.querySelectorAll("body > header *, main *, footer *")) {
    if (el.ownerSVGElement || (el.closest("details:not([open])") && !el.closest("summary"))) continue;
    let own = ""; for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
    own = own.replace(/\s+/g, " ").trim();
    const what = el.tagName === "IMG" ? "img|" + (el.getAttribute("src") || "").split("?")[0].split("/").pop() : own ? own.slice(0, 60) : null;
    if (!what) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const k = `${what}#${(seen[what] = (seen[what] || 0) + 1)}`;
    anchors[k] = [r.left, r.top + scrollY, r.width, r.height].map((v) => Math.round(v * 2) / 2);
  }
  const text = (d.querySelector("main")?.innerText || "").replace(/\s+/g, " ").trim();
  return { rects: out, anchors, text };
}

// ------------------------------------------------------------------ main
if (mode === "audit") {
  const out = flag("out", join("..", "audit", "run-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")));
  const widths = flag("widths") ? flag("widths").split(",").map(Number) : AUDIT_WIDTHS;
  mkdirSync(out, { recursive: true });
  const pages = await pageList();
  const c = await openChrome();
  const report = {};
  for (const [i, p] of pages.entries()) {
    report[p] = {};
    try {
      await c.open(BASE + p, widths[widths.length - 1]);
      for (const w of [...widths].reverse()) {
        await c.setWidth(w, w < 1024 ? 844 : 900); await sleep(120);
        const m = await c.evaluate(`(${measure.toString()})()`);
        if (w === 390) m.fixedLayers = await c.evaluate(`(${fixedLayers.toString()})()`);
        report[p][w] = m;
      }
      process.stdout.write(`${i + 1}/${pages.length} ${p}\n`);
    } catch (e) { process.stdout.write(`${i + 1}/${pages.length} ${p} FAILED ${e.message}\n`); }
  }
  c.close();
  const sum = summarise(report);
  writeFileSync(join(out, "report.json"), JSON.stringify(report));
  writeFileSync(join(out, "summary.json"), JSON.stringify(sum, null, 1));
  console.table(sum);
  let fail = false;
  if (flag("compare")) {
    const { worse, better } = compare(sum, JSON.parse(readFileSync(flag("compare"), "utf8")));
    console.log(`better: ${better.length}`, better.slice(0, 30));
    console.log(`WORSE: ${worse.length}`, worse);
    fail ||= worse.length > 0;
  }
  if (has("strict")) { const f = checkTargets(sum); console.log(`target misses: ${f.length}`, f.slice(0, 60)); fail ||= f.length > 0; }
  console.log("written to", out);
  process.exit(fail ? 1 : 0);
}

if (mode === "rects") {
  const out = flag("out"); if (!out) throw new Error("rects needs --out DIR");
  const widths = flag("widths") ? flag("widths").split(",").map(Number) : RECT_WIDTHS;
  mkdirSync(out, { recursive: true });
  const pages = await pageList();
  const c = await openChrome();
  for (const [i, p] of pages.entries()) {
    try {
      for (const w of widths) {
        await c.open(BASE + p, w);
        const r = await c.evaluate(`(${rects.toString()})()`);
        writeFileSync(join(out, `${slug(p)}@${w}.json`), JSON.stringify({ page: p, w, textHash: createHash("sha1").update(r.text).digest("hex"), textLength: r.text.length, rects: r.rects, anchors: r.anchors }));
      }
      process.stdout.write(`${i + 1}/${pages.length} ${p}\n`);
    } catch (e) { process.stdout.write(`${i + 1}/${pages.length} ${p} FAILED ${e.message}\n`); }
  }
  c.close();
  console.log("written to", out);
}

if (mode === "diff-rects") {
  const [a, b] = rest.filter((x) => !x.startsWith("--") && x !== flag("tol"));
  const tol = +flag("tol", 0.5);
  let moved = 0, textChanged = 0, missing = 0;
  for (const f of readdirSync(a).filter((x) => x.endsWith(".json"))) {
    if (!existsSync(join(b, f))) { console.log(`no after file: ${f}`); missing++; continue; }
    const A = JSON.parse(readFileSync(join(a, f), "utf8")), B = JSON.parse(readFileSync(join(b, f), "utf8"));
    if (A.textHash !== B.textHash) { textChanged++; console.log(`TEXT CHANGED ${A.page}@${A.w} (${A.textLength} -> ${B.textLength} chars)`); }
    const diffs = [];
    // --anchors compares what is shown (text and images) wherever it sits in the DOM; the default compares every
    // element by DOM path, which is stricter but breaks as soon as a refactor adds or removes a wrapper.
    const field = has("anchors") ? "anchors" : "rects";
    if (!A[field] || !B[field]) { console.log(`no ${field} in ${f}`); missing++; continue; }
    const hiddenDetails = (k) => field === "rects" && /details(#[^:>]*)?:\d+>(?!summary)/.test(k); // closed accordion bodies (old dumps)
    for (const [k, ra] of Object.entries(A[field])) { if (hiddenDetails(k)) continue; const rb = B[field][k]; if (!rb) { diffs.push(`gone ${k}`); continue; } if (ra.some((v, i) => Math.abs(v - rb[i]) > tol)) diffs.push(`${k} [${ra}] -> [${rb}]`); }
    for (const k of Object.keys(B[field])) if (!A[field][k] && !hiddenDetails(k)) diffs.push(`new ${k}`);
    if (diffs.length) { moved++; console.log(`${A.page}@${A.w}: ${diffs.length} changed`); diffs.slice(0, 5).forEach((x) => console.log("   " + x.slice(-160))); }
  }
  console.log(`pages-widths with layout changes: ${moved}; text changes: ${textChanged}; missing: ${missing}`);
  process.exit(moved || textChanged || missing ? 1 : 0);
}
