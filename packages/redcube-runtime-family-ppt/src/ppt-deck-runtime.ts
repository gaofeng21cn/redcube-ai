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

export function canRunPptDeck(contract) {
  return contract?.deliverable_kind === 'ppt_deck';
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
  executor = null,
  executionShape = executor?.execution_shape,
  hermesProfile = executor?.hermes_profile || null,
  executorRouting = executor?.executor_routing || null,
}) {
  ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const stageContract = [
    ...safeArray(contract.stage_sequence?.stages),
    ...safeArray(contract.stage_sequence?.alternate_stages),
  ].find((stage) => stage?.stage_id === route) || null;
  let payload;
  switch (route) {
    case 'storyline':
      payload = await buildStoryline(contract, adapter);
      break;
    case 'detailed_outline': {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const { authoredOutline, generationRuntime } = await generateOutlineDraft(contract, storylineArtifact, adapter);
      payload = buildPptDetailedOutlineArtifact({
        contract,
        attachCommon,
        authoredOutline,
        generationRuntime,
        lifecycleStage: lifecycleStageForRoute(contract, 'detailed_outline') || 'story_architecture',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
      });
      break;
    }
    case 'slide_blueprint': {
      const outlineArtifact = readStageArtifact(contract, deliverablePaths, 'detailed_outline');
      const { authoredBlueprint, generationRuntime } = await generateBlueprintDraft(contract, outlineArtifact, adapter);
      payload = buildPptSlideBlueprintArtifact({
        contract,
        attachCommon,
        authoredBlueprint,
        generationRuntime,
        lifecycleStage: lifecycleStageForRoute(contract, 'slide_blueprint') || 'story_architecture',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        canvas: CANVAS,
        bannedRenderTokens: BANNED_RENDER_TOKENS,
      });
      break;
    }
    case 'visual_direction': {
      const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
      const { authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
        contract,
        blueprintArtifact,
        mode,
        baselineDeliverableId,
        adapter,
      );
      payload = buildPptVisualDirectionArtifact({
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
      break;
    }
    case 'render_html':
      payload = await buildRenderHtmlArtifact({
        workspaceRoot,
        deliverableId,
        contract,
        deliverablePaths,
        adapter,
        executionShape,
        hermesProfile,
        executorRouting,
      });
      break;
    case 'author_image_pages':
      payload = await buildImagePagesArtifact({ deliverableId, contract, deliverablePaths, route, adapter });
      break;
    case 'author_pptx_native':
      payload = await buildNativePptArtifact({ deliverableId, contract, deliverablePaths, route, adapter });
      break;
    case 'fix_html':
      payload = await buildRenderHtmlArtifact({
        workspaceRoot,
        deliverableId,
        contract,
        deliverablePaths,
        route: PAGE_FIX_ROUTE,
        adapter,
        executionShape,
        hermesProfile,
        executorRouting,
      });
      break;
    case 'repair_pptx_native':
      payload = await buildNativePptArtifact({ deliverableId, contract, deliverablePaths, route, adapter });
      break;
    case 'repair_image_pages':
      payload = await buildImagePagesArtifact({ deliverableId, contract, deliverablePaths, route, adapter });
      break;
    case 'visual_director_review':
      payload = await buildDirectorReview(contract, deliverablePaths, adapter);
      break;
    case 'screenshot_review':
      payload = await buildScreenshotReviewArtifact({
        workspaceRoot,
        topicId,
        deliverableId,
        contract,
        mode,
        baselineDeliverableId,
        adapter,
      });
      break;
    case 'export_pptx':
      payload = buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract, adapter });
      break;
    default:
      throw new Error(`Unsupported ppt_deck route: ${route}`);
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
