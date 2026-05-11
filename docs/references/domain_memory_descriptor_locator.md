# RCA Domain Memory Descriptor Locator

Owner: `RedCube AI`
Purpose: define the RCA-owned descriptor and locator boundary for visual pattern memory consumed by OPL-family surfaces.
State: `active reference`
Machine boundary: executable truth is `redcube product manifest#/domain_memory_descriptor_locator` and `contracts/runtime-program/opl-family-contract-adoption.json#/domain_agent_skeleton_adapter/domain_memory_descriptor_locator`.

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

## Authority

RCA remains authority for:

- visual route truth;
- visual pattern memory content;
- review/export verdicts;
- canonical artifact content and export bundles.

OPL remains a locator/ref/receipt consumer for orchestration and projection.
