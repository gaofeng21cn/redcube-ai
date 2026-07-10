// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
  getProductEntryManifest,
  invokeProductEntry,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertAllFalse,
  assertEvery,
  assertIds,
  assertPathIncludes,
  assertPathValues,
  emitWorkspaceReceiptProofs,
  list,
} from './surface-fixture-assertions.ts';

const REAL_NO_REGRESSION_REFS = list('rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-a rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-b rca-no-regression:visual-stage:2026-05-28-opl-family-ppt-deck-window2 rca-no-regression:visual-stage:2026-05-28-opl-family-xiaohongshu-window2 rca-no-regression:visual-stage:2026-05-30-opl-family-native-repeat rca-no-regression:visual-stage:2026-05-30-opl-family-xiaohongshu-repeat rca-no-regression:visual-stage:2026-05-31-opl-family-native-repair-to-export-repeat');

test('product-entry evidence scaleout refs stay RCA-owned and refs-only', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const productEntryManifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const domain_action_adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });
    const scaleoutRefs = domain_action_adapter.mapped_surfaces.production_evidence_scaleout_refs;
    const handoff = domain_action_adapter.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff;
    const workorder = domain_action_adapter.mapped_surfaces.production_evidence_tail_workorder;

    assert.deepEqual(scaleoutRefs, productEntryManifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs);
    assertPathValues(scaleoutRefs, {
      surface_kind: 'rca_visual_production_evidence_scaleout_refs',
      'selected_artifact_producing_visual_route.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'selected_artifact_producing_visual_route.html_or_native_route_selected': false,
      'workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed': false,
      'visual_memory_body_reuse_refs.contains_memory_body': false,
      domain_owner_receipt_refs: ['rca-owner-receipt:visual-stage:transition-hosted-domain-receipt'],
      no_regression_evidence_refs: scaleoutRefs.repeated_no_regression_evidence_refs.evidence_refs,
      typed_blocker_refs: list('rca-typed-blocker:controlled-soak:temporal-long-soak-pending rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending rca-typed-blocker:no-regression:cross-family-production-scaleout-pending'),
      required_return_shapes: list('domain_owner_receipt_ref no_regression_evidence_ref owner_chain_ref typed_blocker_ref'),
      payload_path_policy: 'operator_must_choose_success_refs_path_or_domain_owned_typed_blocker_path_empty_template_blocks',
      'accepted_payload_paths.typed_blocker_path.closes_domain_ready': false,
      'naming_tombstone_follow_through_refs.active_caller_compatibility_alias_restored': false,
      'authority_boundary.opl_can_authorize_review_export_verdict': false,
    });
    assert.deepEqual(scaleoutRefs.selected_artifact_producing_visual_route.stage_sequence_refs, list('author_image_pages visual_director_review screenshot_review export_pptx'));
    assert.equal(scaleoutRefs.repeated_no_regression_evidence_refs.evidence_refs.length >= 2, true);
    assert.equal(scaleoutRefs.owner_chain_refs.includes('contracts/production_acceptance/rca-evidence-receipt-fixture.json'), true);
    assertPathValues(handoff, {
      surface_kind: 'rca_opl_expected_receipt_monitor_freshness_handoff',
      status: 'body_free_refs_ready_for_opl_workorder',
      'body_free_owner_receipt_ref.payload_body_included': false,
      'body_free_visual_memory_reuse_ref.payload_body_included': false,
      'monitor_freshness_backfill_refs.monitor_freshness_payload_body_required': false,
      'production_tail_typed_blocker_refs.status': 'linked_not_stage_handoff_payload',
      'production_tail_typed_blocker_refs.blocks_stage_expected_receipt_or_monitor_refs': false,
      'stage_expected_receipt_payload_summary.surface_kind': 'rca_stage_expected_receipt_payload_summary',
      'stage_expected_receipt_payload_summary.accepted_payload_paths_ref': '/operator_evidence_readiness_projection/owner_payload_workorder/accepted_payload_paths',
      'stage_expected_receipt_payload_summary.success_ref_models.runtime_event_ref_model': 'opl_generated_stage_control_descriptor.stages[*].stage_contract.runtime_event_refs',
      'stage_replay_human_gate_blocker_summary.status': 'domain_owned_typed_blocker_refs_ready',
      'stage_replay_human_gate_blocker_summary.missing_ref': 'human_gate:redcube_operator_review_gate',
      'authority_boundary.opl_can_record_expected_receipt_refs': true,
      'authority_boundary.opl_can_record_monitor_freshness_refs': true,
      'authority_boundary.opl_can_write_rca_visual_truth': false,
    });
    assertIds(handoff.stage_expected_receipt_payload_summary.stages, 'stage_id', list('source_intake communication_strategy visual_direction artifact_creation review_and_revision package_and_handoff'));
    assertEvery(
      handoff.stage_expected_receipt_payload_summary.stages,
      (stage) => stage.success_refs_path_payload.runtime_event_refs.length > 0
        && stage.payload_body_allowed === false
        && stage.operator_payload_submitted === false
        && stage.success_refs_visible_is_completion === false
        && stage.domain_readiness_claimed === false
        && stage.authority_boundary.can_create_owner_receipt === false,
      'stage expected receipt payloads are refs-only',
    );
    assertEvery(
      handoff.stage_replay_human_gate_blocker_summary.stages,
      (stage) => stage.missing_ref === 'human_gate:redcube_operator_review_gate'
        && stage.status === 'blocked_by_domain_owned_typed_blocker_ref'
        && stage.target_identity.domain_id === 'redcube_ai'
        && stage.typed_blocker_path_payload.typed_blocker_refs.length === 1
        && stage.human_gate_approval_claimed === false
        && stage.closes_replay_receipt_ref === false
        && stage.authority_boundary.can_requery_human === false,
      'replay human-gate blockers stay domain-owned typed blockers',
    );
    assertPathValues(workorder, {
      surface_kind: 'rca_production_evidence_tail_workorder',
      status: 'open_typed_blocker_workorder',
      payload_body_allowed: false,
      'success_boundary.production_soak_complete_claimed': false,
      'work_items.2.temporal_readiness_refs.long_soak_evidence_action': 'emit_temporal_controlled_visual_stage_long_soak_evidence',
      'work_items.2.temporal_readiness_refs.long_soak_evidence_ref_count': 0,
      'work_items.2.temporal_readiness_refs.production_visual_stage_long_soak_complete': false,
      'authority_boundary.opl_can_write_rca_visual_truth': false,
    });
    assertIds(workorder.work_items, 'item_id', list('owner_chain_apply memory_lifecycle_receipt_scaleout temporal_controlled_visual_stage_long_soak cross_family_repeated_no_regression'));
    assertPathIncludes(domain_action_adapter, {
      'source_manifest_refs.production_evidence_scaleout_refs_ref': '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
      'source_manifest_refs.production_evidence_tail_workorder_ref': '/operator_evidence_readiness_projection/production_evidence_tail_workorder',
    });

    await emitWorkspaceReceiptProofs(dispatchDomainActionAdapter, [
      [workspaceRoot, 'scaleout-surface-receipts'],
      [workspaceRoot, 'scaleout-surface-receipts-repeat'],
    ]);
    const manifestWithReceipts = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const receiptScaleout = manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs;
    assertPathValues(manifestWithReceipts.workspace_receipt_inventory_projection, {
      'scaleout_projection.status': 'workspace_receipt_scaleout_ref_model_ready_more_workspaces_pending',
      'scaleout_projection.receipt_kind_coverage_ready': true,
      'scaleout_projection.required_workspace_count_for_scaleout': 2,
      'scaleout_projection.observed_workspace_count': 1,
      'scaleout_projection.workspace_receipt_scaleout_claimed': false,
      'scaleout_projection.declares_production_soak_complete': false,
      'selected_artifact_producing_visual_route.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'actual_workspace_receipt_refs.refs_visible': true,
      'actual_workspace_receipt_refs.artifact_producing_owner_receipt_refs.length': 2,
    });
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.memory_lifecycle_receipt_refs.length >= 10, true);
    assertPathValues(receiptScaleout, {
      'workspace_receipt_scaleout_refs.observed_workspace_count': 1,
      'workspace_receipt_scaleout_refs.receipt_kind_coverage_ready': true,
      'workspace_receipt_scaleout_refs.emits_owner_receipt_ref': true,
      'workspace_receipt_scaleout_refs.emits_memory_receipt_refs': true,
      'workspace_receipt_scaleout_refs.emits_no_regression_evidence_ref': true,
      'workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed': false,
      'owner_receipt_refs.actual_workspace_receipt_refs_visible': true,
      'workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'visual_memory_body_reuse_refs.projected_body_to_opl': false,
      'visual_memory_body_reuse_refs.reuse_ref_scope': 'visual_pattern_memory_locator_and_content_ref_only',
      'repeated_no_regression_evidence_refs.required_minimum_evidence_ref_count': 6,
      'repeated_no_regression_evidence_refs.real_runtime_evidence_refs': REAL_NO_REGRESSION_REFS,
      'repeated_no_regression_evidence_refs.opl_external_evidence_receipt_ref': 'opl://external-evidence/redcube_ai/rca-cross-family-repeated-no-regression-20260530-6-refs',
      'review_export_verdict_refs.verdict_body_projected_to_opl': false,
      'naming_tombstone_follow_through_refs.status': 'tombstone_follow_through_refs_landed_no_compatibility_alias',
      'authority_boundary.opl_can_write_rca_visual_truth': false,
    });
    assert.deepEqual(receiptScaleout.domain_owner_receipt_refs, [
      'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      ...manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.artifact_producing_owner_receipt_refs,
    ]);
    assert.deepEqual(receiptScaleout.no_regression_evidence_refs, receiptScaleout.repeated_no_regression_evidence_refs.evidence_refs);
    assert.deepEqual(
      receiptScaleout.typed_blocker_refs,
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.production_tail_typed_blocker_refs.blocker_refs,
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.next_evidence_gaps.map((gap) => gap.workorder_item_ref),
      list('/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/2 /operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/1 /operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/3'),
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
    assertPathValues(repeatProof.result_surface, {
      'selected_artifact_producing_visual_route.stage_sequence_refs': list('author_image_pages visual_director_review screenshot_review export_pptx'),
      'selected_artifact_producing_visual_route.produces_artifact_refs': true,
      'selected_artifact_producing_visual_route.contains_artifact_blob': false,
      'actual_workspace_receipt_refs.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'actual_workspace_receipt_refs.review_export_verdict_ref': 'workspace-runtime-ref:review-export:artifact-route',
      'actual_workspace_receipt_refs.declares_exportable': false,
    });
    assert.equal(repeatProof.result_surface.receipt_refs.domain_owner_receipt_ref.startsWith('rca-owner-receipt:'), true);
    assert.equal(repeatProof.result_surface.receipt_refs.no_regression_evidence_ref.startsWith('rca-no-regression:'), true);
    assert.equal(
      repeatProof.result_surface.actual_workspace_receipt_refs.artifact_producing_owner_receipt_ref,
      repeatProof.result_surface.receipt_refs.domain_owner_receipt_ref,
    );
  });
});

