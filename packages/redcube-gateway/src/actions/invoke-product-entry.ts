// @ts-nocheck
import { existsSync } from 'node:fs';

import {
  buildDeliveryIdentitySurface,
  buildEntrySessionSurface,
  buildProductEntryContinuationSnapshot,
} from 'opl-gateway-shared/product-entry-companions';
import {
  getPublicationProjection,
  getReviewState,
  loadProductEntrySession,
  productEntrySessionFile,
  saveProductEntrySession,
} from '@redcube/runtime';
import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { createDeliverable } from './create-deliverable.js';
import {
  buildSessionContinuationFamilyOrchestration,
} from './family-orchestration-companion.js';
import { getDeliverable } from './get-deliverable.js';
import { invokeDomainEntry } from './invoke-domain-entry.js';
import {
  buildArtifactInventorySurface,
  buildOplFamilyLifecycleAdapterSurface,
  buildProgressProjectionSurface,
  buildRuntimeLoopClosureSurface,
  buildSessionContinuitySurface,
} from './product-entry-continuity-surfaces.js';

const PRODUCT_ENTRY_ID = 'redcube_product_entry';
const DEFAULT_RUNTIME_OWNER = 'codex_cli';
const HOSTED_RUNTIME_OWNER = 'configured_family_runtime_provider';
const DEFAULT_EXECUTOR_ADAPTER_SURFACE = '@redcube/codex-cli-client';
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
    lifecyclePolicy: safeText(delivery?.lifecycle_policy || delivery?.lifecyclePolicy),
    mode: safeText(delivery?.mode),
    baselineDeliverableId: safeText(delivery?.baseline_deliverable_id || delivery?.baselineDeliverableId),
    taskIntent: safeText(delivery?.task_intent || delivery?.taskIntent),
  };
}

function resolveLifecycleStopAfterStage({ delivery, taskIntent, existingSession }) {
  if (delivery.stopAfterStage || delivery.route || taskIntent !== 'run_managed_deliverable' || existingSession) {
    return delivery.stopAfterStage;
  }

  if (delivery.lifecyclePolicy === 'operator_review_after_plan') {
    return 'detailed_outline';
  }

  if (delivery.lifecyclePolicy && delivery.lifecyclePolicy !== 'auto_to_terminal') {
    throw new Error(`Unsupported delivery_request.lifecycle_policy: ${delivery.lifecyclePolicy}`);
  }

  return delivery.stopAfterStage;
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

  return buildProductEntryContinuationSnapshot({
    latest_managed_run_id: latestManagedRunId,
    latest_run_id: latestRunId,
    managed_progress_projection: resultSurface?.progress_projection || null,
    runtime_supervision: resultSurface?.runtime_supervision || null,
  });
}

function stageIdsFromDeliverableRecord(deliverableRecord) {
  const stageSequence = deliverableRecord?.hydrated_contract?.stage_sequence
    || deliverableRecord?.governance_surface?.stage_sequence
    || {};
  const stages = [
    ...(Array.isArray(stageSequence?.stages) ? stageSequence.stages : []),
    ...(Array.isArray(stageSequence?.alternate_stages) ? stageSequence.alternate_stages : []),
  ];
  return stages.map((stage) => safeText(stage?.stage_id)).filter(Boolean);
}

function assertRequestedStagesAllowed({ deliverableRecord, delivery }) {
  const allowedStages = stageIdsFromDeliverableRecord(deliverableRecord);
  if (allowedStages.length === 0) return;

  for (const [fieldName, requestedStage] of [
    ['delivery_request.route', delivery.route],
    ['delivery_request.stop_after_stage', delivery.stopAfterStage],
  ]) {
    if (requestedStage && !allowedStages.includes(requestedStage)) {
      throw new Error(
        `${fieldName}=${requestedStage} is not allowed by the hydrated overlay stage_sequence; allowed stages: ${allowedStages.join(', ')}`,
      );
    }
  }
}

