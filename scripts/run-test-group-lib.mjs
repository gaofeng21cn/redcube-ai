import path from 'node:path';
import { createRequire } from 'node:module';

export const SERIALIZED_VERIFICATION_GROUP_NAMES = new Set(['integration', 'e2e', 'full']);
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
]);

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

export function buildNodeTestArgs({ groupName, forwardedArgs = [] }) {
  const args = ['--test'];
  if (SERIALIZED_VERIFICATION_GROUP_NAMES.has(groupName)) {
    // Codex-backed verification fans out many local exec / browser-heavy steps;
    // keep file-level execution serialized to avoid overscheduling the host.
    args.push('--test-concurrency=1');
  }
  return [...args, ...forwardedArgs];
}
