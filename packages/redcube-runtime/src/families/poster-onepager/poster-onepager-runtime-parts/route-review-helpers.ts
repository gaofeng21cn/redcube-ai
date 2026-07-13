// @ts-nocheck
import { generateStructuredArtifactViaCodexCli } from '../../../executors/codex-caller.js';
import {
  CODEX_DEFAULT_ADAPTER,
  buildCodexExecutionModel,
} from '@redcube/runtime-protocol';

export { CODEX_DEFAULT_ADAPTER };

const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());

export function lifecycleStageForRoute(contract, route) {
  return contract?.lifecycle_model?.route_to_stage?.[route] || null;
}

function reviewOverlayForRoute(contract, route) {
  return contract?.lifecycle_model?.review_overlay_routes?.[route] || null;
}

export async function generateStructuredArtifact({
  adapter = CODEX_DEFAULT_ADAPTER,
  ...input
}) {
  if (adapter !== CODEX_DEFAULT_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${adapter}`);
  }
  return generateStructuredArtifactViaCodexCli(input);
}

export function createPosterOnepagerRouteReviewHelpers({ promptMeta, safeText }) {
  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    if (adapter !== CODEX_DEFAULT_ADAPTER) {
      throw new Error(`Unsupported executor adapter: ${adapter}`);
    }
    return CODEX_EXECUTION_MODEL;
  }

  function creativeOwner(generationRuntime = null) {
    if (safeText(generationRuntime?.creative_owner)) {
      return safeText(generationRuntime.creative_owner);
    }
    return CODEX_DEFAULT_ADAPTER;
  }

  function primarySurface(generationRuntime = null) {
    if (safeText(generationRuntime?.primary_surface)) {
      return safeText(generationRuntime.primary_surface);
    }
    return 'codex_cli_runtime';
  }

  function creativeExecution(
    lifecycleStage,
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    return {
      owner: creativeOwner(generationRuntime),
      primary_surface: primarySurface(generationRuntime),
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
    materializedFrom = 'codex_cli_json_output',
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    return {
      owner: creativeOwner(generationRuntime),
      primary_surface: primarySurface(generationRuntime),
      stage_owner: primarySurface(generationRuntime),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }

  function reviewAuthorship(overlay, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      overlay,
      primary_surface: primarySurface(generationRuntime),
      contract_asset: 'stage_prompt_and_attached_output_contract',
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
