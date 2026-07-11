type TestFile = `tests/${string}.test.${'js' | 'ts'}`;

const TEST_LANES = Object.freeze(['meta', 'family', 'integration', 'e2e', 'historical'] as const);
type TestLane = (typeof TEST_LANES)[number];
type TestRegistryEntry = Readonly<{
  file: TestFile;
  lane: TestLane;
}>;
type TestGroups = Record<string, TestFile[]>;
export type VerifyStep = Readonly<
  | { kind: 'build' }
  | { kind: 'typecheck' }
  | { kind: 'test-group'; group: string }
  | { kind: 'private-platform-readback'; scope: 'private-platform' | 'default-caller-tail'; output: string }
  | { kind: 'line-budget'; strict: boolean }
  | { kind: 'structure'; strict: boolean }
>;
export type VerifyLanePlan = Readonly<{
  lane: string;
  steps: readonly VerifyStep[];
}>;

const PRIMARY_TEST_FILES = Object.freeze({
  meta: Object.freeze([
    'tests/ai-first-authoring-boundary.test.ts',
    'tests/ci-workflow.test.ts',
    'tests/candidate-racing.test.ts',
    'tests/codex-plugin.test.ts',
    'tests/creative-ownership-recovery-audit.test.ts',
    'tests/codex-executor-adapter.test.ts',
    'tests/codex-session-pool.test.ts',
    'tests/codex-cli-timeout.test.ts',
    'tests/family-onboarding-standard.test.ts',
    'tests/harness-completion-audit.test.ts',
    'tests/image-ppt-proof-runner.test.ts',
    'tests/kernel-split-extraction.test.ts',
    'tests/line-budget.test.ts',
    'tests/native-ppt-proof-fixture-contract.test.ts',
    'tests/overlay-registry.test.ts',
    'tests/opl-agent-pack-contracts-bridge-and-opl.test.ts',
    'tests/opl-agent-pack-contracts-canonical.test.ts',
    'tests/opl-agent-pack-contracts-generated-surface.test.ts',
    'tests/opl-agent-pack-contracts-semantic-pack.test.ts',
    'tests/opl-agent-pack-contracts-source-morphology.test.ts',
    'tests/opl-agent-package-manifest.test.ts',
    'tests/opl-cognitive-kernel-adoption.test.ts',
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
    'tests/rca-owner-chain-live-progress-evidence.test.ts',
    'tests/rca-ppt-three-route-agent-lab-suite.test.ts',
    'tests/rca-external-work-order-owner-closeout.test.ts',
    'tests/rca-foundry-agent-os-domain-kernel-manifest.test.ts',
    'tests/rca-one-shot-closeout.test.ts',
    'tests/rca-functional-audit-retirement.test.ts',
    'tests/rca-private-platform-retirement-readback.test.ts',
    'tests/rca-legacy-name-allowance.test.ts',
    'tests/rca-opl-generic-primitive-consumption.test.ts',
    'tests/rca-retired-payload-pointer-guard.test.ts',
    'tests/rca-retired-surface-active-guard.test.ts',
    'tests/render-ceiling-deepening.test.ts',
    'tests/runtime-config.test.ts',
    'tests/runtime-protocol-workspace.test.ts',
    'tests/run-test-group-live-upstream-command.test.ts',
    'tests/source-augmentation-contract.test.ts',
    'tests/source-augmentation-provider.test.ts',
    'tests/stage-folder-contract.test.ts',
    'tests/stage-run-kernel-profile.test.ts',
    'tests/test-workspace-lifecycle.test.ts',
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
    'tests/poster-creative-ownership.test.ts',
    'tests/ppt-creative-ownership.test.ts',
    'tests/ppt-render-batch-generation.test.ts',
    'tests/ppt-deliverable-surface.test.ts',
    'tests/ppt-generation.test.ts',
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
} satisfies Record<TestLane, readonly TestFile[]>);

const SMOKE_FILES = Object.freeze([
  'tests/typescript-baseline.test.ts',
  'tests/runtime-protocol-workspace.test.ts',
  'tests/overlay-registry.test.ts',
  'tests/product-domain-actions.test.ts',
  'tests/product-entry.test.ts',
]) satisfies readonly TestFile[];

const FAST_FILES = Object.freeze([
  'tests/ai-first-authoring-boundary.test.ts',
  'tests/typescript-baseline.test.ts',
  'tests/typescript-closeout-audit.test.ts',
  'tests/runtime-protocol-workspace.test.ts',
  'tests/overlay-registry.test.ts',
  'tests/profile-contract-hydration.test.ts',
  'tests/product-domain-actions.test.ts',
  'tests/worktree-package-resolution.test.ts',
  'tests/codex-executor-adapter.test.ts',
  'tests/codex-session-pool.test.ts',
  'tests/codex-cli-timeout.test.ts',
  'tests/runtime-deliverable-route-recovery.test.ts',
  'tests/runtime-deliverable-route.test.ts',
  'tests/runtime-performance-report.test.ts',
  'tests/ppt-mainline-quality-closeout.test.ts',
  'tests/ppt-image-first-contract.test.ts',
  'tests/ppt-image-first-quality-nonregression.test.ts',
  'tests/ppt-generation.test.ts',
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
  'tests/product-entry.test.ts',
  'tests/rca-goal-workflow-agent-lab-suite.test.ts',
  'tests/rca-owner-chain-live-progress-evidence.test.ts',
  'tests/rca-foundry-agent-os-domain-kernel-manifest.test.ts',
  'tests/rca-ppt-three-route-agent-lab-suite.test.ts',
  'tests/source-augmentation-provider.test.ts',
  'tests/stage-folder-contract.test.ts',
  'tests/stage-run-kernel-profile.test.ts',
]) satisfies readonly TestFile[];

const smokeFileSet = new Set(SMOKE_FILES);
const fastFileSet = new Set(FAST_FILES);
const LIVE_CODEX_PREFLIGHT_GROUPS = new Set([
  'integration',
  'integration:remaining',
  'e2e',
  'full',
  'full:remaining',
  'full:with-historical',
]) satisfies ReadonlySet<string>;
const ROUTE_HEAVY_GROUPS = new Set([
  'smoke',
  'fast',
  'integration',
  'integration:remaining',
  'e2e',
  'full',
  'full:remaining',
  'full:with-historical',
]) satisfies ReadonlySet<string>;
const ROUTE_HEAVY_FILES = new Set([
  'tests/deliverable-review-loop.test.ts',
  'tests/direct-delivery-operator-handoff.test.ts',
  'tests/family-parity-governance-surface.test.ts',
  'tests/family-source-truth-consumption.test.ts',
  'tests/poster-creative-ownership.test.ts',
  'tests/ppt-creative-ownership.test.ts',
  'tests/ppt-deliverable-e2e.test.ts',
  'tests/ppt-deliverable-surface.test.ts',
  'tests/ppt-native-ppt-repair-runtime.test.ts',
  'tests/ppt-native-ppt-runtime.test.ts',
  'tests/product-entry-native-ppt-live-proof.test.ts',
  'tests/product-entry-route-integration.test.ts',
  'tests/publication-projection-delivery-contract.test.ts',
  'tests/review-platform.test.ts',
  'tests/runtime-deliverable-route-integration.test.ts',
  'tests/runtime-deliverable-route-recovery.test.ts',
  'tests/runtime-deliverable-route.test.ts',
  'tests/workspace-operator-quickstart.test.ts',
  'tests/xiaohongshu-creative-ownership.test.ts',
  'tests/xiaohongshu-deliverable-e2e.test.ts',
]) satisfies ReadonlySet<string>;

export const TEST_REGISTRY = Object.freeze(
  TEST_LANES.flatMap((lane) => PRIMARY_TEST_FILES[lane].map((file) => Object.freeze({
    file,
    lane,
  }))),
) satisfies readonly TestRegistryEntry[];

export function rootPartitionFiles(): TestFile[] {
  return TEST_REGISTRY.map((entry) => entry.file);
}

function primaryLaneFiles(lane: TestLane): TestFile[] {
  return TEST_REGISTRY
    .filter((entry) => entry.lane === lane)
    .map((entry) => entry.file);
}

function fastFiles(): TestFile[] {
  return FAST_FILES.filter((file) => TEST_REGISTRY.some((entry) => entry.file === file));
}

function smokeFiles(): TestFile[] {
  return SMOKE_FILES.filter((file) => TEST_REGISTRY.some((entry) => entry.file === file));
}

function excludeCoveredTestFiles(
  baseFiles: readonly TestFile[] = [],
  coveredFiles: readonly TestFile[] = [],
): TestFile[] {
  const covered = new Set(coveredFiles);
  const selected: TestFile[] = [];
  for (const file of baseFiles) {
    if (!covered.has(file) && !selected.includes(file)) {
      selected.push(file);
    }
  }
  return selected;
}

export function buildTestGroups(): TestGroups {
  const meta = primaryLaneFiles('meta');
  const family = primaryLaneFiles('family');
  const integration = primaryLaneFiles('integration');
  const e2e = primaryLaneFiles('e2e');
  const historical = primaryLaneFiles('historical');
  const fast = fastFiles();
  const full = [...meta, ...family, ...integration, ...e2e];
  const metaCi = excludeCoveredTestFiles(meta, fast);
  const integrationRemaining = excludeCoveredTestFiles(integration, fast);

  return {
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
    'full:remaining': excludeCoveredTestFiles(full, [
      ...fast,
      ...family,
      ...metaCi,
      ...integrationRemaining,
    ]),
  };
}

const VERIFY_LANE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'private-platform': 'private-platform:strict',
  'private-platform-strict': 'private-platform:strict',
  'default-caller-tail': 'default-caller-tail:strict',
  'default-caller-tail-strict': 'default-caller-tail:strict',
  'integration-remaining': 'integration:remaining',
  'full-remaining': 'full:remaining',
  'full-with-historical': 'full:with-historical',
});

