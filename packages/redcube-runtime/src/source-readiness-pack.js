function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
  const materialIds = safeArray(sourceBrief?.material_ids);
  const readySources = safeArray(sourceIndex?.sources).filter((source) => source?.status === 'ready');
  const blockedReasons = safeArray(sourceAudit?.blocking_reasons).map((reason) => safeText(reason)).filter(Boolean);
  const evidenceGaps = [];

  if (inputMode === 'brief_keywords') evidenceGaps.push('public_evidence_missing');
  if (materialIds.length === 0) evidenceGaps.push('consumable_material_missing');
  if (safeText(sourceAudit?.status) !== 'pass') evidenceGaps.push('source_audit_not_passed');

  const uniqueEvidenceGaps = [...new Set(evidenceGaps)];
  const readinessStatus = uniqueEvidenceGaps.length === 0 ? 'planning_ready' : 'augmentation_required';
  const deepResearchState = inputMode === 'brief_keywords'
    ? 'required'
    : (uniqueEvidenceGaps.length > 0 ? 'recommended' : 'not_required');

  return {
    schema_version: 1,
    topic_id: topicId,
    title,
    readiness: {
      input_mode: inputMode,
      confidence,
      sufficiency_status: readinessStatus,
      deep_research_state: deepResearchState,
      material_count: materialIds.length,
      material_ids: materialIds,
      audit_status: safeText(sourceAudit?.status, 'missing'),
      audit_blocking_reasons: blockedReasons,
    },
    fact_library: {
      topic_summary: safeText(sourceBrief?.brief_text, title),
      reference_source_list: readySources
        .map((source) => safeText(source.relative_path || source.kind))
        .filter(Boolean),
      key_fact_groups: safeArray(extractedMaterials?.materials).slice(0, 8).map((material) => ({
        fact_id: material.material_id,
        label: safeText(material.excerpt).slice(0, 80),
        source_id: material.source_id,
      })),
      evidence_gaps: uniqueEvidenceGaps,
    },
  };
}
