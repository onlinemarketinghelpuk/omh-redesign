import { Shell } from "@/components/dashboard/Shell";
import { BrainEditor } from "@/components/dashboard/BrainEditor";
import { getBrain, canWrite } from "@/lib/dashboard/routing";
import { dashboardLocked } from "@/lib/dashboard/auth";
import { isDemo } from "@/lib/dashboard/demo";
import { demoBrain } from "@/lib/dashboard/control-panel";

export const dynamic = "force-dynamic";

/* =========================================================================
   Replies: the Brain.

   When a lead replies to one of our texts, who answers: the assistant, or a
   person. And when the assistant answers, what it is selling. Decided in
   Convex by widget/gates/brain.js on every reply; carried out by
   09-twilio-inbound in n8n.
   ========================================================================= */

export default async function BrainPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demo = isDemo(await searchParams);
  const brain = demo ? demoBrain() : await getBrain();
  const writable = !demo && canWrite && dashboardLocked && brain !== null;

  return (
    <Shell
      active="/lead-dashboard/brain"
      title="Replies"
      lead="Who answers when a lead replies, and what the assistant is trying to sell."
      demo={demo}
    >
      {brain === null ? (
        <p role="status" className="rounded-xl border border-line bg-warm px-4 py-3 text-[13.5px] text-ink">
          The settings store cannot be reached. Until it is, every reply is answered by the assistant, as it always
          has been.
        </p>
      ) : (
        <div className="max-w-3xl">
          <BrainEditor
            initial={{ enabled: brain.enabled, policies: brain.policies, sales: brain.sales }}
            canWrite={writable}
            demo={demo}
          />
          <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
            Applies to replies by text. An opt-out (STOP) is never answered: the person is taken off every list
            straight away. Anything handed over lands in Needs a person.
          </p>
        </div>
      )}
    </Shell>
  );
}
