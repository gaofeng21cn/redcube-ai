// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import {
  canonicalStageForRoute,
  readStageFolderArtifact,
  stageFolderArtifactPath,
  stageOrderForCanonicalStage,
} from '@redcube/runtime-protocol';
import { readJson, writeJson } from '../../../runtime-utils.js';

function safeText(value, fallback = '') {
  const text = String(value ?? '').replace(/\uFFFD+/g, '').trim();
  return text || fallback;
}

export { safeText as pptSafeText };

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function createPptDeckCoreHelpers({
  REPO_ROOT,
  PROMPT_PACK,
  STAGE_REQUIREMENTS,
  MIN_REVIEW_QA_BLOCKS,
  MIN_REVIEW_PRIMARY_POINTS,
  PAGE_FIX_ROUTE,
}) {
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function chunkArray(items, size) {
    const source = safeArray(items);
    const batchSize = Math.max(Number(size) || 1, 1);
    const batches = [];
    for (let index = 0; index < source.length; index += batchSize) {
      batches.push(source.slice(index, index + batchSize));
    }
    return batches;
  }

  function normalizeInlineText(value, maxLength = 220) {
    return safeText(value).replace(/\s+/g, ' ').slice(0, maxLength);
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtmlAttribute(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeTemplate(text) {
    return String(text || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }

  function countMatches(text, pattern) {
    const matches = String(text || '').match(pattern);
    return matches ? matches.length : 0;
  }

  function upsertHtmlAttribute(tag, name, value) {
    const attrPattern = new RegExp(`\\s${name}=(["']).*?\\1`, 'i');
    const serialized = ` ${name}="${escapeHtmlAttribute(value)}"`;
    if (attrPattern.test(tag)) {
      return tag.replace(attrPattern, serialized);
    }
    return tag.replace(/\/?>$/, (suffix) => `${serialized}${suffix}`);
  }

  function hydrateRenderedSlideRootMetadata(html, metadata, slideId) {
    const rootTagMatch = String(html || '').match(/<[^>]+data-slide-root=(["'])true\1[^>]*>/i);
    if (!rootTagMatch) {
      throw new Error(`ppt render_html slide missing data-slide-root=true: ${slideId}`);
    }
    let rootTag = rootTagMatch[0];
    for (const [name, value] of Object.entries(metadata || {})) {
      if (value === undefined || value === null || value === '') continue;
      rootTag = upsertHtmlAttribute(rootTag, name, value);
    }
    return String(html || '').replace(rootTagMatch[0], rootTag);
  }

  function validateRenderedReviewAnchors(html, slideId, familyLabel = 'ppt') {
    const qaBlocks = countMatches(html, /data-qa-block=(["'])[^"']+\1/gi);
    if (qaBlocks < MIN_REVIEW_QA_BLOCKS) {
      throw new Error(`${familyLabel} render_html slide missing required data-qa-block anchors: ${slideId}`);
    }
    const primaryPoints = countMatches(html, /data-primary-point=(["'])true\1/gi);
    if (primaryPoints < MIN_REVIEW_PRIMARY_POINTS) {
      throw new Error(`${familyLabel} render_html slide missing required data-primary-point=true anchor: ${slideId}`);
    }
    return html;
  }

  function buildDeckHtml({ title, slidesMarkup, renderPlan, renderStrategy, shellText }) {
    const slidesLiteral = `\n[${slidesMarkup.map((slide) => `\n  { slideId: '${slide.slide_id}', slideNo: ${Number(slide.slide_no || 0)}, title: ${JSON.stringify(slide.title)}, layoutFamily: '${slide.layout_family}', recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', speakerSeconds: ${Number(slide.speaker_seconds || 0)}, peakPage: ${slide.director_contract?.peak_page ? 'true' : 'false'}, directorRole: ${JSON.stringify(slide.director_contract?.director_role || '')}, content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
    return shellText
      .replaceAll('__PPT_DECK_TITLE__', escapeHtml(title))
      .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
      .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
      .replaceAll('__PPT_DECK_SLIDES_DATA__', slidesLiteral);
  }

  function writeText(file, content) {
    ensureDir(path.dirname(file));
    writeFileSync(file, content, 'utf-8');
  }

  function safeFileMtimeMs(file) {
    if (!safeText(file) || !existsSync(file)) return 0;
    try {
      return Number(statSync(file).mtimeMs || 0);
    } catch {
      return 0;
    }
  }

  function formatTimestamp(ms) {
    return ms ? new Date(ms).toISOString() : '无';
  }

  function routeStageDefinitions(contract) {
    return [
      ...safeArray(contract?.stage_sequence?.stages),
      ...safeArray(contract?.stage_sequence?.alternate_stages),
    ];
  }

  function stageArtifactPath(contract, deliverablePaths, stageId) {
    const stage = routeStageDefinitions(contract).find((item) => item?.stage_id === stageId);
    const canonicalStageId = canonicalStageForRoute(stageId);
    const loaded = readStageFolderArtifact({
      deliverablePaths,
      routeStageId: stageId,
      canonicalStageId,
    });
    if (loaded?.output_file && ['success', 'blocked', 'completed_with_quality_debt'].includes(loaded.status)) {
      return loaded.output_file;
    }
    return stageFolderArtifactPath({
      deliverablePaths,
      domainId: 'redcube_ai',
      programId: safeText(deliverablePaths.programId),
      topicId: safeText(deliverablePaths.topicId),
      deliverableId: deliverablePaths.deliverableId,
      routeStageId: stageId,
      canonicalStageId,
      stageOrder: stageOrderForCanonicalStage(canonicalStageId),
      outputName: safeText(stage?.output_artifact) || `${stageId}.json`,
    });
  }

  function readStageArtifact(contract, deliverablePaths, stageId) {
    const loaded = readStageFolderArtifact({
      deliverablePaths,
      routeStageId: stageId,
      canonicalStageId: canonicalStageForRoute(stageId),
    });
    return ['success', 'blocked', 'completed_with_quality_debt'].includes(loaded?.status)
      ? loaded.artifact
      : null;
  }

  function stageArtifactMtimeMs(contract, deliverablePaths, stageId) {
    return safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, stageId));
  }

  function currentHtmlStageId(contract, deliverablePaths) {
    const renderArtifactFile = stageArtifactPath(contract, deliverablePaths, 'render_html');
    const fixArtifactFile = stageArtifactPath(contract, deliverablePaths, PAGE_FIX_ROUTE);
    const renderMtimeMs = safeFileMtimeMs(renderArtifactFile);
    const fixMtimeMs = safeFileMtimeMs(fixArtifactFile);
    if (fixMtimeMs > 0 && fixMtimeMs >= renderMtimeMs) {
      return PAGE_FIX_ROUTE;
    }
    return 'render_html';
  }

  function readCurrentHtmlArtifact(contract, deliverablePaths) {
    return readStageArtifact(contract, deliverablePaths, currentHtmlStageId(contract, deliverablePaths));
  }


  function promptMeta(route) {
    const relativePath = PROMPT_PACK[route];
    const absolutePath = path.join(REPO_ROOT, relativePath);
    return {
      root: 'prompts/ppt_deck',
      file: path.basename(relativePath),
      relative_path: relativePath,
      source: existsSync(absolutePath) ? 'repo' : 'embedded',
    };
  }

  function resolvePromptPackAsset(contract, relativePath) {
    const assetPath = safeText(relativePath);
    if (!assetPath) return '';
    if (path.isAbsolute(assetPath)) return assetPath;
    if (assetPath.startsWith('prompts/')) return assetPath;
    const root = safeText(contract?.prompt_pack?.root, 'prompts/ppt_deck');
    return assetPath.startsWith(`${root}/`) ? assetPath : path.posix.join(root, assetPath);
  }

  function readPromptPackText(relativePath) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (!existsSync(absolutePath)) {
      const error = new Error(`Missing prompt pack asset: ${relativePath}`);
      error.code = 'ENOENT';
      error.hard_stop_kind = 'missing_consumable_artifact';
      throw error;
    }
    return readFileSync(absolutePath, 'utf-8');
  }

  function renderSeedValue(value, vars) {
    if (Array.isArray(value)) {
      return value.map((item) => renderSeedValue(item, vars));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderSeedValue(item, vars)]));
    }
    if (typeof value === 'string') {
      return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => safeText(vars[key]));
    }
    return value;
  }

  function promptSeed(route, vars = {}) {
    return promptPackJsonSection(route, 'runtime_seed', vars);
  }

  function promptPackJsonSection(route, section, vars = {}) {
    const relativePath = PROMPT_PACK[route];
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (!existsSync(absolutePath)) return null;
    const raw = readFileSync(absolutePath, 'utf-8');
    const match = raw.match(new RegExp(`## ${section}\\s*\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``));
    if (!match) return null;
    return renderSeedValue(JSON.parse(match[1]), vars);
  }

  function promptArtifact(route, vars = {}) {
    return promptPackJsonSection(route, 'runtime_artifact', vars);
  }

  function isOperatorContextMaterial(material) {
    const kind = safeText(material?.kind);
    return safeText(material?.source_role) === 'operator_context'
      || kind === 'brief'
      || kind === 'keywords';
  }

  function sharedSourceTruth(contract) {
    return contract?.shared_source_truth || null;
  }

  function sharedSourceReadinessPack(contract) {
    return sharedSourceTruth(contract)?.source_readiness_pack || null;
  }

  function sharedSourceMaterials(contract) {
    return safeArray(sharedSourceTruth(contract)?.extracted_materials?.materials)
      .filter((material) => !isOperatorContextMaterial(material));
  }

  function sharedOperatorMaterials(contract) {
    return safeArray(sharedSourceTruth(contract)?.extracted_materials?.materials)
      .filter((material) => isOperatorContextMaterial(material));
  }

  function audienceFacingMaterials(contract) {
    return sharedSourceMaterials(contract);
  }

  function audienceFacingTextLines(value) {
    return String(value || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
      .replace(/<img[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`+/g, ' ')
      .replace(/^\s*#+\s*/gm, '')
      .replace(/^\s*[-*]\s+/gm, '')
      .split(/\r?\n/)
      .map((line) => line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function extractAudienceFacingSnippet(value, maxLength = 240) {
    const lines = audienceFacingTextLines(value);
    const informative = lines.find((line) => line.length >= 20) || lines[0] || '';
    return informative.slice(0, maxLength);
  }

  function sharedSourceMaterialIds(contract) {
    return sharedSourceMaterials(contract).map((material) => material.material_id);
  }

  function sharedSourceLabels(contract) {
    const labels = safeArray(sharedSourceTruth(contract)?.source_index?.sources)
      .filter((source) => source.status === 'ready' && !isOperatorContextMaterial(source))
      .map((source) => source.relative_path || source.kind);
    return labels.length > 0 ? labels : [
      '公开来源：临床指南 / 系统综述 / 监管原则',
      '公开来源：同行评议论文 / 真实世界研究',
      '公开来源：公开流程规范 / 教学案例',
    ];
  }

  function sharedSourceSnippet(contract, index = 0) {
    const materials = audienceFacingMaterials(contract);
    if (materials.length === 0) return '';
    const material = materials[index % materials.length];
    return extractAudienceFacingSnippet(material?.content_text || material?.excerpt, 80);
  }

  function sharedSourceInputMode(contract) {
    return safeText(sharedSourceTruth(contract)?.source_brief?.input_mode);
  }

  function sharedSourceConfidence(contract) {
    return safeText(sharedSourceTruth(contract)?.source_brief?.confidence);
  }

  function sharedSourceSufficiencyStatus(contract) {
    if (!sharedSourceTruth(contract)) return 'augmentation_required';
    return safeText(sharedSourceReadinessPack(contract)?.readiness?.sufficiency_status, 'augmentation_required');
  }

  function sharedSourceDeepResearchState(contract) {
    if (!sharedSourceTruth(contract)) return 'required';
    return safeText(sharedSourceReadinessPack(contract)?.readiness?.deep_research_state, 'required');
  }

  function sharedFactLibrarySummary(contract) {
    if (!sharedSourceTruth(contract)) {
      return safeText(contract.title);
    }
    return extractAudienceFacingSnippet(
      sharedSourceReadinessPack(contract)?.fact_library?.topic_summary,
      240,
    ) || sharedSourceSnippet(contract, 0) || safeText(contract.title);
  }

  function sharedSourceAudience(contract, fallback) {
    const materialCorpus = sharedSourceMaterials(contract)
      .map((material) => safeText(material.content_text))
      .filter(Boolean)
      .join(' ');
    const corpus = materialCorpus || safeText(sharedSourceTruth(contract)?.source_brief?.brief_text);
    if (/同行|同仁|peer|科研/.test(corpus)) return '临床科研同行';
    if (/管理|决策/.test(corpus)) return '医院管理层';
    if (/学生|本科|住院|学员/.test(corpus)) return '医学生与住院学员';
    return safeText(fallback, '专业听众');
  }

  function resolveSpeakerIdentity(contract, fallback) {
    const operatorCorpus = sharedOperatorMaterials(contract)
      .map((material) => material?.content_text || material?.excerpt || '')
      .join('\n');
    const patterns = [
      /讲者署名[:：]\s*([^\n]+)/i,
      /署名[:：]\s*([^\n]+)/i,
      /讲者[:：]\s*([^\n]+)/i,
      /speaker(?:_identity|_signature|_name)?[:：]\s*([^\n]+)/i,
    ];
    for (const pattern of patterns) {
      const match = operatorCorpus.match(pattern);
      const candidate = safeText(match?.[1] || '');
      if (candidate) {
        return candidate.replace(/\s+/g, ' ').trim();
      }
    }
    return safeText(fallback, '正式讲者');
  }

  return {
    safeText,
    safeArray,
    chunkArray,
    normalizeInlineText,
    escapeHtml,
    escapeHtmlAttribute,
    escapeTemplate,
    countMatches,
    upsertHtmlAttribute,
    hydrateRenderedSlideRootMetadata,
    validateRenderedReviewAnchors,
    buildDeckHtml,
    ensureDir,
    writeJson,
    writeText,
    readJson,
    safeFileMtimeMs,
    stageArtifactMtimeMs,
    formatTimestamp,
    stageArtifactPath,
    readStageArtifact,
    currentHtmlStageId,
    readCurrentHtmlArtifact,
    promptMeta,
    resolvePromptPackAsset,
    readPromptPackText,
    renderSeedValue,
    promptSeed,
    promptPackJsonSection,
    promptArtifact,
    isOperatorContextMaterial,
    sharedSourceTruth,
    sharedSourceReadinessPack,
    sharedSourceMaterials,
    sharedOperatorMaterials,
    audienceFacingMaterials,
    audienceFacingTextLines,
    extractAudienceFacingSnippet,
    sharedSourceMaterialIds,
    sharedSourceLabels,
    sharedSourceSnippet,
    sharedSourceInputMode,
    sharedSourceConfidence,
    sharedSourceSufficiencyStatus,
    sharedSourceDeepResearchState,
    sharedFactLibrarySummary,
    sharedSourceAudience,
    resolveSpeakerIdentity,
  };
}
