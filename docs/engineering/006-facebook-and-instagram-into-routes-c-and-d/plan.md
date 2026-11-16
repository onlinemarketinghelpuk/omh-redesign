# Plan

Nothing here needs a Meta credential. The workflow is built with `PENDING`
placeholders exactly as the Twilio ones were, so when access arrives tomorrow
it is a config change rather than a build.

## Tasks

- [x] 1. `gates/meta.js`: challenge verification, signature check over raw
      bytes, event reader that tells leadgen from message, 24 hour window,
      Send API body. Plain JS, single line export so `gate_inline()` can
      embed it.
- [x] 2. `tests/meta.test.ts`: the four failure modes first (echo, retry,
      seconds vs milliseconds, no secret), then the happy paths. 49
      assertions.
- [x] 3. Prove the suite has teeth by removing the `is_echo` guard and
      watching the echo assertion fail.
- [x] 4. `build_meta()` in `build-workflows.py`: one webhook on GET and POST
      with `rawBody`, the gate inlined, a switch on what arrived, leadgen into
      Convex, message into the existing `ohm-chat` agent and back out through
      the Send API. 10 nodes.
- [x] 5. Drive every new Code node through `new Function(...)` via the
      existing `tests/code-nodes.test.ts`, which is the only shape that would
      have caught the outage of 2026-11-11. Now 28 Code nodes across 12
      workflows, all green.
- [x] 6. Resolve the campaign name from `ad_id` with a second Graph call, so
      the channel report can name the advert rather than show an id.
      `Name The Advert`, with `continueRegularOutput` so a failed Graph call
      costs a reporting detail rather than the lead.
- [x] 7. Merge the Meta PSID in `findPerson`, so a person who DMs and later
      fills a form is one lead, not two. **Blocked by choice, not by access:**
      it needs a new index in `schema.ts`, and pushing a schema change means
      deploying Convex, which is a deliberate act and still points at a dev
      deployment. Raised with the production question rather than done quietly.
- [x] 8. Full suite green, and a docstring naming the three values each
      placeholder is waiting for.

## Found by the deep check, after task 4 was called done

Three faults, all of which would have survived until a real Meta event hit
them tomorrow. Cross-checking every Convex route the workflows call against
`convex/http.ts` is what surfaced the first two.

- [x] 9. `/meta/lead` does not exist. It was invented while writing the
      workflow and never built, so the lead branch would have 404'd. Fixed
      not by building it but by sending the lead through the **07-router
      webhook**, the way Google lead forms already do, so route C enrolment,
      the consent gate and the immediate touches all reuse tested code.
- [x] 10. `/touch` does not exist either. The real route is `/touch/record`.
- [x] 11. **The webhook does not contain the person.** It carries a
      `leadgen_id` and no name, phone or email: those need a second Graph
      call, and the reply is `field_data` pairs rather than named fields.
      Without it a lead is created on time, correctly attributed and
      completely empty, then enters a sequence with nobody to text. Added
      `leadFields()` to the gate, with tests, plus a `Fetch The Lead` node.
- [x] 12. `tests/channel-coverage.test.ts`: the joins rather than the parts.
      Every Convex route a workflow calls exists, every source channel has an
      explicit route rather than the fallback, every route step has something
      that can send it, every channel has an entry point, and attribution
      survives the trip. 74 assertions. Teeth proven by pointing
      `facebook_ads` at route B and watching both the routing assertion and
      the no-automated-call assertion fail.

## Found by validating before pushing, not after

The n8n validator rejected the first shape: `Verify And Read` fanned out to
the respond node and the processing branch at once. The validator read it as a
malformed error output, but the real fault underneath was worse and it would
only have shown under load. **The gate emits one item per event, and Meta
batches**, so three DMs in one POST would have called the respond node three
times for a response that can only be sent once. Chaining it instead means it
answers once and passes everything through, and Meta gets its 200 before the
Graph call and the assistant have taken their time.

## Not in scope

- Pushing or activating anything. No credential exists yet, and nothing goes
  live without Rafiul's approval.
- App Review. Development Mode covers building and testing.
- WhatsApp. It is a separate subscription and was never in the package.


Task 7 was done in workstream 009. The note here that it was blocked on a
schema index was wrong: `visitorIds` is already matched by scanning, because
Convex cannot index into an array, so a PSID needed no index either.
