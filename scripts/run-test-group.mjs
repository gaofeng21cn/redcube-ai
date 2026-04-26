import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  assertCurrentRepoSharedPinAlignment,
  assertRequiredRuntimeSharedResolution,
  assertWorkspacePackageResolution,
  buildNodeTestArgs,
  partitionTestFilesForExecution,
  SERIALIZED_VERIFICATION_GROUP_NAMES,
  resolveRedCubePythonCommand,
} from './run-test-group-lib.mjs';
import {
  probeCodexCli,
  readCodexCliContract,
} from '@redcube/codex-cli-client';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

process.chdir(repoRoot);
assertWorkspacePackageResolution({ repoRoot });
assertRequiredRuntimeSharedResolution({ repoRoot });
assertCurrentRepoSharedPinAlignment({ repoRoot });

const META = [
  'tests/bilingual-home-readme.test.js',
  'tests/ci-workflow.test.js',
  'tests/candidate-racing.test.js',
  'tests/codex-plugin.test.js',
  'tests/creative-ownership-recovery-audit.test.js',
  'tests/codex-cli-client.test.js',
  'tests/codex-session-pool.test.js',
  'tests/codex-cli-timeout.test.js',
  'tests/family-onboarding-standard.test.js',
  'tests/harness-completion-audit.test.js',
  'tests/kernel-split-extraction.test.js',
  'tests/legacy-cleanup.test.js',
  'tests/line-budget.test.js',
  'tests/llm-prompts.test.js',
  'tests/llm-runtime-config.test.js',
  'tests/overlay-registry.test.js',
  'tests/pack-first-completion.test.js',
  'tests/ppt-overlay.test.js',
  'tests/profile-contract-hydration.test.js',
  'tests/python-native-helper-catalog.test.js',
  'tests/publish-governance-single-owner.test.js',
  'tests/reference-quality-os.test.js',
  'tests/render-ceiling-deepening.test.js',
  'tests/runtime-config.test.js',
  'tests/runtime-protocol-workspace.test.js',
  'tests/run-test-group-live-upstream-command.test.js',
  'tests/source-augmentation-contract.test.js',
  'tests/source-augmentation-provider.test.js',
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
  'tests/worktree-package-resolution.test.js',
  'tests/xiaohongshu-overlay.test.js',
];

const FAMILY = [
  'tests/family-shared-release.test.js',
];

const INTEGRATION = [
  'tests/block-content-fit-review.test.js',
  'tests/cli-v2-smoke.test.js',
  'tests/deliverable-review-loop.test.js',
  'tests/direct-delivery-operator-handoff.test.js',
  'tests/export-preview-cache.test.js',
  'tests/family-parity-governance-surface.test.js',
  'tests/family-source-truth-consumption.test.js',
  'tests/gateway-actions.test.js',
  'tests/hermes-run-topology-regression.test.js',
  'tests/hermes-runtime-canonical-path.test.js',
  'tests/import-legacy-project.test.js',
  'tests/managed-deliverable-execution.test.js',
  'tests/managed-dag-scheduler.test.js',
  'tests/mcp-gateway.test.js',
  'tests/poster-creative-ownership.test.js',
  'tests/ppt-creative-ownership.test.js',
  'tests/ppt-render-batch-generation.test.js',
  'tests/ppt-deliverable-surface.test.js',
  'tests/ppt-hermes-generation.test.js',
  'tests/ppt-native-ppt-runtime.test.js',
  'tests/preflight-gates.test.js',
  'tests/private-profile.test.js',
  'tests/product-entry-native-ppt-proof-lane.test.js',
  'tests/product-entry-runtime-manager-registration.test.js',
  'tests/product-entry.test.js',
  'tests/publication-projection-delivery-contract.test.js',
  'tests/public-docs-surface.test.js',
  'tests/reference-quality-os-replacement.test.js',
  'tests/reference-regression.test.js',
  'tests/render-html-guardrails.test.js',
  'tests/review-state-latest-checks.test.js',
  'tests/review-platform.test.js',
  'tests/review-stage-concurrency.test.js',
  'tests/screenshot-cache.test.js',
  'tests/runtime-deliverable-route.test.js',
  'tests/screenshot-review-ai-first.test.js',
  'tests/service-safe-domain-entry.test.js',
  'tests/source-first-fanout.test.js',
  'tests/source-intake.test.js',
  'tests/source-readiness-deep-research-gate.test.js',
  'tests/source-research.test.js',
  'tests/workspace-operator-quickstart.test.js',
  'tests/xiaohongshu-creative-ownership.test.js',
];

const E2E = [
  'tests/ppt-deliverable-e2e.test.js',
  'tests/xiaohongshu-deliverable-e2e.test.js',
];

const HISTORICAL = [
  'tests/direct-delivery-longrun-target.test.js',
  'tests/hermes-managed-family-closure-truth.test.js',
  'tests/hermes-stable-family-closure-truth.test.js',
  'tests/p19-creative-ownership-freeze.test.js',
  'tests/p20-extension-proof-and-third-family-onboarding.test.js',
  'tests/p21-operations-and-evaluation-os.test.js',
  'tests/phase-2-behavior-convergence.test.js',
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
  'tests/runtime-alignment-p0.test.js',
  'tests/stable-deliverable-manual-fidelity.test.js',
  'tests/stable-deliverable-manual-test-package.test.js',
  'tests/upstream-hermes-agent-activation-package.test.js',
  'tests/upstream-hermes-agent-final-target-shape.test.js',
  'tests/upstream-hermes-agent-live-verification-blocker.test.js',
  'tests/upstream-hermes-agent-live-verification-closeout.test.js',
];

