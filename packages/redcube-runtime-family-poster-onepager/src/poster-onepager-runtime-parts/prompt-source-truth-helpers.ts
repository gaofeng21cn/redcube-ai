// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { safeArray, safeText } from './surface-helpers.js';

function promptPackRoot(contract) {
  const root = safeText(contract?.prompt_pack?.root);
  if (!root) {
    throw new Error('poster_onepager hydrated contract 缺少 prompt_pack.root');
  }
  return root;
}

function promptRoute(contract, route) {
  const relativePath = safeText(contract?.prompt_pack?.routes?.[route]);
  if (!relativePath) {
    throw new Error(`poster_onepager hydrated contract 缺少 prompt_pack.routes.${route}`);
  }
  return relativePath;
}

function resolvePromptPackAsset(contract, relativePath) {
  const assetPath = safeText(relativePath);
  if (!assetPath) return '';
  if (path.isAbsolute(assetPath)) return assetPath;
  if (assetPath.startsWith('prompts/')) return assetPath;
  if (assetPath.startsWith(`${promptPackRoot(contract)}/`)) return assetPath;
  return path.posix.join(promptPackRoot(contract), assetPath);
}

function promptMeta(repoRoot, contract, route) {
  const relativePath = promptRoute(contract, route);
  const absolutePath = path.join(repoRoot, relativePath);
  return {
    root: promptPackRoot(contract),
    file: path.basename(relativePath),
    relative_path: relativePath,
    source: existsSync(absolutePath) ? 'repo' : 'embedded',
  };
}

function readPromptPackText(repoRoot, relativePath) {
  const absolutePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(repoRoot, relativePath);
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

function promptPackJsonSection(repoRoot, contract, route, section, vars = {}) {
  const absolutePath = path.join(repoRoot, promptRoute(contract, route));
  if (!existsSync(absolutePath)) return null;
  const raw = readFileSync(absolutePath, 'utf-8');
  const match = raw.match(new RegExp(`## ${section}\\s*\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``));
  if (!match) return null;
  return renderSeedValue(JSON.parse(match[1]), vars);
}

function promptArtifact(repoRoot, contract, route, vars = {}) {
  return promptPackJsonSection(repoRoot, contract, route, 'runtime_artifact', vars);
}

function promptSeed(repoRoot, contract, route, vars = {}) {
  return promptPackJsonSection(repoRoot, contract, route, 'runtime_seed', vars);
}

function isOperatorContextMaterial(material) {
  const kind = safeText(material?.kind);
  return safeText(material?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
}

function sourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sourceMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => !isOperatorContextMaterial(material));
}

function operatorMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => isOperatorContextMaterial(material));
}

function sourceMaterialIds(contract) {
  return sourceMaterials(contract).map((material) => material.material_id).filter(Boolean);
}

function publicSources() {
  return [
    '公开临床指南 / 系统综述 / 正式流程资料',
    '同行评议论文 / 真实世界研究',
    '用户当次指定素材',
  ];
}

function sourceLabels(contract) {
  const labels = safeArray(sourceTruth(contract)?.source_index?.sources)
    .filter((source) => source.status === 'ready' && !isOperatorContextMaterial(source))
    .map((source) => source.relative_path || source.kind);
  return labels.length > 0 ? labels : publicSources();
}

export function createPosterOnepagerPromptSourceTruthHelpers({ repoRoot }) {
  return {
    promptArtifact: (contract, route, vars = {}) => promptArtifact(repoRoot, contract, route, vars),
    promptMeta: (contract, route) => promptMeta(repoRoot, contract, route),
    promptRoute,
    promptSeed: (contract, route, vars = {}) => promptSeed(repoRoot, contract, route, vars),
    publicSources,
    readPromptPackText: (relativePath) => readPromptPackText(repoRoot, relativePath),
    resolvePromptPackAsset,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
    operatorMaterials,
  };
}
