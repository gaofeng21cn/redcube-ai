function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

const OPERATOR_ONLY_SOURCE_KINDS = new Set(['brief', 'keywords']);

function isAudienceFacingItem(item) {
  const kind = safeText(item?.kind);
  return safeText(item?.source_role) !== 'operator_context'
    && !OPERATOR_ONLY_SOURCE_KINDS.has(kind);
}

function audienceFacingTextLines(value) {
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

function extractAudienceFacingSnippet(value, maxLength = 240) {
  const lines = audienceFacingTextLines(value);
  const informative = lines.find((line) => line.length >= 20) || lines[0] || '';
  return informative.slice(0, maxLength);
}

function audienceFacingMaterials(extractedMaterials) {
  return safeArray(extractedMaterials?.materials)
    .filter((material) => isAudienceFacingItem(material));
}

function buildAudienceFacingTopicSummary({ title, extractedMaterials }) {
  const summary = audienceFacingMaterials(extractedMaterials)
    .map((material) => extractAudienceFacingSnippet(material?.content_text || material?.excerpt))
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
}) {
  const inputMode = safeText(sourceBrief?.input_mode, 'empty');
  const confidence = safeText(sourceBrief?.confidence, 'low');
  const materialIds = safeArray(
    Array.isArray(sourceBrief?.consumable_material_ids)
      ? sourceBrief?.consumable_material_ids
      : sourceBrief?.material_ids,
  );
  const readySources = safeArray(sourceIndex?.sources)
    .filter((source) => source?.status === 'ready' && isAudienceFacingItem(source));
  const publicMaterials = audienceFacingMaterials(extractedMaterials);
  const blockedReasons = safeArray(sourceAudit?.blocking_reasons).map((reason) => safeText(reason)).filter(Boolean);
  const blockingEvidenceGaps = [];
  const residualEvidenceGaps = [];

  if (inputMode === 'brief_keywords') {
    blockingEvidenceGaps.push('public_evidence_missing');
    blockingEvidenceGaps.push('consumable_material_missing');
  }
  if (materialIds.length === 0) blockingEvidenceGaps.push('consumable_material_missing');
  if (safeText(sourceAudit?.status) !== 'pass') blockingEvidenceGaps.push('source_audit_not_passed');

  const uniqueBlockingEvidenceGaps = [...new Set(blockingEvidenceGaps)];
  const uniqueResidualEvidenceGaps = [...new Set(residualEvidenceGaps)];
  const allEvidenceGaps = [
    ...uniqueBlockingEvidenceGaps,
    ...uniqueResidualEvidenceGaps,
  ];
  const planningReady = uniqueBlockingEvidenceGaps.length === 0 && safeText(sourceAudit?.status) === 'pass';
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
      audit_status: safeText(sourceAudit?.status, 'missing'),
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
