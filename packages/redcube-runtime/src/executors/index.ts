import {
  AGENT_LOOP_EXECUTION_SHAPE,
  CODEX_DEFAULT_ADAPTER,
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_AGENT_ADAPTER,
  STRUCTURED_CALL_EXECUTION_SHAPE,
  buildCodexExecutorDescriptor,
  buildHermesExecutorDescriptor,
  buildHermesAgentLoopExecutorDescriptor,
  failRetiredHermesAgentAdapter,
} from '@redcube/runtime-protocol';
import { loadRuntimeFamilyRunner } from '../default-registries.js';
import type { RuntimeFamilyContract } from '../default-registries.js';

export {
  OPL_CODEX_EXECUTOR_SURFACE,
  REDCUBE_CODEX_RUNTIME_OWNER,
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_CREATIVE_GENERATION_META_END,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  generateImageViaCodexNativeImagegen,
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
  probeCodexCli,
  readCodexCliContract,
} from './codex-caller.js';

interface ExecutorRouteInput {
  workspaceRoot: string;
  overlay: string;
  route: string;
  topicId: string;
  deliverableId: string;
  contract: RuntimeFamilyContract;
  stageContract: { stage_id?: string } | null;
  mode?: string;
  baselineDeliverableId?: string;
  executionShape?: 'structured_call' | 'agent_loop';
  hermesProfile?: string | null;
  executorRouting?: Record<string, unknown> | null;
}

interface ExecutorDescriptor extends Record<string, unknown> {
  adapter: string;
  executor_backend?: 'codex_cli' | 'hermes_agent';
  execution_shape?: 'structured_call' | 'agent_loop';
  execution_model?: Record<string, unknown>;
}

interface ExecutorAdapter extends ExecutorDescriptor {
  runRoute(input: ExecutorRouteInput): Promise<Record<string, unknown>>;
}

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
 *   executor_backend?: "codex_cli" | "hermes_agent",
 *   execution_shape?: "structured_call" | "agent_loop",
 *   primary?: boolean,
 *   execution_surface?: string,
 *   creative_execution?: string,
 *   execution_model?: {
 *     mainline_adapter: "codex_cli",
 *     primary_surface: "codex_cli_runtime",
 *     adapter_role: "primary_creative_executor",
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
 *       mainline_adapter: "codex_cli",
 *       primary_surface: "codex_cli_runtime",
 *       adapter_role: "primary_creative_executor",
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
 * @param {{ adapter?: string, executorBackend?: "codex_cli" | "hermes_agent", executionShape?: "structured_call" | "agent_loop", hermesProfile?: string | null, executorRouting?: Record<string, unknown> | null }} [options]
 * @returns {ExecutorAdapter}
 */
export function resolveExecutorAdapter({
  adapter = CODEX_DEFAULT_ADAPTER,
  executorBackend = undefined,
  executionShape = undefined,
  hermesProfile = null,
  executorRouting = null,
}: {
  adapter?: string;
  executorBackend?: 'codex_cli' | 'hermes_agent';
  executionShape?: 'structured_call' | 'agent_loop';
  hermesProfile?: string | null;
  executorRouting?: Record<string, unknown> | null;
} = {}): ExecutorAdapter {
  const requestedAdapter = String(adapter || '').trim();
  const requestedBackend = executorBackend || (
    requestedAdapter === HERMES_AGENT_EXECUTOR_BACKEND || requestedAdapter === HERMES_AGENT_ADAPTER
      ? HERMES_AGENT_EXECUTOR_BACKEND
      : 'codex_cli'
  );
  const requestedShape = executionShape || (
    requestedBackend === HERMES_AGENT_EXECUTOR_BACKEND
      ? AGENT_LOOP_EXECUTION_SHAPE
      : STRUCTURED_CALL_EXECUTION_SHAPE
  );
  const descriptorBase = (
    requestedBackend === HERMES_AGENT_EXECUTOR_BACKEND && requestedShape === AGENT_LOOP_EXECUTION_SHAPE
      ? buildHermesAgentLoopExecutorDescriptor({ adapter })
      : (
          requestedBackend === HERMES_AGENT_EXECUTOR_BACKEND
            ? buildHermesExecutorDescriptor({ adapter })
            : buildCodexExecutorDescriptor({ adapter })
        )
  ) as unknown as ExecutorDescriptor;
  const descriptor = {
    ...descriptorBase,
    adapter: requestedBackend === HERMES_AGENT_EXECUTOR_BACKEND && requestedAdapter !== HERMES_AGENT_ADAPTER
      ? HERMES_AGENT_EXECUTOR_BACKEND
      : descriptorBase.adapter,
    ...(executionShape
      ? {
          execution_shape: requestedShape,
          execution_model: {
            ...(descriptorBase.execution_model || {}),
            execution_shape: requestedShape,
            ...(requestedShape === STRUCTURED_CALL_EXECUTION_SHAPE && requestedBackend === HERMES_AGENT_EXECUTOR_BACKEND
              ? {
                  mainline_adapter: HERMES_AGENT_EXECUTOR_BACKEND,
                  primary_surface: 'hermes_agent_api_server',
                  requested_adapter: HERMES_AGENT_EXECUTOR_BACKEND,
                }
              : {}),
          },
        }
      : {}),
    ...(hermesProfile ? { hermes_profile: hermesProfile } : {}),
    ...(executorRouting ? { executor_routing: executorRouting } : {}),
  } as ExecutorDescriptor;

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
      executionShape = descriptor.execution_shape,
      hermesProfile = String(descriptor.hermes_profile || '').trim() || null,
      executorRouting = descriptor.executor_routing as Record<string, unknown> | null,
    }) {
      if (!stageContract?.stage_id) {
        throw new Error(`Missing stage contract for route: ${route}`);
      }
      if (stageContract.stage_id !== route) {
        throw new Error(`Stage contract mismatch: expected ${route}, got ${stageContract.stage_id}`);
      }
      if (descriptor.executor_backend === HERMES_AGENT_EXECUTOR_BACKEND) {
        return failRetiredHermesAgentAdapter({
          surface: descriptor.execution_shape === STRUCTURED_CALL_EXECUTION_SHAPE
            ? 'hermes_agent_api_server'
            : 'hermes_agent_loop',
        }) as never;
      }

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
        executionShape,
        hermesProfile,
        executorRouting,
      }) as Record<string, unknown>;
      return {
        overlay,
        route,
        topic_id: topicId,
        deliverable_id: deliverableId,
        contract,
        stage_contract: stageContract,
        ...artifact,
        executor_backend: descriptor.executor_backend,
        execution_shape: descriptor.execution_shape,
        execution_model: descriptor.execution_model,
      };
    },
  };
}
