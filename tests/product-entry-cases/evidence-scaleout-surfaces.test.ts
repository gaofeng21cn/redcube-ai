// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
  getProductEntrySession,
  getProductEntryManifest,
  invokeProductEntry,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REAL_NO_REGRESSION_REFS = [
  'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-a',
  'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-b',
  'rca-no-regression:visual-stage:2026-05-28-opl-family-ppt-deck-window2',
  'rca-no-regression:visual-stage:2026-05-28-opl-family-xiaohongshu-window2',
  'rca-no-regression:visual-stage:2026-05-30-opl-family-native-repeat',
  'rca-no-regression:visual-stage:2026-05-30-opl-family-xiaohongshu-repeat',
];

test('product-entry evidence scaleout refs stay RCA-owned and refs-only', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const productEntryManifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const domain_action_adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });

    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.surface_kind,
      'rca_visual_production_evidence_scaleout_refs',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.stage_sequence_refs,
      [
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.html_or_native_route_selected,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.contains_memory_body,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs.length >= 2,
      true,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.domain_owner_receipt_refs,
      [
        'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      ],
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.no_regression_evidence_refs,
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.typed_blocker_refs,
      [
        'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
        'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
        'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
      ],
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_chain_refs.includes(
        'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
      ),
      true,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.required_return_shapes,
      [
        'domain_owner_receipt_ref',
        'no_regression_evidence_ref',
        'owner_chain_ref',
        'typed_blocker_ref',
      ],
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.payload_path_policy,
      'operator_must_choose_success_refs_path_or_domain_owned_typed_blocker_path_empty_template_blocks',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.accepted_payload_paths.success_refs_path.required_any_operator_payload_refs,
      [
        'domain_owner_receipt_refs',
        'no_regression_evidence_refs',
        'owner_chain_refs',
      ],
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.accepted_payload_paths.typed_blocker_path.required_operator_payload_refs,
      ['typed_blocker_refs'],
    );
    assert.equal(
      'legacy_payload_field_aliases' in domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_payload_item_summary.surface_kind,
      'rca_owner_payload_item_summary',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_payload_item_summary.work_items.map(
        (item) => item.item_id,
      ),
      [
        'owner_chain_apply',
        'memory_lifecycle_receipt_scaleout',
        'temporal_controlled_visual_stage_long_soak',
        'cross_family_repeated_no_regression',
      ],
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_payload_item_summary.work_items[0].current_payload_template,
      {
        domain_owner_receipt_refs: [],
        no_regression_evidence_refs: [],
        owner_chain_refs: [],
        typed_blocker_refs: [],
      },
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_payload_item_summary.accepted_payload_paths_ref,
      '/operator_evidence_readiness_projection/production_evidence_scaleout_refs/accepted_payload_paths',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_payload_item_summary.work_items[1].typed_blocker_path_payload,
      {
        typed_blocker_refs: ['rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending'],
      },
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.owner_payload_item_summary.work_items.every(
        (item) => item.payload_body_allowed === false
          && item.operator_payload_submitted === false
          && item.success_refs_visible_is_completion === false
          && item.domain_readiness_claimed === false
          && item.authority_boundary.can_write_domain_truth === false,
      ),
      true,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.domain_receipt_refs,
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.domain_owner_receipt_refs,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.no_regression_refs,
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.no_regression_evidence_refs,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.accepted_payload_paths.typed_blocker_path.closes_domain_ready,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.naming_tombstone_follow_through_refs.active_caller_compatibility_alias_restored,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.authority_boundary.opl_can_authorize_review_export_verdict,
      false,
    );
    assert.equal(
      domain_action_adapter.source_manifest_refs.production_evidence_scaleout_refs_ref,
      '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.surface_kind,
      'rca_opl_expected_receipt_monitor_freshness_handoff',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.status,
      'body_free_refs_ready_for_opl_workorder',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.body_free_owner_receipt_ref.payload_body_included,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.body_free_visual_memory_reuse_ref.payload_body_included,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.monitor_freshness_backfill_refs.monitor_freshness_payload_body_required,
      false,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.opl_payload_policy.forbidden_payload_classes,
      [
        'visual truth body',
        'review or export verdict body',
        'artifact blob',
        'generic runtime state',
        'memory body',
        'retired managed runtime compatibility alias negative guard field',
      ],
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.opl_payload_policy.allowed_payload_ref_groups.includes(
        'typed_blocker_backfill_refs',
      ),
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.production_tail_typed_blocker_refs.status,
      'linked_not_stage_handoff_payload',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.production_tail_typed_blocker_refs.blocks_stage_expected_receipt_or_monitor_refs,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.surface_kind,
      'rca_stage_expected_receipt_payload_summary',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.stages.map(
        (stage) => stage.stage_id,
      ),
      [
        'source_intake',
        'communication_strategy',
        'visual_direction',
        'artifact_creation',
        'review_and_revision',
        'package_and_handoff',
      ],
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.stages[0].current_payload_template,
      {
        domain_receipt_refs: [],
        monitor_freshness_refs: [],
        runtime_event_refs: [],
        typed_blocker_refs: [],
      },
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.accepted_payload_paths_ref,
      '/operator_evidence_readiness_projection/owner_payload_workorder/accepted_payload_paths',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.stage_ids,
      [
        'source_intake',
        'communication_strategy',
        'visual_direction',
        'artifact_creation',
        'review_and_revision',
        'package_and_handoff',
      ],
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.success_ref_models.runtime_event_ref_model,
      'family_stage_control_plane.stages[*].stage_contract.runtime_event_refs',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.success_ref_models.source_runtime_event_ref,
      '/family_stage_control_plane/stages/<stage-id>/stage_contract/runtime_event_refs',
    );
    const stageRuntimeEventRefs = new Map(
      productEntryManifest.family_stage_control_plane.stages.map((stage) => [
        stage.stage_id,
        stage.stage_contract.runtime_event_refs,
      ]),
    );
    for (const stage of domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.stages) {
      assert.deepEqual(
        stage.success_refs_path_payload.runtime_event_refs,
        stageRuntimeEventRefs.get(stage.stage_id),
      );
    }
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.stage_expected_receipt_payload_summary.stages.every(
        (stage) => stage.payload_body_allowed === false
          && stage.operator_payload_submitted === false
          && stage.success_refs_visible_is_completion === false
          && stage.domain_readiness_claimed === false
          && stage.authority_boundary.can_create_owner_receipt === false,
      ),
      true,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_record_expected_receipt_refs,
      true,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_record_monitor_freshness_refs,
      true,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_write_rca_visual_truth,
      false,
    );
    assert.equal(
      domain_action_adapter.source_manifest_refs.opl_expected_receipt_monitor_freshness_handoff_ref,
      '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.surface_kind,
      'rca_production_evidence_tail_workorder',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.status,
      'open_typed_blocker_workorder',
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.work_items.map((item) => item.item_id),
      [
        'owner_chain_apply',
        'memory_lifecycle_receipt_scaleout',
        'temporal_controlled_visual_stage_long_soak',
        'cross_family_repeated_no_regression',
      ],
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.payload_body_allowed,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.success_boundary.production_soak_complete_claimed,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.authority_boundary.opl_can_write_rca_visual_truth,
      false,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder.forbidden_payload_classes,
      [
        'visual_truth_body',
        'review_export_verdict_body',
        'export_verdict_body',
        'artifact_blob',
        'artifact_body',
        'visual_memory_body',
        'memory_body',
        'generic_runtime_state',
        'generic_attempt_ledger_record',
        'runtime_queue_state',
      ],
    );
    assert.equal(
      domain_action_adapter.source_manifest_refs.production_evidence_tail_workorder_ref,
      '/operator_evidence_readiness_projection/production_evidence_tail_workorder',
    );

    await dispatchDomainActionAdapter({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'scaleout-surface-receipts',
        attempt_ref: 'workspace-runtime-ref:attempt:scaleout-run',
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: 'workspace-runtime-ref:review-export:scaleout-run',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: ['workspace-runtime-ref:artifact:scaleout-slide'],
      },
    });
    await dispatchDomainActionAdapter({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'scaleout-surface-receipts-repeat',
        attempt_ref: 'workspace-runtime-ref:attempt:scaleout-run-repeat',
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: 'workspace-runtime-ref:review-export:scaleout-run-repeat',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: ['workspace-runtime-ref:artifact:scaleout-slide-repeat'],
      },
    });

    const manifestWithReceipts = await getProductEntryManifest({ workspace_root: workspaceRoot });

    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.scaleout_projection.status,
      'workspace_receipt_scaleout_ref_model_ready_more_workspaces_pending',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.scaleout_projection.receipt_kind_coverage_ready,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.scaleout_projection.required_workspace_count_for_scaleout,
      2,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.scaleout_projection.observed_workspace_count,
      1,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.scaleout_projection.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.scaleout_projection.declares_production_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.refs_visible,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.artifact_producing_owner_receipt_refs.length,
      2,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.memory_lifecycle_receipt_refs.length >= 10,
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.source_refs.some(
        (source) => source.source_id === 'production_evidence_scaleout_refs'
          && source.evidence_receipt_fixture_ref === 'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
      ),
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.observed_workspace_count,
      1,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.receipt_kind_coverage_ready,
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.emits_owner_receipt_ref,
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.emits_memory_receipt_refs,
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.emits_no_regression_evidence_ref,
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.owner_receipt_refs.actual_workspace_receipt_refs_visible,
      true,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.domain_owner_receipt_refs,
      [
        'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
        ...manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.artifact_producing_owner_receipt_refs,
      ],
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.owner_chain_refs.includes(
        manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_inventory_ref,
      ),
      true,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.no_regression_evidence_refs,
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.typed_blocker_refs,
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.production_tail_typed_blocker_refs.blocker_refs,
    );
    const memoryPayloadItem =
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs
        .owner_payload_item_summary.work_items.find(
          (item) => item.item_id === 'memory_lifecycle_receipt_scaleout',
        );
    assert.equal(
      memoryPayloadItem.success_refs_path_payload.owner_chain_refs.some(
        (ref) => ref.startsWith('rca-memory-receipt:visual-pattern:'),
      ),
      true,
    );
    assert.equal(memoryPayloadItem.success_refs_visible_is_completion, false);
    const visualDirectionStage =
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff
        .stage_expected_receipt_payload_summary.stages.find((stage) => stage.stage_id === 'visual_direction');
    assert.deepEqual(
      visualDirectionStage.success_refs_path_payload.runtime_event_refs,
      ['runtime_event:rca.visual_direction.accepted'],
    );
    assert.deepEqual(
      visualDirectionStage.typed_blocker_path_payload.typed_blocker_refs,
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.typed_blocker_refs,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.accepted_payload_paths.success_refs_path.closes_domain_ready,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.projected_body_to_opl,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.reuse_ref_scope,
      'visual_pattern_memory_locator_and_content_ref_only',
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.required_minimum_evidence_ref_count,
      6,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.real_runtime_evidence_refs,
      REAL_NO_REGRESSION_REFS,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.opl_external_evidence_receipt_ref,
      'opl://external-evidence/redcube_ai/rca-cross-family-repeated-no-regression-20260530-6-refs',
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_cadence,
      'cross_route_cross_window_repeated_refs_only',
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.review_export_verdict_refs.verdict_body_projected_to_opl,
      false,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.deliverable_family_refs,
      ['ppt_deck', 'xiaohongshu'],
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.naming_tombstone_follow_through_refs.status,
      'tombstone_follow_through_refs_landed_no_compatibility_alias',
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.authority_boundary.opl_can_write_rca_visual_truth,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.source_refs.some(
        (source) => source.source_id === 'opl_expected_receipt_monitor_freshness_handoff'
          && source.status === 'body_free_refs_ready_for_opl_workorder',
      ),
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.body_free_workspace_receipt_ref.observed_workspace_count,
      1,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.body_free_workspace_receipt_ref.receipt_kind_coverage_ready,
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.body_free_owner_receipt_ref.receipt_ref,
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.owner_receipt_refs.receipt_ref,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.production_tail_typed_blocker_refs.blocker_refs,
      [
        'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
        'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
        'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
      ],
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.production_tail_typed_blocker_refs.blocks_stage_expected_receipt_or_monitor_refs,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.opl_payload_policy.payload_body_allowed,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_claim_visual_stage_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.source_refs.some(
        (source) => source.source_id === 'production_evidence_tail_workorder'
          && source.workorder_id === 'rca.production_evidence_tail_workorder.v1',
      ),
      true,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items[1].receipt_accounting_refs.observed_receipt_count,
      manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.total,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items[2].temporal_readiness_refs.production_visual_stage_long_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items.every(
        (item) => item.success_claims_allowed === false && item.payload_body_allowed === false,
      ),
      true,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.next_evidence_gaps.map(
        (gap) => gap.workorder_item_ref,
      ),
      [
        '/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/2',
        '/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/1',
        '/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/3',
      ],
    );

    const repeatProof = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'scaleout-surface-artifact-route',
        attempt_ref: 'workspace-runtime-ref:attempt:artifact-route',
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: 'workspace-runtime-ref:review-export:artifact-route',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: ['workspace-runtime-ref:artifact:artifact-route-slide'],
      },
    });
    assert.deepEqual(repeatProof.result_surface.selected_artifact_producing_visual_route.stage_sequence_refs, [
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]);
    assert.equal(repeatProof.result_surface.selected_artifact_producing_visual_route.produces_artifact_refs, true);
    assert.equal(repeatProof.result_surface.selected_artifact_producing_visual_route.contains_artifact_blob, false);
    assert.equal(repeatProof.result_surface.receipt_refs.domain_owner_receipt_ref.startsWith('rca-owner-receipt:'), true);
    assert.equal(repeatProof.result_surface.receipt_refs.no_regression_evidence_ref.startsWith('rca-no-regression:'), true);
    assert.equal(
      repeatProof.result_surface.actual_workspace_receipt_refs.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      repeatProof.result_surface.actual_workspace_receipt_refs.artifact_producing_owner_receipt_ref,
      repeatProof.result_surface.receipt_refs.domain_owner_receipt_ref,
    );
    assert.equal(
      repeatProof.result_surface.actual_workspace_receipt_refs.review_export_verdict_ref,
      'workspace-runtime-ref:review-export:artifact-route',
    );
    assert.equal(repeatProof.result_surface.actual_workspace_receipt_refs.declares_exportable, false);
  });
});

