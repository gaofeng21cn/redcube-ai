import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  probeHermesAgentUpstream,
  readHermesAgentUpstreamConfig,
} from '../packages/redcube-hermes-agent-client/src/index.js';
import {
  buildNodeTestArgs,
  readHermesGatewayLaunchConfig,
  DEFAULT_HERMES_GATEWAY_COMMAND,
  LIVE_UPSTREAM_GROUP_NAMES,
  resolveRedCubePythonCommand,
} from './run-test-group-lib.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

process.chdir(repoRoot);

const META = [
  'tests/bilingual-home-readme.test.js',
  'tests/ci-workflow.test.js',
  'tests/creative-ownership-recovery-audit.test.js',
  'tests/direct-delivery-longrun-target.test.js',
  'tests/family-onboarding-standard.test.js',
  'tests/harness-completion-audit.test.js',
  'tests/kernel-split-extraction.test.js',
  'tests/legacy-cleanup.test.js',
  'tests/llm-prompts.test.js',
  'tests/llm-runtime-config.test.js',
  'tests/overlay-registry.test.js',
  'tests/p19-creative-ownership-freeze.test.js',
  'tests/p20-extension-proof-and-third-family-onboarding.test.js',
  'tests/p21-operations-and-evaluation-os.test.js',
  'tests/pack-first-completion.test.js',
  'tests/phase-2-direct-delivery-lifecycle-stage-convergence.test.js',
  'tests/phase-2-direct-delivery-operator-handoff-hardening.test.js',
  'tests/phase-2-family-parity-governance-surface-convergence.test.js',
  'tests/phase-2-family-source-truth-consumption-convergence.test.js',
  'tests/phase-2-operator-surface-consistency-hardening.test.js',
  'tests/phase-2-publication-projection-delivery-contract-convergence.test.js',
  'tests/phase-2-review-export-gate-audit-hardening.test.js',
  'tests/phase-2-runtime-watch-locator-integrity-hardening.test.js',
  'tests/phase-2-source-intake-activation-package-freeze.test.js',
  'tests/phase-2-source-intake-shared-source-truth-baseline.test.js',
  'tests/phase-2-source-readiness-deep-research-trigger-gate-convergence.test.js',
  'tests/phase-2-workspace-operator-quickstart-convergence.test.js',
  'tests/poster-production-hardening-freeze.test.js',
  'tests/ppt-overlay.test.js',
  'tests/profile-contract-hydration.test.js',
  'tests/public-docs-surface.test.js',
  'tests/publish-governance-single-owner.test.js',
  'tests/reference-quality-os.test.js',
  'tests/render-ceiling-deepening.test.js',
  'tests/runtime-alignment-p0.test.js',
  'tests/runtime-config.test.js',
  'tests/runtime-protocol-workspace.test.js',
  'tests/run-test-group-live-upstream-command.test.js',
  'tests/source-augmentation-contract.test.js',
  'tests/source-augmentation-provider.test.js',
  'tests/stable-deliverable-manual-fidelity.test.js',
  'tests/stable-deliverable-manual-test-package.test.js',
  'tests/toc-parser.test.js',
  'tests/typescript-baseline.test.js',
  'tests/typescript-closeout-audit.test.js',
  'tests/typescript-contract-surfaces.test.js',
  'tests/typescript-gateway-surfaces.test.js',
  'tests/typescript-governance-surfaces.test.js',
  'tests/typescript-high-churn-packages.test.js',
  'tests/typescript-overlay-surfaces.test.js',
  'tests/typescript-reference-os-surfaces.test.js',
  'tests/typescript-runtime-family-surfaces.test.js',
  'tests/typescript-service-boundaries.test.js',
  'tests/upstream-hermes-agent-activation-package.test.js',
  'tests/upstream-hermes-agent-live-verification-blocker.test.js',
  'tests/upstream-hermes-agent-live-verification-closeout.test.js',
  'tests/upstream-hermes-agent-final-target-shape.test.js',
  'tests/xiaohongshu-overlay.test.js',
];