test('workspace receipt inventory aggregates refs across two workspaces without claiming production soak', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const firstWorkspaceRoot = await prepareProductEntryWorkspace();
    const secondWorkspaceRoot = await prepareProductEntryWorkspace();
    await emitWorkspaceReceiptProofs(dispatchDomainActionAdapter, [
      [firstWorkspaceRoot, 'scaleout-workspace-a'],
      [firstWorkspaceRoot, 'scaleout-workspace-a-repeat'],
      [secondWorkspaceRoot, 'scaleout-workspace-b'],
      [secondWorkspaceRoot, 'scaleout-workspace-b-repeat'],
    ]);

    const manifest = await getProductEntryManifest({
      workspace_root: firstWorkspaceRoot,
      workspace_receipt_scaleout_roots: [secondWorkspaceRoot, path.join(secondWorkspaceRoot, '.')],
    });
    assertPathValues(manifest.workspace_receipt_inventory_projection, {
      'scaleout_projection.required_workspace_count_for_scaleout': 2,
      'scaleout_projection.observed_workspace_count': 2,
      'scaleout_projection.receipt_kind_coverage_ready': true,
      'scaleout_projection.workspace_receipt_scaleout_claimed': false,
      'scaleout_projection.declares_production_soak_complete': false,
      'actual_workspace_receipt_refs.workspace_receipt_source_refs.length': 2,
    });
    assertAllFalse(manifest.workspace_receipt_inventory_projection, [
      'declares_visual_ready',
      'declares_exportable',
      'declares_handoffable',
      'declares_production_soak_complete',
    ]);
    assert.deepEqual(
      manifest.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs.map(
        (source) => source.valid_receipt_count > 0,
      ),
      [true, true],
    );

    const domain_action_adapter = await exportDomainActionAdapter({
      workspace_root: firstWorkspaceRoot,
      workspace_receipt_scaleout_roots: [secondWorkspaceRoot],
    });
    assertPathValues(domain_action_adapter.mapped_surfaces, {
      'workspace_receipt_inventory_projection.scaleout_projection.observed_workspace_count': 2,
      'production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.observed_workspace_count': 2,
      'production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed': false,
      'workspace_receipt_inventory_projection.scaleout_projection.declares_production_soak_complete': false,
    });
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.workspace_receipt_source_refs.map(
        (source) => source.workspace_root,
      ),
      [path.resolve(firstWorkspaceRoot), path.resolve(secondWorkspaceRoot)],
    );
  });
});

