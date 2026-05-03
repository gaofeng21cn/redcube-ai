// @ts-nocheck
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  assertCurrentRepoSharedPinAlignment,
  assertRootTestPartition,
  assertRequiredRuntimeSharedResolution,
  assertWorkspacePackageResolution,
  buildNodeTestArgs,
  discoverRootTestFiles,
  partitionTestFilesForExecution,
  SERIALIZED_VERIFICATION_GROUP_NAMES,
  resolveRedCubePythonCommand,
} from './run-test-group-lib.ts';
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
  'tests/ai-first-authoring-boundary.test.ts',
  'tests/bilingual-home-readme.test.ts',
  'tests/ci-workflow.test.ts',
  'tests/candidate-racing.test.ts',
  'tests/codex-plugin.test.ts',
  'tests/creative-ownership-recovery-audit.test.ts',
  'tests/codex-cli-client.test.ts',
  'tests/codex-session-pool.test.ts',
  'tests/codex-cli-timeout.test.ts',
  'tests/family-onboarding-standard.test.ts',
  'tests/harness-completion-audit.test.ts',
  'tests/kernel-split-extraction.test.ts',
  'tests/legacy-cleanup.test.ts',
  'tests/line-budget.test.ts',
  'tests/overlay-registry.test.ts',
  'tests/opl-family-contract-adoption.test.ts',
  'tests/pack-first-completion.test.ts',
  'tests/ppt-mainline-quality-closeout.test.ts',
  'tests/ppt-overlay.test.ts',
  'tests/profile-contract-hydration.test.ts',
  'tests/python-native-helper-catalog.test.ts',
  'tests/publish-governance-single-owner.test.ts',
  'tests/reference-quality-os.test.ts',
  'tests/render-ceiling-deepening.test.ts',
  'tests/runtime-config.test.ts',
  'tests/runtime-protocol-workspace.test.ts',
  'tests/run-test-group-live-upstream-command.test.ts',
  'tests/source-augmentation-contract.test.ts',
  'tests/source-augmentation-provider.test.ts',
  'tests/typescript-baseline.test.ts',
  'tests/typescript-closeout-audit.test.ts',
  'tests/typescript-surfaces.test.ts',
  'tests/typescript-high-churn-packages.test.ts',
  'tests/typescript-overlay-surfaces.test.ts',

  'tests/typescript-service-boundaries.test.ts',
  'tests/worktree-package-resolution.test.ts',
  'tests/xiaohongshu-overlay.test.ts',
];

const FAMILY = [
  'tests/family-shared-release.test.ts',
];

const INTEGRATION = [
  'tests/block-content-fit-review.test.ts',
  'tests/block-content-fit-review-surface-children.test.ts',
  'tests/cli-v2-smoke.test.ts',
  'tests/deliverable-review-loop.test.ts',
  'tests/direct-delivery-operator-handoff.test.ts',
  'tests/export-preview-cache.test.ts',
  'tests/family-parity-governance-surface.test.ts',
  'tests/family-source-truth-consumption.test.ts',
  'tests/gateway-actions.test.ts',
  'tests/hermes-run-topology-regression.test.ts',
  'tests/hermes-runtime-canonical-path.test.ts',
  'tests/managed-deliverable-execution.test.ts',
  'tests/managed-dag-scheduler.test.ts',
  'tests/mcp-gateway.test.ts',
  'tests/poster-creative-ownership.test.ts',
  'tests/ppt-creative-ownership.test.ts',
  'tests/ppt-render-batch-generation.test.ts',
  'tests/ppt-deliverable-surface.test.ts',
  'tests/ppt-hermes-generation.test.ts',
  'tests/ppt-native-ppt-runtime.test.ts',
  'tests/ppt-native-python-layouts.test.ts',
  'tests/preflight-gates.test.ts',
  'tests/private-profile.test.ts',
  'tests/product-entry-manuscript-source.test.ts',
  'tests/product-entry-native-ppt-proof-lane.test.ts',
  'tests/product-entry-runtime-manager-registration.test.ts',
  'tests/product-entry-session-checkpoint.test.ts',
  'tests/product-entry.test.ts',
  'tests/publication-projection-delivery-contract.test.ts',
  'tests/public-docs-surface.test.ts',
  'tests/reference-quality-os-replacement.test.ts',
  'tests/reference-regression.test.ts',
  'tests/render-html-guardrails.test.ts',
  'tests/review-state-latest-checks.test.ts',
  'tests/review-platform.test.ts',
  'tests/review-stage-concurrency.test.ts',
  'tests/screenshot-cache.test.ts',
  'tests/runtime-performance-report.test.ts',
  'tests/runtime-deliverable-route-recovery.test.ts',
  'tests/rca-executor-backend-contract.test.ts',
  'tests/runtime-deliverable-route.test.ts',
  'tests/screenshot-review-ai-first.test.ts',
  'tests/service-safe-domain-entry.test.ts',
  'tests/source-first-fanout.test.ts',
  'tests/source-intake.test.ts',
  'tests/source-readiness-deep-research-gate.test.ts',
  'tests/source-research.test.ts',
  'tests/workspace-operator-quickstart.test.ts',
  'tests/xiaohongshu-creative-ownership.test.ts',
];

