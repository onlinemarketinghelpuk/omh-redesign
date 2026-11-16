"use client";

/*
  Collects a whole <form> and posts it to /api/enquiry.

  Uses the browser's own FormData, so every control the form contains is captured
  by its `name` — including checkbox groups, which arrive as an array. That is why
  the field components set `name` to the visible label: the email then reads as the
  questions the visitor actually answered, in their own words, with no mapping
  table to keep in step with 15 different forms.
*/

export type SendResult = { ok: true } | { ok: false; message: string };

export async function sendEnquiry(form: HTMLFormElement, formName: string): Promise<SendResult> {
  const data = new FormData(form);
  const fields: Record<string, string | string[]> = {};

  for (const [key, value] of data.entries()) {
    if (typeof value !== "string" || key === "hp") continue;
    const existing = fields[key];
    if (existing === undefined) fields[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else fields[key] = [existing, value];
  }

  try {
    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: formName,
        /* pathname AND search. It was the pathname alone, which threw the
           query away: the gclid and the utm_ values are on the URL of the
           page they landed on, so the advert that produced a lead was lost
           at the exact moment they became one. Every form on the site posts
           through here, so this one line is every form's attribution. */
        page: window.location.pathname + window.location.search,
        hp: String(data.get("hp") ?? ""), // honeypot
        fields,
      }),
    });
    if (response.ok) return { ok: true };
    return {
      ok: false,
      message:
        response.status === 503
          ? "We couldn't send that just now. Please call 020 3489 3934 and we'll take the details."
          : "Something went wrong sending that. Please try again, or call 020 3489 3934.",
    };
  } catch {
    return { ok: false, message: "No connection. Please try again, or call 020 3489 3934." };
  }
}

/*
  A field bots fill in and people never see. Cheaper and kinder than a captcha.

  `readOnly` is the part that matters: browsers do not autofill a read-only
  input, and a person cannot type in one either — but a script setting .value
  still trips it, which is exactly the population being caught. Renaming it away
  from "company" was not enough on its own; browsers filled it regardless.
*/
export function Honeypot() {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" readOnly />
      </label>
    </div>
  );
}
