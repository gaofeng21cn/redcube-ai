import type { ValidationResult } from './types.js';
import {
  buildValidation,
  isNonEmptyString,
  isPlainObject,
  pushArrayStringErrors,
} from './protocol-utils.js';
import type { JsonRecord } from './protocol-utils.js';

const REQUIRED_FOCUS_OUTPUTS = [
  'topic_summary',
  'key_fact_groups',
  'reference_source_list',
  'source_quality_notes',
  'evidence_gap_resolution',
];

function validateRequestEnvelope(errors: string[], contract: JsonRecord): void {
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
}

function validateAuthoritativeInputs(errors: string[], authoritativeInputs: unknown): void {
  if (!isPlainObject(authoritativeInputs)) {
    errors.push('authoritative_inputs 必须是对象');
    return;
  }
  if (!isNonEmptyString(authoritativeInputs.source_brief)) {
    errors.push('authoritative_inputs.source_brief 不能为空');
  }
  if (!isNonEmptyString(authoritativeInputs.source_audit)) {
    errors.push('authoritative_inputs.source_audit 不能为空');
  }
  if (!isNonEmptyString(authoritativeInputs.source_readiness_pack)) {
    errors.push('authoritative_inputs.source_readiness_pack 不能为空');
  }
}

function validateTrigger(errors: string[], trigger: unknown): void {
  if (!isPlainObject(trigger)) {
    errors.push('trigger 必须是对象');
    return;
  }
  if (!isNonEmptyString(trigger.input_mode)) {
    errors.push('trigger.input_mode 不能为空');
  }
  if (!isNonEmptyString(trigger.confidence)) {
    errors.push('trigger.confidence 不能为空');
  }
  if (!isNonEmptyString(trigger.source_audit_status)) {
    errors.push('trigger.source_audit_status 不能为空');
  }
  if (!['planning_ready', 'augmentation_required'].includes(String(trigger.source_sufficiency_status || '').trim())) {
    errors.push('trigger.source_sufficiency_status 非法');
  }
  if (!['required', 'recommended', 'completed', 'not_required'].includes(String(trigger.deep_research_state || '').trim())) {
    errors.push('trigger.deep_research_state 非法');
  }
  const blockingEvidenceGaps = pushArrayStringErrors(errors, trigger.blocking_evidence_gaps, 'trigger.blocking_evidence_gaps');
  const residualEvidenceGaps = pushArrayStringErrors(errors, trigger.residual_evidence_gaps, 'trigger.residual_evidence_gaps');
  pushArrayStringErrors(errors, trigger.evidence_gaps, 'trigger.evidence_gaps');
  if (String(trigger.source_sufficiency_status || '').trim() === 'planning_ready' && blockingEvidenceGaps.length > 0) {
    errors.push('planning_ready 时 trigger.blocking_evidence_gaps 必须为空');
  }
  for (const gapId of blockingEvidenceGaps) {
    if (residualEvidenceGaps.includes(gapId)) {
      errors.push(`同一个 gap 不能同时属于 blocking 与 residual: ${gapId}`);
    }
  }
}

function validateFocus(errors: string[], focus: unknown): void {
  if (!isPlainObject(focus)) {
    errors.push('focus 必须是对象');
    return;
  }
  if (!isNonEmptyString(focus.topic_summary)) {
    errors.push('focus.topic_summary 不能为空');
  }
  if (typeof focus.brief_text !== 'string') {
    errors.push('focus.brief_text 必须是字符串');
  }
  pushArrayStringErrors(errors, focus.keywords, 'focus.keywords');
  const requiredOutputs = pushArrayStringErrors(errors, focus.required_outputs, 'focus.required_outputs', {
    allowEmpty: false,
  });
  for (const output of REQUIRED_FOCUS_OUTPUTS) {
    if (!requiredOutputs.includes(output)) {
      errors.push(`focus.required_outputs 缺少 ${output}`);
    }
  }
}

function validateInvestigationLanes(errors: string[], investigationLanes: unknown): void {
  if (!Array.isArray(investigationLanes) || investigationLanes.length === 0) {
    errors.push('investigation_lanes 必须包含至少一个 lane');
    return;
  }

  const laneIds = new Set<string>();
  for (const lane of investigationLanes) {
    if (!isPlainObject(lane)) {
      errors.push('investigation_lanes 项必须是对象');
      continue;
    }
    const laneId = String(lane.lane_id || '').trim() || '<unknown>';
    if (!isNonEmptyString(lane.lane_id)) {
      errors.push('investigation_lanes.lane_id 不能为空');
    } else if (laneIds.has(lane.lane_id)) {
      errors.push(`investigation_lanes.lane_id 重复: ${lane.lane_id}`);
    } else {
      laneIds.add(lane.lane_id);
    }
    if (!['required', 'suggested'].includes(String(lane.priority || '').trim())) {
      errors.push(`investigation_lanes.priority 非法: ${laneId}`);
    }
    if (!isNonEmptyString(lane.objective)) {
      errors.push(`investigation_lanes.objective 不能为空: ${laneId}`);
    }
    if (!isNonEmptyString(lane.deliverable_value)) {
      errors.push(`investigation_lanes.deliverable_value 不能为空: ${laneId}`);
    }
    pushArrayStringErrors(errors, lane.focus_terms, `investigation_lanes.focus_terms:${laneId}`);
  }
}

export function validateSourceAugmentationRequestContract(contract: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(contract)) {
    return buildValidation(['source augmentation request contract 必须是对象']);
  }

  validateRequestEnvelope(errors, contract);
  validateAuthoritativeInputs(errors, contract.authoritative_inputs);
  validateTrigger(errors, contract.trigger);
  validateFocus(errors, contract.focus);
  validateInvestigationLanes(errors, contract.investigation_lanes);

  return buildValidation(errors);
}
