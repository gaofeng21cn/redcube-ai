import path from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { generateImageViaCodexNativeImagegen } from '@redcube/codex-cli-client';

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

  function stableJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value as JsonRecord).sort().map((key) => (
        `${JSON.stringify(key)}:${stableJson((value as JsonRecord)[key])}`
      )).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function sha256(value: string | Buffer): string {
    return createHash('sha256').update(value).digest('hex');
  }

  function crc32(buffer: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pngChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  function solidPngBuffer(width: number, height: number, seed: string): Buffer {
    const seedHash = createHash('sha256').update(seed).digest();
    const background = [248, 246, 238];
    const accent = [seedHash[0], seedHash[1], seedHash[2]].map((value) => 80 + (value % 120));
    const contentLeft = Math.floor(width * 0.09);
    const contentRight = Math.floor(width * 0.91);
    const contentTop = Math.floor(height * 0.14);
    const contentBottom = Math.floor(height * 0.84);
    const bytesPerPixel = 4;
    const scanlineLength = 1 + (width * bytesPerPixel);
    const raw = Buffer.alloc(scanlineLength * height);
    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * scanlineLength;
      raw[rowOffset] = 0;
      for (let x = 0; x < width; x += 1) {
        const offset = rowOffset + 1 + (x * bytesPerPixel);
        const inSafeContent = x >= contentLeft && x <= contentRight && y >= contentTop && y <= contentBottom;
        const band = inSafeContent && (((x - contentLeft) + Math.floor((y - contentTop) * 0.8)) % 128) < 6;
        const marker = inSafeContent
          && (((Math.floor((x - contentLeft) / 52) + Math.floor((y - contentTop) / 44)) % 10) === 0);
        raw[offset] = band || marker ? accent[0] : background[0];
        raw[offset + 1] = band || marker ? accent[1] : background[1];
        raw[offset + 2] = band || marker ? accent[2] : background[2];
        raw[offset + 3] = 255;
      }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;
    return Buffer.concat([
      Buffer.from('89504e470d0a1a0a', 'hex'),
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', deflateSync(raw)),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }

  function pngDimensions(buffer: Buffer): { width: number; height: number } {
    if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
    return { width: CANVAS.width, height: CANVAS.height };
  }

  function readJsonIfPresent(file: string): JsonRecord {
    if (!file || !existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
  }

  function promptAssetPath(assetPath: string): string {
    if (typeof resolvePromptPackAsset === 'function') {
      return resolvePromptPackAsset(assetPath);
    }
    return path.join(process.cwd(), assetPath);
  }

  function imagePagePaths(deliverablePaths: JsonRecord, deliverableId: string, route: ImagePageRoute) {
    const root = ensureDir(path.join(deliverablePaths.artifactsDir, 'image_pages'));
    const pageDir = ensureDir(path.join(root, route));
    const promptDir = ensureDir(path.join(pageDir, 'prompt_manifests'));
    const styleDir = ensureDir(path.join(pageDir, 'style_manifests'));
    const referenceDir = ensureDir(path.join(pageDir, 'style_references'));
    const basename = `${deliverableId}-${route}`;
    return {
      root,
      pageDir,
      promptDir,
      styleDir,
      referenceDir,
      manifestFile: path.join(root, `${basename}-manifest.json`),
      promptManifestFile: path.join(root, `${basename}-prompts.json`),
      styleManifestFile: path.join(root, `${basename}-style.json`),
      metadataFile: path.join(root, `${basename}-generation-metadata.json`),
    };
  }

  function normalizeImageGenerationToolOptions(contract: JsonRecord): JsonRecord {
    const fromContract = contract?.image_generation || contract?.render_contract?.image_generation || {};
    return {
      type: 'image_generation',
      size: safeText(fromContract?.size, DEFAULT_IMAGE_SIZE),
      quality: safeText(fromContract?.quality, 'high'),
      format: safeText(fromContract?.format, 'png'),
      background: safeText(fromContract?.background, 'opaque'),
    };
  }

  function resolveImageGenerationConfig(route: ImagePageRoute): JsonRecord {
    if (process.env.REDCUBE_IMAGE_GENERATION_MOCK === '1') {
      return {
        provider: 'mock_responses_image_generation',
        base_url_host: 'mock',
        endpoint: '/responses',
        model: DEFAULT_IMAGE_MODEL,
      };
    }
    return {
      provider: 'codex_native_imagegen',
      base_url_host: 'codex_executor',
      endpoint: 'codex_native_imagegen_skill',
      model: 'codex_native_imagegen',
    };
  }

  function defaultStyleProfile(): JsonRecord {
    const profileFile = promptAssetPath(DEFAULT_STYLE_PROFILE_ASSET);
    return {
      profile_file: profileFile,
      profile_hash: existsSync(profileFile) ? sha256(readFileSync(profileFile)) : '',
      profile: readJsonIfPresent(profileFile),
    };
  }

  function defaultPromptTemplate(): { file: string; hash: string; text: string } {
    const templateFile = promptAssetPath(DEFAULT_PROMPT_TEMPLATE_ASSET);
    const text = existsSync(templateFile) ? readFileSync(templateFile, 'utf-8') : '';
    return {
      file: templateFile,
      hash: text ? sha256(text) : '',
      text,
    };
  }

  function candidateStyleReferenceDir(contract: JsonRecord): string {
    return safeText(
      contract?.delivery_request?.style_reference_dir
        || contract?.style_reference_dir
        || contract?.render_contract?.image_first_page_authoring?.style_reference_dir
        || contract?.prompt_pack?.render_contract?.image_first_page_authoring?.style_reference_dir
        || process.env.REDCUBE_IMAGE_PPT_STYLE_REFERENCE_DIR,
    );
  }

  function copyStyleReferences(contract: JsonRecord, paths: JsonRecord): JsonRecord {
    const requestedDir = candidateStyleReferenceDir(contract);
    if (!requestedDir) {
      return {
        mode: 'repo_default_style_profile',
        requested_dir_hash: null,
        copied_files: [],
      };
    }
    if (!existsSync(requestedDir) || !statSync(requestedDir).isDirectory()) {
      return {
        mode: 'user_style_reference_dir_blocked',
        requested_dir_hash: sha256(requestedDir),
        blocked_reason: 'style_reference_dir_missing_or_not_directory',
        copied_files: [],
      };
    }
    const copiedFiles = readdirSync(requestedDir)
      .filter((name) => REFERENCE_IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .slice(0, 16)
      .map((name) => {
        const sourceFile = path.join(requestedDir, name);
        const targetFile = path.join(paths.referenceDir, name);
        copyFileSync(sourceFile, targetFile);
        const bytes = readFileSync(targetFile);
        const dimensions = pngDimensions(bytes);
        return {
          file_name: name,
          copied_file: targetFile,
          sha256: sha256(bytes),
          bytes: bytes.length,
          dimensions,
        };
      });
    return {
      mode: copiedFiles.length > 0 ? 'user_style_reference_dir' : 'user_style_reference_dir_empty',
      requested_dir_hash: sha256(requestedDir),
      copied_files: copiedFiles,
      authorization_notice: 'Operator supplied style references are copied into this deliverable artifact store for local style grounding.',
    };
  }

  function imageAuthoringLane(contract: JsonRecord): JsonRecord {
    return contract?.prompt_pack?.render_contract?.image_page_authoring_lane
      || contract?.render_contract?.image_page_authoring_lane
      || {};
  }

  function imageFactGovernance(contract: JsonRecord): JsonRecord {
    const lane = imageAuthoringLane(contract);
    return lane?.fact_governance || {};
  }

  function verifiedAssetOverlayPolicy(contract: JsonRecord): JsonRecord {
    const lane = imageAuthoringLane(contract);
    return lane?.verified_asset_overlay_policy || {};
  }

  function longDeckProductionContract(contract: JsonRecord): JsonRecord {
    const lane = imageAuthoringLane(contract);
    return lane?.long_deck_production_contract || {};
  }

  function audienceLanguagePolicy(contract: JsonRecord): JsonRecord {
    const lane = imageAuthoringLane(contract);
    return lane?.audience_language_policy || {};
  }

  function layoutLegibilityPolicy(contract: JsonRecord): JsonRecord {
    const lane = imageAuthoringLane(contract);
    return lane?.layout_legibility_policy || {};
  }

  function slidePrompt({
    route,
    slide,
    visualDirection,
    styleManifest,
    promptTemplate,
    factGovernance,
    verifiedAssetPolicy,
    longDeckContract,
    audiencePolicy,
    layoutLegibility,
    repairFeedback,
  }: {
    route: ImagePageRoute;
    slide: JsonRecord;
    visualDirection: JsonRecord;
    styleManifest: JsonRecord;
    promptTemplate: string;
    factGovernance: JsonRecord;
    verifiedAssetPolicy: JsonRecord;
    longDeckContract: JsonRecord;
    audiencePolicy: JsonRecord;
    layoutLegibility: JsonRecord;
    repairFeedback: JsonRecord | null;
  }): string {
    return [
      promptTemplate || `Create a polished 16:9 presentation page as a single PNG image.`,
      `Hard requirement: output one complete 16:9 PPT slide page visual as a single PNG, not loose elements or a component sheet.`,
      `Route: ${route}.`,
      `Slide ID: ${safeText(slide?.slide_id)}.`,
      `Title: ${safeText(slide?.title)}.`,
      `Core sentence: ${safeText(slide?.core_sentence || slide?.page_goal || slide?.page_objective)}.`,
      `Layout family: ${safeText(slide?.layout_family)}.`,
      `Visual direction: ${stableJson(visualDirection).slice(0, 3000)}.`,
      `Style system: ${stableJson(styleManifest).slice(0, 2600)}.`,
      `Fact governance: visible factual claims must follow this contract: ${stableJson(factGovernance).slice(0, 1600)}.`,
      `Verified asset overlay policy: ${stableJson(verifiedAssetPolicy).slice(0, 1600)}.`,
      `Long deck production contract: ${stableJson(longDeckContract).slice(0, 1600)}.`,
      `Audience language policy: ${stableJson(audiencePolicy).slice(0, 1600)}.`,
      `Layout legibility policy: ${stableJson(layoutLegibility).slice(0, 1600)}.`,
      `Do not invent QR codes, download links, DOI strings, logos, hospital names, patient demographics, publication status, page numbers, slide numbers, or chapter corner labels unless they are explicitly supplied by the source truth or verified asset policy.`,
      `Keep the title safe zone clear: no section chip, tag, card, badge, or decorative label may overlap or compete with the main title area.`,
      `Use project-facing audience language only. Do not place operator notes, internal process labels, local filenames, route names, prompt names, RCA/RedCube/source-intake references, or instructions about what not to expose into the visible slide.`,
      `Tables must stay readable: body text at or above 11pt equivalent, compact cell padding, and no sparse oversized cards or empty table panels.`,
      repairFeedback ? `Repair feedback: ${stableJson(repairFeedback).slice(0, 1200)}.` : '',
      `No UI chrome, no speaker notes, no internal metadata. Use clear readable text inside the page.`,
    ].filter(Boolean).join('\n');
  }

  function normalizeImageBase64(response: JsonRecord): string {
    const output = safeArray(response?.output);
    for (const item of output) {
      if (safeText(item?.type) === 'image_generation_call') {
        const result = safeText(item?.result);
        if (result) return result.replace(/^data:image\/png;base64,/, '');
      }
      for (const content of safeArray(item?.content)) {
        const image = safeText(content?.image_base64 || content?.b64_json);
        if (image) return image.replace(/^data:image\/png;base64,/, '');
      }
    }
    return safeText(response?.image_base64 || response?.b64_json || response?.data?.[0]?.b64_json)
      .replace(/^data:image\/png;base64,/, '');
  }

  function responseImageCall(response: JsonRecord): JsonRecord {
    return safeArray(response?.output).find((item) => safeText(item?.type) === 'image_generation_call') || {};
  }

  async function callImageGeneration({
    config,
    prompt,
    toolOptions,
    route,
    slideId,
    imageFile,
  }: {
    config: JsonRecord;
    prompt: string;
    toolOptions: JsonRecord;
    route: ImagePageRoute;
    slideId: string;
    imageFile: string;
  }): Promise<JsonRecord> {
    if (process.env.REDCUBE_IMAGE_GENERATION_MOCK === '1') {
      const mockBytes = solidPngBuffer(1536, 864, `${route}:${slideId}:${prompt}`);
      return {
        id: `resp_mock_${sha256(`${route}:${slideId}:${prompt}`).slice(0, 16)}`,
        output: [{
          type: 'image_generation_call',
          id: `ig_mock_${sha256(`${slideId}:${prompt}`).slice(0, 16)}`,
          revised_prompt: prompt,
          result: mockBytes.toString('base64'),
        }],
      };
    }
    const result = await generateImageViaCodexNativeImagegen({
      family: 'ppt_deck',
      route,
      slideId,
      prompt,
      outputFile: imageFile,
      toolOptions,
    });
    return {
      id: safeText(result?.generationRuntime?.run_id, `codex_imagegen_${sha256(`${route}:${slideId}:${prompt}`).slice(0, 16)}`),
      codex_native_imagegen_runtime: result.generationRuntime,
      output: [{
        type: 'image_generation_call',
        id: `codex_imagegen_${sha256(`${slideId}:${prompt}`).slice(0, 16)}`,
        revised_prompt: prompt,
        result: result.imageBytes.toString('base64'),
      }],
    };
  }

  function repairFeedbackFromReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
    const explicitBlockedSlideIds = new Set(
      safeArray(reviewArtifact?.blocked_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    );
    const slideReviews = safeArray(reviewArtifact?.slide_reviews);
    const targetedSlides = explicitBlockedSlideIds.size > 0
      ? slideReviews.filter((slide) => explicitBlockedSlideIds.has(safeText(slide?.slide_id)))
      : collectSlidesNeedingTargetedRevision(slideReviews);
    const rerunFromStage = safeText(reviewArtifact?.review_state_patch?.rerun_from_stage)
      || (
        safeText(reviewArtifact?.review_state_patch?.rerun_policy?.status) === 'rerun_required'
          ? safeText(reviewArtifact?.review_state_patch?.rerun_policy?.rerun_from_stage)
          : ''
      );
    const reviewedSlideIds = new Set(
      safeArray(reviewArtifact?.review_execution?.reviewed_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const fallbackSlides = targetedSlides.length > 0 || rerunFromStage !== 'repair_image_pages'
      ? []
      : slideReviews.filter((slide) => {
        const slideId = safeText(slide?.slide_id);
        return slideId && (reviewedSlideIds.size === 0 || reviewedSlideIds.has(slideId));
      });
    const directorWeakPages = safeArray(reviewArtifact?.visual_director_review?.weak_pages)
      .map((slideId) => safeText(slideId))
      .filter(Boolean);
    const directorFallbackSlideIds = slideReviews.length > 0 || rerunFromStage !== 'repair_image_pages'
      ? []
      : (directorWeakPages.length > 0 ? directorWeakPages : [...reviewedSlideIds]);
    const directorFallbackSlides = directorFallbackSlideIds.map((slideId) => ({
      slide_id: slideId,
      title: '',
      issues: safeArray(reviewArtifact?.review_state_patch?.blocking_reasons),
      mechanical_issues: [],
      ai_review: {
        visual_findings: [
          safeText(reviewArtifact?.visual_director_review?.review_summary),
        ].filter(Boolean),
        recommended_fix: safeText(
          reviewArtifact?.visual_director_review?.rewrite_action,
          'Regenerate the page so the visual director review blocking reasons are resolved.',
        ),
      },
    }));
    const feedbackSlides = targetedSlides.length > 0
      ? targetedSlides
      : (fallbackSlides.length > 0 ? fallbackSlides : directorFallbackSlides);
    return feedbackSlides
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        issues: [
          ...safeArray(slide?.issues).map((issue) => safeText(issue)).filter(Boolean),
          ...safeArray(reviewArtifact?.review_state_patch?.blocking_reasons)
            .map((issue) => safeText(issue))
            .filter(Boolean),
        ],
        mechanical_issues: safeArray(slide?.mechanical_issues).map((issue) => safeText(issue)).filter(Boolean),
        visual_findings: safeArray(slide?.ai_review?.visual_findings).map((item) => safeText(item)).filter(Boolean),
        recommended_fix: safeText(
          slide?.ai_review?.recommended_fix,
          'Revise the page so the deck-level screenshot review blocking reasons are resolved.',
        ),
      }))
      .filter((slide) => slide.slide_id);
  }

  function repairReviewRerunFromStage(reviewArtifact: JsonRecord | null): string {
    return safeText(reviewArtifact?.review_state_patch?.rerun_from_stage)
      || (
        safeText(reviewArtifact?.review_state_patch?.rerun_policy?.status) === 'rerun_required'
          ? safeText(reviewArtifact?.review_state_patch?.rerun_policy?.rerun_from_stage)
          : ''
      );
  }

  function repairReviewSource(contract: JsonRecord, deliverablePaths: JsonRecord): {
    stageId: string;
    artifact: JsonRecord | null;
  } {
    for (const stageId of ['screenshot_review', 'visual_director_review']) {
      const artifact = readStageArtifact(contract, deliverablePaths, stageId);
      if (safeText(artifact?.status) === 'block'
        && repairReviewRerunFromStage(artifact) === 'repair_image_pages') {
        return { stageId, artifact };
      }
    }
    return {
      stageId: 'screenshot_review',
      artifact: readStageArtifact(contract, deliverablePaths, 'screenshot_review'),
    };
  }

  function priorImagePageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null {
    return readStageArtifact(contract, deliverablePaths, 'repair_image_pages')
      || readStageArtifact(contract, deliverablePaths, 'author_image_pages');
  }

  function imageSlidesById(artifact: JsonRecord | null): Map<string, JsonRecord> {
    const slides: JsonRecord[] = safeArray(artifact?.image_pages_bundle?.pages || artifact?.image_page_manifest?.slides)
      .map((slide: JsonRecord) => ({
        ...slide,
        image_file: safeText(slide?.image_file || slide?.png_file),
        png_file: safeText(slide?.png_file || slide?.image_file),
        hash: safeText(slide?.hash || slide?.sha256),
      }));
    return new Map(slides.map((slide) => [safeText(slide?.slide_id), slide]));
  }

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
