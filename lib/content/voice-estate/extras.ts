// Real estate sections with no counterpart on /ai-voice-agents (21 Oct 2026), from the previous estate page
// (git tag estate-oldv1): a branch's day of calls, when the agent answers, and what we ask a branch for.
// They replace the main page's comparison table and fit checker on this page. Widgets: the day chart and the
// checklist are wired by components/voice-agents/EstateScript.tsx; the "when it answers" tabs use the shared
// [data-tabs] in VoiceAgentsScript. Styles: app/ai-voice-agents/voice-agents.css ("Real estate extras").

const icon = (name: string, cls = "") => `<svg class="icon${cls && " " + cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
const eyebrow = (t: string) => `<p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"><i></i><i></i><i></i></span>${t}</p>`;

/* ------------------------------------------------------- A day at your branch */
// Illustrative weekday at a busy sales and lettings branch (previous estate page): hour, calls, answered by the team.
// Closed hours have no team answers. 221 calls, 89 missed.
const hours: [string, number, number, boolean?][] = [
  ["08", 8, 0, true], ["09", 22, 18], ["10", 20, 14], ["11", 18, 13], ["12", 24, 16], ["13", 22, 15], ["14", 15, 12],
  ["15", 14, 12], ["16", 17, 14], ["17", 26, 18], ["18", 16, 0, true], ["19", 10, 0, true], ["20", 6, 0, true], ["21", 3, 0, true],
];
const AXIS = 30;
const pct = (n: number) => `${((n / AXIS) * 100).toFixed(1)}%`;
const col = ([h, calls, team, closed]: (typeof hours)[number]) => {
  const missed = calls - team;
  return `          <li class="day-col${closed ? " is-closed" : ""}" data-tip="${h}:00${closed ? " (closed)" : ""} · ${calls} calls · ${missed} missed">
            <span class="day-stack"><i class="day-m" style="height:${pct(missed)}"></i><i class="day-t" style="height:${pct(team)}"></i></span>
            <span class="day-h">${h}</span>
          </li>`;
};
const moment = (time: string, title: string, text: string) => `        <li class="hover-card rounded-[16px] border border-line bg-paper p-5">
          <p class="flex items-baseline gap-3"><span class="font-display text-[22px] font-semibold text-hl tnum">${time}</span><span class="font-display text-[18px] font-semibold">${title}</span></p>
          <p class="mt-2 text-[16px] text-muted">${text}</p>
        </li>`;
const radio = (mode: string, label: string, on: boolean) =>
  `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" class="min-h-[44px] rounded-full border border-[var(--va-line-strong)] px-4 text-[15.5px] font-semibold aria-checked:border-ink aria-checked:bg-ink aria-checked:text-paper" data-day-mode="${mode}" data-track="estate_day_mode" data-track-name="${label}">${label}</button>`;

const day = `
<section id="day" data-component="BranchDay" class="border-y border-line bg-surface">
  <div class="container-omh py-14 lg:py-20">
    ${eyebrow("A day at your branch")}
    <h2>Calls don't arrive evenly.<br class="max-sm:hidden"> <span class="hl">Neither do the misses.</span></h2>
    <p class="mt-5 text-muted">An illustrative weekday at a busy sales and lettings branch. Calls go unanswered while negotiators are out on viewings, over lunch and after the branch closes, which is exactly when buyers and tenants ring.</p>
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
        <div class="day-chart mt-5" data-day-chart data-mode="today" role="img" aria-label="Bar chart of calls by hour from 8am to 9pm. 221 calls, 89 missed, mostly during viewings, at lunch and after closing.">
          <ol class="day-cols">
${hours.map(col).join("\n")}
          </ol>
        </div>
        <p class="mt-4 text-[16px] font-semibold" aria-live="polite" data-day-sum>221 calls, 89 missed (40%). Hover or tap a bar for the hour.</p>
        <p class="mt-1 text-[15px] text-muted">Illustrative figures, not data from a real agency. Your phone provider's call log shows your own pattern.</p>
      </div>
      <ol class="grid gap-3">
${moment("10:30", "Out on viewings", "Negotiators are at properties. The office phone rings to an empty desk.")}
${moment("12:30", "Lunchtime enquiries", "Buyers ring on their lunch break, just as the team grabs theirs.")}
${moment("18:00", "After work", "Buyers and tenants ring after work. Voicemail picks up, and they ring the next agent on the portal.")}
        <li><a href="#roi-calculator" class="text-link" data-track="estate_day_cost">Work out what it costs your branch${icon("arrow-right")}</a></li>
      </ol>
    </div>
  </div>
</section>
`;

