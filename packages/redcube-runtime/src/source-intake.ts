// @ts-nocheck
import {
  normalizeKeywords,
  normalizeOperatorFiles,
  normalizeSourceFiles,
  previousMaterialBySourceHash,
  previousSourceByHash,
  unchangedSourcePackReuseDecision,
} from './source-intake-parts/fingerprint-reuse.js';
import {
  buildIntakeSources,
  extractSourcesWithReuse,
  isConsumableSource,
  materializeReadyMaterials,
} from './source-intake-parts/materialization.js';
import {
  assembleSourceIntakeArtifacts,
  buildSourceIntakeResponse,
  reuseFrozenSourcePackIfAvailable,
} from './source-intake-parts/response-assembly.js';
import {
  ensureWorkspaceAndTopic,
  readJsonIfExists,
  safeText,
  writeJson,
} from './source-intake-parts/workspace-setup.js';
import type {
  RuntimeSourceIntakeRequest,
  RuntimeSourceIntakeResponse,
} from './types.js';

export async function intakeSource({
  workspaceRoot,
  topicId,
  title = '',
  brief = '',
  keywords = [],
  sourceFiles = [],
  operatorFiles = [],
  modeHint = '',
}: RuntimeSourceIntakeRequest): Promise<RuntimeSourceIntakeResponse> {
  const normalizedKeywords = normalizeKeywords(keywords);
  const normalizedSourceFiles = normalizeSourceFiles(sourceFiles);
  const normalizedOperatorFiles = normalizeOperatorFiles(operatorFiles);
  const sourcePaths = ensureWorkspaceAndTopic({ workspaceRoot, topicId, title: safeText(title) });
  const intakeSources = buildIntakeSources({
    brief,
    keywords: normalizedKeywords,
    title: safeText(title) || topicId,
    sourceFiles: normalizedSourceFiles,
    operatorFiles: normalizedOperatorFiles,
    topicPaths: sourcePaths.topicPaths,
  });

  if (intakeSources.length === 0) {
    throw new Error('source intake 至少需要 brief、keywords 或 sourceFiles 之一');
  }

  const previousManifest = readJsonIfExists(sourcePaths.sourcePackManifestFile);
  const previousExtractedMaterials = readJsonIfExists(sourcePaths.extractedMaterialsFile);
  const frozenPackResponse = reuseFrozenSourcePackIfAvailable({ sourcePaths, previousManifest, intakeSources });
  if (frozenPackResponse) {
    return frozenPackResponse;
  }
  const frozenPackReuse = unchangedSourcePackReuseDecision({ previousManifest, intakeSources });
  const priorSourcesByHash = previousSourceByHash(previousManifest);
  const priorMaterialsByHash = previousMaterialBySourceHash(previousManifest, previousExtractedMaterials);

  const extracted = extractSourcesWithReuse({
    intakeSources,
    priorSourcesByHash,
    priorMaterialsByHash,
  });
  const readyMaterials = materializeReadyMaterials(extracted);
  const consumableReadyMaterials = readyMaterials.filter((material) => isConsumableSource(material));

  const artifacts = assembleSourceIntakeArtifacts({
    workspaceRoot,
    sourcePaths,
    title,
    brief,
    normalizedKeywords,
    modeHint,
    intakeSources,
    extracted,
    readyMaterials,
    consumableReadyMaterials,
    previousManifest,
    frozenPackReuse,
  });

  writeJson(sourcePaths.sourceIndexFile, artifacts.sourceIndex);
  writeJson(sourcePaths.extractedMaterialsFile, artifacts.extractedMaterials);
  writeJson(sourcePaths.sourceBriefFile, artifacts.sourceBrief);
  writeJson(sourcePaths.sourceAuditFile, artifacts.sourceAudit);
  writeJson(sourcePaths.sourceReadinessPackFile, artifacts.sourceReadinessPack);
  writeJson(sourcePaths.sourcePackManifestFile, artifacts.sourcePackManifest);
  writeJson(sourcePaths.sourcePackFanoutFile, artifacts.sourcePackFanout);
  writeJson(sourcePaths.sourceAugmentationRequestFile, artifacts.sourceAugmentationRequest);

  return buildSourceIntakeResponse({
    sourcePaths,
    audit: artifacts.sourceAudit,
    augmentation: artifacts.sourceAugmentationRequest,
    cacheStatus: 'miss',
  });
}