const SPECIAL_VERIFY_LANES = Object.freeze([
  'ci',
  'line-budget',
  'line-budget-strict',
  'private-platform:readback',
  'private-platform:strict',
  'default-caller-tail:readback',
  'default-caller-tail:strict',
  'structure',
  'structure-strict',
]);

export function normalizeVerifyLane(lane: string = 'smoke'): string {
  const requested = String(lane || 'smoke').trim() || 'smoke';
  return VERIFY_LANE_ALIASES[requested] || requested;
}

export function listVerifyLanes(): string[] {
  return [
    ...Object.keys(buildTestGroups()),
    ...SPECIAL_VERIFY_LANES,
    ...Object.keys(VERIFY_LANE_ALIASES),
  ];
}

export function buildVerifyLanePlan(lane: string = 'smoke'): VerifyLanePlan {
  const normalizedLane = normalizeVerifyLane(lane);
  const groups = buildTestGroups();

  if (Object.hasOwn(groups, normalizedLane)) {
    return {
      lane: normalizedLane,
      steps: [
        { kind: 'build' },
        { kind: 'test-group', group: normalizedLane },
      ],
    };
  }

  const specialPlans: Readonly<Record<string, readonly VerifyStep[]>> = {
    ci: [
      { kind: 'typecheck' },
      { kind: 'test-group', group: 'fast' },
      { kind: 'test-group', group: 'family' },
      { kind: 'test-group', group: 'meta:ci' },
    ],
    'line-budget': [{ kind: 'line-budget', strict: false }],
    'line-budget-strict': [{ kind: 'line-budget', strict: true }],
    'private-platform:readback': [{ kind: 'private-platform-readback', scope: 'private-platform', output: 'stdout' }],
    'private-platform:strict': [{ kind: 'private-platform-readback', scope: 'private-platform', output: '/tmp/redcube-ai-private-platform-retirement.json' }],
    'default-caller-tail:readback': [{ kind: 'private-platform-readback', scope: 'default-caller-tail', output: 'stdout' }],
    'default-caller-tail:strict': [{ kind: 'private-platform-readback', scope: 'default-caller-tail', output: '/tmp/redcube-ai-default-caller-tail-readback.json' }],
    structure: [{ kind: 'structure', strict: false }],
    'structure-strict': [{ kind: 'structure', strict: true }],
  };

  if (Object.hasOwn(specialPlans, normalizedLane)) {
    return {
      lane: normalizedLane,
      steps: specialPlans[normalizedLane],
    };
  }

  throw new Error(`Unknown lane: ${lane}`);
}