function buildSessionRecord({
  entrySessionId,
  workspaceRoot,
  deliveryIdentity,
  taskIntent,
  entryMode,
  runtimeOwner,
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
    runtime_owner: runtimeOwner,
    last_task_intent: taskIntent,
    last_entry_mode: entryMode,
    latest_managed_run_id: continuationSnapshot.latest_managed_run_id,
    latest_run_id: continuationSnapshot.latest_run_id,
    latest_surface_kind: continuationSnapshot.latest_managed_run_id ? 'managed_run' : 'route_run',
    updated_at: new Date().toISOString(),
  };
}

function buildResolvedDeliveryIdentityPayload(resolvedIdentity, { includeProfile = true } = {}) {
  const payload = {
    deliverable_family: resolvedIdentity.deliverableFamily,
    topic_id: resolvedIdentity.topicId,
    deliverable_id: resolvedIdentity.deliverableId,
  };
  if (includeProfile) {
    payload.profile_id = resolvedIdentity.profileId || null;
  }
  return payload;
}

async function readReviewAndPublicationSurfaces({ workspaceRoot, topicId, deliverableId }) {
  const [reviewState, publicationProjection] = await Promise.all([
    getReviewState({
      workspaceRoot,
      topicId,
      deliverableId,
    }),
    getPublicationProjection({
      workspaceRoot,
      topicId,
    }),
  ]);
  return { reviewState, publicationProjection };
}

function buildProductEntrySummary({
  entrySessionId,
  taskIntent,
  domainEntrySurface,
  continuationSnapshot,
  runtimeLoopClosure,
  familyOrchestration,
}) {
  const latestHandle = continuationSnapshot.latest_managed_run_id || continuationSnapshot.latest_run_id || null;
  return {
    entry_session_id: entrySessionId,
    task_intent: taskIntent,
    actual_surface_kind: domainEntrySurface.result_surface?.surface_kind || null,
    target_handle: latestHandle,
    latest_handle: latestHandle,
    approval_required: Boolean(runtimeLoopClosure?.control_policy?.approval_required),
    gate_status: runtimeLoopClosure?.control_policy?.gate_status || null,
    resume_command: runtimeLoopClosure?.control_policy?.continue_action?.command || null,
    session_locator_field: familyOrchestration?.resume_contract?.session_locator_field || null,
    checkpoint_locator_field: familyOrchestration?.resume_contract?.checkpoint_locator_field || null,
  };
}

async function ensureDeliverableForProductEntry({
  workspaceRoot,
  deliveryIdentity,
  delivery,
}) {
  const deliverableFamily = requireField(
    'delivery_request.deliverable_family',
    deliveryIdentity.deliverableFamily,
  );
  const topicId = requireField('delivery_request.topic_id', deliveryIdentity.topicId);
  const deliverableId = requireField('delivery_request.deliverable_id', deliveryIdentity.deliverableId);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  let createdDeliverable = false;

  if (!existsSync(deliverablePaths.deliverableFile)) {
    await createDeliverable({
      workspaceRoot,
      overlay: deliverableFamily,
      profileId: requireField('delivery_request.profile_id', deliveryIdentity.profileId),
      topicId,
      deliverableId,
      title: requireField('delivery_request.title', deliveryIdentity.title),
      goal: requireField('delivery_request.goal', deliveryIdentity.goal),
    });
    createdDeliverable = true;
  }

  const deliverableRecord = await getDeliverable({
    workspaceRoot,
    topicId,
    deliverableId,
  });
  assertRequestedStagesAllowed({ deliverableRecord, delivery });
  return {
    createdDeliverable,
    deliverableRecord,
    resolvedIdentity: {
      deliverableFamily,
      topicId,
      deliverableId,
      profileId: safeText(deliverableRecord?.deliverable?.profile_id, deliveryIdentity.profileId),
      title: safeText(deliverableRecord?.deliverable?.title, deliveryIdentity.title),
      goal: safeText(deliverableRecord?.deliverable?.goal, deliveryIdentity.goal),
    },
  };
}

