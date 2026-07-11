// @ts-nocheck
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs as parseNodeArgs } from 'node:util';
import * as ts from 'typescript';

import {
  buildPhysicalSourceMorphologyPolicy,
  listDomainActionAdapterBlockedActions,
  listDomainActionAdapterForbiddenWrites,
} from '../packages/redcube-domain-entry/dist/index.js';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ACTIVE_PRIVATE_PLATFORM_RESURRECTION_CLAIM_PATTERNS = Object.freeze([
  /\bcompatibility_alias(?:es)?_allowed\b\s*[:=]\s*true/i,
  /\bactive_caller_compatibility_alias_restored\b\s*[:=]\s*true/i,
  /\bcompatibility_alias_restored\b\s*[:=]\s*true/i,
  /\b(?:default|active|live|normal)[_-]?(?:compatibility|legacy)[_-]?alias(?:es)?\b/i,
  /\b(?:compatibility|legacy)[_-]?alias(?:es)?[_-]?(?:default|active|live|normal)\b/i,
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
const RETIRED_SURFACE_GUARD_EXEMPT_FILES = new Set([
  'scripts/check-private-platform-retirement.ts',
  'tests/helpers/rca-retired-surface-guard.js',
  'tests/rca-retired-surface-active-guard.test.js',
  'tests/rca-opl-generic-primitive-consumption.test.js',
  'tests/rca-functional-audit-retirement.test.js',
  'tests/rca-legacy-name-allowance.test.js',
  'tests/rca-retired-payload-pointer-guard.test.js',
  'tests/python-native-helper-catalog.test.js',
]);

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(REPO_ROOT, relativePath), 'utf-8'));
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

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

function activePrivatePlatformResurrectionViolations(scanRoots) {
  const violations = [];
  for (const file of scanRoots.flatMap((root) => {
    const resolved = path.resolve(REPO_ROOT, root);
    if (!existsSync(resolved)) return [];
    return path.extname(root) ? [resolved] : listTextFiles(resolved);
  })) {
    const normalized = normalizePath(path.relative(REPO_ROOT, file));
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

function activePrivatePlatformBehaviorViolations(scanPolicy) {
  const violations = [];
  for (const construct of scanPolicy?.forbidden_constructs || []) {
    const sourceRef = String(construct.source_ref || '');
    const constructId = String(construct.construct_id || '<missing construct_id>');
    const forbiddenTokens = Array.isArray(construct.forbidden_tokens)
      ? construct.forbidden_tokens.filter((token) => String(token))
      : [];
    if (!sourceRef) {
      violations.push(`<missing source_ref>: ${constructId}:missing_source_ref`);
      continue;
    }
    if (forbiddenTokens.length === 0) {
      violations.push(`${sourceRef}: ${constructId}:missing_forbidden_tokens`);
      continue;
    }
    const file = path.resolve(REPO_ROOT, sourceRef);
    if (!existsSync(file)) {
      if (construct.missing_source_allowed !== true) {
        violations.push(`${sourceRef}: ${constructId}:missing_source`);
      }
      continue;
    }
    const text = readFileSync(file, 'utf-8');
    for (const token of forbiddenTokens) {
      if (text.includes(token)) {
        violations.push(`${sourceRef}: ${constructId}:${token}`);
      }
    }
  }
  return violations;
}

function propertyNameText(name) {
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  if (ts.isComputedPropertyName(name) && ts.isStringLiteralLike(name.expression)) {
    return name.expression.text;
  }
  return null;
}

function isTypeOnlyImport(node) {
  if (ts.isImportDeclaration(node)) {
    const clause = node.importClause;
    if (!clause) return false;
    if (clause.isTypeOnly) return true;
    return !clause.name
      && ts.isNamedImports(clause.namedBindings)
      && clause.namedBindings.elements.length > 0
      && clause.namedBindings.elements.every((entry) => entry.isTypeOnly);
  }
  if (ts.isExportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
    return node.isTypeOnly === true;
  }
  return false;
}

function runtimeImportReference(node) {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && !isTypeOnlyImport(node)) {
    return {
      kind: ts.isImportDeclaration(node) ? 'static_import' : 'static_export',
      moduleName: node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : null,
      nonLiteral: Boolean(node.moduleSpecifier) && !ts.isStringLiteralLike(node.moduleSpecifier),
    };
  }
  if (ts.isImportEqualsDeclaration(node) && !isTypeOnlyImport(node)
    && ts.isExternalModuleReference(node.moduleReference)) {
    const expression = node.moduleReference.expression;
    return {
      kind: 'import_equals',
      moduleName: expression && ts.isStringLiteralLike(expression) ? expression.text : null,
      nonLiteral: Boolean(expression) && !ts.isStringLiteralLike(expression),
    };
  }
  if (ts.isCallExpression(node)) {
    const kind = node.expression.kind === ts.SyntaxKind.ImportKeyword
      ? 'dynamic_import'
      : (ts.isIdentifier(node.expression) && node.expression.text === 'require' ? 'require' : null);
    if (kind) {
      const argument = node.arguments[0];
      return {
        kind,
        moduleName: node.arguments.length === 1 && argument && ts.isStringLiteralLike(argument)
          ? argument.text
          : null,
        nonLiteral: node.arguments.length !== 1 || !argument || !ts.isStringLiteralLike(argument),
      };
    }
  }
  return null;
}

function accessedPropertyText(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node) && node.argumentExpression
    && ts.isStringLiteralLike(node.argumentExpression)) {
    return node.argumentExpression.text;
  }
  if (ts.isBindingElement(node)) return propertyNameText(node.propertyName || node.name);
  if (ts.isPropertyAssignment(node)
    || ts.isShorthandPropertyAssignment(node)
    || ts.isPropertyDeclaration(node)
    || ts.isMethodDeclaration(node)
    || ts.isGetAccessorDeclaration(node)
    || ts.isSetAccessorDeclaration(node)) {
    return propertyNameText(node.name);
  }
  return null;
}

