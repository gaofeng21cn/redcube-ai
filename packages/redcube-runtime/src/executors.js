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
      if (route !== 'storyline') {
        throw new Error(`Unsupported route: ${route}`);
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