test('product-entry manifest reads explicit workspace receipt scaleout roots', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const firstWorkspaceRoot = await prepareProductEntryWorkspace();
    const secondWorkspaceRoot = await prepareProductEntryWorkspace();

    await invokeProductEntry({
      workspace_locator: { workspace_root: firstWorkspaceRoot },
      entry_session_contract: { entry_session_id: 'session-scaleout-entry' },
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
    await emitWorkspaceReceiptProofs(dispatchDomainActionAdapter, [
      [firstWorkspaceRoot, 'session-scaleout-workspace-a'],
      [firstWorkspaceRoot, 'session-scaleout-workspace-a-repeat'],
      [secondWorkspaceRoot, 'session-scaleout-workspace-b'],
      [secondWorkspaceRoot, 'session-scaleout-workspace-b-repeat'],
    ]);

    const manifest = await getProductEntryManifest({
      workspace_root: firstWorkspaceRoot,
      workspace_receipt_scaleout_roots: [secondWorkspaceRoot],
    });
    assertPathValues(manifest, {
      surface_kind: 'product_entry_manifest',
      'workspace_receipt_inventory_projection.scaleout_projection.observed_workspace_count': 2,
      'workspace_receipt_inventory_projection.scaleout_projection.receipt_kind_coverage_ready': true,
      'workspace_receipt_inventory_projection.scaleout_projection.workspace_receipt_scaleout_claimed': false,
      'workspace_receipt_inventory_projection.scaleout_projection.declares_production_soak_complete': false,
      'workspace_receipt_inventory_projection.implements_opl_workbench': false,
      'workspace_receipt_inventory_projection.declares_visual_ready': false,
      'workspace_receipt_inventory_projection.declares_exportable': false,
      'workspace_receipt_inventory_projection.workspace_locator.workspace_receipt_scaleout_roots': [path.resolve(secondWorkspaceRoot)],
    });
  });
});

