import { intakeSource as runSourceIntake } from '@redcube/runtime';

export async function intakeSource(request) {
  const result = await runSourceIntake(request);
  return {
    ...result,
    surface_kind: 'source_intake',
    recommended_action: result.audit?.status === 'pass' ? 'create_deliverable' : 'resolve_source_blocks',
    summary: {
      topic_id: request.topicId || '',
      audit_status: result.audit?.status || null,
      blocking_reason_count: result.audit?.blocking_reasons?.length || 0,
    },
  };
}