function buildDomainEntryRequest({
  workspaceRoot,
  taskIntent,
  entryMode,
  runtimeOwner,
  delivery,
  resolvedIdentity,
}) {
  return {
    target_domain_id: 'redcube_ai',
    task_intent: taskIntent,
    entry_mode: entryMode,
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    runtime_session_contract: {
      runtime_owner: runtimeOwner,
      adapter_surface: DEFAULT_EXECUTOR_ADAPTER_SURFACE,
      session_mode: 'entry_session',
    },
    return_surface_contract: {
      surface_kind: taskIntent === 'run_deliverable_route' ? 'route_run' : 'managed_run',
    },
    domain_payload: {
      deliverable_family: resolvedIdentity.deliverableFamily,
      topic_id: resolvedIdentity.topicId,
      deliverable_id: resolvedIdentity.deliverableId,
      route: delivery.route || undefined,
      adapter: delivery.adapter || undefined,
      user_intent: delivery.userIntent || undefined,
      stop_after_stage: delivery.stopAfterStage || undefined,
      lifecycle_policy: delivery.lifecyclePolicy || undefined,
      mode: delivery.mode || undefined,
      baseline_deliverable_id: delivery.baselineDeliverableId || undefined,
    },
  };
}

function buildProductEntryResponse({
  entrySession,
  existingSession,
  createdDeliverable,
  resolvedIdentity,
  domainEntrySurface,
  continuationSnapshot,
  persisted,
  runtimeOwner,
  sessionContinuity,
  progressProjection,
  artifactInventory,
  runtimeLoopClosure,
  reviewState,
  publicationProjection,
  oplFamilyLifecycleAdapter,
  familyOrchestration,
  taskIntent,
}) {
  const deliveryIdentitySurface = buildDeliveryIdentitySurface({
    deliverable_family: resolvedIdentity.deliverableFamily,
    topic_id: resolvedIdentity.topicId,
    deliverable_id: resolvedIdentity.deliverableId,
    profile_id: resolvedIdentity.profileId || undefined,
    extra_payload: resolvedIdentity.profileId
      ? undefined
      : {
        profile_id: null,
      },
  });
  const summary = buildProductEntrySummary({
    entrySessionId: entrySession.entrySessionId,
    taskIntent,
    domainEntrySurface,
    continuationSnapshot,
    runtimeLoopClosure,
    familyOrchestration,
  });
  return {
    ok: domainEntrySurface.ok,
    surface_kind: 'product_entry',
    recommended_action: domainEntrySurface.recommended_action || 'review_product_entry',
    product_entry_contract_id: PRODUCT_ENTRY_ID,
    entry_session: buildEntrySessionSurface({
      entry_session_id: entrySession.entrySessionId,
      session_file: persisted.file,
      resumed_from_session: existingSession != null,
      created_deliverable: createdDeliverable,
      runtime_owner: runtimeOwner,
    }),
    delivery_identity: deliveryIdentitySurface,
    domain_entry_surface: domainEntrySurface,
    continuation_snapshot: continuationSnapshot,
    session_continuity: sessionContinuity,
    progress_projection: progressProjection,
    artifact_inventory: artifactInventory,
    runtime_loop_closure: runtimeLoopClosure,
    review_state: reviewState,
    publication_projection: publicationProjection,
    opl_family_lifecycle_adapter: oplFamilyLifecycleAdapter,
    family_orchestration: familyOrchestration,
    summary,
  };
}

