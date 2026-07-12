// @ts-nocheck
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { generateImageViaCodexNativeImagegen } from '../../../executors/codex-caller.js';
import { solidPngFixture } from '../../../testing/solid-png-fixture.js';

const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1086x1448';
const DEFAULT_STYLE_PROFILE_ASSET = 'prompts/xiaohongshu/image-first-default-style-profile.json';
const DEFAULT_STYLE_REFERENCE_DIR = 'prompts/xiaohongshu/style-references/medical-handdrawn-note-default';
const DEFAULT_PROMPT_TEMPLATE_ASSET = 'prompts/xiaohongshu/image_first_prompt_template.md';
const REFERENCE_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export function createXiaohongshuImagePageRuntimeHelpers(deps) {
  const {
    CANVAS,
    ensureDir,
    safeText,
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

  function readJsonIfPresent(file) {
    if (!file || !existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf-8'));
  }

  function defaultStyleProfile(contract) {
    const fromContract = contract?.prompt_pack?.render_contract?.image_generation || contract?.image_generation || {};
    const profileAsset = safeText(fromContract?.default_style_profile, DEFAULT_STYLE_PROFILE_ASSET);
    const profileFile = promptAssetPath(profileAsset);
    const bytes = existsSync(profileFile) ? readFileSync(profileFile) : Buffer.alloc(0);
    return {
      profile_file: profileFile,
      profile_hash: bytes.length > 0 ? sha256(bytes) : '',
      profile: readJsonIfPresent(profileFile),
    };
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

  function imageGenerationConfig() {
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

  function styleReferenceDirPolicy(contract) {
    const fromContract = contract?.prompt_pack?.render_contract?.image_generation || contract?.image_generation || {};
    const userDir = safeText(
      contract?.delivery_request?.style_reference_dir
        || contract?.style_reference_dir
        || fromContract?.style_reference_dir
        || process.env.REDCUBE_XHS_STYLE_REFERENCE_DIR
        || process.env.REDCUBE_IMAGE_PPT_STYLE_REFERENCE_DIR,
    );
    const builtInDir = safeText(fromContract?.built_in_style_reference_dir, DEFAULT_STYLE_REFERENCE_DIR);
    return {
      requestedDir: userDir,
      builtInDir,
      effectiveDir: userDir || builtInDir,
      sourceMode: userDir ? 'user_style_reference_dir' : 'built_in_style_reference_template',
      shouldCopyToArtifact: Boolean(userDir),
    };
  }

  function copyStyleReferences(contract, paths) {
    const policy = styleReferenceDirPolicy(contract);
    const referenceDir = promptAssetPath(policy.effectiveDir);
    if (!referenceDir || !existsSync(referenceDir) || !statSync(referenceDir).isDirectory()) {
      return {
        mode: policy.requestedDir ? 'user_style_reference_dir_blocked' : 'built_in_style_reference_dir_blocked',
        requested_dir_hash: policy.requestedDir ? sha256(policy.requestedDir) : null,
        built_in_dir_hash: policy.builtInDir ? sha256(policy.builtInDir) : null,
        blocked_reason: 'style_reference_dir_missing_or_not_directory',
        copied_files: [],
      };
    }
    const referenceFiles = readdirSync(referenceDir)
      .filter((name) => REFERENCE_IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .slice(0, 16)
      .map((name) => {
        const sourceFile = path.join(referenceDir, name);
        const targetFile = policy.shouldCopyToArtifact ? path.join(paths.referenceDir, name) : '';
        if (policy.shouldCopyToArtifact) copyFileSync(sourceFile, targetFile);
        const bytes = readFileSync(policy.shouldCopyToArtifact ? targetFile : sourceFile);
        return {
          file_name: name,
          repo_reference: policy.shouldCopyToArtifact ? '' : path.posix.join(policy.effectiveDir, name),
          copied_file: targetFile,
          sha256: sha256(bytes),
          bytes: bytes.length,
          dimensions: pngDimensions(bytes),
        };
      });
    return {
      mode: referenceFiles.length > 0 ? policy.sourceMode : `${policy.sourceMode}_empty`,
      requested_dir_hash: policy.requestedDir ? sha256(policy.requestedDir) : null,
      built_in_dir_hash: policy.builtInDir ? sha256(policy.builtInDir) : null,
      effective_dir_hash: sha256(policy.effectiveDir),
      copied_files: referenceFiles.filter((item) => safeText(item?.copied_file)),
      built_in_reference_files: policy.shouldCopyToArtifact ? [] : referenceFiles,
      reference_scope: 'visual_style_only',
      artifact_materialization: policy.shouldCopyToArtifact ? 'copied_operator_references' : 'repo_builtin_reference_manifest_only',
      author_identity_policy: {
        built_in_references_visible_author_identity_allowed: false,
        user_references_must_not_be_copied_for_author_identity: true,
      },
      authorization_notice: policy.requestedDir
        ? 'Operator supplied style references replace built-in RCA references in the style manifest for visual grounding only.'
        : 'RCA built-in naturally no-author style references are recorded in the style manifest for local style grounding and audit without copying reference PNGs into the deliverable artifact store.',
    };
  }

  function styleReferenceFileCount(styleReferences) {
    const safeArray = Array.isArray;
    const copied = safeArray(styleReferences?.copied_files) ? styleReferences.copied_files : [];
    const builtIn = safeArray(styleReferences?.built_in_reference_files) ? styleReferences.built_in_reference_files : [];
    return copied.length + builtIn.length;
  }

  function normalizeImageBase64(response) {
    const output = Array.isArray(response?.output) ? response.output : [];
    for (const item of output) {
      if (safeText(item?.type) === 'image_generation_call') {
        const result = safeText(item?.result);
        if (result) return result.replace(/^data:image\/png;base64,/, '');
      }
      for (const content of Array.isArray(item?.content) ? item.content : []) {
        const image = safeText(content?.image_base64 || content?.b64_json);
        if (image) return image.replace(/^data:image\/png;base64,/, '');
      }
    }
    return safeText(response?.image_base64 || response?.b64_json || response?.data?.[0]?.b64_json)
      .replace(/^data:image\/png;base64,/, '');
  }

  function responseImageCall(response) {
    return (Array.isArray(response?.output) ? response.output : [])
      .find((item) => safeText(item?.type) === 'image_generation_call') || {};
  }

  async function callImageGeneration({ config, prompt, toolOptions, route, slideId, imageFile }) {
    if (process.env.REDCUBE_IMAGE_GENERATION_MOCK === '1') {
      const failedSlideIds = new Set(
        safeText(process.env.REDCUBE_IMAGE_GENERATION_MOCK_FAIL_SLIDE_IDS)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      );
      if (failedSlideIds.has(slideId)) {
        throw new Error(`mock image generation failed for ${slideId}`);
      }
      const mockBytes = solidPngFixture(CANVAS.width, CANVAS.height, `${route}:${slideId}:${prompt}`);
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
      family: 'xiaohongshu',
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

  return {
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
  };
}
