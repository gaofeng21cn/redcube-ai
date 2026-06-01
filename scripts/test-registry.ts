// @ts-nocheck
import path from 'node:path';

export const TEST_LANES = Object.freeze(['meta', 'family', 'integration', 'e2e', 'historical']);
export const TEST_SIZES = Object.freeze(['small', 'medium', 'large']);
export const TEST_STATES = Object.freeze(['active', 'historical']);

const PRIMARY_TEST_FILES = Object.freeze({
  meta: Object.freeze([
    'tests/ai-first-authoring-boundary.test.ts',
    'tests/ci-workflow.test.ts',
    'tests/candidate-racing.test.ts',
    'tests/codex-plugin.test.ts',
    'tests/creative-ownership-recovery-audit.test.ts',
    'tests/codex-cli-client.test.ts',
    'tests/codex-session-pool.test.ts',
    'tests/codex-cli-timeout.test.ts',
    'tests/family-onboarding-standard.test.ts',
    'tests/harness-completion-audit.test.ts',
    'tests/image-ppt-proof-runner.test.ts',
    'tests/kernel-split-extraction.test.ts',
    'tests/line-budget.test.ts',
    'tests/native-ppt-proof-fixture-contract.test.ts',
    'tests/overlay-registry.test.ts',
    'tests/opl-agent-pack-contracts.test.ts',
    'tests/opl-family-contract-adoption.test.ts',
    'tests/opl-family-contract-runtime-manager.test.ts',
    'tests/opl-family-contract-adoption-source-shape.test.ts',
    'tests/opl-agent-lab-longline-migration.test.ts',
    'tests/opl-transition-hosted-attempt-receipt.test.ts',
    'tests/pack-first-completion.test.ts',
    'tests/ppt-mainline-quality-closeout.test.ts',
    'tests/ppt-image-first-contract.test.ts',
    'tests/ppt-image-first-quality-nonregression.test.ts',
    'tests/ppt-image-first-style-benchmark.test.ts',
    'tests/ppt-image-pages-runtime.test.ts',
    'tests/ppt-image-review-export.test.ts',
    'tests/ppt-image-route-selection.test.ts',
    'tests/ppt-html-route-quality-nonregression.test.ts',
    'tests/ppt-overlay.test.ts',
    'tests/ppt-native-pptx-quality-nonregression.test.ts',
    'tests/profile-contract-hydration.test.ts',
    'tests/python-native-helper-catalog.test.ts',
    'tests/publish-governance-single-owner.test.ts',
    'tests/rca-production-acceptance.test.ts',
    'tests/rca-workspace-receipt-scaleout-evidence.test.ts',
    'tests/rca-efficiency-handoff-projection.test.ts',
    'tests/rca-goal-workflow-agent-lab-suite.test.ts',
    'tests/rca-ppt-three-route-agent-lab-suite.test.ts',
    'tests/rca-external-work-order-owner-closeout.test.ts',
    'tests/rca-one-shot-closeout.test.ts',
    'tests/rca-retired-surface-guard.test.ts',
    'tests/real-route-evolution-probe.test.ts',
    'tests/reference-quality-os.test.ts',
    'tests/render-ceiling-deepening.test.ts',
    'tests/runtime-config.test.ts',
    'tests/runtime-protocol-workspace.test.ts',
    'tests/run-test-group-live-upstream-command.test.ts',
    'tests/source-augmentation-contract.test.ts',
    'tests/source-augmentation-provider.test.ts',
    'tests/typescript-baseline.test.ts',
    'tests/typescript-closeout-audit.test.ts',
    'tests/typescript-package-surfaces.test.ts',
    'tests/typescript-service-boundaries.test.ts',
    'tests/worktree-package-resolution.test.ts',
    'tests/xiaohongshu-overlay.test.ts',
  ]),
  family: Object.freeze([
    'tests/family-shared-release.test.ts',
  ]),
  integration: Object.freeze([
    'tests/block-content-fit-review.test.ts',
    'tests/block-content-fit-review-surface-children.test.ts',
    'tests/cli-v2-smoke.test.ts',
    'tests/deliverable-review-loop.test.ts',
    'tests/direct-delivery-operator-handoff.test.ts',
    'tests/export-preview-cache.test.ts',
    'tests/family-parity-governance-surface.test.ts',
    'tests/family-source-truth-consumption.test.ts',
    'tests/product-domain-actions.test.ts',
    'tests/runtime-topology-regression.test.ts',
    'tests/codex-runtime-canonical-path.test.ts',
    'tests/product-domain-action-api.test.ts',
    'tests/poster-creative-ownership.test.ts',
    'tests/ppt-creative-ownership.test.ts',
    'tests/ppt-render-batch-generation.test.ts',
    'tests/ppt-deliverable-surface.test.ts',
    'tests/ppt-hermes-generation.test.ts',
    'tests/ppt-native-codex-invocation-blocker.test.ts',
    'tests/ppt-native-ppt-engine-contract.test.ts',
    'tests/ppt-native-ppt-runtime.test.ts',
    'tests/ppt-native-template-layout-grammar-compact-sample.test.ts',
    'tests/ppt-native-template-layout-grammar-structural-retry.test.ts',
    'tests/ppt-native-template-layout-grammar.test.ts',
    'tests/ppt-native-plan-preflight-panel-safe-area.test.ts',
    'tests/ppt-native-ppt-repair-runtime.test.ts',
    'tests/ppt-native-python-layouts.test.ts',
    'tests/ppt-native-python-sample-layouts.test.ts',
    'tests/ppt-native-python-render-preview.test.ts',
    'tests/ppt-native-python-system-map-layouts.test.ts',
    'tests/ppt-native-python-text-safety.test.ts',
    'tests/preflight-gates.test.ts',
    'tests/private-profile.test.ts',
    'tests/product-entry-manuscript-source.test.ts',
    'tests/product-entry-native-ppt-live-proof.test.ts',
    'tests/product-entry-native-ppt-proof-lane.test.ts',
    'tests/product-entry-route-integration.test.ts',
    'tests/product-entry-runtime-manager-registration.test.ts',
    'tests/product-entry-session-checkpoint.test.ts',
    'tests/product-entry.test.ts',
    'tests/publication-projection-delivery-contract.test.ts',
    'tests/reference-quality-os-replacement.test.ts',
    'tests/reference-regression.test.ts',
    'tests/render-html-guardrails.test.ts',
    'tests/review-state-latest-checks.test.ts',
    'tests/review-platform.test.ts',
    'tests/review-stage-concurrency.test.ts',
    'tests/screenshot-cache.test.ts',
    'tests/runtime-performance-report.test.ts',
    'tests/runtime-deliverable-route-integration.test.ts',
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
  ]),
  e2e: Object.freeze([
    'tests/ppt-deliverable-e2e.test.ts',
    'tests/xiaohongshu-deliverable-e2e.test.ts',
  ]),
  historical: Object.freeze([
    'tests/runtime-program-provenance.test.ts',
  ]),
});

