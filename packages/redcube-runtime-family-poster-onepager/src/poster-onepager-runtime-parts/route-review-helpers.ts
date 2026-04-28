// @ts-nocheck
import { generateStructuredArtifactViaCodexCli } from '@redcube/codex-cli-client';
import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  buildCodexExecutionModel,
  buildHermesNativeProofExecutionModel,
  generateStructuredArtifactViaHermesNativeProof,
} from '@redcube/hermes-substrate';

export { CODEX_DEFAULT_ADAPTER, HERMES_NATIVE_PROOF_ADAPTER };

const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
const HERMES_NATIVE_PROOF_EXECUTION_MODEL = Object.freeze(buildHermesNativeProofExecutionModel());

export function lifecycleStageForRoute(contract, route) {
  return contract?.lifecycle_model?.route_to_stage?.[route] || null;
}

export function reviewOverlayForRoute(contract, route) {
  return contract?.lifecycle_model?.review_overlay_routes?.[route] || null;
}

export async function generateStructuredArtifact({
  adapter = CODEX_DEFAULT_ADAPTER,
  ...input
}) {
  if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
    return generateStructuredArtifactViaHermesNativeProof(input);
  }
  return generateStructuredArtifactViaCodexCli(input);
}

export function createPosterOnepagerRouteReviewHelpers({ promptMeta, safeText }) {
  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? HERMES_NATIVE_PROOF_EXECUTION_MODEL
      : CODEX_EXECUTION_MODEL;
  }

  function creativeOwner(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (safeText(generationRuntime?.creative_owner)) {
      return safeText(generationRuntime.creative_owner);
    }
    return adapter === HERMES_NATIVE_PROOF_ADAPTER ? HERMES_NATIVE_PROOF_ADAPTER : 'host_agent';
  }

  function primarySurface(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (safeText(generationRuntime?.primary_surface)) {
      return safeText(generationRuntime.primary_surface);
    }
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? 'hermes_native_full_agent_loop'
      : 'codex_native_host_agent';
  }

  function creativeExecution(
    lifecycleStage,
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    return {
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      lifecycle_stage: lifecycleStage,
      ownership_model: 'director_first',
      ...(generationRuntime
        ? {
            generation_runtime: generationRuntime,
          }
        : {}),
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
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      stage_owner: primarySurface(generationRuntime, adapter),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }

  function reviewAuthorship(overlay, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      overlay,
      primary_surface: primarySurface(generationRuntime, adapter),
      contract_asset: 'prompt_pack_seed',
    };
  }

  function attachCommon(route, contract, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      route,
      overlay: contract.overlay,
      profile_id: contract.profile_id,
      produced_at: new Date().toISOString(),
      prompt_pack: promptMeta(contract, route),
      lifecycle_stage: lifecycleStageForRoute(contract, route),
      review_overlay: reviewOverlayForRoute(contract, route),
      execution_model: generationRuntime?.execution_model || executionModelForAdapter(adapter),
    };
  }

  return {
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    primarySurface,
    reviewAuthorship,
  };
}
