// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ACTIVE_ROOTS = [
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
const TEXT_EXTENSIONS = new Set([
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
const ACTIVE_COMPATIBILITY_ALIAS_CLAIM_PATTERNS = Object.freeze([
  /\bcompatibility_alias(?:es)?_allowed\b\s*[:=]\s*true/i,
  /\bactive_caller_compatibility_alias_restored\b\s*[:=]\s*true/i,
  /\bcompatibility_alias_restored\b\s*[:=]\s*true/i,
  /\b(?:default|active|live|normal)[_-]?(?:compatibility|legacy)[_-]?alias(?:es)?\b/i,
  /\b(?:compatibility|legacy)[_-]?alias(?:es)?[_-]?(?:default|active|live|normal)\b/i,
]);
const ACTIVE_PRIVATE_PLATFORM_RESURRECTION_CLAIM_PATTERNS = Object.freeze([
  ...ACTIVE_COMPATIBILITY_ALIAS_CLAIM_PATTERNS,
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

const RETIRED_SURFACE_GUARD_EXEMPT_FILES = new Set([
  'scripts/private-platform-source-scan.ts',
  'tests/helpers/rca-retired-surface-guard.ts',
  'tests/rca-retired-surface-active-guard.test.ts',
  'tests/rca-opl-generic-primitive-consumption.test.ts',
  'tests/rca-functional-audit-retirement.test.ts',
  'tests/rca-legacy-name-allowance.test.ts',
  'tests/rca-retired-payload-pointer-guard.test.ts',
  'tests/python-native-helper-catalog.test.ts',
]);

function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('__closeout-audit-test')) return [];
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

export function activePrivatePlatformResurrectionViolations(scanRoots = ACTIVE_ROOTS) {
  const violations = [];
  for (const file of scanRoots.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    const normalized = normalizePath(file);
    if (RETIRED_SURFACE_GUARD_EXEMPT_FILES.has(normalized)) continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of ACTIVE_PRIVATE_PLATFORM_RESURRECTION_CLAIM_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`${normalized}: ${pattern}`);
      }
    }
  }
  return violations;
}