const SMOKE_FILES = Object.freeze([
  'tests/typescript-baseline.test.ts',
  'tests/runtime-protocol-workspace.test.ts',
  'tests/overlay-registry.test.ts',
  'tests/product-domain-actions.test.ts',
  'tests/product-entry.test.ts',
]);

const FAST_FILES = Object.freeze([
  'tests/ai-first-authoring-boundary.test.ts',
  'tests/typescript-baseline.test.ts',
  'tests/typescript-closeout-audit.test.ts',
  'tests/runtime-protocol-workspace.test.ts',
  'tests/overlay-registry.test.ts',
  'tests/profile-contract-hydration.test.ts',
  'tests/product-domain-actions.test.ts',
  'tests/worktree-package-resolution.test.ts',
  'tests/codex-cli-client.test.ts',
  'tests/codex-session-pool.test.ts',
  'tests/codex-cli-timeout.test.ts',
  'tests/runtime-deliverable-route-recovery.test.ts',
  'tests/runtime-deliverable-route.test.ts',
  'tests/runtime-performance-report.test.ts',
  'tests/ppt-mainline-quality-closeout.test.ts',
  'tests/ppt-image-first-contract.test.ts',
  'tests/ppt-image-first-quality-nonregression.test.ts',
  'tests/ppt-hermes-generation.test.ts',
  'tests/ppt-native-codex-invocation-blocker.test.ts',
  'tests/ppt-native-ppt-engine-contract.test.ts',
  'tests/ppt-native-ppt-runtime.test.ts',
  'tests/ppt-native-template-layout-grammar-structural-retry.test.ts',
  'tests/ppt-native-template-layout-grammar.test.ts',
  'tests/ppt-native-plan-preflight-panel-safe-area.test.ts',
  'tests/ppt-native-ppt-repair-runtime.test.ts',
  'tests/ppt-image-pages-runtime.test.ts',
  'tests/ppt-image-review-export.test.ts',
  'tests/ppt-image-route-selection.test.ts',
  'tests/ppt-image-first-style-benchmark.test.ts',
  'tests/ppt-render-batch-generation.test.ts',
  'tests/service-safe-domain-entry.test.ts',
  'tests/product-entry-manuscript-source.test.ts',
  'tests/product-entry-native-ppt-proof-lane.test.ts',
  'tests/python-native-helper-catalog.test.ts',
  'tests/product-entry-runtime-manager-registration.test.ts',
  'tests/product-entry-session-checkpoint.test.ts',
  'tests/real-route-evolution-probe.test.ts',
  'tests/product-entry.test.ts',
  'tests/rca-goal-workflow-agent-lab-suite.test.ts',
  'tests/rca-ppt-three-route-agent-lab-suite.test.ts',
  'tests/source-augmentation-provider.test.ts',
]);

