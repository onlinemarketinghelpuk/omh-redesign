// Grows each ROI calculator frame (lib/content/roi-calculator.ts) to its content: about 2,060px on
// desktop and 3,500px on mobile, against a 1400px starting height, so the lead form is never behind
// an inner scrollbar. Runs from the page scripts after hydration; an inline onload ran before it,
// changed the markup React was about to hydrate and logged a mismatch.
//
// body.offsetHeight, not scrollHeight, so the frame can shrink again. The ResizeObserver must be the
// frame's own: a parent-window one never fires for elements inside the frame.
export function fitRoiFrames(root: ParentNode): () => void {
  const undo: (() => void)[] = [];
  root.querySelectorAll<HTMLIFrameElement>("iframe[data-roi-frame]").forEach((frame) => {
    const attach = () => {
      const doc = frame.contentDocument;
      const win = frame.contentWindow as (Window & typeof globalThis) | null;
      if (!doc?.body || !win || doc.URL === "about:blank") return;
      const fit = () => (frame.style.height = doc.body.offsetHeight + "px");
      fit();
      const ro = new win.ResizeObserver(fit);
      ro.observe(doc.body);
      undo.push(() => ro.disconnect());
    };
    if (frame.contentDocument?.readyState === "complete") attach();
    frame.addEventListener("load", attach);
    undo.push(() => frame.removeEventListener("load", attach));
  });
  return () => undo.forEach((fn) => fn());
}