test('workspace receipt inventory excludes invalid-only roots from observed scaleout evidence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const validWorkspaceRoot = await prepareProductEntryWorkspace();
    const invalidOnlyWorkspaceRoot = await prepareProductEntryWorkspace();
    await emitWorkspaceReceiptProofs(dispatchDomainActionAdapter, [
      [validWorkspaceRoot, 'scaleout-valid-workspace'],
      [validWorkspaceRoot, 'scaleout-valid-workspace-repeat'],
    ]);

    const invalidReceiptRoot = path.join(invalidOnlyWorkspaceRoot, '.redcube', 'runtime', 'receipts');
    mkdirSync(invalidReceiptRoot, { recursive: true });
    writeFileSync(path.join(invalidReceiptRoot, 'invalid.json'), '{', 'utf-8');

    const manifest = await getProductEntryManifest({
      workspace_root: validWorkspaceRoot,
      workspace_receipt_scaleout_roots: [invalidOnlyWorkspaceRoot],
    });
    assertPathValues(manifest.workspace_receipt_inventory_projection, {
      'scaleout_projection.observed_workspace_count': 1,
      'scaleout_projection.receipt_kind_coverage_ready': false,
      'scaleout_projection.workspace_receipt_scaleout_claimed': false,
      'scaleout_projection.declares_production_soak_complete': false,
      'receipt_counts.invalid': 1,
      'actual_workspace_receipt_refs.workspace_receipt_source_refs.1.valid_receipt_count': 0,
      'actual_workspace_receipt_refs.workspace_receipt_source_refs.1.invalid_receipt_count': 1,
    });
  });
});
