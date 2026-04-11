import path from 'node:path';
import { mkdirSync, existsSync, readFileSync, appendFileSync, writeFileSync, readdirSync } from 'node:fs';

import { getDeliverablePaths, loadSourceReadinessSummary as loadCanonicalSourceReadinessSummary } from '@redcube/runtime-protocol';
import { assertGovernanceParity, buildGovernanceSurface, validatePublicationProjection } from './governance-surface.js';

function loadContractAndPaths({ workspaceRoot, topicId, deliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const contract = JSON.parse(readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'));
  return { deliverablePaths, deliverable, contract };
}

function reviewStateFile(deliverablePaths) {
  return path.join(deliverablePaths.reportsDir, 'review-state.json');
}

function reviewHistoryFile(deliverablePaths) {
  return path.join(deliverablePaths.reportsDir, 'review-history.jsonl');
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function defaultState({ contract, topicId, deliverableId }) {
  const approvalRequired = Boolean(contract?.delivery_contract?.human_gate?.required);
  return {
    schema_version: 1,
    overlay: contract.overlay,
    profile_id: contract.profile_id,
    topic_id: topicId,
    deliverable_id: deliverableId,
    current_status: 'idle',
    ready_for_export: false,
    latest_review_stage: null,
    latest_review_artifact: null,
    latest_checks: {},
    pending_reviews: [],
    blocking_reasons: [],
    rerun_from_stage: null,
    rerun_policy: {
      status: 'idle',
      rerun_from_stage: null,
    },
    baseline: null,
    approval_state: {
      required: approvalRequired,
      status: approvalRequired ? 'pending_artifacts' : 'not_required',
      requested_at: null,
      approved_at: null,
      approved_by: null,
    },
    publish_state: {
      current: approvalRequired ? 'draft' : 'not_applicable',
      promoted_at: null,
      approved_by: null,
    },
    mutation_count: 0,
    history_count: 0,
    last_mutation: null,
    last_updated_at: null,
  };
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function uniqueList(items) {
  return [...new Set(normalizeList(items))];
}

function writeState(file, state) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf-8');
}

function appendHistory(file, entry) {
  ensureDir(path.dirname(file));
  appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf-8');
}

function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages.find((item) => item?.stage_id === stageId)
    : null;
  const artifactName = safeText(stage?.output_artifact, `${stageId}.json`);
  return path.join(deliverablePaths.artifactsDir, artifactName);
}

function loadDeliveryArtifact({ contract, deliverablePaths }) {
  const route = safeText(contract?.delivery_contract?.required_export_route);
  if (!route) return null;
  return safeReadJson(stageArtifactPath(contract, deliverablePaths, route));
}

function loadSourceReadinessSummary({ workspaceRoot, topicId }) {
  return workspaceRoot && topicId ? loadCanonicalSourceReadinessSummary(workspaceRoot, topicId) : null;
}

function buildQualitySummary(state) {
  const relativeQuality = state?.baseline?.relative_quality || null;
  return {
    relative_quality_verdict: relativeQuality?.verdict || null,
    degradations: Array.isArray(relativeQuality?.degradations) ? relativeQuality.degradations : [],
    improvements: Array.isArray(relativeQuality?.improvements) ? relativeQuality.improvements : [],
    acceptable_changes: Array.isArray(relativeQuality?.acceptable_changes) ? relativeQuality.acceptable_changes : [],
    baseline_promotion_state: state?.baseline?.promotion_state || null,
    promoted_reference_id: state?.baseline?.promoted_reference_id || null,
  };
}

function deriveArtifactGovernanceState({ previous, patch, contract }) {
  const approvalRequired = Boolean(contract?.delivery_contract?.human_gate?.required);
  const baseApproval = previous?.approval_state || defaultState({
    contract,
    topicId: previous?.topic_id || '',
    deliverableId: previous?.deliverable_id || '',
  }).approval_state;
  const basePublish = previous?.publish_state || defaultState({
    contract,
    topicId: previous?.topic_id || '',
    deliverableId: previous?.deliverable_id || '',
  }).publish_state;

  if (!approvalRequired) {
    return {
      approval_state: baseApproval,
      publish_state: basePublish,
    };
  }

  const stage = String(patch?.latest_review_stage || '').trim();
  if (!['publish_copy', 'export_bundle'].includes(stage)) {
    return {
      approval_state: baseApproval,
      publish_state: basePublish,
    };
  }

  const readyForExport = Boolean(patch?.ready_for_export);
  const pendingReviews = normalizeList(patch?.pending_reviews);
  const blocked = String(patch?.current_status || '').trim() === 'blocked_for_revision' || !readyForExport;

  if (blocked) {
    return {
      approval_state: {
        ...baseApproval,
        required: true,
        status: 'changes_requested',
        requested_at: null,
        approved_at: null,
        approved_by: null,
      },
      publish_state: {
        ...basePublish,
        current: 'draft',
        promoted_at: null,
        approved_by: null,
      },
    };
  }

  if (readyForExport && pendingReviews.length === 0) {
    return {
      approval_state: {
        ...baseApproval,
        required: true,
        status: 'pending_human',
        requested_at: baseApproval.requested_at || nowIso(),
        approved_at: null,
        approved_by: null,
      },
      publish_state: {
        ...basePublish,
        current: 'approval_pending',
        promoted_at: null,
        approved_by: null,
      },
    };
  }

  return {
    approval_state: baseApproval,
    publish_state: basePublish,
  };
}

function derivePublishNext(current) {
  if (current === 'draft') return 'approval_pending';
  if (current === 'approval_pending') return 'approved_pending_publish';
  if (current === 'approved_pending_publish') return 'published';
  return null;
}

function buildGateSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
  operatorHandoff,
}) {
  return {
    source_readiness_status: sourceReadinessSummary?.status || null,
    source_planning_ready: sourceReadinessSummary?.planning_ready === true,
    source_sufficiency_status: safeText(sourceReadinessSummary?.sufficiency_status) || null,
    source_deep_research_state: safeText(sourceReadinessSummary?.deep_research_state) || null,
    source_blocking_evidence_gaps: uniqueList(sourceReadinessSummary?.blocking_evidence_gaps),
    source_next_required_surface: safeText(sourceReadinessSummary?.next_required_surface) || null,
    review_status: safeText(reviewState?.current_status) || null,
    approval_status: safeText(reviewState?.approval_state?.status) || null,
    latest_review_stage: safeText(reviewState?.latest_review_stage) || null,
    export_status: reviewState ? (reviewState.ready_for_export ? 'ready' : 'not_ready') : null,
    required_export_route: safeText(contract?.delivery_contract?.required_export_route) || null,
    required_export_bundle_id: safeText(
      contract?.delivery_contract?.required_export_bundle_id || contract?.export_bundle?.bundle_id,
    ) || null,
    approval_required: Boolean(contract?.delivery_contract?.human_gate?.required),
    delivery_projection_current: safeText(publicationProjectionEntry?.current) || null,
    delivery_projection_next: safeText(publicationProjectionEntry?.next) || null,
    operator_handoff_status: safeText(operatorHandoff?.gate_status) || null,
    delivery_state_owner: safeText(operatorHandoff?.delivery_state_owner) || null,
  };
}

