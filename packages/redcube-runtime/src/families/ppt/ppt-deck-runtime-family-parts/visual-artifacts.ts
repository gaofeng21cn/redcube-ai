import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { authoringLaneForRoute, lockedAuthoringLane } from '../../../progress-first.js';

type JsonRecord = Record<string, any>;
type ImagePagesRoute = 'author_image_pages' | 'repair_image_pages';

interface VisualArtifactDeps {
  currentHtmlStageId(contract: JsonRecord, deliverablePaths: JsonRecord): string;
  currentNativePptStageId(contract: JsonRecord, deliverablePaths: JsonRecord): 'author_pptx_native' | 'repair_pptx_native' | '';
  existsSync(file: string): boolean;
  readCurrentHtmlArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null;
  readStageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): JsonRecord | null;
  safeArray(value: unknown): JsonRecord[];
  safeFileMtimeMs(file: string): number;
  safeText(value: unknown, fallback?: string): string;
  stageArtifactPath(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): string;
}

function aggregateChecks(slideReviews: JsonRecord[]): JsonRecord {
  const checkKeys = [
    'overflow_free',
    'occlusion_free',
    'visual_density_ok',
    'speaker_fit_ok',
    'edge_clearance_ok',
    'block_content_fit_ok',
    'title_typography_ok',
    'page_number_consistency_ok',
    'external_audience_language_ok',
    'title_safe_zone_clear',
    'table_legibility_ok',
    'layout_density_ok',
  ];
  return Object.fromEntries(
    checkKeys.map((key) => [
      key,
      slideReviews.every((slide) => slide?.checks?.[key] !== false),
    ]),
  );
}

