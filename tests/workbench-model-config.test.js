import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadWorkbenchModelConfig,
  resolveStageModel,
  saveWorkbenchModelConfig,
} from '../packages/redcube-agent/src/workbench-models.js';

test('resolveStageModel uses stage override before global default', () => {
  const config = {
    defaultModelId: 'gpt-5.4',
    stageOverrides: {
      html_generation: 'gemini-3.1-pro',
    },
  };

  assert.equal(resolveStageModel(config, 'html_generation'), 'gemini-3.1-pro');
  assert.equal(resolveStageModel(config, 'storyline'), 'gpt-5.4');
});

test('saveWorkbenchModelConfig persists providers, models, and overrides', () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-model-config-'));

  const input = {
    providers: [
      {
        id: 'provider-main',
        name: 'Main Provider',
        baseURL: 'https://example.com/v1',
        apiKey: 'sk-test-123',
      },
    ],
    models: [
      {
        id: 'gpt-5.4',
        providerId: 'provider-main',
        label: 'GPT 5.4',
        modelName: 'gpt-5.4',
      },
      {
        id: 'gemini-3.1-pro',
        providerId: 'provider-main',
        label: 'Gemini 3.1 Pro',
        modelName: 'gemini-3.1-pro',
      },
    ],
    defaultModelId: 'gpt-5.4',
    stageOverrides: {
      html_generation: 'gemini-3.1-pro',
    },
  };

  saveWorkbenchModelConfig(rootDir, input);
  const saved = loadWorkbenchModelConfig(rootDir);

  assert.equal(saved.providers[0].baseURL, 'https://example.com/v1');
  assert.equal(saved.models[1].modelName, 'gemini-3.1-pro');
  assert.equal(saved.defaultModelId, 'gpt-5.4');
  assert.equal(saved.stageOverrides.html_generation, 'gemini-3.1-pro');
});