test('workspace receipt inventory aggregates refs across two workspaces without claiming production soak', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const firstWorkspaceRoot = await prepareProductEntryWorkspace();
    const secondWorkspaceRoot = await prepareProductEntryWorkspace();

    for (const [workspaceRoot, proofId] of [
      [firstWorkspaceRoot, 'scaleout-workspace-a'],
      [firstWorkspaceRoot, 'scaleout-workspace-a-repeat'],
      [secondWorkspaceRoot, 'scaleout-workspace-b'],
      [secondWorkspaceRoot, 'scaleout-workspace-b-repeat'],
    ]) {
      await dispatchDomainActionAdapter({
        task: {
          action: 'emit_workspace_receipt_proof',
          workspace_root: workspaceRoot,
          proof_id: proofId,
          attempt_ref: `workspace-runtime-ref:attempt:${proofId}`,
          artifact_locator_ref: '/artifact_locator_contract',
          review_export_ref: `workspace-runtime-ref:review-export:${proofId}`,
          forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
          artifact_refs: [`workspace-runtime-ref:artifact:${proofId}`],
        },
      });
    }

    const manifest = await getProductEntryManifest({
      workspace_root: firstWorkspaceRoot,
      workspace_receipt_scaleout_roots: [
        secondWorkspaceRoot,
        path.join(secondWorkspaceRoot, '.'),
      ],
    });
    const scaleout = manifest.workspace_receipt_inventory_projection.scaleout_projection;

    assert.equal(scaleout.required_workspace_count_for_scaleout, 2);
    assert.equal(scaleout.observed_workspace_count, 2);
    assert.equal(scaleout.receipt_kind_coverage_ready, true);
    assert.equal(scaleout.workspace_receipt_scaleout_claimed, false);
    assert.equal(scaleout.declares_production_soak_complete, false);
    assert.equal(manifest.workspace_receipt_inventory_projection.declares_visual_ready, false);
    assert.equal(manifest.workspace_receipt_inventory_projection.declares_exportable, false);
    assert.equal(manifest.workspace_receipt_inventory_projection.declares_handoffable, false);
    assert.equal(manifest.workspace_receipt_inventory_projection.declares_production_soak_complete, false);
    assert.equal(
      manifest.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs.length,
      2,
    );
    assert.deepEqual(
      manifest.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs.map(
        (source) => source.valid_receipt_count > 0,
      ),
      [true, true],
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.observed_workspace_count,
      2,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.declares_production_soak_complete,
      false,
    );

    const domain_action_adapter = await exportDomainActionAdapter({
      workspace_root: firstWorkspaceRoot,
      workspace_receipt_scaleout_roots: [secondWorkspaceRoot],
    });
    assert.equal(
      domain_action_adapter.mapped_surfaces.workspace_receipt_inventory_projection.scaleout_projection.observed_workspace_count,
      2,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.observed_workspace_count,
      2,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.workspace_receipt_inventory_projection.scaleout_projection.declares_production_soak_complete,
      false,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs.map(
        (source) => source.workspace_root,
      ),
      [path.resolve(firstWorkspaceRoot), path.resolve(secondWorkspaceRoot)],
    );
  });
});