const INTEGRATION = [
  'tests/cli-v2-smoke.test.js',
  'tests/deliverable-review-loop.test.js',
  'tests/direct-delivery-lifecycle-stage-summary.test.js',
  'tests/direct-delivery-operator-handoff.test.js',
  'tests/family-parity-governance-surface.test.js',
  'tests/family-source-truth-consumption.test.js',
  'tests/gateway-actions.test.js',
  'tests/import-legacy-project.test.js',
  'tests/managed-deliverable-execution.test.js',
  'tests/mcp-gateway.test.js',
  'tests/phase-2-behavior-convergence.test.js',
  'tests/ppt-creative-ownership.test.js',
  'tests/ppt-deliverable-surface.test.js',
  'tests/private-profile.test.js',
  'tests/publication-projection-delivery-contract.test.js',
  'tests/reference-quality-os-replacement.test.js',
  'tests/reference-quality-os-reporting.test.js',
  'tests/reference-regression.test.js',
  'tests/review-platform.test.js',
  'tests/service-safe-domain-entry.test.js',
  'tests/hermes-managed-family-closure-truth.test.js',
  'tests/hermes-runtime-canonical-path.test.js',
  'tests/hermes-stable-family-closure-truth.test.js',
  'tests/runtime-deliverable-route.test.js',
  'tests/source-intake.test.js',
  'tests/source-readiness-deep-research-gate.test.js',
  'tests/source-research.test.js',
  'tests/upstream-hermes-agent-probe.test.js',
  'tests/workspace-operator-quickstart.test.js',
  'tests/xiaohongshu-creative-ownership.test.js',
];

const E2E = [
  'tests/ppt-deliverable-e2e.test.js',
  'tests/xiaohongshu-deliverable-e2e.test.js',
];

const FAST = [
  'tests/runtime-alignment-p0.test.js',
  'tests/typescript-baseline.test.js',
  'tests/runtime-protocol-workspace.test.js',
  'tests/overlay-registry.test.js',
  'tests/profile-contract-hydration.test.js',
  'tests/gateway-actions.test.js',
  'tests/runtime-deliverable-route.test.js',
  'tests/service-safe-domain-entry.test.js',
  'tests/source-augmentation-provider.test.js',
  'tests/upstream-hermes-agent-activation-package.test.js',
  'tests/upstream-hermes-agent-live-verification-blocker.test.js',
  'tests/upstream-hermes-agent-live-verification-closeout.test.js',
  'tests/upstream-hermes-agent-final-target-shape.test.js',
  'tests/upstream-hermes-agent-probe.test.js',
];

