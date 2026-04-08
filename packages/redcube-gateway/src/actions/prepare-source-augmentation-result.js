import { prepareSourceAugmentationResult as runPrepareSourceAugmentationResult } from '@redcube/runtime';

export async function prepareSourceAugmentationResult(request) {
  const result = await runPrepareSourceAugmentationResult(request);
  return {
    ...result,
    surface_kind: 'source_augmentation_result_preparation',
    recommended_action: 'write_source_augmentation_result',
    summary: {
      topic_id: request.topicId || '',
      readiness_target: result.resultDraft?.readiness_target || null,
      evidence_gap_count: Array.isArray(result.resultDraft?.evidence_gap_resolution)
        ? result.resultDraft.evidence_gap_resolution.length
        : 0,
    },
  };
}
