// @ts-nocheck
import {
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
} from '../../../executors/codex-caller.js';
import {
  CODEX_DEFAULT_ADAPTER,
  buildCodexExecutionModel,
} from '@redcube/runtime-protocol';

export function createPptDeckExecutionAdapterParts({ safeText }) {
  const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());

  function requireCodexAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    const requested = safeText(adapter, CODEX_DEFAULT_ADAPTER);
    if (requested !== CODEX_DEFAULT_ADAPTER) {
      throw new Error(`Unsupported executor adapter: ${requested}`);
    }
  }

  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    requireCodexAdapter(adapter);
    return CODEX_EXECUTION_MODEL;
  }

  function creativeOwner(generationRuntime = null) {
    return safeText(generationRuntime?.creative_owner)
      || safeText(generationRuntime?.owner)
      || CODEX_DEFAULT_ADAPTER;
  }

  function primarySurface(generationRuntime = null) {
    return safeText(generationRuntime?.primary_surface)
      || safeText(generationRuntime?.adapter_surface)
      || 'codex_cli_runtime';
  }

  function runtimeCreativeSource(
    protectedSurface,
    artifactSource,
    generationRuntime = null,
  ) {
    return {
      owner: creativeOwner(generationRuntime),
      primary_surface: primarySurface(generationRuntime),
      stage_owner: primarySurface(generationRuntime),
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
  }) {
    return {
      ...runtimeCreativeSource(authoredSurface, materializedFrom, generationRuntime),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }

  function creativeExecution(routeOrLifecycleStage, generationRuntime = null) {
    return {
      owner: creativeOwner(generationRuntime),
      primary_surface: primarySurface(generationRuntime),
      lifecycle_stage: routeOrLifecycleStage,
      ownership_model: 'director_first',
      ...(generationRuntime
        ? {
            generation_runtime: generationRuntime,
          }
        : {}),
    };
  }

  async function generateStructuredArtifact({
    adapter = CODEX_DEFAULT_ADAPTER,
    ...input
  }) {
    requireCodexAdapter(adapter);
    return generateStructuredArtifactViaCodexCli(input);
  }

  async function generateStructuredArtifactBatch({
    adapter = CODEX_DEFAULT_ADAPTER,
    stages = [],
    ...input
  }) {
    requireCodexAdapter(adapter);
    return generateStructuredArtifactBatchViaCodexCli({ stages, ...input });
  }

  return {
    CODEX_DEFAULT_ADAPTER,
    creativeExecution,
    creativeSourceStamp,
    executionModelForAdapter,
    generateStructuredArtifact,
    generateStructuredArtifactBatch,
    primarySurface,
    runtimeCreativeSource,
  };
}
