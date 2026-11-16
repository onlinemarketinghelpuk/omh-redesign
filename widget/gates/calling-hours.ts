/* =========================================================================
   When the outbound agent may ring, in London wall-clock time.

   Separate from message quiet hours (clock.ts) on purpose: a text at 8pm is
   fine, a call at 8pm is not. A call that falls due outside these hours is
   moved to the start of the next calling window, never dropped: they asked
   us to get back to them, and the morning is still getting back to them.
   ========================================================================= */

import { londonWall, londonAt } from "./clock";

export type CallingHours = { days: number[]; start: number; end: number };

function weekday(ms: number): number {
  const w = londonWall(ms);
  return new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay();
}

export function inCallingHours(ms: number, h: CallingHours): boolean {
  const w = londonWall(ms);
  return h.days.includes(weekday(ms)) && w.hour >= h.start && w.hour < h.end;
}

/** `ms` itself when it is inside the hours; otherwise the next window's start. */
export function nextCallingAt(ms: number, h: CallingHours): number {
  if (inCallingHours(ms, h)) return ms;
  if (!h.days.length) return 0;
  const w = londonWall(ms);
  /* Today, if the window has not opened yet; otherwise the next day the
     agent works. londonAt handles the clocks changing. */
  for (let d = 0; d <= 7; d++) {
    if (d === 0 && w.hour >= h.start) continue;
    const candidate = londonAt(ms, d, h.start, 0);
    if (h.days.includes(weekday(candidate))) return candidate;
  }
  return 0;
}
