// @ts-nocheck
import {
  buildPptDetailedOutlineArtifact,
  buildPptSlideBlueprintArtifact,
  buildPptVisualDirectionArtifact,
} from './ppt-structured-artifact-builders.js';
import { createPptDeckRuntimeCore } from './ppt-deck-runtime-family-parts/core.js';

/**
 * @typedef {{
 *   status?: string,
 *   artifact_refs?: string[],
 *   review_state_patch?: {
 *     current_status?: string,
 *     ready_for_export?: boolean,
 *     latest_review_stage?: string,
 *     pending_reviews?: string[],
 *     blocking_reasons?: string[],
 *     rerun_from_stage?: string | null,
 *     rerun_policy?: {
 *       status?: string,
 *       rerun_from_stage?: string | null,
 *     },
 *   },
 *   html_bundle?: {
 *     html_file?: string,
 *     page_count?: number,
 *   },
 *   export_bundle?: {
 *     pptx_file?: string,
 *     pdf_file?: string,
 *     page_count?: number,
 *   },
 * }} PptRouteArtifact
 */

const {
  CANVAS,
  BANNED_RENDER_TOKENS,
  CODEX_DEFAULT_ADAPTER,
  CREATIVE_MATERIALIZED_FROM,
  PAGE_FIX_ROUTE,
  ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
  appendArtifactRefs,
  attachCommon,
  attachRouteReviewReset,
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  lifecycleStageForRoute,
  readStageArtifact,
  safeArray,
  sharedSourceConfidence,
  sharedSourceLabels,
  syncPptCanonicalSurface,
  authoringParts,
  stageParts,
} = createPptDeckRuntimeCore();
const {
  buildStoryline,
  generateBlueprintDraft,
  generateOutlineDraft,
  generateVisualDirectionDraft,
} = authoringParts;
const {
  buildDirectorReview,
  buildExportArtifact,
  buildImagePagesArtifact,
  buildNativePptArtifact,
  buildRenderHtmlArtifact,
  buildScreenshotReviewArtifact,
  ensurePrerequisites,
} = stageParts;

async function buildDetailedOutlineRoutePayload({ contract, deliverablePaths, adapter }) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const { authoredOutline, generationRuntime } = await generateOutlineDraft(contract, storylineArtifact, adapter);
  return buildPptDetailedOutlineArtifact({
    contract,
    attachCommon,
    authoredOutline,
    generationRuntime,
    lifecycleStage: lifecycleStageForRoute(contract, 'detailed_outline') || 'story_architecture',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
  });
}

async function buildSlideBlueprintRoutePayload({ contract, deliverablePaths, adapter }) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const outlineArtifact = readStageArtifact(contract, deliverablePaths, 'detailed_outline');
  const { authoredBlueprint, generationRuntime } = await generateBlueprintDraft(
    contract,
    storylineArtifact,
    outlineArtifact,
    adapter,
  );
  return buildPptSlideBlueprintArtifact({
    contract,
    attachCommon,
    authoredBlueprint,
    generationRuntime,
    lifecycleStage: lifecycleStageForRoute(contract, 'slide_blueprint') || 'story_architecture',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
    canvas: CANVAS,
    bannedRenderTokens: BANNED_RENDER_TOKENS,
  });
}

async function buildVisualDirectionRoutePayload({
  contract,
  deliverablePaths,
  mode,
  baselineDeliverableId,
  adapter,
}) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const outlineArtifact = readStageArtifact(contract, deliverablePaths, 'detailed_outline');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const { authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
    contract,
    storylineArtifact,
    outlineArtifact,
    blueprintArtifact,
    mode,
    baselineDeliverableId,
    adapter,
  );
  return buildPptVisualDirectionArtifact({
    contract,
    blueprintArtifact,
    authoredVisualDirection,
    attachCommon,
    generationRuntime,
    lifecycleStage: lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
    baselineDeliverableId,
    mode,
    sharedSourceConfidence: sharedSourceConfidence(contract),
  });
}

async function buildRenderRoutePayload({
  workspaceRoot,
  deliverableId,
  contract,
  deliverablePaths,
  route,
  adapter,
}) {
  return buildRenderHtmlArtifact({
    workspaceRoot,
    deliverableId,
    contract,
    deliverablePaths,
    ...(route ? { route } : {}),
    adapter,
  });
}

const PPT_ROUTE_PAYLOAD_BUILDERS = Object.freeze({
  storyline: ({ contract, adapter }) => buildStoryline(contract, adapter),
  detailed_outline: buildDetailedOutlineRoutePayload,
  slide_blueprint: buildSlideBlueprintRoutePayload,
  visual_direction: buildVisualDirectionRoutePayload,
  render_html: buildRenderRoutePayload,
  author_image_pages: ({ deliverableId, contract, deliverablePaths, route, adapter }) => (
    buildImagePagesArtifact({ deliverableId, contract, deliverablePaths, route, adapter })
  ),
  author_pptx_native: ({ deliverableId, contract, deliverablePaths, route, adapter }) => (
    buildNativePptArtifact({ deliverableId, contract, deliverablePaths, route, adapter })
  ),
  fix_html: (context) => buildRenderRoutePayload({ ...context, route: PAGE_FIX_ROUTE }),
  repair_pptx_native: ({ deliverableId, contract, deliverablePaths, route, adapter }) => (
    buildNativePptArtifact({ deliverableId, contract, deliverablePaths, route, adapter })
  ),
  repair_image_pages: ({ deliverableId, contract, deliverablePaths, route, adapter }) => (
    buildImagePagesArtifact({ deliverableId, contract, deliverablePaths, route, adapter })
  ),
  visual_director_review: ({ contract, deliverablePaths, adapter }) => (
    buildDirectorReview(contract, deliverablePaths, adapter)
  ),
  screenshot_review: ({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    mode,
    baselineDeliverableId,
    adapter,
  }) => buildScreenshotReviewArtifact({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    mode,
    baselineDeliverableId,
    adapter,
  }),
  export_pptx: ({ workspaceRoot, topicId, deliverableId, contract, adapter }) => (
    buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract, adapter })
  ),
});