function toDirectDeliveryNext(current) {
  if (current === 'draft') return 'export_ready';
  if (current === 'export_ready') return 'output_ready';
  return null;
}

function buildProjectionState({ reviewState, contract, deliveryArtifact }) {
  const deliveryContract = contract?.delivery_contract || null;
  const projectionModel = safeText(deliveryContract?.projection_model);
  const artifactDeliveryState = deliveryArtifact?.export_bundle?.delivery_state || null;
  if (projectionModel === 'human_publication') {
    const current = safeText(reviewState?.publish_state?.current, 'draft');
    return {
      current,
      next: derivePublishNext(current),
      delivery_state: artifactDeliveryState,
    };
  }

  if (artifactDeliveryState?.current) {
    return {
      current: safeText(artifactDeliveryState.current),
      next: safeText(artifactDeliveryState.next) || null,
      delivery_state: artifactDeliveryState,
    };
  }

  if (reviewState?.ready_for_export) {
    return {
      current: safeText(deliveryContract?.projection_states?.ready_for_export, 'export_ready'),
      next: safeText(deliveryContract?.projection_states?.output_ready) || null,
      delivery_state: null,
    };
  }

  return {
    current: 'draft',
    next: safeText(deliveryContract?.projection_states?.ready_for_export, toDirectDeliveryNext('draft')) || null,
    delivery_state: null,
  };
}

