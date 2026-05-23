// @ts-nocheck
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import {
  dispatchProductSidecar,
  exportProductSidecar,
  getProductEntryManifest,
  getProductSidecarGuardedActionMetadata,
  prepareProductEntryWorkspace,
  SERIAL_ENV_TEST,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

function assertNoForbiddenBodyFields(surface) {
  const serialized = JSON.stringify(surface);
  for (const forbidden of [
    'visual_truth_body',
    'artifact_body',
    'artifact_blob',
    'memory_content_body',
    'review_export_verdict_body',
    'quality_verdict',
    'export_verdict',
  ]) {
    assert.equal(serialized.includes(`"${forbidden}"`), false, `${forbidden} must not be projected`);
  }
}

function validCloseoutTask(workspaceRoot, overrides = {}) {
  return {
    action: 'emit_external_work_order_owner_closeout',
    workspace_root: workspaceRoot,
    work_order_id: 'oma_developer_patch_work_order_5a1b68cacbd4',
    execution_receipt_ref: 'agent-lab-work-order-execution-receipt:oma_developer_patch_work_order_5a1b68cacbd4',
    absorbed_head_ref: 'git:commit:3bfe35fdd7357a93d230745bd792a42e08e71808',
    patch_absorption_ref: 'patch-absorption:redcube_ai/oma_developer_patch_work_order_5a1b68cacbd4/source-patch',
    worktree_cleanup_ref: 'worktree-cleanup:redcube_ai/oma_developer_patch_work_order_5a1b68cacbd4/source-patch',
    no_forbidden_write_refs: [
      'no_target_domain_truth_write_proof',
      'repo_hygiene_no_checkout_venv_proof',
    ],
    target_verification_refs: [
      'target-verification:redcube-ai/typecheck',
      'target-verification:redcube-ai/test-fast',
      'target-verification:redcube-ai/targeted-efficiency-tests',
    ],
    agent_lab_reevaluation_ref: 'agent-lab-reevaluation:redcube-ai.efficiency-observability.standard.v1:oals_b791d2d8bbf5481d14024a8d',
    changed_file_refs: [
      'contracts/production_acceptance/rca-efficiency-handoff-projection.json',
      'tests/rca-efficiency-handoff-projection.test.ts',
    ],
    ...overrides,
  };
}

test('RCA manifest and sidecar expose external work-order owner closeout as an owner-owned refs-only action', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const sidecar = await exportProductSidecar({ workspace_root: workspaceRoot });
    const metadata = await getProductSidecarGuardedActionMetadata();

    assert.equal(
      metadata.guardedActionIds.includes('emit_external_work_order_owner_closeout'),
      true,
    );
    const guardedAction = metadata.guardedActions.find(
      (entry) => entry.action === 'emit_external_work_order_owner_closeout',
    );
    assert.equal(guardedAction.effect, 'guarded_owner_closeout_no_regression_or_typed_blocker');
    assert.deepEqual(guardedAction.required_fields, [
      'workspace_root',
      'work_order_id',
      'execution_receipt_ref',
      'absorbed_head_ref',
      'target_verification_refs',
      'no_forbidden_write_refs',
    ]);

    const sidecarAction = manifest.family_action_catalog.actions.find(
      (entry) => entry.action_id === 'dispatch_product_sidecar',
    );
    assert.equal(
      sidecarAction.authority_boundary.allowed_actions.includes('emit_external_work_order_owner_closeout'),
      true,
    );
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.action, 'emit_external_work_order_owner_closeout');
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.owner, 'redcube_ai');
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.refs_only, true);
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.allowed_return_shapes.includes('no_regression_evidence'), true);
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.allowed_return_shapes.includes('typed_blocker'), true);
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.authority_boundary.opl_can_write_rca_visual_truth, false);
    assert.equal(manifest.domain_owner_receipt_contract.external_work_order_owner_closeout.authority_boundary.opl_can_authorize_quality_or_export, false);
    assert.equal(
      manifest.no_regression_owner_receipt_opl_consumption_proof.guarded_actions.some(
        (entry) => entry.action === 'emit_external_work_order_owner_closeout'
          && entry.expected_return_shapes.includes('no_regression_evidence')
          && entry.expected_return_shapes.includes('typed_blocker'),
      ),
      true,
    );

    assert.equal(
      sidecar.mapped_surfaces.external_work_order_owner_closeout.action,
      'emit_external_work_order_owner_closeout',
    );
    assert.equal(sidecar.mapped_surfaces.external_work_order_owner_closeout.owner, 'redcube_ai');
    assert.equal(sidecar.mapped_surfaces.external_work_order_owner_closeout.refs_only, true);
    assert.equal(sidecar.mapped_surfaces.external_work_order_owner_closeout.writes_visual_truth, false);
    assert.equal(sidecar.mapped_surfaces.external_work_order_owner_closeout.writes_artifact_body, false);
    assert.equal(sidecar.mapped_surfaces.external_work_order_owner_closeout.writes_memory_body, false);
    assert.equal(sidecar.mapped_surfaces.external_work_order_owner_closeout.authorizes_quality_or_export, false);
    assert.equal(
      sidecar.source_manifest_refs.external_work_order_owner_closeout_ref,
      '/domain_owner_receipt_contract/external_work_order_owner_closeout',
    );
  });
});

