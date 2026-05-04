// @ts-nocheck
import path from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
  SHARED_OWNER_RELEASE_CONTRACT_PATH,
  extractTrackedPins,
  inspectCurrentRepoFamilySharedAlignment,
  inspectFamilySharedConsumerAlignment,
  resolveOwnerRepoRoot,
} from 'opl-gateway-shared/family-shared-release';

export const SERIALIZED_VERIFICATION_GROUP_NAMES = new Set(['integration', 'e2e', 'full']);
export const ROUTE_HEAVY_SERIALIZATION_GROUP_NAMES = new Set(['fast', 'integration', 'e2e', 'full']);
export const SERIALIZED_ROUTE_HEAVY_TEST_FILES = new Set([
  'tests/deliverable-review-loop.test.ts',
  'tests/direct-delivery-operator-handoff.test.ts',
  'tests/family-parity-governance-surface.test.ts',
  'tests/family-source-truth-consumption.test.ts',
  'tests/hermes-runtime-canonical-path.test.ts',
  'tests/managed-deliverable-execution.test.ts',
  'tests/poster-creative-ownership.test.ts',
  'tests/ppt-creative-ownership.test.ts',
  'tests/ppt-deliverable-e2e.test.ts',
  'tests/ppt-deliverable-surface.test.ts',
  'tests/ppt-native-ppt-runtime.test.ts',
  'tests/product-entry-native-ppt-live-proof.test.ts',
  'tests/publication-projection-delivery-contract.test.ts',
  'tests/reference-quality-os-replacement.test.ts',
  'tests/reference-regression.test.ts',
  'tests/review-platform.test.ts',
  'tests/runtime-deliverable-route-recovery.test.ts',
  'tests/runtime-deliverable-route.test.ts',
  'tests/workspace-operator-quickstart.test.ts',
  'tests/xiaohongshu-creative-ownership.test.ts',
  'tests/xiaohongshu-deliverable-e2e.test.ts',
]);
export { resolveRedCubePythonCommand } from '@redcube/runtime-protocol';

export const WORKSPACE_PACKAGE_SPECIFIERS = Object.freeze([
  '@redcube/runtime',
  '@redcube/runtime-protocol',
  '@redcube/gateway',
]);
export const REQUIRED_RUNTIME_SHARED_RESOLUTION_CHECKS = Object.freeze([
  {
    specifier: '@redcube/redcube-config/xiaohongshu-author-profile',
    resolve_from: 'packages/redcube-runtime/package.json',
  },
  {
    specifier: 'opl-gateway-shared/product-entry-companions',
    resolve_from: 'packages/redcube-gateway/package.json',
  },
  {
    specifier: 'opl-gateway-shared/product-entry-program-companions',
    resolve_from: 'packages/redcube-gateway/package.json',
  },
  {
    specifier: 'opl-gateway-shared/family-shared-release',
    resolve_from: 'packages/redcube-gateway/package.json',
  },
]);
const REPO_LOCAL_SHARED_PIN_FALLBACKS = Object.freeze({
  redcube: Object.freeze({
    owner_repo: 'one-person-lab',
    package_name: 'opl-gateway-shared',
    git_locator_prefix: 'git+https://github.com/gaofeng21cn/one-person-lab.git#',
    consumer: Object.freeze({
      repo_id: 'redcube',
      repo_dir: 'redcube-ai',
      verify_command: 'scripts/verify.sh family',
      targets: Object.freeze([
        Object.freeze({
          file: 'packages/redcube-gateway/package.json',
          kind: 'js_dependency',
        }),
        Object.freeze({
          file: 'package-lock.json',
          kind: 'js_lock',
        }),
      ]),
    }),
  }),
});

