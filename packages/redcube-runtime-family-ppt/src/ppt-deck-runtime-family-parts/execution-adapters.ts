// @ts-nocheck
import {
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
} from '@redcube/codex-cli-client';
import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  buildCodexExecutionModel,
  buildHermesExecutionModel,
  buildHermesNativeProofExecutionModel,
  generateStructuredArtifactViaHermesAgentApi,
  generateStructuredArtifactViaHermesAgentStructuredCall,
  generateStructuredArtifactViaHermesNativeProof,
} from '@redcube/hermes-substrate';
import { createStructuredArtifactExecutor } from './executor-routing.js';

export function createPptDeckExecutionAdapterParts({ safeText }) {
  const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
  const HERMES_AGENT_EXECUTION_MODEL = Object.freeze(buildHermesExecutionModel());
  const HERMES_NATIVE_PROOF_EXECUTION_MODEL = Object.freeze(buildHermesNativeProofExecutionModel());

  function isHermesAgentAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    const requested = safeText(adapter);
    return requested === HERMES_DEFAULT_ADAPTER || requested === HERMES_AGENT_EXECUTOR_BACKEND;
  }

  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) return HERMES_NATIVE_PROOF_EXECUTION_MODEL;
    if (isHermesAgentAdapter(adapter)) return HERMES_AGENT_EXECUTION_MODEL;
    return CODEX_EXECUTION_MODEL;
  }

  function creativeOwner(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (isHermesAgentAdapter(adapter)) {
      if (safeText(generationRuntime?.creative_owner)) {
        return safeText(generationRuntime.creative_owner);
      }
      if (safeText(generationRuntime?.owner)) {
        return safeText(generationRuntime.owner);
      }
      return HERMES_AGENT_EXECUTOR_BACKEND;
    }
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
      if (safeText(generationRuntime?.creative_owner)) {
        return safeText(generationRuntime.creative_owner);
      }
      if (safeText(generationRuntime?.owner)) {
        return safeText(generationRuntime.owner);
      }
      return HERMES_NATIVE_PROOF_ADAPTER;
    }
    return 'host_agent';
  }

  function primarySurface(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (safeText(generationRuntime?.primary_surface)) {
      return safeText(generationRuntime.primary_surface);
    }
    if (safeText(generationRuntime?.adapter_surface)) {
      return safeText(generationRuntime.adapter_surface);
    }
    if (isHermesAgentAdapter(adapter)) {
      return 'hermes_agent_api_server';
    }
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? 'hermes_native_full_agent_loop'
      : 'codex_native_host_agent';
  }

  function runtimeCreativeSource(
    protectedSurface,
    artifactSource,
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    return {
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      stage_owner: primarySurface(generationRuntime, adapter),
      ownership_model: 'director_first',
      authored_surface: protectedSurface,
      materialized_from: artifactSource,
    };
  }

  function creativeSourceStamp({
    route,
    lifecycleStage,
    authoredSurface,
    materializedFrom = 'prompt_pack_seed',
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    return {
      ...runtimeCreativeSource(authoredSurface, materializedFrom, generationRuntime, adapter),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }

  function creativeExecution(routeOrLifecycleStage, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      lifecycle_stage: routeOrLifecycleStage,
      ownership_model: 'director_first',
      ...(generationRuntime
        ? {
            generation_runtime: generationRuntime,
          }
        : {}),
    };
  }

  const generateStructuredArtifact = createStructuredArtifactExecutor({
    CODEX_DEFAULT_ADAPTER,
    HERMES_AGENT_EXECUTOR_BACKEND,
    HERMES_NATIVE_PROOF_ADAPTER,
    generateStructuredArtifactViaCodexCli,
    generateStructuredArtifactViaHermesAgentApi,
    generateStructuredArtifactViaHermesAgentStructuredCall,
    generateStructuredArtifactViaHermesNativeProof,
    isHermesAgentAdapter,
    safeText,
  });

  async function generateStructuredArtifactBatch({
    adapter = CODEX_DEFAULT_ADAPTER,
    stages = [],
    executionShape = null,
    hermesProfile = null,
    executorRouting = null,
    ...input
  }) {
    if (isHermesAgentAdapter(adapter)) {
      const data = [];
      for (const stage of stages) {
        const result = await generateStructuredArtifact({
          adapter,
          executionShape,
          hermesProfile,
          executorRouting,
          ...stage,
        });
        data.push({
          stage_id: safeText(stage?.stage_id),
          data: result.data,
          generationRuntime: result.generationRuntime,
        });
      }
      return {
        data,
        batchRuntime: {
          owner: HERMES_AGENT_EXECUTOR_BACKEND,
          session_pool: {
            reuse_supported: false,
            reuse_claimed: false,
            reuse_status: 'unsupported_by_adapter',
            invocation_count: data.length,
          },
        },
      };
    }
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
      const data = [];
      for (const stage of stages) {
        const result = await generateStructuredArtifactViaHermesNativeProof(stage);
        data.push({
          stage_id: safeText(stage?.stage_id),
          data: result.data,
          generationRuntime: result.generationRuntime,
        });
      }
      return {
        data,
        batchRuntime: {
          owner: HERMES_NATIVE_PROOF_ADAPTER,
          session_pool: {
            reuse_supported: false,
            reuse_claimed: false,
            reuse_status: 'unsupported_by_adapter',
            invocation_count: data.length,
          },
        },
      };
    }
    return generateStructuredArtifactBatchViaCodexCli({ stages, ...input });
  }

  return {
    CODEX_DEFAULT_ADAPTER,
    HERMES_AGENT_EXECUTOR_BACKEND,
    HERMES_NATIVE_PROOF_ADAPTER,
    creativeExecution,
    creativeSourceStamp,
    executionModelForAdapter,
    generateStructuredArtifact,
    generateStructuredArtifactBatch,
    isHermesAgentAdapter,
    primarySurface,
    runtimeCreativeSource,
  };
}
