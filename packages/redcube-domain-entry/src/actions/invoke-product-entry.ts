// @ts-nocheck
import { isDeepStrictEqual } from 'node:util';

import {
  getPublicationProjection,
  getReviewState,
} from '@redcube/runtime';

import { invokeDomainEntry } from './invoke-domain-entry.js';
import { ensureProductEntryDeliverable } from './product-entry-deliverable.js';
import {
  buildProductEntrySessionHandoffRefs,
  normalizeOplGeneratedProductSessionSurface,
} from './product-entry-domain-snapshot-refs.js';
import { requireField, safeText } from './action-utils.js';

const PRODUCT_ENTRY_ID = 'redcube_product_entry';
const RUNTIME_OWNER = 'configured_family_runtime_provider';
const DEFAULT_EXECUTOR_ADAPTER_SURFACE = 'opl_codex_executor';
const SUPPORTED_TASK_INTENTS = new Set(['run_opl_stage_execution_plan', 'run_deliverable_route']);
const TRUSTED_PROVIDER_ATTEMPT_FIELDS = [
  'surface_kind',
  'version',
  'owner',
  'provider_attempt_owner',
  'domain_adapter_owner',
  'provider_attempt_ref',
  'provider_attempt_ledger_ref',
  'stage_attempt_ref',
  'attempt_lease_ref',
  'attempt_receipt_ref',
  'execution_owner',
];

function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_locator.workspace_root',
    request?.workspace_locator?.workspace_root || request?.workspaceLocator?.workspaceRoot || request?.workspaceRoot,
  );
}

function normalizeEntrySessionContract(request) {
  const contract = request?.entry_session_contract || request?.entrySessionContract || {};
  const entrySessionId = requireField(
    'entry_session_contract.entry_session_id',
    contract.entry_session_id || contract.entrySessionId || request?.entrySessionId,
  );
  const oplGeneratedSessionSurface = normalizeOplGeneratedProductSessionSurface(
    contract.opl_generated_session_surface
      || contract.oplGeneratedSessionSurface
      || request?.opl_generated_session_surface
      || request?.oplGeneratedSessionSurface,
    entrySessionId,
  );
  const requestedProviderAttemptRef = safeText(
    contract.provider_attempt_ref
      || contract.providerAttemptRef
      || request?.providerAttemptRef,
  ) || null;
  const requestedProviderAttemptLedgerRef = safeText(
    contract.provider_attempt_ledger_ref
      || contract.providerAttemptLedgerRef
      || request?.providerAttemptLedgerRef,
  ) || null;
  const generatedProviderAttemptRef = oplGeneratedSessionSurface
    ?.currentness_refs.provider_attempt_ref || null;
  const generatedProviderAttemptLedgerRef = oplGeneratedSessionSurface
    ?.currentness_refs.provider_attempt_ledger_ref || null;
  if (oplGeneratedSessionSurface && requestedProviderAttemptRef
    && requestedProviderAttemptRef !== generatedProviderAttemptRef) {
    throw new Error(
      'entry_session_contract.provider_attempt_ref does not match the OPL generated session',
    );
  }
  if (oplGeneratedSessionSurface && requestedProviderAttemptLedgerRef
    && requestedProviderAttemptLedgerRef !== generatedProviderAttemptLedgerRef) {
    throw new Error(
      'entry_session_contract.provider_attempt_ledger_ref does not match the OPL generated session',
    );
  }
  const providerAttemptRef = requestedProviderAttemptRef || generatedProviderAttemptRef;
  const providerAttemptLedgerRef = requestedProviderAttemptLedgerRef || generatedProviderAttemptLedgerRef;
  if (Boolean(providerAttemptRef) !== Boolean(providerAttemptLedgerRef)) {
    throw new Error('entry_session_contract provider attempt currentness requires both provider refs');
  }
  return {
    entrySessionId,
    providerAttemptRef,
    providerAttemptLedgerRef,
    oplGeneratedSessionSurface,
  };
}

