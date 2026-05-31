// @ts-nocheck
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const FORBIDDEN_RECEIPT_PAYLOAD_FIELDS = Object.freeze([
  'visual_truth',
  'visual_truth_body',
  'visual_verdict',
  'review_verdict',
  'export_verdict',
  'review_export_verdict',
  'review_export_verdict_body',
  'publication_gate',
  'canonical_artifact_blob',
  'artifact_blob',
  'artifact_body',
  'visual_memory_body',
  'memory_body',
  'memory_content_body',
  'generic_runtime_state',
  'managed_runtime_compatibility_alias',
]);

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot,
  );
}

export function readTaskPayload(request) {
  const payload = request?.task && typeof request.task === 'object'
    ? request.task
    : null;
  if (payload) {
    return payload;
  }

  const taskFile = requireField('task', request?.task_file || request?.taskFile);
  return JSON.parse(readFileSync(taskFile, 'utf-8'));
}

export function normalizeAction(task) {
  return safeText(task?.action || task?.action_id || task?.task_intent || task?.kind);
}

export function workspaceRootFromTask(task) {
  return requireField(
    'workspace_root',
    task?.workspace_root
      || task?.workspaceRoot
      || task?.workspace_locator?.workspace_root
      || task?.workspaceLocator?.workspaceRoot,
  );
}

export function slugId(value, fallback) {
  return safeText(value, fallback).replace(/[^A-Za-z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

export function noRegressionEvidenceId(task) {
  const provided = task.evidence_id || task.evidenceId || task.no_regression_evidence_id || task.noRegressionEvidenceId;
  if (safeText(provided)) {
    return slugId(provided, 'evidence');
  }
  const seed = [
    task.task_id || task.id || '',
    task.entry_session_id || task.entrySessionId || '',
    task.topic_id || task.topicId || '',
    task.deliverable_id || task.deliverableId || '',
  ].join(':');
  const digest = createHash('sha256').update(seed || new Date(0).toISOString()).digest('hex').slice(0, 12);
  return `evidence-${digest}`;
}

export function receiptId(task, fieldName, fallbackPrefix) {
  const provided = task[fieldName]
    || task[`${fieldName}_id`]
    || task.receipt_id
    || task.receiptId
    || task.id;
  if (safeText(provided)) {
    return slugId(provided, fallbackPrefix);
  }
  const seed = [
    task.task_id || task.taskId || '',
    task.entry_session_id || task.entrySessionId || '',
    task.topic_id || task.topicId || '',
    task.deliverable_id || task.deliverableId || '',
    task.run_id || task.runId || '',
    fallbackPrefix,
  ].join(':');
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return `${fallbackPrefix}-${digest}`;
}

export function taskValue(task, snake, camel = null) {
  return task?.[snake] ?? (camel ? task?.[camel] : undefined);
}

export function optionalArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function missingFields(task, fields) {
  return fields.filter((field) => !safeText(taskValue(task, field, field.replace(/_([a-z])/g, (_, char) => char.toUpperCase()))));
}

export function findForbiddenPayloadFieldPaths(value, path = '', found = new Set()) {
  if (!value || typeof value !== 'object') {
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findForbiddenPayloadFieldPaths(item, `${path}[${index}]`, found);
    });
    return found;
  }
  for (const [key, nested] of Object.entries(value)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_RECEIPT_PAYLOAD_FIELDS.includes(key)) {
      found.add(currentPath);
    }
    findForbiddenPayloadFieldPaths(nested, currentPath, found);
  }
  return found;
}