function isWithinRepoRoot(repoRoot, resolvedPath) {
  const relative = path.relative(repoRoot, resolvedPath);
  return relative === '.' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function inspectWorkspacePackageResolution({
  repoRoot,
  specifiers = WORKSPACE_PACKAGE_SPECIFIERS,
  resolve,
} = {}) {
  const resolvedRepoRoot = path.resolve(String(repoRoot || process.cwd()));
  const resolver = resolve || createRequire(path.join(resolvedRepoRoot, 'package.json')).resolve;
  const resolvedPackages = specifiers.map((specifier) => ({
    specifier,
    resolved_path: path.resolve(resolver(specifier)),
  }));
  const leakingResolutions = resolvedPackages.filter(
    (entry) => !isWithinRepoRoot(resolvedRepoRoot, entry.resolved_path),
  );

  return {
    ok: leakingResolutions.length === 0,
    repo_root: resolvedRepoRoot,
    resolved_packages: resolvedPackages,
    leaking_resolutions: leakingResolutions,
    message: leakingResolutions.length === 0
      ? 'workspace package resolution is pinned to the current checkout'
      : 'workspace package resolution leaked outside the current checkout; run `npm install` inside this worktree before verifying',
  };
}

export function assertWorkspacePackageResolution(options = {}) {
  const inspection = inspectWorkspacePackageResolution(options);
  if (!inspection.ok) {
    const leaked = inspection.leaking_resolutions
      .map((entry) => `${entry.specifier} -> ${entry.resolved_path}`)
      .join('\n');
    throw new Error(
      `${inspection.message}\nCurrent repo root: ${inspection.repo_root}\n${leaked}`,
    );
  }
  return inspection;
}

export function inspectRequiredRuntimeSharedResolution({
  repoRoot,
  checks = REQUIRED_RUNTIME_SHARED_RESOLUTION_CHECKS,
  resolve,
} = {}) {
  const resolvedRepoRoot = path.resolve(String(repoRoot || process.cwd()));
  const resolvedSpecifiers = [];
  const missingSpecifiers = [];

  for (const check of checks) {
    const specifier = check.specifier;
    const resolveFrom = check.resolve_from || 'package.json';
    try {
      const resolver = resolve
        ? (targetSpecifier) => resolve(targetSpecifier, check)
        : createRequire(path.join(resolvedRepoRoot, resolveFrom)).resolve;
      resolvedSpecifiers.push({
        specifier,
        resolve_from: resolveFrom,
        resolved_path: path.resolve(resolver(specifier)),
      });
    } catch (error) {
      missingSpecifiers.push({
        specifier,
        resolve_from: resolveFrom,
        error_code: error?.code || 'ERR_MODULE_NOT_FOUND',
      });
    }
  }

  return {
    ok: missingSpecifiers.length === 0,
    repo_root: resolvedRepoRoot,
    resolved_specifiers: resolvedSpecifiers,
    missing_specifiers: missingSpecifiers,
    message: missingSpecifiers.length === 0
      ? 'required runtime/shared package resolution is ready in this checkout'
      : 'required runtime/shared package resolution is missing in this checkout; run `npm install` in this checkout before verifying',
  };
}

export function assertRequiredRuntimeSharedResolution(options = {}) {
  const inspection = inspectRequiredRuntimeSharedResolution(options);
  if (!inspection.ok) {
    const missing = inspection.missing_specifiers
      .map((entry) => `${entry.specifier} (from ${entry.resolve_from}) -> ${entry.error_code}`)
      .join('\n');
    throw new Error(
      `${inspection.message}\nCurrent repo root: ${inspection.repo_root}\n${missing}`,
    );
  }
  return inspection;
}

function isMissingSharedOwnerReleaseContract(error, {
  repoRoot = process.cwd(),
  ownerRepoRoot,
  ownerRepo = 'one-person-lab',
} = {}) {
  if (error?.code !== 'ENOENT' || !error?.path) {
    return false;
  }

  const expectedContractPath = path.join(
    resolveOwnerRepoRoot({ repoRoot, ownerRepoRoot, ownerRepo }),
    SHARED_OWNER_RELEASE_CONTRACT_PATH,
  );
  return path.resolve(error.path) === path.resolve(expectedContractPath);
}

function buildRepoLocalSharedPinFallbackContract({
  repoRoot = process.cwd(),
  consumerRepoId,
} = {}) {
  const fallback = REPO_LOCAL_SHARED_PIN_FALLBACKS[consumerRepoId];
  if (!fallback) {
    return null;
  }

  const dependencyTarget = fallback.consumer.targets.find((target) => target.kind === 'js_dependency');
  const dependencyFile = path.join(path.resolve(String(repoRoot)), dependencyTarget.file);
  const pins = extractTrackedPins(readFileSync(dependencyFile, 'utf8'), dependencyTarget.kind);

  if (pins.length !== 1) {
    throw new Error(
      `expected exactly one tracked shared pin in ${dependencyTarget.file}; found ${pins.length}`,
    );
  }

  const ownerCommit = pins[0];
  return {
    contract_kind: 'family_shared_owner_release.v1',
    owner_repo: fallback.owner_repo,
    owner_commit: ownerCommit,
    packages: {
      js: {
        package_name: fallback.package_name,
        git_locator: `${fallback.git_locator_prefix}${ownerCommit}`,
      },
    },
    consumers: [fallback.consumer],
  };
}

export function inspectCurrentRepoSharedPinAlignment({
  repoRoot,
  consumerRepoId = 'redcube',
  ownerRepoRoot,
  ownerRepo = 'one-person-lab',
} = {}) {
  try {
    return inspectCurrentRepoFamilySharedAlignment({
      repoRoot,
      consumerRepoId,
      ownerRepoRoot,
      ownerRepo,
    });
  } catch (error) {
    if (!isMissingSharedOwnerReleaseContract(error, {
      repoRoot,
      ownerRepoRoot,
      ownerRepo,
    })) {
      throw error;
    }

    const fallbackContract = buildRepoLocalSharedPinFallbackContract({
      repoRoot,
      consumerRepoId,
    });
    if (!fallbackContract) {
      throw error;
    }

    return inspectFamilySharedConsumerAlignment({
      contract: fallbackContract,
      consumerRepoId,
      repoRoot,
    });
  }
}

export function assertCurrentRepoSharedPinAlignment(options = {}) {
  const inspection = inspectCurrentRepoSharedPinAlignment(options);
  if (inspection.status !== 'aligned') {
    const findings = inspection.findings
      .map((entry) => `${entry.file ?? '(repo)'} [${entry.kind}] -> ${entry.status}${entry.pins.length > 0 ? ` (${entry.pins.join(', ')})` : ''}`)
      .join('\n');
    throw new Error(
      [
        'current checkout is not aligned with the OPL family shared release pin contract',
        `expected owner commit: ${inspection.owner_commit}`,
        `repo root: ${inspection.repo_root}`,
        findings,
      ].join('\n'),
    );
  }
  return inspection;
}

export function partitionTestFilesForExecution({ groupName, files = [] }) {
  const plannedFiles = [...files];
  if (!ROUTE_HEAVY_SERIALIZATION_GROUP_NAMES.has(groupName)) {
    return {
      parallel_files: plannedFiles,
      serialized_files: [],
    };
  }

  return {
    parallel_files: plannedFiles.filter((file) => !SERIALIZED_ROUTE_HEAVY_TEST_FILES.has(file)),
    serialized_files: plannedFiles.filter((file) => SERIALIZED_ROUTE_HEAVY_TEST_FILES.has(file)),
  };
}

export function buildNodeTestArgs({ forwardedArgs = [], serialized = false }) {
  const args = ['--experimental-strip-types', '--test'];
  if (serialized) {
    // Browser / screenshot / local-exec heavy files can still oversubscribe the host;
    // keep only that explicit subset at file-level concurrency 1.
    args.push('--test-concurrency=1');
  }
  return [...args, ...forwardedArgs];
}

export function discoverRootTestFiles({ testsDir = 'tests', entries } = {}) {
  const directoryEntries = entries ?? readdirSync(path.resolve(testsDir));
  return directoryEntries
    .filter((entry) => entry.endsWith('.test.js') || entry.endsWith('.test.ts'))
    .map((entry) => `${testsDir}/${entry}`)
    .sort();
}

export function assertRootTestPartition({
  discoveredFiles,
  partitionFiles,
  partitionName = 'meta/family/integration/e2e/historical',
} = {}) {
  const discovered = [...discoveredFiles].sort();
  const base = [...partitionFiles];
  const duplicates = base.filter((file, index) => base.indexOf(file) !== index);
  if (duplicates.length > 0) {
    throw new Error(`${partitionName} 分组存在重复项: ${[...new Set(duplicates)].join(', ')}`);
  }

  const missing = discovered.filter((file) => !base.includes(file));
  if (missing.length > 0) {
    throw new Error(`未被纳入 ${partitionName} 的测试文件: ${missing.join(', ')}`);
  }

  const unexpected = base.filter((file) => !discovered.includes(file));
  if (unexpected.length > 0) {
    throw new Error(`分组里存在非根级测试文件: ${unexpected.join(', ')}`);
  }
}
