// @ts-nocheck
const DEFAULT_TRANSITION_ID = 'review_ready_to_package';
const BRIDGE_KIND = 'repo_local_opl_provider_attempt_bridge_fixture';
const CONSUMED_SURFACE = 'opl_generated:product_entry_manifest#/visual_transition_spec';
const DOMAIN_ID = 'redcube_ai';
const DOMAIN_TICK_EVENT = 'domain_tick';
const FORBIDDEN_COMPLETION_CLAIM_FIELDS = new Set([
  'visual_ready',
  'exportable',
  'handoffable',
  'production_soak_complete',
  'production_soak_success',
  'visual_ready_claimed',
  'exportable_claimed',
  'handoffable_claimed',
  'long_visual_soak_claimed',
  'opl_completion_promoted_to_visual_ready',
]);
const FORBIDDEN_TRANSITION_PAYLOAD_FIELDS = new Set([
  'visual_truth',
  'visual_verdict',
  'review_verdict',
  'export_verdict',
  'canonical_artifact_blob',
  'artifact_blob',
  'memory_content_body',
  'png_blob',
  'pptx_blob',
  'pdf_blob',
]);

function safeText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function inspectObjectFields(value, visitor, path = []) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectObjectFields(item, visitor, path.concat(String(index))));
    return;
  }

  Object.entries(value).forEach(([key, nested]) => {
    const nestedPath = path.concat(key);
    visitor(key, nested, nestedPath.join('.'));
    inspectObjectFields(nested, visitor, nestedPath);
  });
}

function assertNoForbiddenCompletionClaims(surface, label) {
  let claimed = null;
  inspectObjectFields(surface, (key, value, path) => {
    if (!claimed && FORBIDDEN_COMPLETION_CLAIM_FIELDS.has(key) && value === true) {
      claimed = path;
    }
  });
  if (claimed) {
    throw new Error(`${label} 不得声明 ${claimed}`);
  }
}

function assertNoForbiddenTransitionPayload(surface) {
  let forbidden = null;
  inspectObjectFields(surface, (key, value, path) => {
    if (!forbidden && FORBIDDEN_TRANSITION_PAYLOAD_FIELDS.has(key) && value != null) {
      forbidden = path;
    }
  });
  if (forbidden) {
    throw new Error(`transition result 不得携带 ${forbidden}`);
  }
}

function defaultTransitionResult({ visualTransitionSpec, transition, providerAttemptRef }) {
  return {
    surface_kind: 'family_transition_result',
    status: 'transition_applied',
    domain_id: DOMAIN_ID,
    current_state: transition.from_stage,
    event: DOMAIN_TICK_EVENT,
    next_state: transition.to_stage,
    transition_id: transition.transition_id,
    next_work_unit: null,
    owner_route: {
      owner: DOMAIN_ID,
      route_ref: `rca-visual-transition:${transition.transition_id}`,
      action_refs: [transition.owner_action],
    },
    human_gate: null,
    typed_blocker: null,
    dead_letter_intent: null,
    receipt: {
      surface_kind: 'family_transition_receipt',
      receipt_id: `rca-visual-transition:${transition.transition_id}:fixture-receipt`,
      spec_id: visualTransitionSpec.spec_id,
      domain_id: DOMAIN_ID,
      transition_id: transition.transition_id,
      current_state: transition.from_stage,
      event: DOMAIN_TICK_EVENT,
      receipt_refs: [`family_transition:${transition.transition_id}:${providerAttemptRef}`],
      context_refs: [providerAttemptRef],
    },
    projection: {
      surface_kind: 'family_transition_projection',
      spec_id: visualTransitionSpec.spec_id,
      domain_id: DOMAIN_ID,
      current_state: transition.from_stage,
      event: DOMAIN_TICK_EVENT,
      next_state: transition.to_stage,
      status: 'transition_applied',
      transition_id: transition.transition_id,
      owner_route: {
        owner: DOMAIN_ID,
        route_ref: `rca-visual-transition:${transition.transition_id}`,
        action_refs: [transition.owner_action],
      },
      receipt_refs: [`family_transition:${transition.transition_id}:${providerAttemptRef}`],
      action_refs: [transition.owner_action],
    },
    authority_boundary: {
      opl_can_write_visual_truth: false,
      opl_can_authorize_visual_ready: false,
      opl_can_authorize_exportable: false,
      opl_can_authorize_handoffable: false,
      visual_export_verdict_owner: DOMAIN_ID,
    },
  };
}

