"use client";

import { useEffect } from "react";

// The two real estate widgets with no counterpart on /ai-voice-agents (lib/content/voice-estate/extras.ts):
// the day chart's "today / with an AI agent" switch and the "what we'll ask you for" tick count.
export function EstateScript() {
  useEffect(() => {
    const off: (() => void)[] = [];
    const on = (el: EventTarget, type: string, fn: EventListener) => {
      el.addEventListener(type, fn);
      off.push(() => el.removeEventListener(type, fn));
    };

    const chart = document.querySelector<HTMLElement>("[data-day-chart]");
    const sum = document.querySelector<HTMLElement>("[data-day-sum]");
    const key = document.querySelector<HTMLElement>("[data-day-key]");
    const radios = Array.from(document.querySelectorAll<HTMLElement>("[data-day-mode]"));
    const text = {
      today: ["221 calls, 89 missed (40%). Hover or tap a bar for the hour.", "Missed"],
      ai: ["221 calls, 0 missed. Your AI agent picks up the 89 your team couldn't get to.", "Answered by your AI agent"],
    };
    const setMode = (i: number, focus = false) => {
      const mode = radios[i].dataset.dayMode as keyof typeof text;
      radios.forEach((r, n) => {
        r.setAttribute("aria-checked", String(n === i));
        r.tabIndex = n === i ? 0 : -1;
      });
      if (focus) radios[i].focus();
      if (chart) chart.dataset.mode = mode;
      if (sum) sum.textContent = text[mode][0];
      if (key) key.textContent = text[mode][1];
    };
    radios.forEach((r, i) => {
      on(r, "click", () => setMode(i));
      on(r, "keydown", (e) => {
        const k = (e as KeyboardEvent).key;
        const step = k === "ArrowRight" || k === "ArrowDown" ? 1 : k === "ArrowLeft" || k === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        setMode((i + step + radios.length) % radios.length, true);
      });
    });

    const items = Array.from(document.querySelectorAll<HTMLInputElement>("[data-ready-item]"));
    const count = document.querySelector<HTMLElement>("[data-ready-count]");
    const update = () => {
      const n = items.filter((i) => i.checked).length;
      if (count) count.textContent = n === items.length ? "All set. Let's build it." : `${n} of ${items.length} ready`;
    };
    items.forEach((i) => on(i, "change", update));

    return () => off.forEach((f) => f());
  }, []);
  return null;
}
