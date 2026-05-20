// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  dispatchProductSidecar,
  exportProductSidecar,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

test('product-entry evidence scaleout refs stay RCA-owned and refs-only', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const sidecar = await exportProductSidecar({ workspace_root: workspaceRoot });

    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.surface_kind,
      'rca_visual_production_evidence_scaleout_refs',
    );
    assert.deepEqual(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.stage_sequence_refs,
      [
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.html_or_native_route_selected,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.contains_memory_body,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs.length >= 2,
      true,
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.naming_tombstone_follow_through_refs.active_caller_compatibility_alias_restored,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.production_evidence_scaleout_refs.authority_boundary.opl_can_authorize_review_export_verdict,
      false,
    );
    assert.equal(
      sidecar.source_manifest_refs.production_evidence_scaleout_refs_ref,
      '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.surface_kind,
      'rca_opl_expected_receipt_monitor_freshness_handoff',
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.status,
      'body_free_refs_ready_for_opl_workorder',
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.body_free_owner_receipt_ref.payload_body_included,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.body_free_visual_memory_reuse_ref.payload_body_included,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.monitor_freshness_backfill_refs.monitor_freshness_payload_body_required,
      false,
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_record_expected_receipt_refs,
      true,
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_record_monitor_freshness_refs,
      true,
    );
    assert.equal(
      sidecar.mapped_surfaces.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_write_rca_visual_truth,
      false,
    );
    assert.equal(
      sidecar.source_manifest_refs.opl_expected_receipt_monitor_freshness_handoff_ref,
      '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff',
    );

    await dispatchProductSidecar({
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
    await dispatchProductSidecar({
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
      2,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_cadence,
      'repeated_family_refs_only',
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
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.typed_blocker_backfill_refs.blocker_refs,
      [
        'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
        'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
        'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
      ],
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.opl_payload_policy.payload_body_allowed,
      false,
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.opl_expected_receipt_monitor_freshness_handoff.authority_boundary.opl_can_claim_visual_stage_soak_complete,
      false,
    );

    const repeatProof = await dispatchProductSidecar({
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