/* ------------------------------------------------- When it answers (your team) */
const modes = [
  { id: "busy", label: "Only when you are busy", steps: ["Call comes in", "Rings the branch", "No answer: agent picks up"],
    team: "Your team answers first, as now.", agent: "If nobody picks up within a few rings, or everyone is out on viewings, the agent answers." },
  { id: "closed", label: "Only when you are closed", steps: ["Call comes in", "Branch closed?", "Agent picks up"],
    team: "Your team answers in branch hours, as now.", agent: "The agent covers lunch, evenings, Sundays and bank holidays." },
  { id: "first", label: "First on every call", steps: ["Call comes in", "Agent answers", "Books it or puts it through"],
    team: "Your team gets the calls that need a person, already explained.", agent: "The agent answers every call, books viewings and valuations and puts the rest through." },
];
const modeTab = (m: (typeof modes)[number], i: number) =>
  `          <button type="button" role="tab" id="when-tab-${m.id}" aria-controls="when-${m.id}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" class="inline-flex min-h-[48px] items-center rounded-full border border-[var(--va-line-strong)] px-4 text-[16px] font-semibold aria-selected:border-ink aria-selected:bg-ink aria-selected:text-paper" data-tab data-track="estate_when_answers" data-track-name="${m.label}">${m.label}</button>`;
const modePanel = (m: (typeof modes)[number], i: number) => `
        <div role="tabpanel" id="when-${m.id}" aria-labelledby="when-tab-${m.id}"${i ? " hidden" : ""} class="mt-5 rounded-[18px] border border-line bg-surface p-5 sm:p-6" data-tab-panel>
          <ol class="when-flow" aria-label="How a call goes">
${m.steps.map((s, k) => `            <li class="when-step${k === m.steps.length - 1 ? " is-agent" : ""}">${s}</li>`).join("\n")}
          </ol>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-[14px] bg-paper p-4"><p class="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted">${icon("users", "text-hl")}Your team</p><p class="mt-2 text-[16px]">${m.team}</p></div>
            <div class="rounded-[14px] bg-paper p-4"><p class="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted">${icon("phone", "text-hl")}Your AI agent</p><p class="mt-2 text-[16px]">${m.agent}</p></div>
          </div>
        </div>`;
const keeps = ["Viewings and valuations in person", "Offers and negotiations", "Complaints and sensitive calls", "Anyone who asks for a person", "The final say on every rule and script"];

const yourTeam = `
<section id="your-team" data-component="YourTeam" class="border-y border-line bg-sand">
  <div class="container-omh py-14 lg:py-20">
    ${eyebrow("Your team")}
    <h2>Will it replace your negotiators?<br class="max-sm:hidden"> <span class="hl">No.</span></h2>
    <p class="mt-5 text-muted">It takes the overflow and the routine calls, so your team can focus on viewings, valuations and closing sales. You decide when it answers, branch by branch.</p>
    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <div data-tabs>
        <p class="font-display text-[18px] font-semibold" id="when-title">When should it answer?</p>
        <div role="tablist" aria-labelledby="when-title" class="mt-3 flex flex-wrap gap-2">
${modes.map(modeTab).join("\n")}
        </div>
${modes.map(modePanel).join("\n")}
      </div>
      <div class="on-band rounded-[18px] bg-band p-6 text-band-ink">
        <p class="font-display text-[20px] font-semibold">Your team keeps</p>
        <ul class="mt-4 space-y-2.5 text-[16px] leading-snug">
${keeps.map((k) => `          <li class="flex gap-2.5">${icon("check", "mt-[3px] shrink-0 text-[#f2c675]")}<span>${k}</span></li>`).join("\n")}
        </ul>
        <p class="mt-5 border-t border-band-line pt-4 text-[16px] text-band-muted">Change when it answers at any time. It's a setting, not a new contract.</p>
      </div>
    </div>
  </div>
</section>
`;

/* ---------------------------------------------------- What we'll ask you for */
const asks = [
  "Access to your property software or listings feed",
  "Your viewing rules and notice periods",
  "How valuations are booked, and by whom",
  "Your tenant emergency and contractor route",
  "Branch hours and how you would like to be greeted",
  "Who calls should be put through to",
];
const ready = `
<section id="ready" data-component="Ready" class="border-y border-line bg-sand">
  <div class="container-omh grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:py-20" data-ready>
    <div>
      ${eyebrow("Getting ready")}
      <h2>What we'll need <span class="hl">from your branch</span></h2>
      <p class="mt-5 text-muted">Tick what you already have to hand. Anything missing, we'll help you pull together on the discovery call. Most of it lives in your property software already.</p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <a href="#book-demo-form" class="btn btn-primary" data-track="estate_ready_book">Book your discovery call</a>
        <p class="font-display text-[18px] font-semibold tnum" aria-live="polite" data-ready-count>0 of ${asks.length} ready</p>
      </div>
    </div>
    <ul class="hover-card grid gap-2 rounded-[18px] border border-line bg-surface p-4 sm:p-5">
${asks.map((a, i) => `      <li><label class="ready-row"><input type="checkbox" class="peer sr-only" data-ready-item data-track="estate_ready_tick" data-track-name="${a}"><span class="ready-box" aria-hidden="true">${icon("check")}</span><span class="text-[16px] leading-snug"><span class="num mr-2 text-[14px]">${String(i + 1).padStart(2, "0")}</span>${a}</span></label></li>`).join("\n")}
    </ul>
  </div>
</section>
`;

export const estateExtrasMarkup = day + yourTeam + ready;
