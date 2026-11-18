"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Eye, Monitor, Smartphone, Tablet } from "lucide-react";

// Live demo of a portfolio design in a full-screen popup (client, 18 Nov 2026): the visitor stays on the page and
// can switch the preview between desktop, tablet and phone widths. The site loads only when the popup opens. A demo
// site must allow being framed (no X-Frame-Options DENY/SAMEORIGIN, no frame-ancestors that leave us out).
const DEVICES = [
  { key: "desktop", label: "Desktop", width: "100%", Icon: Monitor },
  { key: "tablet", label: "Tablet", width: "768px", Icon: Tablet },
  { key: "phone", label: "Phone", width: "390px", Icon: Smartphone },
] as const;

export function DemoViewer({ url, title }: { url: string; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("desktop");
  const width = DEVICES.find((d) => d.key === device)!.width;

  return (
    <>
      {/* The button sits over the card's screenshot: shown on hover or focus, always on touch screens. The overlay
          lets the pointer through (the screenshot scrolls under it); the dialog stays outside it, or it would too. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
        {/* Dark overlay on hover or focus; on touch screens it waits for a tap, so thumbnails are not dimmed. */}
        <span aria-hidden className="absolute inset-0 bg-inverse/45 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-focus:opacity-100 group-hover:opacity-100" />
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setLoaded(false);
            setOpen(true);
            dialog.current?.showModal();
          }}
          data-event="website_designs_demo_open"
          className="button-motion btn-primary pointer-events-auto relative shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)]"
        >
          <Eye className="size-5" aria-hidden />
          View demo<span className="sr-only">: {title}</span>
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-label={`Live demo: ${title}`}
        onClose={() => setOpen(false)}
        className="demo-viewer fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-inverse p-0 text-oninverse"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-4 px-[var(--gutter)] py-3">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-secondary px-4 py-2.5">
              <ArrowLeft className="size-5" aria-hidden />
              Back
            </button>
            {/* Below 768px the preview is already phone width, so the size buttons only show from tablets up. */}
            <div role="group" aria-label="Preview size" className="mx-auto flex gap-2 max-md:hidden">
              {DEVICES.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-pressed={device === key}
                  onClick={() => setDevice(key)}
                  className="grid size-11 cursor-pointer place-items-center rounded-button border border-oninverse/20 transition-colors hover:border-oninverse/50 aria-pressed:border-amber aria-pressed:bg-amber"
                >
                  <Icon className="size-5" aria-hidden />
                </button>
              ))}
            </div>
            <p className="ml-auto min-w-0 truncate text-body text-oninverse/70 md:ml-0 md:max-w-[30%]">{title}</p>
          </div>
          <div className="min-h-0 flex-1 px-[var(--gutter)] pb-4">
            <div
              style={{ width }}
              className="relative mx-auto h-full max-w-full overflow-hidden rounded-card bg-surface text-ink transition-[width] duration-500 ease-out"
            >
              {!loaded && <p className="absolute inset-0 grid place-items-center text-body text-muted">Loading the demo…</p>}
              {open && (
                <iframe
                  src={url}
                  title={`Live demo: ${title}`}
                  onLoad={() => setLoaded(true)}
                  className="relative size-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