export function groupRequiresLiveCodexPreflight(groupName: string): boolean {
  return LIVE_CODEX_PREFLIGHT_GROUPS.has(groupName);
}

export function partitionTestFilesForExecution({
  groupName,
  files = [],
}: {
  groupName: string;
  files?: readonly TestFile[];
}): { parallel_files: TestFile[]; serialized_files: TestFile[] } {
  const plannedFiles = [...files];
  if (!ROUTE_HEAVY_GROUPS.has(groupName)) {
    return {
      parallel_files: plannedFiles,
      serialized_files: [],
    };
  }

  return {
    parallel_files: plannedFiles.filter((file) => !ROUTE_HEAVY_FILES.has(file)),
    serialized_files: plannedFiles.filter((file) => ROUTE_HEAVY_FILES.has(file)),
  };
}

export function assertValidTestRegistry({
  registry = TEST_REGISTRY,
}: {
  registry?: readonly TestRegistryEntry[];
} = {}): void {
  const files = registry.map((entry) => entry.file);
  const duplicateFiles = files.filter((file, index) => files.indexOf(file) !== index);
  if (duplicateFiles.length > 0) {
    throw new Error(`测试注册表存在重复文件: ${[...new Set(duplicateFiles)].join(', ')}`);
  }

  for (const entry of registry) {
    for (const field of ['file', 'lane']) {
      if (!Object.hasOwn(entry, field)) {
        throw new Error(`测试注册项缺少字段 ${field}: ${JSON.stringify(entry)}`);
      }
    }
    if (!TEST_LANES.includes(entry.lane)) {
      throw new Error(`测试注册项 lane 无效: ${entry.file} -> ${entry.lane}`);
    }
    if (!/^tests\/[^/]+\.test\.(?:js|ts)$/.test(entry.file)) {
      throw new Error(`测试注册表只接受根级测试文件: ${entry.file}`);
    }
  }
}
