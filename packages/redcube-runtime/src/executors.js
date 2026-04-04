export function resolveExecutorAdapter({ adapter = 'host_agent' } = {}) {
  if (adapter !== 'host_agent' && adapter !== 'external_llm') {
    throw new Error(`Unsupported executor adapter: ${adapter}`);
  }

  return {
    adapter,
    async runRoute({
      overlay,
      route,
      topicId,
      deliverableId,
      contract,
      stageContract,
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
