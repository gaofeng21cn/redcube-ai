import { prepareSourceAugmentation as runSourceAugmentation } from '@redcube/runtime';

import type {
  RuntimeSourceAugmentationRequest,
  RuntimeSourceAugmentationResponse,
} from '@redcube/runtime';
import type { SourceAugmentationResponse } from '../types.js';

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function recommendedActionForAugmentation(result: RuntimeSourceAugmentationResponse): string {
  return result.augmentation.status === 'not_required'
    ? 'create_deliverable'
    : 'continue';
}

export async function prepareSourceAugmentation(
  request: RuntimeSourceAugmentationRequest,
): Promise<SourceAugmentationResponse> {
  const result = await runSourceAugmentation(request);
  return {
    ...result,
    surface_kind: 'source_augmentation',
    recommended_action: recommendedActionForAugmentation(result),
    summary: {
      topic_id: request.topicId || '',
      status: optionalString(result.augmentation.status),
      readiness_target: optionalString(result.augmentation.readiness_target),
    },
  };
}
