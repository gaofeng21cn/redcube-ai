import { intakeSource as runSourceIntake } from '@redcube/runtime';

function recommendedActionForIntake(result) {
  if (result.audit?.status !== 'pass') return 'resolve_source_blocks';
  if (result.augmentation?.status === 'required' || result.augmentation?.status === 'recommended') {
    return 'prepare_source_augmentation';
  }
  return 'create_deliverable';
}

export async function intakeSource(request) {
  const result = await runSourceIntake(request);
  return {
    ...result,
    surface_kind: 'source_intake',
    recommended_action: recommendedActionForIntake(result),
    summary: {
      topic_id: request.topicId || '',
      audit_status: result.audit?.status || null,
      blocking_reason_count: result.audit?.blocking_reasons?.length || 0,
    },
  };
}
