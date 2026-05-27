# RCA domain memory descriptor 与迁移 locator

Owner: `RedCube AI`
Purpose: `domain_memory_descriptor_locator_support`
State: `active_support`
Machine boundary: 人读 contract-linked reference。机器真相继续归 OPL generated/default product manifest surface、RCA `redcube domain-handler export` source refs、`/domain_memory_descriptor_locator`、`/controlled_memory_apply_proof`、`/controlled_memory_apply_proof/runtime_receipt_instances`、`/workspace_receipt_inventory_projection`、`contracts/runtime-program/current-program.json`、source/tests、workspace runtime memory state 和 RCA-owned receipts。

Lifecycle note: 本文只解释 RCA-owned visual pattern memory descriptor、migration plan、seed fixture locator、writeback proposal、accept/reject command、writeback receipt locator、controlled apply proof、runtime receipt refs 和 operator receipt projection 边界。当前 readout 分两层读取：`visual_pattern_memory_writeback.status=descriptor_proof_contract_landed_runtime_writeback_pending` 仍表示 descriptor / proposal / accept-reject 合同已落地但不声明 memory body migration 完成；`controlled_memory_apply_proof/runtime_receipt_instances` 与 `workspace_receipt_inventory_projection` 已能显示 accepted / rejected visual memory receipt refs 和 lifecycle receipt refs。它们都是 body-free refs-only runtime receipts，不写 memory body、artifact blob、review/export verdict 或 production soak completion。本文不承担 active plan；下一步顺序和 evidence tail 回到 [RCA 理想目标态差距与完善计划](../active/rca-ideal-state-gap-plan.md)。

## 边界

Visual pattern memory is RCA domain knowledge. It can guide source readiness, story architecture, visual authorship, review overlay, and delivery packaging, but it does not own visual route selection, review/export verdicts, publication projection, or canonical artifacts.

OPL may consume:

- memory locator refs;
- memory provenance refs;
- writeback receipt refs.

OPL must not store memory content, choose the RCA visual route, accept/reject memory writeback, issue review/export verdicts, write owner receipt bodies, or mutate canonical artifacts.

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

`rca.visual_pattern_memory.operator_receipt_projection.v1` is the operator-facing read model for writeback status. OPL may display or index this projection ref, but it cannot make the decision, store memory content, or write receipt bodies.

## Controlled Stage Attempt Proof

`rca.controlled_visual_stage_attempt.fixture.v1` proves the review/revision/export portion of a visual stage attempt through descriptor refs only. The direct RedCube skill path and OPL-hosted path share the same descriptor refs, product domain_handler refs, and quality refs. OPL consumes those refs for queue/projection/receipt behavior; RCA keeps the visual truth, review/export verdicts, and artifact authority.

`rca.visual_pattern_memory.controlled_apply_proof.v1` is the landed controlled apply proof. It exposes consumed visual pattern memory refs, a locator-only writeback proposal projection, accepted/rejected receipt projection cases, accepted/rejected runtime receipt refs, and a no-forbidden-write audit. It intentionally excludes memory content bodies, slide/page content, review/export verdicts, visual truth, canonical artifact blobs, and live receipt bodies from repo source.

This proof closes the repo-source/audit and receipt-ref part of the memory apply lane. Runtime receipt refs are now visible through `redcube domain-handler export` and the workspace receipt inventory projection, while real reusable visual lesson body migration, receipt body storage, and domain-owned memory body writeback remain runtime/domain-memory responsibilities outside repo-tracked source. Receipt refs and 5-workspace / 30-receipt scaleout evidence do not declare production visual-stage soak complete, visual ready, exportable, handoffable, domain ready, or artifact authority.

## Authority

RCA remains authority for:

- visual route truth;
- visual pattern memory content;
- review/export verdicts;
- canonical artifact content and export bundles.

OPL remains a locator/ref/receipt consumer for orchestration and projection.