test('product-entry session reads explicit workspace receipt scaleout roots without becoming the generic session owner', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const firstWorkspaceRoot = await prepareProductEntryWorkspace();
    const secondWorkspaceRoot = await prepareProductEntryWorkspace();

    await invokeProductEntry({
      workspace_locator: {
        workspace_root: firstWorkspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-scaleout-entry',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
        title: 'Receipt scaleout session',
        goal: 'Keep session inventory refs aligned with manifest scaleout roots.',
        stop_after_stage: 'storyline',
      },
    });

    for (const [workspaceRoot, proofId] of [
      [firstWorkspaceRoot, 'session-scaleout-workspace-a'],
      [firstWorkspaceRoot, 'session-scaleout-workspace-a-repeat'],
      [secondWorkspaceRoot, 'session-scaleout-workspace-b'],
      [secondWorkspaceRoot, 'session-scaleout-workspace-b-repeat'],
    ]) {
      await dispatchDomainActionAdapter({
        task: {
          action: 'emit_workspace_receipt_proof',
          workspace_root: workspaceRoot,
          proof_id: proofId,
          attempt_ref: `workspace-runtime-ref:attempt:${proofId}`,
          artifact_locator_ref: '/artifact_locator_contract',
          review_export_ref: `workspace-runtime-ref:review-export:${proofId}`,
          forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
          artifact_refs: [`workspace-runtime-ref:artifact:${proofId}`],
        },
      });
    }

    const session = await getProductEntrySession({
      entry_session_id: 'session-scaleout-entry',
      workspace_receipt_scaleout_roots: [secondWorkspaceRoot],
    });
    const scaleout = session.workspace_receipt_inventory_projection.scaleout_projection;

    assert.equal(session.surface_kind, 'product_entry_session');
    assert.equal(session.entry_session.entry_session_id, 'session-scaleout-entry');
    assert.equal(scaleout.observed_workspace_count, 2);
    assert.equal(scaleout.receipt_kind_coverage_ready, true);
    assert.equal(scaleout.workspace_receipt_scaleout_claimed, false);
    assert.equal(scaleout.declares_production_soak_complete, false);
    assert.equal(session.workspace_receipt_inventory_projection.implements_opl_workbench, false);
    assert.equal(session.workspace_receipt_inventory_projection.declares_visual_ready, false);
    assert.equal(session.workspace_receipt_inventory_projection.declares_exportable, false);
    assert.deepEqual(
      session.workspace_receipt_inventory_projection.workspace_locator.workspace_receipt_scaleout_roots,
      [path.resolve(secondWorkspaceRoot)],
    );
  });
});

