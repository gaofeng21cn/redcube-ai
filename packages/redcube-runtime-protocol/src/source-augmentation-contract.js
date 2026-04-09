function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values) {
  return [...new Set(safeArray(values).map((item) => String(item || '').trim()).filter(Boolean))];
}

function pushArrayStringErrors(errors, value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} 必须是数组`);
    return [];
  }
  if (!allowEmpty && value.length === 0) {
    errors.push(`${label} 不能为空数组`);
  }
  if (!value.every(isNonEmptyString)) {
    errors.push(`${label} 必须是非空字符串数组`);
    return [];
  }
  return uniqueStrings(value);
}

function buildValidation(errors) {
  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateSourceAugmentationRequestContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return buildValidation(['source augmentation request contract 必须是对象']);
  }

  if (contract.schema_version !== 1) {
    errors.push('schema_version 必须为 1');
  }
  if (!isNonEmptyString(contract.topic_id)) {
    errors.push('topic_id 不能为空');
  }
  if (!isNonEmptyString(contract.title)) {
    errors.push('title 不能为空');
  }
  if (contract.request_kind !== 'shared_source_readiness_augmentation') {
    errors.push('request_kind 必须为 shared_source_readiness_augmentation');
  }
  if (!['required', 'recommended', 'not_required'].includes(String(contract.status || '').trim())) {
    errors.push('status 非法');
  }
  if (!['auto_required', 'operator_optional', 'not_needed'].includes(String(contract.execution_mode || '').trim())) {
    errors.push('execution_mode 非法');
  }
  if (contract.readiness_target !== 'planning_ready') {
    errors.push('readiness_target 必须为 planning_ready');
  }

  if (!isPlainObject(contract.authoritative_inputs)) {
    errors.push('authoritative_inputs 必须是对象');
  } else {
    if (!isNonEmptyString(contract.authoritative_inputs.source_brief)) {
      errors.push('authoritative_inputs.source_brief 不能为空');
    }
    if (!isNonEmptyString(contract.authoritative_inputs.source_audit)) {
      errors.push('authoritative_inputs.source_audit 不能为空');
    }
    if (!isNonEmptyString(contract.authoritative_inputs.source_readiness_pack)) {
      errors.push('authoritative_inputs.source_readiness_pack 不能为空');
    }
  }

  if (!isPlainObject(contract.trigger)) {
    errors.push('trigger 必须是对象');
  } else {
    if (!isNonEmptyString(contract.trigger.input_mode)) {
      errors.push('trigger.input_mode 不能为空');
    }
    if (!isNonEmptyString(contract.trigger.confidence)) {
      errors.push('trigger.confidence 不能为空');
    }
    if (!isNonEmptyString(contract.trigger.source_audit_status)) {
      errors.push('trigger.source_audit_status 不能为空');
    }
    if (!['planning_ready', 'augmentation_required'].includes(String(contract.trigger.source_sufficiency_status || '').trim())) {
      errors.push('trigger.source_sufficiency_status 非法');
    }
    if (!['required', 'recommended', 'completed', 'not_required'].includes(String(contract.trigger.deep_research_state || '').trim())) {
      errors.push('trigger.deep_research_state 非法');
    }
    const blockingEvidenceGaps = pushArrayStringErrors(errors, contract.trigger.blocking_evidence_gaps, 'trigger.blocking_evidence_gaps');
    const residualEvidenceGaps = pushArrayStringErrors(errors, contract.trigger.residual_evidence_gaps, 'trigger.residual_evidence_gaps');
    pushArrayStringErrors(errors, contract.trigger.evidence_gaps, 'trigger.evidence_gaps');
    if (String(contract.trigger.source_sufficiency_status || '').trim() === 'planning_ready' && blockingEvidenceGaps.length > 0) {
      errors.push('planning_ready 时 trigger.blocking_evidence_gaps 必须为空');
    }
    for (const gapId of blockingEvidenceGaps) {
      if (residualEvidenceGaps.includes(gapId)) {
        errors.push(`同一个 gap 不能同时属于 blocking 与 residual: ${gapId}`);
      }
    }
  }

  if (!isPlainObject(contract.focus)) {
    errors.push('focus 必须是对象');
  } else {
    if (!isNonEmptyString(contract.focus.topic_summary)) {
      errors.push('focus.topic_summary 不能为空');
    }
    if (typeof contract.focus.brief_text !== 'string') {
      errors.push('focus.brief_text 必须是字符串');
    }
    pushArrayStringErrors(errors, contract.focus.keywords, 'focus.keywords');
    const requiredOutputs = pushArrayStringErrors(errors, contract.focus.required_outputs, 'focus.required_outputs', {
      allowEmpty: false,
    });
    const canonicalOutputs = [
      'topic_summary',
      'key_fact_groups',
      'reference_source_list',
      'source_quality_notes',
      'evidence_gap_resolution',
    ];
    for (const output of canonicalOutputs) {
      if (!requiredOutputs.includes(output)) {
        errors.push(`focus.required_outputs 缺少 ${output}`);
      }
    }
  }

  if (!Array.isArray(contract.investigation_lanes) || contract.investigation_lanes.length === 0) {
    errors.push('investigation_lanes 必须包含至少一个 lane');
  } else {
    const laneIds = new Set();
    for (const lane of contract.investigation_lanes) {
      if (!isPlainObject(lane)) {
        errors.push('investigation_lanes 项必须是对象');
        continue;
      }
      if (!isNonEmptyString(lane.lane_id)) {
        errors.push('investigation_lanes.lane_id 不能为空');
      } else if (laneIds.has(lane.lane_id)) {
        errors.push(`investigation_lanes.lane_id 重复: ${lane.lane_id}`);
      } else {
        laneIds.add(lane.lane_id);
      }
      if (!['required', 'suggested'].includes(String(lane.priority || '').trim())) {
        errors.push(`investigation_lanes.priority 非法: ${String(lane.lane_id || '').trim() || '<unknown>'}`);
      }
      if (!isNonEmptyString(lane.objective)) {
        errors.push(`investigation_lanes.objective 不能为空: ${String(lane.lane_id || '').trim() || '<unknown>'}`);
      }
      if (!isNonEmptyString(lane.deliverable_value)) {
        errors.push(`investigation_lanes.deliverable_value 不能为空: ${String(lane.lane_id || '').trim() || '<unknown>'}`);
      }
      pushArrayStringErrors(
        errors,
        lane.focus_terms,
        `investigation_lanes.focus_terms:${String(lane.lane_id || '').trim() || '<unknown>'}`,
      );
    }
  }

  return buildValidation(errors);
}

export function validateSourceAugmentationResultContract(contract, options = {}) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return buildValidation(['source augmentation result contract 必须是对象']);
  }

  if (contract.schema_version !== 1) {
    errors.push('schema_version 必须为 1');
  }
  if (!isNonEmptyString(contract.topic_id)) {
    errors.push('topic_id 不能为空');
  }
  if (isNonEmptyString(options.expectedTopicId) && contract.topic_id !== options.expectedTopicId) {
    errors.push(`topic_id 必须匹配 request.topic_id: ${options.expectedTopicId}`);
  }
  if (contract.request_kind !== 'shared_source_readiness_augmentation_result') {
    errors.push('request_kind 必须为 shared_source_readiness_augmentation_result');
  }
  if (contract.status !== 'completed') {
    errors.push('status 必须为 completed');
  }
  if (contract.readiness_target !== 'planning_ready') {
    errors.push('readiness_target 必须为 planning_ready');
  }
  if (!isNonEmptyString(contract.topic_summary)) {
    errors.push('topic_summary 不能为空');
  }

  const referenceIds = new Set();
  if (!Array.isArray(contract.reference_source_list) || contract.reference_source_list.length === 0) {
    errors.push('reference_source_list 必须包含至少一个来源');
  } else {
    for (const item of contract.reference_source_list) {
      if (!isPlainObject(item)) {
        errors.push('reference_source_list 项必须是对象');
        continue;
      }
      if (!isNonEmptyString(item.reference_id)) {
        errors.push('reference_source_list.reference_id 不能为空');
      } else if (referenceIds.has(item.reference_id)) {
        errors.push(`reference_source_list.reference_id 重复: ${item.reference_id}`);
      } else {
        referenceIds.add(item.reference_id);
      }
      if (!isNonEmptyString(item.label)) {
        errors.push(`reference_source_list.label 不能为空: ${String(item.reference_id || '').trim() || '<unknown>'}`);
      }
      if (!isNonEmptyString(item.url)) {
        errors.push(`reference_source_list.url 不能为空: ${String(item.reference_id || '').trim() || '<unknown>'}`);
      }
    }
  }

  const factIds = new Set();
  if (!Array.isArray(contract.key_fact_groups) || contract.key_fact_groups.length === 0) {
    errors.push('key_fact_groups 必须包含至少一个事实');
  } else {
    for (const item of contract.key_fact_groups) {
      if (!isPlainObject(item)) {
        errors.push('key_fact_groups 项必须是对象');
        continue;
      }
      if (!isNonEmptyString(item.fact_id)) {
        errors.push('key_fact_groups.fact_id 不能为空');
      } else if (factIds.has(item.fact_id)) {
        errors.push(`key_fact_groups.fact_id 重复: ${item.fact_id}`);
      } else {
        factIds.add(item.fact_id);
      }
      if (!isNonEmptyString(item.label)) {
        errors.push(`key_fact_groups.label 不能为空: ${String(item.fact_id || '').trim() || '<unknown>'}`);
      }
      if (!isNonEmptyString(item.reference_id)) {
        errors.push(`key_fact_groups.reference_id 不能为空: ${String(item.fact_id || '').trim() || '<unknown>'}`);
      } else if (!referenceIds.has(item.reference_id)) {
        errors.push(`key_fact_groups.reference_id 未在 reference_source_list 中声明: ${item.reference_id}`);
      }
    }
  }

  pushArrayStringErrors(errors, contract.source_quality_notes, 'source_quality_notes');

  const requiredEvidenceGaps = uniqueStrings(options.requiredEvidenceGaps);
  const resolvedGaps = new Set();
  if (!Array.isArray(contract.evidence_gap_resolution)) {
    errors.push('evidence_gap_resolution 必须是数组');
  } else {
    for (const item of contract.evidence_gap_resolution) {
      if (!isPlainObject(item)) {
        errors.push('evidence_gap_resolution 项必须是对象');
        continue;
      }
      if (!isNonEmptyString(item.gap_id)) {
        errors.push('evidence_gap_resolution.gap_id 不能为空');
      } else if (resolvedGaps.has(item.gap_id)) {
        errors.push(`evidence_gap_resolution.gap_id 重复: ${item.gap_id}`);
      } else {
        resolvedGaps.add(item.gap_id);
      }
      if (!['resolved', 'unresolved'].includes(String(item.status || '').trim())) {
        errors.push(`evidence_gap_resolution.status 非法: ${String(item.gap_id || '').trim() || '<unknown>'}`);
      }
      if (!isNonEmptyString(item.note)) {
        errors.push(`evidence_gap_resolution.note 不能为空: ${String(item.gap_id || '').trim() || '<unknown>'}`);
      }
      if (requiredEvidenceGaps.length > 0 && isNonEmptyString(item.gap_id) && !requiredEvidenceGaps.includes(item.gap_id)) {
        errors.push(`evidence_gap_resolution.gap_id 未在 request.trigger.evidence_gaps 中声明: ${item.gap_id}`);
      }
    }
  }

  for (const gapId of requiredEvidenceGaps) {
    if (!resolvedGaps.has(gapId)) {
      errors.push(`evidence_gap_resolution 缺少 request.trigger.evidence_gaps 中的 gap: ${gapId}`);
    }
  }

  return buildValidation(errors);
}