export async function invokeProductEntry(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const entrySession = normalizeEntrySessionContract(request);
  const existingSession = loadProductEntrySession({ entrySessionId: entrySession.entrySessionId });
  const delivery = normalizeDeliveryRequest(request);
  const taskIntent = resolveTaskIntent(request, delivery);
  const entryMode = safeText(request?.entry_mode || request?.entryMode, 'redcube_product_entry');
  const runtimeOwner = entryMode === 'opl_gateway' ? HOSTED_RUNTIME_OWNER : DEFAULT_RUNTIME_OWNER;

  if (existingSession && safeText(existingSession.workspace_root) !== workspaceRoot) {
    throw new Error('entry_session_contract.entry_session_id 已绑定其他 workspace_root');
  }

  const deliveryIdentity = resolveDeliveryIdentity({
    delivery,
    session: existingSession,
  });
  delivery.stopAfterStage = resolveLifecycleStopAfterStage({
    delivery,
    taskIntent,
    existingSession,
  });

  const {
    createdDeliverable,
    resolvedIdentity,
  } = await ensureDeliverableForProductEntry({
    workspaceRoot,
    deliveryIdentity,
    delivery,
  });
  const domainEntrySurface = await invokeDomainEntry(buildDomainEntryRequest({
    workspaceRoot,
    taskIntent,
    entryMode,
    runtimeOwner,
    delivery,
    resolvedIdentity,
  }));

  const continuationSnapshot = buildContinuationSnapshot(domainEntrySurface);
  const persisted = saveProductEntrySession({
    session: buildSessionRecord({
      entrySessionId: entrySession.entrySessionId,
      workspaceRoot,
      deliveryIdentity: resolvedIdentity,
      taskIntent,
      entryMode,
      runtimeOwner,
      continuationSnapshot,
    }),
  });
  const sessionContinuity = buildSessionContinuitySurface({
    entrySessionId: entrySession.entrySessionId,
    sessionFile: persisted.file,
    runtimeOwner,
    deliveryIdentity: {
      deliverable_family: resolvedIdentity.deliverableFamily,
      topic_id: resolvedIdentity.topicId,
      deliverable_id: resolvedIdentity.deliverableId,
      profile_id: resolvedIdentity.profileId || null,
    },
    continuationSnapshot,
  });
  const progressProjection = buildProgressProjectionSurface({ continuationSnapshot });
  const artifactInventory = buildArtifactInventorySurface({
    entrySessionId: entrySession.entrySessionId,
    sessionFile: persisted.file,
    continuationSnapshot,
  });
  const runtimeLoopClosure = buildRuntimeLoopClosureSurface({
    entrySessionId: entrySession.entrySessionId,
    sessionFile: persisted.file,
    runtimeOwner,
    deliveryIdentity: buildResolvedDeliveryIdentityPayload(resolvedIdentity, { includeProfile: false }),
    continuationSnapshot,
    source: entryMode === 'opl_gateway' ? 'federated' : 'direct',
    entryMode,
  });
  const { reviewState, publicationProjection } = await readReviewAndPublicationSurfaces({
    workspaceRoot,
    topicId: resolvedIdentity.topicId,
    deliverableId: resolvedIdentity.deliverableId,
  });
  const familyOrchestration = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot,
  });
  const oplFamilyLifecycleAdapter = buildOplFamilyLifecycleAdapterSurface({
    runtimeOwner,
    entrySessionId: entrySession.entrySessionId,
    sessionFile: persisted.file,
    deliveryIdentity: buildResolvedDeliveryIdentityPayload(resolvedIdentity),
    continuationSnapshot,
    runtimeLoopClosure,
    reviewState,
    publicationProjection,
    source: entryMode === 'opl_gateway' ? 'federated' : 'direct',
    entryMode,
  });

  return buildProductEntryResponse({
    entrySession,
    existingSession,
    createdDeliverable,
    resolvedIdentity,
    domainEntrySurface,
    continuationSnapshot,
    persisted,
    runtimeOwner,
    sessionContinuity,
    progressProjection,
    artifactInventory,
    runtimeLoopClosure,
    reviewState,
    publicationProjection,
    oplFamilyLifecycleAdapter,
    familyOrchestration,
    taskIntent,
  });
}
