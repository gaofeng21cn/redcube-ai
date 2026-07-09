// @ts-nocheck
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs as parseNodeArgs } from 'node:util';

import {
  buildPhysicalSourceMorphologyPolicy,
  buildPrivatizedFunctionalModuleAuditProjection,
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
  'tests/helpers/rca-retired-surface-guard.ts',
  'tests/rca-retired-surface-active-guard.test.ts',
  'tests/rca-opl-generic-primitive-consumption.test.ts',
  'tests/rca-functional-audit-retirement.test.ts',
  'tests/rca-legacy-name-allowance.test.ts',
  'tests/rca-retired-payload-pointer-guard.test.ts',
  'tests/python-native-helper-catalog.test.ts',
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
  const violations = activePrivatePlatformResurrectionViolations(scanRoots);

  const failedChecks = [];
  collectFalseValueFailures(
    scanPolicy.authority_boundary,
    'active_source_scan_authority_boundary',
    failedChecks,
  );
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
    forbidden_true_claim_keys: [...(scanPolicy.forbidden_true_claim_keys || [])],
    scanned_file_count: null,
    violation_count: violations.length,
    violations,
    failed_checks: failedChecks,
  };
}

function collectSummaryFailures({
  audit,
  contractAudit,
  physicalPolicy,
  activeSourceScan,
  blockedActions,
  forbiddenWrites,
}) {
  const failures = [];
  if (JSON.stringify(contractAudit) !== JSON.stringify(audit)) {
    failures.push({ check_id: 'functional_privatization_audit_source_sync', state: 'failed' });
  }

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
  if (deletionGuard.physical_delete_authorization_ref !== null) {
    failures.push({
      check_id: 'physical_delete_authorization_ref',
      value: deletionGuard.physical_delete_authorization_ref,
    });
  }
  if ((deletionGuard.physical_delete_authorization_refs || []).length !== 0) {
    failures.push({
      check_id: 'physical_delete_authorization_refs',
      value: deletionGuard.physical_delete_authorization_refs,
    });
  }
  const roleGuard = audit.closed_retirement_summary?.current_role_guard
    || deletionGuard.current_role_guard
    || {};
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
  collectFalseValueFailures(
    tailGate.retirement_readback_cleanup_guard?.claims,
    'retirement_readback_false_claim_guard',
    failures,
  );
  for (const [key, value] of Object.entries(
    tailGate.retirement_readback_cleanup_guard?.authority_boundary || {},
  )) {
    if (key.startsWith('guard_can_identify') || key.startsWith('guard_can_route')) continue;
    if (value !== false) {
      failures.push({ check_id: 'retirement_readback_authority_boundary', key, value });
    }
  }

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

export function buildPrivatePlatformSourceGuardReadback(scope = 'private-platform') {
  const audit = buildPrivatizedFunctionalModuleAuditProjection();
  const contractAudit = readJson('contracts/functional_privatization_audit.json');
  const physicalPolicy = buildPhysicalSourceMorphologyPolicy();
  const activeSourceScan = buildActiveSourceScanSummary(physicalPolicy);
  const blockedActions = listDomainActionAdapterBlockedActions();
  const forbiddenWrites = listDomainActionAdapterForbiddenWrites();
  const tailReadback = physicalPolicy.default_caller_tail_readback || {};
  const compactSummary = tailReadback.compact_retirement_summary || {};
  const failures = collectSummaryFailures({
    audit,
    contractAudit,
    physicalPolicy,
    activeSourceScan,
    blockedActions,
    forbiddenWrites,
  });

  return {
    surface_kind: 'rca_private_platform_source_guard_summary',
    schema_version: 2,
    target_domain_id: 'redcube-ai',
    scope,
    state: failures.length === 0 ? 'passed_repo_source_guard_only' : 'failed',
    failed_checks: failures,
    source_refs: {
      functional_audit_contract: 'contracts/functional_privatization_audit.json',
      physical_source_policy: 'contracts/physical_source_morphology_policy.json',
      active_source_scan_policy:
        'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate/active_source_resurrection_scan_policy',
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
        scanned_file_count: activeSourceScan.scanned_file_count,
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
      scope: { type: 'string', default: 'private-platform' },
    },
  });
  const format = parsed.values.format;
  if (!['json', 'text'].includes(format)) {
    throw new Error('--format must be json or text');
  }
  const scope = parsed.values.scope;
  if (!['private-platform', 'default-caller-tail'].includes(scope)) {
    throw new Error('--scope must be private-platform or default-caller-tail');
  }
  return { format, scope };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const payload = buildPrivatePlatformSourceGuardReadback(args.scope);
    if (args.format === 'json') {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`${payload.surface_kind}:${payload.scope}: ${payload.state} (${payload.failed_checks.length} failed checks)\n`);
    }
    process.exitCode = payload.state === 'passed_repo_source_guard_only' ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