const E2E = [
  'tests/ppt-deliverable-e2e.test.ts',
  'tests/xiaohongshu-deliverable-e2e.test.ts',
];

const HISTORICAL = [
  'tests/direct-delivery-longrun-target.test.ts',
  'tests/hermes-managed-family-closure-truth.test.ts',
  'tests/hermes-stable-family-closure-truth.test.ts',
  'tests/p19-creative-ownership-freeze.test.ts',
  'tests/p20-extension-proof-and-third-family-onboarding.test.ts',
  'tests/p21-operations-and-evaluation-os.test.ts',
  'tests/phase-2-behavior-convergence.test.ts',
  'tests/phase-2-direct-delivery-lifecycle-stage-convergence.test.ts',
  'tests/phase-2-direct-delivery-operator-handoff-hardening.test.ts',
  'tests/phase-2-family-parity-governance-surface-convergence.test.ts',
  'tests/phase-2-family-source-truth-consumption-convergence.test.ts',
  'tests/phase-2-operator-surface-consistency-hardening.test.ts',
  'tests/phase-2-publication-projection-delivery-contract-convergence.test.ts',
  'tests/phase-2-review-export-gate-audit-hardening.test.ts',
  'tests/phase-2-runtime-watch-locator-integrity-hardening.test.ts',
  'tests/phase-2-source-intake-activation-package-freeze.test.ts',
  'tests/phase-2-source-intake-shared-source-truth-baseline.test.ts',
  'tests/phase-2-source-readiness-deep-research-trigger-gate-convergence.test.ts',
  'tests/phase-2-workspace-operator-quickstart-convergence.test.ts',
  'tests/poster-production-hardening-freeze.test.ts',
  'tests/runtime-alignment-p0.test.ts',
  'tests/stable-deliverable-manual-fidelity.test.ts',
  'tests/stable-deliverable-manual-test-package.test.ts',
  'tests/upstream-hermes-agent-activation-package.test.ts',
  'tests/upstream-hermes-agent-final-target-shape.test.ts',
  'tests/upstream-hermes-agent-live-verification-blocker.test.ts',
  'tests/upstream-hermes-agent-live-verification-closeout.test.ts',
];

const FAST = [
  'tests/ai-first-authoring-boundary.test.ts',
  'tests/typescript-baseline.test.ts',
  'tests/typescript-closeout-audit.test.ts',
  'tests/runtime-protocol-workspace.test.ts',
  'tests/overlay-registry.test.ts',
  'tests/profile-contract-hydration.test.ts',
  'tests/gateway-actions.test.ts',
  'tests/worktree-package-resolution.test.ts',
  'tests/codex-cli-client.test.ts',
  'tests/codex-session-pool.test.ts',
  'tests/codex-cli-timeout.test.ts',
  'tests/runtime-deliverable-route-recovery.test.ts',
  'tests/runtime-deliverable-route.test.ts',
  'tests/runtime-performance-report.test.ts',
  'tests/public-docs-surface.test.ts',
  'tests/ppt-mainline-quality-closeout.test.ts',
  'tests/ppt-hermes-generation.test.ts',
  'tests/ppt-native-ppt-runtime.test.ts',
  'tests/ppt-native-python-layouts.test.ts',
  'tests/ppt-render-batch-generation.test.ts',
  'tests/service-safe-domain-entry.test.ts',
  'tests/product-entry-manuscript-source.test.ts',
  'tests/product-entry-native-ppt-proof-lane.test.ts',
  'tests/python-native-helper-catalog.test.ts',
  'tests/product-entry-runtime-manager-registration.test.ts',
  'tests/product-entry-session-checkpoint.test.ts',
  'tests/product-entry.test.ts',
  'tests/source-augmentation-provider.test.ts',
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

function assertTrackedFiles(files, groupName) {
  for (const file of files) {
    if (!existsSync(path.resolve(file))) {
      throw new Error(`${groupName} 引用了不存在的测试文件: ${file}`);
    }
  }
}

function assertPartition() {
  const base = [...META, ...FAMILY, ...INTEGRATION, ...E2E, ...HISTORICAL];
  assertRootTestPartition({
    discoveredFiles: discoverRootTestFiles(),
    partitionFiles: base,
  });
}

function printUsage() {
  process.stdout.write([
    '用法: node --experimental-strip-types scripts/run-test-group.ts <fast|meta|family|integration|e2e|historical|full> [node --test 参数]',
    '示例: node --experimental-strip-types scripts/run-test-group.ts full --test-reporter=dot',
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
