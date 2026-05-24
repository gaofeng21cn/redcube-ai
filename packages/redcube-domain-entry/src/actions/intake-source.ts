import { intakeSource as runSourceIntake } from '@redcube/runtime';

import type {
  RuntimeSourceIntakeRequest,
  RuntimeSourceIntakeResponse,
} from '@redcube/runtime';
import type { SourceIntakeResponse } from '../types.js';

function recommendedActionForIntake(result: RuntimeSourceIntakeResponse): string {
  if (result.audit.status !== 'pass') return 'resolve_source_blocks';
  if (result.augmentation.status === 'required' || result.augmentation.status === 'recommended') {
    return 'prepare_source_augmentation';
  }
  return 'create_deliverable';
}

export async function intakeSource(request: RuntimeSourceIntakeRequest): Promise<SourceIntakeResponse> {
  const result = await runSourceIntake(request);
  return {
    ...result,
    surface_kind: 'source_intake',
    recommended_action: recommendedActionForIntake(result),
    summary: {
      topic_id: request.topicId || '',
      audit_status: typeof result.audit.status === 'string' ? result.audit.status : null,
      blocking_reason_count: Array.isArray(result.audit.blocking_reasons)
        ? result.audit.blocking_reasons.length
        : 0,
    },
  };
}
