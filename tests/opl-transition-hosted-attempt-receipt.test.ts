// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  assertReceiptOnlyHostedAttemptProjection,
  buildHostedAttemptBridgeFixture,
  dispatchProductSidecar,
  exportProductSidecar,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  reconcileHostedAttemptReceipt,
  test,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

test('OPL transition hosted attempt bridge reconciles RCA receipt refs only', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const sidecar = await exportProductSidecar({ workspace_root: workspaceRoot });
    const transitionResult = {
      surface_kind: 'family_transition_result',
      status: 'transition_applied',
      domain_id: 'redcube_ai',
      current_state: 'review_and_revision',
      event: 'domain_tick',
      next_state: 'package_and_handoff',
      transition_id: 'review_ready_to_package',
      next_work_unit: null,
      owner_route: {
        owner: 'redcube_ai',
        route_ref: 'rca-visual-transition:review_ready_to_package',
        action_refs: ['export_or_return_typed_blocker'],
      },
      human_gate: null,
      typed_blocker: null,
      dead_letter_intent: null,
      receipt: {
        surface_kind: 'family_transition_receipt',
        receipt_id: 'ftr-review-ready-to-package',
        spec_id: 'rca.visual_transition_spec.v1',
        domain_id: 'redcube_ai',
        transition_id: 'review_ready_to_package',
        current_state: 'review_and_revision',
        event: 'domain_tick',
        receipt_refs: ['family-transition-receipt:review-ready-to-package'],
        context_refs: ['opl-provider-attempt:fixture-review-ready'],
      },
      projection: {
        surface_kind: 'family_transition_projection',
        spec_id: 'rca.visual_transition_spec.v1',
        domain_id: 'redcube_ai',
        current_state: 'review_and_revision',
        event: 'domain_tick',
        next_state: 'package_and_handoff',
        status: 'transition_applied',
        transition_id: 'review_ready_to_package',
        owner_route: {
          owner: 'redcube_ai',
          route_ref: 'rca-visual-transition:review_ready_to_package',
          action_refs: ['export_or_return_typed_blocker'],
        },
        receipt_refs: ['family-transition-receipt:review-ready-to-package'],
      },
      authority_boundary: {
        opl_can_write_visual_truth: false,
        opl_can_authorize_visual_ready: false,
        opl_can_authorize_exportable: false,
        opl_can_authorize_handoffable: false,
        visual_export_verdict_owner: 'redcube_ai',
      },
    };
    const bridgeFixture = await buildHostedAttemptBridgeFixture({
      visualTransitionSpec: manifest.visual_transition_spec,
      sidecarVisualTransitionSpec: sidecar.mapped_surfaces.visual_transition_spec,
      transitionResult,
    });
    assert.equal(bridgeFixture.transition_result_ref, 'family_transition_matrix_result:rca.visual_transition_spec.v1:review_ready_to_package');
    assert.equal(bridgeFixture.transition_result_status, 'transition_applied');
    assert.deepEqual(bridgeFixture.transition_result_receipt_refs, ['family-transition-receipt:review-ready-to-package']);
    assert.equal(bridgeFixture.owner_route_ref, 'rca-visual-transition:review_ready_to_package');
    assert.equal(bridgeFixture.owner_action, 'export_or_return_typed_blocker');

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
    const domainProjection = await reconcileHostedAttemptReceipt({
      bridgeFixture,
      sidecarResult: domainReceipt,
    });
    assert.deepEqual(domainProjection, {
      bridge_kind: 'repo_local_opl_provider_attempt_bridge_fixture',
      consumed_surface: 'redcube product manifest#/visual_transition_spec',
      transition_result_ref: 'family_transition_matrix_result:rca.visual_transition_spec.v1:review_ready_to_package',
      transition_result_status: 'transition_applied',
      transition_result_receipt_refs: ['family-transition-receipt:review-ready-to-package'],
      owner_route_ref: 'rca-visual-transition:review_ready_to_package',
      provider_attempt_ref: 'opl-provider-attempt:fixture-review-ready',
      transition_id: 'review_ready_to_package',
      from_stage: 'review_and_revision',
      to_stage: 'package_and_handoff',
      owner_action: 'export_or_return_typed_blocker',
      sidecar_return_shape: 'domain_receipt',
      domain_owner_receipt_ref: 'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      typed_blocker: null,
      no_regression_evidence_ref: null,
      visual_ready: false,
      exportable: false,
      handoffable: false,
      production_soak_complete: false,
    });
    await assertReceiptOnlyHostedAttemptProjection(domainProjection);

    const blockedReceipt = await dispatchProductSidecar({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'transition-hosted-blocker',
        attempt_ref: bridgeFixture.provider_attempt_ref,
      },
    });
    const blockerProjection = await reconcileHostedAttemptReceipt({
      bridgeFixture,
      sidecarResult: blockedReceipt,
    });
    assert.deepEqual(blockerProjection.typed_blocker, {
      blocker_ref: 'rca-typed-blocker:domain_owner_receipt_missing_required_refs:transition-hosted-blocker',
      blocker_kind: 'domain_owner_receipt_missing_required_refs',
      owner: 'redcube_ai',
      next_required_owner_action: 'provide_rca_owned_attempt_artifact_memory_lifecycle_review_and_forbidden_write_refs',
    });
    assert.equal(blockerProjection.visual_ready, false);
    assert.equal(blockerProjection.exportable, false);
    assert.equal(blockerProjection.handoffable, false);
    assert.equal(blockerProjection.production_soak_complete, false);
    assert.equal(blockerProjection.sidecar_return_shape, 'typed_blocker');
    await assertReceiptOnlyHostedAttemptProjection(blockerProjection);

    const noRegression = await dispatchProductSidecar({
      task: {
        action: 'emit_no_regression_evidence',
        workspace_root: workspaceRoot,
        evidence_id: 'transition-hosted-no-regression',
      },
    });
    const noRegressionProjection = await reconcileHostedAttemptReceipt({
      bridgeFixture,
      sidecarResult: noRegression,
    });
    assert.deepEqual(noRegressionProjection, {
      bridge_kind: 'repo_local_opl_provider_attempt_bridge_fixture',
      consumed_surface: 'redcube product manifest#/visual_transition_spec',
      transition_result_ref: 'family_transition_matrix_result:rca.visual_transition_spec.v1:review_ready_to_package',
      transition_result_status: 'transition_applied',
      transition_result_receipt_refs: ['family-transition-receipt:review-ready-to-package'],
      owner_route_ref: 'rca-visual-transition:review_ready_to_package',
      provider_attempt_ref: 'opl-provider-attempt:fixture-review-ready',
      transition_id: 'review_ready_to_package',
      from_stage: 'review_and_revision',
      to_stage: 'package_and_handoff',
      owner_action: 'export_or_return_typed_blocker',
      sidecar_return_shape: 'no_regression_evidence',
      domain_owner_receipt_ref: null,
      typed_blocker: null,
      no_regression_evidence_ref: 'rca-no-regression:visual-stage:transition-hosted-no-regression',
      visual_ready: false,
      exportable: false,
      handoffable: false,
      production_soak_complete: false,
    });
    await assertReceiptOnlyHostedAttemptProjection(noRegressionProjection);

    await assert.rejects(
      () => buildHostedAttemptBridgeFixture({
        visualTransitionSpec: manifest.visual_transition_spec,
        sidecarVisualTransitionSpec: sidecar.mapped_surfaces.visual_transition_spec,
        transitionResult: {
          ...transitionResult,
          next_state: 'visual_ready',
        },
      }),
      /transition result next_state 与 visual_transition_spec to_stage 不一致/,
    );

    await assert.rejects(
      () => reconcileHostedAttemptReceipt({
        bridgeFixture,
        sidecarResult: {
          result_surface: {
            return_shape: 'domain_receipt',
            receipt_ref: 'rca-owner-receipt:visual-stage:bad-ready-claim',
            coverage: {
              visual_ready_claimed: true,
            },
          },
        },
      }),
      /RCA sidecar result 不得声明 coverage\.visual_ready_claimed/,
    );
  });
});
