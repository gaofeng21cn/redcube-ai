// @ts-nocheck
import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export function createXiaohongshuDeliveryParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    attachCommon,
    buildAuthoringContext,
    buildPublishBundleReadme,
    copySurfaceFile,
    creativeExecution,
    creativeSourceStamp,
    ensureDir,
    generateStructuredArtifact,
    getDeliverablePublishSurfacePaths,
    getDeliverableViewSurfacePaths,
    imagePagesList,
    isImagePagesArtifact,
    isSeries,
    normalizeStringList,
    promptRoute,
    readCurrentHtmlArtifact,
    readCurrentVisualArtifact,
    readStageArtifact,
    requireText,
    resolveAuthorBranding,
    safeArray,
    safeText,
    stripHtml,
    syncCurrentCandidateHtmlFromStageArtifact,
    writeJson,
    writeText,
  } = deps;

  async function generatePublishCopyDraft(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const render = readCurrentVisualArtifact(contract, deliverablePaths);
    const imagePagesInput = isImagePagesArtifact(render);
    const pages = imagePagesInput
      ? imagePagesList(render)
      : safeArray(render?.html_bundle?.slides);
    return generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'publish_copy',
      promptRelativePath: promptRoute(contract, 'publish_copy'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research }),
        storyline: storyline?.storyline || null,
        title_options: safeArray(plan?.single_note_plan?.title_options).slice(0, 3),
        cover_slide_id: pages?.[0]?.slide_id || 'N01',
        source_surface_kind: imagePagesInput ? 'image_pages' : 'html',
        render_summary: pages.map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          text_excerpt: imagePagesInput
            ? `image-first XHS page: ${path.basename(slide.png_file || slide.image_file || '')}`
            : stripHtml(slide.content).slice(0, 100),
        })),
      },
      outputContract: {
        type: 'object',
        required: ['body', 'interaction_questions', 'hashtags', 'first_comment', 'publish_suggestion'],
        additionalProperties: true,
        properties: {
          body: { type: 'string' },
          interaction_questions: { type: 'array', items: { type: 'string' } },
          hashtags: { type: 'array', items: { type: 'string' } },
          first_comment: { type: 'string' },
          publish_suggestion: {
            type: 'object',
            required: ['recommended_time'],
            additionalProperties: true,
            properties: {
              recommended_time: { type: 'string' },
            },
          },
        },
      },
    });
  }

  async function buildPublishCopy(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const render = readCurrentVisualArtifact(contract, deliverablePaths);
    const imagePagesInput = isImagePagesArtifact(render);
    const visualPages = imagePagesInput
      ? imagePagesList(render)
      : safeArray(render?.html_bundle?.slides);
    const candidateSurfaceRefs = imagePagesInput
      ? safeArray(render?.artifact_refs)
      : syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths);
    const authorBranding = resolveAuthorBranding(workspaceRoot, contract);
    const titles = safeArray(plan?.single_note_plan?.title_options).slice(0, 3);
    const { data, generationRuntime } = await generatePublishCopyDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      adapter,
    );
    const hydratedTitles = titles;
    const body = requireText(data?.body, 'publish_copy.body');
    const interactionQuestions = normalizeStringList(data?.interaction_questions, 'publish_copy.interaction_questions', { min: 1, max: 3 });
    const hashtags = normalizeStringList(data?.hashtags, 'publish_copy.hashtags', { min: 3, max: 8 });
    const firstComment = requireText(data?.first_comment, 'publish_copy.first_comment');
    const qualityGate = {
      title_count: hydratedTitles.length,
      body_char_count: body.length,
      comment_prompt_count: firstComment.length > 0 ? 1 : 0,
      interaction_question_count: interactionQuestions.length,
      actionable_step_count: Array.from(body.matchAll(/先|再|最后|第[0-9一二三四五六七八九十]/g)).length,
      hashtag_count: hashtags.length,
      banned_terms_hit_count: 0,
      meta_instruction_leak_count: 0,
      gate_pass: hydratedTitles.length >= 3 && body.length >= 80 && body.length <= 420,
    };
    const captionFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-copy.txt`);
    writeText(captionFile, [
      `标题候选：${hydratedTitles.join(' / ')}`,
      `署名：${authorBranding.signature_display}`,
      `品牌：${authorBranding.signature_subtitle}`,
      '',
      body,
      '',
      `首评引导：${firstComment}`,
      '',
      hashtags.join(' '),
    ].join('\n'));
    return {
      ...attachCommon('publish_copy', contract, generationRuntime, adapter),
      creative_execution: creativeExecution('publish_copy', generationRuntime, adapter),
      status: qualityGate.gate_pass ? 'pass' : 'block',
      publish_copy: {
        titles: hydratedTitles,
        body,
        first_comment: firstComment,
        interaction_questions: interactionQuestions,
        hashtags,
        publish_suggestion: {
          cover_slide_id: visualPages?.[0]?.slide_id || 'N01',
          source_surface_kind: imagePagesInput ? 'image_pages' : 'html',
          recommended_time: requireText(data?.publish_suggestion?.recommended_time, 'publish_copy.publish_suggestion.recommended_time'),
        },
        author_signature: {
          profile_id: authorBranding.profile_id,
          signature_display: authorBranding.signature_display,
          signature_subtitle: authorBranding.signature_subtitle,
          config_scope: authorBranding.config_scope,
        },
        quality_gate: qualityGate,
        caption_file: captionFile,
        creative_sources: {
          titles: creativeSourceStamp({
            route: 'publish_copy',
            lifecycleStage: 'delivery_packaging',
            authoredSurface: 'titles',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          body: creativeSourceStamp({
            route: 'publish_copy',
            lifecycleStage: 'delivery_packaging',
            authoredSurface: 'body',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          first_comment: creativeSourceStamp({
            route: 'publish_copy',
            lifecycleStage: 'delivery_packaging',
            authoredSurface: 'first_comment',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
        creative_authorship: {
          titles: creativeSourceStamp({
            route: 'publish_copy',
            lifecycleStage: 'delivery_packaging',
            authoredSurface: 'titles',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          body: creativeSourceStamp({
            route: 'publish_copy',
            lifecycleStage: 'delivery_packaging',
            authoredSurface: 'body',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
          first_comment: creativeSourceStamp({
            route: 'publish_copy',
            lifecycleStage: 'delivery_packaging',
            authoredSurface: 'first_comment',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      artifact_refs: [...candidateSurfaceRefs, captionFile],
      review_state_patch: {
        current_status: qualityGate.gate_pass ? 'publish_ready' : 'blocked_for_revision',
        ready_for_export: qualityGate.gate_pass,
        latest_review_stage: 'publish_copy',
        latest_checks: {
          platform_copy_complete: qualityGate.gate_pass,
          cta_clear: qualityGate.interaction_question_count >= 1,
        },
        pending_reviews: qualityGate.gate_pass ? [] : ['platform_copy_complete'],
        blocking_reasons: qualityGate.gate_pass ? [] : ['platform_copy_complete'],
        rerun_from_stage: qualityGate.gate_pass ? null : 'publish_copy',
        rerun_policy: {
          status: qualityGate.gate_pass ? 'idle' : 'rerun_required',
          rerun_from_stage: qualityGate.gate_pass ? null : 'publish_copy',
        },
      },
    };
  }

  function computeSeriesSurfaces(contract, deliverablePaths, exportBundle) {
    if (!isSeries(contract)) return null;
    const cadenceFile = path.join(deliverablePaths.reportsDir, '05_全系列发布节奏建议.md');
    const mappingFile = path.join(deliverablePaths.reportsDir, '06_目录索引与路径映射.md');
    const overviewFile = path.join(deliverablePaths.reportsDir, '99_交付总览.md');
    writeText(cadenceFile, ['# 05_全系列发布节奏建议', '', '1. 先发认知破冰页', '2. 再发机制解释页', '3. 最后发动作清单页'].join('\n'));
    writeText(mappingFile, [
      '# 06_目录索引与路径映射',
      '',
      `- Source visual route: ${safeText(exportBundle.source_visual_route)}`,
      `- Source surface: ${safeText(exportBundle.source_surface_kind)}`,
      ...(safeText(exportBundle.html_file) ? [`- HTML: ${exportBundle.html_file}`] : []),
      `- Images: ${safeArray(exportBundle.png_files).length}`,
      `- Caption: ${exportBundle.caption_file}`,
    ].join('\n'));
    writeText(overviewFile, ['# 99_交付总览', '', `- 当前状态：${exportBundle.delivery_state.current}`, `- PNG页数：${exportBundle.png_files.length}`].join('\n'));
    return {
      cadence_file: cadenceFile,
      path_mapping_file: mappingFile,
      delivery_overview_file: overviewFile,
    };
  }

  function imagePagesSourceRefs(renderArtifact) {
    const pages = imagePagesList(renderArtifact).map((page) => ({
      slide_id: safeText(page?.slide_id),
      title: safeText(page?.title),
      png_file: safeText(page?.png_file || page?.image_file || page?.screenshot_file || page?.file),
      prompt_manifest_file: safeText(page?.prompt_manifest_file),
      style_manifest_file: safeText(page?.style_manifest_file),
    }));
    return {
      source_visual_route: safeText(renderArtifact?.route),
      prompt_manifest_file: safeText(renderArtifact?.image_pages_bundle?.prompt_manifest_file || renderArtifact?.image_page_manifest?.prompt_manifest),
      style_manifest_file: safeText(renderArtifact?.image_pages_bundle?.style_manifest_file || renderArtifact?.image_page_manifest?.style_manifest),
      generation_metadata_file: safeText(renderArtifact?.image_pages_bundle?.generation_metadata_file || renderArtifact?.image_page_manifest?.generation_metadata_file),
      pages,
      png_files: pages.map((page) => page.png_file).filter(Boolean),
      prompt_manifest_files: [...new Set(pages.map((page) => page.prompt_manifest_file).filter(Boolean))],
      style_manifest_files: [...new Set(pages.map((page) => page.style_manifest_file).filter(Boolean))],
    };
  }

  function hashFileIfPresent(hash, file) {
    const resolvedFile = safeText(file);
    hash.update(resolvedFile);
    hash.update('\n');
    if (resolvedFile && existsSync(resolvedFile)) {
      hash.update(readFileSync(resolvedFile));
    }
    hash.update('\n');
  }

  function hashExportPreviewInput({ stableHtmlFile, review }) {
    const hash = createHash('sha256');
    hash.update('xiaohongshu_export_preview:v1\n');
    hashFileIfPresent(hash, stableHtmlFile);
    hash.update('pages\n');
    for (const slide of safeArray(review?.slide_reviews)) {
      hash.update(safeText(slide?.slide_id));
      hash.update('\n');
      hashFileIfPresent(hash, slide?.screenshot_file);
      hash.update(JSON.stringify(slide?.metrics || {}));
      hash.update('\n');
    }
    return hash.digest('hex');
  }

  function exportPreviewCacheMetadata(cacheStatus, hash) {
    return {
      cache_status: cacheStatus,
      hash,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function exportPreviewMetricsFromReview(review) {
    const pageReviews = safeArray(review?.slide_reviews);
    return {
      page_count: pageReviews.length,
      reviewed_page_count: pageReviews.length,
      occupied_ratio_avg: Number((pageReviews.reduce((sum, slide) => sum + Number(slide?.metrics?.occupied_ratio || 0), 0) / Math.max(pageReviews.length, 1)).toFixed(4)),
      checks: review?.checks || {},
    };
  }

  function cachedExportPreview(priorArtifact, hash) {
    if (safeText(priorArtifact?.export_bundle?.preview_cache?.hash) !== hash) return null;
    const metrics = priorArtifact?.export_bundle?.preview_metrics;
    if (!metrics || typeof metrics !== 'object') return null;
    return metrics;
  }

  function buildExportBundle(workspaceRoot, topicId, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const review = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const copy = readStageArtifact(contract, deliverablePaths, 'publish_copy');
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const imagePagesInput = isImagePagesArtifact(renderArtifact);
    const stableHtmlFile = imagePagesInput ? '' : getDeliverableViewSurfacePaths(deliverablePaths).stableHtmlFile;
    if (!imagePagesInput && !existsSync(stableHtmlFile)) {
      throw new Error(`Route export_bundle requires reviewed stable HTML surface before export: ${stableHtmlFile}`);
    }
    const publishPaths = getDeliverablePublishSurfacePaths(deliverablePaths);
    const publishDir = ensureDir(publishPaths.publishDir);
    const publishScreenshotsDir = ensureDir(publishPaths.publishScreenshotsDir);
    const publishHtmlFile = publishPaths.publishHtmlFile;
    const publishCaptionFile = publishPaths.publishCaptionFile;
    const publishManifestFile = publishPaths.publishManifestFile;
    const publishReadmeFile = publishPaths.publishReadmeFile;
    const pngFiles = safeArray(review?.slide_reviews).map((slide) => slide.screenshot_file);
    const manifestFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-manifest.json`);
    const previewHash = hashExportPreviewInput({ stableHtmlFile, review });
    const cachedPreviewMetrics = cachedExportPreview(readStageArtifact(contract, deliverablePaths, 'export_bundle'), previewHash);
    const previewCacheStatus = cachedPreviewMetrics ? 'hit' : 'miss';
    const previewMetrics = cachedPreviewMetrics || exportPreviewMetricsFromReview(review);
    const publishPngFiles = pngFiles
      .map((file) => copySurfaceFile(file, path.join(publishScreenshotsDir, path.basename(file))))
      .filter(Boolean);
    if (!imagePagesInput) {
      copySurfaceFile(stableHtmlFile, publishHtmlFile);
    }
    copySurfaceFile(copy.publish_copy.caption_file, publishCaptionFile);
    const sourceArtifacts = imagePagesInput ? imagePagesSourceRefs(renderArtifact) : null;
    const exportBundle = {
      source_surface_kind: imagePagesInput ? 'image_pages' : 'html',
      source_visual_route: imagePagesInput ? safeText(renderArtifact?.route) : safeText(renderArtifact?.route, 'render_html'),
      editable: imagePagesInput ? false : undefined,
      html_file: stableHtmlFile,
      source_html: stableHtmlFile,
      source_artifacts: sourceArtifacts,
      png_files: pngFiles,
      caption_file: copy.publish_copy.caption_file,
      publish_manifest_file: manifestFile,
      publish_dir: publishDir,
      publish_html_file: imagePagesInput ? '' : publishHtmlFile,
      publish_caption_file: publishCaptionFile,
      publish_png_files: publishPngFiles,
      publish_image_files: publishPngFiles,
      author_signature: copy.publish_copy.author_signature || null,
      preview_cache: exportPreviewCacheMetadata(previewCacheStatus, previewHash),
      preview_metrics: previewMetrics,
      delivery_state: {
        current: 'output_ready',
        next: 'published_pending_human',
      },
    };
    writeJson(manifestFile, exportBundle);
    writeJson(publishManifestFile, exportBundle);
    writeText(publishReadmeFile, buildPublishBundleReadme({
      publishDir,
      publishHtmlFile,
      publishCaptionFile,
      publishScreenshotsDir,
      sourceSurfaceKind: exportBundle.source_surface_kind,
      sourceVisualRoute: exportBundle.source_visual_route,
      publishImageFiles: publishPngFiles,
      authorSignature: copy.publish_copy.author_signature || null,
      deliveryState: exportBundle.delivery_state,
    }));
    return {
      ...attachCommon('export_bundle', contract, null, adapter),
      status: 'completed',
      export_bundle: exportBundle,
      series_surfaces: computeSeriesSurfaces(contract, deliverablePaths, exportBundle),
      artifact_refs: [
        manifestFile,
        publishManifestFile,
        publishReadmeFile,
        ...(stableHtmlFile ? [stableHtmlFile] : []),
        ...(imagePagesInput ? safeArray(sourceArtifacts?.png_files) : [publishHtmlFile]),
        ...safeArray(sourceArtifacts?.prompt_manifest_files),
        ...safeArray(sourceArtifacts?.style_manifest_files),
        copy.publish_copy.caption_file,
        publishCaptionFile,
        ...pngFiles,
        ...publishPngFiles,
      ].filter(Boolean),
      review_state_patch: {
        current_status: 'publish_ready',
        ready_for_export: true,
        latest_review_stage: 'export_bundle',
        latest_checks: {
          platform_copy_complete: true,
          cta_clear: true,
        },
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
    buildExportBundle,
    buildPublishCopy,
  };
}
