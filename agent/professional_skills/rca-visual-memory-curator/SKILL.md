---
name: rca-visual-memory-curator
description: "Use when RedCube AI needs an optional visual-pattern proposal during review or a later owner accept/reject decision after export, without moving memory authority to OPL."
---

# RCA Visual Memory Curator

Operate as the RCA visual memory curator in one of two explicit modes. During screenshot-review summary, turn rendered review evidence into either one small non-authority proposal candidate or `skip`. After terminal export, the RCA memory owner may separately accept or reject an existing candidate using review and export closeout refs. Memory helps future authoring and review attention; it never becomes route truth, hidden layout code, an export gate, or visual authority.

## Runtime Summary

During review summary, derive at most one small evidence-backed reusable-pattern proposal or `skip`; unresolved defects route back instead of becoming memory. Owner accept/reject is a separate post-export action that requires the existing candidate, rendered review evidence, terminal export closeout, and provenance. Never collapse proposal and acceptance or use memory as route/export authority.

## AI-First / Contract-Light Boundary

- Use AI judgment here for whether a lesson is reusable, stage-scoped, evidence-backed, stale, too broad, a duplicate, a live defect that should route back, or an authority bypass.
- Use AI judgment during proposal generation to decide whether a reusable lesson exists; no reusable lesson is a normal `skip`, not a blocker.
- Use AI judgment during owner accept/reject only after rendered evidence, RCA review refs, and terminal export closeout refs prove the candidate is reusable rather than an unresolved defect.
- Treat knowledge catalogs, locator refs, receipts, and `contracts/capability_map.json` as transport and discovery metadata only; they do not decide accept/reject and never contain memory body authority.
- Treat `visual_pack_compiler_handoff` as a carrier for memory proposal refs and accept/reject receipt refs only. It may route memory evidence to this skill, but it must not carry reusable lesson text as authority or decide accept/reject through contract fields.
- Keep memory proposals prose-first and small. Reject attempts to encode visual taste, route scoring, review verdicts, or artifact state as contract data.

## Inputs

- Proposal generation: rendered artifact evidence, contact sheets, screenshot-review context, and visible findings. Export closeout is not required.
- Owner accept/reject: an existing proposal candidate plus rendered evidence, RCA review refs, terminal export closeout refs, and provenance.
- Proposed visual-pattern lesson, deliverable family, stage, audience, style, failure mode, and provenance.
- Current knowledge catalog and policy refs:
  - `docs/policies/visual_pattern_memory_policy.md`
  - `agent/skills/visual_memory_policy.md`
  - `agent/quality_gates/review_export_memory.md`
  - `agent/knowledge/review_export_memory.md`
  - `contracts/durable_knowledge_catalog.json`

## Outputs

- Proposal generation returns `skip` or one non-authority `visual_memory_writeback_proposal` candidate. Its common knowledge fields are `source_refs`, `target_scope` with `kind` and `id`, `content_kind`, `proposed_rule_or_mechanism`, `evidence_class` and `review_requirement`; rendered evidence and visual context accompany the candidate.
- For the Framework writeback CLI, project only those six common fields into the proposal JSON. `source_refs` is a non-empty array of strings. Keep audience, stage, evidence/review refs, provenance, knowledge identity, source revision and other visual metadata in the RCA candidate envelope; do not submit that entire envelope as the CLI proposal. The exact CLI payload contract belongs to Framework's `contracts/opl-framework/knowledge-writeback-proposal.schema.json`.
- Owner accept/reject returns `visual_memory_accept_receipt` or `visual_memory_reject_receipt` refs from the RCA owner surface.
- Rejection reasons when the proposal is artifact body, review/export verdict, route logic, stale evidence, or hidden template material.
- `memory_route_back_target` when a proposed lesson is really an unresolved story, visual direction, page authoring, native PPT, or review defect.
- Body-free catalog and recall receipt projections; OPL reads accepted Markdown only inside the authorized StageRun snapshot.

## Execution Rules

Distinguish a reusable method from a personal/project choice. General lessons
such as semantic page mapping, reference-role separation, relative visual review
and media equivalence may inform a small stage-scoped proposal. A specific ink
palette, patient fact, deck page number, absolute path or preferred product order
stays in authorized project/owner memory unless separately approved for wider
use. Link to the accepted outcome and evidence; do not vendor private slide
images or promote an unresolved defect as a successful repair pattern.

