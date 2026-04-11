import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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
  'tests/xiaohongshu-overlay.test.js',
];

const INTEGRATION = [
  'tests/cli-v2-smoke.test.js',
  'tests/deliverable-review-loop.test.js',
  'tests/direct-delivery-lifecycle-stage-summary.test.js',
  'tests/direct-delivery-operator-handoff.test.js',
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
  'tests/runtime-deliverable-route.test.js',
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

const FAST = [
  'tests/runtime-alignment-p0.test.js',
  'tests/typescript-baseline.test.js',
  'tests/runtime-protocol-workspace.test.js',
  'tests/overlay-registry.test.js',
  'tests/profile-contract-hydration.test.js',
  'tests/gateway-actions.test.js',
  'tests/runtime-deliverable-route.test.js',
  'tests/source-augmentation-provider.test.js',
];

const GROUPS = {
  fast: FAST,
  meta: META,
  integration: INTEGRATION,
  e2e: E2E,
  full: [...META, ...INTEGRATION, ...E2E],
};

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

const result = spawnSync(process.execPath, ['--test', ...forwardedArgs, ...GROUPS[groupName]], {
  stdio: 'inherit',
  cwd: repoRoot,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
