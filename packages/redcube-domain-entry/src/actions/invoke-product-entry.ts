// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

import {
  buildDeliveryIdentitySurface,
  buildEntrySessionSurface,
  buildProductEntryContinuationSnapshot,
} from 'opl-framework-shared/product-entry-companions';
import {
  buildGovernanceSurfaceContract,
  hydrateDeliverableContract,
} from '@redcube/overlay-core';
import { getDefaultOverlayRegistry } from '@redcube/overlay-registry';
import {
  getPublicationProjection,
  getReviewState,
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
import {
  buildCloseoutBlockedDomainEntrySurface,
  buildContinuationSnapshotFromSessionRecord,
  resolveProductEntryCurrentness,
} from './product-entry-currentness-resolver.js';
import {
  loadProductEntrySessionRef,
  saveProductEntrySessionRef,
} from './product-entry-session-refs.js';
import { readJson, requireField, safeText } from './action-utils.js';

const PRODUCT_ENTRY_ID = 'redcube_product_entry';
const DEFAULT_RUNTIME_OWNER = 'configured_family_runtime_provider';
const HOSTED_RUNTIME_OWNER = 'configured_family_runtime_provider';
const DEFAULT_EXECUTOR_ADAPTER_SURFACE = '@redcube/codex-cli-client';
const SUPPORTED_TASK_INTENTS = new Set(['run_opl_stage_execution_plan', 'run_deliverable_route']);
const overlayRegistry = getDefaultOverlayRegistry();

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeJsonObject(base = {}, override = {}) {
  const merged = { ...(isPlainObject(base) ? base : {}) };
  for (const [key, value] of Object.entries(isPlainObject(override) ? override : {})) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeJsonObject(merged[key], value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(',')}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
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
    providerAttemptRef: safeText(
      contract?.provider_attempt_ref || contract?.providerAttemptRef || request?.providerAttemptRef,
    ),
    providerAttemptLedgerRef: safeText(
      contract?.provider_attempt_ledger_ref
        || contract?.providerAttemptLedgerRef
        || request?.providerAttemptLedgerRef,
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
    crossProviderAttemptIndex: delivery?.cross_provider_attempt_index || delivery?.crossProviderAttemptIndex || null,
    constraints: delivery?.constraints && typeof delivery.constraints === 'object' && !Array.isArray(delivery.constraints)
      ? delivery.constraints
      : {},
  };
}

function resolveLifecycleStopAfterStage({ delivery, taskIntent, existingSession }) {
  if (delivery.stopAfterStage || taskIntent !== 'run_opl_stage_execution_plan') {
    return delivery.stopAfterStage;
  }

  if (delivery.route) {
    return delivery.route;
  }

  if (existingSession) {
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

function resolveTaskIntent(request, delivery, existingSession) {
  const explicitTaskIntent = safeText(request?.task_intent || request?.taskIntent || delivery.taskIntent);
  const taskIntent = explicitTaskIntent
    || (existingSession && delivery.route ? 'run_deliverable_route' : 'run_opl_stage_execution_plan');
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
  const latestStageExecutionPlanRef = resultSurface?.summary?.stage_execution_plan_ref
    || resultSurface?.plan_ref
    || resultSurface?.plan_id
    || null;
  const latestRunId = resultSurface?.summary?.run_id
    || resultSurface?.run?.run_id
    || null;

  return buildProductEntryContinuationSnapshot({
    latest_run_id: latestRunId,
    extra_payload: {
      latest_stage_execution_plan_ref: latestStageExecutionPlanRef,
      stage_execution_plan: resultSurface?.surface_kind === 'opl_stage_execution_plan' ? resultSurface : null,
      runtime_progress_projection: resultSurface?.progress_projection || null,
      runtime_projection: resultSurface?.runtime_projection || null,
      domain_authority_refs: resultSurface?.authority_refs || null,
      latest_surface_kind: resultSurface?.surface_kind || null,
    },
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

function requestedConstraints(delivery) {
  return isPlainObject(delivery?.constraints) ? delivery.constraints : {};
}

function constraintsHaveValues(delivery) {
  return Object.keys(requestedConstraints(delivery)).length > 0;
}

function surfaceBundleFiles({ overlayDefinition, deliverablePaths, contract }) {
  const surfaceFiles = [];
  for (const artifact of overlayDefinition.buildSurfaceBundle({ contract })) {
    const targetFile = path.join(deliverablePaths.deliverableDir, artifact.relativePath);
    writeJson(targetFile, artifact.content);
    surfaceFiles.push(targetFile);
  }
  return surfaceFiles;
}

function rehydrateDeliverableContractWithConstraints({
  workspaceRoot,
  deliverableFamily,
  topicId,
  deliverableId,
  delivery,
}) {
  if (!constraintsHaveValues(delivery)) return null;

  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = readJson(deliverablePaths.deliverableFile);
  const contractRef = safeText(deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  const contractFile = path.join(deliverablePaths.deliverableDir, contractRef);
  const existingContract = readJson(contractFile);
  const currentConstraints = isPlainObject(existingContract?.delivery_request?.constraints)
    ? existingContract.delivery_request.constraints
    : {};
  const mergedConstraints = mergeJsonObject(currentConstraints, requestedConstraints(delivery));
  if (stableJson(currentConstraints) === stableJson(mergedConstraints)) {
    return null;
  }

  const overlayDefinition = overlayRegistry.getOverlay(deliverableFamily);
  if (typeof overlayDefinition.buildSurfaceBundle !== 'function') {
    throw new Error(`Overlay ${deliverableFamily} cannot hydrate deliverable surfaces`);
  }
  const hydratedContract = hydrateDeliverableContract(overlayRegistry, {
    overlay: deliverableFamily,
    profileId: safeText(deliverable.profile_id || existingContract.profile_id),
    topicId,
    deliverableId,
    title: safeText(deliverable.title || existingContract.title),
    goal: safeText(deliverable.goal || existingContract.goal),
    constraints: mergedConstraints,
  });
  const surfaceFiles = surfaceBundleFiles({
    overlayDefinition,
    deliverablePaths,
    contract: hydratedContract,
  });

  return {
    hydratedContract,
    governance_surface: buildGovernanceSurfaceContract(hydratedContract),
    surfaceFiles,
    mergedConstraints,
  };
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
    latest_run_id: continuationSnapshot.latest_run_id,
    latest_stage_execution_plan_ref: continuationSnapshot.latest_stage_execution_plan_ref || null,
    stage_execution_plan: continuationSnapshot.stage_execution_plan || null,
    runtime_progress_projection: continuationSnapshot.runtime_progress_projection || null,
    runtime_projection: continuationSnapshot.runtime_projection || null,
    closeout_first_blocker: continuationSnapshot.closeout_first_blocker || null,
    progress_delta: continuationSnapshot.progress_delta || null,
    stall_lineage: continuationSnapshot.stall_lineage || null,
    latest_surface_kind: continuationSnapshot.latest_surface_kind
      || (continuationSnapshot.latest_stage_execution_plan_ref ? 'opl_stage_execution_plan' : null)
      || 'route_run',
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
  const latestHandle = continuationSnapshot.latest_stage_execution_plan_ref
    || continuationSnapshot.latest_run_id
    || null;
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
      constraints: delivery.constraints,
    });
    createdDeliverable = true;
  }

  const rehydrated = !createdDeliverable
    ? rehydrateDeliverableContractWithConstraints({
      workspaceRoot,
      deliverableFamily,
      topicId,
      deliverableId,
      delivery,
    })
    : null;

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
  entrySession,
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
      surface_kind: taskIntent === 'run_deliverable_route' ? 'route_run' : 'opl_stage_execution_plan',
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
      cross_provider_attempt_index: delivery.crossProviderAttemptIndex
        || (entrySession.providerAttemptRef || entrySession.providerAttemptLedgerRef
        ? {
            surface_kind: 'cross_provider_attempt_index',
            local_session_ref: `product-entry-session:${entrySession.entrySessionId}`,
            provider_attempt_owner: 'one-person-lab',
            provider_attempt_ref: entrySession.providerAttemptRef || undefined,
            provider_attempt_ledger_ref: entrySession.providerAttemptLedgerRef || undefined,
          }
        : undefined),
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
  const storedSession = loadProductEntrySessionRef({ entrySessionId: entrySession.entrySessionId });
  const currentness = storedSession ? resolveProductEntryCurrentness({ session: storedSession }) : null;
  const existingSession = currentness?.session || storedSession;
  const delivery = normalizeDeliveryRequest(request);
  const taskIntent = resolveTaskIntent(request, delivery, existingSession);
  const entryMode = safeText(request?.entry_mode || request?.entryMode, 'redcube_product_entry');
  const runtimeOwner = entryMode === 'opl_hosted' ? HOSTED_RUNTIME_OWNER : DEFAULT_RUNTIME_OWNER;

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
  const closeoutFirstBlocker = currentness?.closeoutFirstBlocker || existingSession?.closeout_first_blocker || null;
  const domainEntrySurface = closeoutFirstBlocker
    ? buildCloseoutBlockedDomainEntrySurface({
      taskIntent,
      entryMode,
      runtimeOwner,
      workspaceRoot,
      deliveryIdentity: resolvedIdentity,
      closeoutFirstBlocker,
    })
    : await invokeDomainEntry(buildDomainEntryRequest({
    workspaceRoot,
    entrySession,
    taskIntent,
    entryMode,
    runtimeOwner,
    delivery,
    resolvedIdentity,
  }));

  const continuationSnapshot = closeoutFirstBlocker
    ? buildProductEntryContinuationSnapshot({
      latest_run_id: existingSession.latest_run_id || closeoutFirstBlocker.latest_run_id || null,
      extra_payload: buildContinuationSnapshotFromSessionRecord(existingSession),
    })
    : buildContinuationSnapshot(domainEntrySurface);
  const persisted = saveProductEntrySessionRef({
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
    source: entryMode === 'opl_hosted' ? 'opl_hosted' : 'direct',
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
    source: entryMode === 'opl_hosted' ? 'opl_hosted' : 'direct',
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
