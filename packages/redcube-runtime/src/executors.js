import { canRunPptDeck, runPptDeckRoute } from '@redcube/runtime-family-ppt';
import { canRunXiaohongshu, runXiaohongshuRoute } from '@redcube/runtime-family-xiaohongshu';

/**
 * @typedef {{
 *   workspaceRoot: string,
 *   overlay: string,
 *   route: string,
 *   topicId: string,
 *   deliverableId: string,
 *   contract: { deliverable_kind?: string },
 *   stageContract: { stage_id?: string } | null,
 *   mode?: string,
 *   baselineDeliverableId?: string,
 * }} ExecutorRouteInput
 */

/**
 * @typedef {{
 *   adapter: string,
 *   runRoute(input: ExecutorRouteInput): Promise<{
 *     artifact_refs?: string[],
 *     review_state_patch?: {
 *       current_status?: string,
 *       latest_review_stage?: string,
 *       pending_reviews?: string[],
 *       blocking_reasons?: string[],
 *     },
 *     status?: string,
 *     overlay?: string,
 *     route?: string,
 *     topic_id?: string,
 *     deliverable_id?: string,
 *     produced_at?: string,
 *   }>,
 * }} ExecutorAdapter
 */

/**
 * @param {{ adapter?: string }} [options]
 * @returns {ExecutorAdapter}
 */
export function resolveExecutorAdapter({ adapter = 'host_agent' } = {}) {
  if (adapter !== 'host_agent' && adapter !== 'external_llm') {
    throw new Error(`Unsupported executor adapter: ${adapter}`);
  }

  return {
    adapter,
    async runRoute({
      workspaceRoot,
      overlay,
      route,
      topicId,
      deliverableId,
      contract,
      stageContract,
      mode = 'draft_new',
      baselineDeliverableId = '',
    }) {
      if (!stageContract?.stage_id) {
        throw new Error(`Missing stage contract for route: ${route}`);
      }
      if (stageContract.stage_id !== route) {
        throw new Error(`Stage contract mismatch: expected ${route}, got ${stageContract.stage_id}`);
      }

      if (adapter === 'external_llm' && route !== 'storyline') {
        throw new Error(`Unsupported route for adapter external_llm: ${route}`);
      }

      if (adapter === 'host_agent' && canRunPptDeck(contract)) {
        return runPptDeckRoute({
          workspaceRoot,
          route,
          topicId,
          deliverableId,
          contract,
          mode,
          baselineDeliverableId,
        });
      }

      if (adapter === 'host_agent' && canRunXiaohongshu(contract)) {
        return runXiaohongshuRoute({
          workspaceRoot,
          route,
          topicId,
          deliverableId,
          contract,
          mode,
          baselineDeliverableId,
        });
      }

      return {
        overlay,
        route,
        topic_id: topicId,
        deliverable_id: deliverableId,
        contract,
        stage_contract: stageContract,
        executor: {
          adapter,
        },
        produced_at: new Date().toISOString(),
      };
    },
  };
}
