// @ts-nocheck
import path from 'node:path';
import { writeFileSync } from 'node:fs';

import { createXiaohongshuImagePageRuntimeHelpers } from './image-page-runtime-helpers.js';

export function createXiaohongshuImagePageParts(deps) {
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
    safeArray,
    safeText,
    writeJson,
  } = deps;
  const {
    DEFAULT_IMAGE_MODEL,
    callImageGeneration,
    copyStyleReferences,
    defaultPromptTemplate,
    defaultStyleProfile,
    imageGenerationToolOptions,
    imagePagePaths,
    normalizeImageBase64,
    pngDimensions,
    responseImageCall,
    imageGenerationConfig,
    sha256,
    stableJson,
    styleReferenceFileCount,
  } = createXiaohongshuImagePageRuntimeHelpers({
    CANVAS,
    ensureDir,
    safeText,
  });

  function repairFeedbackFromReview(reviewArtifact) {
    const explicitBlockedSlideIds = new Set(
      safeArray(reviewArtifact?.blocked_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    );
    const slideReviews = safeArray(reviewArtifact?.slide_reviews);
    const feedbackSlides = explicitBlockedSlideIds.size > 0
      ? slideReviews.filter((slide) => explicitBlockedSlideIds.has(safeText(slide?.slide_id)))
      : collectSlidesNeedingTargetedRevision(slideReviews);
    return feedbackSlides
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        issues: safeArray(slide?.issues).map((issue) => safeText(issue)).filter(Boolean),
        mechanical_issues: safeArray(slide?.mechanical_issues).map((issue) => safeText(issue)).filter(Boolean),
        visual_findings: safeArray(slide?.ai_review?.visual_findings).map((item) => safeText(item)).filter(Boolean),
        recommended_fix: safeText(slide?.ai_review?.recommended_fix),
      }))
      .filter((slide) => slide.slide_id);
  }

  function priorImagePageArtifact(contract, deliverablePaths) {
    return readStageArtifact(contract, deliverablePaths, 'repair_image_pages')
      || readStageArtifact(contract, deliverablePaths, 'author_image_pages');
  }

  function imageSlidesById(artifact) {
    const slides = safeArray(artifact?.image_pages_bundle?.pages || artifact?.image_page_manifest?.slides)
      .map((slide) => ({
        ...slide,
        image_file: safeText(slide?.image_file || slide?.png_file),
        png_file: safeText(slide?.png_file || slide?.image_file),
        hash: safeText(slide?.hash || slide?.sha256),
      }));
    return new Map(slides.map((slide) => [safeText(slide?.slide_id), slide]));
  }

  function normalizePlanSlides(planArtifact) {
    return safeArray(planArtifact?.single_note_plan?.slides).map((slide, index) => ({
      ...slide,
      slide_id: safeText(slide?.slide_id, `N${String(index + 1).padStart(2, '0')}`),
      title: safeText(slide?.title, `第 ${index + 1} 页`),
      page_goal: safeText(slide?.page_goal),
      layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'note_page'),
      page_core_content: safeArray(slide?.page_core_content).map((item) => safeText(item)).filter(Boolean),
      evidence_and_sources: safeArray(slide?.evidence_and_sources).map((item) => safeText(item)).filter(Boolean),
      progression_role: safeText(slide?.progression_role),
      source_language: safeText(slide?.source_language),
    }));
  }

  function pagePrompt({ route, slide, visualDirection, styleManifest, promptTemplate, repairFeedback }) {
    return [
      promptTemplate || 'Create one complete 3:4 Xiaohongshu note page image in Chinese.',
      'Hard requirement: output one complete 3:4 Xiaohongshu note page PNG, not loose elements, not HTML, not a screenshot collage.',
      `Route: ${route}.`,
      `Page ID: ${slide.slide_id}.`,
      `Exact title: ${slide.title}.`,
      `Page goal: ${slide.page_goal}.`,
      `Layout family: ${slide.layout_family}.`,
      `Allowed page facts: ${stableJson(slide.page_core_content || []).slice(0, 1800)}.`,
      `Evidence/source language: ${stableJson(slide.evidence_and_sources || slide.source_language || []).slice(0, 1000)}.`,
      `Narrative role: ${slide.progression_role}.`,
      `Visual direction: ${stableJson(visualDirection).slice(0, 3000)}.`,
      `Style system: ${stableJson(styleManifest).slice(0, 2400)}.`,
      repairFeedback ? `Repair feedback: ${stableJson(repairFeedback).slice(0, 1200)}.` : '',
      'Production quality: medical/science information pages should be medium-density and mobile-readable, with one core judgement, three short modules, and one boundary note when applicable.',
      'Layout quality: non-cover pages need substantive lower-half information; vary adjacent page visual actions and module placement.',
      'Reference images are style anchors only; do not copy their facts, logos, page numbers, QR codes, institutions, or disease objects.',
      'No UI chrome, no internal metadata, no prompt labels. Use safe margins and readable Chinese text.',
    ].filter(Boolean).join('\n');
  }

  async function buildImagePagesArtifact({
    deliverableId,
    contract,
    deliverablePaths,
    route = 'author_image_pages',
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const planArtifact = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const reviewArtifact = route === 'repair_image_pages'
      ? readStageArtifact(contract, deliverablePaths, 'screenshot_review')
      : null;
    const priorArtifact = route === 'repair_image_pages' ? priorImagePageArtifact(contract, deliverablePaths) : null;
    const priorSlides = imageSlidesById(priorArtifact);
    const repairFeedback = route === 'repair_image_pages' ? repairFeedbackFromReview(reviewArtifact) : [];
    const repairFeedbackById = new Map(repairFeedback.map((item) => [safeText(item?.slide_id), item]));
    const allSlides = normalizePlanSlides(planArtifact);
    const targetSlideIds = route === 'repair_image_pages'
      ? [...new Set(repairFeedback.map((item) => safeText(item?.slide_id)).filter(Boolean))]
      : allSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const targetSet = new Set(targetSlideIds);
    const paths = imagePagePaths(deliverablePaths, deliverableId, route);
    const config = imageGenerationConfig();
    const toolOptions = imageGenerationToolOptions(contract);
    const styleProfile = defaultStyleProfile(contract);
    const promptTemplate = defaultPromptTemplate();
    const styleReferences = copyStyleReferences(contract, paths);
    const productionQualityPolicy = {
      source_visual_reference_sample: [
        'AI小红书笔记/output/男性备孕科普系列',
        'AI小红书笔记/output/女性备孕科普系列',
        'AI小红书笔记/output/备孕科普系列',
        'AI小红书笔记/output/急腹症科普系列',
        'AI小红书笔记/output/胸痛科普系列',
        'AI小红书笔记/output/用 Codex 全自动做小红书图文笔记',
      ],
      density_standard: 'medium_density_mobile_readable',
      default_information_page_structure: {
        core_judgement_count: 1,
        main_module_count: 3,
        boundary_note_required_when_medical_or_action_risk: true,
        main_module_length_cn_chars_preferred: '8-14',
        main_module_length_cn_chars_max: 18,
        page_total_cn_chars_preferred: '45-70',
        complex_mechanism_page_max_modules: 4,
      },
      layout_quality_gates: {
        unique_layout_count_min: 3,
        max_consecutive_same_layout: 3,
        bottom_half_substantive_module_required: true,
        decoration_only_lower_half_blocks_publication: true,
      },
      forbidden_completion_shortcuts: [
        'keyword_only_low_density_safe_draft',
        'tiny_dense_card_paragraphs',
        'delete_medical_boundary_to_reduce_typo_risk',
        'deterministic_image_patch_for_model_text_or_fact_errors',
      ],
    };
    const deliveryQualityPolicy = {
      final_png_size: `${CANVAS.width}x${CANVAS.height}`,
      clean_final_image_set_required: true,
      source_candidate_separation: 'source candidates, redraw rounds, and operator references must stay in provenance surfaces instead of the final publish image set',
      contact_sheet_or_gallery_review_expected_for_series: true,
      human_review_surfaces: [
        'page prompt manifest',
        'style manifest',
        'generation metadata',
        'page image manifest',
        'visual director review',
        'screenshot review',
        'export bundle',
      ],
    };
    const styleManifest = {
      kind: 'xiaohongshu_image_first_style_manifest',
      route,
      source_visual_route: route,
      default_style_profile_file: styleProfile.profile_file,
      default_style_profile_hash: styleProfile.profile_hash,
      prompt_template_file: promptTemplate.file,
      prompt_template_hash: promptTemplate.hash,
      style_reference: styleReferences,
      style_profile: styleProfile.profile,
      visual_direction_hash: sha256(stableJson(visualArtifact?.visual_direction || {})),
      production_quality_policy: productionQualityPolicy,
      delivery_quality_policy: deliveryQualityPolicy,
      fact_copy_guard: {
        reference_images_style_only: true,
        fact_whitelist_source: 'single_note_plan.page_core_content',
        forbidden_reference_carryover: [
          'author_names',
          'page_numbers',
          'series_names',
          'disease_objects',
          'logos',
          'qr_codes',
          'institutions',
        ],
      },
      generated_at: new Date().toISOString(),
    };
    const promptEntries = [];
    const generationMetadata = [];
    const generationFailures = [];
    const manifestSlides = [];
    for (const slide of allSlides) {
      const slideId = safeText(slide?.slide_id);
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
        generationFailures.push({
          slide_id: slideId,
          error: 'repair_image_pages has no prior image page to preserve',
          failure_kind: 'missing_prior_page_quality_debt',
          occurred_at: new Date().toISOString(),
        });
        continue;
      }
      const prompt = pagePrompt({
        route,
        slide,
        visualDirection: visualArtifact?.visual_direction || {},
        styleManifest,
        promptTemplate: promptTemplate.text,
        repairFeedback: repairFeedbackById.get(slideId) || null,
      });
      const promptHash = sha256(prompt);
      const imageFile = path.join(paths.pageDir, `${slideId}.png`);
      const promptFile = path.join(paths.promptDir, `${slideId}.prompt.txt`);
      const promptManifestFile = path.join(paths.promptDir, `${slideId}.prompt.json`);
      const styleManifestFile = path.join(paths.styleDir, `${slideId}.style.json`);
      writeFileSync(promptFile, prompt, 'utf-8');
      const promptManifest = {
        kind: 'xiaohongshu_image_page_prompt_manifest',
        route,
        slide_id: slideId,
        prompt_file: promptFile,
        prompt_hash: promptHash,
        prompt_template_file: promptTemplate.file,
        prompt_template_hash: promptTemplate.hash,
        source_page_plan: {
          slide_id: slideId,
          title: safeText(slide?.title),
          layout_family: safeText(slide?.layout_family),
          page_goal: safeText(slide?.page_goal),
        },
        generated_at: new Date().toISOString(),
      };
      const slideStyleManifest = { ...styleManifest, slide_id: slideId, title: safeText(slide?.title) };
      writeJson(promptManifestFile, promptManifest);
      writeJson(styleManifestFile, slideStyleManifest);
      promptEntries.push({
        slide_id: slideId,
        prompt_file: promptFile,
        prompt_manifest_file: promptManifestFile,
        style_manifest_file: styleManifestFile,
        prompt_hash: promptHash,
      });
      let response;
      try {
        response = await callImageGeneration({
          config,
          prompt,
          toolOptions,
          route,
          slideId,
          imageFile,
        });
      } catch (error) {
        generationFailures.push({
          slide_id: slideId,
          error: error instanceof Error ? error.message : String(error),
          prompt_file: promptFile,
          prompt_manifest_file: promptManifestFile,
          style_manifest_file: styleManifestFile,
          occurred_at: new Date().toISOString(),
        });
        if (priorSlide) {
          manifestSlides.push({
            ...priorSlide,
            source_route: safeText(priorSlide?.source_route, 'author_image_pages'),
            preserved: true,
            repair_failed_preserved: true,
            preserved_from_image_file: safeText(priorSlide?.image_file || priorSlide?.png_file),
            preserved_slide_hash: safeText(priorSlide?.hash),
          });
        }
        continue;
      }
      const imageCall = responseImageCall(response);
      const imageBase64 = normalizeImageBase64(response);
      if (!imageBase64) {
        generationFailures.push({
          slide_id: slideId,
          error: 'Codex native imagegen did not return PNG data',
          prompt_file: promptFile,
          prompt_manifest_file: promptManifestFile,
          style_manifest_file: styleManifestFile,
          occurred_at: new Date().toISOString(),
        });
        if (priorSlide) manifestSlides.push({ ...priorSlide, preserved: true, repair_failed_preserved: true });
        continue;
      }
      const imageBytes = Buffer.from(imageBase64, 'base64');
      const dimensions = pngDimensions(imageBytes);
      if (!dimensions) {
        generationFailures.push({
          slide_id: slideId,
          error: 'Codex native imagegen output is not a readable PNG',
          prompt_file: promptFile,
          prompt_manifest_file: promptManifestFile,
          style_manifest_file: styleManifestFile,
          occurred_at: new Date().toISOString(),
        });
        if (priorSlide) manifestSlides.push({ ...priorSlide, preserved: true, repair_failed_preserved: true });
        continue;
      }
      writeFileSync(imageFile, imageBytes);
      const imageHash = sha256(imageBytes);
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
        style_reference_mode: safeText(styleReferences?.mode),
        style_reference_image_count: styleReferenceFileCount(styleReferences),
        reference_images_attached_to_request: false,
        style_manifest_file: styleManifestFile,
        prompt_manifest_file: promptManifestFile,
        dimensions,
        generated_at: new Date().toISOString(),
      };
      generationMetadata.push(metadata);
      manifestSlides.push({
        slide_id: slideId,
        title: safeText(slide?.title),
        layout_family: safeText(slide?.layout_family),
        page_goal: safeText(slide?.page_goal),
        image_file: imageFile,
        png_file: imageFile,
        prompt_manifest_file: promptManifestFile,
        style_manifest_file: styleManifestFile,
        dimensions: { ...dimensions, ratio: safeText(CANVAS.ratio, '3:4') },
        hash: imageHash,
        sha256: imageHash,
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
    const bundlePages = manifestSlides.map((slide) => ({
      ...slide,
      png_file: safeText(slide?.png_file || slide?.image_file),
      image_file: safeText(slide?.image_file || slide?.png_file),
      hash: safeText(slide?.hash || slide?.sha256),
      sha256: safeText(slide?.sha256 || slide?.hash),
    }));
    if (bundlePages.length === 0) {
      const error = new Error(`Xiaohongshu image authoring produced no consumable PNG artifacts: ${generationFailures.map((item) => safeText(item?.slide_id)).filter(Boolean).join(', ')}`);
      error.failure_kind = 'missing_consumable_artifact';
      error.hard_stop_kind = 'missing_consumable_artifact';
      error.artifact_refs = promptEntries.flatMap((entry) => [entry.prompt_file, entry.prompt_manifest_file, entry.style_manifest_file]);
      throw error;
    }
    const imagePagesBundle = {
      kind: 'xiaohongshu_image_pages_bundle',
      source_visual_route: route,
      editable: false,
      route,
      page_count: bundlePages.length,
      dimensions: { width: CANVAS.width, height: CANVAS.height, ratio: safeText(CANVAS.ratio, '3:4') },
      pages: bundlePages,
      png_refs: bundlePages.map((slide) => safeText(slide?.png_file)).filter(Boolean),
      prompt_manifest_file: paths.promptManifestFile,
      style_manifest_file: paths.styleManifestFile,
      generation_metadata_file: paths.metadataFile,
      preserved_slide_hashes: preservedSlideHashes,
    };
    const manifest = {
      kind: 'xiaohongshu_image_page_manifest',
      route,
      source_visual_route: route,
      editable: false,
      page_count: bundlePages.length,
      expected_page_count: allSlides.length,
      actual_page_count: bundlePages.length,
      page_count_gate_pass: bundlePages.length === allSlides.length,
      dimensions: { width: CANVAS.width, height: CANVAS.height, ratio: safeText(CANVAS.ratio, '3:4') },
      dimension_gate: {
        expected_width: CANVAS.width,
        expected_height: CANVAS.height,
        checked_page_count: bundlePages.length,
        pass: bundlePages.every((slide) => Number(slide?.dimensions?.width) === CANVAS.width && Number(slide?.dimensions?.height) === CANVAS.height),
        off_size_slide_ids: bundlePages
          .filter((slide) => Number(slide?.dimensions?.width) !== CANVAS.width || Number(slide?.dimensions?.height) !== CANVAS.height)
          .map((slide) => safeText(slide?.slide_id))
          .filter(Boolean),
      },
      final_image_set_policy: {
        clean_final_image_set_required: true,
        source_candidate_separation: 'source candidates and redraw rounds are provenance, not final publish pages',
        contact_sheet_or_gallery_review_expected_for_series: true,
      },
      production_quality_policy: productionQualityPolicy,
      slides: bundlePages,
      prompt_manifest: paths.promptManifestFile,
      style_manifest: paths.styleManifestFile,
      generation_metadata_file: paths.metadataFile,
      preserved_slide_hashes: preservedSlideHashes,
    };
    writeJson(paths.promptManifestFile, { kind: 'xiaohongshu_image_page_prompt_manifest', route, prompts: promptEntries });
    writeJson(paths.styleManifestFile, styleManifest);
    writeJson(paths.metadataFile, {
      kind: 'xiaohongshu_image_generation_metadata',
      route,
      calls: generationMetadata,
      failures: generationFailures,
      status: generationFailures.length > 0 ? 'completed_with_quality_debt' : 'completed',
    });
    writeJson(paths.manifestFile, manifest);
    return {
      ...attachCommon(route, contract, null, adapter),
      status: generationFailures.length > 0 ? 'completed_with_quality_debt' : 'completed',
      quality_debt: generationFailures.length > 0 ? {
        status: 'recorded_non_blocking',
        reasons: ['image_generation_partial_failure'],
        failed_slide_ids: generationFailures.map((item) => safeText(item?.slide_id)).filter(Boolean),
        failures: generationFailures,
        blocks_stage_transition: false,
        blocks_ready_claims: true,
      } : null,
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
      image_generation_failures: generationFailures,
      repair_image_pages: route === 'repair_image_pages'
        ? {
            source_review_stage: 'screenshot_review',
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
      artifact_refs: [
        paths.manifestFile,
        paths.promptManifestFile,
        paths.styleManifestFile,
        paths.metadataFile,
        ...bundlePages.map((slide) => safeText(slide?.png_file)).filter(Boolean),
        ...promptEntries.map((entry) => safeText(entry?.prompt_file)).filter(Boolean),
        ...promptEntries.map((entry) => safeText(entry?.prompt_manifest_file)).filter(Boolean),
        ...promptEntries.map((entry) => safeText(entry?.style_manifest_file)).filter(Boolean),
      ],
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

  return { buildImagePagesArtifact };
}
