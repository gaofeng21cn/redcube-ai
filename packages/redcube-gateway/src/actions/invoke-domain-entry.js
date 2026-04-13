import { runDeliverableRoute } from './run-deliverable-route.js';
import { runManagedDeliverable } from './run-managed-deliverable.js';

const SERVICE_SAFE_DOMAIN_ENTRY_ID = 'redcube_service_safe_domain_entry';
const TASK_INTENT_SURFACE_KIND = {
  run_managed_deliverable: 'managed_run',
  run_deliverable_route: 'route_run',
};

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_locator.workspace_root',
    request?.workspace_locator?.workspace_root || request?.workspaceLocator?.workspaceRoot || request?.workspaceRoot,
  );
}

function normalizeDomainPayload(request) {
  const payload = request?.domain_payload || request?.domainPayload || {};
  return {
    overlay: requireField(
      'domain_payload.deliverable_family',
      payload?.overlay || payload?.deliverable_family || payload?.deliverableFamily,
    ),
    topicId: requireField(
      'domain_payload.topic_id',
      payload?.topic_id || payload?.topicId,
    ),
    deliverableId: requireField(
      'domain_payload.deliverable_id',
      payload?.deliverable_id || payload?.deliverableId,
    ),
    route: safeText(payload?.route),
    adapter: safeText(payload?.adapter),
    userIntent: safeText(payload?.user_intent || payload?.userIntent),
    stopAfterStage: safeText(payload?.stop_after_stage || payload?.stopAfterStage),
    mode: safeText(payload?.mode),
    baselineDeliverableId: safeText(payload?.baseline_deliverable_id || payload?.baselineDeliverableId),
  };
}

function normalizeTaskIntent(request) {
  return requireField('task_intent', request?.task_intent || request?.taskIntent);
}

function normalizeEntryMode(request) {
  return requireField('entry_mode', request?.entry_mode || request?.entryMode);
}

function normalizeTargetDomainId(request) {
  const targetDomainId = requireField('target_domain_id', request?.target_domain_id || request?.targetDomainId);
  if (targetDomainId !== 'redcube_ai' && targetDomainId !== 'redcube-ai') {
    throw new Error(`Unsupported target_domain_id: ${targetDomainId}`);
  }
  return 'redcube_ai';
}

function normalizeRuntimeSessionContract(request) {
  const contract = request?.runtime_session_contract || request?.runtimeSessionContract || {};
  const runtimeOwner = requireField(
    'runtime_session_contract.runtime_owner',
    contract?.runtime_owner || contract?.runtimeOwner,
  );
  if (runtimeOwner !== 'codex_cli') {
    throw new Error(`runtime_session_contract.runtime_owner 必须为 codex_cli，当前收到 ${runtimeOwner}`);
  }
  return {
    runtime_owner: runtimeOwner,
    adapter_surface: safeText(contract?.adapter_surface || contract?.adapterSurface, '@redcube/codex-cli-client'),
    session_mode: safeText(contract?.session_mode || contract?.sessionMode, 'ephemeral_run'),
  };
}

function normalizeReturnSurfaceContract(request, taskIntent) {
  const requested = request?.return_surface_contract || request?.returnSurfaceContract || {};
  const requestedSurfaceKind = requireField(
    'return_surface_contract.surface_kind',
    requested?.surface_kind || requested?.surfaceKind,
  );
  const expectedSurfaceKind = TASK_INTENT_SURFACE_KIND[taskIntent];
  if (!expectedSurfaceKind) {
    throw new Error(`Unsupported task_intent: ${taskIntent}`);
  }
  if (requestedSurfaceKind !== expectedSurfaceKind) {
    throw new Error(
      `return_surface_contract.surface_kind 必须为 ${expectedSurfaceKind}，当前收到 ${requestedSurfaceKind}`,
    );
  }
  return {
    surface_kind: requestedSurfaceKind,
  };
}

function buildReturnSurfaceContract(resultSurface, requestedSurfaceKind) {
  return {
    requested_surface_kind: requestedSurfaceKind,
    actual_surface_kind: resultSurface.surface_kind,
    durable_truth_surfaces: [
      'runtimeWatch',
      'getReviewState',
      'getPublicationProjection',
      'auditDeliverable',
    ],
  };
}

export async function invokeDomainEntry(request) {
  const targetDomainId = normalizeTargetDomainId(request);
  const taskIntent = normalizeTaskIntent(request);
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const entryMode = normalizeEntryMode(request);
  const runtimeSessionContract = normalizeRuntimeSessionContract(request);
  const returnSurfaceRequest = normalizeReturnSurfaceContract(request, taskIntent);
  const domainPayload = normalizeDomainPayload(request);

  let resultSurface;
  if (taskIntent === 'run_managed_deliverable') {
    resultSurface = await runManagedDeliverable({
      workspaceRoot,
      overlay: domainPayload.overlay,
      topicId: domainPayload.topicId,
      deliverableId: domainPayload.deliverableId,
      adapter: domainPayload.adapter || undefined,
      userIntent: domainPayload.userIntent || undefined,
      stopAfterStage: domainPayload.stopAfterStage || undefined,
      mode: domainPayload.mode || undefined,
      baselineDeliverableId: domainPayload.baselineDeliverableId || undefined,
    });
  } else if (taskIntent === 'run_deliverable_route') {
    resultSurface = await runDeliverableRoute({
      workspaceRoot,
      overlay: domainPayload.overlay,
      topicId: domainPayload.topicId,
      deliverableId: domainPayload.deliverableId,
      route: requireField('domain_payload.route', domainPayload.route),
      adapter: domainPayload.adapter || undefined,
    });
  } else {
    throw new Error(`Unsupported task_intent: ${taskIntent}`);
  }

  const returnSurfaceContract = buildReturnSurfaceContract(
    resultSurface,
    returnSurfaceRequest.surface_kind,
  );
  return {
    ok: resultSurface.ok,
    surface_kind: 'domain_entry',
    recommended_action: resultSurface.recommended_action || null,
    entry_contract_id: SERVICE_SAFE_DOMAIN_ENTRY_ID,
    target_domain_id: targetDomainId,
    task_intent: taskIntent,
    entry_mode: entryMode,
    runtime_session_contract: runtimeSessionContract,
    return_surface_contract: returnSurfaceContract,
    domain_payload: {
      deliverable_family: domainPayload.overlay,
      topic_id: domainPayload.topicId,
      deliverable_id: domainPayload.deliverableId,
      route: domainPayload.route || null,
    },
    result_surface: resultSurface,
    summary: {
      task_intent: taskIntent,
      actual_surface_kind: resultSurface.surface_kind,
      target_handle: resultSurface.summary?.managed_run_id
        || resultSurface.summary?.run_id
        || null,
    },
  };
}
