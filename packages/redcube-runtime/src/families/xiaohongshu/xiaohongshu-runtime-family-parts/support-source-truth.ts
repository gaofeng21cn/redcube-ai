// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { resolveWorkspaceXiaohongshuAuthorProfile } from '../../../xiaohongshu-author-profile.js';

import { safeArray, safeText } from './shared.js';

const MODULE_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(MODULE_DIR, '../../../../../..');
const DEFAULT_PROMPT_PACK = {
  research: 'prompts/xiaohongshu/research.md',
  storyline: 'prompts/xiaohongshu/storyline.md',
  single_note_plan: 'prompts/xiaohongshu/single_note_plan.md',
  visual_direction: 'prompts/xiaohongshu/visual_direction.md',
  render_html: 'prompts/xiaohongshu/render_html.md',
  fix_html: 'prompts/xiaohongshu/fix_html.md',
  visual_director_review: 'prompts/xiaohongshu/director_review.md',
  screenshot_review: 'prompts/xiaohongshu/screenshot_review.md',
  publish_copy: 'prompts/xiaohongshu/publish_copy.md',
  export_bundle: 'prompts/xiaohongshu/export_bundle.md',
};

export function promptPackRoot(contract) {
  return safeText(contract?.prompt_pack?.root, 'prompts/xiaohongshu');
}

export function promptRoute(contract, route) {
  return safeText(contract?.prompt_pack?.routes?.[route]) || DEFAULT_PROMPT_PACK[route];
}

export function resolvePromptPackAsset(contract, relativePath) {
  const assetPath = safeText(relativePath);
  if (!assetPath) return '';
  if (path.isAbsolute(assetPath)) return assetPath;
  if (assetPath.startsWith('prompts/')) return assetPath;
  if (assetPath.startsWith(`${promptPackRoot(contract)}/`)) return assetPath;
  return path.posix.join(promptPackRoot(contract), assetPath);
}

export function promptMeta(contract, route) {
  const relativePath = promptRoute(contract, route);
  const absolutePath = path.join(REPO_ROOT, relativePath);
  return {
    root: promptPackRoot(contract),
    file: path.basename(relativePath),
    relative_path: relativePath,
    source: existsSync(absolutePath) ? 'repo' : 'embedded',
  };
}

export function readPromptPackText(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf-8');
}

function renderSeedValue(value, vars) {
  if (Array.isArray(value)) return value.map((item) => renderSeedValue(item, vars));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderSeedValue(item, vars)]));
  }
  if (typeof value === 'string') {
    return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => safeText(vars[key]));
  }
  return value;
}

function promptPackJsonSection(contract, route, section, vars = {}) {
  const absolutePath = path.join(REPO_ROOT, promptRoute(contract, route));
  if (!existsSync(absolutePath)) return null;
  const raw = readFileSync(absolutePath, 'utf-8');
  const match = raw.match(new RegExp(`## ${section}\\s*\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``));
  if (!match) return null;
  return renderSeedValue(JSON.parse(match[1]), vars);
}

export function promptArtifact(contract, route, vars = {}) {
  return promptPackJsonSection(contract, route, 'runtime_artifact', vars);
}

export function promptSeed(contract, route, vars = {}) {
  return promptPackJsonSection(contract, route, 'runtime_seed', vars);
}

function isOperatorContextMaterial(material) {
  const kind = safeText(material?.kind);
  return safeText(material?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
}

export function isSeries(contract) {
  return /系列/.test(`${safeText(contract.title)} ${safeText(contract.goal)}`);
}

export function publicSources() {
  return [
    '公开临床指南 / 系统综述 / 正式流程资料',
    '同行评议论文 / 真实世界研究',
    '用户当次指定素材',
  ];
}

export function sourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sourceReadinessPack(contract) {
  return sourceTruth(contract)?.source_readiness_pack || null;
}

export function sourceMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => !isOperatorContextMaterial(material));
}

export function operatorMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => isOperatorContextMaterial(material));
}

export function sourceMaterialIds(contract) {
  return sourceMaterials(contract).map((material) => material.material_id);
}

export function sourceLabels(contract) {
  const truth = sourceTruth(contract);
  const labels = safeArray(truth?.source_index?.sources)
    .filter((source) => source.status === 'ready' && !isOperatorContextMaterial(source))
    .map((source) => source.relative_path || source.kind);
  return labels.length > 0 ? labels : publicSources();
}

export function sourceInputMode(contract) {
  return safeText(sourceTruth(contract)?.source_brief?.input_mode);
}

export function sourceConfidence(contract) {
  return safeText(sourceTruth(contract)?.source_brief?.confidence);
}

export function sourceSufficiencyStatus(contract) {
  return safeText(
    sourceReadinessPack(contract)?.readiness?.sufficiency_status,
    sourceMaterials(contract).length > 0 ? 'planning_ready' : 'augmentation_required',
  );
}

export function sourceDeepResearchState(contract) {
  return safeText(
    sourceReadinessPack(contract)?.readiness?.deep_research_state,
    sourceInputMode(contract) === 'brief_keywords' ? 'required' : 'not_required',
  );
}

export function sourceEvidenceGaps(contract) {
  return safeArray(sourceReadinessPack(contract)?.fact_library?.evidence_gaps);
}

export function sourceBlockingEvidenceGaps(contract) {
  return safeArray(sourceReadinessPack(contract)?.fact_library?.blocking_evidence_gaps);
}

export function sourceResidualEvidenceGaps(contract) {
  return safeArray(sourceReadinessPack(contract)?.fact_library?.residual_evidence_gaps);
}

export function sourceTopicSummary(contract) {
  return safeText(
    sourceReadinessPack(contract)?.fact_library?.topic_summary,
    sourceTruth(contract)
      ? `${safeText(contract.title, '本主题')} 已有 shared source truth；后续 stage 必须通读 source_materials_full_text 后自行概括主题、受众、冲突与记忆点。`
      : `${safeText(contract.title, '本主题')} 需要根据任务目标和可用资料生成可信、可发布的小红书图文。`,
  );
}

export function buildStorylineInputs(contract, research) {
  return {
    contract_id: 'xiaohongshu_ai_first_storyline_framing_v1',
    source_input: 'source_materials_full_text',
    binding: 'ai_authored_required',
    mode: safeText(research?.research?.mode, 'single'),
    topic_summary: safeText(research?.research?.topic_summary, sourceTopicSummary(contract)),
    ai_authored_fields: ['audience_judgement', 'tension', 'why_now', 'memory_hook'],
    planning_signals: {
      series_candidate: isSeries(contract),
      source_material_count: sourceMaterials(contract).length,
      operator_context_material_count: operatorMaterials(contract).length,
      source_sufficiency_status: sourceSufficiencyStatus(contract),
    },
    policy: 'Do not copy or derive storyline judgement from programmatic snippets. Read source_materials_full_text and author audience_judgement, tension, why_now, and memory_hook directly.',
  };
}

export function resolveAuthorBranding(workspaceRoot, contract) {
  return resolveWorkspaceXiaohongshuAuthorProfile({
    workspaceRoot,
    taskTitle: contract?.title,
    projectTitle: contract?.goal,
    promptFile: 'xiaohongshu',
  });
}
