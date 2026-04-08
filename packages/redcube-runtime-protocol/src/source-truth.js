import path from 'node:path';

import { getTopicPaths } from './workspace.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function getSourceArtifactPaths(workspaceRoot, topicId) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    topicPaths,
    sourceIndexFile: path.join(topicPaths.canonicalDir, 'source-index.json'),
    extractedMaterialsFile: path.join(topicPaths.canonicalDir, 'extracted-materials.json'),
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceBriefFile: path.join(topicPaths.canonicalDir, 'source-brief.json'),
  };
}

export function buildSourceTruthConsumptionSummary(sharedSourceTruth, options = {}) {
  const truth = sharedSourceTruth || null;
  const materials = safeArray(truth?.extracted_materials?.materials);
  const materialIds = materials
    .map((material) => safeText(material?.material_id))
    .filter(Boolean);
  const sourceLabels = safeArray(truth?.source_index?.sources)
    .filter((source) => source?.status === 'ready')
    .map((source) => safeText(source?.relative_path || source?.kind))
    .filter(Boolean);
  const auditBlockingReasons = safeArray(truth?.source_audit?.blocking_reasons)
    .map((reason) => safeText(reason))
    .filter(Boolean);

  return {
    authoritative_source_kind: 'shared_source_truth',
    consumption_role: safeText(options.consumptionRole),
    input_mode: safeText(truth?.source_brief?.input_mode, safeText(options.defaultInputMode, 'seed_only')),
    confidence: safeText(truth?.source_brief?.confidence, safeText(options.defaultConfidence, 'low')),
    material_count: materials.length,
    material_ids: materialIds,
    source_labels: sourceLabels.length > 0 ? sourceLabels : safeArray(options.defaultSourceLabels),
    source_audit_status: safeText(truth?.source_audit?.status, safeText(options.defaultAuditStatus, 'missing')),
    source_audit_blocking_reasons: auditBlockingReasons.length > 0
      ? auditBlockingReasons
      : safeArray(options.defaultBlockingReasons),
  };
}
