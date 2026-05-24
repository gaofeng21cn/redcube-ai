import { researchSource as runSourceResearch } from '@redcube/runtime';

type SourceResearchResult = Record<string, any>;
type SourceResearchRequest = Record<string, any> & {
  workspaceRoot: string;
  topicId: string;
};

function recommendedActionForResearch(result: SourceResearchResult): string {
  if (result.ok !== true && result.stage === 'source_intake') return 'resolve_source_blocks';
  if (result.stage === 'source_augmentation_result_preparation') return 'write_source_augmentation_result';
  if (result.ok !== true && result.stage === 'source_augmentation_execution') {
    return 'configure_source_augmentation_executor';
  }
  if (result.planningReady === true) return 'create_deliverable';
  return 'continue';
}

export async function researchSource(request: SourceResearchRequest) {
  const result = await runSourceResearch(request);
  const recommendedAction = result?.report?.recommended_action || recommendedActionForResearch(result);
  return {
    ...result,
    surface_kind: 'source_research',
    recommended_action: recommendedAction,
    summary: {
      topic_id: result.topicId || request.topicId || '',
      stage: result.stage || null,
      planning_ready: result.planningReady === true,
    },
  };
}
