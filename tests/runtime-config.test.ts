// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';

import { loadRuntimeConfig } from '@redcube/redcube-config';

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

test('loadRuntimeConfig merges repo, local, user, workspace, env and explicit overrides in fixed order', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-config-'));
  const homeDir = path.join(repoRoot, 'fake-home');
  const workspaceRoot = path.join(repoRoot, 'workspace-user');

  writeJson(path.join(repoRoot, 'config', 'defaults', 'runtime.json'), {
    rootDir: './repo-root',
    workspaceRoot: './repo-workspace',
    promptsDir: './repo-prompts',
  });
  writeJson(path.join(repoRoot, 'config', 'defaults', 'identity.json'), {
    defaultProfileId: 'general_public',
    routing: {
      medicalProfileId: 'medical_public',
      generalProfileId: 'general_public',
    },
    profiles: {
      general_public: {
        signatureDisplay: '公开通用作者',
        signatureSubtitle: '公开默认品牌',
      },
      medical_public: {
        signatureDisplay: '公开医学作者',
        signatureSubtitle: '公开默认品牌',
      },
    },
  });

  writeJson(path.join(repoRoot, 'config', 'local', 'runtime.json'), {
    rootDir: './local-root',
  });
  writeJson(path.join(repoRoot, 'config', 'local', 'identity.json'), {
    profiles: {
      general_public: {
        signatureDisplay: '本地作者',
      },
    },
  });

  writeJson(path.join(homeDir, '.config', 'redcube', 'runtime.json'), {
    workspaceRoot,
    promptsDir: path.join(repoRoot, 'prompts-user'),
  });
  writeJson(path.join(homeDir, '.config', 'redcube', 'identity.json'), {
    profiles: {
      general_public: {
        signatureSubtitle: '用户品牌',
      },
    },
  });

  writeJson(path.join(workspaceRoot, '.redcube', 'runtime.json'), {
    promptsDir: './prompts-workspace',
  });
  writeJson(path.join(workspaceRoot, '.redcube', 'identity.json'), {
    profiles: {
      general_public: {
        signatureDisplay: '工作区作者',
      },
    },
  });

  try {
    const resolved = loadRuntimeConfig({
      cwd: repoRoot,
      homeDir,
      env: {
        REDCUBE_ROOT_DIR: path.join(repoRoot, 'env-root'),
      },
      explicit: {
        promptsDir: path.join(repoRoot, 'explicit-prompts'),
      },
    });

    assert.equal(resolved.rootDir, path.join(repoRoot, 'env-root'));
    assert.equal(resolved.workspaceRoot, workspaceRoot);
    assert.equal(resolved.promptsDir, path.join(repoRoot, 'explicit-prompts'));
    assert.equal(resolved.identity.defaultProfileId, 'general_public');
    assert.equal(resolved.identity.profiles.general_public.signatureDisplay, '工作区作者');
    assert.equal(resolved.identity.profiles.general_public.signatureSubtitle, '用户品牌');
    assert.equal(resolved.sources.rootDir, 'env:REDCUBE_ROOT_DIR');
    assert.equal(resolved.sources.workspaceRoot, path.join(homeDir, '.config', 'redcube', 'runtime.json'));
    assert.equal(resolved.sources.promptsDir, 'explicit.promptsDir');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('loadRuntimeConfig falls back to safe repo defaults when private configs are absent', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-config-'));

  writeJson(path.join(repoRoot, 'config', 'defaults', 'runtime.json'), {});
  writeJson(path.join(repoRoot, 'config', 'defaults', 'identity.json'), {
    defaultProfileId: 'general_public',
    routing: {
      medicalProfileId: 'medical_public',
      generalProfileId: 'general_public',
    },
    profiles: {
      general_public: {
        signatureDisplay: '公开通用作者',
        signatureSubtitle: '公开默认品牌',
      },
      medical_public: {
        signatureDisplay: '公开医学作者',
        signatureSubtitle: '公开默认品牌',
      },
    },
  });

  try {
    const resolved = loadRuntimeConfig({
      cwd: repoRoot,
      homeDir: path.join(repoRoot, 'missing-home'),
      env: {},
      explicit: {},
    });

    assert.equal(resolved.rootDir, repoRoot);
    assert.equal(resolved.workspaceRoot, repoRoot);
    assert.equal(resolved.promptsDir, path.join(repoRoot, 'prompts', 'node'));
    assert.equal(resolved.identity.profiles.general_public.signatureDisplay, '公开通用作者');
    assert.equal(resolved.sources.rootDir, 'fallback.cwd');
    assert.equal(resolved.sources.workspaceRoot, 'fallback.rootDir');
    assert.equal(resolved.sources.promptsDir, 'fallback.repoPromptsDir');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('loadRuntimeConfig prefers repo-local private config over user-global config', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-config-'));
  const homeDir = path.join(repoRoot, 'fake-home');

  writeJson(path.join(repoRoot, 'config', 'defaults', 'runtime.json'), {});
  writeJson(path.join(homeDir, '.config', 'redcube', 'runtime.json'), {
    promptsDir: path.join(repoRoot, 'prompts-user'),
  });
  writeJson(path.join(repoRoot, 'config', 'local', 'runtime.json'), {
    promptsDir: './prompts-local',
  });

  try {
    const resolved = loadRuntimeConfig({
      cwd: repoRoot,
      homeDir,
      env: {},
      explicit: {},
    });

    assert.equal(resolved.promptsDir, path.join(repoRoot, 'config', 'local', 'prompts-local'));
    assert.equal(resolved.sources.promptsDir, path.join(repoRoot, 'config', 'local', 'runtime.json'));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
