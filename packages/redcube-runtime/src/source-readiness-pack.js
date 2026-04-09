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
      topic_summary: safeText(sourceBrief?.brief_text, title),
      reference_source_list: readySources
        .map((source) => safeText(source.relative_path || source.kind))
        .filter(Boolean),
      key_fact_groups: safeArray(extractedMaterials?.materials).slice(0, 8).map((material) => ({
        fact_id: material.material_id,
        label: safeText(material.excerpt).slice(0, 80),
        source_id: material.source_id,
      })),
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
