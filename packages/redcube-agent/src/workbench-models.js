import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

function getWorkbenchStateDir(rootDir) {
  const dir = path.join(rootDir, '.redcube_pi', 'workbench');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getModelConfigFile(rootDir) {
  return path.join(getWorkbenchStateDir(rootDir), 'model-config.json');
}

function normalizeConfig(input = {}) {
  return {
    providers: Array.isArray(input.providers) ? input.providers : [],
    models: Array.isArray(input.models) ? input.models : [],
    defaultModelId: String(input.defaultModelId || '').trim(),
    stageOverrides: input.stageOverrides && typeof input.stageOverrides === 'object'
      ? input.stageOverrides
      : {},
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

export function loadWorkbenchModelConfig(rootDir) {
  const file = getModelConfigFile(rootDir);
  if (!existsSync(file)) {
    return normalizeConfig();
  }

  const raw = JSON.parse(readFileSync(file, 'utf-8'));
  return normalizeConfig(raw);
}

export function saveWorkbenchModelConfig(rootDir, input) {
  const file = getModelConfigFile(rootDir);
  const normalized = normalizeConfig(input);
  writeFileSync(file, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

export function resolveStageModel(config, stageId) {
  const normalized = normalizeConfig(config);
  return normalized.stageOverrides[stageId] || normalized.defaultModelId || '';
}

export function resolveStageLlmConfig(config, stageId) {
  const normalized = normalizeConfig(config);
  const modelId = resolveStageModel(normalized, stageId);
  if (!modelId) return null;

  const model = normalized.models.find((item) => item.id === modelId);
  if (!model) return null;

  const provider = normalized.providers.find((item) => item.id === model.providerId);
  if (!provider?.baseURL || !provider?.apiKey || !model?.modelName) {
    return null;
  }

  return {
    mode: 'openai',
    modelId,
    model: model.modelName,
    baseUrl: provider.baseURL,
    apiKey: provider.apiKey,
    providerId: provider.id,
    providerName: provider.name || provider.id,
    label: model.label || model.modelName || model.id,
  };
}

export function loadStageLlmConfig(rootDir, stageId) {
  return resolveStageLlmConfig(loadWorkbenchModelConfig(rootDir), stageId);
}
