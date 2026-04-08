import { executeSourceAugmentation as runSourceAugmentationExecution } from '@redcube/runtime';

function recommendedActionForExecution(result) {
  if (result.report?.status === 'blocked') return 'configure_source_augmentation_executor';
  return 'create_deliverable';
}

export async function executeSourceAugmentation(request) {
  const result = await runSourceAugmentationExecution(request);
  return {
    ...result,
    surface_kind: 'source_augmentation_execution',
    recommended_action: recommendedActionForExecution(result),
    summary: {
      topic_id: request.topicId || '',
      status: result.report?.status || null,
      readiness_target: result.report?.readiness_target || null,
    },
  };
}
