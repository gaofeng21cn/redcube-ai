import path from 'node:path';

import { getTopicPaths } from './workspace.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function isAudienceFacingItem(item) {
  const kind = safeText(item?.kind);
  return safeText(item?.source_role) !== 'operator_context'
    && kind !== 'brief'
    && kind !== 'keywords';
}

export function getSourceArtifactPaths(workspaceRoot, topicId) {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    topicPaths,
    sourceIndexFile: path.join(topicPaths.canonicalDir, 'source-index.json'),
    extractedMaterialsFile: path.join(topicPaths.canonicalDir, 'extracted-materials.json'),
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceBriefFile: path.join(topicPaths.canonicalDir, 'source-brief.json'),
    sourceReadinessPackFile: path.join(topicPaths.canonicalDir, 'source-readiness-pack.json'),
    sourcePackManifestFile: path.join(topicPaths.canonicalDir, 'source-pack-manifest.json'),
    sourcePackFederationFile: path.join(topicPaths.canonicalDir, 'source-pack-federation.json'),
    sourceAugmentationRequestFile: path.join(topicPaths.canonicalDir, 'source-augmentation-request.json'),
    sourceAugmentationResultFile: path.join(topicPaths.canonicalDir, 'source-augmentation-result.json'),
    sourceResearchReportFile: path.join(topicPaths.canonicalDir, 'source-research-report.json'),
    sourceAugmentationReportFile: path.join(topicPaths.canonicalDir, 'source-augmentation-report.json'),
  };
}

function relativeTopicPath(topicPaths, file) {
  return path.relative(topicPaths.topicDir, file).split(path.sep).join('/');
}

function normalizeConsumerFamilyEntry(entry) {
  const familyId = safeText(entry?.family_id || entry?.overlay);
  const deliverables = safeArray(entry?.deliverables)
    .map((deliverable) => ({
      deliverable_id: safeText(deliverable?.deliverable_id),
      profile_id: safeText(deliverable?.profile_id),
      title: safeText(deliverable?.title),
      goal: safeText(deliverable?.goal),
    }))
    .filter((deliverable) => deliverable.deliverable_id);

  return {
    family_id: familyId,
    deliverables,
  };
}

export function buildSourcePackFederationArtifact({
  workspaceRoot,
  topicId,
  sourceIndex,
  extractedMaterials,
  sourceAudit,
  sourceBrief,
  sourceReadinessPack,
  consumerFamilies = [],
}) {
  const paths = getSourceArtifactPaths(workspaceRoot, topicId);
  const topicPaths = paths.topicPaths;
  const normalizedConsumers = safeArray(consumerFamilies)
    .map((consumer) => normalizeConsumerFamilyEntry(consumer))
    .filter((consumer) => consumer.family_id && consumer.deliverables.length > 0);
  const summary = buildSourceTruthConsumptionSummary({
    source_index: sourceIndex,
    extracted_materials: extractedMaterials,
    source_audit: sourceAudit,
    source_brief: sourceBrief,
    source_readiness_pack: sourceReadinessPack,
  }, {
    consumptionRole: 'cross_family_source_pack',
  });

  return {
    schema_version: 1,
    artifact_kind: 'cross_family_source_pack_federation',
    topic_id: topicPaths.topicId,
    authoritative_surface: 'shared_source_truth',
    source_pack: {
      authoritative_source_kind: summary.authoritative_source_kind,
      artifact_files: {
        source_index: relativeTopicPath(topicPaths, paths.sourceIndexFile),
        extracted_materials: relativeTopicPath(topicPaths, paths.extractedMaterialsFile),
        source_audit: relativeTopicPath(topicPaths, paths.sourceAuditFile),
        source_brief: relativeTopicPath(topicPaths, paths.sourceBriefFile),
        source_readiness_pack: relativeTopicPath(topicPaths, paths.sourceReadinessPackFile),
        source_pack_manifest: relativeTopicPath(topicPaths, paths.sourcePackManifestFile),
      },
      readiness: {
        target: safeText(sourceReadinessPack?.readiness?.target, 'planning_ready'),
        planning_ready: sourceReadinessPack?.readiness?.planning_ready === true,
        sufficiency_status: safeText(sourceReadinessPack?.readiness?.sufficiency_status, 'augmentation_required'),
        release_blocked: sourceReadinessPack?.readiness?.release_blocked !== false,
        deep_research_state: safeText(sourceReadinessPack?.readiness?.deep_research_state, 'not_required'),
        audit_status: safeText(sourceAudit?.status, 'missing'),
      },
      summary,
    },
    consumer_families: normalizedConsumers,
    parallel_family_ready: normalizedConsumers.length >= 2,
  };
}

export function buildSourceTruthConsumptionSummary(sharedSourceTruth, options = {}) {
  const truth = sharedSourceTruth || null;
  const materials = safeArray(truth?.extracted_materials?.materials)
    .filter((material) => isAudienceFacingItem(material));
  const materialIds = materials
    .map((material) => safeText(material?.material_id))
    .filter(Boolean);
  const sourceLabels = safeArray(truth?.source_index?.sources)
    .filter((source) => source?.status === 'ready' && isAudienceFacingItem(source))
    .map((source) => safeText(source?.relative_path || source?.kind))
    .filter(Boolean);
  const auditBlockingReasons = safeArray(truth?.source_audit?.blocking_reasons)
    .map((reason) => safeText(reason))
    .filter(Boolean);
  const sufficiencyStatus = safeText(truth?.source_readiness_pack?.readiness?.sufficiency_status, 'augmentation_required');
  const planningReady = truth?.source_readiness_pack?.readiness?.planning_ready === true
    || sufficiencyStatus === 'planning_ready';

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
    planning_ready: planningReady,
    sufficiency_status: sufficiencyStatus,
    deep_research_state: safeText(truth?.source_readiness_pack?.readiness?.deep_research_state, 'not_required'),
    blocking_evidence_gaps: safeArray(truth?.source_readiness_pack?.fact_library?.blocking_evidence_gaps),
    residual_evidence_gaps: safeArray(truth?.source_readiness_pack?.fact_library?.residual_evidence_gaps),
  };
}
