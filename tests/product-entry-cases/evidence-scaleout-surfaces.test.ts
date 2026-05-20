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
  });
});
