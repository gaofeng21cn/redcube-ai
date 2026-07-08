// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';

import {
  loadRuntimeConfig,
} from '../packages/redcube-config/dist/index.js';
import {
  loadExecutorRoutingConfig,
  resolveExecutorRouting,
} from '../packages/redcube-runtime/dist/index.js';

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

test('resolveExecutorRouting keeps built-in default on Codex CLI when no config exists', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  try {
    const resolved = resolveExecutorRouting({
      cwd: repoRoot,
      homeDir: path.join(repoRoot, 'missing-home'),
      env: {},
      family: 'ppt_deck',
      profileId: 'lecture_peer',
      route: 'render_html',
    });

    assert.equal(resolved.effective_default_executor.executor_backend, 'codex_cli');
    assert.equal(resolved.effective_default_executor.source, 'domain_builtin_default');
    assert.equal(resolved.selected_executor.executor_backend, 'codex_cli');
    assert.equal(resolved.selected_executor.execution_shape, 'structured_call');
    assert.equal(resolved.structured_call_routing.enabled, false);
    assert.equal(resolved.matched_route_key, null);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('resolveExecutorRouting only marks domain local default when default_executor is explicit', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  const homeDir = path.join(repoRoot, 'fake-home');
  const routingFile = path.join(homeDir, '.codex', 'projects', 'redcube-ai', 'runtime-state', 'config', 'executor-routing.json');

  writeJson(routingFile, {
    schema_version: 1,
    default_executor: {
      executor_backend: 'codex_cli',
      execution_shape: 'structured_call',
    },
  });

  try {
    const loaded = loadExecutorRoutingConfig({
      cwd: repoRoot,
      homeDir,
      env: {},
    });
    assert.deepEqual(loaded.default_executor_source_files, [routingFile]);

    const resolved = resolveExecutorRouting({
      cwd: repoRoot,
      homeDir,
      env: {},
      family: 'ppt_deck',
      profileId: 'lecture_peer',
      route: 'render_html',
    });
    assert.equal(resolved.effective_default_executor.executor_backend, 'codex_cli');
    assert.equal(resolved.effective_default_executor.source, 'domain_local_user_config');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('resolveExecutorRouting honors OPL default executor before domain local default', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  const homeDir = path.join(repoRoot, 'fake-home');

  writeJson(path.join(homeDir, '.codex', 'projects', 'redcube-ai', 'runtime-state', 'config', 'executor-routing.json'), {
    schema_version: 1,
    default_executor: {
      executor_backend: 'codex_cli',
      execution_shape: 'structured_call',
    },
  });

  try {
    const resolved = resolveExecutorRouting({
      cwd: repoRoot,
      homeDir,
      env: {
        REDCUBE_OPL_DEFAULT_EXECUTOR_BACKEND: 'hermes_agent',
      },
      family: 'ppt_deck',
      profileId: 'lecture_peer',
      route: 'render_html',
    });

    assert.equal(resolved.effective_default_executor.executor_backend, 'hermes_agent');
    assert.equal(resolved.effective_default_executor.execution_shape, 'agent_loop');
    assert.equal(resolved.effective_default_executor.source, 'opl_runtime_manager_default_executor');
    assert.equal(resolved.selected_executor.executor_backend, 'hermes_agent');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('loadExecutorRoutingConfig resolves opt-in structured_call route model profiles without activating defaults', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  const homeDir = path.join(repoRoot, 'fake-home');
  const routingFile = path.join(homeDir, '.codex', 'projects', 'redcube-ai', 'runtime-state', 'config', 'executor-routing.json');

  writeJson(routingFile, {
    schema_version: 1,
    structured_call_routing: {
      enabled: true,
      default_on_missing: 'inherit_effective_default_executor',
      routes: {
        'ppt_deck/lecture_peer/render_html': {
          executor_backend: 'hermes_agent',
          execution_shape: 'structured_call',
          hermes_profile: 'huawei-deepseek-v4-flash',
          opl_hosted_executor_requirement: {
            source: 'opl_hosted_executor_requirement',
            required_receipt_source: 'opl_executor_adapter_receipt',
            hosted_adapter_reference: 'opl_hosted:hermes_agent_loop',
          },
          lane: 'production',
          fallback: 'fail_closed',
          failure_policy: 'fail_closed',
        },
      },
    },
  });

  try {
    const loaded = loadExecutorRoutingConfig({
      cwd: repoRoot,
      homeDir,
      env: {},
    });
    assert.deepEqual(loaded.source_files, [routingFile]);
    assert.deepEqual(loaded.default_executor_source_files, []);
    assert.equal(loaded.config.structured_call_routing.enabled, true);

    const matched = resolveExecutorRouting({
      cwd: repoRoot,
      homeDir,
      env: {},
      family: 'ppt_deck',
      profileId: 'lecture_peer',
      route: 'render_html',
    });
    assert.equal(matched.effective_default_executor.executor_backend, 'codex_cli');
    assert.equal(matched.effective_default_executor.source, 'domain_builtin_default');
    assert.equal(matched.matched_route_key, 'ppt_deck/lecture_peer/render_html');
    assert.equal(matched.selected_executor.executor_backend, 'hermes_agent');
    assert.equal(matched.selected_executor.execution_shape, 'structured_call');
    assert.equal(matched.selected_executor.hermes_profile, 'huawei-deepseek-v4-flash');
    assert.equal(matched.structured_call_routing.lane, 'production');
    assert.equal(matched.structured_call_routing.fallback, 'fail_closed');
    assert.equal(matched.structured_call_routing.failure_policy, 'fail_closed');

    const missing = resolveExecutorRouting({
      cwd: repoRoot,
      homeDir,
      env: {},
      family: 'ppt_deck',
      profileId: 'lecture_peer',
      route: 'slide_blueprint',
    });
    assert.equal(missing.matched_route_key, null);
    assert.equal(missing.selected_executor.executor_backend, 'codex_cli');
    assert.equal(missing.structured_call_routing.fallback, 'fail_closed');
    assert.equal(missing.structured_call_routing.failure_policy, 'fail_closed');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('resolveExecutorRouting only permits fallback_with_proof on experimental proof routes', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  const homeDir = path.join(repoRoot, 'fake-home');
  const routingFile = path.join(homeDir, '.codex', 'projects', 'redcube-ai', 'runtime-state', 'config', 'executor-routing.json');

  writeJson(routingFile, {
    schema_version: 1,
    structured_call_routing: {
      enabled: true,
      default_on_missing: 'inherit_effective_default_executor',
      routes: {
        'ppt_deck/lecture_peer/fix_html': {
          executor_backend: 'hermes_agent',
          execution_shape: 'structured_call',
          lane: 'experimental_proof',
          hermes_profile: 'huawei-glm-5.1',
          opl_hosted_executor_requirement: {
            source: 'opl_hosted_executor_requirement',
            required_receipt_source: 'opl_executor_adapter_receipt',
            hosted_adapter_reference: 'opl_hosted:hermes_agent_loop',
          },
          fallback: 'inherit_effective_default_executor',
          failure_policy: 'fallback_with_proof',
        },
      },
    },
  });

  try {
    const matched = resolveExecutorRouting({
      cwd: repoRoot,
      homeDir,
      env: {},
      family: 'ppt_deck',
      profileId: 'lecture_peer',
      route: 'fix_html',
    });
    assert.equal(matched.matched_route_key, 'ppt_deck/lecture_peer/fix_html');
    assert.equal(matched.selected_executor.executor_backend, 'hermes_agent');
    assert.equal(matched.structured_call_routing.lane, 'experimental_proof');
    assert.equal(matched.structured_call_routing.fallback, 'inherit_effective_default_executor');
    assert.equal(matched.structured_call_routing.failure_policy, 'fallback_with_proof');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('loadExecutorRoutingConfig rejects production fallback_with_proof routes', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  const homeDir = path.join(repoRoot, 'fake-home');
  const routingFile = path.join(homeDir, '.codex', 'projects', 'redcube-ai', 'runtime-state', 'config', 'executor-routing.json');

  writeJson(routingFile, {
    schema_version: 1,
    structured_call_routing: {
      enabled: true,
      routes: {
        render_html: {
          executor_backend: 'hermes_agent',
          execution_shape: 'structured_call',
          opl_hosted_executor_requirement: {
            source: 'opl_hosted_executor_requirement',
            required_receipt_source: 'opl_executor_adapter_receipt',
            hosted_adapter_reference: 'opl_hosted:hermes_agent_loop',
          },
          lane: 'production',
          fallback: 'inherit_effective_default_executor',
          failure_policy: 'fallback_with_proof',
        },
      },
    },
  });

  try {
    assert.throws(
      () => loadExecutorRoutingConfig({ cwd: repoRoot, homeDir, env: {} }),
      /fallback_with_proof requires lane=experimental_proof/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('loadExecutorRoutingConfig rejects hermes_agent routes without hosted proof boundary', () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-executor-routing-'));
  const homeDir = path.join(repoRoot, 'fake-home');
  const routingFile = path.join(homeDir, '.codex', 'projects', 'redcube-ai', 'runtime-state', 'config', 'executor-routing.json');

  writeJson(routingFile, {
    schema_version: 1,
    structured_call_routing: {
      enabled: true,
      routes: {
        render_html: {
          executor_backend: 'hermes_agent',
          execution_shape: 'structured_call',
          lane: 'production',
          failure_policy: 'fail_closed',
        },
      },
    },
  });

  try {
    assert.throws(
      () => loadExecutorRoutingConfig({ cwd: repoRoot, homeDir, env: {} }),
      /requires OPL receipt or hosted executor requirement/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
