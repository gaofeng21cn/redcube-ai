import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, rmSync } from 'node:fs';

export function createPptDeckRenderBatchCacheParts(deps) {
  const {
    RENDER_REFERENCE_SLIDE_WINDOW,
    ensureDir,
    existsSync: mainExistsSync,
    generateStructuredArtifact,
    normalizeInlineText,
    readJson,
    safeArray,
    safeText,
    writeJson,
    writeText,
  } = deps;

  function stableHash(value) {
    return createHash('sha256')
      .update(JSON.stringify(value))
      .digest('hex');
  }

  function renderBatchCacheRoot(deliverablePaths, route) {
    const artifactsDir = safeText(deliverablePaths?.artifactsDir)
      || path.join(deliverablePaths.deliverableDir, 'artifacts');
    return path.join(artifactsDir, 'render_batches', route);
  }

  function renderBatchCacheFile(deliverablePaths, route, stageId) {
    return path.join(renderBatchCacheRoot(deliverablePaths, route), `${stageId}.json`);
  }

  function renderBatchSlideFile(deliverablePaths, route, stageId, slideId) {
    return path.join(renderBatchCacheRoot(deliverablePaths, route), stageId, `${slideId}.html`);
  }

  function buildRenderBatchStageId(route, batchIndex, slideBatch) {
    const indexLabel = String(Number(batchIndex) + 1).padStart(2, '0');
    const slideLabel = safeArray(slideBatch)
      .map((slide) => safeText(slide?.slide_id).replace(/[^A-Za-z0-9_-]/g, ''))
      .filter(Boolean)
      .join('_');
    return `${route}_batch_${indexLabel}${slideLabel ? `_${slideLabel}` : ''}`;
  }

  function cleanRenderBatchSlideDir(deliverablePaths, route, stageId) {
    const stageDir = path.join(renderBatchCacheRoot(deliverablePaths, route), stageId);
    if (!(mainExistsSync || existsSync)(stageDir)) return;
    for (const entry of readdirSync(stageDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      rmSync(path.join(stageDir, entry.name), { force: true });
    }
  }

  function pruneInactiveRenderBatchArtifacts(deliverablePaths, route, activeStageIds) {
    const root = renderBatchCacheRoot(deliverablePaths, route);
    const active = new Set(safeArray(activeStageIds).map((stageId) => safeText(stageId)).filter(Boolean));
    if (active.size === 0 || !(mainExistsSync || existsSync)(root)) return;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      const entryPath = path.join(root, entry.name);
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const stageId = entry.name.replace(/\.json$/, '');
        if (!active.has(stageId)) rmSync(entryPath, { force: true });
        continue;
      }
      if (entry.isDirectory() && !active.has(entry.name)) {
        rmSync(entryPath, { recursive: true, force: true });
      }
    }
  }

  function buildRenderBatchCacheKey({
    route,
    renderPlan,
    revisionFreshness,
    visualArtifact,
    promptSlides,
    referenceSlides,
    promptRelativePath,
  }) {
    return stableHash({
      version: 1,
      route,
      promptRelativePath,
      rerender_mode: renderPlan.mode,
      force_full_regeneration: revisionFreshness.force_full_regeneration,
      revision_floor_mtime_ms: revisionFreshness.revision_floor_mtime_ms,
      slide_ids: promptSlides.map((slide) => safeText(slide?.slide_id)),
      prompt_slides: promptSlides,
      reference_slides: referenceSlides.map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        source_html_hash: safeText(slide?.source_html_hash),
        visual_summary: slide?.visual_summary || {},
        slide_identity: slide?.slide_identity || {},
      })),
      visual_direction_hash: stableHash(visualArtifact?.visual_direction || {}),
    });
  }

  function loadRenderBatchCache(file, expectedCacheKey) {
    if (!safeText(file) || !(mainExistsSync || existsSync)(file)) return null;
    try {
      const cached = readJson(file);
      if (safeText(cached?.cache_key) !== expectedCacheKey) return null;
      const slides = safeArray(cached?.data?.slides).filter((slide) => slide && typeof slide === 'object');
      if (slides.length === 0) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function writeRenderBatchCache({
    deliverablePaths,
    route,
    stageId,
    cacheKey,
    promptSlides,
    referenceSlides,
    result,
  }) {
    const file = renderBatchCacheFile(deliverablePaths, route, stageId);
    const payload = {
      kind: 'ppt_render_html_batch_artifact',
      version: 1,
      route,
      stage_id: stageId,
      cache_key: cacheKey,
      cache_status: 'fresh',
      written_at: new Date().toISOString(),
      slide_ids: promptSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      reference_slide_ids: referenceSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      data: result?.data || {},
      generationRuntime: result?.generationRuntime || null,
    };
    ensureDir(path.dirname(file));
    writeJson(file, payload);
    cleanRenderBatchSlideDir(deliverablePaths, route, stageId);
    for (const slide of safeArray(payload.data?.slides)) {
      const slideId = safeText(slide?.slide_id);
      const contentHtml = safeText(slide?.content_html);
      if (!slideId || !contentHtml) continue;
      ensureDir(path.dirname(renderBatchSlideFile(deliverablePaths, route, stageId, slideId)));
      writeText(renderBatchSlideFile(deliverablePaths, route, stageId, slideId), contentHtml);
    }
    return payload;
  }

  async function executeRenderBatchStagesDurably({
    adapter,
    deliverablePaths,
    route,
    stages,
    parallel = false,
  }) {
    const data = [];
    const stageCacheStatus = [];
    let reusedBatchCount = 0;
    let generatedBatchCount = 0;
    if (parallel) {
      const preparedStages = await Promise.all(stages.map(async (stage) => {
        const stageInput = await stage({ previousResults: [], stage_id: stage.stage_id });
        const cached = loadRenderBatchCache(stageInput.cache_file, stageInput.cache_key);
        return { stage, stageInput, cached };
      }));
      const stageResults = await Promise.all(preparedStages.map(async ({ stage, stageInput, cached }) => {
        if (cached) {
          return {
            stage_id: stage.stage_id,
            data: cached.data,
            generationRuntime: cached.generationRuntime,
            cache_status: 'reused',
          };
        }
        const result = await generateStructuredArtifact({
          adapter,
          family: stageInput.family,
          route: stageInput.route,
          promptRelativePath: stageInput.promptRelativePath,
          context: stageInput.context,
          outputContract: stageInput.outputContract,
          localFileInspection: stageInput.localFileInspection,
          timeoutMs: stageInput.timeoutMs,
          cwd: stageInput.cwd || deliverablePaths.deliverableDir,
        });
        const persisted = writeRenderBatchCache({
          deliverablePaths,
          route,
          stageId: stage.stage_id,
          cacheKey: stageInput.cache_key,
          promptSlides: stageInput.promptSlides,
          referenceSlides: stageInput.referenceSlides,
          result,
        });
        return {
          stage_id: stage.stage_id,
          data: persisted.data,
          generationRuntime: persisted.generationRuntime,
          cache_status: 'fresh',
        };
      }));
      for (const stageResult of stageResults) {
        data.push({
          stage_id: stageResult.stage_id,
          data: stageResult.data,
          generationRuntime: stageResult.generationRuntime,
          cache_status: stageResult.cache_status,
        });
        if (stageResult.cache_status === 'reused') {
          reusedBatchCount += 1;
        } else {
          generatedBatchCount += 1;
        }
        stageCacheStatus.push({
          stage_id: stageResult.stage_id,
          cache_status: stageResult.cache_status,
        });
      }
      pruneInactiveRenderBatchArtifacts(
        deliverablePaths,
        route,
        stages.map((stage) => stage.stage_id),
      );
      return {
        data,
        batchRuntime: {
          owner: safeText(data.find((stage) => stage?.generationRuntime)?.generationRuntime?.owner),
          durable_cache: {
            root: renderBatchCacheRoot(deliverablePaths, route),
            reused_batch_count: reusedBatchCount,
            generated_batch_count: generatedBatchCount,
            stage_cache_status: stageCacheStatus,
          },
          session_pool: {
            reuse_supported: false,
            reuse_claimed: false,
            reuse_status: 'durable_render_batch_cache',
            invocation_count: generatedBatchCount,
          },
        },
      };
    }
    for (const stage of stages) {
      const stageInput = await stage({ previousResults: data, stage_id: stage.stage_id });
      const cached = loadRenderBatchCache(stageInput.cache_file, stageInput.cache_key);
      if (cached) {
        reusedBatchCount += 1;
        data.push({
          stage_id: stage.stage_id,
          data: cached.data,
          generationRuntime: cached.generationRuntime,
          cache_status: 'reused',
        });
        stageCacheStatus.push({ stage_id: stage.stage_id, cache_status: 'reused' });
        continue;
      }
      const result = await generateStructuredArtifact({
        adapter,
        family: stageInput.family,
        route: stageInput.route,
        promptRelativePath: stageInput.promptRelativePath,
        context: stageInput.context,
        outputContract: stageInput.outputContract,
        localFileInspection: stageInput.localFileInspection,
        timeoutMs: stageInput.timeoutMs,
        cwd: stageInput.cwd || deliverablePaths.deliverableDir,
      });
      generatedBatchCount += 1;
      const persisted = writeRenderBatchCache({
        deliverablePaths,
        route,
        stageId: stage.stage_id,
        cacheKey: stageInput.cache_key,
        promptSlides: stageInput.promptSlides,
        referenceSlides: stageInput.referenceSlides,
        result,
      });
      data.push({
        stage_id: stage.stage_id,
        data: persisted.data,
        generationRuntime: persisted.generationRuntime,
        cache_status: 'fresh',
      });
      stageCacheStatus.push({ stage_id: stage.stage_id, cache_status: 'fresh' });
    }
    pruneInactiveRenderBatchArtifacts(
      deliverablePaths,
      route,
      stages.map((stage) => stage.stage_id),
    );
    return {
      data,
      batchRuntime: {
        owner: safeText(data.find((stage) => stage?.generationRuntime)?.generationRuntime?.owner),
        durable_cache: {
          root: renderBatchCacheRoot(deliverablePaths, route),
          reused_batch_count: reusedBatchCount,
          generated_batch_count: generatedBatchCount,
          stage_cache_status: stageCacheStatus,
        },
        session_pool: {
          reuse_supported: false,
          reuse_claimed: false,
          reuse_status: 'durable_render_batch_cache',
          invocation_count: generatedBatchCount,
        },
      },
    };
  }

  function buildRenderBatchReferenceSlides({
    blueprintSlides,
    slideBatch,
    renderedSlideHtmlById,
    limit = RENDER_REFERENCE_SLIDE_WINDOW,
  }) {
    const firstSlideId = safeText(safeArray(slideBatch)[0]?.slide_id);
    if (!firstSlideId) return [];
    const firstIndex = safeArray(blueprintSlides).findIndex((slide) => safeText(slide?.slide_id) === firstSlideId);
    if (firstIndex <= 0) return [];
    const references = [];
    for (let index = Math.max(0, firstIndex - limit); index < firstIndex; index += 1) {
      const slide = blueprintSlides[index];
      const slideId = safeText(slide?.slide_id);
      const sourceHtml = safeText(renderedSlideHtmlById.get(slideId));
      if (!slideId || !sourceHtml) continue;
      references.push({
        slide_id: slideId,
        source_html_hash: stableHash(sourceHtml),
        slide_identity: {
          slide_id: slideId,
          slide_no: slide?.slide_no ?? index + 1,
          title: safeText(slide?.title),
          page_type: safeText(slide?.page_type),
          chapter_id: safeText(slide?.chapter_id),
          chapter_title: safeText(slide?.chapter_title),
          render_recipe_id: safeText(slide?.render_recipe_id),
        },
        visual_summary: {
          layout_family: safeText(slide?.layout_family),
          anchor_tracks: safeArray(slide?.anchor_tracks).map((item) => safeText(item)).filter(Boolean),
          title: safeText(slide?.title),
          core_sentence: normalizeInlineText(slide?.core_sentence, 160),
          qa_block_count: (sourceHtml.match(/data-qa-block=/g) || []).length,
          primary_point_count: (sourceHtml.match(/data-primary-point=/g) || []).length,
          html_character_count: sourceHtml.length,
        },
      });
    }
    return references;
  }

  return {
    buildRenderBatchCacheKey,
    buildRenderBatchReferenceSlides,
    buildRenderBatchStageId,
    executeRenderBatchStagesDurably,
    renderBatchCacheFile,
  };
}
