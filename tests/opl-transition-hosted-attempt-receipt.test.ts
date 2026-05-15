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
} from './product-domain-action-case-shared.ts';

function buildHostedAttemptBridgeFixture({ visualTransitionSpec, sidecarVisualTransitionSpec }) {
  const transition = visualTransitionSpec.transition_table.find(
    (entry) => entry.transition_id === 'review_ready_to_package',
  );
  assert.ok(transition);
  assert.equal(sidecarVisualTransitionSpec.ref, '/visual_transition_spec');
  assert.equal(sidecarVisualTransitionSpec.spec_id, visualTransitionSpec.spec_id);
  assert.equal(sidecarVisualTransitionSpec.transition_count, visualTransitionSpec.transition_table.length);
  assert.equal(transition.owner_action, 'export_or_return_typed_blocker');
  assert.equal(visualTransitionSpec.runner_boundary.opl_can_declare_visual_ready, false);
  assert.equal(visualTransitionSpec.runner_boundary.opl_can_declare_exportable, false);

  return {
    bridge_kind: 'repo_local_opl_provider_attempt_bridge_fixture',
    consumed_surface: 'redcube product manifest#/visual_transition_spec',
    transition_id: transition.transition_id,
    from_stage: transition.from_stage,
    to_stage: transition.to_stage,
    provider_attempt_ref: 'opl-provider-attempt:fixture-review-ready',
  };
}

function reconcileHostedAttemptReceipt({ bridgeFixture, sidecarResult }) {
  const resultSurface = sidecarResult.result_surface;
  const projection = {
    bridge_kind: bridgeFixture.bridge_kind,
    consumed_surface: bridgeFixture.consumed_surface,
    provider_attempt_ref: bridgeFixture.provider_attempt_ref,
    transition_id: bridgeFixture.transition_id,
    from_stage: bridgeFixture.from_stage,
    to_stage: bridgeFixture.to_stage,
    domain_owner_receipt_ref: null,
    typed_blocker: null,
    no_regression_evidence_ref: null,
    visual_ready: false,
    exportable: false,
    handoffable: false,
    production_soak_complete: false,
  };

  if (resultSurface.return_shape === 'domain_receipt') {
    projection.domain_owner_receipt_ref = resultSurface.receipt_ref;
  } else if (resultSurface.return_shape === 'typed_blocker') {
    projection.typed_blocker = {
      blocker_ref: resultSurface.blocker_ref,
      blocker_kind: resultSurface.blocker_kind,
      owner: resultSurface.owner,
      next_required_owner_action: resultSurface.next_required_owner_action,
    };
  } else if (resultSurface.return_shape === 'no_regression_evidence') {
    projection.no_regression_evidence_ref = resultSurface.evidence_ref;
  } else {
    throw new Error(`Unsupported RCA receipt return shape: ${resultSurface.return_shape}`);
  }

  return projection;
}

function assertReceiptOnlyProjection(projection) {
  const filledFields = [
    projection.domain_owner_receipt_ref,
    projection.typed_blocker,
    projection.no_regression_evidence_ref,
  ].filter(Boolean);

  assert.equal(filledFields.length, 1);
  assert.equal(projection.visual_ready, false);
  assert.equal(projection.exportable, false);
  assert.equal(projection.handoffable, false);
  assert.equal(projection.production_soak_complete, false);
}

test('OPL transition hosted attempt bridge reconciles RCA receipt refs only', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const sidecar = await exportProductSidecar({ workspace_root: workspaceRoot });
    const bridgeFixture = buildHostedAttemptBridgeFixture({
      visualTransitionSpec: manifest.visual_transition_spec,
      sidecarVisualTransitionSpec: sidecar.mapped_surfaces.visual_transition_spec,
    });

    const domainReceipt = await dispatchProductSidecar({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'transition-hosted-domain-receipt',
        attempt_ref: bridgeFixture.provider_attempt_ref,
        artifact_locator_ref: '/artifact_locator_contract',
        memory_receipt_ref: 'rca-memory-receipt:visual-pattern:transition-accepted',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:retention:transition-retention',
        review_export_ref: 'workspace-runtime-ref:review-export:transition-run',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
      },
    });
    const domainProjection = reconcileHostedAttemptReceipt({
      bridgeFixture,
      sidecarResult: domainReceipt,
    });
    assert.deepEqual(domainProjection, {
      bridge_kind: 'repo_local_opl_provider_attempt_bridge_fixture',
      consumed_surface: 'redcube product manifest#/visual_transition_spec',
      provider_attempt_ref: 'opl-provider-attempt:fixture-review-ready',
      transition_id: 'review_ready_to_package',
      from_stage: 'review_and_revision',
      to_stage: 'package_and_handoff',
      domain_owner_receipt_ref: 'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      typed_blocker: null,
      no_regression_evidence_ref: null,
      visual_ready: false,
      exportable: false,
      handoffable: false,
      production_soak_complete: false,
    });
    assertReceiptOnlyProjection(domainProjection);

    const blockedReceipt = await dispatchProductSidecar({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'transition-hosted-blocker',
        attempt_ref: bridgeFixture.provider_attempt_ref,
      },
    });
    const blockerProjection = reconcileHostedAttemptReceipt({
      bridgeFixture,
      sidecarResult: blockedReceipt,
    });
    assert.deepEqual(blockerProjection.typed_blocker, {
      blocker_ref: 'rca-typed-blocker:domain_owner_receipt_missing_required_refs:transition-hosted-blocker',
      blocker_kind: 'domain_owner_receipt_missing_required_refs',
      owner: 'redcube_ai',
      next_required_owner_action: 'provide_rca_owned_attempt_artifact_memory_lifecycle_review_and_forbidden_write_refs',
    });
    assertReceiptOnlyProjection(blockerProjection);

    const noRegression = await dispatchProductSidecar({
      task: {
        action: 'emit_no_regression_evidence',
        workspace_root: workspaceRoot,
        evidence_id: 'transition-hosted-no-regression',
      },
    });
    const noRegressionProjection = reconcileHostedAttemptReceipt({
      bridgeFixture,
      sidecarResult: noRegression,
    });
    assert.deepEqual(noRegressionProjection, {
      bridge_kind: 'repo_local_opl_provider_attempt_bridge_fixture',
      consumed_surface: 'redcube product manifest#/visual_transition_spec',
      provider_attempt_ref: 'opl-provider-attempt:fixture-review-ready',
      transition_id: 'review_ready_to_package',
      from_stage: 'review_and_revision',
      to_stage: 'package_and_handoff',
      domain_owner_receipt_ref: null,
      typed_blocker: null,
      no_regression_evidence_ref: 'rca-no-regression:visual-stage:transition-hosted-no-regression',
      visual_ready: false,
      exportable: false,
      handoffable: false,
      production_soak_complete: false,
    });
    assertReceiptOnlyProjection(noRegressionProjection);
  });
});
