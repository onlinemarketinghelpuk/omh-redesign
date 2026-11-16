/* =========================================================================
   What each dashboard screen calls itself.

   One place, because there were two and they drifted before the commit
   that created them was even merged. Each `loading.tsx` carried its own
   copy of the title and the lead sentence, and nine of the ten differed
   from the page they stood in for. That is not cosmetic: the page header's
   height depends on the length of that sentence, so a one-line skeleton
   lead replaced by a two-line real one moves everything below it the
   moment the data lands - the exact thing a skeleton exists to prevent.

   `screens.test.ts` asserts this file still matches what each page
   declares, so the next drift is a failing test rather than a shift
   nobody notices.
   ========================================================================= */

export type Shape = "cards" | "table" | "split" | "form";

export type Screen = {
  /** The TABS href this screen highlights in the rail. */
  active: string;
  title: string;
  lead: string;
  /** Which arrangement of placeholders matches its real content. */
  shape: Shape;
};

/* Keyed by the route segment under /lead-dashboard, "" for the index.
   These are ROUTES, not names: the Appointments screen lives at
   `bookings`, and a loading file was once written for `appointments`,
   which is not a route, so it never rendered for anybody. */
export const SCREENS: Record<string, Screen> = {
  "": {
    active: "/lead-dashboard",
    title: "Overview",
    lead: "Everything your assistant handled, what it captured, and what it booked.",
    shape: "cards",
  },
  handover: {
    active: "/lead-dashboard/handover",
    title: "Needs a person",
    lead: "Conversations the assistant handed over. Your reply appears in the chat on the site.",
    shape: "table",
  },
  inbox: {
    active: "/lead-dashboard/inbox",
    title: "Inbox",
    lead: "Every message, on every channel, newest first.",
    shape: "table",
  },
  chats: {
    active: "/lead-dashboard/inbox",
    title: "Inbox",
    lead: "Everyone who talked to the assistant, by chat or by phone.",
    shape: "table",
  },
  calls: {
    active: "/lead-dashboard/calls",
    title: "Calls",
    lead: "Every call the assistant took. Open one to hear the recording and read what was said.",
    shape: "table",
  },
  leads: {
    active: "/lead-dashboard/leads",
    title: "Leads",
    lead: "Everyone the assistant captured, by chat or by phone, with how warm they were when they left.",
    shape: "table",
  },
  bookings: {
    active: "/lead-dashboard/bookings",
    title: "Appointments",
    lead: "Booked by the assistant while the caller was still on the line, or while they were typing.",
    shape: "split",
  },
  sequences: {
    active: "/lead-dashboard/sequences",
    title: "Follow-ups",
    lead: "Who is being chased, and what goes out next.",
    shape: "table",
  },
  campaigns: {
    active: "/lead-dashboard/campaigns",
    title: "Campaigns",
    lead: "Every batch we contacted on purpose, and what it cost as well as what it made.",
    shape: "table",
  },
  channels: {
    active: "/lead-dashboard/channels",
    title: "Channels",
    lead: "Which channel produced each lead, and what came of it.",
    shape: "cards",
  },
  control: {
    active: "/lead-dashboard/control",
    title: "Control panel",
    lead: "What happens to a lead on each channel, and the switch that stops it all.",
    shape: "table",
  },
  brain: {
    active: "/lead-dashboard/brain",
    title: "Replies",
    lead: "Who answers when a lead replies, and what the assistant is trying to sell.",
    shape: "form",
  },
  agent: {
    active: "/lead-dashboard/agent",
    title: "Calling agent",
    lead: "The voice agent that rings leads back to explain and book.",
    shape: "form",
  },
  messages: {
    active: "/lead-dashboard/messages",
    title: "Messages",
    lead: "Every text and email the follow-ups send, in words you can change.",
    shape: "split",
  },
  integrations: {
    active: "/lead-dashboard/integrations",
    title: "Integrations",
    lead: "Every channel, whether it is really connected, what is missing, and a switch for each.",
    shape: "table",
  },
  settings: {
    active: "/lead-dashboard/settings",
    title: "Settings",
    lead: "How the assistant contacts people, and the switch that stops it.",
    shape: "form",
  },
};

/* The rail's own list. Plain data with no server imports, which is the
   point: a client component can read it. `error.tsx` needs it, because
   without a way to reach another screen a failed Overview offers only
   "try again" and "go to the overview", and both return to the same
   error.

   The comments explaining each choice stay with the rail in Shell.tsx. */
export const TABS = [
  { href: "/lead-dashboard", label: "Overview" },
  /* Second, directly under Overview: it is the only screen with someone
     waiting on the other end, so it is the one worth seeing first. */
  { href: "/lead-dashboard/handover", label: "Needs a person" },
  /* Every channel in one list. Second after the queue because it is the
     screen a business would leave open all day. */
  { href: "/lead-dashboard/inbox", label: "Inbox" },
  { href: "/lead-dashboard/calls", label: "Calls" },
  /* Conversations is not a separate entry. It was the same subject as the
     Inbox at a different grain, one row per person instead of one per
     message, and two entries for that read as two screens that happened to
     look alike. It is a toggle inside the Inbox now; the route still works
     and still carries every link pointing at it. */
  { href: "/lead-dashboard/leads", label: "Leads" },
  { href: "/lead-dashboard/bookings", label: "Appointments" },
  /* The routing screens. Below the record of what happened, because they are
     about what is about to happen, which is checked less often but matters
     more when it is wrong. */
  { href: "/lead-dashboard/sequences", label: "Follow-ups" },
  /* Beside Follow-ups rather than beside Channels: a campaign is a batch of
     follow-ups started on purpose, and the two screens are read together when
     one is running. */
  { href: "/lead-dashboard/campaigns", label: "Campaigns" },
  { href: "/lead-dashboard/channels", label: "Channels" },
  /* What the follow-ups do and what they say. Below the reports, above
     Settings: changed less often than a report is read, more often than a
     setting. */
  { href: "/lead-dashboard/control", label: "Control panel" },
  { href: "/lead-dashboard/messages", label: "Messages" },
  { href: "/lead-dashboard/brain", label: "Replies" },
  { href: "/lead-dashboard/agent", label: "Calling agent" },
  /* Next to Settings: it is the other "is the plumbing right" screen, and
     the per-channel switch here is the finer-grained sibling of the kill
     switch there. */
  { href: "/lead-dashboard/integrations", label: "Integrations" },
  { href: "/lead-dashboard/settings", label: "Settings" },
] as const;

