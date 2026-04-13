import { existsSync } from 'node:fs';

import { loadProductEntrySession, productEntrySessionFile, saveProductEntrySession } from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { createDeliverable } from './create-deliverable.js';
import {
  buildFamilyOrchestrationCompanion,
  resolveHumanGateStatusFromContinuation,
} from './family-orchestration-companion.js';
import { getDeliverable } from './get-deliverable.js';
import { getPublicationProjection } from './get-publication-projection.js';
import { getReviewState } from './get-review-state.js';
import { invokeDomainEntry } from './invoke-domain-entry.js';

const PRODUCT_ENTRY_ID = 'redcube_product_entry';
const SUPPORTED_TASK_INTENTS = new Set(['run_managed_deliverable', 'run_deliverable_route']);

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

function normalizeEntrySessionContract(request) {
  const contract = request?.entry_session_contract || request?.entrySessionContract || {};
  return {
    entrySessionId: requireField(
      'entry_session_contract.entry_session_id',
      contract?.entry_session_id || contract?.entrySessionId || request?.entrySessionId,
    ),
  };
}

function normalizeDeliveryRequest(request) {
  const delivery = request?.delivery_request || request?.deliveryRequest || {};
  return {
    deliverableFamily: safeText(
      delivery?.deliverable_family || delivery?.deliverableFamily || delivery?.overlay,
    ),
    topicId: safeText(delivery?.topic_id || delivery?.topicId),
    deliverableId: safeText(delivery?.deliverable_id || delivery?.deliverableId),
    profileId: safeText(delivery?.profile_id || delivery?.profileId),
    title: safeText(delivery?.title),
    goal: safeText(delivery?.goal),
    route: safeText(delivery?.route),
    adapter: safeText(delivery?.adapter),
    userIntent: safeText(delivery?.user_intent || delivery?.userIntent),
    stopAfterStage: safeText(delivery?.stop_after_stage || delivery?.stopAfterStage),
    mode: safeText(delivery?.mode),
    baselineDeliverableId: safeText(delivery?.baseline_deliverable_id || delivery?.baselineDeliverableId),
    taskIntent: safeText(delivery?.task_intent || delivery?.taskIntent),
  };
}

function resolveTaskIntent(request, delivery) {
  const taskIntent = safeText(
    request?.task_intent || request?.taskIntent || delivery.taskIntent,
    delivery.route ? 'run_deliverable_route' : 'run_managed_deliverable',
  );
  if (!SUPPORTED_TASK_INTENTS.has(taskIntent)) {
    throw new Error(`Unsupported task_intent: ${taskIntent}`);
  }
  return taskIntent;
}

function resolveBoundValue(fieldName, requestedValue, storedValue) {
  const requested = safeText(requestedValue);
  const stored = safeText(storedValue);

  if (requested && stored && requested !== stored) {
    throw new Error(`${fieldName} 与当前 entry session 已绑定的值不一致`);
  }

  return requested || stored;
}

function resolveDeliveryIdentity({ delivery, session }) {
  return {
    deliverableFamily: resolveBoundValue('delivery_request.deliverable_family', delivery.deliverableFamily, session?.deliverable_family),
    topicId: resolveBoundValue('delivery_request.topic_id', delivery.topicId, session?.topic_id),
    deliverableId: resolveBoundValue('delivery_request.deliverable_id', delivery.deliverableId, session?.deliverable_id),
    profileId: resolveBoundValue('delivery_request.profile_id', delivery.profileId, session?.profile_id),
    title: resolveBoundValue('delivery_request.title', delivery.title, session?.title),
    goal: resolveBoundValue('delivery_request.goal', delivery.goal, session?.goal),
  };
}

function buildContinuationSnapshot(domainEntrySurface) {
  const resultSurface = domainEntrySurface?.result_surface || {};
  const latestManagedRunId = resultSurface?.summary?.managed_run_id
    || resultSurface?.managed_run?.managed_run_id
    || null;
  const latestRunId = resultSurface?.summary?.run_id
    || resultSurface?.run?.run_id
    || null;

  return {
    latest_managed_run_id: latestManagedRunId,
    latest_run_id: latestRunId,
    managed_progress_projection: resultSurface?.progress_projection || null,
    runtime_supervision: resultSurface?.runtime_supervision || null,
  };
}

function buildSessionRecord({
  entrySessionId,
  workspaceRoot,
  deliveryIdentity,
  taskIntent,
  entryMode,
  continuationSnapshot,
}) {
  return {
    schema_version: 1,
    entry_session_id: entrySessionId,
    workspace_root: workspaceRoot,
    deliverable_family: deliveryIdentity.deliverableFamily,
    topic_id: deliveryIdentity.topicId,
    deliverable_id: deliveryIdentity.deliverableId,
    profile_id: deliveryIdentity.profileId || null,
    title: deliveryIdentity.title || null,
    goal: deliveryIdentity.goal || null,
    runtime_owner: 'upstream_hermes_agent',
    last_task_intent: taskIntent,
    last_entry_mode: entryMode,
    latest_managed_run_id: continuationSnapshot.latest_managed_run_id,
    latest_run_id: continuationSnapshot.latest_run_id,
    latest_surface_kind: continuationSnapshot.latest_managed_run_id ? 'managed_run' : 'route_run',
    updated_at: new Date().toISOString(),
  };
}

