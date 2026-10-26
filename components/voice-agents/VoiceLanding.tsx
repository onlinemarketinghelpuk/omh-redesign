import type { ReactNode } from "react";
import { BookDemo } from "@/components/BookDemo";
import { LandingV4Script } from "@/components/voice-agents/LandingV4Script";
import { VoiceAgentsScript } from "@/components/voice-agents/VoiceAgentsScript";
import { VoiceMotion } from "@/components/voice-agents/VoiceMotion";
import { JsonLd } from "@/lib/schema";

/*
  The /ai-voice-agents layout, shared by the main page and the industry pages built on it (real estate first).
  Each page brings its own markup (three sources: rebuilt sections, the previous page's sections, the v4 hero /
  how-it-works / local cover) and a running order; the scripts, motion and the booking band are the same.
*/

// Splits a markup string at each top-level <section>, keyed by its id (or aria-labelledby). Whatever follows a
// section's closing tag (the sticky bar) travels with that section. `head` is what comes before the first
// section (an icon sprite).
export function sectionsOf(html: string, className: string) {
  const [head, ...parts] = html.split(/(?=<section[\s>])/);
  const byKey = new Map(parts.map((p) => [p.match(/^<section[^>]*?\s(?:id|aria-labelledby)="([^"]+)"/)![1], p]));
  return { head, byKey, className };
}
export type Source = ReturnType<typeof sectionsOf>;
export type Runs = [Source, string[]][];

export function VoiceLanding({ runs, graph, page, demoHeading, thingsToTry, children }: { runs: Runs; graph?: object; page: string; demoHeading: ReactNode; thingsToTry?: readonly string[]; children?: ReactNode }) {
  const placed = runs.flatMap(([, keys]) => keys);
  for (const src of new Set(runs.map(([s]) => s)))
    for (const key of src.byKey.keys()) if (!placed.includes(key)) throw new Error(`${page}: section "${key}" has no place in runs`);
  const runHtml = runs.map(([src, keys], i) => {
    const html = keys.map((k) => {
      const part = src.byKey.get(k);
      if (!part) throw new Error(`${page}: no section "${k}"`);
      return part;
    });
    // The icon sprite goes in the first wrapper of its source.
    return (runs.findIndex(([s]) => s === src) === i ? src.head : "") + html.join("");
  });
  return (
    <>
      {graph && <JsonLd data={graph} />}
      {/* One root for both page scripts; they find their widgets by data-* hooks inside it. */}
      <div id="va-page">
        {runs.map(([src], i) => (
          <div key={i} className={src.className} dangerouslySetInnerHTML={{ __html: runHtml[i] }} />
        ))}
      </div>
      <LandingV4Script />
      {/* The booking band every "Book a 30-Minute Demo" button on the page points at. */}
      <BookDemo id="book-demo-form" heading={demoHeading} thingsToTry={thingsToTry} />
      <VoiceAgentsScript />
      <VoiceMotion />
      {/* Page-specific widgets, e.g. EstateScript. */}
      {children}
    </>
  );
}