function buildOperatorHandoffSummary({
  sourceReadinessSummary,
  reviewState,
  contract,
  publicationProjectionEntry,
}) {
  const handoffContract = contract?.delivery_contract?.operator_handoff || null;
  if (!handoffContract) {
    return null;
  }

  const readyState = safeText(
    handoffContract?.handoff_ready_state,
    safeText(contract?.delivery_contract?.projection_states?.output_ready, 'output_ready'),
  );
  const deliveryStateCurrent = safeText(publicationProjectionEntry?.delivery_state?.current);
  const projectionCurrent = safeText(publicationProjectionEntry?.current);
  const blockingReasons = [];

  if (sourceReadinessSummary?.status !== 'pass') {
    const sourceBlocks = uniqueList(sourceReadinessSummary?.blocking_reasons);
    blockingReasons.push(...(sourceBlocks.length > 0 ? sourceBlocks : [`source_readiness_${safeText(sourceReadinessSummary?.status, 'unknown')}`]));
  }

  const reviewBlocks = uniqueList([
    ...(reviewState?.current_status === 'blocked_for_revision' ? reviewState?.blocking_reasons : []),
    ...reviewState?.pending_reviews,
  ]);
  if (reviewBlocks.length > 0) {
    blockingReasons.push(...reviewBlocks);
  }

  if (!reviewState?.ready_for_export) {
    blockingReasons.push('export_not_ready');
  }

  if (deliveryStateCurrent !== readyState && projectionCurrent !== readyState) {
    blockingReasons.push(`handoff_state_not_${readyState}`);
  }

  return {
    handoff_kind: 'direct_delivery_operator',
    gate_status: blockingReasons.length === 0 ? 'ready' : 'blocked',
    blocking_reasons: uniqueList(blockingReasons),
    delivery_state_owner: safeText(handoffContract?.owner_surface) || null,
    required_export_route: safeText(contract?.delivery_contract?.required_export_route) || null,
    required_export_bundle_id: safeText(contract?.delivery_contract?.required_export_bundle_id) || null,
    canonical_export_artifact: publicationProjectionEntry?.canonical_export_artifact || null,
    delivery_state_current: deliveryStateCurrent || null,
    delivery_state_next: safeText(publicationProjectionEntry?.delivery_state?.next) || null,
    reopen_mutation_surface: safeText(handoffContract?.reopen_mutation_surface) || null,
    closeout_mutation_surface: safeText(handoffContract?.closeout_mutation_surface) || null,
    gate_surfaces: Array.isArray(handoffContract?.gate_surfaces)
      ? handoffContract.gate_surfaces.map((surface) => safeText(surface)).filter(Boolean)
      : [],
    handoff_ready_state: readyState,
  };
}

function normalizeObjectMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key).trim(), safeText(item) || null])
      .filter(([key, item]) => key && item),
  );
}

function buildLifecycleStageSummary(contract) {
  const lifecycleStageContract = contract?.lifecycle_stage_contract || null;
  if (!lifecycleStageContract) {
    return null;
  }

  return {
    stage_model: safeText(lifecycleStageContract.stage_model) || null,
    human_workline: normalizeList(lifecycleStageContract.human_workline),
    macro_lifecycle: normalizeList(lifecycleStageContract.macro_lifecycle),
    human_to_macro_stage: normalizeObjectMap(lifecycleStageContract.human_to_macro_stage),
    review_overlay_within: safeText(lifecycleStageContract.review_overlay_within) || null,
    operator_handoff_within: safeText(lifecycleStageContract.operator_handoff_within) || null,
    closeout_within: safeText(lifecycleStageContract.closeout_within) || null,
    route_to_human_stage: normalizeObjectMap(lifecycleStageContract.route_to_human_stage),
  };
}

