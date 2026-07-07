import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { createImagePageGenerationParts } from './image-pages/image-generation.js';
import { createImagePagePromptStyleParts } from './image-pages/prompt-style-policy.js';
import { createImagePageRepairSourceParts } from './image-pages/repair-source.js';

import { buildReviewExportCloseout } from './review-export-closeout.js';

type JsonRecord = Record<string, any>;
type ImagePageRoute = 'author_image_pages' | 'repair_image_pages';

interface ImagePageDeps {
  CANVAS: { width: number; height: number; ratio?: string };
  CODEX_DEFAULT_ADAPTER: string;
  CREATIVE_MATERIALIZED_FROM: string;
  attachCommon(route: string, contract: JsonRecord, generationRuntime: JsonRecord | null, adapter: string): JsonRecord;
  collectSlidesNeedingTargetedRevision(slides: JsonRecord[]): JsonRecord[];
  creativeExecution(route: string, generationRuntime: JsonRecord | null, adapter: string): JsonRecord;
  creativeSourceStamp(input: JsonRecord): JsonRecord;
  ensureDir(dir: string): string;
  readStageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): JsonRecord | null;
  resolvePromptPackAsset?(assetPath: string): string;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  stageArtifactPath(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): string;
  writeJson(file: string, data: unknown): void;
}

