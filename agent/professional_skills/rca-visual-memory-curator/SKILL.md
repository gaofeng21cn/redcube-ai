---
name: rca-visual-memory-curator
description: "Use when RedCube AI needs a visual memory curator to review proposed visual-pattern writebacks, accept or reject reusable lessons, and return RCA-owned receipt refs without moving memory authority to OPL."
---

# RCA Visual Memory Curator

Operate as the RCA visual memory curator. Turn review/export evidence into small visual-pattern memory proposals, judge whether each proposal should be accepted or rejected, and return receipt refs for the RCA owner surface. Memory helps future authoring and review attention; it never becomes route truth, hidden layout code, an export gate, or visual authority.

## AI-First / Contract-Light Boundary

- Use AI judgment here for whether a lesson is reusable, stage-scoped, evidence-backed, stale, too broad, or an authority bypass.
- Treat memory descriptors, locator refs, receipts, and `contracts/capability_map.json` as transport and discovery metadata only; they do not decide accept/reject and never contain memory body authority.
- Treat `visual_pack_compiler_handoff` as a carrier for memory proposal refs and accept/reject receipt refs only. It may route memory evidence to this skill, but it must not carry reusable lesson text as authority or decide accept/reject through contract fields.
- Keep memory proposals prose-first and small. Reject attempts to encode visual taste, route scoring, review verdicts, or artifact state as contract data.

## Inputs

- Rendered artifact evidence refs, contact sheets, screenshot review refs, export closeout refs, or owner receipt refs.
- Proposed visual-pattern lesson, deliverable family, stage, audience, style, failure mode, and provenance.
- Current memory descriptor and policy refs:
  - `docs/policies/visual_pattern_memory_policy.md`
  - `agent/skills/visual_memory_policy.md`
  - `agent/quality_gates/review_export_memory.md`
  - `agent/knowledge/review_export_memory.md`
  - `contracts/memory_descriptor.json`

## Outputs

- `visual_memory_writeback_proposal` refs with evidence, scope, provenance, and proposed small-card body.
- `visual_memory_accept_receipt` or `visual_memory_reject_receipt` refs from the RCA owner surface.
- Rejection reasons when the proposal is artifact body, review/export verdict, route logic, stale evidence, or hidden template material.
- Locator/projection refs that OPL may transport without reading or owning the memory body.

## Execution Rules

1. Start from rendered evidence and RCA review/export refs. Do not accept memory based on provider completion, file presence, scores, queue state, or OPL projection alone.
2. Keep each memory card small, prose-first, and stage-scoped. Prefer one reusable lesson over a global rulebook.
3. Accept only reusable visual-pattern lessons: story rhythm, density caveat, style caveat, route caveat, recurring failure mode, or repair expectation.
4. Reject current deliverable body, slide/page text, artifact state, export verdicts, readiness claims, deterministic layout recipes, and hidden templates.
5. Keep authority explicit. RCA owns memory body, accept/reject judgment, owner receipt, and typed blockers; OPL may only transport locator, proposal, receipt, and projection refs.
6. A missing or stale memory ref is usually non-blocking. It is blocking only when someone tries to use memory as review/export/handoff/production authority or to bypass artifact authority.
7. Return typed blockers when evidence is missing, proposal provenance is unverifiable, or accepting the proposal would write visual truth, artifact body, review/export verdict, owner receipt body, or runtime data.

## Contract Foldback Map

- `visual_pack_compiler_handoff`: carries proposal refs, evidence refs, memory locator refs, RCA accept/reject receipt refs, and forbidden-authority flags only.
- Stage-control and generated descriptors: may route memory writeback work to this skill and transport receipt refs after review; they do not accept/reject visual memory and do not own memory body text.
- RCA curator method: owns the flexible accept/reject judgment over reusability, stage scope, stale evidence, provenance, authority bypass, and whether a lesson is too broad for memory.
- Contract surfaces may fail closed on missing provenance or forbidden payload fields; they may not turn a descriptor, score, or operator note into accepted memory.

## Minimal Template Resource

- `memory_proposal_card`: family, stage, audience, reusable pattern, evidence refs, review refs, provenance, scope, and caveat.
- `accept_reject_review`: evidence sufficiency, reusability, authority boundary, stale-risk check, accept/reject verdict ref, and owner receipt ref.
- `writeback_lifecycle`: propose -> RCA accept/reject -> receipt ref -> OPL locator/projection transport -> stage-scoped retrieval.
- `reject_reason`: artifact_body, verdict_body, route_logic, hidden_template, stale_evidence, global_rulebook, unsupported_provenance, or authority_bypass.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `review_and_revision` may propose visual memory from rendered review evidence and repair lessons.
- `package_and_handoff` may include memory receipt refs after RCA accept/reject; it cannot use memory to skip export gates.
- `agent/skills/visual_memory_policy.md` is a stage skill policy ref, not this standalone professional method.
- This skill does not materialize artifacts, mutate memory storage directly, sign owner receipts outside the RCA owner surface, or authorize review/export verdicts.

## Blockers

Return `typed_blocker` when:

- Rendered evidence, review refs, export closeout refs, or provenance are missing.
- A proposal contains current artifact body, visible slide/page copy, route truth, review/export verdict text, owner receipt body, or production-ready claims.
- OPL, Agent Lab, product shell, generated wrapper, or external eval output attempts to accept/reject visual memory or write memory body.
- Memory is being used as a visual route scorer, layout controller, review-pass gate, export gate, artifact-ready signal, or production readiness signal.
