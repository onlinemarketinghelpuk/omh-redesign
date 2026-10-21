// Car dealership section with no counterpart on /ai-voice-agents (21 Oct 2026): a dealership's day of calls.
// It takes the place of the main page's comparison table and fit checker. Template: lib/content/voice-extras.ts.
import { extrasMarkup } from "@/lib/content/voice-extras";

export const carsExtrasMarkup = extrasMarkup({
  day: {
    eyebrow: "A day at your dealership",
    h2: `Calls don't arrive evenly.<br class="max-sm:hidden"> <span class="hl">Neither do the misses.</span>`,
    intro: "An illustrative weekday at a busy dealership with a showroom and a workshop. Calls go unanswered at drop-off time, while the sales team is out on test drives and after the showroom closes, which is exactly when buyers and service customers ring.",
    // Hour, calls, answered by the team, closed (illustrative): 238 calls, 86 missed.
    hours: [
      ["08", 26, 16], ["09", 24, 18], ["10", 20, 16], ["11", 18, 13], ["12", 22, 14], ["13", 20, 13], ["14", 16, 13],
      ["15", 15, 12], ["16", 18, 13], ["17", 24, 15], ["18", 14, 9], ["19", 10, 0, true], ["20", 7, 0, true], ["21", 4, 0, true],
    ],
    axis: 30,
    aria: "Bar chart of calls by hour from 8am to 9pm. 238 calls, 86 missed, mostly at workshop drop-off time, over lunch and after the showroom closes.",
    unit: "dealership",
    moments: [
      ["08:00", "Workshop drop-offs", "Customers drop cars off while others ring to book an MOT. The service desk can't check cars in and answer the phone at once."],
      ["12:30", "Out on test drives", "Sales executives are out with buyers over lunch, and on a Saturday it can be all day. The showroom phone rings to an empty desk."],
      ["19:00", "After work", "Buyers ring about a car they saw online after work. Voicemail picks up, and they ring the next dealer with a similar car."],
    ],
  },
});