export function analyzeTypeScriptOwnerBoundarySource({
  sourceRef,
  sourceText,
  forbiddenModuleSpecifiers = [],
  forbiddenPropertyNames = [],
}) {
  const forbiddenModules = new Set(forbiddenModuleSpecifiers);
  const forbiddenProperties = new Set(forbiddenPropertyNames);
  const sourceFile = ts.createSourceFile(
    sourceRef,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourceRef.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const violations = [];
  function visit(node) {
    const importReference = runtimeImportReference(node);
    const moduleName = importReference?.moduleName || null;
    const propertyName = accessedPropertyText(node);
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    if (importReference?.nonLiteral) {
      violations.push(
        `${sourceRef}:${position.line + 1}:${position.character + 1}:typescript_ast_owner_boundary:non_literal_${importReference.kind}`,
      );
    }
    if (moduleName && forbiddenModules.has(moduleName)) {
      violations.push(
        `${sourceRef}:${position.line + 1}:${position.character + 1}:typescript_ast_owner_boundary:forbidden_module_import:${moduleName}`,
      );
    }
    if (propertyName && forbiddenProperties.has(propertyName)) {
      violations.push(
        `${sourceRef}:${position.line + 1}:${position.character + 1}:typescript_ast_owner_boundary:forbidden_property:${propertyName}`,
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return violations;
}

function repoFileResolution(sourceRoot, sourceRef) {
  const lexicalFile = path.resolve(sourceRoot, sourceRef);
  const lexicalRelative = path.relative(sourceRoot, lexicalFile);
  if (lexicalRelative.startsWith(`..${path.sep}`)
    || lexicalRelative === '..'
    || path.isAbsolute(lexicalRelative)) {
    return { status: 'outside_repo', file: null };
  }
  if (!existsSync(lexicalFile)) return { status: 'missing', file: null };
  try {
    const realRoot = realpathSync(sourceRoot);
    const realFile = realpathSync(lexicalFile);
    const realRelative = path.relative(realRoot, realFile);
    if (realRelative.startsWith(`..${path.sep}`)
      || realRelative === '..'
      || path.isAbsolute(realRelative)) {
      return { status: 'outside_repo', file: null };
    }
    return lstatSync(realFile).isFile()
      ? { status: 'resolved', file: realFile }
      : { status: 'missing', file: null };
  } catch {
    return { status: 'missing', file: null };
  }
}

function sourceTextForOwnerBoundary(sourceRef, sourceFiles, sourceRoot) {
  if (sourceFiles !== null) {
    return Object.prototype.hasOwnProperty.call(sourceFiles, sourceRef)
      ? String(sourceFiles[sourceRef])
      : null;
  }
  const resolved = repoFileResolution(sourceRoot, sourceRef);
  return resolved.status === 'resolved' ? readFileSync(resolved.file, 'utf-8') : null;
}

function resolveRelativeTypeScriptImport(sourceRef, moduleName, sourceFiles, sourceRoot) {
  if (!moduleName.startsWith('.')) return { status: 'not_relative', sourceRef: null };
  const joined = normalizePath(path.posix.normalize(path.posix.join(
    path.posix.dirname(sourceRef),
    moduleName,
  )));
  if (path.posix.isAbsolute(joined) || joined === '..' || joined.startsWith('../')) {
    return { status: 'outside_repo', sourceRef: null };
  }
  const extension = path.posix.extname(joined);
  const runtimeExtensionCandidates = {
    '.js': ['.ts', '.tsx', '.mts', '.cts'],
    '.jsx': ['.tsx', '.ts'],
    '.mjs': ['.mts', '.ts'],
    '.cjs': ['.cts', '.ts'],
  };
  const replacementExtensions = runtimeExtensionCandidates[extension] || null;
  const stem = replacementExtensions ? joined.slice(0, -extension.length) : joined;
  const candidates = replacementExtensions
    ? [...replacementExtensions.map((candidate) => `${stem}${candidate}`), joined]
    : extension
      ? [joined]
      : [
          `${joined}.ts`,
          `${joined}.tsx`,
          `${joined}.mts`,
          `${joined}.cts`,
          `${joined}/index.ts`,
          `${joined}/index.tsx`,
          `${joined}/index.mts`,
          `${joined}/index.cts`,
          joined,
        ];
  let escapedBySymlink = false;
  const resolved = candidates.find((candidate) => {
    if (sourceFiles !== null) return Object.prototype.hasOwnProperty.call(sourceFiles, candidate);
    const resolution = repoFileResolution(sourceRoot, candidate);
    if (resolution.status === 'outside_repo') escapedBySymlink = true;
    return resolution.status === 'resolved';
  });
  return resolved
    ? { status: 'resolved', sourceRef: resolved }
    : { status: escapedBySymlink ? 'outside_repo' : 'unresolved', sourceRef: null };
}

function relativeTypeScriptImports(sourceRef, sourceText, sourceFiles, sourceRoot) {
  const sourceFile = ts.createSourceFile(
    sourceRef,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourceRef.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports = [];
  const violations = [];
  function visit(node) {
    const importReference = runtimeImportReference(node);
    const moduleName = importReference?.moduleName || null;
    if (moduleName?.startsWith('.')) {
      const resolved = resolveRelativeTypeScriptImport(sourceRef, moduleName, sourceFiles, sourceRoot);
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      if (resolved.status === 'resolved') {
        imports.push(resolved.sourceRef);
      } else {
        const failure = resolved.status === 'outside_repo'
          ? 'local_import_traversal_outside_repo'
          : 'local_import_unresolved';
        violations.push(
          `${sourceRef}:${position.line + 1}:${position.character + 1}:typescript_ast_owner_boundary:${failure}:${moduleName}`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { imports: [...new Set(imports)], violations };
}

export function analyzeTypeScriptOwnerBoundaryClosure({
  entrySourceRefs = [],
  allowedFilesystemSourceRefs = [],
  traversalStopSourceRefs = [],
  sourceFiles = null,
  sourceRoot = REPO_ROOT,
  forbiddenModuleSpecifiers = [],
  forbiddenPropertyNames = [],
}) {
  const allowedFilesystem = new Set(allowedFilesystemSourceRefs);
  const traversalStops = new Set(traversalStopSourceRefs);
  const visited = new Set();
  const pending = [...entrySourceRefs];
  const violations = [];

  while (pending.length > 0) {
    const sourceRef = pending.shift();
    if (!sourceRef || visited.has(sourceRef)) continue;
    visited.add(sourceRef);
    const sourceText = sourceTextForOwnerBoundary(sourceRef, sourceFiles, sourceRoot);
    if (sourceText === null) {
      violations.push(`${sourceRef}:typescript_ast_owner_boundary:owner_source_missing`);
      continue;
    }
    const sourceViolations = analyzeTypeScriptOwnerBoundarySource({
      sourceRef,
      sourceText,
      forbiddenModuleSpecifiers,
      forbiddenPropertyNames,
    });
    violations.push(...sourceViolations.filter((entry) => (
      !allowedFilesystem.has(sourceRef)
      || !entry.includes(':typescript_ast_owner_boundary:forbidden_module_import:')
    )));
    if (traversalStops.has(sourceRef)) continue;
    const relativeImports = relativeTypeScriptImports(sourceRef, sourceText, sourceFiles, sourceRoot);
    violations.push(...relativeImports.violations);
    pending.push(...relativeImports.imports);
  }

  for (const [policyKind, sourceRefs] of [
    ['allowed_filesystem_source', allowedFilesystemSourceRefs],
    ['traversal_stop_source', traversalStopSourceRefs],
  ]) {
    for (const sourceRef of sourceRefs) {
      if (sourceTextForOwnerBoundary(sourceRef, sourceFiles, sourceRoot) === null) {
        violations.push(`${sourceRef}:typescript_ast_owner_boundary:policy_source_missing`);
      } else if (!visited.has(sourceRef)) {
        violations.push(`${sourceRef}:typescript_ast_owner_boundary:${policyKind}_not_in_closure`);
      }
    }
  }

  return [...new Set(violations)];
}

function activePrivatePlatformTypeScriptAstViolations(scanPolicy) {
  const violations = [];
  for (const sourceRef of scanPolicy?.required_absent_source_refs || []) {
    if (existsSync(path.resolve(REPO_ROOT, sourceRef))) {
      violations.push(`${sourceRef}:typescript_ast_owner_boundary:required_absent_source_present`);
    }
  }
  violations.push(...analyzeTypeScriptOwnerBoundaryClosure({
    entrySourceRefs: scanPolicy?.owner_source_refs || [],
    allowedFilesystemSourceRefs: scanPolicy?.allowed_filesystem_source_refs || [],
    traversalStopSourceRefs: scanPolicy?.traversal_stop_source_refs || [],
    forbiddenModuleSpecifiers: scanPolicy?.forbidden_module_specifiers || [],
    forbiddenPropertyNames: scanPolicy?.forbidden_property_names || [],
  }));
  return violations;
}

function collectFalseValueFailures(object, checkId, failures) {
  for (const [key, value] of Object.entries(object || {})) {
    if (value !== false) {
      failures.push({ check_id: checkId, key, value });
    }
  }
}

function buildActiveSourceScanSummary(physicalPolicy) {
  const scanPolicy = physicalPolicy.default_caller_tail_thinning_gate
    ?.active_source_resurrection_scan_policy ?? null;
  if (!scanPolicy || typeof scanPolicy !== 'object') {
    return {
      state: 'missing_scan_policy',
      scan_policy_id: null,
      scan_roots: [],
      forbidden_true_claim_keys: [],
      scanned_file_count: 0,
      violation_count: 0,
      violations: [],
      failed_checks: [{ check_id: 'active_source_resurrection_scan_policy', state: 'missing' }],
    };
  }

  const scanRoots = scanPolicy.scan_roots || [];
  const behaviorScanPolicy = physicalPolicy.behavioral_source_scan_policy ?? null;
  const astScanPolicy = behaviorScanPolicy?.typescript_ast_owner_boundary ?? null;
  const resurrectionViolations = activePrivatePlatformResurrectionViolations(scanRoots);
  const behaviorViolations = activePrivatePlatformBehaviorViolations(behaviorScanPolicy);
  const astViolations = astScanPolicy
    ? activePrivatePlatformTypeScriptAstViolations(astScanPolicy)
    : [];
  const violations = [...resurrectionViolations, ...behaviorViolations, ...astViolations];

  const failedChecks = [];
  collectFalseValueFailures(
    scanPolicy.authority_boundary,
    'active_source_scan_authority_boundary',
    failedChecks,
  );
  if (!behaviorScanPolicy || typeof behaviorScanPolicy !== 'object') {
    failedChecks.push({ check_id: 'behavioral_source_scan_policy', state: 'missing' });
  } else if (!Array.isArray(behaviorScanPolicy.forbidden_constructs)
    || behaviorScanPolicy.forbidden_constructs.length === 0) {
    failedChecks.push({ check_id: 'behavioral_source_scan_forbidden_constructs', state: 'missing' });
  } else {
    collectFalseValueFailures(
      behaviorScanPolicy.authority_boundary,
      'behavioral_source_scan_authority_boundary',
      failedChecks,
    );
  }
  if (!astScanPolicy || typeof astScanPolicy !== 'object') {
    failedChecks.push({ check_id: 'typescript_ast_owner_boundary', state: 'missing' });
  } else {
    for (const [field, values] of Object.entries({
      owner_source_refs: astScanPolicy.owner_source_refs,
      allowed_filesystem_source_refs: astScanPolicy.allowed_filesystem_source_refs,
      traversal_stop_source_refs: astScanPolicy.traversal_stop_source_refs,
      required_absent_source_refs: astScanPolicy.required_absent_source_refs,
      forbidden_module_specifiers: astScanPolicy.forbidden_module_specifiers,
      forbidden_property_names: astScanPolicy.forbidden_property_names,
    })) {
      if (!Array.isArray(values) || values.length === 0) {
        failedChecks.push({ check_id: 'typescript_ast_owner_boundary', field, state: 'missing' });
      }
    }
  }
  if (violations.length > 0) {
    failedChecks.push({
      check_id: 'active_source_resurrection_violations',
      violation_count: violations.length,
    });
  }

  return {
    state: failedChecks.length === 0
      ? 'passed_active_source_no_resurrection_scan'
      : 'failed',
    scan_policy_id: scanPolicy.policy_id,
    scan_roots: [...scanRoots],
    helper_ref: scanPolicy.helper_ref,
    test_ref: scanPolicy.test_ref,
    behavioral_scan_policy_id: behaviorScanPolicy?.policy_id ?? null,
    typescript_ast_policy_id: astScanPolicy?.policy_id ?? null,
    forbidden_true_claim_keys: [...(scanPolicy.forbidden_true_claim_keys || [])],
    forbidden_construct_ids: (behaviorScanPolicy?.forbidden_constructs || [])
      .map((entry) => entry.construct_id),
    scanned_file_count: null,
    resurrection_violation_count: resurrectionViolations.length,
    behavior_violation_count: behaviorViolations.length,
    typescript_ast_violation_count: astViolations.length,
    violation_count: violations.length,
    violations,
    failed_checks: failedChecks,
  };
}

function collectSummaryFailures({
  audit,
  physicalPolicy,
  activeSourceScan,
  blockedActions,
  forbiddenWrites,
}) {
  const failures = [];
  const closure = audit.functional_structure_gap_closure || {};
  if (closure.functional_structure_gap_count !== 0 || closure.remaining_gap_class !== 'none') {
    failures.push({
      check_id: 'functional_structure_gap_closure',
      state: 'failed',
      functional_structure_gap_count: closure.functional_structure_gap_count,
      remaining_gap_class: closure.remaining_gap_class,
    });
  }
  collectFalseValueFailures(
    audit.forbidden_generic_owner_flags,
    'functional_audit_forbidden_generic_owner_flag',
    failures,
  );

  const deletionGuard = audit.physical_deletion_guard || {};
  if (deletionGuard.surface_kind !== 'rca_private_platform_retirement_guard'
    || deletionGuard.state !== 'no_cleanup_candidates_current_roles_guarded') {
    failures.push({
      check_id: 'private_platform_retirement_guard',
      state: deletionGuard.state,
      surface_kind: deletionGuard.surface_kind,
    });
  }
  for (const [key, expected] of Object.entries({
    cleanup_candidate_count: 0,
    physical_delete_authorized: false,
    default_caller_cutover_claim_authorized: false,
  })) {
    if (deletionGuard[key] !== expected) {
      failures.push({ check_id: 'private_platform_retirement_guard', key, value: deletionGuard[key] });
    }
  }
  const roleGuard = deletionGuard.current_role_guard || {};
  collectFalseValueFailures(
    roleGuard.forbidden_owner_flags,
    'current_role_guard_forbidden_owner_flag',
    failures,
  );
  if (roleGuard.compatibility_alias_allowed !== false) {
    failures.push({
      check_id: 'current_role_guard_compatibility_alias',
      value: roleGuard.compatibility_alias_allowed,
    });
  }

  const sourceRefGate = physicalPolicy.source_ref_integrity_gate || {};
  if (sourceRefGate.state !== 'repo_local_source_refs_declared_no_second_truth') {
    failures.push({ check_id: 'source_ref_integrity_gate', state: sourceRefGate.state });
  }
  collectFalseValueFailures(
    sourceRefGate.authority_boundary,
    'source_ref_integrity_authority_boundary',
    failures,
  );

  const tailGate = physicalPolicy.default_caller_tail_thinning_gate || {};
  collectFalseValueFailures(
    tailGate.current_role_guard,
    'default_caller_tail_current_role_guard',
    failures,
  );

  const tailReadback = physicalPolicy.default_caller_tail_readback || {};
  collectFalseValueFailures(
    tailReadback.false_ready_guard,
    'default_caller_tail_false_ready_guard',
    failures,
  );
  const compactSummary = tailReadback.compact_retirement_summary || {};
  for (const key of [
    'can_apply_cleanup',
    'can_authorize_physical_delete',
    'can_claim_default_caller_cutover_complete',
    'can_claim_visual_ready',
    'can_claim_domain_ready',
    'can_claim_production_ready',
  ]) {
    if (compactSummary[key] !== false) {
      failures.push({
        check_id: 'default_caller_tail_compact_summary_false_ready_guard',
        key,
        value: compactSummary[key],
      });
    }
  }

  for (const action of [
    'write_visual_truth',
    'write_canonical_artifacts',
    'write_review_verdict',
    'write_publication_gate',
    'mutate_review_state',
    'publish_export_bundle',
  ]) {
    if (!blockedActions.includes(action)) {
      failures.push({ check_id: 'domain_action_adapter_blocked_action_missing', action });
    }
  }
  for (const write of ['visual_truth', 'review_verdict', 'publication_gate', 'canonical_artifacts']) {
    if (!forbiddenWrites.includes(write)) {
      failures.push({ check_id: 'domain_action_adapter_forbidden_write_missing', write });
    }
  }

  failures.push(...activeSourceScan.failed_checks);
  return failures;
}

export function buildPrivatePlatformSourceGuardReadback() {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const physicalPolicy = buildPhysicalSourceMorphologyPolicy();
  const activeSourceScan = buildActiveSourceScanSummary(physicalPolicy);
  const blockedActions = listDomainActionAdapterBlockedActions();
  const forbiddenWrites = listDomainActionAdapterForbiddenWrites();
  const tailReadback = physicalPolicy.default_caller_tail_readback || {};
  const compactSummary = tailReadback.compact_retirement_summary || {};
  const failures = collectSummaryFailures({
    audit,
    physicalPolicy,
    activeSourceScan,
    blockedActions,
    forbiddenWrites,
  });

  return {
    surface_kind: 'rca_private_platform_source_guard_summary',
    schema_version: 2,
    target_domain_id: 'redcube-ai',
    state: failures.length === 0 ? 'passed_repo_source_guard_only' : 'failed',
    failed_checks: failures,
    source_refs: {
      functional_audit_contract: 'contracts/functional_privatization_audit.json',
      physical_source_policy: 'contracts/physical_source_morphology_policy.json',
      active_source_scan_policy:
        'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate/active_source_resurrection_scan_policy',
      behavioral_source_scan_policy:
        'contracts/physical_source_morphology_policy.json#/behavioral_source_scan_policy',
      typescript_ast_owner_boundary_policy:
        'contracts/physical_source_morphology_policy.json#/behavioral_source_scan_policy/typescript_ast_owner_boundary',
    },
    guard_summary: {
      functional_structure_gap_count:
        audit.functional_structure_gap_closure?.functional_structure_gap_count ?? null,
      source_ref_integrity_state: physicalPolicy.source_ref_integrity_gate?.state ?? null,
      tail_surface_count: tailReadback.tail_surface_count ?? null,
      current_non_tail_surface_count: tailReadback.current_non_tail_surface_count ?? null,
      retained_current_refs_only_boundary_count:
        tailReadback.retained_current_refs_only_boundary_count ?? null,
      cleanup_candidate_count: compactSummary.cleanup_candidate_count ?? null,
      owner_delta_required: compactSummary.owner_delta_required ?? null,
      missing_evidence_ids: compactSummary.missing_evidence_ids ?? [],
      blocked_action_count: blockedActions.length,
      forbidden_write_count: forbiddenWrites.length,
      active_source_scan: {
        state: activeSourceScan.state,
        scan_policy_id: activeSourceScan.scan_policy_id,
        behavioral_scan_policy_id: activeSourceScan.behavioral_scan_policy_id,
        typescript_ast_policy_id: activeSourceScan.typescript_ast_policy_id,
        forbidden_construct_ids: activeSourceScan.forbidden_construct_ids,
        scanned_file_count: activeSourceScan.scanned_file_count,
        resurrection_violation_count: activeSourceScan.resurrection_violation_count,
        behavior_violation_count: activeSourceScan.behavior_violation_count,
        typescript_ast_violation_count: activeSourceScan.typescript_ast_violation_count,
        violation_count: activeSourceScan.violation_count,
        violations: activeSourceScan.violations,
      },
    },
    authority_boundary: {
      readback_can_write_visual_truth: false,
      readback_can_write_artifact_blob: false,
      readback_can_write_memory_body: false,
      readback_can_issue_review_or_export_verdict: false,
      readback_can_sign_owner_receipt: false,
      readback_can_create_typed_blocker_instance: false,
      readback_can_authorize_physical_delete: false,
      readback_can_claim_default_caller_cutover: false,
      readback_can_claim_visual_ready: false,
      readback_can_claim_exportable: false,
      readback_can_claim_handoffable: false,
      readback_can_claim_domain_ready: false,
      readback_can_claim_production_ready: false,
    },
  };
}

function parseArgs(argv) {
  const parsed = parseNodeArgs({
    args: argv,
    allowPositionals: false,
    options: {
      format: { type: 'string', default: 'text' },
    },
  });
  const format = parsed.values.format;
  if (!['json', 'text'].includes(format)) {
    throw new Error('--format must be json or text');
  }
  return { format };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const payload = buildPrivatePlatformSourceGuardReadback();
    if (args.format === 'json') {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`${payload.surface_kind}: ${payload.state} (${payload.failed_checks.length} failed checks)\n`);
    }
    process.exitCode = payload.state === 'passed_repo_source_guard_only' ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