async function buildRoutePayload(context) {
  const buildPayload = PPT_ROUTE_PAYLOAD_BUILDERS[context.route];
  if (!buildPayload) {
    throw new Error(`Unsupported ppt_deck route: ${context.route}`);
  }
  return buildPayload(context);
}

function isZeroArtifactHardFailure(error) {
  if (error?.requiresHumanConfirmation === true || error?.requiresExternalSecret === true) return true;
  if (['EACCES', 'EPERM', 'ENOENT'].includes(String(error?.code || ''))) return true;
  const artifactRefs = safeArray(error?.artifact_refs).filter(Boolean);
  const rawOutput = String(error?.raw_stage_output || error?.artifact?.raw_stage_output || '').trim();
  return error?.failure_kind === 'codex_cli_execution_blocked'
    && artifactRefs.length === 0
    && !rawOutput
    && !error?.artifact;
}

function degradedRouteArtifact({ route, error, prerequisiteProjection }) {
  const rawOutput = String(error?.raw_stage_output || error?.artifact?.raw_stage_output || '').trim();
  const findings = [
    ...safeArray(prerequisiteProjection?.findings),
    ...safeArray(error?.artifact?.normalization_findings),
    String(error?.message || error || 'stage_output_requires_normalization'),
  ].map((entry) => String(entry).trim()).filter(Boolean);
  return {
    ...(error?.artifact && typeof error.artifact === 'object' ? error.artifact : {}),
    status: 'completed_with_quality_debt',
    route,
    raw_stage_output: rawOutput || null,
    stage_attempt_diagnostic: {
      error_name: String(error?.name || 'Error'),
      error_message: String(error?.message || error),
      failure_kind: String(error?.failure_kind || 'normalization_or_materialization_quality_debt'),
    },
    artifact_refs: [...new Set(safeArray(error?.artifact_refs).filter(Boolean))],
    normalization_findings: [...new Set(findings)],
    progress_first: {
      transition_rule: 'any_readable_stage_artifact_advances',
      artifact_available: true,
      advance_allowed: true,
      next_stage_may_start: true,
      route_back_selection_owner: 'codex_cli',
      route_back_may_target_any_declared_stage: true,
    },
    quality_debt: {
      status: 'recorded_non_blocking',
      reasons: [...new Set(findings)],
      blocks_stage_transition: false,
      blocks_visual_ready_claim: true,
      blocks_export_ready_claim: true,
    },
  };
}

/**
 * @param {{
 *   workspaceRoot: string,
 *   topicId: string,
 *   deliverableId: string,
 *   route: string,
 *   contract: { deliverable_kind?: string, profile_id?: string, stage_sequence?: { stages?: Array<{ stage_id?: string }> } },
 *   mode?: string,
 *   baselineDeliverableId?: string,
 * }} input
 * @returns {Promise<PptRouteArtifact>}
 */
export async function runPptDeckRoute({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
  contract,
  mode = 'draft_new',
  baselineDeliverableId = '',
  adapter = CODEX_DEFAULT_ADAPTER,
}) {
  const prerequisiteProjection = ensurePrerequisites({
    workspaceRoot,
    topicId,
    deliverableId,
    route,
    mode,
    baselineDeliverableId,
  });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const stageContract = [
    ...safeArray(contract.stage_sequence?.stages),
    ...safeArray(contract.stage_sequence?.alternate_stages),
  ].find((stage) => stage?.stage_id === route) || null;
  let payload;
  try {
    payload = await buildRoutePayload({
      workspaceRoot,
      topicId,
      deliverableId,
      route,
      contract,
      mode,
      baselineDeliverableId,
      adapter,
      deliverablePaths,
    });
  } catch (error) {
    if (isZeroArtifactHardFailure(error)) throw error;
    payload = degradedRouteArtifact({ route, error, prerequisiteProjection });
  }
  if (safeArray(prerequisiteProjection?.findings).length > 0) {
    payload = {
      ...payload,
      status: 'completed_with_quality_debt',
      quality_debt: {
        ...(payload?.quality_debt || {}),
        status: 'recorded_non_blocking',
        reasons: [...new Set([
          ...safeArray(payload?.quality_debt?.reasons),
          ...safeArray(prerequisiteProjection.findings),
        ])],
        blocks_stage_transition: false,
        blocks_visual_ready_claim: true,
        blocks_export_ready_claim: true,
      },
      route_back_selection_owner: 'codex_cli',
      next_stage_may_start: true,
    };
  }
  payload = attachRouteReviewReset(payload, route);
  payload = appendArtifactRefs(
    payload,
    syncPptCanonicalSurface({ workspaceRoot, topicId, contract, deliverableId, route, payload }),
  );
  const sourceTruthConsumptionRole = ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE[route] || '';
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...(sourceTruthConsumptionRole
      ? {
          source_truth_consumption: buildSourceTruthConsumptionSummary(contract.shared_source_truth, {
            consumptionRole: sourceTruthConsumptionRole,
            defaultSourceLabels: sharedSourceLabels(contract),
          }),
        }
      : {}),
    ...payload,
  };
}
