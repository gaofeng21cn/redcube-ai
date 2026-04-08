import { prepareSourceAugmentation as runSourceAugmentation } from '@redcube/runtime';

function recommendedActionForAugmentation(result) {
  return result?.augmentation?.status === 'not_required'
    ? 'create_deliverable'
    : 'continue';
}

export async function prepareSourceAugmentation(request) {
  const result = await runSourceAugmentation(request);
  return {
    ...result,
    surface_kind: 'source_augmentation',
    recommended_action: recommendedActionForAugmentation(result),
    summary: {
      topic_id: request.topicId || '',
      status: result.augmentation?.status || null,
      readiness_target: result.augmentation?.readiness_target || null,
    },
  };
}
