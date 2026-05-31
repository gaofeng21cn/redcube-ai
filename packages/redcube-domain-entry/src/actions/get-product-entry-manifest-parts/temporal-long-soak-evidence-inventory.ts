// @ts-nocheck
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DOMAIN_ID = 'redcube_ai';
const EVIDENCE_ROOT_MODEL =
  '<workspace-root>/.redcube/runtime/evidence/temporal-controlled-visual-stage-long-soak/';
const MAX_EXPORTED_EVIDENCE = 25;
const FORBIDDEN_PAYLOAD_FIELDS = Object.freeze([
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
]);

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function listJsonFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(root, entry.name))
    .sort();
}

function findForbiddenPayloadFields(value, found = new Set()) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const item of value) findForbiddenPayloadFields(item, found);
    return found;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_PAYLOAD_FIELDS.includes(key)) found.add(key);
    findForbiddenPayloadFields(nested, found);
  }
  return found;
}

function exportedEvidenceRef({ file, root, payload }) {
  const relativePath = path.relative(root, file).split(path.sep).join('/');
  const stat = statSync(file);
  return {
    evidence_id: safeText(payload.evidence_id || payload.id),
    evidence_ref: safeText(payload.evidence_ref),
    runtime_locator_ref: safeText(payload.runtime_locator_ref),
    generated_by_action: safeText(payload.generated_by_action),
    return_shape: safeText(payload.return_shape),
    relative_path: relativePath,
    evidence_file_ref: `${EVIDENCE_ROOT_MODEL}${relativePath}`,
    sha256: safeText(payload.sha256),
    mtime_ms: stat.mtimeMs,
  };
}

export function buildTemporalLongSoakEvidenceInventory({ workspaceRoot }) {
  const evidenceRoot = path.join(
    workspaceRoot,
    '.redcube',
    'runtime',
    'evidence',
    'temporal-controlled-visual-stage-long-soak',
  );
  const evidenceRefs = [];
  const invalidEvidenceRefs = [];
  const forbiddenPayloadFields = new Set();

  for (const file of listJsonFiles(evidenceRoot)) {
    const relativePath = path.relative(evidenceRoot, file).split(path.sep).join('/');
    let payload;
    try {
      payload = JSON.parse(readFileSync(file, 'utf-8'));
    } catch {
      invalidEvidenceRefs.push({
        relative_path: relativePath,
        evidence_file_ref: `${EVIDENCE_ROOT_MODEL}${relativePath}`,
        error_kind: 'invalid_json',
      });
      continue;
    }
    for (const field of findForbiddenPayloadFields(payload)) {
      forbiddenPayloadFields.add(field);
    }
    if (payload?.surface_kind === 'temporal_controlled_visual_stage_long_soak_evidence') {
      evidenceRefs.push(exportedEvidenceRef({ file, root: evidenceRoot, payload }));
    }
  }

  evidenceRefs.sort((left, right) => (
    right.mtime_ms - left.mtime_ms || left.relative_path.localeCompare(right.relative_path)
  ));
  const exportedEvidenceRefs = evidenceRefs.slice(0, MAX_EXPORTED_EVIDENCE)
    .map(({ mtime_ms, ...item }) => item);
  const forbiddenPayloadFieldList = [...forbiddenPayloadFields].sort();
  const hasInvalidEvidence = invalidEvidenceRefs.length > 0;
  const hasForbiddenPayloadFields = forbiddenPayloadFieldList.length > 0;
  const validEvidenceCount = evidenceRefs.length;
  const status = hasForbiddenPayloadFields
    ? 'blocked_forbidden_long_soak_evidence_payload_fields'
    : hasInvalidEvidence
      ? 'blocked_invalid_long_soak_evidence_payloads'
      : validEvidenceCount > 0
        ? 'runtime_long_soak_evidence_refs_visible_not_production_soak'
        : 'awaiting_runtime_long_soak_evidence_refs';

  return {
    surface_kind: 'temporal_controlled_visual_stage_long_soak_evidence_inventory',
    projection_id: 'rca.temporal_controlled_visual_stage_long_soak_evidence_inventory.v1',
    owner: DOMAIN_ID,
    consumer: 'opl_app_operator',
    status,
    projection_model: 'workspace_runtime_long_soak_evidence_refs_only_read_model',
    workspace_locator: { workspace_root: workspaceRoot },
    evidence_root_model: EVIDENCE_ROOT_MODEL,
    evidence_root_exists: existsSync(evidenceRoot),
    read_only: true,
    refs_only: true,
    writes_visual_truth: false,
    writes_artifact_blob: false,
    writes_memory_body: false,
    writes_review_export_verdict: false,
    declares_visual_ready: false,
    declares_exportable: false,
    declares_handoffable: false,
    declares_domain_ready: false,
    declares_production_soak_complete: false,
    source_action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
    evidence_count: validEvidenceCount,
    invalid_evidence_count: invalidEvidenceRefs.length,
    evidence_refs: exportedEvidenceRefs,
    evidence_refs_truncated: evidenceRefs.length > exportedEvidenceRefs.length,
    latest_evidence_ref: safeText(exportedEvidenceRefs[0]?.evidence_ref),
    latest_runtime_locator_ref: safeText(exportedEvidenceRefs[0]?.runtime_locator_ref),
    invalid_evidence_refs: invalidEvidenceRefs,
    coverage: {
      long_soak_evidence_refs_visible: validEvidenceCount > 0,
      invalid_evidence_payloads_detected: hasInvalidEvidence,
      forbidden_payload_fields_detected: forbiddenPayloadFieldList,
      no_forbidden_payload_fields_detected: !hasForbiddenPayloadFields,
      production_soak_claimed: false,
      visual_artifact_blob_projected: false,
      review_export_verdict_projected: false,
      memory_content_body_projected: false,
    },
    authority_boundary: {
      rca_owns_long_soak_evidence: true,
      opl_app_can_index_evidence_refs: true,
      opl_app_can_read_visual_truth: false,
      opl_app_can_write_evidence_instance: false,
      opl_app_can_write_rca_visual_truth: false,
      opl_app_can_store_artifact_blob: false,
      opl_app_can_authorize_review_export_verdict: false,
      opl_app_can_claim_production_soak_complete: false,
    },
    repository_boundary: {
      repo_tracks_read_model_builder: true,
      repo_tracks_live_evidence_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_review_export_verdict: false,
      repo_tracks_canonical_artifact_blob: false,
      evidence_instance_path_model: EVIDENCE_ROOT_MODEL,
    },
  };
}
