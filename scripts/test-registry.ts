type TestFile = `tests/${string}.test.${'js' | 'ts'}`;

const TEST_LANES = Object.freeze(['meta', 'integration', 'e2e', 'historical'] as const);
type TestLane = (typeof TEST_LANES)[number];
type TestRegistryEntry = Readonly<{
  file: TestFile;
  lane: TestLane;
  smoke?: true;
  fast?: true;
  routeHeavy?: true;
}>;
type TestGroups = Record<string, TestFile[]>;
export type VerifyStep = Readonly<
  | { kind: 'build' }
  | { kind: 'typecheck' }
  | { kind: 'test-group'; group: string }
  | { kind: 'private-platform-readback'; output: string }
  | { kind: 'line-budget'; strict: boolean }
  | { kind: 'structure'; strict: boolean }
>;
export type VerifyLanePlan = Readonly<{
  lane: string;
  steps: readonly VerifyStep[];
}>;

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

export const TEST_REGISTRY = Object.freeze([
  { file: 'tests/ci-workflow.test.js', lane: 'meta' },
  { file: 'tests/candidate-racing.test.js', lane: 'meta' },
  { file: 'tests/codex-plugin.test.js', lane: 'meta' },
  { file: 'tests/codex-executor-adapter.test.js', lane: 'meta', fast: true },
  { file: 'tests/codex-session-pool.test.js', lane: 'meta', fast: true },
  { file: 'tests/codex-cli-timeout.test.js', lane: 'meta', fast: true },
  { file: 'tests/family-onboarding-standard.test.js', lane: 'meta' },
  { file: 'tests/harness-completion-audit.test.js', lane: 'meta' },
  { file: 'tests/image-ppt-proof-runner.test.js', lane: 'meta' },
  { file: 'tests/kernel-split-extraction.test.js', lane: 'meta' },
  { file: 'tests/line-budget.test.js', lane: 'meta' },
  { file: 'tests/managed-framework-link.test.js', lane: 'meta', fast: true },
  { file: 'tests/native-ppt-proof-fixture-contract.test.js', lane: 'meta' },
  { file: 'tests/overlay-registry.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/opl-agent-pack-contracts-bridge-and-opl.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-pack-contracts-canonical.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-pack-contracts-generated-surface.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-pack-contracts-semantic-pack.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-pack-contracts-source-morphology.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-package-manifest.test.js', lane: 'meta' },
  { file: 'tests/opl-cognitive-kernel-adoption.test.ts', lane: 'meta' },
  { file: 'tests/opl-family-contract-adoption.test.js', lane: 'meta' },
  { file: 'tests/opl-family-contract-runtime-manager.test.js', lane: 'meta' },
  { file: 'tests/opl-family-contract-adoption-source-shape.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-lab-longline-migration.test.js', lane: 'meta' },
  { file: 'tests/pack-first-completion.test.js', lane: 'meta' },
  { file: 'tests/ppt-mainline-quality-closeout.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-image-first-contract.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-image-first-quality-nonregression.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-image-first-style-benchmark.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-image-pages-runtime.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-image-review-export.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-image-route-selection.test.js', lane: 'meta', fast: true },
  { file: 'tests/ppt-html-route-quality-nonregression.test.js', lane: 'meta' },
  { file: 'tests/ppt-overlay.test.js', lane: 'meta' },
  { file: 'tests/ppt-native-pptx-quality-nonregression.test.js', lane: 'meta' },
  { file: 'tests/profile-contract-hydration.test.js', lane: 'meta', fast: true },
  { file: 'tests/python-native-helper-catalog.test.js', lane: 'meta', fast: true },
  { file: 'tests/rca-production-acceptance.test.js', lane: 'meta' },
  { file: 'tests/rca-workspace-receipt-scaleout-evidence.test.js', lane: 'meta' },
  { file: 'tests/rca-efficiency-handoff-projection.test.js', lane: 'meta' },
  { file: 'tests/rca-goal-workflow-agent-lab-suite.test.js', lane: 'meta', fast: true },
  { file: 'tests/rca-owner-chain-live-progress-evidence.test.js', lane: 'meta', fast: true },
  { file: 'tests/rca-ppt-three-route-agent-lab-suite.test.js', lane: 'meta', fast: true },
  { file: 'tests/rca-external-work-order-owner-closeout.test.js', lane: 'meta' },
  { file: 'tests/rca-foundry-agent-os-domain-kernel-manifest.test.ts', lane: 'meta', fast: true },
  { file: 'tests/rca-one-shot-closeout.test.js', lane: 'meta' },
  { file: 'tests/rca-functional-audit-retirement.test.js', lane: 'meta' },
  { file: 'tests/rca-private-platform-retirement-readback.test.js', lane: 'meta' },
  { file: 'tests/rca-legacy-name-allowance.test.js', lane: 'meta' },
  { file: 'tests/rca-opl-generic-primitive-consumption.test.js', lane: 'meta' },
  { file: 'tests/rca-retired-payload-pointer-guard.test.js', lane: 'meta' },
  { file: 'tests/rca-retired-surface-active-guard.test.js', lane: 'meta' },
  { file: 'tests/render-ceiling-deepening.test.js', lane: 'meta' },
  { file: 'tests/runtime-protocol-workspace.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/run-test-group-live-upstream-command.test.js', lane: 'meta' },
  { file: 'tests/source-augmentation-contract.test.js', lane: 'meta' },
  { file: 'tests/source-augmentation-provider.test.js', lane: 'meta', fast: true },
  { file: 'tests/stage-folder-contract.test.js', lane: 'meta', fast: true },
  { file: 'tests/stage-run-kernel-profile.test.js', lane: 'meta', fast: true },
  { file: 'tests/test-workspace-lifecycle.test.js', lane: 'meta' },
  { file: 'tests/typescript-baseline.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/typescript-closeout-audit.test.js', lane: 'meta', fast: true },
  { file: 'tests/typescript-package-surfaces.test.js', lane: 'meta' },
  { file: 'tests/typescript-service-boundaries.test.js', lane: 'meta' },
  { file: 'tests/worktree-package-resolution.test.js', lane: 'meta', fast: true },
  { file: 'tests/xiaohongshu-overlay.test.js', lane: 'meta' },
  { file: 'tests/block-content-fit-review.test.js', lane: 'integration' },
  { file: 'tests/block-content-fit-review-surface-children.test.js', lane: 'integration' },
  { file: 'tests/deliverable-review-loop.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/direct-delivery-operator-handoff.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/export-preview-cache.test.js', lane: 'integration' },
  { file: 'tests/family-parity-governance-surface.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/family-source-truth-consumption.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/product-domain-actions.test.js', lane: 'integration', smoke: true, fast: true },
  { file: 'tests/runtime-topology-regression.test.js', lane: 'integration' },
  { file: 'tests/codex-runtime-canonical-path.test.js', lane: 'integration' },
  { file: 'tests/poster-creative-ownership.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/ppt-render-batch-generation.test.js', lane: 'integration', fast: true },
  { file: 'tests/ppt-deliverable-surface.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/ppt-generation.test.js', lane: 'integration', fast: true },
  { file: 'tests/ppt-native-codex-invocation-blocker.test.js', lane: 'integration', fast: true },
  { file: 'tests/ppt-native-ppt-engine-contract.test.ts', lane: 'integration', fast: true },
  { file: 'tests/ppt-native-ppt-runtime.test.js', lane: 'integration', fast: true, routeHeavy: true },
  { file: 'tests/ppt-native-template-layout-grammar-compact-sample.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-template-layout-grammar-structural-retry.test.js', lane: 'integration', fast: true },
  { file: 'tests/ppt-native-template-layout-grammar.test.js', lane: 'integration', fast: true },
  { file: 'tests/ppt-native-plan-preflight-panel-safe-area.test.js', lane: 'integration', fast: true },
  { file: 'tests/ppt-native-ppt-repair-runtime.test.js', lane: 'integration', fast: true, routeHeavy: true },
  { file: 'tests/ppt-native-editability-regression.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-object-package.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-benchmark-fixture-preservation.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-quality-package-gates.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-quality-package-readback.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-quality-semantic-gates.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-python-layouts.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-python-sample-layouts.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-python-render-preview.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-python-system-map-layouts.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-python-text-safety.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-template-preservation.test.js', lane: 'integration' },
  { file: 'tests/preflight-gates.test.js', lane: 'integration' },
  { file: 'tests/product-entry-manuscript-source.test.js', lane: 'integration', fast: true },
  { file: 'tests/product-entry-native-ppt-live-proof.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/product-entry-native-ppt-proof-lane.test.js', lane: 'integration', fast: true },
  { file: 'tests/product-entry-route-integration.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/product-entry-runtime-manager-registration.test.js', lane: 'integration', fast: true },
  { file: 'tests/product-entry-session-checkpoint.test.js', lane: 'integration', fast: true },
  { file: 'tests/product-entry.test.js', lane: 'integration', smoke: true, fast: true },
  { file: 'tests/publication-projection-delivery-contract.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/render-html-guardrails.test.js', lane: 'integration' },
  { file: 'tests/review-state-latest-checks.test.js', lane: 'integration' },
  { file: 'tests/review-platform.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/review-stage-concurrency.test.js', lane: 'integration' },
  { file: 'tests/screenshot-cache.test.js', lane: 'integration' },
  { file: 'tests/runtime-performance-report.test.ts', lane: 'integration', fast: true },
  { file: 'tests/runtime-deliverable-route-integration.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/runtime-deliverable-route-recovery.test.js', lane: 'integration', fast: true, routeHeavy: true },
  { file: 'tests/rca-executor-backend-contract.test.ts', lane: 'integration' },
  { file: 'tests/runtime-deliverable-route.test.js', lane: 'integration', fast: true, routeHeavy: true },
  { file: 'tests/screenshot-review-ai-first.test.js', lane: 'integration' },
  { file: 'tests/service-safe-domain-entry.test.js', lane: 'integration', fast: true },
  { file: 'tests/source-first-fanout.test.js', lane: 'integration' },
  { file: 'tests/source-intake.test.js', lane: 'integration' },
  { file: 'tests/source-readiness-deep-research-gate.test.js', lane: 'integration' },
  { file: 'tests/source-research.test.js', lane: 'integration' },
  { file: 'tests/workspace-operator-quickstart.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/xiaohongshu-creative-ownership.test.js', lane: 'integration', routeHeavy: true },
  { file: 'tests/ppt-deliverable-e2e.test.js', lane: 'e2e', routeHeavy: true },
  { file: 'tests/xiaohongshu-deliverable-e2e.test.js', lane: 'e2e', routeHeavy: true },
  { file: 'tests/runtime-program-provenance.test.js', lane: 'historical' },
]) satisfies readonly TestRegistryEntry[];