const smokeFileSet = new Set(SMOKE_FILES);
const fastFileSet = new Set(FAST_FILES);

function coverageIdFor(file) {
  return path.basename(file).replace(/\.(?:test\.)?(?:js|ts)$/, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function sizeFor({ lane, file }) {
  if (lane === 'e2e') return 'large';
  if (smokeFileSet.has(file) || lane === 'meta' || lane === 'family' || lane === 'historical') return 'small';
  return 'medium';
}

function layerFor({ lane, file }) {
  if (smokeFileSet.has(file)) return 'smoke';
  if (fastFileSet.has(file)) return 'core_regression';
  if (lane === 'historical') return 'provenance';
  return lane;
}

export const TEST_REGISTRY = Object.freeze(
  TEST_LANES.flatMap((lane) => PRIMARY_TEST_FILES[lane].map((file) => Object.freeze({
    file,
    lane,
    size: sizeFor({ lane, file }),
    layer: layerFor({ lane, file }),
    state: lane === 'historical' ? 'historical' : 'active',
    ci_default: lane === 'family' || (lane === 'meta' && !fastFileSet.has(file)) || fastFileSet.has(file),
    coverage_id: coverageIdFor(file),
  }))),
);

export function rootPartitionFiles() {
  return TEST_REGISTRY.map((entry) => entry.file);
}

export function primaryLaneFiles(lane) {
  return TEST_REGISTRY
    .filter((entry) => entry.lane === lane)
    .map((entry) => entry.file);
}

export function fastFiles() {
  return FAST_FILES.filter((file) => TEST_REGISTRY.some((entry) => entry.file === file));
}

export function smokeFiles() {
  return SMOKE_FILES.filter((file) => TEST_REGISTRY.some((entry) => entry.file === file));
}

export function ciDefaultFiles() {
  return TEST_REGISTRY
    .filter((entry) => entry.ci_default)
    .map((entry) => entry.file);
}

function excludeCoveredTestFiles(baseFiles = [], coveredFiles = []) {
  const covered = new Set(coveredFiles);
  const selected = [];
  for (const file of baseFiles) {
    if (!covered.has(file) && !selected.includes(file)) {
      selected.push(file);
    }
  }
  return selected;
}

export function buildTestGroups() {
  const meta = primaryLaneFiles('meta');
  const family = primaryLaneFiles('family');
  const integration = primaryLaneFiles('integration');
  const e2e = primaryLaneFiles('e2e');
  const historical = primaryLaneFiles('historical');
  const fast = fastFiles();
  const full = [...meta, ...family, ...integration, ...e2e];
  const metaCi = excludeCoveredTestFiles(meta, fast);
  const integrationRemaining = excludeCoveredTestFiles(integration, fast);

  const groups = {
    smoke: smokeFiles(),
    fast,
    meta,
    'meta:ci': metaCi,
    family,
    integration,
    'integration:remaining': integrationRemaining,
    e2e,
    historical,
    full,
    'full:with-historical': [...full, ...historical],
  };

  groups['full:remaining'] = excludeCoveredTestFiles(full, [
    ...fast,
    ...family,
    ...metaCi,
    ...integrationRemaining,
  ]);

  return groups;
}

export function assertValidTestRegistry({ registry = TEST_REGISTRY } = {}) {
  const files = registry.map((entry) => entry.file);
  const duplicateFiles = files.filter((file, index) => files.indexOf(file) !== index);
  if (duplicateFiles.length > 0) {
    throw new Error(`测试注册表存在重复文件: ${[...new Set(duplicateFiles)].join(', ')}`);
  }

  for (const entry of registry) {
    for (const field of ['file', 'lane', 'size', 'layer', 'state', 'ci_default', 'coverage_id']) {
      if (!Object.hasOwn(entry, field)) {
        throw new Error(`测试注册项缺少字段 ${field}: ${JSON.stringify(entry)}`);
      }
    }
    if (!TEST_LANES.includes(entry.lane)) {
      throw new Error(`测试注册项 lane 无效: ${entry.file} -> ${entry.lane}`);
    }
    if (!TEST_SIZES.includes(entry.size)) {
      throw new Error(`测试注册项 size 无效: ${entry.file} -> ${entry.size}`);
    }
    if (!TEST_STATES.includes(entry.state)) {
      throw new Error(`测试注册项 state 无效: ${entry.file} -> ${entry.state}`);
    }
    if (typeof entry.ci_default !== 'boolean') {
      throw new Error(`测试注册项 ci_default 必须是 boolean: ${entry.file}`);
    }
    if (!/^tests\/[^/]+\.test\.(?:js|ts)$/.test(entry.file)) {
      throw new Error(`测试注册表只接受根级测试文件: ${entry.file}`);
    }
  }
}