function assertTransitionResultMatchesSpec({
  transitionResult,
  visualTransitionSpec,
  transition,
  providerAttemptRef,
}) {
  if (transitionResult?.surface_kind !== 'family_transition_result') {
    throw new Error('transition result 必须是 family_transition_result');
  }
  if (transitionResult.status !== 'transition_applied') {
    throw new Error(`transition result status 不允许: ${transitionResult.status}`);
  }
  if (transitionResult.domain_id !== DOMAIN_ID) {
    throw new Error(`transition result domain_id 不允许: ${transitionResult.domain_id}`);
  }
  if (transitionResult.event !== DOMAIN_TICK_EVENT) {
    throw new Error(`transition result event 不允许: ${transitionResult.event}`);
  }
  if (transitionResult.transition_id !== transition.transition_id) {
    throw new Error('transition result transition_id 与 visual_transition_spec 不一致');
  }
  if (transitionResult.current_state !== transition.from_stage) {
    throw new Error('transition result current_state 与 visual_transition_spec from_stage 不一致');
  }
  if (transitionResult.next_state !== transition.to_stage) {
    throw new Error('transition result next_state 与 visual_transition_spec to_stage 不一致');
  }
  if (transitionResult.owner_route?.owner !== DOMAIN_ID) {
    throw new Error('transition result owner_route.owner 必须仍为 redcube_ai');
  }
  if (!transitionResult.owner_route?.action_refs?.includes(transition.owner_action)) {
    throw new Error('transition result owner_route.action_refs 缺少 visual_transition_spec owner_action');
  }
  if (transitionResult.receipt?.spec_id !== visualTransitionSpec.spec_id) {
    throw new Error('transition result receipt.spec_id 与 visual_transition_spec spec_id 不一致');
  }
  if (transitionResult.receipt?.transition_id !== transition.transition_id) {
    throw new Error('transition result receipt.transition_id 与 visual_transition_spec 不一致');
  }
  const receiptContextRefs = Array.isArray(transitionResult.receipt?.context_refs)
    ? transitionResult.receipt.context_refs
    : [];
  const receiptRefs = Array.isArray(transitionResult.receipt?.receipt_refs)
    ? transitionResult.receipt.receipt_refs
    : [];
  if (!receiptContextRefs.includes(providerAttemptRef) && !receiptRefs.includes(providerAttemptRef)) {
    throw new Error('transition result receipt 必须显式引用 provider attempt ref');
  }
  if (transitionResult.projection?.transition_id !== transition.transition_id) {
    throw new Error('transition result projection.transition_id 与 visual_transition_spec 不一致');
  }
  if (transitionResult.authority_boundary?.opl_can_write_visual_truth === true) {
    throw new Error('transition result 不得授权 OPL 写 visual truth');
  }
  if (transitionResult.authority_boundary?.opl_can_authorize_visual_ready === true) {
    throw new Error('transition result 不得授权 OPL 声明 visual_ready');
  }
  if (transitionResult.authority_boundary?.opl_can_authorize_exportable === true) {
    throw new Error('transition result 不得授权 OPL 声明 exportable');
  }
  if (transitionResult.authority_boundary?.opl_can_authorize_handoffable === true) {
    throw new Error('transition result 不得授权 OPL 声明 handoffable');
  }
  assertNoForbiddenCompletionClaims(transitionResult, 'transition result');
  assertNoForbiddenTransitionPayload(transitionResult);
}

function assertNoCompletionClaim(resultSurface) {
  assertNoForbiddenCompletionClaims(resultSurface, 'RCA domain_action_adapter result');
}

function transitionReceiptRefs(transitionResult) {
  return Array.isArray(transitionResult?.receipt?.receipt_refs)
    ? transitionResult.receipt.receipt_refs.filter(Boolean)
    : [];
}

