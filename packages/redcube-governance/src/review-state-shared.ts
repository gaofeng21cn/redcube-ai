// @ts-nocheck
import path from 'node:path';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';

import {
  getDeliverablePaths,
  loadSourceReadinessSummary as loadCanonicalSourceReadinessSummary,
} from '@redcube/runtime-protocol';

export function loadContractAndPaths({ workspaceRoot, topicId, deliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = JSON.parse(readFileSync(deliverablePaths.deliverableFile, 'utf-8'));
  const contractRef = String(deliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json').trim();
  const contract = JSON.parse(readFileSync(path.join(deliverablePaths.deliverableDir, contractRef), 'utf-8'));
  return { deliverablePaths, deliverable, contract };
}

export function reviewStateFile(deliverablePaths) {
  return path.join(deliverablePaths.reportsDir, 'review-state.json');
}

export function reviewHistoryFile(deliverablePaths) {
  return path.join(deliverablePaths.reportsDir, 'review-history.jsonl');
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function nowIso() {
  return new Date().toISOString();
}

export function defaultState({ contract, topicId, deliverableId }) {
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

export function normalizeList(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function uniqueList(items) {
  return [...new Set(normalizeList(items))];
}

export function writeState(file, state) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(state, null, 2), 'utf-8');
}

export function appendHistory(file, entry) {
  ensureDir(path.dirname(file));
  appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf-8');
}

export function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

export function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages.find((item) => item?.stage_id === stageId)
    : null;
  const artifactName = safeText(stage?.output_artifact, `${stageId}.json`);
  return path.join(deliverablePaths.artifactsDir, artifactName);
}

export function stageSequence(contract) {
  return Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages
      .map((stage) => safeText(stage?.stage_id))
      .filter(Boolean)
    : [];
}

export function stageIndex(contract, stageId) {
  const sequence = stageSequence(contract);
  return sequence.indexOf(safeText(stageId));
}

export function safeMtimeMs(file) {
  if (!safeText(file) || !existsSync(file)) {
    return 0;
  }
  try {
    return Number(statSync(file).mtimeMs || 0);
  } catch {
    return 0;
  }
}

export function loadSourceReadinessSummary({ workspaceRoot, topicId }) {
  return workspaceRoot && topicId ? loadCanonicalSourceReadinessSummary(workspaceRoot, topicId) : null;
}

export function buildQualitySummary(state) {
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

export function normalizeObjectMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key).trim(), safeText(item) || null])
      .filter(([key, item]) => key && item),
  );
}
