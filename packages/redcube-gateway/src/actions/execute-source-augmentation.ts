import { executeSourceAugmentation as runSourceAugmentationExecution } from '@redcube/runtime';

import type {
  RuntimeSourceAugmentationExecutionRequest,
  RuntimeSourceAugmentationExecutionResponse,
} from '@redcube/runtime';
import type { SourceAugmentationExecutionResponse } from '../types.js';

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function recommendedActionForExecution(result: RuntimeSourceAugmentationExecutionResponse): string {
  if (result.report.status === 'blocked') return 'configure_source_augmentation_executor';
  if (result.report.planning_ready !== true) return 'run_source_research';
  return 'create_deliverable';
}

export async function executeSourceAugmentation(
  request: RuntimeSourceAugmentationExecutionRequest,
): Promise<SourceAugmentationExecutionResponse> {
  const result = await runSourceAugmentationExecution(request);
  return {
    ...result,
    surface_kind: 'source_augmentation_execution',
    recommended_action: recommendedActionForExecution(result),
    summary: {
      topic_id: request.topicId || '',
      status: optionalString(result.report.status),
      readiness_target: optionalString(result.report.readiness_target),
    },
  };
}
