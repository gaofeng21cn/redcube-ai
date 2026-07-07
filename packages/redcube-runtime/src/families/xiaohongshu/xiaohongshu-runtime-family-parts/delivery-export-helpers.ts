// @ts-nocheck
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export function createXiaohongshuDeliveryExportHelpers(deps) {
  const {
    imagePagesList,
    safeArray,
    safeText,
  } = deps;

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

  return {
    cachedExportPreview,
    exportPreviewCacheMetadata,
    exportPreviewMetricsFromReview,
    hashExportPreviewInput,
    imagePagesSourceRefs,
  };
}
