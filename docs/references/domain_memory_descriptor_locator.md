# RCA Domain Memory Descriptor And Migration Locator

Owner: `RedCube AI`
Purpose: define the RCA-owned descriptor, migration plan, seed fixture locator, writeback proposal, accept/reject command, writeback receipt locator, and operator receipt projection boundary for visual pattern memory consumed by OPL-family surfaces.
State: `active reference`
Machine boundary: executable truth is `redcube product manifest#/domain_memory_descriptor_locator`, `contracts/runtime-program/opl-family-contract-adoption.json#/standard_domain_agent_skeleton/domain_memory_descriptor_locator`, and `contracts/runtime-program/current-program.json#/current_state/active_baton/scope/domain_memory_descriptor_locator`.

## Boundary

Visual pattern memory is RCA domain knowledge. It can guide source readiness, story architecture, visual authorship, review overlay, and delivery packaging, but it does not own visual route selection, review/export verdicts, publication projection, or canonical artifacts.

OPL may consume:

- memory locator refs;
- memory provenance refs;
- writeback receipt refs.

OPL must not store memory content, choose the RCA visual route, issue review/export verdicts, or mutate canonical artifacts.

## Descriptor Shape

The descriptor is intentionally small:

- `descriptor_id`: `rca.visual_pattern_memory.descriptor.v1`
- `locator_id`: `rca.visual_pattern_memory.locator.v1`
- `memory_family`: `visual_pattern_memory`
- `memory_model`: `natural_language_pattern_cards`
- `policy_ref`: `docs/policies/visual_pattern_memory_policy.md`

Locator refs are RCA-owned references such as `rca-memory:visual-pattern:*` or `human_doc:visual_pattern_memory:*`. Writeback receipts only record receipt metadata and source refs; memory content remains RCA-owned.

## Migration Plan

The landed repo-source migration surface is `rca.visual_pattern_memory.migration_plan.v1`.

It expresses the flow for reusable visual lessons without storing lesson bodies, receipt instances, or artifact blobs in the repo:

- discover candidate lessons from workspace/runtime root, product-entry session, `visual_director_review`, `screenshot_review`, export closeout, or a human reference;
- extract a reusable pattern-card candidate outside repo-tracked artifact blobs;
- record a seed fixture locator ref;
- generate a locator-only writeback proposal;
- let RCA run the accept/reject command;
- publish an RCA-owned memory locator ref when accepted;
- emit a locator-only writeback receipt ref;
- project an operator-visible receipt status without exposing memory content or visual/export verdicts.

Acceptance gates require candidates to exclude current deliverable content, review/export verdicts, and canonical artifact blobs. The repo tracks the migration plan and seed locator contract only; it does not track memory entries, receipt instances, PNG/PPTX/PDF artifacts, route truth changes, or visual truth changes.

## Seed Fixture And Receipt Locators

`rca.visual_pattern_memory.seed_fixture_locator.v1` is a locator-only seed fixture contract. It can describe a candidate source through fields such as `seed_id`, `source_review_ref`, `stage_scope`, `deliverable_family`, `reusable_lesson_ref`, `provenance_refs`, and `migration_status`.

Forbidden seed fields include memory content bodies, generated slide/page content, visual verdicts, export verdicts, and canonical artifact blobs.

`rca.visual_pattern_memory.writeback_receipt_locator.v1` points to writeback receipt refs. Receipt instances remain runtime/domain-memory state, not repo-tracked source.

`rca.visual_pattern_memory.writeback_proposal_generator.v1` defines the candidate proposal shape. It records proposal ids, seed refs, source review refs, stage scope, deliverable family, candidate memory refs, provenance refs, and a recommended decision. It explicitly forbids memory content bodies, generated page content, review/export verdicts, and canonical artifact blobs.

`rca.visual_pattern_memory.accept_reject.v1` is the RCA-owned decision command contract. It accepts only `accepted` or `rejected`, outputs locator refs, and writes any real domain-memory result outside repo-tracked source.

`rca.visual_pattern_memory.operator_receipt_projection.v1` is the operator-facing read model for writeback status. OPL may display or index this projection ref, but it cannot make the decision, store memory content, or write receipt instances.

## Controlled Stage Attempt Proof

`rca.controlled_visual_stage_attempt.fixture.v1` proves the review/revision/export portion of a visual stage attempt through descriptor refs only. The direct RedCube skill path and OPL-hosted path share the same descriptor refs, product sidecar refs, and quality refs. OPL consumes those refs for queue/projection/receipt behavior; RCA keeps the visual truth, review/export verdicts, and artifact authority.

## Authority

RCA remains authority for:

- visual route truth;
- visual pattern memory content;
- review/export verdicts;
- canonical artifact content and export bundles.

OPL remains a locator/ref/receipt consumer for orchestration and projection.