export function buildHostedAttemptBridgeFixture({
  visualTransitionSpec,
  domain_action_adapterVisualTransitionSpec,
  transitionResult = null,
  transitionId = DEFAULT_TRANSITION_ID,
  providerAttemptRef = 'opl-provider-attempt:fixture-review-ready',
}) {
  const transition = visualTransitionSpec?.transition_table?.find(
    (entry) => entry.transition_id === transitionId,
  );
  if (!transition) {
    throw new Error(`visual_transition_spec 缺少 transition: ${transitionId}`);
  }
  if (domain_action_adapterVisualTransitionSpec?.ref !== '/visual_transition_spec') {
    throw new Error('domain-handler internal projection 未映射 /visual_transition_spec');
  }
  if (domain_action_adapterVisualTransitionSpec.spec_id !== visualTransitionSpec.spec_id) {
    throw new Error('domain-handler internal projection visual_transition_spec spec_id 与 manifest 不一致');
  }
  if (domain_action_adapterVisualTransitionSpec.transition_count !== visualTransitionSpec.transition_table.length) {
    throw new Error('domain-handler internal projection visual_transition_spec transition_count 与 manifest 不一致');
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
  if (visualTransitionSpec.runner_boundary?.opl_can_declare_handoffable === true) {
    throw new Error('OPL hosted attempt 不得声明 handoffable');
  }
  if (visualTransitionSpec.runner_boundary?.opl_can_claim_production_soak_complete === true) {
    throw new Error('OPL hosted attempt 不得声明 production soak complete');
  }

  const resolvedTransitionResult = transitionResult || defaultTransitionResult({
    visualTransitionSpec,
    transition,
    providerAttemptRef,
  });
  assertTransitionResultMatchesSpec({
    transitionResult: resolvedTransitionResult,
    visualTransitionSpec,
    transition,
    providerAttemptRef,
  });

  return {
    bridge_kind: BRIDGE_KIND,
    consumed_surface: CONSUMED_SURFACE,
    transition_result: resolvedTransitionResult,
    transition_result_ref: `family_transition_matrix_result:${visualTransitionSpec.spec_id}:${transition.transition_id}`,
    transition_result_status: resolvedTransitionResult.status,
    transition_result_receipt_refs: transitionReceiptRefs(resolvedTransitionResult),
    owner_route_ref: resolvedTransitionResult.owner_route.route_ref,
    transition_id: transition.transition_id,
    from_stage: transition.from_stage,
    to_stage: transition.to_stage,
    owner_action: transition.owner_action,
    provider_attempt_ref: providerAttemptRef,
  };
}

export function reconcileHostedAttemptReceipt({ bridgeFixture, domain_action_adapterResult }) {
  const resultSurface = domain_action_adapterResult?.result_surface;
  if (!resultSurface?.return_shape) {
    throw new Error('RCA domain_action_adapter result 缺少 result_surface.return_shape');
  }
  if (bridgeFixture.transition_result?.transition_id !== bridgeFixture.transition_id) {
    throw new Error('bridge fixture transition_result 与 transition_id 不一致');
  }
  if (bridgeFixture.transition_result?.current_state !== bridgeFixture.from_stage) {
    throw new Error('bridge fixture transition_result 与 from_stage 不一致');
  }
  if (bridgeFixture.transition_result?.next_state !== bridgeFixture.to_stage) {
    throw new Error('bridge fixture transition_result 与 to_stage 不一致');
  }
  if (!bridgeFixture.owner_action) {
    throw new Error('bridge fixture 缺少 owner_action');
  }
  if (!bridgeFixture.transition_result?.owner_route?.action_refs?.includes(bridgeFixture.owner_action)) {
    throw new Error('bridge fixture transition_result 缺少 owner_action');
  }
  assertNoCompletionClaim(resultSurface);

  const projection = {
    bridge_kind: bridgeFixture.bridge_kind,
    consumed_surface: bridgeFixture.consumed_surface,
    transition_result_ref: bridgeFixture.transition_result_ref,
    transition_result_status: bridgeFixture.transition_result_status,
    transition_result_receipt_refs: bridgeFixture.transition_result_receipt_refs || [],
    owner_route_ref: bridgeFixture.owner_route_ref,
    provider_attempt_ref: bridgeFixture.provider_attempt_ref,
    transition_id: bridgeFixture.transition_id,
    from_stage: bridgeFixture.from_stage,
    to_stage: bridgeFixture.to_stage,
    owner_action: bridgeFixture.owner_action,
    domain_action_adapter_return_shape: resultSurface.return_shape,
    domain_owner_receipt_ref: null,
    typed_blocker: null,
    no_regression_evidence_ref: null,
    visual_ready: false,
    exportable: false,
    handoffable: false,
    production_soak_complete: false,
  };

  if (resultSurface.return_shape === 'domain_receipt') {
    projection.domain_owner_receipt_ref = safeText(resultSurface.receipt_ref);
    if (!projection.domain_owner_receipt_ref) {
      throw new Error('domain_receipt 缺少 receipt_ref');
    }
  } else if (resultSurface.return_shape === 'typed_blocker') {
    if (!safeText(resultSurface.blocker_ref) || !safeText(resultSurface.blocker_kind)) {
      throw new Error('typed_blocker 缺少 blocker_ref 或 blocker_kind');
    }
    if (resultSurface.owner !== DOMAIN_ID) {
      throw new Error(`typed_blocker owner 不允许: ${resultSurface.owner}`);
    }
    projection.typed_blocker = {
      blocker_ref: resultSurface.blocker_ref,
      blocker_kind: resultSurface.blocker_kind,
      owner: resultSurface.owner,
      next_required_owner_action: resultSurface.next_required_owner_action,
    };
  } else if (resultSurface.return_shape === 'no_regression_evidence') {
    projection.no_regression_evidence_ref = safeText(resultSurface.evidence_ref);
    if (!projection.no_regression_evidence_ref) {
      throw new Error('no_regression_evidence 缺少 evidence_ref');
    }
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