function normalizeDeliveryRequest(request) {
  const delivery = request?.delivery_request || request?.deliveryRequest || {};
  return {
    deliverableFamily: safeText(delivery.deliverable_family || delivery.deliverableFamily || delivery.overlay),
    topicId: safeText(delivery.topic_id || delivery.topicId),
    deliverableId: safeText(delivery.deliverable_id || delivery.deliverableId),
    profileId: safeText(delivery.profile_id || delivery.profileId),
    title: safeText(delivery.title),
    goal: safeText(delivery.goal),
    route: safeText(delivery.route),
    adapter: safeText(delivery.adapter),
    userIntent: safeText(delivery.user_intent || delivery.userIntent),
    stopAfterStage: safeText(delivery.stop_after_stage || delivery.stopAfterStage),
    lifecyclePolicy: safeText(delivery.lifecycle_policy || delivery.lifecyclePolicy),
    mode: safeText(delivery.mode),
    baselineDeliverableId: safeText(delivery.baseline_deliverable_id || delivery.baselineDeliverableId),
    taskIntent: safeText(delivery.task_intent || delivery.taskIntent),
    crossProviderAttemptIndex: delivery.cross_provider_attempt_index || delivery.crossProviderAttemptIndex || null,
    constraints: delivery.constraints && typeof delivery.constraints === 'object' && !Array.isArray(delivery.constraints)
      ? delivery.constraints
      : {},
  };
}

function resolveLifecycleStopAfterStage({ delivery, taskIntent, hasOplGeneratedSessionSurface }) {
  if (delivery.stopAfterStage || taskIntent !== 'run_opl_stage_execution_plan') return delivery.stopAfterStage;
  if (hasOplGeneratedSessionSurface) return '';
  if (delivery.lifecyclePolicy === 'operator_review_after_plan') return 'detailed_outline';
  if (delivery.lifecyclePolicy && delivery.lifecyclePolicy !== 'auto_to_terminal') {
    throw new Error(`Unsupported delivery_request.lifecycle_policy: ${delivery.lifecyclePolicy}`);
  }
  return '';
}

function resolveTaskIntent(request, delivery, hasOplGeneratedSessionSurface) {
  const explicitTaskIntent = safeText(request?.task_intent || request?.taskIntent || delivery.taskIntent);
  const taskIntent = explicitTaskIntent
    || (hasOplGeneratedSessionSurface && delivery.route
      ? 'run_deliverable_route'
      : 'run_opl_stage_execution_plan');
  if (!SUPPORTED_TASK_INTENTS.has(taskIntent)) throw new Error(`Unsupported task_intent: ${taskIntent}`);
  return taskIntent;
}

function resolveBoundValue(fieldName, requestedValue, generatedValue) {
  const requested = safeText(requestedValue);
  const fromGenerated = safeText(generatedValue);
  if (requested && fromGenerated && requested !== fromGenerated) {
    throw new Error(`${fieldName} does not match the OPL generated session`);
  }
  return requested || fromGenerated;
}

function resolveDeliveryIdentity(delivery, oplGeneratedSessionSurface) {
  const locator = oplGeneratedSessionSurface?.delivery_locator_refs || {};
  return {
    deliverableFamily: resolveBoundValue(
      'delivery_request.deliverable_family',
      delivery.deliverableFamily,
      locator.deliverable_family,
    ),
    topicId: resolveBoundValue('delivery_request.topic_id', delivery.topicId, locator.topic_id),
    deliverableId: resolveBoundValue(
      'delivery_request.deliverable_id',
      delivery.deliverableId,
      locator.deliverable_id,
    ),
    profileId: resolveBoundValue('delivery_request.profile_id', delivery.profileId, locator.profile_id),
    title: delivery.title,
    goal: delivery.goal,
  };
}

function resolveCrossProviderAttemptIndex(delivery, entrySession) {
  const requested = delivery.crossProviderAttemptIndex;
  const generated = entrySession.oplGeneratedSessionSurface
    ?.currentness_refs.cross_provider_attempt_index || null;
  if (requested && (typeof requested !== 'object' || Array.isArray(requested))) {
    throw new Error('delivery_request.cross_provider_attempt_index must be an object');
  }
  if (requested && entrySession.oplGeneratedSessionSurface && !generated) {
    throw new Error(
      'delivery_request.cross_provider_attempt_index does not match the OPL generated session currentness',
    );
  }
  if (requested && generated) {
    for (const field of TRUSTED_PROVIDER_ATTEMPT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(requested, field)
        && requested[field] !== generated[field]) {
        throw new Error(
          `delivery_request.cross_provider_attempt_index.${field} does not match the OPL generated session`,
        );
      }
    }
    if (!isDeepStrictEqual(requested, generated)) {
      throw new Error(
        'delivery_request.cross_provider_attempt_index does not match the OPL generated session currentness',
      );
    }
    return generated;
  }
  if (requested) return requested;
  if (generated) return generated;
  return entrySession.providerAttemptRef && entrySession.providerAttemptLedgerRef
    ? {
        surface_kind: 'cross_provider_attempt_index',
        provider_attempt_owner: 'one-person-lab',
        provider_attempt_ref: entrySession.providerAttemptRef,
        provider_attempt_ledger_ref: entrySession.providerAttemptLedgerRef,
      }
    : undefined;
}

