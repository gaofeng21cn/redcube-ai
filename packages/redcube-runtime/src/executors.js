import { canRunPptDeck, runPptDeckRoute } from './ppt-deck-runtime.js';

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