export async function invokeProductEntry(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const entrySession = normalizeEntrySessionContract(request);
  const existingSession = loadProductEntrySession({ entrySessionId: entrySession.entrySessionId });
  const delivery = normalizeDeliveryRequest(request);
  const taskIntent = resolveTaskIntent(request, delivery);
  const entryMode = safeText(request?.entry_mode || request?.entryMode, 'redcube_product_entry');

  if (existingSession && safeText(existingSession.workspace_root) !== workspaceRoot) {
    throw new Error('entry_session_contract.entry_session_id 已绑定其他 workspace_root');
  }

  const deliveryIdentity = resolveDeliveryIdentity({
    delivery,
    session: existingSession,
  });
  const deliverableFamily = requireField(
    'delivery_request.deliverable_family',
    deliveryIdentity.deliverableFamily,
  );
  const topicId = requireField(
    'delivery_request.topic_id',
    deliveryIdentity.topicId,
  );
  const deliverableId = requireField(
    'delivery_request.deliverable_id',
    deliveryIdentity.deliverableId,
  );

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  let createdDeliverable = false;
  if (!existsSync(deliverablePaths.deliverableFile)) {
    const profileId = requireField('delivery_request.profile_id', deliveryIdentity.profileId);
    const title = requireField('delivery_request.title', deliveryIdentity.title);
    const goal = requireField('delivery_request.goal', deliveryIdentity.goal);
    await createDeliverable({
      workspaceRoot,
      overlay: deliverableFamily,
      profileId,
      topicId,
      deliverableId,
      title,
      goal,
    });
    createdDeliverable = true;
  }

  const deliverableRecord = await getDeliverable({
    workspaceRoot,
    topicId,
    deliverableId,
  });
  const resolvedIdentity = {
    deliverableFamily,
    topicId,
    deliverableId,
    profileId: safeText(deliverableRecord?.deliverable?.profile_id, deliveryIdentity.profileId),
    title: safeText(deliverableRecord?.deliverable?.title, deliveryIdentity.title),
    goal: safeText(deliverableRecord?.deliverable?.goal, deliveryIdentity.goal),
  };

  const domainEntrySurface = await invokeDomainEntry({
    target_domain_id: 'redcube_ai',
    task_intent: taskIntent,
    entry_mode: entryMode,
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    runtime_session_contract: {
      runtime_owner: 'upstream_hermes_agent',
      adapter_surface: '@redcube/hermes-agent-client',
      session_mode: 'entry_session',
    },
    return_surface_contract: {
      surface_kind: taskIntent === 'run_deliverable_route' ? 'route_run' : 'managed_run',
    },
    domain_payload: {
      deliverable_family: deliverableFamily,
      topic_id: topicId,
      deliverable_id: deliverableId,
      route: delivery.route || undefined,
      adapter: delivery.adapter || undefined,
      user_intent: delivery.userIntent || undefined,
      stop_after_stage: delivery.stopAfterStage || undefined,
      mode: delivery.mode || undefined,
      baseline_deliverable_id: delivery.baselineDeliverableId || undefined,
    },
  });

  const continuationSnapshot = buildContinuationSnapshot(domainEntrySurface);
  const persisted = saveProductEntrySession({
    session: buildSessionRecord({
      entrySessionId: entrySession.entrySessionId,
      workspaceRoot,
      deliveryIdentity: resolvedIdentity,
      taskIntent,
      entryMode,
      continuationSnapshot,
    }),
  });
  const reviewState = await getReviewState({
    workspaceRoot,
    topicId,
    deliverableId,
  });
  const publicationProjection = await getPublicationProjection({
    workspaceRoot,
    topicId,
  });
  const familyOrchestration = buildFamilyOrchestrationCompanion({
    sessionLocatorField: 'entry_session.entry_session_id',
    gateStatus: resolveHumanGateStatusFromContinuation(continuationSnapshot),
    reviewSurfaceRef: {
      ref_kind: 'json_pointer',
      ref: '/review_state',
      label: 'current review state surface',
    },
    eventEnvelopeSurfaceRef: {
      ref_kind: 'json_pointer',
      ref: '/continuation_snapshot/managed_progress_projection/latest_events',
      label: 'managed run event companion',
    },
    checkpointLineageSurfaceRef: {
      ref_kind: 'json_pointer',
      ref: '/continuation_snapshot/latest_managed_run_id',
      label: 'latest managed-run continuation locator',
    },
  });

  return {
    ok: domainEntrySurface.ok,
    surface_kind: 'product_entry',
    recommended_action: domainEntrySurface.recommended_action || 'review_product_entry',
    product_entry_contract_id: PRODUCT_ENTRY_ID,
    entry_session: {
      entry_session_id: entrySession.entrySessionId,
      session_file: persisted.file,
      resumed_from_session: existingSession !== null,
      created_deliverable: createdDeliverable,
      runtime_owner: 'upstream_hermes_agent',
    },
    delivery_identity: {
      deliverable_family: resolvedIdentity.deliverableFamily,
      topic_id: resolvedIdentity.topicId,
      deliverable_id: resolvedIdentity.deliverableId,
      profile_id: resolvedIdentity.profileId || null,
    },
    domain_entry_surface: domainEntrySurface,
    continuation_snapshot: continuationSnapshot,
    review_state: reviewState,
    publication_projection: publicationProjection,
    family_orchestration: familyOrchestration,
    summary: {
      entry_session_id: entrySession.entrySessionId,
      task_intent: taskIntent,
      actual_surface_kind: domainEntrySurface.result_surface?.surface_kind || null,
      target_handle: continuationSnapshot.latest_managed_run_id || continuationSnapshot.latest_run_id || null,
    },
  };
}
