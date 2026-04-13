import { loadRuntimeFamilyRunner } from '@redcube/runtime-family-registry';
import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_COMPATIBILITY_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  buildCodexExecutorDescriptor,
  buildHermesNativeProofExecutorDescriptor,
} from '@redcube/hermes-substrate';

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
 *     runtime_substrate_owner: "Codex CLI",
 *     deployment_host: "codex_local_operator_host",
 *     deployment_host_status: "active_primary",
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
 *       runtime_substrate_owner: "Codex CLI",
 *       deployment_host: "codex_local_operator_host",
 *       deployment_host_status: "active_primary",
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
export function resolveExecutorAdapter({ adapter = CODEX_DEFAULT_ADAPTER } = {}) {
  const descriptor = String(adapter || '').trim() === HERMES_NATIVE_PROOF_ADAPTER
    ? buildHermesNativeProofExecutorDescriptor({ adapter })
    : buildCodexExecutorDescriptor({ adapter });

  return {
    ...descriptor,
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

      if (descriptor.adapter === HERMES_COMPATIBILITY_ADAPTER && route !== 'storyline') {
        const error = new Error(`Unsupported route for adapter external_llm: ${route}`);
        error.code = 'compatibility_adapter_route_unsupported';
        error.requiresHumanConfirmation = false;
        error.requiresExternalSecret = false;
        throw error;
      }

      if (descriptor.adapter === CODEX_DEFAULT_ADAPTER || descriptor.adapter === HERMES_NATIVE_PROOF_ADAPTER) {
        const familyRunner = await loadRuntimeFamilyRunner(contract);
        const artifact = await familyRunner.runRoute({
          workspaceRoot,
          route,
          topicId,
          deliverableId,
          contract,
          mode,
          baselineDeliverableId,
          adapter: descriptor.adapter,
          executor: descriptor,
        });
        return {
          overlay,
          route,
          topic_id: topicId,
          deliverable_id: deliverableId,
          contract,
          stage_contract: stageContract,
          ...artifact,
          execution_model: descriptor.execution_model,
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
          ...descriptor,
        },
        produced_at: new Date().toISOString(),
      };
    },
  };
}
