import path from 'node:path';
import { mkdirSync, existsSync, readFileSync, appendFileSync, writeFileSync, readdirSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

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
      required: contract.overlay === 'xiaohongshu',
      status: contract.overlay === 'xiaohongshu' ? 'pending_artifacts' : 'not_required',
      requested_at: null,
      approved_at: null,
      approved_by: null,
    },
    publish_state: {
      current: contract.overlay === 'xiaohongshu' ? 'draft' : 'not_applicable',
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

function derivePublishNext(current) {
  if (current === 'draft') return 'approval_pending';
  if (current === 'approval_pending') return 'approved_pending_publish';
  if (current === 'approved_pending_publish') return 'published';
  return null;
}

function toPublicationProjectionEntry(reviewState, deliverableId) {
  const current = String(reviewState?.publish_state?.current || 'draft').trim() || 'draft';
  return {
    deliverable_id: deliverableId,
    current,
    next: derivePublishNext(current),
    current_status: String(reviewState?.current_status || '').trim() || 'idle',
    ready_for_export: Boolean(reviewState?.ready_for_export),
    approval_status: String(reviewState?.approval_state?.status || '').trim() || 'not_required',
    updated_at: String(reviewState?.last_updated_at || '').trim() || null,
  };
}

function publicationPriority(current) {
  if (current === 'published') return 4;
  if (current === 'approved_pending_publish') return 3;
  if (current === 'approval_pending') return 2;
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

  if (existsSync(deliverablesDir)) {
    for (const item of readdirSync(deliverablesDir, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      const deliverableId = item.name;
      const deliverableDir = path.join(deliverablesDir, deliverableId);
      const deliverable = safeReadJson(path.join(deliverableDir, 'deliverable.json'));
      if (deliverable?.overlay !== 'xiaohongshu') continue;
      const reviewState = safeReadJson(path.join(deliverableDir, 'reports', 'review-state.json'));
      if (!reviewState) continue;
      entries[deliverableId] = toPublicationProjectionEntry(reviewState, deliverableId);
    }
  }

  const orderedEntries = Object.values(entries).sort(sortPublicationEntries);
  const topEntry = orderedEntries[0] || null;
  writeState(projectionFile, {
    schema_version: 1,
    topic_id: topicId,
    current: topEntry?.current || 'input_ready',
    next: topEntry?.next || null,
    deliverables: entries,
    updated_at: nowIso(),
  });
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
  return {
    ok: true,
    state_type: 'canonical',
    canonical_source: {
      kind: 'review_state.publish_state',
    },
    state,
    state_file: file,
    history_file: reviewHistoryFile(deliverablePaths),
  };
}

export function getPublicationProjection({ workspaceRoot, topicId }) {
  const projectionFile = path.join(workspaceRoot, 'topics', topicId, 'publication-state.json');
  const publication = safeReadJson(projectionFile) || (() => {
    rebuildTopicPublicationProjection({ workspaceRoot, topicId });
    return safeReadJson(projectionFile);
  })() || {
    schema_version: 1,
    topic_id: topicId,
    current: 'input_ready',
    next: null,
    deliverables: {},
  };
  return {
    ok: true,
    topic_id: topicId,
    state_type: 'projection',
    projection_file: projectionFile,
    publication,
    canonical_source: {
      kind: 'review_state.publish_state',
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

  const next = {
    ...previous,
    ...patch,
    pending_reviews: patch.pending_reviews !== undefined ? normalizeList(patch.pending_reviews) : previous.pending_reviews,
    blocking_reasons: patch.blocking_reasons !== undefined ? normalizeList(patch.blocking_reasons) : previous.blocking_reasons,
    rerun_from_stage: Object.hasOwn(patch, 'rerun_from_stage') ? patch.rerun_from_stage : previous.rerun_from_stage,
    latest_checks: patch.latest_checks ? { ...previous.latest_checks, ...patch.latest_checks } : previous.latest_checks,
    baseline: patch.baseline ? { ...(previous.baseline || {}), ...patch.baseline } : previous.baseline,
    rerun_policy: patch.rerun_policy ? { ...(previous.rerun_policy || {}), ...patch.rerun_policy } : previous.rerun_policy,
    approval_state: patch.approval_state ? { ...(previous.approval_state || {}), ...patch.approval_state } : previous.approval_state,
    publish_state: patch.publish_state ? { ...(previous.publish_state || {}), ...patch.publish_state } : previous.publish_state,
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
  const publicationStateFile = next.overlay === 'xiaohongshu'
    ? rebuildTopicPublicationProjection({ workspaceRoot, topicId })
    : null;
  return {
    ok: true,
    state: next,
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
  throw new Error(`Unsupported review mutation type: ${type}`);
}
