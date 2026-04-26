type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

const OPERATOR_ONLY_SOURCE_KINDS = new Set(['brief', 'keywords']);

function isAudienceFacingItem(item: unknown): boolean {
  const record = asRecord(item);
  const kind = safeText(record.kind);
  return safeText(record.source_role) !== 'operator_context'
    && !OPERATOR_ONLY_SOURCE_KINDS.has(kind);
}

function audienceFacingTextLines(value: unknown): string[] {
  return String(value || '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`+/g, ' ')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractAudienceFacingSnippet(value: unknown, maxLength = 240): string {
  const lines = audienceFacingTextLines(value);
  const informative = lines.find((line) => line.length >= 20) || lines[0] || '';
  return informative.slice(0, maxLength);
}

function audienceFacingMaterials(extractedMaterials: unknown): JsonRecord[] {
  return safeArray(asRecord(extractedMaterials).materials)
    .filter((material) => isAudienceFacingItem(material))
    .map((material) => asRecord(material));
}

function buildAudienceFacingTopicSummary({
  title,
  extractedMaterials,
}: {
  title: string;
  extractedMaterials: unknown;
}): string {
  const summary = audienceFacingMaterials(extractedMaterials)
    .map((material) => extractAudienceFacingSnippet(material.content_text || material.excerpt))
    .find(Boolean);
  return summary || title;
}

export function buildSourceReadinessPack({
  topicId,
  title,
  sourceIndex,
  extractedMaterials,
  sourceBrief,
  sourceAudit,
}: {
  topicId: string;
  title: string;
  sourceIndex: unknown;
  extractedMaterials: unknown;
  sourceBrief: unknown;
  sourceAudit: unknown;
}): JsonRecord {
  const sourceIndexRecord = asRecord(sourceIndex);
  const sourceBriefRecord = asRecord(sourceBrief);
  const sourceAuditRecord = asRecord(sourceAudit);
  const inputMode = safeText(sourceBriefRecord.input_mode, 'empty');
  const confidence = safeText(sourceBriefRecord.confidence, 'low');
  const materialIds = safeArray(
    Array.isArray(sourceBriefRecord.consumable_material_ids)
      ? sourceBriefRecord.consumable_material_ids
      : sourceBriefRecord.material_ids,
  );
  const readySources = safeArray(sourceIndexRecord.sources)
    .filter((source) => asRecord(source).status === 'ready' && isAudienceFacingItem(source))
    .map((source) => asRecord(source));
  const publicMaterials = audienceFacingMaterials(extractedMaterials);
  const blockedReasons = safeArray(sourceAuditRecord.blocking_reasons).map((reason) => safeText(reason)).filter(Boolean);
  const blockingEvidenceGaps = [];
  const residualEvidenceGaps: string[] = [];

  if (inputMode === 'brief_keywords') {
    blockingEvidenceGaps.push('public_evidence_missing');
    blockingEvidenceGaps.push('consumable_material_missing');
  }
  if (materialIds.length === 0) blockingEvidenceGaps.push('consumable_material_missing');
  if (safeText(sourceAuditRecord.status) !== 'pass') blockingEvidenceGaps.push('source_audit_not_passed');

  const uniqueBlockingEvidenceGaps = [...new Set(blockingEvidenceGaps)];
  const uniqueResidualEvidenceGaps = [...new Set(residualEvidenceGaps)];
  const allEvidenceGaps = [
    ...uniqueBlockingEvidenceGaps,
    ...uniqueResidualEvidenceGaps,
  ];
  const planningReady = uniqueBlockingEvidenceGaps.length === 0 && safeText(sourceAuditRecord.status) === 'pass';
  const readinessStatus = planningReady ? 'planning_ready' : 'augmentation_required';
  const deepResearchState = inputMode === 'brief_keywords'
    ? 'required'
    : (planningReady
      ? (uniqueResidualEvidenceGaps.length > 0 ? 'recommended' : 'not_required')
      : 'recommended');

  return {
    schema_version: 1,
    topic_id: topicId,
    title,
    readiness: {
      target: 'planning_ready',
      input_mode: inputMode,
      confidence,
      sufficiency_status: readinessStatus,
      planning_ready: planningReady,
      release_blocked: !planningReady,
      deep_research_state: deepResearchState,
      material_count: materialIds.length,
      material_ids: materialIds,
      audit_status: safeText(sourceAuditRecord.status, 'missing'),
      audit_blocking_reasons: blockedReasons,
    },
    fact_library: {
      topic_summary: buildAudienceFacingTopicSummary({
        title,
        extractedMaterials,
      }),
      reference_source_list: readySources
        .map((source) => safeText(source.relative_path || source.kind))
        .filter(Boolean),
      key_fact_groups: publicMaterials
        .slice(0, 8)
        .map((material) => ({
          fact_id: material.material_id,
          label: extractAudienceFacingSnippet(material.content_text || material.excerpt, 80),
          source_id: material.source_id,
        }))
        .filter((material) => material.label),
      evidence_gaps: allEvidenceGaps,
      blocking_evidence_gaps: uniqueBlockingEvidenceGaps,
      residual_evidence_gaps: uniqueResidualEvidenceGaps,
    },
    release_gate: {
      target: 'planning_ready',
      status: planningReady ? 'pass' : 'block',
      pass: planningReady,
      blocking_evidence_gaps: uniqueBlockingEvidenceGaps,
      residual_evidence_gaps: uniqueResidualEvidenceGaps,
      blocked_reasons: [...new Set([...blockedReasons, ...uniqueBlockingEvidenceGaps])],
      next_required_surface: planningReady ? null : 'source_research',
    },
  };
}
