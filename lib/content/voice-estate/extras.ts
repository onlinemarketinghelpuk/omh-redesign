// Real estate sections with no counterpart on /ai-voice-agents (21 Oct 2026), from the previous estate page
// (git tag estate-oldv1): a branch's day of calls, when the agent answers, and what we need from a branch.
// They replace the main page's comparison table and fit checker on this page. Template: lib/content/voice-extras.ts.
import { extrasMarkup } from "@/lib/content/voice-extras";

export const estateExtrasMarkup = extrasMarkup({
  day: {
    eyebrow: "A day at your branch",
    h2: `Calls don't arrive evenly.<br class="max-sm:hidden"> <span class="hl">Neither do the misses.</span>`,
    intro: "An illustrative weekday at a busy sales and lettings branch. Calls go unanswered while negotiators are out on viewings, over lunch and after the branch closes, which is exactly when buyers and tenants ring.",
    // Hour, calls, answered by the team, closed (previous estate page): 221 calls, 89 missed.
    hours: [
      ["08", 8, 0, true], ["09", 22, 18], ["10", 20, 14], ["11", 18, 13], ["12", 24, 16], ["13", 22, 15], ["14", 15, 12],
      ["15", 14, 12], ["16", 17, 14], ["17", 26, 18], ["18", 16, 0, true], ["19", 10, 0, true], ["20", 6, 0, true], ["21", 3, 0, true],
    ],
    axis: 30,
    aria: "Bar chart of calls by hour from 8am to 9pm. 221 calls, 89 missed, mostly during viewings, at lunch and after closing.",
    unit: "branch",
    moments: [
      ["10:30", "Out on viewings", "Negotiators are at properties. The office phone rings to an empty desk."],
      ["12:30", "Lunchtime enquiries", "Buyers ring on their lunch break, just as the team grabs theirs."],
      ["18:00", "After work", "Buyers and tenants ring after work. Voicemail picks up, and they ring the next agent on the portal."],
    ],
  },
  team: {
    h2: `Will it replace your negotiators?<br class="max-sm:hidden"> <span class="hl">No.</span>`,
    intro: "It takes the overflow and the routine calls, so your team can focus on viewings, valuations and closing sales. You decide when it answers, branch by branch.",
    modes: [
      { id: "busy", label: "Only when you are busy", steps: ["Call comes in", "Rings the branch", "No answer: agent picks up"],
        team: "Your team answers first, as now.", agent: "If nobody picks up within a few rings, or everyone is out on viewings, the agent answers." },
      { id: "closed", label: "Only when you are closed", steps: ["Call comes in", "Branch closed?", "Agent picks up"],
        team: "Your team answers in branch hours, as now.", agent: "The agent covers lunch, evenings, Sundays and bank holidays." },
      { id: "first", label: "First on every call", steps: ["Call comes in", "Agent answers", "Books it or puts it through"],
        team: "Your team gets the calls that need a person, already explained.", agent: "The agent answers every call, books viewings and valuations and puts the rest through." },
    ],
    keeps: ["Viewings and valuations in person", "Offers and negotiations", "Complaints and sensitive calls", "Anyone who asks for a person", "The final say on every rule and script"],
  },
  ready: {
    h2: `What we'll need <span class="hl">from your branch</span>`,
    intro: "Tick what you already have to hand. Anything missing, we'll help you pull together on the discovery call. Most of it lives in your property software already.",
    asks: [
      "Access to your property software or listings feed",
      "Your viewing rules and notice periods",
      "How valuations are booked, and by whom",
      "Your tenant emergency and contractor route",
      "Branch hours and how you would like to be greeted",
      "Who calls should be put through to",
    ],
  },
});