function buildDomainEntryRequest({
  workspaceRoot,
  entrySession,
  taskIntent,
  entryMode,
  delivery,
  resolvedIdentity,
}) {
  const providerAttemptIndex = resolveCrossProviderAttemptIndex(delivery, entrySession);
  return {
    target_domain_id: 'redcube_ai',
    task_intent: taskIntent,
    entry_mode: entryMode,
    workspace_locator: { workspace_root: workspaceRoot },
    runtime_session_contract: {
      runtime_owner: RUNTIME_OWNER,
      adapter_surface: DEFAULT_EXECUTOR_ADAPTER_SURFACE,
      session_mode: 'opl_generated_product_entry_session_surface',
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
      cross_provider_attempt_index: providerAttemptIndex,
    },
  };
}

async function readReviewAndPublicationSurfaces({ workspaceRoot, topicId, deliverableId }) {
  const [reviewState, publicationProjection] = await Promise.all([
    getReviewState({ workspaceRoot, topicId, deliverableId }),
    getPublicationProjection({ workspaceRoot, topicId }),
  ]);
  return { reviewState, publicationProjection };
}

function targetHandle(domainEntrySurface) {
  const resultSurface = domainEntrySurface?.result_surface || {};
  return safeText(
    resultSurface.summary?.stage_execution_plan_ref
      || resultSurface.plan_ref
      || resultSurface.plan_id
      || resultSurface.summary?.run_id
      || resultSurface.run?.run_id,
  ) || null;
}

export async function invokeProductEntry(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const entrySession = normalizeEntrySessionContract(request);
  const delivery = normalizeDeliveryRequest(request);
  const generatedSession = entrySession.oplGeneratedSessionSurface;
  if (generatedSession && generatedSession.delivery_locator_refs.workspace_ref !== workspaceRoot) {
    throw new Error('workspace_locator.workspace_root does not match the OPL generated session');
  }
  const taskIntent = resolveTaskIntent(request, delivery, Boolean(generatedSession));
  const entryMode = safeText(request?.entry_mode || request?.entryMode, 'redcube_product_entry');
  const deliveryIdentity = resolveDeliveryIdentity(delivery, generatedSession);
  delivery.stopAfterStage = resolveLifecycleStopAfterStage({
    delivery,
    taskIntent,
    hasOplGeneratedSessionSurface: Boolean(generatedSession),
  });
  const { createdDeliverable, resolvedIdentity } = await ensureProductEntryDeliverable({
    workspaceRoot,
    deliveryIdentity,
    delivery,
  });
  const domainEntrySurface = await invokeDomainEntry(buildDomainEntryRequest({
    workspaceRoot,
    entrySession,
    taskIntent,
    entryMode,
    delivery,
    resolvedIdentity,
  }));
  const sessionHandoffRefs = buildProductEntrySessionHandoffRefs({
    entrySession,
    workspaceRoot,
    deliveryIdentity: resolvedIdentity,
    domainEntrySurface,
  });
  const { reviewState, publicationProjection } = await readReviewAndPublicationSurfaces({
    workspaceRoot,
    topicId: resolvedIdentity.topicId,
    deliverableId: resolvedIdentity.deliverableId,
  });
  const handle = targetHandle(domainEntrySurface);

  return {
    ok: domainEntrySurface.ok,
    surface_kind: 'product_entry',
    recommended_action: domainEntrySurface.recommended_action || 'consume_domain_result_refs',
    product_entry_contract_id: PRODUCT_ENTRY_ID,
    domain_entry_surface: domainEntrySurface,
    session_handoff_refs: sessionHandoffRefs,
    review_state: reviewState,
    publication_projection: publicationProjection,
    authority_boundary: {
      domain_truth_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
      review_export_verdict_owner: 'redcube_ai',
      generic_session_runtime_owner: 'one-person-lab',
      stage_folder_substrate_owner: 'one-person-lab',
      rca_owns_generic_session_runtime: false,
      rca_owns_generic_progress_projection: false,
      rca_owns_generic_artifact_inventory: false,
      rca_owns_generic_workbench: false,
    },
    summary: {
      entry_session_id: entrySession.entrySessionId,
      task_intent: taskIntent,
      actual_surface_kind: domainEntrySurface.result_surface?.surface_kind || null,
      target_handle: handle,
      latest_handle: handle,
      created_deliverable: createdDeliverable,
    },
  };
}
