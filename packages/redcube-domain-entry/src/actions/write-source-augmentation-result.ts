import { writeSourceAugmentationResult as runWriteSourceAugmentationResult } from '@redcube/runtime';

import type {
  RuntimeSourceAugmentationResultWriteRequest,
} from '@redcube/runtime';
import type { SourceAugmentationResultWriteResponse } from '../types.js';

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export async function writeSourceAugmentationResult(
  request: RuntimeSourceAugmentationResultWriteRequest,
): Promise<SourceAugmentationResultWriteResponse> {
  const result = await runWriteSourceAugmentationResult(request);
  return {
    ...result,
    surface_kind: 'source_augmentation_result_write',
    recommended_action: 'execute_source_augmentation',
    summary: {
      topic_id: request.topicId || '',
      readiness_target: optionalString(result.resultContract.readiness_target),
      reference_source_count: Array.isArray(result.resultContract.reference_source_list)
        ? result.resultContract.reference_source_list.length
        : 0,
      fact_group_count: Array.isArray(result.resultContract.key_fact_groups)
        ? result.resultContract.key_fact_groups.length
        : 0,
    },
  };
}