function toPublicationProjectionEntry({
  reviewState,
  deliverableId,
  contract,
  deliverablePaths,
  sourceReadinessSummary,
}) {
  const deliveryContract = contract?.delivery_contract || null;
  const deliveryArtifact = loadDeliveryArtifact({ contract, deliverablePaths });
  const projectionState = buildProjectionState({ reviewState, contract, deliveryArtifact });
  const lifecycleStageSummary = buildLifecycleStageSummary(contract);
  const governanceSurface = buildGovernanceSurface(contract);
  const entry = {
    deliverable_id: deliverableId,
    overlay: safeText(contract?.overlay) || null,
    profile_id: safeText(contract?.profile_id) || null,
    projection_model: safeText(deliveryContract?.projection_model) || null,
    current: projectionState.current,
    next: projectionState.next,
    current_status: safeText(reviewState?.current_status, 'idle'),
    ready_for_export: Boolean(reviewState?.ready_for_export),
    approval_status: safeText(reviewState?.approval_state?.status, 'not_required'),
    approval_required: Boolean(deliveryContract?.human_gate?.required),
    latest_review_stage: safeText(reviewState?.latest_review_stage) || null,
    required_export_route: safeText(deliveryContract?.required_export_route) || null,
    required_export_bundle_id: safeText(deliveryContract?.required_export_bundle_id) || null,
    canonical_export_artifact: deliveryContract?.required_export_route
      ? stageArtifactPath(contract, deliverablePaths, deliveryContract.required_export_route)
      : null,
    delivery_state: projectionState.delivery_state,
    governance_surface: governanceSurface,
    source_readiness_summary: sourceReadinessSummary,
    lifecycle_stage_summary: lifecycleStageSummary,
    updated_at: safeText(reviewState?.last_updated_at) || null,
  };
  const operatorHandoff = buildOperatorHandoffSummary({
    sourceReadinessSummary,
    reviewState,
    contract,
    publicationProjectionEntry: entry,
  });
  return {
    ...entry,
    operator_handoff: operatorHandoff,
    gate_summary: buildGateSummary({
      sourceReadinessSummary,
      reviewState,
      contract,
      publicationProjectionEntry: entry,
      operatorHandoff,
    }),
  };
}

function publicationPriority(current) {
  if (current === 'published') return 6;
  if (current === 'approved_pending_publish') return 5;
  if (current === 'approval_pending') return 4;
  if (current === 'output_ready') return 3;
  if (current === 'completed') return 3;
  if (current === 'export_ready') return 2;
  if (current === 'publish_ready') return 2;
  if (current === 'draft') return 1;
  return 0;
}

function sortPublicationEntries(left, right) {
  const priorityDelta = publicationPriority(right?.current) - publicationPriority(left?.current);
  if (priorityDelta !== 0) return priorityDelta;
  return String(right?.updated_at || '').localeCompare(String(left?.updated_at || ''));
}

