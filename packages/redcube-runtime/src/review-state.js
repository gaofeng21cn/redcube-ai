import path from 'node:path';
import { mkdirSync, existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';

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
    baseline: null,
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

export function getReviewState(request) {
  const { workspaceRoot, topicId, deliverableId } = request;
  const { deliverablePaths, contract } = loadContractAndPaths({ workspaceRoot, topicId, deliverableId });
  const file = reviewStateFile(deliverablePaths);
  const state = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf-8'))
    : defaultState({ contract, topicId, deliverableId });
  return {
    ok: true,
    state,
    state_file: file,
    history_file: reviewHistoryFile(deliverablePaths),
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
  return {
    ok: true,
    state: next,
    state_file: file,
    history_file: historyFile,
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
  throw new Error(`Unsupported review mutation type: ${type}`);
}