test('RCA owner closeout returns refs-only no-regression evidence for absorbed external work orders', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const result = await dispatchProductSidecar({
      task: validCloseoutTask(workspaceRoot),
    });

    assert.equal(result.ok, true);
    assert.equal(result.action, 'emit_external_work_order_owner_closeout');
    assert.equal(result.result_surface.surface_kind, 'external_work_order_owner_closeout');
    assert.equal(result.result_surface.return_shape, 'no_regression_evidence');
    assert.equal(result.result_surface.owner, 'redcube_ai');
    assert.equal(
      result.result_surface.evidence_ref,
      'rca-no-regression:external-work-order:oma_developer_patch_work_order_5a1b68cacbd4',
    );
    assert.equal(
      result.result_surface.runtime_locator_ref,
      'workspace-runtime-ref:external-work-order-owner-closeout:oma_developer_patch_work_order_5a1b68cacbd4',
    );
    assert.equal(result.result_surface.closeout_refs.execution_receipt_ref, 'agent-lab-work-order-execution-receipt:oma_developer_patch_work_order_5a1b68cacbd4');
    assert.equal(result.result_surface.closeout_refs.absorbed_head_ref, 'git:commit:3bfe35fdd7357a93d230745bd792a42e08e71808');
    assert.deepEqual(result.result_surface.closeout_refs.target_verification_refs, [
      'target-verification:redcube-ai/typecheck',
      'target-verification:redcube-ai/test-fast',
      'target-verification:redcube-ai/targeted-efficiency-tests',
    ]);
    assert.deepEqual(result.result_surface.closeout_refs.no_forbidden_write_refs, [
      'no_target_domain_truth_write_proof',
      'repo_hygiene_no_checkout_venv_proof',
    ]);
    assert.equal(result.result_surface.coverage.required_refs_present, true);
    assert.equal(result.result_surface.coverage.absorbed_patch_verified, true);
    assert.equal(result.result_surface.coverage.no_forbidden_write_refs_present, true);
    assert.equal(result.result_surface.coverage.visual_ready_claimed, false);
    assert.equal(result.result_surface.coverage.exportable_claimed, false);
    assert.equal(result.result_surface.coverage.quality_verdict_authorized, false);
    assert.equal(result.result_surface.coverage.visual_truth_written, false);
    assert.equal(result.result_surface.coverage.artifact_body_written, false);
    assert.equal(result.result_surface.coverage.memory_body_written, false);
    assert.equal(result.result_surface.authority_boundary.rca_owns_closeout_evidence, true);
    assert.equal(result.result_surface.authority_boundary.opl_can_store_closeout_ref, true);
    assert.equal(result.result_surface.authority_boundary.opl_can_write_rca_visual_truth, false);
    assert.equal(result.result_surface.authority_boundary.opl_can_authorize_quality_or_export, false);
    assert.equal(result.result_surface.repository_boundary.repo_tracks_live_closeout_instance, false);
    assert.equal(result.result_surface.repository_boundary.repo_tracks_visual_truth, false);
    assert.equal(result.result_surface.repository_boundary.repo_tracks_artifact_body, false);
    assert.equal(result.result_surface.repository_boundary.repo_tracks_memory_body, false);
    assertNoForbiddenBodyFields(result.result_surface);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/owner-closeout/external-work-orders/oma_developer_patch_work_order_5a1b68cacbd4.json`),
      true,
    );
  });
});

test('RCA owner closeout returns typed blockers for insufficient or forbidden external work-order evidence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const missing = await dispatchProductSidecar({
      task: {
        action: 'emit_external_work_order_owner_closeout',
        workspace_root: workspaceRoot,
        work_order_id: 'oma_developer_patch_work_order_5a1b68cacbd4',
        execution_receipt_ref: 'agent-lab-work-order-execution-receipt:oma_developer_patch_work_order_5a1b68cacbd4',
      },
    });
    assert.equal(missing.result_surface.surface_kind, 'typed_blocker');
    assert.equal(missing.result_surface.return_shape, 'typed_blocker');
    assert.equal(missing.result_surface.owner, 'redcube_ai');
    assert.equal(missing.result_surface.blocker_kind, 'external_work_order_owner_closeout_missing_required_refs');
    assert.deepEqual(missing.result_surface.missing_required_fields, [
      'absorbed_head_ref',
      'target_verification_refs',
      'no_forbidden_write_refs',
    ]);
    assert.equal(missing.result_surface.visual_ready_claimed, false);
    assert.equal(missing.result_surface.exportable_claimed, false);
    assert.equal(missing.result_surface.writes_visual_truth, false);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/owner-closeout/external-work-orders/oma_developer_patch_work_order_5a1b68cacbd4.json`),
      false,
    );

    const forbidden = await dispatchProductSidecar({
      task: validCloseoutTask(workspaceRoot, {
        work_order_id: 'forbidden-body-work-order',
        visual_truth_body: { slides: [] },
        artifact_body: 'forbidden artifact payload',
        memory_content_body: 'forbidden memory payload',
        review_export_verdict_body: { exportable: true },
      }),
    });
    assert.equal(forbidden.result_surface.surface_kind, 'typed_blocker');
    assert.equal(forbidden.result_surface.blocker_kind, 'external_work_order_owner_closeout_forbidden_payload_fields');
    assert.deepEqual(forbidden.result_surface.forbidden_payload_fields, [
      'artifact_body',
      'memory_content_body',
      'review_export_verdict_body',
      'visual_truth_body',
    ]);
    assert.equal(forbidden.result_surface.payload_body_allowed, false);
    assert.equal(forbidden.result_surface.visual_ready_claimed, false);
    assert.equal(forbidden.result_surface.exportable_claimed, false);
    assert.equal(forbidden.result_surface.handoffable_claimed, false);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/owner-closeout/external-work-orders/forbidden-body-work-order.json`),
      false,
    );
  });
});
