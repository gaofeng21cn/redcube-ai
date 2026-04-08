import { writeSourceAugmentationResult as runWriteSourceAugmentationResult } from '@redcube/runtime';

export async function writeSourceAugmentationResult(request) {
  const result = await runWriteSourceAugmentationResult(request);
  return {
    ...result,
    surface_kind: 'source_augmentation_result_write',
    recommended_action: 'execute_source_augmentation',
    summary: {
      topic_id: request.topicId || '',
      readiness_target: result.resultContract?.readiness_target || null,
      reference_source_count: Array.isArray(result.resultContract?.reference_source_list)
        ? result.resultContract.reference_source_list.length
        : 0,
      fact_group_count: Array.isArray(result.resultContract?.key_fact_groups)
        ? result.resultContract.key_fact_groups.length
        : 0,
    },
  };
}