test('workspace receipt inventory excludes invalid-only roots from observed scaleout evidence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const validWorkspaceRoot = await prepareProductEntryWorkspace();
    const invalidOnlyWorkspaceRoot = await prepareProductEntryWorkspace();

    for (const proofId of [
      'scaleout-valid-workspace',
      'scaleout-valid-workspace-repeat',
    ]) {
      await dispatchDomainActionAdapter({
        task: {
          action: 'emit_workspace_receipt_proof',
          workspace_root: validWorkspaceRoot,
          proof_id: proofId,
          attempt_ref: `workspace-runtime-ref:attempt:${proofId}`,
          artifact_locator_ref: '/artifact_locator_contract',
          review_export_ref: `workspace-runtime-ref:review-export:${proofId}`,
          forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
          artifact_refs: [`workspace-runtime-ref:artifact:${proofId}`],
        },
      });
    }

    const invalidReceiptRoot = path.join(invalidOnlyWorkspaceRoot, '.redcube', 'runtime', 'receipts');
    mkdirSync(invalidReceiptRoot, { recursive: true });
    writeFileSync(path.join(invalidReceiptRoot, 'invalid.json'), '{', 'utf-8');

    const manifest = await getProductEntryManifest({
      workspace_root: validWorkspaceRoot,
      workspace_receipt_scaleout_roots: [invalidOnlyWorkspaceRoot],
    });
    const scaleout = manifest.workspace_receipt_inventory_projection.scaleout_projection;

    assert.equal(scaleout.observed_workspace_count, 1);
    assert.equal(scaleout.receipt_kind_coverage_ready, false);
    assert.equal(scaleout.workspace_receipt_scaleout_claimed, false);
    assert.equal(scaleout.declares_production_soak_complete, false);
    assert.equal(manifest.workspace_receipt_inventory_projection.receipt_counts.invalid, 1);
    assert.equal(
      manifest.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs[1].valid_receipt_count,
      0,
    );
    assert.equal(
      manifest.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs[1].invalid_receipt_count,
      1,
    );
  });
});