const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1536x864';
const DEFAULT_STYLE_PROFILE_ASSET = 'prompts/ppt_deck/image-first-default-style-profile.json';
const DEFAULT_PROMPT_TEMPLATE_ASSET = 'prompts/ppt_deck/image_first_prompt_template.md';
const QUALITY_NON_REGRESSION_CONTRACT = 'contracts/runtime-program/ppt-image-first-quality-nonregression.json';
const REFERENCE_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export function createPptDeckImagePageStageParts(deps: ImagePageDeps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    attachCommon,
    collectSlidesNeedingTargetedRevision,
    creativeExecution,
    creativeSourceStamp,
    ensureDir,
    readStageArtifact,
    resolvePromptPackAsset,
    safeArray,
    safeText,
    stageArtifactPath,
    writeJson,
  } = deps;

  const {
    callImageGeneration,
    normalizeImageBase64,
    pngDimensions,
    responseImageCall,
    sha256,
    stableJson,
  } = createImagePageGenerationParts({
    CANVAS,
    DEFAULT_IMAGE_MODEL,
    safeArray,
    safeText,
  });
  const {
    audienceLanguagePolicy,
    copyStyleReferences,
    defaultPromptTemplate,
    defaultStyleProfile,
    imageFactGovernance,
    imagePagePaths,
    layoutLegibilityPolicy,
    longDeckProductionContract,
    normalizeImageGenerationToolOptions,
    resolveImageGenerationConfig,
    slidePrompt,
    verifiedAssetOverlayPolicy,
  } = createImagePagePromptStyleParts({
    DEFAULT_IMAGE_MODEL,
    DEFAULT_IMAGE_SIZE,
    DEFAULT_PROMPT_TEMPLATE_ASSET,
    DEFAULT_STYLE_PROFILE_ASSET,
    REFERENCE_IMAGE_EXTENSIONS,
    ensureDir,
    pngDimensions,
    resolvePromptPackAsset,
    safeArray,
    safeText,
    sha256,
    stableJson,
  });
  const {
    imageSlidesById,
    priorImagePageArtifact,
    repairFeedbackFromReview,
    repairReviewSource,
  } = createImagePageRepairSourceParts({
    collectSlidesNeedingTargetedRevision,
    readStageArtifact,
    safeArray,
    safeText,
  });

  async function buildImagePagesArtifact({
    deliverableId,
    contract,
    deliverablePaths,
    route = 'author_image_pages',
    adapter = CODEX_DEFAULT_ADAPTER,
  }: {
    deliverableId: string;
    contract: JsonRecord;
    deliverablePaths: JsonRecord;
    route?: ImagePageRoute;
    adapter?: string;
  }) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const repairReview = route === 'repair_image_pages'
      ? repairReviewSource(contract, deliverablePaths)
      : null;
    const reviewArtifact = repairReview?.artifact || null;
    const repairSourceReviewStage = repairReview?.stageId || 'screenshot_review';
    const priorArtifact = route === 'repair_image_pages' ? priorImagePageArtifact(contract, deliverablePaths) : null;
    const priorSlides = imageSlidesById(priorArtifact);
    const repairFeedback = route === 'repair_image_pages' ? repairFeedbackFromReview(reviewArtifact) : [];
    const repairFeedbackById = new Map(repairFeedback.map((item) => [safeText(item?.slide_id), item]));
    const allSlides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
    const targetSlideIds = route === 'repair_image_pages'
      ? [...new Set(repairFeedback.map((item) => safeText(item?.slide_id)).filter(Boolean))]
      : allSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const targetSet = new Set(targetSlideIds);
    const paths = imagePagePaths(deliverablePaths, deliverableId, route);
    const config = resolveImageGenerationConfig(route);
    const toolOptions = normalizeImageGenerationToolOptions(contract);
    const styleProfile = defaultStyleProfile();
    const promptTemplate = defaultPromptTemplate();
    const styleReferences = copyStyleReferences(contract, paths);
    const factGovernance = imageFactGovernance(contract);
    const verifiedAssetPolicy = verifiedAssetOverlayPolicy(contract);
    const longDeckContract = longDeckProductionContract(contract);
    const audiencePolicy = audienceLanguagePolicy(contract);
    const layoutLegibility = layoutLegibilityPolicy(contract);
    const deckStyleManifest = {
      kind: 'ppt_image_first_style_manifest',
      route,
      source_visual_route: route,
      default_style_profile_file: styleProfile.profile_file,
      default_style_profile_hash: styleProfile.profile_hash,
      prompt_template_file: promptTemplate.file,
      prompt_template_hash: promptTemplate.hash,
      style_reference: styleReferences,
      style_profile: styleProfile.profile,
      audience_language_policy: audiencePolicy,
      layout_legibility_policy: layoutLegibility,
      generated_at: new Date().toISOString(),
    };
    const promptEntries: JsonRecord[] = [];
    const generationMetadata: JsonRecord[] = [];
    const manifestSlides: JsonRecord[] = [];
    for (const slide of allSlides) {
      const slideId = safeText(slide?.slide_id);
      if (!slideId) continue;
      const priorSlide = priorSlides.get(slideId);
      if (route === 'repair_image_pages' && !targetSet.has(slideId) && priorSlide) {
        manifestSlides.push({
          ...priorSlide,
          source_route: safeText(priorSlide?.source_route, 'author_image_pages'),
          preserved: true,
          preserved_from_image_file: safeText(priorSlide?.image_file || priorSlide?.png_file),
          preserved_slide_hash: safeText(priorSlide?.hash),
        });
        continue;
      }
      if (route === 'repair_image_pages' && !targetSet.has(slideId)) {
        throw new Error(`repair_image_pages requires prior image page for preserved slide: ${slideId}`);
      }
      const prompt = slidePrompt({
        route,
        slide,
        visualDirection: visualArtifact?.visual_direction || {},
        styleManifest: deckStyleManifest,
        promptTemplate: promptTemplate.text,
        factGovernance,
        verifiedAssetPolicy,
        longDeckContract,
        audiencePolicy,
        layoutLegibility,
        repairFeedback: repairFeedbackById.get(slideId) || null,
      });
      const promptHash = sha256(prompt);
      const imageFile = path.join(paths.pageDir, `${slideId}.png`);
      const promptFile = path.join(paths.promptDir, `${slideId}.prompt.txt`);
      const promptManifestFile = path.join(paths.promptDir, `${slideId}.prompt.json`);
      const styleManifestFile = path.join(paths.styleDir, `${slideId}.style.json`);
      const response = await callImageGeneration({
        config,
        prompt,
        toolOptions,
        route,
        slideId,
        imageFile,
      });
      const imageCall = responseImageCall(response);
      const imageBase64 = normalizeImageBase64(response);
      if (!imageBase64) throw new Error(`Codex native imagegen did not return PNG data for ${slideId}`);
      const imageBytes = Buffer.from(imageBase64, 'base64');
      writeFileSync(imageFile, imageBytes);
      const imageHash = sha256(imageBytes);
      const dimensions = pngDimensions(imageBytes);
      writeFileSync(promptFile, prompt, 'utf-8');
      const promptManifest = {
        kind: 'ppt_image_page_prompt_manifest',
        route,
        slide_id: slideId,
        prompt_file: promptFile,
        prompt_hash: promptHash,
        prompt_template_file: promptTemplate.file,
        prompt_template_hash: promptTemplate.hash,
        source_blueprint: {
          slide_id: slideId,
          title: safeText(slide?.title),
          layout_family: safeText(slide?.layout_family),
        },
        fact_governance: factGovernance,
        verified_asset_policy: verifiedAssetPolicy,
        long_deck_contract: longDeckContract,
        audience_language_policy: audiencePolicy,
        layout_legibility_policy: layoutLegibility,
        forbidden_generated_artifacts: safeArray(factGovernance?.forbidden_generated_artifacts)
          .map((item) => safeText(item))
          .filter(Boolean),
        generated_at: new Date().toISOString(),
      };
      const slideStyleManifest = {
        ...deckStyleManifest,
        slide_id: slideId,
        title: safeText(slide?.title),
      };
      writeJson(promptManifestFile, promptManifest);
      writeJson(styleManifestFile, slideStyleManifest);
      const metadata = {
        provider: safeText(config.provider),
        base_url_host: safeText(config.base_url_host),
        endpoint: safeText(config.endpoint),
        request_model: safeText(config.model),
        default_image_model: safeText(config.model, DEFAULT_IMAGE_MODEL),
        image_generation_tool_options: toolOptions,
        response_id: safeText(response?.id),
        image_call_id: safeText(imageCall?.id),
        codex_native_imagegen_runtime: response?.codex_native_imagegen_runtime || null,
        revised_prompt: safeText(imageCall?.revised_prompt, prompt),
        prompt_hash: promptHash,
        image_sha256: imageHash,
        image_file: imageFile,
        style_reference_hash: sha256(stableJson(styleReferences)),
        style_manifest_file: styleManifestFile,
        prompt_manifest_file: promptManifestFile,
        dimensions,
        generated_at: new Date().toISOString(),
      };
      generationMetadata.push(metadata);
      promptEntries.push({
        slide_id: slideId,
        prompt_file: promptFile,
        prompt_manifest_file: promptManifestFile,
        style_manifest_file: styleManifestFile,
        prompt_hash: promptHash,
      });
      manifestSlides.push({
        slide_id: slideId,
        title: safeText(slide?.title),
        image_file: imageFile,
        png_file: imageFile,
        prompt_manifest_file: promptManifestFile,
        style_manifest_file: styleManifestFile,
        dimensions: { ...dimensions, ratio: safeText(CANVAS.ratio, '16:9') },
        hash: imageHash,
        sha256: imageHash,
        source: {
          slide_id: slideId,
          title: safeText(slide?.title),
          prompt_file: promptFile,
          prompt_manifest: paths.promptManifestFile,
        },
        generated: true,
        preserved: false,
        source_route: route,
      });
    }
    const preservedSlideHashes = manifestSlides
      .filter((slide) => slide.preserved)
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        preserved_slide_hash: safeText(slide?.preserved_slide_hash || slide?.hash),
        image_file: safeText(slide?.image_file || slide?.png_file),
      }));
    const freshlyRenderedSlideIds = manifestSlides
      .filter((slide) => !slide.preserved)
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    const bundlePages = manifestSlides.map((slide) => ({
      ...slide,
      png_file: safeText(slide?.png_file || slide?.image_file),
      image_file: safeText(slide?.image_file || slide?.png_file),
      prompt_manifest_file: safeText(slide?.prompt_manifest_file),
      style_manifest_file: safeText(slide?.style_manifest_file),
      hash: safeText(slide?.hash || slide?.sha256),
      sha256: safeText(slide?.sha256 || slide?.hash),
    }));
    const imagePagesBundle = {
      kind: 'ppt_image_pages_bundle',
      source_visual_route: route,
      editable: false,
      route,
      page_count: bundlePages.length,
      dimensions: { width: CANVAS.width, height: CANVAS.height, ratio: safeText(CANVAS.ratio, '16:9') },
      pages: bundlePages,
      png_refs: bundlePages.map((slide) => safeText(slide?.png_file)).filter(Boolean),
      prompt_manifest_file: paths.promptManifestFile,
      style_manifest_file: paths.styleManifestFile,
      generation_metadata_file: paths.metadataFile,
      preserved_slide_hashes: preservedSlideHashes,
    };
    const manifest = {
      kind: 'ppt_image_page_manifest',
      route,
      source_visual_route: route,
      editable: false,
      page_count: bundlePages.length,
      dimensions: { width: CANVAS.width, height: CANVAS.height, ratio: safeText(CANVAS.ratio, '16:9') },
      slides: bundlePages,
      prompt_manifest: paths.promptManifestFile,
      style_manifest: paths.styleManifestFile,
      generation_metadata_file: paths.metadataFile,
      preserved_slide_hashes: preservedSlideHashes,
    };
    writeJson(paths.promptManifestFile, {
      kind: 'ppt_image_page_prompt_manifest',
      route,
      fact_governance: factGovernance,
      verified_asset_policy: verifiedAssetPolicy,
      long_deck_contract: longDeckContract,
      audience_language_policy: audiencePolicy,
      layout_legibility_policy: layoutLegibility,
      forbidden_generated_artifacts: safeArray(factGovernance?.forbidden_generated_artifacts)
        .map((item) => safeText(item))
        .filter(Boolean),
      prompts: promptEntries,
    });
    writeJson(paths.styleManifestFile, deckStyleManifest);
    writeJson(paths.metadataFile, { kind: 'ppt_image_generation_metadata', route, calls: generationMetadata });
    writeJson(paths.manifestFile, manifest);
    const qualityNonRegressionReadModel = {
      surface_kind: 'ppt_image_first_quality_nonregression_read_model',
      contract_ref: QUALITY_NON_REGRESSION_CONTRACT,
      route,
      refs_only: true,
      read_only: true,
      agent_lab_suite_input: {
        suite_kind: 'standard',
        suite_id: 'redcube-ai.ppt-image-first-quality-nonregression.standard.v1',
        input_mode: 'refs_only_handoff',
        score_is_rca_visual_verdict: false,
        claims_visual_ready: false,
        claims_exportable: false,
        claims_handoffable: false,
      },
      quality_gate_refs: {
        visual_director_review: 'workspace-runtime-ref:visual_director_review:<run-id>',
        screenshot_review: 'workspace-runtime-ref:screenshot_review:<run-id>',
        export_pptx: 'workspace-runtime-ref:export-result:<run-id>',
        fact_governance: `${QUALITY_NON_REGRESSION_CONTRACT}#/fact_governance_policy`,
        verified_asset_policy: `${QUALITY_NON_REGRESSION_CONTRACT}#/verified_asset_policy`,
        audience_language_policy: `${QUALITY_NON_REGRESSION_CONTRACT}#/audience_language_policy`,
        layout_legibility_policy: `${QUALITY_NON_REGRESSION_CONTRACT}#/layout_legibility_policy`,
      },
      repair_scope: route === 'repair_image_pages'
        ? {
            policy: 'blocked_slide_ids_only',
            source_review_stage: repairSourceReviewStage,
            blocked_slide_ids: targetSlideIds,
            freshly_rendered_slide_ids: freshlyRenderedSlideIds,
            preserved_slide_hashes: preservedSlideHashes,
            repair_may_touch_unblocked_pages: false,
          }
        : {
            policy: 'full_initial_authoring',
            source_review_stage: null,
            blocked_slide_ids: [],
            freshly_rendered_slide_ids: freshlyRenderedSlideIds,
            preserved_slide_hashes: [],
            repair_may_touch_unblocked_pages: false,
          },
      export_pptx_policy: {
        full_slide_image_pages_required: true,
        editable_shapes_claim_allowed: false,
        non_editable_full_slide_image_policy: true,
      },
      forbidden_authority_flags: {
        no_forbidden_write: true,
        opl_agent_lab_can_write_rca_visual_truth: false,
        opl_agent_lab_can_write_artifact_blob: false,
        opl_agent_lab_can_write_memory_body: false,
        opl_agent_lab_can_write_owner_receipt: false,
        opl_agent_lab_can_authorize_quality_verdict: false,
        opl_agent_lab_can_authorize_exportable: false,
        opl_agent_lab_can_claim_visual_ready: false,
        opl_agent_lab_can_switch_default_executor: false,
        opl_agent_lab_can_lower_visual_director_review: false,
        opl_agent_lab_can_lower_screenshot_review: false,
        opl_agent_lab_can_lower_export_pptx: false,
      },
    };
    const artifactRefs = [
      paths.manifestFile,
      paths.promptManifestFile,
      paths.styleManifestFile,
      paths.metadataFile,
      ...bundlePages.map((slide) => safeText(slide?.png_file)).filter(Boolean),
      ...promptEntries.map((entry) => safeText(entry?.prompt_file)).filter(Boolean),
      ...promptEntries.map((entry) => safeText(entry?.prompt_manifest_file)).filter(Boolean),
      ...promptEntries.map((entry) => safeText(entry?.style_manifest_file)).filter(Boolean),
    ];
    const closeout = route === 'repair_image_pages'
      ? buildReviewExportCloseout({
          family: 'ppt_deck',
          route,
          deliverableId,
          status: 'completed',
          reviewExportRefs: [
            ...safeArray(reviewArtifact?.review_export_refs),
            ...safeArray(reviewArtifact?.typed_blocker_refs),
            ...safeArray(reviewArtifact?.owner_receipt_refs),
          ],
          artifactRefs,
        })
      : {};
    return {
      ...attachCommon(route, contract, null, adapter),
      ...closeout,
      status: 'completed',
      creative_execution: {
        ...creativeExecution(route, null, adapter),
        overlay: 'image_page_authoring',
      },
      image_generation_runtime: {
        provider: safeText(config.provider),
        base_url_host: safeText(config.base_url_host),
        endpoint: safeText(config.endpoint),
        request_model: safeText(config.model),
        tool_options: toolOptions,
        token_persisted: false,
        provider_token_required: false,
        provider_token_source: process.env.REDCUBE_IMAGE_GENERATION_MOCK === '1'
          ? 'mock'
          : 'codex_executor_native_tool',
      },
      image_pages_bundle: imagePagesBundle,
      image_page_manifest: manifest,
      image_generation_calls: generationMetadata,
      quality_non_regression_read_model: qualityNonRegressionReadModel,
      repair_image_pages: route === 'repair_image_pages'
        ? {
            source_review_stage: repairSourceReviewStage,
            blocked_slide_ids: targetSlideIds,
            preserved_slide_hashes: preservedSlideHashes,
          }
        : null,
      creative_sources: {
        image_pages: creativeSourceStamp({
          route,
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'png_image_pages',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
          generationRuntime: null,
          adapter,
        }),
      },
      artifact_refs: artifactRefs,
      review_state_patch: {
        current_status: 'draft',
        ready_for_export: false,
        latest_review_stage: route,
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
    };
  }

  return {
    buildImagePagesArtifact,
  };
}
