// Industry sections with no counterpart on /ai-voice-agents, shared by the industry pages built on that layout
// (real estate, dental): a day of calls (chart), when the agent answers (tabs) and what we need from the
// business (checklist). Each page passes its own content. Widgets: components/voice-agents/LandingExtrasScript.tsx
// (chart switch, checklist count); the tabs use the shared [data-tabs] in VoiceAgentsScript. Styles:
// app/ai-voice-agents/voice-agents.css ("Real estate extras", now shared).

const icon = (name: string, cls = "") => `<svg class="icon${cls && " " + cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
const eyebrow = (t: string) => `<p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>${t}</p>`;

/** hour label, calls, answered by the team, closed? */
export type Hour = [string, number, number, boolean?];
export type ExtrasCopy = {
  day: {
    eyebrow: string; h2: string; intro: string; hours: Hour[]; axis: number; aria: string;
    unit: string; // "branch", "practice": used in "Work out what it costs your …"
    moments: [string, string, string][];
  };
  team: { h2: string; intro: string; modes: { id: string; label: string; steps: string[]; team: string; agent: string }[]; keeps: string[] };
  ready: { h2: string; intro: string; asks: string[] };
};

export function extrasMarkup({ day, team, ready }: ExtrasCopy) {
  const total = day.hours.reduce((n, [, c]) => n + c, 0);
  const missed = day.hours.reduce((n, [, c, t]) => n + c - t, 0);
  const sumToday = `${total} calls, ${missed} missed (${Math.round((missed / total) * 100)}%). Hover or tap a bar for the hour.`;
  const sumAi = `${total} calls, 0 missed. Your AI agent picks up the ${missed} your team couldn't get to.`;
  const pct = (n: number) => `${((n / day.axis) * 100).toFixed(1)}%`;
  const col = ([h, calls, answered, closed]: Hour) => `          <li class="day-col${closed ? " is-closed" : ""}" data-tip="${h}:00${closed ? " (closed)" : ""} · ${calls} calls · ${calls - answered} missed">
            <span class="day-stack"><i class="day-m" style="height:${pct(calls - answered)}"></i><i class="day-t" style="height:${pct(answered)}"></i></span>
            <span class="day-h">${h}</span>
          </li>`;
  const moment = ([time, title, text]: [string, string, string]) => `        <li class="hover-card rounded-[16px] border border-line bg-paper p-5">
          <p class="flex items-baseline gap-3"><span class="font-display text-[22px] font-semibold text-hl tnum">${time}</span><span class="font-display text-[18px] font-semibold">${title}</span></p>
          <p class="mt-2 text-[16px] text-muted">${text}</p>
        </li>`;
  const radio = (mode: string, label: string, on: boolean) =>
    `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15.5px] font-semibold aria-checked:border-ink aria-checked:bg-ink aria-checked:text-paper" data-day-mode="${mode}" data-track="industry_day_mode" data-track-name="${label}">${label}</button>`;

  const daySection = `
<section id="day" data-component="Day" class="border-y border-line bg-surface">
  <div class="container-omh py-14 lg:py-20">
    ${eyebrow(day.eyebrow)}
    <h2>${day.h2}</h2>
    <p class="mt-5 text-muted">${day.intro}</p>
    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start" data-day>
      <div class="hover-card rounded-[18px] border border-line bg-paper p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="font-display text-[18px] font-semibold">Calls by hour, one weekday</p>
          <div role="radiogroup" aria-label="Show the day" class="flex flex-wrap gap-2">${radio("today", "As it is today", true)}${radio("ai", "With an AI agent", false)}</div>
        </div>
        <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-muted" aria-hidden="true">
          <li class="flex items-center gap-2"><i class="day-key day-key-t"></i>Answered by your team</li>
          <li class="flex items-center gap-2"><i class="day-key day-key-m"></i><span data-day-key>Missed</span></li>
        </ul>
        <div class="day-chart mt-5" data-day-chart data-mode="today" data-sum-today="${sumToday}" data-sum-ai="${sumAi}" role="img" aria-label="${day.aria}">
          <ol class="day-cols" style="grid-template-columns:repeat(${day.hours.length},minmax(0,1fr))">
${day.hours.map(col).join("\n")}
          </ol>
        </div>
        <p class="mt-4 text-[16px] font-semibold" aria-live="polite" data-day-sum>${sumToday}</p>
        <p class="mt-1 text-[15px] text-muted">Illustrative figures, not data from a real business. Your phone provider's call log shows your own pattern.</p>
      </div>
      <ol class="grid gap-3">
${day.moments.map(moment).join("\n")}
        <li><a href="#roi-calculator" class="text-link" data-track="industry_day_cost">Work out what it costs your ${day.unit}${icon("arrow-right")}</a></li>
      </ol>
    </div>
  </div>
</section>
`;

  const tab = (m: ExtrasCopy["team"]["modes"][number], i: number) =>
    `          <button type="button" role="tab" id="when-tab-${m.id}" aria-controls="when-${m.id}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" class="inline-flex min-h-[48px] items-center rounded-full border border-[var(--va-line-strong)] px-4 text-[16px] font-semibold aria-selected:border-ink aria-selected:bg-ink aria-selected:text-paper" data-tab data-track="industry_when_answers" data-track-name="${m.label}">${m.label}</button>`;
  const panel = (m: ExtrasCopy["team"]["modes"][number], i: number) => `
        <div role="tabpanel" id="when-${m.id}" aria-labelledby="when-tab-${m.id}"${i ? " hidden" : ""} class="mt-5 rounded-[18px] border border-line bg-surface p-5 sm:p-6" data-tab-panel>
          <ol class="when-flow" aria-label="How a call goes">
${m.steps.map((s, k) => `            <li class="when-step${k === m.steps.length - 1 ? " is-agent" : ""}">${s}</li>`).join("\n")}
          </ol>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-[14px] bg-paper p-4"><p class="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted">${icon("users", "text-hl")}Your team</p><p class="mt-2 text-[16px]">${m.team}</p></div>
            <div class="rounded-[14px] bg-paper p-4"><p class="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted">${icon("phone", "text-hl")}Your AI agent</p><p class="mt-2 text-[16px]">${m.agent}</p></div>
          </div>
        </div>`;
  const teamSection = `
<section id="your-team" data-component="YourTeam" class="border-y border-line bg-sand">
  <div class="container-omh py-14 lg:py-20">
    ${eyebrow("Your team")}
    <h2>${team.h2}</h2>
    <p class="mt-5 text-muted">${team.intro}</p>
    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <div data-tabs>
        <p class="font-display text-[18px] font-semibold" id="when-title">When should it answer?</p>
        <div role="tablist" aria-labelledby="when-title" class="mt-3 flex flex-wrap gap-2">
${team.modes.map(tab).join("\n")}
        </div>
${team.modes.map(panel).join("\n")}
      </div>
      <div class="on-band rounded-[18px] bg-band p-6 text-band-ink">
        <p class="font-display text-[20px] font-semibold">Your team keeps</p>
        <ul class="mt-4 space-y-2.5 text-[16px] leading-snug">
${team.keeps.map((k) => `          <li class="flex gap-2.5">${icon("check", "mt-[3px] shrink-0 text-[#f2c675]")}<span>${k}</span></li>`).join("\n")}
        </ul>
        <p class="mt-5 border-t border-band-line pt-4 text-[16px] text-band-muted">Change when it answers at any time. It's a setting, not a new contract.</p>
      </div>
    </div>
  </div>
</section>
`;

  const readySection = `
<section id="ready" data-component="Ready" class="border-y border-line bg-sand">
  <div class="container-omh grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:py-20" data-ready>
    <div>
      ${eyebrow("Getting ready")}
      <h2>${ready.h2}</h2>
      <p class="mt-5 text-muted">${ready.intro}</p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <a href="#book-demo-form" class="btn btn-primary" data-track="industry_ready_book">Book your discovery call</a>
        <p class="font-display text-[18px] font-semibold tnum" aria-live="polite" data-ready-count>0 of ${ready.asks.length} ready</p>
      </div>
    </div>
    <ul class="hover-card grid gap-2 rounded-[18px] border border-line bg-surface p-4 sm:p-5">
${ready.asks.map((a, i) => `      <li><label class="ready-row"><input type="checkbox" class="sr-only" data-ready-item data-track="industry_ready_tick" data-track-name="${a}"><span class="ready-box" aria-hidden="true">${icon("check")}</span><span class="text-[16px] leading-snug"><span class="num mr-2 text-[14px]">${String(i + 1).padStart(2, "0")}</span>${a}</span></label></li>`).join("\n")}
    </ul>
  </div>
</section>
`;
  return daySection + teamSection + readySection;
}
