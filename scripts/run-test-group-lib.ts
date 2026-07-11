import path from 'node:path';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

import {
  inspectCurrentRepoFamilySharedAlignment,
} from 'opl-framework-shared/family-shared-release';

export { resolveRedCubePythonCommand } from '@redcube/runtime-protocol';

type Resolver = (specifier: string) => string;
type RuntimeSharedResolutionCheck = Readonly<{
  specifier: string;
  resolve_from?: string;
}>;
type WorkspacePackageResolutionOptions = Readonly<{
  repoRoot?: string;
  specifiers?: readonly string[];
  resolve?: Resolver;
}>;
type RuntimeSharedResolutionOptions = Readonly<{
  repoRoot?: string;
  checks?: readonly RuntimeSharedResolutionCheck[];
  resolve?: (specifier: string, check: RuntimeSharedResolutionCheck) => string;
}>;
type SharedPinAlignmentOptions = Readonly<{
  repoRoot?: string;
  consumerRepoId?: string;
  ownerRepoRoot?: string;
  ownerRepo?: string;
}>;
type SharedPinAlignmentInspection = Readonly<{
  status: string;
  owner_commit: string;
  repo_root: string;
  findings: readonly Readonly<{
    file?: string;
    kind: string;
    status: string;
    pins: readonly string[];
  }>[];
}>;
type BuildNodeTestArgsOptions = Readonly<{
  forwardedArgs?: readonly string[];
  serialized?: boolean;
}>;

const WORKSPACE_PACKAGE_SPECIFIERS = Object.freeze([
  '@redcube/runtime',
  '@redcube/runtime-protocol',
  '@redcube/domain-entry',
]);
const REQUIRED_RUNTIME_SHARED_RESOLUTION_CHECKS = Object.freeze([
  {
    specifier: '@redcube/redcube-config/xiaohongshu-author-profile',
    resolve_from: 'packages/redcube-runtime/package.json',
  },
  {
    specifier: 'opl-framework-shared/product-entry-companions',
    resolve_from: 'packages/redcube-domain-entry/package.json',
  },
  {
    specifier: 'opl-framework-shared/product-entry-program-companions',
    resolve_from: 'packages/redcube-domain-entry/package.json',
  },
  {
    specifier: 'opl-framework-shared/family-shared-release',
    resolve_from: 'packages/redcube-domain-entry/package.json',
  },
]);

function nodeErrorCode(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? fallback);
  }
  return fallback;
}

function isWithinRepoRoot(repoRoot: string, resolvedPath: string): boolean {
  const relative = path.relative(repoRoot, resolvedPath);
  return relative === '.' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function inspectWorkspacePackageResolution({
  repoRoot,
  specifiers = WORKSPACE_PACKAGE_SPECIFIERS,
  resolve,
}: WorkspacePackageResolutionOptions = {}) {
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

export function assertWorkspacePackageResolution(options: WorkspacePackageResolutionOptions = {}) {
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

function inspectRequiredRuntimeSharedResolution({
  repoRoot,
  checks = REQUIRED_RUNTIME_SHARED_RESOLUTION_CHECKS,
  resolve,
}: RuntimeSharedResolutionOptions = {}) {
  const resolvedRepoRoot = path.resolve(String(repoRoot || process.cwd()));
  const resolvedSpecifiers: Array<{
    specifier: string;
    resolve_from: string;
    resolved_path: string;
  }> = [];
  const missingSpecifiers: Array<{
    specifier: string;
    resolve_from: string;
    error_code: string;
  }> = [];

  for (const check of checks) {
    const specifier = check.specifier;
    const resolveFrom = check.resolve_from || 'package.json';
    try {
      const resolver = resolve
        ? (targetSpecifier: string) => resolve(targetSpecifier, check)
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
        error_code: nodeErrorCode(error, 'ERR_MODULE_NOT_FOUND'),
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

export function assertRequiredRuntimeSharedResolution(options: RuntimeSharedResolutionOptions = {}) {
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

function inspectCurrentRepoSharedPinAlignment({
  repoRoot,
  consumerRepoId = 'redcube',
  ownerRepoRoot,
  ownerRepo = 'one-person-lab',
}: SharedPinAlignmentOptions = {}): SharedPinAlignmentInspection {
  return inspectCurrentRepoFamilySharedAlignment({
    repoRoot,
    consumerRepoId,
    ownerRepoRoot,
    ownerRepo,
  }) as SharedPinAlignmentInspection;
}

export function assertCurrentRepoSharedPinAlignment(options: SharedPinAlignmentOptions = {}) {
  const inspection = inspectCurrentRepoSharedPinAlignment(options);
  if (inspection.status !== 'aligned' && inspection.status !== 'update_available') {
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

export function buildNodeTestArgs({
  forwardedArgs = [],
  serialized = false,
}: BuildNodeTestArgsOptions = {}): string[] {
  const args = ['--test'];
  if (serialized) {
    // Browser / screenshot / local-exec heavy files can still oversubscribe the host;
    // keep only that explicit subset at file-level concurrency 1.
    args.push('--test-concurrency=1');
  }
  return [...args, ...forwardedArgs];
}

export function discoverRootTestFiles({
  testsDir = 'tests',
  entries,
}: {
  testsDir?: string;
  entries?: readonly string[];
} = {}): string[] {
  const directoryEntries = entries ?? readdirSync(path.resolve(testsDir));
  return directoryEntries
    .filter((entry) => entry.endsWith('.test.js') || entry.endsWith('.test.ts'))
    .map((entry) => `${testsDir}/${entry}`)
    .sort();
}

export function assertRootTestPartition({
  discoveredFiles = [],
  partitionFiles = [],
  partitionName = 'meta/family/integration/e2e/historical',
}: {
  discoveredFiles?: readonly string[];
  partitionFiles?: readonly string[];
  partitionName?: string;
} = {}): void {
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
