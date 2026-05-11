# RCA Domain Memory Descriptor And Migration Locator

Owner: `RedCube AI`
Purpose: define the RCA-owned descriptor, migration plan, seed fixture locator, and writeback receipt locator boundary for visual pattern memory consumed by OPL-family surfaces.
State: `active reference`
Machine boundary: executable truth is `redcube product manifest#/domain_memory_descriptor_locator`, `contracts/runtime-program/opl-family-contract-adoption.json#/domain_agent_skeleton_adapter/domain_memory_descriptor_locator`, and `contracts/runtime-program/current-program.json#/current_state/active_baton/scope/domain_memory_descriptor_locator`.

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

It expresses the flow for reusable visual lessons without storing lesson bodies in the repo:

- discover candidate lessons from workspace/runtime root, product-entry session, `visual_director_review`, `screenshot_review`, export closeout, or a human reference;
- extract a reusable pattern-card candidate outside repo-tracked artifact blobs;
- record a seed fixture locator ref;
- let RCA review the candidate as accepted or rejected for memory writeback;
- publish an RCA-owned memory locator ref when accepted;
- emit a locator-only writeback receipt ref.

Acceptance gates require candidates to exclude current deliverable content, review/export verdicts, and canonical artifact blobs. The repo tracks the migration plan and seed locator contract only; it does not track memory entries, receipt instances, PNG/PPTX/PDF artifacts, route truth changes, or visual truth changes.

## Seed Fixture And Receipt Locators

`rca.visual_pattern_memory.seed_fixture_locator.v1` is a locator-only seed fixture contract. It can describe a candidate source through fields such as `seed_id`, `source_review_ref`, `stage_scope`, `deliverable_family`, `reusable_lesson_ref`, `provenance_refs`, and `migration_status`.

Forbidden seed fields include memory content bodies, generated slide/page content, visual verdicts, export verdicts, and canonical artifact blobs.

`rca.visual_pattern_memory.writeback_receipt_locator.v1` points to writeback receipt refs. Receipt instances remain runtime/domain-memory state, not repo-tracked source.

## Authority

RCA remains authority for:

- visual route truth;
- visual pattern memory content;
- review/export verdicts;
- canonical artifact content and export bundles.

OPL remains a locator/ref/receipt consumer for orchestration and projection.