1. Select exactly one mode. Screenshot-review summary generates or skips a candidate; the later RCA memory-owner action accepts or rejects. Do not collapse both into one call.
2. In proposal-generation mode, start from rendered review evidence. If no reusable pattern is distinct from the current artifact, return `skip`; missing optional memory never blocks review or export.
3. Keep each candidate small, prose-first, and stage-scoped. Prefer one reusable lesson over a global rulebook.
4. In owner accept/reject mode, require the existing candidate, rendered evidence, RCA review refs, terminal export closeout refs, and provenance. Export itself never invokes or signs this decision.
5. Accept only reusable visual-pattern lessons: story rhythm, density caveat, style caveat, route caveat, recurring failure mode, or repair expectation.
6. Reject current deliverable body, slide/page text, artifact state, export verdicts, readiness claims, deterministic layout recipes, and hidden templates.
7. Keep authority explicit. RCA owns product knowledge and visual accept/reject judgment; the user, topic or project owner retains the corresponding private source. OPL owns source validation, scoped recall, exact execution snapshots, recoverable write mechanics and consumption receipts; it does not accept the semantic lesson.
8. Route back unresolved defects instead of storing them. If a candidate says a specific page still needs repair, return the owner stage and evidence refs rather than accepting it as memory.
9. For repeated visual failures, accept only the reusable pattern after the blocked slides have a clear review/repair outcome. Otherwise return `route_back` to story, visual direction, page authoring, native PPT design, template profiling, or reviewer.
10. Reject route arbitration as memory unless it is a reusable route caveat backed by evidence. Do not store route scores, layout controllers, accepted review verdicts, or hidden template recipes.
11. Return typed blockers for an invalid owner accept/reject attempt, unverifiable provenance, or forbidden authority write. Do not turn an absent or incomplete optional proposal into a review/export blocker; return `skip` instead.
12. Accept reusable native-PPT lessons only when both pixels and package readback support them. Viewer-specific drift, object-kind degeneration, notes/motion loss, and semantic-composition failures remain live repair evidence until resolved.
13. Bind the lesson to a stable knowledge identity, intended product/owner/topic/project scope, content kind and exact source revision. Existing personal-library Markdown remains its editable source; workspace Markdown serves the same role without a library. Preserve one source per item and reuse Framework source/writeback operations instead of creating a private storage route.
14. Recheck source validity and derived-summary dependencies. Changed or revoked source content cannot remain current through an accepted older summary. A missing optional pattern can return `skip`; required source authorization and action-critical constraints must be resolved before the dependent action.
15. Before submitting a private-source proposal, build the six-field CLI payload from the RCA candidate and validate it against the Framework proposal schema. Keep source identity, base revision and acceptance evidence in the separately declared operation inputs and review records. The private writeback CLI accepts owner, topic and project scopes; product knowledge changes follow the product repository's review path.

## Contract Foldback Map

- `visual_pack_compiler_handoff`: carries proposal refs, evidence refs, memory locator refs, RCA accept/reject receipt refs, and forbidden-authority flags only.
- Stage-control and generated descriptors: may route memory writeback work to this skill and transport receipt refs after review; they do not accept/reject visual memory and do not own memory body text.
- RCA curator method: owns the flexible accept/reject judgment over reusability, stage scope, stale evidence, provenance, authority bypass, and whether a lesson is too broad for memory.
- Contract surfaces may fail closed on missing provenance or forbidden payload fields; they may not turn a descriptor, score, or operator note into accepted memory.

## Minimal Template Resource

- `proposal_generation`: skip or non-authority candidate, family, stage, audience, reusable pattern, review evidence, provenance, scope, and caveat.
- `accept_reject_review`: evidence sufficiency, reusability, authority boundary, stale-risk check, accept/reject verdict ref, and owner receipt ref.
- `writeback_lifecycle`: propose against source revision -> authorized RCA/knowledge-owner accept/reject -> receipt ref -> Framework version-checked write to the same Markdown source -> next stage-scoped snapshot retrieval.
- `reject_reason`: artifact_body, verdict_body, route_logic, hidden_template, stale_evidence, global_rulebook, unsupported_provenance, or authority_bypass.
- `memory_ai_judgment`: accept, reject, duplicate, stale, route_back, or typed_blocker with evidence refs and owner stage.
- `repeated_visual_failure_memory_gate`: evidence refs, repair outcome, reusable lesson, unresolved defect check, accept/reject receipt ref, and route-back owner.
- `route_back_target`: unresolved story, visual direction, page authoring, native PPT, or review defect that must be repaired outside memory.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `review_and_revision` screenshot summary may produce one optional non-authority proposal candidate from rendered review evidence; slide-batch calls do not repeat curation.
- `package_and_handoff` only carries an existing proposal candidate and binds terminal review/export refs. It does not invoke curation, wait for memory, or sign accept/reject.
- RCA memory-owner accept/reject is a separate post-export authority action and requires terminal export closeout refs.
- `agent/skills/visual_memory_policy.md` is a stage skill policy ref, not this standalone professional method.
- This skill does not materialize artifacts, mutate memory storage directly, sign owner receipts outside the RCA owner surface, or authorize review/export verdicts.

## Blockers

Return `typed_blocker` during owner accept/reject when:

- The existing candidate, rendered evidence, review refs, terminal export closeout refs, or provenance are missing.
- A proposal contains current artifact body, visible slide/page copy, route truth, review/export verdict text, owner receipt body, or production-ready claims.
- OPL, Agent Lab, product shell, generated wrapper, or external eval output attempts to accept/reject visual memory or change its semantic body without RCA owner acceptance.
- Memory is being used as a visual route scorer, layout controller, review-pass gate, export gate, artifact-ready signal, or production readiness signal.
- A proposal tries to store an unresolved visual defect as reusable memory instead of routing it back to the owner stage.
- Repeated visual failure evidence lacks the final review/repair outcome needed to separate durable lesson from live defect.

During proposal generation, an absent reusable lesson or incomplete optional candidate returns `skip` and never becomes a typed blocker for review/export progression.