const GROUPS = {
  fast: FAST,
  meta: META,
  integration: INTEGRATION,
  e2e: E2E,
  full: [...META, ...INTEGRATION, ...E2E],
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hermesGatewayBaseUrl() {
  const host = process.env.API_SERVER_HOST || '127.0.0.1';
  const port = process.env.API_SERVER_PORT || '8642';
  return `http://${host}:${port}`;
}

async function waitForHermesGateway(baseUrl, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/v1/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        return;
      }
      lastError = new Error(`health endpoint returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(500);
  }

  throw new Error(
    `等待 Hermes gateway API server 超时: ${lastError instanceof Error ? lastError.message : String(lastError || 'unknown')}`,
  );
}

function startHermesGateway() {
  const launchConfig = readHermesGatewayLaunchConfig(process.env);
  const gatewayEnv = {
    ...process.env,
    API_SERVER_ENABLED: 'true',
    API_SERVER_HOST: process.env.API_SERVER_HOST || '127.0.0.1',
    API_SERVER_PORT: process.env.API_SERVER_PORT || '8642',
    API_SERVER_MODEL_NAME: process.env.API_SERVER_MODEL_NAME || process.env.REDCUBE_HERMES_UPSTREAM_MODEL || 'hermes-agent',
  };
  const output = [];
  const spawnOptions = {
    cwd: repoRoot,
    env: gatewayEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  const gateway = launchConfig.usesShell
    ? spawn(launchConfig.command, {
        ...spawnOptions,
        shell: true,
      })
    : spawn('hermes', ['gateway', 'run', '-q', '--replace'], spawnOptions);

  for (const stream of [gateway.stdout, gateway.stderr]) {
    stream?.on('data', (chunk) => {
      output.push(String(chunk));
      if (output.length > 40) {
        output.shift();
      }
    });
  }

  return {
    gateway,
    output,
    baseUrl: hermesGatewayBaseUrl(),
    modelName: gatewayEnv.API_SERVER_MODEL_NAME,
    launchCommand: launchConfig.command,
  };
}

async function preflightLiveUpstreamRunSurface({ baseUrl, modelName }) {
  const config = readHermesAgentUpstreamConfig({
    ...process.env,
    REDCUBE_HERMES_UPSTREAM_BASE_URL: baseUrl,
    REDCUBE_HERMES_UPSTREAM_MODEL: modelName,
  });
  const probe = await probeHermesAgentUpstream({
    config,
    requireRunSurface: true,
    timeoutMs: 60000,
  });

  if (!probe.ok) {
    throw new Error(JSON.stringify(probe, null, 2));
  }
}

async function prepareLiveUpstream(groupName) {
  if (!LIVE_UPSTREAM_GROUP_NAMES.has(groupName)) {
    return null;
  }

  const pythonCommand = resolveRedCubePythonCommand();
  process.env.REDCUBE_PYTHON_COMMAND = pythonCommand.command;

  const handle = startHermesGateway();
  try {
    await waitForHermesGateway(handle.baseUrl);
    await preflightLiveUpstreamRunSurface({
      baseUrl: handle.baseUrl,
      modelName: handle.modelName,
    });
  } catch (error) {
    handle.gateway.kill('SIGTERM');
    throw new Error([
      `无法启动 integration live upstream: ${error instanceof Error ? error.message : String(error)}`,
      `Hermes gateway launch command: ${handle.launchCommand}`,
      'Hermes gateway recent output:',
      handle.output.join('').trim() || '<empty>',
    ].join('\n'));
  }

  process.env.REDCUBE_HERMES_UPSTREAM_BASE_URL = handle.baseUrl;
  process.env.REDCUBE_HERMES_UPSTREAM_MODEL = handle.modelName;
  if (handle.launchCommand !== DEFAULT_HERMES_GATEWAY_COMMAND) {
    process.stdout.write(`[run-test-group] live upstream launch override: ${handle.launchCommand}\n`);
  }
  process.stdout.write(`[run-test-group] live upstream python command: ${pythonCommand.command}\n`);
  process.stdout.write('[run-test-group] live upstream run-surface preflight passed\n');
  process.stdout.write(`[run-test-group] live upstream ready: ${handle.baseUrl}\n`);
  return handle;
}

function discoveredRootTests() {
  return readdirSync(path.resolve('tests'))
    .filter((entry) => entry.endsWith('.test.js'))
    .map((entry) => `tests/${entry}`)
    .sort();
}

function assertTrackedFiles(files, groupName) {
  for (const file of files) {
    if (!existsSync(path.resolve(file))) {
      throw new Error(`${groupName} 引用了不存在的测试文件: ${file}`);
    }
  }
}

function assertPartition() {
  const discovered = discoveredRootTests();
  const base = [...META, ...INTEGRATION, ...E2E];
  const duplicates = base.filter((file, index) => base.indexOf(file) !== index);
  if (duplicates.length > 0) {
    throw new Error(`meta/integration/e2e 分组存在重复项: ${[...new Set(duplicates)].join(', ')}`);
  }

  const missing = discovered.filter((file) => !base.includes(file));
  if (missing.length > 0) {
    throw new Error(`未被纳入 meta/integration/e2e 的测试文件: ${missing.join(', ')}`);
  }

  const unexpected = base.filter((file) => !discovered.includes(file));
  if (unexpected.length > 0) {
    throw new Error(`分组里存在非根级测试文件: ${unexpected.join(', ')}`);
  }
}

function printUsage() {
  process.stdout.write([
    '用法: node scripts/run-test-group.mjs <fast|meta|integration|e2e|full> [node --test 参数]',
    '示例: node scripts/run-test-group.mjs full --test-reporter=dot',
  ].join('\n'));
}

const [, , groupName, ...forwardedArgs] = process.argv;

if (!groupName || !Object.hasOwn(GROUPS, groupName)) {
  printUsage();
  process.exit(groupName ? 1 : 0);
}

assertTrackedFiles(META, 'meta');
assertTrackedFiles(INTEGRATION, 'integration');
assertTrackedFiles(E2E, 'e2e');
assertTrackedFiles(FAST, 'fast');
assertPartition();

  const liveUpstreamHandle = await prepareLiveUpstream(groupName);

try {
  const result = spawnSync(process.execPath, [...buildNodeTestArgs({ groupName, forwardedArgs }), ...GROUPS[groupName]], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
} finally {
  if (liveUpstreamHandle) {
    liveUpstreamHandle.gateway.kill('SIGTERM');
  }
}