export function rebuildTopicPublicationProjection({ workspaceRoot, topicId }) {
  const topicDir = path.join(workspaceRoot, 'topics', topicId);
  const deliverablesDir = path.join(topicDir, 'deliverables');
  const projectionFile = path.join(topicDir, 'publication-state.json');
  const entries = {};
  const sourceReadinessSummary = loadSourceReadinessSummary({ workspaceRoot, topicId });

  if (existsSync(deliverablesDir)) {
    for (const item of readdirSync(deliverablesDir, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      const deliverableId = item.name;
      const deliverableDir = path.join(deliverablesDir, deliverableId);
      const deliverable = safeReadJson(path.join(deliverableDir, 'deliverable.json'));
      if (!deliverable) continue;
      const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
      const contractRef = safeText(deliverable?.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
      const contract = safeReadJson(path.join(deliverableDir, contractRef));
      if (!contract) continue;
      const reviewState = safeReadJson(path.join(deliverableDir, 'reports', 'review-state.json'))
        || defaultState({ contract, topicId, deliverableId });
      entries[deliverableId] = toPublicationProjectionEntry({
        reviewState,
        deliverableId,
        contract,
        deliverablePaths,
        sourceReadinessSummary,
      });
    }
  }

  const orderedEntries = Object.values(entries).sort(sortPublicationEntries);
  const topEntry = orderedEntries[0] || null;
  const publication = {
    schema_version: 2,
    projection_kind: 'topic_delivery_projection',
    topic_id: topicId,
    current: topEntry?.current || 'input_ready',
    next: topEntry?.next || null,
    deliverables: entries,
    updated_at: nowIso(),
  };
  validatePublicationProjection(publication);
  writeState(projectionFile, publication);
  return projectionFile;
}

export function isBaselineApprovedState(state) {
  if (!state) return false;
  if (state.approval_state?.required) {
    return state.approval_state.status === 'approved' || state.publish_state?.current === 'published';
  }
  return Boolean(state.ready_for_export);
}

export function getReviewState(request) {
  const { workspaceRoot, topicId, deliverableId } = request;
  const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
  const file = reviewStateFile(deliverablePaths);
  const state = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf-8'))
    : defaultState({ contract, topicId, deliverableId });
  const sourceReadinessSummary = loadSourceReadinessSummary({ workspaceRoot, topicId });
  const publicationProjectionEntry = toPublicationProjectionEntry({
    reviewState: state,
    deliverableId,
    contract,
    deliverablePaths,
    sourceReadinessSummary,
  });
  const projectionFile = path.join(workspaceRoot, 'topics', topicId, 'publication-state.json');
  if (existsSync(projectionFile)) {
    const publication = safeReadJson(projectionFile);
    if (!publication) {
      throw new Error('getReviewState governance summary invalid publication projection file');
    }
    validatePublicationProjection(publication);
    const storedEntry = publication?.deliverables?.[deliverableId] || null;
    if (!storedEntry) {
      throw new Error(`getReviewState governance parity missing publication projection entry for ${deliverableId}`);
    }
    assertGovernanceParity(
      `getReviewState.${deliverableId}`,
      publicationProjectionEntry,
      storedEntry,
    );
  }
  return {
    ok: true,
    surface_kind: 'review_state',
    state_type: 'canonical',
    canonical_source: {
      kind: 'review_state.publish_state',
    },
    state,
    quality_summary: buildQualitySummary(state),
    state_file: file,
    history_file: reviewHistoryFile(deliverablePaths),
    source_readiness_summary: sourceReadinessSummary,
    gate_summary: publicationProjectionEntry.gate_summary,
    operator_handoff: publicationProjectionEntry.operator_handoff,
    lifecycle_stage_summary: publicationProjectionEntry.lifecycle_stage_summary,
    governance_surface: publicationProjectionEntry.governance_surface,
  };
}

export function getPublicationProjection({ workspaceRoot, topicId }) {
  const projectionFile = path.join(workspaceRoot, 'topics', topicId, 'publication-state.json');
  if (!existsSync(projectionFile)) {
    rebuildTopicPublicationProjection({ workspaceRoot, topicId });
  }
  const publication = safeReadJson(projectionFile);
  if (!publication) {
    throw new Error('getPublicationProjection governance summary invalid publication projection file');
  }
  validatePublicationProjection(publication);
  return {
    ok: true,
    surface_kind: 'publication_projection',
    topic_id: topicId,
    state_type: 'projection',
    projection_file: projectionFile,
    publication,
    canonical_source: {
      kind: 'review_state.delivery_projection',
    },
  };
}

export function persistReviewStatePatch({ workspaceRoot, topicId, deliverableId, patch, source = 'artifact' }) {
  const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
  const file = reviewStateFile(deliverablePaths);
  const historyFile = reviewHistoryFile(deliverablePaths);
  const previous = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf-8'))
    : defaultState({ contract, topicId, deliverableId });

  const artifactGovernanceState = source === 'artifact'
    ? deriveArtifactGovernanceState({ previous, patch, contract })
    : null;

  const next = {
    ...previous,
    ...patch,
    pending_reviews: patch.pending_reviews !== undefined ? normalizeList(patch.pending_reviews) : previous.pending_reviews,
    blocking_reasons: patch.blocking_reasons !== undefined ? normalizeList(patch.blocking_reasons) : previous.blocking_reasons,
    rerun_from_stage: Object.hasOwn(patch, 'rerun_from_stage') ? patch.rerun_from_stage : previous.rerun_from_stage,
    latest_checks: patch.latest_checks ? { ...previous.latest_checks, ...patch.latest_checks } : previous.latest_checks,
    baseline: patch.baseline ? { ...(previous.baseline || {}), ...patch.baseline } : previous.baseline,
    rerun_policy: patch.rerun_policy ? { ...(previous.rerun_policy || {}), ...patch.rerun_policy } : previous.rerun_policy,
    approval_state: patch.approval_state
      ? { ...(previous.approval_state || {}), ...patch.approval_state }
      : (artifactGovernanceState?.approval_state || previous.approval_state),
    publish_state: patch.publish_state
      ? { ...(previous.publish_state || {}), ...patch.publish_state }
      : (artifactGovernanceState?.publish_state || previous.publish_state),
    last_updated_at: nowIso(),
  };
  next.history_count = Number(previous.history_count || 0) + 1;
  if (source === 'mutation') {
    next.mutation_count = Number(previous.mutation_count || 0) + 1;
    next.last_mutation = patch.last_mutation || null;
  } else {
    next.mutation_count = Number(previous.mutation_count || 0);
  }
  writeState(file, next);
  appendHistory(historyFile, {
    timestamp: next.last_updated_at,
    source,
    patch,
  });
  const publicationStateFile = rebuildTopicPublicationProjection({ workspaceRoot, topicId });
  return {
    ok: true,
    state: next,
    quality_summary: buildQualitySummary(next),
    state_file: file,
    history_file: historyFile,
    publication_state_file: publicationStateFile,
  };
}

export function applyReviewMutation({ workspaceRoot, topicId, deliverableId, mutation }) {
  const type = String(mutation?.type || '').trim();
  if (!type) {
    throw new Error('mutation.type 不能为空');
  }
  if (type === 'request_changes') {
    return persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      source: 'mutation',
      patch: {
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        pending_reviews: normalizeList(mutation?.issues),
        blocking_reasons: normalizeList([...(mutation?.issues || []), mutation?.notes || '']).filter(Boolean),
        rerun_from_stage: String(mutation?.rerun_from_stage || '').trim() || null,
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: String(mutation?.rerun_from_stage || '').trim() || null,
        },
        approval_state: {
          status: 'changes_requested',
          approved_at: null,
          approved_by: null,
        },
        publish_state: {
          current: 'draft',
          promoted_at: null,
          approved_by: null,
        },
        last_mutation: {
          type,
          actor: String(mutation?.actor || 'unknown'),
          review_stage: String(mutation?.review_stage || '').trim() || null,
          notes: String(mutation?.notes || '').trim() || null,
        },
      },
    });
  }
  if (type === 'bind_baseline') {
    if (!String(mutation?.baseline_deliverable_id || '').trim()) {
      throw new Error('bind_baseline 需要 baseline_deliverable_id');
    }
    return persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      source: 'mutation',
      patch: {
        baseline: {
          baseline_deliverable_id: String(mutation?.baseline_deliverable_id || '').trim(),
          notes: String(mutation?.notes || '').trim() || null,
        },
        last_mutation: {
          type,
          actor: String(mutation?.actor || 'unknown'),
          notes: String(mutation?.notes || '').trim() || null,
        },
      },
    });
  }
  if (type === 'approve_publish') {
    const current = getReviewState({ workspaceRoot, topicId, deliverableId }).state;
    if (current?.current_status !== 'publish_ready') {
      throw new Error('approve_publish requires current_status === publish_ready');
    }
    if (current?.approval_state?.status !== 'pending_human') {
      throw new Error('approve_publish requires approval_state.status === pending_human');
    }
    if (!current?.ready_for_export) {
      throw new Error('approve_publish requires ready_for_export === true');
    }
    if (normalizeList(current?.pending_reviews).length > 0) {
      throw new Error('approve_publish requires pending_reviews to be empty');
    }
    return persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      source: 'mutation',
      patch: {
        current_status: 'approved_for_publish',
        approval_state: {
          status: 'approved',
          approved_at: nowIso(),
          approved_by: String(mutation?.actor || 'unknown'),
        },
        publish_state: {
          current: 'approved_pending_publish',
          approved_by: String(mutation?.actor || 'unknown'),
        },
        last_mutation: {
          type,
          actor: String(mutation?.actor || 'unknown'),
          notes: String(mutation?.notes || '').trim() || null,
        },
      },
    });
  }
  if (type === 'promote_publish') {
    const current = getReviewState({ workspaceRoot, topicId, deliverableId }).state;
    if (current?.approval_state?.status !== 'approved') {
      throw new Error('promote_publish requires approval_state.status === approved');
    }
    if (current?.current_status !== 'approved_for_publish') {
      throw new Error('promote_publish requires current_status === approved_for_publish');
    }
    if (current?.publish_state?.current !== 'approved_pending_publish') {
      throw new Error('promote_publish requires publish_state.current === approved_pending_publish');
    }
    return persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      source: 'mutation',
      patch: {
        current_status: 'published',
        publish_state: {
          current: 'published',
          promoted_at: nowIso(),
          approved_by: String(mutation?.actor || current?.approval_state?.approved_by || 'unknown'),
        },
        last_mutation: {
          type,
          actor: String(mutation?.actor || 'unknown'),
          notes: String(mutation?.notes || '').trim() || null,
        },
      },
    });
  }
  if (type === 'promote_baseline') {
    const current = getReviewState({ workspaceRoot, topicId, deliverableId }).state;
    const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
    if (!current?.ready_for_export) {
      throw new Error('promote_baseline requires ready_for_export === true');
    }
    if (current?.approval_state?.required && current?.approval_state?.status !== 'approved' && current?.publish_state?.current !== 'published') {
      throw new Error('promote_baseline requires approval_state.status === approved or publish_state.current === published');
    }
    const promotedReferenceId = String(mutation?.promoted_reference_id || '').trim();
    if (!promotedReferenceId) {
      throw new Error('promote_baseline requires promoted_reference_id');
    }
    const latestArtifactFile = String(current?.latest_review_artifact || '').trim();
    const latestArtifact = latestArtifactFile ? safeReadJson(latestArtifactFile) : null;
    const screenshotStage = Array.isArray(contract?.stage_sequence?.stages)
      ? contract.stage_sequence.stages.find((stage) => stage?.stage_id === 'screenshot_review')
      : null;
    const screenshotArtifactName = String(screenshotStage?.output_artifact || 'screenshot_review.json').trim();
    const screenshotReviewArtifact = safeReadJson(path.join(deliverablePaths.artifactsDir, screenshotArtifactName));
    const relativeQuality = latestArtifact?.baseline_review?.relative_quality
      || screenshotReviewArtifact?.baseline_review?.relative_quality
      || null;
    if (!relativeQuality || !Array.isArray(relativeQuality.dimensions) || relativeQuality.dimensions.length === 0) {
      throw new Error('promote_baseline requires structured relative_quality');
    }
    return persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      source: 'mutation',
      patch: {
        baseline: {
          ...(current?.baseline || {}),
          promotion_state: 'promoted',
          promoted_reference_id: promotedReferenceId,
          source_deliverable_id: deliverableId,
          promoted_at: nowIso(),
          promoted_by: String(mutation?.actor || 'unknown'),
          promotion_notes: String(mutation?.notes || '').trim() || null,
          relative_quality: relativeQuality,
        },
        last_mutation: {
          type,
          actor: String(mutation?.actor || 'unknown'),
          notes: String(mutation?.notes || '').trim() || null,
        },
      },
    });
  }
  throw new Error(`Unsupported review mutation type: ${type}`);
}
