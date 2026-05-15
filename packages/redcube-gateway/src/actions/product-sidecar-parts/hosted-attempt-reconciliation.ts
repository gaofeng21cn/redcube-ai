// @ts-nocheck
const DEFAULT_TRANSITION_ID = 'review_ready_to_package';
const BRIDGE_KIND = 'repo_local_opl_provider_attempt_bridge_fixture';
const CONSUMED_SURFACE = 'redcube product manifest#/visual_transition_spec';

export function buildHostedAttemptBridgeFixture({
  visualTransitionSpec,
  sidecarVisualTransitionSpec,
  transitionId = DEFAULT_TRANSITION_ID,
  providerAttemptRef = 'opl-provider-attempt:fixture-review-ready',
}) {
  const transition = visualTransitionSpec?.transition_table?.find(
    (entry) => entry.transition_id === transitionId,
  );
  if (!transition) {
    throw new Error(`visual_transition_spec 缺少 transition: ${transitionId}`);
  }
  if (sidecarVisualTransitionSpec?.ref !== '/visual_transition_spec') {
    throw new Error('product sidecar 未映射 /visual_transition_spec');
  }
  if (sidecarVisualTransitionSpec.spec_id !== visualTransitionSpec.spec_id) {
    throw new Error('product sidecar visual_transition_spec spec_id 与 manifest 不一致');
  }
  if (sidecarVisualTransitionSpec.transition_count !== visualTransitionSpec.transition_table.length) {
    throw new Error('product sidecar visual_transition_spec transition_count 与 manifest 不一致');
  }
  if (transition.owner_action !== 'export_or_return_typed_blocker') {
    throw new Error(`transition ${transitionId} owner_action 不允许: ${transition.owner_action}`);
  }
  if (visualTransitionSpec.runner_boundary?.opl_can_declare_visual_ready !== false) {
    throw new Error('OPL hosted attempt 不得声明 visual_ready');
  }
  if (visualTransitionSpec.runner_boundary?.opl_can_declare_exportable !== false) {
    throw new Error('OPL hosted attempt 不得声明 exportable');
  }

  return {
    bridge_kind: BRIDGE_KIND,
    consumed_surface: CONSUMED_SURFACE,
    transition_id: transition.transition_id,
    from_stage: transition.from_stage,
    to_stage: transition.to_stage,
    provider_attempt_ref: providerAttemptRef,
  };
}

export function reconcileHostedAttemptReceipt({ bridgeFixture, sidecarResult }) {
  const resultSurface = sidecarResult?.result_surface;
  if (!resultSurface?.return_shape) {
    throw new Error('RCA sidecar result 缺少 result_surface.return_shape');
  }

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

export function isReceiptOnlyHostedAttemptProjection(projection) {
  const filledFields = [
    projection?.domain_owner_receipt_ref,
    projection?.typed_blocker,
    projection?.no_regression_evidence_ref,
  ].filter(Boolean);

  return (
    filledFields.length === 1
    && projection.visual_ready === false
    && projection.exportable === false
    && projection.handoffable === false
    && projection.production_soak_complete === false
  );
}

export function assertReceiptOnlyHostedAttemptProjection(projection) {
  if (!isReceiptOnlyHostedAttemptProjection(projection)) {
    throw new Error('hosted attempt projection 只能对账 receipt/blocker/evidence ref，不能授权完成态');
  }
}
