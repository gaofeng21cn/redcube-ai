import path from 'node:path';

import { getTopicPaths } from './workspace.js';
import type {
  BuildSourceTruthConsumptionSummaryOptions,
  SourceArtifactPaths,
  SourceTruthConsumptionSummary,
  TopicPaths,
} from './types.js';
import { safeText } from './protocol-utils.js';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isAudienceFacingItem(item: unknown): boolean {
  const record = asRecord(item);
  const kind = safeText(record.kind);
  return safeText(record.source_role) !== 'operator_context'
    && kind !== 'brief'
    && kind !== 'keywords';
}

export function getSourceArtifactPaths(workspaceRoot: string, topicId: string): SourceArtifactPaths {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    topicPaths,
    sourceIndexFile: path.join(topicPaths.canonicalDir, 'source-index.json'),
    extractedMaterialsFile: path.join(topicPaths.canonicalDir, 'extracted-materials.json'),
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceBriefFile: path.join(topicPaths.canonicalDir, 'source-brief.json'),
    sourceReadinessPackFile: path.join(topicPaths.canonicalDir, 'source-readiness-pack.json'),
    sourcePackManifestFile: path.join(topicPaths.canonicalDir, 'source-pack-manifest.json'),
    sourcePackFanoutFile: path.join(topicPaths.canonicalDir, 'source-pack-fanout.json'),
    sourceAugmentationRequestFile: path.join(topicPaths.canonicalDir, 'source-augmentation-request.json'),
    sourceAugmentationResultFile: path.join(topicPaths.canonicalDir, 'source-augmentation-result.json'),
    sourceResearchReportFile: path.join(topicPaths.canonicalDir, 'source-research-report.json'),
    sourceAugmentationReportFile: path.join(topicPaths.canonicalDir, 'source-augmentation-report.json'),
  };
}

function relativeTopicPath(topicPaths: TopicPaths, file: string): string {
  return path.relative(topicPaths.topicDir, file).split(path.sep).join('/');
}

function normalizeConsumerFamilyEntry(entry: unknown): {
  family_id: string;
  deliverables: Array<{
    deliverable_id: string;
    profile_id: string;
    title: string;
    goal: string;
  }>;
} {
  const record = asRecord(entry);
  const familyId = safeText(record.family_id || record.overlay);
  const deliverables = safeArray(record.deliverables)
    .map((deliverable) => {
      const deliverableRecord = asRecord(deliverable);
      return {
        deliverable_id: safeText(deliverableRecord.deliverable_id),
        profile_id: safeText(deliverableRecord.profile_id),
        title: safeText(deliverableRecord.title),
        goal: safeText(deliverableRecord.goal),
      };
    })
    .filter((deliverable) => deliverable.deliverable_id);

  return {
    family_id: familyId,
    deliverables,
  };
}

export function buildSourcePackFanoutArtifact({
  workspaceRoot,
  topicId,
  sourceIndex,
  extractedMaterials,
  sourceAudit,
  sourceBrief,
  sourceReadinessPack,
  consumerFamilies = [],
}: {
  workspaceRoot: string;
  topicId: string;
  sourceIndex?: unknown;
  extractedMaterials?: unknown;
  sourceAudit?: unknown;
  sourceBrief?: unknown;
  sourceReadinessPack?: unknown;
  consumerFamilies?: unknown[];
}): Record<string, unknown> {
  const paths = getSourceArtifactPaths(workspaceRoot, topicId);
  const topicPaths = paths.topicPaths;
  const sourceAuditRecord = asRecord(sourceAudit);
  const sourceReadinessPackRecord = asRecord(sourceReadinessPack);
  const readinessRecord = asRecord(sourceReadinessPackRecord.readiness);
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
    artifact_kind: 'cross_family_source_pack_fanout',
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
        target: safeText(readinessRecord.target, 'planning_ready'),
        planning_ready: readinessRecord.planning_ready === true,
        sufficiency_status: safeText(readinessRecord.sufficiency_status, 'augmentation_required'),
        release_blocked: readinessRecord.release_blocked !== false,
        deep_research_state: safeText(readinessRecord.deep_research_state, 'not_required'),
        audit_status: safeText(sourceAuditRecord.status, 'missing'),
      },
      summary,
    },
    consumer_families: normalizedConsumers,
    parallel_family_ready: normalizedConsumers.length >= 2,
  };
}

export function buildSourceTruthConsumptionSummary(
  sharedSourceTruth: unknown,
  options: BuildSourceTruthConsumptionSummaryOptions = { consumptionRole: '' },
): SourceTruthConsumptionSummary {
  const truth = asRecord(sharedSourceTruth);
  const extractedMaterials = asRecord(truth.extracted_materials);
  const sourceIndex = asRecord(truth.source_index);
  const sourceAudit = asRecord(truth.source_audit);
  const sourceBrief = asRecord(truth.source_brief);
  const sourceReadinessPack = asRecord(truth.source_readiness_pack);
  const readiness = asRecord(sourceReadinessPack.readiness);
  const factLibrary = asRecord(sourceReadinessPack.fact_library);
  const materials = safeArray(extractedMaterials.materials)
    .filter((material) => isAudienceFacingItem(material));
  const materialIds = materials
    .map((material) => safeText(asRecord(material).material_id))
    .filter(Boolean);
  const sourceLabels = safeArray(sourceIndex.sources)
    .filter((source) => asRecord(source).status === 'ready' && isAudienceFacingItem(source))
    .map((source) => {
      const sourceRecord = asRecord(source);
      return safeText(sourceRecord.relative_path || sourceRecord.kind);
    })
    .filter(Boolean);
  const auditBlockingReasons = safeArray(sourceAudit.blocking_reasons)
    .map((reason) => safeText(reason))
    .filter(Boolean);
  const sufficiencyStatus = safeText(readiness.sufficiency_status, 'augmentation_required');
  const planningReady = readiness.planning_ready === true
    || sufficiencyStatus === 'planning_ready';

  return {
    authoritative_source_kind: 'shared_source_truth',
    consumption_role: safeText(options.consumptionRole),
    input_mode: safeText(sourceBrief.input_mode, safeText(options.defaultInputMode, 'seed_only')),
    confidence: safeText(sourceBrief.confidence, safeText(options.defaultConfidence, 'low')),
    material_count: materials.length,
    material_ids: materialIds,
    source_labels: sourceLabels.length > 0
      ? sourceLabels
      : safeArray(options.defaultSourceLabels).map((item) => safeText(item)).filter(Boolean),
    source_audit_status: safeText(sourceAudit.status, safeText(options.defaultAuditStatus, 'missing')),
    source_audit_blocking_reasons: auditBlockingReasons.length > 0
      ? auditBlockingReasons
      : safeArray(options.defaultBlockingReasons).map((item) => safeText(item)).filter(Boolean),
    planning_ready: planningReady,
    sufficiency_status: sufficiencyStatus,
    deep_research_state: safeText(readiness.deep_research_state, 'not_required'),
    blocking_evidence_gaps: safeArray(factLibrary.blocking_evidence_gaps).map((item) => safeText(item)).filter(Boolean),
    residual_evidence_gaps: safeArray(factLibrary.residual_evidence_gaps).map((item) => safeText(item)).filter(Boolean),
  };
}
