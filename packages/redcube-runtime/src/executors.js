import { loadRuntimeFamilyRunner } from '@redcube/runtime-family-registry';

/**
 * @typedef {{
 *   workspaceRoot: string,
 *   overlay: string,
 *   route: string,
 *   topicId: string,
 *   deliverableId: string,
 *   contract: { overlay?: string, deliverable_kind?: string },
 *   stageContract: { stage_id?: string } | null,
 *   mode?: string,
 *   baselineDeliverableId?: string,
 * }} ExecutorRouteInput
 */

/**
 * @typedef {{
 *   adapter: string,
 *   primary?: boolean,
 *   execution_surface?: string,
 *   creative_execution?: string,
 *   external_llm_role?: string,
 *   execution_model?: {
 *     mainline_adapter: "host_agent",
 *     primary_surface: "codex_native_host_agent",
 *     adapter_role: "primary_creative_executor" | "optional_compatibility_adapter",
 *     agent_first_requires_external_llm: false,
 *     external_llm_role: "optional_compatibility_adapter",
 *     freeze_origin_milestone: "P19.A",
 *   },
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
 *     execution_model?: {
 *       mainline_adapter: "host_agent",
 *       primary_surface: "codex_native_host_agent",
 *       adapter_role: "primary_creative_executor" | "optional_compatibility_adapter",
 *       agent_first_requires_external_llm: false,
 *       external_llm_role: "optional_compatibility_adapter",
 *       freeze_origin_milestone: "P19.A",
 *     },
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

  const executionModel = Object.freeze({
    mainline_adapter: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    adapter_role: adapter === 'host_agent' ? 'primary_creative_executor' : 'optional_compatibility_adapter',
    agent_first_requires_external_llm: false,
    external_llm_role: 'optional_compatibility_adapter',
    freeze_origin_milestone: 'P19.A',
  });

  return {
    adapter,
    primary: adapter === 'host_agent',
    execution_surface: adapter === 'host_agent' ? 'codex_native_host_agent' : 'external_llm_adapter',
    creative_execution: adapter === 'host_agent' ? 'agent_first_director_first' : 'compatibility_adapter_only',
    external_llm_role: 'optional_compatibility_adapter',
    compatibility_role: adapter === 'external_llm' ? 'optional_compatibility_adapter' : null,
    execution_model: executionModel,
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

      if (adapter === 'host_agent') {
        const familyRunner = await loadRuntimeFamilyRunner(contract);
        const artifact = await familyRunner.runRoute({
          workspaceRoot,
          route,
          topicId,
          deliverableId,
          contract,
          mode,
          baselineDeliverableId,
        });
        return {
          ...artifact,
          execution_model: executionModel,
        };
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
          primary: adapter === 'host_agent',
          execution_surface: adapter === 'host_agent' ? 'codex_native_host_agent' : 'external_llm_adapter',
          creative_execution: adapter === 'host_agent' ? 'agent_first_director_first' : 'compatibility_adapter_only',
          external_llm_role: 'optional_compatibility_adapter',
          compatibility_role: adapter === 'external_llm' ? 'optional_compatibility_adapter' : null,
          execution_model: executionModel,
        },
        produced_at: new Date().toISOString(),
      };
    },
  };
}