const FAST = [
  'tests/typescript-baseline.test.js',
  'tests/typescript-closeout-audit.test.js',
  'tests/runtime-protocol-workspace.test.js',
  'tests/overlay-registry.test.js',
  'tests/profile-contract-hydration.test.js',
  'tests/gateway-actions.test.js',
  'tests/worktree-package-resolution.test.js',
  'tests/codex-cli-client.test.js',
  'tests/codex-session-pool.test.js',
  'tests/codex-cli-timeout.test.js',
  'tests/runtime-deliverable-route.test.js',
  'tests/public-docs-surface.test.js',
  'tests/ppt-hermes-generation.test.js',
  'tests/ppt-native-ppt-runtime.test.js',
  'tests/ppt-render-batch-generation.test.js',
  'tests/service-safe-domain-entry.test.js',
  'tests/product-entry-native-ppt-proof-lane.test.js',
  'tests/python-native-helper-catalog.test.js',
  'tests/product-entry-runtime-manager-registration.test.js',
  'tests/product-entry.test.js',
  'tests/source-augmentation-provider.test.js',
];

const GROUPS = {
  fast: FAST,
  meta: META,
  family: FAMILY,
  integration: INTEGRATION,
  e2e: E2E,
  historical: HISTORICAL,
  full: [...META, ...FAMILY, ...INTEGRATION, ...E2E, ...HISTORICAL],
};
async function prepareSerializedVerification(groupName) {
  if (!SERIALIZED_VERIFICATION_GROUP_NAMES.has(groupName)) {
    return null;
  }

  const pythonCommand = resolveRedCubePythonCommand();
  process.env.REDCUBE_PYTHON_COMMAND = pythonCommand.command;

  const codexProbe = await probeCodexCli({
    contract: readCodexCliContract(process.env),
    cwd: repoRoot,
    timeoutMs: 60000,
  });
  if (!codexProbe.ok) {
    throw new Error([
      '无法完成本地 Codex CLI 预检',
      JSON.stringify(codexProbe, null, 2),
    ].join('\n'));
  }

  process.stdout.write(`[run-test-group] local codex command: ${codexProbe.contract.command.join(' ')}\n`);
  process.stdout.write(`[run-test-group] local codex python command: ${pythonCommand.command}\n`);
  process.stdout.write('[run-test-group] local codex exec preflight passed\n');
  return {
    codexProbe,
    pythonCommand,
  };
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
  const base = [...META, ...FAMILY, ...INTEGRATION, ...E2E, ...HISTORICAL];
  const duplicates = base.filter((file, index) => base.indexOf(file) !== index);
  if (duplicates.length > 0) {
    throw new Error(`meta/family/integration/e2e/historical 分组存在重复项: ${[...new Set(duplicates)].join(', ')}`);
  }

  const missing = discovered.filter((file) => !base.includes(file));
  if (missing.length > 0) {
    throw new Error(`未被纳入 meta/family/integration/e2e/historical 的测试文件: ${missing.join(', ')}`);
  }

  const unexpected = base.filter((file) => !discovered.includes(file));
  if (unexpected.length > 0) {
    throw new Error(`分组里存在非根级测试文件: ${unexpected.join(', ')}`);
  }
}

function printUsage() {
  process.stdout.write([
    '用法: node scripts/run-test-group.mjs <fast|meta|family|integration|e2e|historical|full> [node --test 参数]',
    '示例: node scripts/run-test-group.mjs full --test-reporter=dot',
  ].join('\n'));
}

const [, , groupName, ...forwardedArgs] = process.argv;

if (!groupName || !Object.hasOwn(GROUPS, groupName)) {
  printUsage();
  process.exit(groupName ? 1 : 0);
}

assertTrackedFiles(META, 'meta');
assertTrackedFiles(FAMILY, 'family');
assertTrackedFiles(INTEGRATION, 'integration');
assertTrackedFiles(E2E, 'e2e');
assertTrackedFiles(HISTORICAL, 'historical');
assertTrackedFiles(FAST, 'fast');
assertPartition();

const serializedVerificationHandle = await prepareSerializedVerification(groupName);
const executionPlan = partitionTestFilesForExecution({
  groupName,
  files: GROUPS[groupName],
});

function runNodeTestBatch({ label, files, serialized }) {
  if (files.length === 0) {
    return 0;
  }

  process.stdout.write([
    `[run-test-group] ${groupName} ${label}: ${files.length} files`,
    serialized ? '(file concurrency = 1)' : '(runner default concurrency)',
  ].join(' ') + '\n');

  const result = spawnSync(process.execPath, [...buildNodeTestArgs({ forwardedArgs, serialized }), ...files], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

try {
  const parallelStatus = runNodeTestBatch({
    label: 'parallel batch',
    files: executionPlan.parallel_files,
    serialized: false,
  });
  if (parallelStatus !== 0) {
    process.exit(parallelStatus);
  }

  const serializedStatus = runNodeTestBatch({
    label: 'serialized route-heavy batch',
    files: executionPlan.serialized_files,
    serialized: true,
  });
  process.exit(serializedStatus);
} finally {
  void serializedVerificationHandle;
}
