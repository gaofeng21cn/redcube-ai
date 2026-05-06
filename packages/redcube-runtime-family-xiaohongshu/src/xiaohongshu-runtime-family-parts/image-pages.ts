// @ts-nocheck
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

const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1086x1448';
const DEFAULT_PROMPT_TEMPLATE_ASSET = 'prompts/xiaohongshu/image_first_prompt_template.md';
const REFERENCE_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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

  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function sha256(value) {
    return createHash('sha256').update(value).digest('hex');
  }

  function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pngChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  function solidPngBuffer(width, height, seed) {
    const seedHash = createHash('sha256').update(seed).digest();
    const background = [255, 250, 240];
    const accent = [seedHash[0], seedHash[1], seedHash[2]].map((value) => 90 + (value % 120));
    const contentLeft = Math.floor(width * 0.08);
    const contentRight = Math.floor(width * 0.92);
    const contentTop = Math.floor(height * 0.08);
    const contentBottom = Math.floor(height * 0.9);
    const scanlineLength = 1 + (width * 4);
    const raw = Buffer.alloc(scanlineLength * height);
    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * scanlineLength;
      raw[rowOffset] = 0;
      for (let x = 0; x < width; x += 1) {
        const offset = rowOffset + 1 + (x * 4);
        const inContent = x >= contentLeft && x <= contentRight && y >= contentTop && y <= contentBottom;
        const band = inContent && (((x - contentLeft) + Math.floor((y - contentTop) * 0.55)) % 118) < 7;
        const dot = inContent && (((Math.floor((x - contentLeft) / 42) + Math.floor((y - contentTop) / 58)) % 11) === 0);
        raw[offset] = band || dot ? accent[0] : background[0];
        raw[offset + 1] = band || dot ? accent[1] : background[1];
        raw[offset + 2] = band || dot ? accent[2] : background[2];
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

  function pngDimensions(buffer) {
    if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    }
    return { width: CANVAS.width, height: CANVAS.height };
  }

  function promptAssetPath(assetPath) {
    return path.isAbsolute(assetPath) ? assetPath : path.join(process.cwd(), assetPath);
  }

  function defaultPromptTemplate() {
    const templateFile = promptAssetPath(DEFAULT_PROMPT_TEMPLATE_ASSET);
    const text = existsSync(templateFile) ? readFileSync(templateFile, 'utf-8') : '';
    return { file: templateFile, hash: text ? sha256(text) : '', text };
  }

  function imagePagePaths(deliverablePaths, deliverableId, route) {
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

  function parseCodexConfig() {
    const configFile = path.join(process.env.CODEX_HOME || path.join(process.env.HOME || '', '.codex'), 'config.toml');
    if (!existsSync(configFile)) return {};
    const raw = readFileSync(configFile, 'utf-8');
    const modelProvider = raw.match(/^model_provider\s*=\s*"([^"]+)"/m)?.[1] || '';
    const providerBlock = modelProvider
      ? raw.match(new RegExp(`\\[model_providers\\.${modelProvider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]([\\s\\S]*?)(?:\\n\\[|$)`))?.[1] || ''
      : '';
    return {
      provider: modelProvider,
      base_url: providerBlock.match(/base_url\s*=\s*"([^"]+)"/)?.[1] || '',
      token: providerBlock.match(/experimental_bearer_token\s*=\s*"([^"]+)"/)?.[1] || '',
    };
  }

  function responsesConfig() {
    const codex = parseCodexConfig();
    const provider = safeText(process.env.REDCUBE_IMAGE_GENERATION_PROVIDER, safeText(codex.provider, 'codex_default'));
    const baseUrl = safeText(process.env.REDCUBE_IMAGE_GENERATION_BASE_URL, safeText(codex.base_url, 'https://api.openai.com/v1'));
    const model = safeText(process.env.REDCUBE_IMAGE_GENERATION_MODEL, DEFAULT_IMAGE_MODEL);
    const token = safeText(process.env.REDCUBE_IMAGE_GENERATION_TOKEN, safeText(codex.token));
    const host = (() => {
      try {
        return new URL(baseUrl).host;
      } catch {
        return '';
      }
    })();
    return {
      provider,
      base_url: baseUrl,
      base_url_host: host,
      endpoint: `${baseUrl.replace(/\/+$/, '')}/responses`,
      model,
      token,
    };
  }

  function imageGenerationToolOptions(contract) {
    const fromContract = contract?.prompt_pack?.render_contract?.image_generation || contract?.image_generation || {};
    return {
      type: 'image_generation',
      size: safeText(fromContract?.size, DEFAULT_IMAGE_SIZE),
      quality: safeText(fromContract?.quality, 'high'),
      format: safeText(fromContract?.format, 'png'),
      background: safeText(fromContract?.background, 'opaque'),
    };
  }

  function candidateStyleReferenceDir(contract) {
    return safeText(
      contract?.delivery_request?.style_reference_dir
        || contract?.style_reference_dir
        || contract?.prompt_pack?.render_contract?.image_generation?.style_reference_dir
        || process.env.REDCUBE_XHS_STYLE_REFERENCE_DIR
        || process.env.REDCUBE_IMAGE_PPT_STYLE_REFERENCE_DIR,
    );
  }

  function copyStyleReferences(contract, paths) {
    const requestedDir = candidateStyleReferenceDir(contract);
    if (!requestedDir) {
      return { mode: 'repo_default_style_profile', requested_dir_hash: null, copied_files: [] };
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
        return {
          file_name: name,
          copied_file: targetFile,
          sha256: sha256(bytes),
          bytes: bytes.length,
          dimensions: pngDimensions(bytes),
        };
      });
    return {
      mode: copiedFiles.length > 0 ? 'user_style_reference_dir' : 'user_style_reference_dir_empty',
      requested_dir_hash: sha256(requestedDir),
      copied_files: copiedFiles,
      authorization_notice: 'Operator supplied style references are copied into this deliverable artifact store for local style grounding.',
    };
  }

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
      'Reference images are style anchors only; do not copy their facts, logos, page numbers, QR codes, institutions, or disease objects.',
      'No UI chrome, no internal metadata, no prompt labels. Use safe margins and readable Chinese text.',
    ].filter(Boolean).join('\n');
  }

  function normalizeImageBase64(response) {
    for (const item of safeArray(response?.output)) {
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

  function responseImageCall(response) {
    return safeArray(response?.output).find((item) => safeText(item?.type) === 'image_generation_call') || {};
  }

  async function callResponsesImageGeneration({ config, prompt, toolOptions, route, slideId }) {
    if (process.env.REDCUBE_IMAGE_GENERATION_MOCK === '1') {
      const mockBytes = solidPngBuffer(CANVAS.width, CANVAS.height, `${route}:${slideId}:${prompt}`);
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
    const response = await fetch(safeText(config.endpoint), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${safeText(config.token)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: safeText(config.model),
        input: prompt,
        tools: [toolOptions],
        tool_choice: { type: 'image_generation' },
      }),
    });
    if (!response.ok) {
      throw new Error(`Responses image_generation failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
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
    const config = responsesConfig();
    const toolOptions = imageGenerationToolOptions(contract);
    const promptTemplate = defaultPromptTemplate();
    const styleReferences = copyStyleReferences(contract, paths);
    const styleManifest = {
      kind: 'xiaohongshu_image_first_style_manifest',
      route,
      source_visual_route: route,
      prompt_template_file: promptTemplate.file,
      prompt_template_hash: promptTemplate.hash,
      style_reference: styleReferences,
      visual_direction_hash: sha256(stableJson(visualArtifact?.visual_direction || {})),
      fact_copy_guard: {
        reference_images_style_only: true,
        fact_whitelist_source: 'single_note_plan.page_core_content',
      },
      generated_at: new Date().toISOString(),
    };
    const promptEntries = [];
    const generationMetadata = [];
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
        throw new Error(`repair_image_pages requires prior image page for preserved slide: ${slideId}`);
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
      dimensions: { width: CANVAS.width, height: CANVAS.height, ratio: safeText(CANVAS.ratio, '3:4') },
      slides: bundlePages,
      prompt_manifest: paths.promptManifestFile,
      style_manifest: paths.styleManifestFile,
      generation_metadata_file: paths.metadataFile,
      preserved_slide_hashes: preservedSlideHashes,
    };
    writeJson(paths.promptManifestFile, { kind: 'xiaohongshu_image_page_prompt_manifest', route, prompts: promptEntries });
    writeJson(paths.styleManifestFile, styleManifest);
    writeJson(paths.metadataFile, { kind: 'xiaohongshu_image_generation_metadata', route, calls: generationMetadata });
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

  return { buildImagePagesArtifact };
}
