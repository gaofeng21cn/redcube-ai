import path from 'node:path';
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

type JsonRecord = Record<string, any>;
type ImagePageRoute = 'author_image_pages' | 'repair_image_pages';

interface ImagePagePromptStyleDeps {
  DEFAULT_IMAGE_MODEL: string;
  DEFAULT_IMAGE_SIZE: string;
  DEFAULT_PROMPT_TEMPLATE_ASSET: string;
  DEFAULT_STYLE_PROFILE_ASSET: string;
  REFERENCE_IMAGE_EXTENSIONS: Set<string>;
  ensureDir(dir: string): string;
  pngDimensions(buffer: Buffer): { width: number; height: number };
  resolvePromptPackAsset?(assetPath: string): string;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  sha256(value: string | Buffer): string;
  stableJson(value: unknown): string;
}

export function createImagePagePromptStyleParts({
  DEFAULT_IMAGE_MODEL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_PROMPT_TEMPLATE_ASSET,
  DEFAULT_STYLE_PROFILE_ASSET,
  REFERENCE_IMAGE_EXTENSIONS,
  ensureDir,
  pngDimensions,
  resolvePromptPackAsset,
  safeArray,
  safeText,
  sha256,
  stableJson,
}: ImagePagePromptStyleDeps) {
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

  return {
    audienceLanguagePolicy,
    copyStyleReferences,
    defaultPromptTemplate,
    defaultStyleProfile,
    imageFactGovernance,
    imagePagePaths,
    layoutLegibilityPolicy,
    longDeckProductionContract,
    normalizeImageGenerationToolOptions,
    resolveImageGenerationConfig,
    slidePrompt,
    verifiedAssetOverlayPolicy,
  };
}
