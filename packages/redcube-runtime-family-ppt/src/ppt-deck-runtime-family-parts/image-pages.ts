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

  function parseCodexConfig(): JsonRecord {
    const configFile = path.join(process.env.CODEX_HOME || path.join(process.env.HOME || '', '.codex'), 'config.toml');
    if (!existsSync(configFile)) return {};
    const raw = readFileSync(configFile, 'utf-8');
    const modelProvider = raw.match(/^model_provider\s*=\s*"([^"]+)"/m)?.[1] || '';
    const model = raw.match(/^model\s*=\s*"([^"]+)"/m)?.[1] || '';
    const providerBlock = modelProvider
      ? raw.match(new RegExp(`\\[model_providers\\.${modelProvider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]([\\s\\S]*?)(?:\\n\\[|$)`))?.[1] || ''
      : '';
    return {
      provider: modelProvider,
      model,
      base_url: providerBlock.match(/base_url\s*=\s*"([^"]+)"/)?.[1] || '',
      token: providerBlock.match(/experimental_bearer_token\s*=\s*"([^"]+)"/)?.[1] || '',
    };
  }

  function resolveResponsesConfig(route: ImagePageRoute): JsonRecord {
    const codex = parseCodexConfig();
    const provider = safeText(process.env.REDCUBE_IMAGE_GENERATION_PROVIDER, safeText(codex.provider, 'codex_default'));
    const baseUrl = safeText(process.env.REDCUBE_IMAGE_GENERATION_BASE_URL, safeText(codex.base_url, 'https://api.openai.com/v1'));
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/responses`;
    const model = safeText(
      process.env.REDCUBE_IMAGE_GENERATION_MODEL,
      DEFAULT_IMAGE_MODEL,
    );
    const token = safeText(process.env.REDCUBE_IMAGE_GENERATION_TOKEN, safeText(codex.token));
    const host = (() => {
      try {
        return new URL(baseUrl).host;
      } catch {
        return '';
      }
    })();
    return { provider, base_url: baseUrl, base_url_host: host, endpoint, model, token };
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

  function slidePrompt({
    route,
    slide,
    visualDirection,
    styleManifest,
    promptTemplate,
    factGovernance,
    verifiedAssetPolicy,
    longDeckContract,
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
      `Do not invent QR codes, download links, DOI strings, logos, hospital names, patient demographics, publication status, page numbers, slide numbers, or chapter corner labels unless they are explicitly supplied by the source truth or verified asset policy.`,
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

  async function callResponsesImageGeneration({
    config,
    prompt,
    toolOptions,
    route,
    slideId,
  }: {
    config: JsonRecord;
    prompt: string;
    toolOptions: JsonRecord;
    route: ImagePageRoute;
    slideId: string;
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
    if (!safeText(config.token)) {
      throw new Error('Responses image_generation requires Codex provider token or REDCUBE_IMAGE_GENERATION_TOKEN');
    }
    const body = {
      model: safeText(config.model),
      input: prompt,
      tools: [toolOptions],
      tool_choice: { type: 'image_generation' },
    };
    const response = await fetch(safeText(config.endpoint), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${safeText(config.token)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Responses image_generation failed: ${response.status} ${await response.text()}`);
    }
    return response.json() as Promise<JsonRecord>;
  }

  function repairFeedbackFromReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
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
    const reviewArtifact = route === 'repair_image_pages'
      ? readStageArtifact(contract, deliverablePaths, 'screenshot_review')
      : null;
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
    const config = resolveResponsesConfig(route);
    const toolOptions = normalizeImageGenerationToolOptions(contract);
    const styleProfile = defaultStyleProfile();
    const promptTemplate = defaultPromptTemplate();
    const styleReferences = copyStyleReferences(contract, paths);
    const factGovernance = imageFactGovernance(contract);
    const verifiedAssetPolicy = verifiedAssetOverlayPolicy(contract);
    const longDeckContract = longDeckProductionContract(contract);
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
        repairFeedback: repairFeedbackById.get(slideId) || null,
      });
      const promptHash = sha256(prompt);
      const imageFile = path.join(paths.pageDir, `${slideId}.png`);
      const promptFile = path.join(paths.promptDir, `${slideId}.prompt.txt`);
      const promptManifestFile = path.join(paths.promptDir, `${slideId}.prompt.json`);
      const styleManifestFile = path.join(paths.styleDir, `${slideId}.style.json`);
      const response = await callResponsesImageGeneration({
        config,
        prompt,
        toolOptions,
        route,
        slideId,
      });
      const imageCall = responseImageCall(response);
      const imageBase64 = normalizeImageBase64(response);
      if (!imageBase64) throw new Error(`Responses image_generation did not return PNG data for ${slideId}`);
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
        endpoint: '/responses',
        request_model: safeText(config.model),
        default_image_model: DEFAULT_IMAGE_MODEL,
        image_generation_tool_options: toolOptions,
        response_id: safeText(response?.id),
        image_call_id: safeText(imageCall?.id),
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
      forbidden_generated_artifacts: safeArray(factGovernance?.forbidden_generated_artifacts)
        .map((item) => safeText(item))
        .filter(Boolean),
      prompts: promptEntries,
    });
    writeJson(paths.styleManifestFile, deckStyleManifest);
    writeJson(paths.metadataFile, { kind: 'ppt_image_generation_metadata', route, calls: generationMetadata });
    writeJson(paths.manifestFile, manifest);
    return {
      ...attachCommon(route, contract, null, adapter),
      status: 'completed',
      creative_execution: {
        ...creativeExecution(route, null, adapter),
        overlay: 'image_page_authoring',
      },
      image_generation_runtime: {
        provider: safeText(config.provider),
        base_url_host: safeText(config.base_url_host),
        endpoint: '/responses',
        request_model: safeText(config.model),
        tool_options: toolOptions,
        token_persisted: false,
      },
      image_pages_bundle: imagePagesBundle,
      image_page_manifest: manifest,
      image_generation_calls: generationMetadata,
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

  return {
    buildImagePagesArtifact,
  };
}
