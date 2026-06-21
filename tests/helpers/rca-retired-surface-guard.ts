// @ts-nocheck
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

export const ACTIVE_ROOTS = [
  'agent',
  'apps',
  'packages',
  'contracts',
  'plugins',
  'scripts',
  'tests',
  'tools',
  'python',
];
export const TEXT_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.sh',
  '.yaml',
  '.yml',
]);
export const RETIRED_CONTRACTS = Object.freeze([
  'contracts/runtime-program/hermes-runtime-substrate-activation-package.json',
  'contracts/runtime-program/hermes-runtime-capability-extraction-map.json',
  'contracts/runtime-program/hermes-runtime-substrate-canonical-closure.json',
  'contracts/runtime-program/hermes-stable-family-closure-truth.json',
  'contracts/runtime-program/hermes-managed-family-closure-truth.json',
]);
export const ACTIVE_COMPATIBILITY_ALIAS_CLAIM_PATTERNS = Object.freeze([
  /\bcompatibility_alias(?:es)?_allowed\b\s*[:=]\s*true/i,
  /\bactive_caller_compatibility_alias_restored\b\s*[:=]\s*true/i,
  /\bcompatibility_alias_restored\b\s*[:=]\s*true/i,
  /\b(?:default|active|live|normal)[_-]?(?:compatibility|legacy)[_-]?alias(?:es)?\b/i,
  /\b(?:compatibility|legacy)[_-]?alias(?:es)?[_-]?(?:default|active|live|normal)\b/i,
]);
export const ACTIVE_PRIVATE_PLATFORM_RESURRECTION_CLAIM_PATTERNS = Object.freeze([
  /\bruntimeWatch_can_return_to_domain_action_adapter_default_dispatch\b\s*[:=]\s*true/i,
  /\bdomain_action_adapter_can_become_generic_dispatch_owner\b\s*[:=]\s*true/i,
  /\bdomain_action_adapter_can_become_generated_wrapper_owner\b\s*[:=]\s*true/i,
  /\bdefault_runtime_watch_dispatch_allowed\b\s*[:=]\s*true/i,
  /\bgeneric_dispatch_owner_allowed\b\s*[:=]\s*true/i,
  /\bgeneric_domain_action_adapter_owner_allowed\b\s*[:=]\s*true/i,
  /\bgeneric_generated_wrapper_owner_allowed\b\s*[:=]\s*true/i,
  /\bgeneric_session_runtime_owner_allowed\b\s*[:=]\s*true/i,
  /\bgeneric_workbench_owner_allowed\b\s*[:=]\s*true/i,
  /\bgeneric_runtime_owner_allowed\b\s*[:=]\s*true/i,
]);

export function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    const normalized = file.split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (normalized.includes('__closeout-audit-test__')) return [];
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

export function activeShellScripts() {
  return ACTIVE_ROOTS.flatMap((root) => {
    const rootPath = path.resolve(root);
    if (!existsSync(rootPath)) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })
    .filter((file) => path.extname(file) === '.sh')
    .map(normalizePath)
    .sort();
}

export function activePrivatePlatformResurrectionViolations(scanRoots = ACTIVE_ROOTS) {
  const violations = [];
  for (const file of scanRoots.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    const normalized = normalizePath(file);
    if (RETIRED_SURFACE_GUARD_TEST_FILES.has(normalized)) continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of ACTIVE_PRIVATE_PLATFORM_RESURRECTION_CLAIM_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`${normalized}: ${pattern}`);
      }
    }
  }
  return violations;
}

export function normalizePath(value) {
  return value.split(path.sep).join('/');
}

export function sourceRefPath(sourceRef) {
  return String(sourceRef).split('#')[0];
}

export function sourceRefCoversFile(sourceRef, file) {
  const sourcePath = sourceRefPath(sourceRef);
  if (sourcePath.endsWith('/')) {
    return file.startsWith(sourcePath);
  }
  return file === sourcePath || file.startsWith(`${sourcePath}/`);
}

export function assertRepoRefResolves(sourceRef, label) {
  const [sourcePath, anchor] = String(sourceRef).split('#');
  assert.equal(
    sourcePath !== '' && sourcePath === normalizePath(sourcePath) && !path.isAbsolute(sourcePath)
      && !sourcePath.startsWith('../') && !sourcePath.includes('/../') && !/^[a-z][a-z0-9+.-]*:/i.test(sourcePath),
    true,
    `${label}: ${sourceRef}`,
  );
  const fullPath = path.resolve(sourcePath);
  assert.equal(existsSync(fullPath), true, `${label}: ${sourceRef}`);
  if (!anchor) return;
  const text = readFileSync(fullPath, 'utf-8');
  assert.equal(text.includes(anchor), true, `${label}: ${sourceRef}`);
}

export function listJsonFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return listJsonFiles(file);
    }
    return entry.isFile() && entry.name.endsWith('.json') ? [file] : [];
  });
}

export function visitJsonPointers(value, pointer, visitor) {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visitJsonPointers(entry, `${pointer}/${index}`, visitor));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      visitJsonPointers(entry, `${pointer}/${key}`, visitor);
    }
  }
}

export function pointerMatchesAllowedSuffix(pointer, suffix) {
  const pattern = suffix.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+');
  return new RegExp(`${pattern}$`).test(pointer);
}

export const RETIRED_SURFACE_GUARD_TEST_FILES = new Set([
  "tests/helpers/rca-retired-surface-guard.ts",
  "tests/rca-retired-surface-active-guard.test.ts",
  "tests/rca-opl-generic-primitive-consumption.test.ts",
  "tests/rca-functional-audit-retirement.test.ts",
  "tests/rca-legacy-name-allowance.test.ts",
  "tests/rca-retired-payload-pointer-guard.test.ts",
  "tests/python-native-helper-catalog.test.ts"
]);
