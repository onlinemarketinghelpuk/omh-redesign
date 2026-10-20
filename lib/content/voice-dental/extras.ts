// Dental sections with no counterpart on /ai-voice-agents (21 Oct 2026), from the previous dental page (git tag
// dental-oldv1): a practice's day of calls, when the agent answers, and what we need from a practice. They take
// the place of the main page's comparison table and fit checker. Template: lib/content/voice-extras.ts.
import { extrasMarkup } from "@/lib/content/voice-extras";

export const dentalExtrasMarkup = extrasMarkup({
  day: {
    eyebrow: "A day at your practice",
    h2: `Calls don't arrive evenly.<br class="max-sm:hidden"> <span class="hl">Neither do the misses.</span>`,
    intro: "An illustrative weekday at a busy three-surgery practice. Most missed calls land in the 8am rush, over lunch and after closing, which is exactly when nobody is free to pick up.",
    // Hour, calls, answered by the team, closed (previous dental page): 232 calls, 79 missed.
    hours: [
      ["07", 6, 0, true], ["08", 34, 20], ["09", 24, 20], ["10", 18, 17], ["11", 16, 16], ["12", 22, 12], ["13", 20, 11],
      ["14", 15, 14], ["15", 14, 14], ["16", 17, 15], ["17", 21, 14], ["18", 12, 0, true], ["19", 8, 0, true], ["20", 5, 0, true],
    ],
    axis: 36,
    aria: "Bar chart of calls by hour from 7am to 8pm. 232 calls, 79 missed, mostly in the 8am rush, at lunch and after closing.",
    unit: "practice",
    moments: [
      ["08:00", "The morning rush", "Patients in pain ring at 8 on the dot. One receptionist, two lines and a queue at the desk."],
      ["12:30", "Lunch cover", "One person on the desk, or nobody. The phone rings out while they check a patient in."],
      ["18:00", "After closing", "Patients ring after work. Voicemail picks up and many hang up without leaving a message."],
    ],
  },
  team: {
    h2: `Will it replace your receptionists?<br class="max-sm:hidden"> <span class="hl">No.</span>`,
    intro: "It takes the overflow and the routine calls, so your team can look after the patients in front of them.",
    modes: [
      { id: "busy", label: "Only when you are busy", steps: ["Call comes in", "Rings reception", "No answer: agent picks up"],
        team: "Your team answers first, as now.", agent: "If nobody picks up within a few rings, or every line is busy, the agent answers." },
      { id: "closed", label: "Only when you are closed", steps: ["Call comes in", "Practice closed?", "Agent picks up"],
        team: "Your team answers in opening hours, as now.", agent: "The agent covers lunch, evenings, weekends and bank holidays." },
      { id: "first", label: "First on every call", steps: ["Call comes in", "Agent answers", "Books it or puts it through"],
        team: "Your team gets the calls that need a person, already explained.", agent: "The agent answers every call, books routine appointments and puts the rest through." },
    ],
    keeps: ["The patients in the room", "Anything clinical", "Complaints and sensitive calls", "Anyone who asks for a person", "The final say on every rule and script"],
  },
  ready: {
    h2: `What we'll need <span class="hl">from your practice</span>`,
    intro: "Tick what you already have to hand. Anything missing, we'll help you pull together on the discovery call. Most of it is already in your practice system.",
    asks: [
      "Your price list and fees, NHS and private",
      "Access to your diary or practice system",
      "Your emergency and out-of-hours route",
      "New patient and waiting list rules",
      "Opening hours and how you would like to be greeted",
      "Who calls should be put through to",
    ],
  },
});