export function createPptDeckVisualArtifactParts(deps: VisualArtifactDeps) {
  const {
    currentHtmlStageId,
    currentNativePptStageId,
    existsSync,
    readCurrentHtmlArtifact,
    readStageArtifact,
    safeArray,
    safeFileMtimeMs,
    safeText,
    stageArtifactPath,
  } = deps;

  function currentImagePagesStageId(contract: JsonRecord, deliverablePaths: JsonRecord): ImagePagesRoute | '' {
    const authorFile = stageArtifactPath(contract, deliverablePaths, 'author_image_pages');
    const repairFile = stageArtifactPath(contract, deliverablePaths, 'repair_image_pages');
    const authorMtimeMs = safeFileMtimeMs(authorFile);
    const repairMtimeMs = safeFileMtimeMs(repairFile);
    if (repairMtimeMs > 0 && repairMtimeMs >= authorMtimeMs) {
      return 'repair_image_pages';
    }
    return authorMtimeMs > 0 ? 'author_image_pages' : '';
  }

  function imagePagesBundle(artifact: JsonRecord | null | undefined): JsonRecord {
    return artifact?.image_pages_bundle || artifact?.image_pages || {};
  }

  function imagePagePngFile(page: JsonRecord | null | undefined): string {
    return safeText(page?.png_file || page?.image_file || page?.screenshot_file || page?.file);
  }

  function imagePagesList(artifact: JsonRecord | null | undefined): JsonRecord[] {
    const bundle = imagePagesBundle(artifact);
    return safeArray(bundle?.pages || artifact?.pages).map((page, index) => ({
      ...page,
      slide_id: safeText(page?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
      title: safeText(page?.title, `Slide ${index + 1}`),
      png_file: imagePagePngFile(page),
      prompt_manifest_file: safeText(page?.prompt_manifest_file || bundle?.prompt_manifest_file || artifact?.prompt_manifest_file),
      style_manifest_file: safeText(page?.style_manifest_file || bundle?.style_manifest_file || artifact?.style_manifest_file),
    }));
  }

  function isImagePagesArtifact(artifact: JsonRecord | null | undefined): boolean {
    const route = safeText(artifact?.route);
    if (!['author_image_pages', 'repair_image_pages'].includes(route)) return false;
    return imagePagesList(artifact).length > 0 || safeArray(imagePagesBundle(artifact)?.png_refs).length > 0;
  }

  function currentVisualStageId(contract: JsonRecord, deliverablePaths: JsonRecord): string {
    const authoringLaneLock = lockedAuthoringLane(contract);
    const htmlStage = currentHtmlStageId(contract, deliverablePaths);
    const htmlMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, htmlStage));
    const nativeStage = currentNativePptStageId(contract, deliverablePaths);
    const nativeMtimeMs = nativeStage
      ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, nativeStage))
      : 0;
    const imageStage = currentImagePagesStageId(contract, deliverablePaths);
    const imageMtimeMs = imageStage
      ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, imageStage))
      : 0;
    const candidates = [
      { stage: htmlStage, mtimeMs: htmlMtimeMs },
      { stage: nativeStage, mtimeMs: nativeMtimeMs },
      { stage: imageStage, mtimeMs: imageMtimeMs },
    ].filter((item) => item.stage
      && item.mtimeMs > 0
      && (!authoringLaneLock || authoringLaneForRoute(item.stage) === authoringLaneLock));
    if (candidates.length > 0) {
      candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
      return candidates[0].stage;
    }
    return '';
  }

  function readCurrentVisualArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null {
    const stageId = currentVisualStageId(contract, deliverablePaths);
    if (!stageId) return null;
    return stageId === 'render_html' || stageId === 'fix_html'
      ? readCurrentHtmlArtifact(contract, deliverablePaths)
      : readStageArtifact(contract, deliverablePaths, stageId);
  }

  function visualArtifactMtimeMs(contract: JsonRecord, deliverablePaths: JsonRecord): number {
    const stageId = currentVisualStageId(contract, deliverablePaths);
    return stageId ? safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, stageId)) : 0;
  }

  function readJsonIfPresent(file: string): JsonRecord {
    if (!file || !existsSync(file)) return {};
    try {
      return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
    } catch {
      return {};
    }
  }

  function pngDimensions(file: string): { width: number; height: number } | null {
    if (!file || !existsSync(file)) return null;
    const buffer = readFileSync(file);
    if (buffer.length < 24) return null;
    if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
    if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  function fileSha256(file: string): string {
    if (!file || !existsSync(file)) return '';
    return createHash('sha256').update(readFileSync(file)).digest('hex');
  }

  function manifestLeakIssues(promptManifest: JsonRecord, styleManifest: JsonRecord): string[] {
    const text = `${JSON.stringify(promptManifest)}\n${JSON.stringify(styleManifest)}`;
    return [
      /\b(system_prompt|developer_prompt|runtime_state)\b/i,
      /内部(流程|字段|提示|审查|运行态)/i,
    ].some((pattern) => pattern.test(text))
      ? ['internal_field_leak_risk']
      : [];
  }

  function operatorLanguageFragments(promptManifest: JsonRecord, styleManifest: JsonRecord): string[] {
    const policyFragments = safeArray(promptManifest?.audience_language_policy?.forbidden_visible_fragments)
      .map((item) => safeText(item))
      .filter(Boolean);
    const defaultFragments = [
      '汇报讨论用途',
      '客观专业版',
      '本次汇报边界',
      '不在展示页暴露',
      '本地原始文件名',
      '清洗脚本名',
      'RCA',
      'RedCube',
      'source intake',
      'author_pptx_native',
      'slide_blueprint',
      'visual_direction',
    ];
    const visibleText = [
      JSON.stringify(promptManifest?.visible_text_audit || {}),
      JSON.stringify(styleManifest?.visible_text_audit || {}),
    ].join('\n');
    return [...new Set([...policyFragments, ...defaultFragments]
      .filter((fragment) => visibleText.includes(fragment)))];
  }

  function layoutLegibilityMetrics(promptManifest: JsonRecord, styleManifest: JsonRecord): JsonRecord {
    const policy = promptManifest?.layout_legibility_policy || styleManifest?.layout_legibility_policy || {};
    const quality = promptManifest?.layout_quality || styleManifest?.layout_quality || {};
    const tablePolicy = policy?.table_legibility || {};
    const minFontThreshold = Number(tablePolicy?.min_body_font_pt || 11);
    const blankThreshold = Number(tablePolicy?.max_blank_ratio_in_card || 0.38);
    const tableMinFontPt = Number(quality?.table_min_font_pt ?? quality?.tableMinFontPt ?? minFontThreshold);
    const cardBlankRatio = Number(quality?.card_blank_ratio ?? quality?.cardBlankRatio ?? 0);
    const titleSafeZoneClear = quality?.title_safe_zone_clear !== false && quality?.titleSafeZoneClear !== false;
    const tableLegibilityOk = tableMinFontPt >= minFontThreshold && quality?.table_cell_fit_ok !== false;
    const layoutDensityOk = cardBlankRatio <= blankThreshold;
    return {
      title_safe_zone_clear: titleSafeZoneClear,
      table_legibility_ok: tableLegibilityOk,
      layout_density_ok: layoutDensityOk,
      table_min_font_pt: Number.isFinite(tableMinFontPt) ? tableMinFontPt : minFontThreshold,
      table_min_font_threshold_pt: minFontThreshold,
      card_blank_ratio: Number.isFinite(cardBlankRatio) ? cardBlankRatio : 0,
      card_blank_ratio_threshold: blankThreshold,
    };
  }

  function imagePagesMechanicalReviewPayload(imageArtifact: JsonRecord | null) {
    const pages = imagePagesList(imageArtifact);
    const hashes = new Map<string, number>();
    for (const page of pages) {
      const sha256 = fileSha256(safeText(page.png_file));
      if (sha256) hashes.set(sha256, (hashes.get(sha256) || 0) + 1);
    }
    const slideReviews = pages.map((page) => {
      const pngFile = safeText(page.png_file);
      const promptManifestFile = safeText(page.prompt_manifest_file);
      const styleManifestFile = safeText(page.style_manifest_file);
      const dimensions = pngDimensions(pngFile);
      const sha256 = fileSha256(pngFile);
      const bytes = pngFile && existsSync(pngFile) ? readFileSync(pngFile).length : 0;
      const promptManifest = readJsonIfPresent(promptManifestFile);
      const styleManifest = readJsonIfPresent(styleManifestFile);
      const operatorFragments = operatorLanguageFragments(promptManifest, styleManifest);
      const layoutMetrics = layoutLegibilityMetrics(promptManifest, styleManifest);
      const ratioOk = dimensions !== null
        && Math.abs((dimensions.width / Math.max(dimensions.height, 1)) - (16 / 9)) < 0.01;
      const nonEmpty = bytes > 0;
      const manifestPresent = Boolean(promptManifestFile && existsSync(promptManifestFile) && styleManifestFile && existsSync(styleManifestFile));
      const duplicate = Boolean(sha256 && (hashes.get(sha256) || 0) > 1);
      const lowInformation = bytes > 0 && bytes < 1500;
      const externalAudienceLanguageOk = operatorFragments.length === 0;
      const issues = [
        ...(!pngFile || !existsSync(pngFile) ? ['image_page_png_missing'] : []),
        ...(!manifestPresent ? ['image_page_manifest_missing'] : []),
        ...(!ratioOk ? ['image_page_not_16_9'] : []),
        ...(!nonEmpty ? ['image_page_empty_png'] : []),
        ...(duplicate ? ['duplicate_image_hash'] : []),
        ...(lowInformation ? ['low_information_density_signal'] : []),
        ...manifestLeakIssues(promptManifest, styleManifest),
        ...(!externalAudienceLanguageOk ? ['operator_language_leak_detected'] : []),
        ...(!layoutMetrics.title_safe_zone_clear ? ['title_safe_zone_obstructed'] : []),
        ...(!layoutMetrics.table_legibility_ok ? ['table_font_below_minimum'] : []),
        ...(!layoutMetrics.layout_density_ok ? ['layout_density_too_sparse'] : []),
      ];
      return {
        slide_id: safeText(page.slide_id),
        title: safeText(page.title),
        layout_family: safeText(page.layout_family, 'image_page'),
        screenshot_file: pngFile,
        checks: {
          overflow_free: issues.length === 0,
          occlusion_free: issues.length === 0,
          visual_density_ok: !lowInformation && nonEmpty,
          speaker_fit_ok: true,
          edge_clearance_ok: ratioOk && nonEmpty,
          block_content_fit_ok: issues.length === 0,
          title_typography_ok: true,
          page_number_consistency_ok: true,
          external_audience_language_ok: externalAudienceLanguageOk,
          title_safe_zone_clear: layoutMetrics.title_safe_zone_clear,
          table_legibility_ok: layoutMetrics.table_legibility_ok,
          layout_density_ok: layoutMetrics.layout_density_ok,
        },
        metrics: {
          image_width: dimensions?.width || 0,
          image_height: dimensions?.height || 0,
          aspect_ratio: dimensions ? Number((dimensions.width / Math.max(dimensions.height, 1)).toFixed(4)) : null,
          title_font_size: 32,
          bytes,
          sha256: sha256 || null,
          duplicate_hash: duplicate,
          prompt_manifest_file: promptManifestFile || null,
          style_manifest_file: styleManifestFile || null,
          render_proof_source: 'image_pages_png_manifest',
          source_visual_route: safeText(imageArtifact?.route),
          operator_language_fragments: operatorFragments,
          title_safe_zone_clearance_ok: layoutMetrics.title_safe_zone_clear,
          table_min_font_pt: layoutMetrics.table_min_font_pt,
          table_min_font_threshold_pt: layoutMetrics.table_min_font_threshold_pt,
          card_blank_ratio: layoutMetrics.card_blank_ratio,
          card_blank_ratio_threshold: layoutMetrics.card_blank_ratio_threshold,
        },
        issues,
      };
    });
    return {
      source_surface_kind: 'image_pages',
      source_visual_route: safeText(imageArtifact?.route),
      page_count: pages.length,
      device_scale_factor: 1,
      screenshot_dimensions: null,
      checks: aggregateChecks(slideReviews),
      metrics: {
        page_count: pages.length,
        source_surface_kind: 'image_pages',
        source_visual_route: safeText(imageArtifact?.route),
        duplicate_hash_count: slideReviews.filter((slide) => slide.metrics.duplicate_hash).length,
        low_information_density_count: slideReviews.filter((slide) => slide.issues.includes('low_information_density_signal')).length,
      },
      slide_reviews: slideReviews,
    };
  }

  function summarizeImagePages(imageArtifact: JsonRecord | null): JsonRecord[] {
    return imagePagesList(imageArtifact).map((page) => ({
      slide_id: safeText(page.slide_id),
      title: safeText(page.title),
      layout_family: safeText(page.layout_family, 'image_page'),
      png_file: safeText(page.png_file),
      prompt_manifest_file: safeText(page.prompt_manifest_file),
      style_manifest_file: safeText(page.style_manifest_file),
    }));
  }

  return {
    currentImagePagesStageId,
    currentVisualStageId,
    imagePagesMechanicalReviewPayload,
    isImagePagesArtifact,
    readCurrentVisualArtifact,
    summarizeImagePages,
    visualArtifactMtimeMs,
  };
}
