// @ts-nocheck
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function timestampId() {
  return new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function nativeAttemptIndex(fileName) {
  const match = fileName.match(/-attempt-(\d+)(?:-|\.json$)/);
  return match ? Number(match[1]) : 0;
}

function summarizeNativeAttemptValidation(validation, attemptIndex, validationFile) {
  if (!validation || typeof validation !== 'object') return null;
  const slideFailures = safeArray(validation.failures);
  const nestedFailures = slideFailures.flatMap((slide) => safeArray(slide?.failures));
  const failureItems = nestedFailures.length > 0 ? nestedFailures : slideFailures;
  return {
    attempt_index: attemptIndex,
    validation_file: validationFile,
    ok: validation.ok === true,
    stage: safeText(validation.stage) || null,
    slide_count: Number(validation.slide_count || 0) || null,
    failure_count: Number(validation.failure_count || 0) || failureItems.length,
    failure_reasons: Array.from(new Set(failureItems.map((failure) => safeText(failure?.reason)).filter(Boolean))),
    failed_shape_ids: Array.from(new Set(failureItems.map((failure) => safeText(failure?.shape_id)).filter(Boolean))),
    selected_archetypes: Array.from(new Set(failureItems
      .map((failure) => safeText(failure?.selected_archetype || failure?.archetype_id))
      .filter(Boolean))),
    refs_only: true,
    can_claim_visual_ready: false,
  };
}

export function collectNativeRouteAttemptEvidence({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
}) {
  if (!workspaceRoot || !topicId || !deliverableId || !route) {
    return {
      artifact_refs: [],
      latest_attempt_summary: null,
    };
  }
  const nativeDir = path.join(
    workspaceRoot,
    'topics',
    topicId,
    'deliverables',
    deliverableId,
    'artifacts',
    'native_ppt',
  );
  if (!existsSync(nativeDir)) {
    return {
      artifact_refs: [],
      latest_attempt_summary: null,
    };
  }
  const prefix = `${deliverableId}-${route}-plan-validation-input-attempt-`;
  const attemptFiles = readdirSync(nativeDir)
    .filter((fileName) => fileName.startsWith(prefix) && fileName.endsWith('.json'))
    .map((fileName) => ({
      file: path.join(nativeDir, fileName),
      fileName,
      attemptIndex: nativeAttemptIndex(fileName),
    }))
    .filter((item) => item.attemptIndex > 0)
    .sort((left, right) => left.attemptIndex - right.attemptIndex || left.fileName.localeCompare(right.fileName));
  if (attemptFiles.length === 0) {
    return {
      artifact_refs: [],
      latest_attempt_summary: null,
    };
  }
  const latestAttemptIndex = Math.max(...attemptFiles.map((item) => item.attemptIndex));
  const latestAttemptFiles = attemptFiles.filter((item) => item.attemptIndex === latestAttemptIndex);
  const latestValidation = latestAttemptFiles.find((item) => item.fileName.endsWith('-validation.json'))
    || latestAttemptFiles.find((item) => item.fileName.endsWith('-structural-validation.json'));
  return {
    artifact_refs: attemptFiles.map((item) => item.file),
    latest_attempt_summary: latestValidation
      ? summarizeNativeAttemptValidation(readJson(latestValidation.file), latestAttemptIndex, latestValidation.file)
      : {
          attempt_index: latestAttemptIndex,
          validation_file: null,
          ok: null,
          stage: null,
          failure_count: null,
          failure_reasons: [],
          failed_shape_ids: [],
          selected_archetypes: [],
          refs_only: true,
          can_claim_visual_ready: false,
        },
  };
}

export function materializeRouteTimeoutBlockerArtifact({
  outputDir,
  lane,
  route,
  iteration,
  deliverableId,
  error,
  routeTimeoutMs,
  routeRuns,
  workspaceRoot,
  topicId,
}) {
  const blockerId = `${lane}-${String(iteration).padStart(2, '0')}-${route}-route-timeout-${timestampId()}`;
  const artifactFile = path.join(outputDir, 'typed-blockers', `${blockerId}.json`);
  const nativeAttemptEvidence = collectNativeRouteAttemptEvidence({
    workspaceRoot,
    topicId,
    deliverableId,
    route,
  });
  const artifact = {
    schema_version: 1,
    surface_kind: 'redcube_real_route_probe_route_timeout_blocker',
    blocker_kind: 'route_execution_timeout',
    lane,
    route,
    iteration,
    deliverable_id: deliverableId,
    route_timeout_ms: routeTimeoutMs,
    message: safeText(error?.message, 'route execution timeout'),
    error_code: safeText(error?.code) || null,
    failure_kind: safeText(error?.failure_kind, 'route_timeout'),
    completed_route_count_before_blocker: routeRuns.length,
    completed_route_run_ids: routeRuns.map((run) => run.run_id).filter(Boolean),
    completed_route_artifact_refs: routeRuns.flatMap((run) => safeArray(run.artifact_refs)),
    native_attempt_artifact_refs: nativeAttemptEvidence.artifact_refs,
    latest_native_attempt_summary: nativeAttemptEvidence.latest_attempt_summary,
    recommended_action: nativeAttemptEvidence.artifact_refs.length > 0
      ? 'inspect_latest_native_ppt_attempt_validation_refs_and_retry_shape_plan'
      : 'inspect_route_failure',
    authority_boundary: {
      refs_only: true,
      can_write_visual_truth: false,
      can_authorize_quality_or_export: false,
      can_claim_visual_ready: false,
      can_claim_production_ready: false,
    },
  };
  writeJson(artifactFile, artifact);
  return artifactFile;
}
