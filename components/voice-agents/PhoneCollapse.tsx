"use client";

import { useEffect } from "react";

/* Phones only: the longest voice-page lists show their first few items and a "Show all" button (docs/responsive-plan.md,
   Phase 5; user decision 16 Nov 2026: collapse long lists on phones, remove nothing). The markup strings are not
   touched: this adds the button and a data-phone-limit attribute, and voice-agents.css hides the rest under 640px.
   A list with filtered-out items (the industry filter sets [hidden]) is shown in full and its button hides. */

const LISTS = [
  { selector: "#industries .grid:has(> .ind-card)", limit: 3, noun: "industries" },
  { selector: "#feedback .grid.sm\\:grid-cols-2", limit: 2, noun: "sample calls" },
  { selector: 'section[id$="-types"] ul.grid', limit: 3, noun: "" },
] as const;

export function PhoneCollapse() {
  useEffect(() => {
    const added: Array<[HTMLElement, HTMLButtonElement]> = [];
    for (const { selector, limit, noun } of LISTS) {
      document.querySelectorAll<HTMLElement>(`#va-page ${selector}`).forEach((list) => {
        if (list.children.length <= limit || list.dataset.phoneLimit) return;
        list.dataset.phoneLimit = String(limit);
        if (!list.id) list.id = `phone-list-${added.length + 1}`;
        // Count the items, not a closing aside (the industries grid ends with a "not listed?" panel).
        const count = list.querySelectorAll(":scope > :not(aside)").length;
        const more = `Show all ${count}${noun ? ` ${noun}` : ""}`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "phone-more";
        button.textContent = more;
        button.setAttribute("aria-controls", list.id);
        button.setAttribute("aria-expanded", "false");
        button.addEventListener("click", () => {
          const open = list.toggleAttribute("data-open");
          button.setAttribute("aria-expanded", String(open));
          button.textContent = open ? "Show fewer" : more;
          if (!open) list.scrollIntoView({ block: "nearest" });
        });
        list.after(button);
        added.push([list, button]);
      });
    }
    return () => {
      for (const [list, button] of added) {
        button.remove();
        delete list.dataset.phoneLimit;
        list.removeAttribute("data-open");
      }
    };
  }, []);
  return null;
}
