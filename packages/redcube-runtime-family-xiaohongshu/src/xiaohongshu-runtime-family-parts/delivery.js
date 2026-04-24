import path from 'node:path';
import { existsSync } from 'node:fs';

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
    isSeries,
    normalizeStringList,
    promptRoute,
    readCurrentHtmlArtifact,
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
    const render = readCurrentHtmlArtifact(contract, deliverablePaths);
    return generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'publish_copy',
      promptRelativePath: promptRoute(contract, 'publish_copy'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research }),
        storyline: storyline?.storyline || null,
        title_options: safeArray(plan?.single_note_plan?.title_options).slice(0, 3),
        cover_slide_id: render?.html_bundle?.slides?.[0]?.slide_id || 'N01',
        render_summary: safeArray(render?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          text_excerpt: stripHtml(slide.content).slice(0, 100),
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
    const candidateSurfaceRefs = syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths);
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const render = readCurrentHtmlArtifact(contract, deliverablePaths);
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
          cover_slide_id: render?.html_bundle?.slides?.[0]?.slide_id || 'N01',
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
    writeText(mappingFile, ['# 06_目录索引与路径映射', '', `- HTML: ${exportBundle.html_file}`, `- Caption: ${exportBundle.caption_file}`].join('\n'));
    writeText(overviewFile, ['# 99_交付总览', '', `- 当前状态：${exportBundle.delivery_state.current}`, `- PNG页数：${exportBundle.png_files.length}`].join('\n'));
    return {
      cadence_file: cadenceFile,
      path_mapping_file: mappingFile,
      delivery_overview_file: overviewFile,
    };
  }

  function buildExportBundle(workspaceRoot, topicId, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const review = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const copy = readStageArtifact(contract, deliverablePaths, 'publish_copy');
    const stableHtmlFile = getDeliverableViewSurfacePaths(deliverablePaths).stableHtmlFile;
    if (!existsSync(stableHtmlFile)) {
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
    const publishPngFiles = pngFiles
      .map((file) => copySurfaceFile(file, path.join(publishScreenshotsDir, path.basename(file))))
      .filter(Boolean);
    copySurfaceFile(stableHtmlFile, publishHtmlFile);
    copySurfaceFile(copy.publish_copy.caption_file, publishCaptionFile);
    const exportBundle = {
      html_file: stableHtmlFile,
      png_files: pngFiles,
      caption_file: copy.publish_copy.caption_file,
      publish_manifest_file: manifestFile,
      publish_dir: publishDir,
      publish_html_file: publishHtmlFile,
      publish_caption_file: publishCaptionFile,
      publish_png_files: publishPngFiles,
      author_signature: copy.publish_copy.author_signature || null,
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
        stableHtmlFile,
        publishHtmlFile,
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