export function rootPartitionFiles(): TestFile[] {
  return TEST_REGISTRY.map((entry) => entry.file);
}

function primaryLaneFiles(lane: TestLane): TestFile[] {
  return TEST_REGISTRY.filter((entry) => entry.lane === lane).map((entry) => entry.file);
}

function taggedFiles(tag: 'smoke' | 'fast'): TestFile[] {
  return TEST_REGISTRY.filter((entry) => entry[tag] === true).map((entry) => entry.file);
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
  const integration = primaryLaneFiles('integration');
  const e2e = primaryLaneFiles('e2e');
  const historical = primaryLaneFiles('historical');
  const fast = taggedFiles('fast');
  const full = [...meta, ...integration, ...e2e];
  const metaCi = excludeCoveredTestFiles(meta, fast);
  const integrationRemaining = excludeCoveredTestFiles(integration, fast);

  return {
    smoke: taggedFiles('smoke'),
    fast,
    meta,
    'meta:ci': metaCi,
    integration,
    'integration:remaining': integrationRemaining,
    e2e,
    historical,
    full,
    'full:with-historical': [...full, ...historical],
    'full:remaining': excludeCoveredTestFiles(full, [
      ...fast,
      ...metaCi,
      ...integrationRemaining,
    ]),
  };
}

const VERIFY_LANE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'private-platform': 'private-platform:strict',
  'private-platform-strict': 'private-platform:strict',
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
      { kind: 'test-group', group: 'meta:ci' },
    ],
    'line-budget': [{ kind: 'line-budget', strict: false }],
    'line-budget-strict': [{ kind: 'line-budget', strict: true }],
    'private-platform:readback': [{ kind: 'private-platform-readback', output: 'stdout' }],
    'private-platform:strict': [{ kind: 'private-platform-readback', output: '/tmp/redcube-ai-private-platform-retirement.json' }],
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

  const routeHeavyFiles = new Set<TestFile>(
    TEST_REGISTRY.filter((entry) => entry.routeHeavy).map((entry) => entry.file),
  );
  return {
    parallel_files: plannedFiles.filter((file) => !routeHeavyFiles.has(file)),
    serialized_files: plannedFiles.filter((file) => routeHeavyFiles.has(file)),
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
