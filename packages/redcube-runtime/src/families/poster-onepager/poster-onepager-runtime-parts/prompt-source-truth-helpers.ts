// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

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
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing poster_onepager prompt pack asset: ${relativePath}`);
  }
  const body = readFileSync(absolutePath);
  return {
    root: promptPackRoot(contract),
    file: path.basename(relativePath),
    relative_path: relativePath,
    source: 'repo',
    body_sha256: createHash('sha256').update(body).digest('hex'),
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
    promptMeta: (contract, route) => promptMeta(repoRoot, contract, route),
    promptRoute,
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
