"use client";

import { useId, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Honeypot, sendEnquiry } from "@/lib/send-enquiry";

const controlCls =
  "min-h-12 w-full rounded-input border-[1.5px] border-line bg-surface px-3.5 text-body text-ink placeholder:text-muted/70";

const topics = ["A general question", "Help with an existing project", "Partnership or press", "Something else"];

// The Contact Us page form (17 Nov 2026): a short general message, apart from the consultation form on
// /book-a-consultation. Posts to /api/enquiry like every other form.
export function GeneralContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topicId = useId();
  const msgId = useId();

  if (sent) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 max-sm:p-6" role="status">
        <h3 className="font-sans text-h3 font-semibold">Thanks, your message is with us.</h3>
        <p className="mt-3 text-body leading-relaxed text-ink/75">
          A real person will read it and reply. If it&apos;s urgent, call us on{" "}
          <span className="font-semibold text-ink">020 3489 3934</span>.
        </p>
        <button type="button" onClick={() => setSent(false)} className="tap-target mt-6 text-body font-semibold text-amber-deep underline underline-offset-4">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        setError(null);
        const result = await sendEnquiry(e.currentTarget, "Contact Us message");
        setSending(false);
        if (!result.ok) return setError(result.message);
        setSent(true);
      }}
      data-event="contact_us_form_submit"
      className="rounded-card border border-line bg-surface p-8 max-sm:p-6"
    >
      <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
        <Field label="Full name" required placeholder="Jane Smith" autoComplete="name" />
        <Field label="Email" type="email" required placeholder="jane@company.co.uk" autoComplete="email" />
        <Field label="Phone" type="tel" placeholder="020 0000 0000" autoComplete="tel" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={topicId} className="text-label font-semibold text-ink">
            What is it about?
          </label>
          <select id={topicId} name="What is it about?" defaultValue={topics[0]} className={controlCls}>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 max-sm:col-span-1">
          <label htmlFor={msgId} className="text-label font-semibold text-ink">
            Your message
            <span className="text-error" aria-hidden>
              {" "}
              *
            </span>
          </label>
          <textarea id={msgId} name="Message" required rows={5} className={`${controlCls} min-h-32 py-3 leading-relaxed`} />
        </div>
      </div>
      <Honeypot />
      <button type="submit" disabled={sending} className="button-motion btn-primary mt-7 max-sm:w-full">
        {sending ? "Sending…" : "Send message"}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-body font-medium text-error">
          {error}
        </p>
      )}
      <p className="mt-4 text-bsm text-muted">We only use your details to reply to this message.</p>
    </form>
  );
}
