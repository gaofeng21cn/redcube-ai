import type {
  ValidateSourceAugmentationResultOptions,
  ValidationResult,
} from './types.js';
import {
  buildValidation,
  isNonEmptyString,
  isPlainObject,
  pushArrayStringErrors,
  uniqueStrings,
} from './protocol-utils.js';
import type { JsonRecord } from './protocol-utils.js';

function validateResultEnvelope(
  errors: string[],
  contract: JsonRecord,
  options: ValidateSourceAugmentationResultOptions,
): void {
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
}

function collectReferenceIds(errors: string[], referenceSourceList: unknown): Set<string> {
  const referenceIds = new Set<string>();
  if (!Array.isArray(referenceSourceList) || referenceSourceList.length === 0) {
    errors.push('reference_source_list 必须包含至少一个来源');
    return referenceIds;
  }

  for (const item of referenceSourceList) {
    if (!isPlainObject(item)) {
      errors.push('reference_source_list 项必须是对象');
      continue;
    }
    const referenceId = String(item.reference_id || '').trim() || '<unknown>';
    if (!isNonEmptyString(item.reference_id)) {
      errors.push('reference_source_list.reference_id 不能为空');
    } else if (referenceIds.has(item.reference_id)) {
      errors.push(`reference_source_list.reference_id 重复: ${item.reference_id}`);
    } else {
      referenceIds.add(item.reference_id);
    }
    if (!isNonEmptyString(item.label)) {
      errors.push(`reference_source_list.label 不能为空: ${referenceId}`);
    }
    if (!isNonEmptyString(item.url)) {
      errors.push(`reference_source_list.url 不能为空: ${referenceId}`);
    }
  }
  return referenceIds;
}

function validateKeyFactGroups(
  errors: string[],
  keyFactGroups: unknown,
  referenceIds: Set<string>,
): void {
  const factIds = new Set<string>();
  if (!Array.isArray(keyFactGroups) || keyFactGroups.length === 0) {
    errors.push('key_fact_groups 必须包含至少一个事实');
    return;
  }

  for (const item of keyFactGroups) {
    if (!isPlainObject(item)) {
      errors.push('key_fact_groups 项必须是对象');
      continue;
    }
    const factId = String(item.fact_id || '').trim() || '<unknown>';
    if (!isNonEmptyString(item.fact_id)) {
      errors.push('key_fact_groups.fact_id 不能为空');
    } else if (factIds.has(item.fact_id)) {
      errors.push(`key_fact_groups.fact_id 重复: ${item.fact_id}`);
    } else {
      factIds.add(item.fact_id);
    }
    if (!isNonEmptyString(item.label)) {
      errors.push(`key_fact_groups.label 不能为空: ${factId}`);
    }
    if (!isNonEmptyString(item.reference_id)) {
      errors.push(`key_fact_groups.reference_id 不能为空: ${factId}`);
    } else if (!referenceIds.has(item.reference_id)) {
      errors.push(`key_fact_groups.reference_id 未在 reference_source_list 中声明: ${item.reference_id}`);
    }
  }
}

function validateEvidenceGapResolution(
  errors: string[],
  evidenceGapResolution: unknown,
  requiredEvidenceGaps: string[],
): void {
  const resolvedGaps = new Set<string>();
  if (!Array.isArray(evidenceGapResolution)) {
    errors.push('evidence_gap_resolution 必须是数组');
  } else {
    for (const item of evidenceGapResolution) {
      if (!isPlainObject(item)) {
        errors.push('evidence_gap_resolution 项必须是对象');
        continue;
      }
      const gapId = String(item.gap_id || '').trim() || '<unknown>';
      if (!isNonEmptyString(item.gap_id)) {
        errors.push('evidence_gap_resolution.gap_id 不能为空');
      } else if (resolvedGaps.has(item.gap_id)) {
        errors.push(`evidence_gap_resolution.gap_id 重复: ${item.gap_id}`);
      } else {
        resolvedGaps.add(item.gap_id);
      }
      if (!['resolved', 'unresolved'].includes(String(item.status || '').trim())) {
        errors.push(`evidence_gap_resolution.status 非法: ${gapId}`);
      }
      if (!isNonEmptyString(item.note)) {
        errors.push(`evidence_gap_resolution.note 不能为空: ${gapId}`);
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
}

export function validateSourceAugmentationResultContract(
  contract: unknown,
  options: ValidateSourceAugmentationResultOptions = {},
): ValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(contract)) {
    return buildValidation(['source augmentation result contract 必须是对象']);
  }

  validateResultEnvelope(errors, contract, options);
  const referenceIds = collectReferenceIds(errors, contract.reference_source_list);
  validateKeyFactGroups(errors, contract.key_fact_groups, referenceIds);
  pushArrayStringErrors(errors, contract.source_quality_notes, 'source_quality_notes');
  validateEvidenceGapResolution(errors, contract.evidence_gap_resolution, uniqueStrings(options.requiredEvidenceGaps));

  return buildValidation(errors);
}
