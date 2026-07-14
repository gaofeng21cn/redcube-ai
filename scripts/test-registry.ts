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

export const TEST_REGISTRY: readonly TestRegistryEntry[] = Object.freeze([
  { file: 'tests/ci-workflow.test.js', lane: 'meta' },
  { file: 'tests/codex-plugin.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/image-ppt-proof-runner.test.js', lane: 'meta' },
  { file: 'tests/line-budget.test.js', lane: 'meta' },
  { file: 'tests/native-ppt-proof-fixture-contract.test.js', lane: 'meta' },
  { file: 'tests/opl-agent-pack-contracts-semantic-pack.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/opl-agent-package-manifest.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/ppt-image-first-style-benchmark.test.js', lane: 'meta', fast: true },
  { file: 'tests/python-native-helper-catalog.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/rca-foundry-agent-os-domain-kernel-manifest.test.ts', lane: 'meta', fast: true },
  { file: 'tests/rca-functional-audit-retirement.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/rca-private-platform-retirement-readback.test.js', lane: 'meta', smoke: true, fast: true },
  { file: 'tests/stage-run-kernel-profile.test.js', lane: 'meta', fast: true },
  { file: 'tests/test-workspace-lifecycle.test.js', lane: 'meta' },
  { file: 'tests/block-content-fit-review.test.js', lane: 'integration' },
  { file: 'tests/block-content-fit-review-surface-children.test.js', lane: 'integration' },
  { file: 'tests/ppt-native-editability-regression.test.js', lane: 'integration' },
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
]);

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
