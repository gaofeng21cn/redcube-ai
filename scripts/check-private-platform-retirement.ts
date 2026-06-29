// @ts-nocheck
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  buildPhysicalSourceMorphologyPolicy,
  buildPrivatizedFunctionalModuleAuditProjection,
  listDomainActionAdapterBlockedActions,
  listDomainActionAdapterForbiddenWrites,
} from '../packages/redcube-domain-entry/dist/index.js';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
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
const RETIRED_SURFACE_GUARD_SOURCE_REFS = new Set([
  'tests/helpers/rca-retired-surface-guard.ts',
  'tests/rca-retired-surface-active-guard.test.ts',
  'tests/rca-opl-generic-primitive-consumption.test.ts',
  'tests/rca-functional-audit-retirement.test.ts',
  'tests/rca-legacy-name-allowance.test.ts',
  'tests/rca-retired-payload-pointer-guard.test.ts',
  'tests/python-native-helper-catalog.test.ts',
]);
const DEFAULT_CALLER_TAIL_EXTRA_FORBIDDEN_TRUE_CLAIM_KEYS = Object.freeze([
  'product_entry_can_become_generic_product_wrapper_owner',
  'domain_handler_target_can_become_generated_wrapper_owner',
  'domain_handler_target_can_become_generic_runtime_owner',
  'generic_product_wrapper_owner_allowed',
]);

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(REPO_ROOT, relativePath), 'utf-8'));
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function listTextFiles(root) {
  const fullRoot = path.resolve(REPO_ROOT, root);
  if (!existsSync(fullRoot)) return [];
  if (path.extname(root)) return [fullRoot];
  return readdirSync(fullRoot, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(fullRoot, entry.name);
    const normalized = normalizePath(path.relative(REPO_ROOT, file));
    if (entry.isDirectory()) {
      if (normalized.includes('__closeout-audit-test__')) return [];
      if (['dist', 'build', 'node_modules'].includes(entry.name)) return [];
      return listTextFiles(normalized);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

function patternFromForbiddenClaimKey(key) {
  return new RegExp(`\\b${key}\\b\\s*[:=]\\s*true`, 'i');
}

function buildActiveSourceResurrectionScanReadback(physicalPolicy) {
  const scanPolicy = physicalPolicy.default_caller_tail_thinning_gate
    ?.active_source_resurrection_scan_policy ?? null;
  if (!scanPolicy || typeof scanPolicy !== 'object') {
    return {
      surface_kind: 'rca_active_source_resurrection_scan_readback',
      state: 'missing_scan_policy',
      failed_checks: [{ check_id: 'active_source_resurrection_scan_policy', state: 'missing' }],
      authority_boundary: {},
      forbidden_true_claim_keys: [],
      scanned_file_count: 0,
      violation_count: 0,
      violations: [],
    };
  }

  const violations = [];
  const forbiddenKeys = [
    ...new Set([
      ...(Array.isArray(scanPolicy.forbidden_true_claim_keys)
        ? scanPolicy.forbidden_true_claim_keys
        : []),
      ...DEFAULT_CALLER_TAIL_EXTRA_FORBIDDEN_TRUE_CLAIM_KEYS,
    ]),
  ];
  for (const root of scanPolicy.scan_roots || []) {
    for (const file of listTextFiles(root)) {
      const relativePath = normalizePath(path.relative(REPO_ROOT, file));
      if (RETIRED_SURFACE_GUARD_SOURCE_REFS.has(relativePath)) continue;
      const text = readFileSync(file, 'utf-8');
      for (const key of forbiddenKeys) {
        if (patternFromForbiddenClaimKey(key).test(text)) {
          violations.push({
            file: relativePath,
            forbidden_true_claim_key: key,
          });
        }
      }
    }
  }

  const boundary = scanPolicy.authority_boundary || {};
  const failedChecks = [];
  for (const [key, value] of Object.entries(boundary)) {
    if (value !== false) {
      failedChecks.push({
        check_id: 'active_source_scan_authority_boundary',
        key,
        value,
      });
    }
  }
  if (violations.length > 0) {
    failedChecks.push({
      check_id: 'active_source_resurrection_violations',
      violation_count: violations.length,
    });
  }

  const scannedFiles = (scanPolicy.scan_roots || [])
    .flatMap((root) => listTextFiles(root))
    .map((file) => normalizePath(path.relative(REPO_ROOT, file)))
    .filter((file) => !RETIRED_SURFACE_GUARD_SOURCE_REFS.has(file));

  return {
    surface_kind: 'rca_active_source_resurrection_scan_readback',
    scan_policy_id: scanPolicy.policy_id,
    state: failedChecks.length === 0
      ? 'passed_active_source_no_resurrection_scan'
      : 'failed',
    failed_checks: failedChecks,
    scan_roots: [...(scanPolicy.scan_roots || [])],
    helper_ref: scanPolicy.helper_ref,
    test_ref: scanPolicy.test_ref,
    forbidden_true_claim_keys: [...forbiddenKeys],
    fail_closed_conditions: [...(scanPolicy.fail_closed_conditions || [])],
    scanned_file_count: scannedFiles.length,
    violation_count: violations.length,
    violations,
    authority_boundary: { ...boundary },
    false_ready_guard: {
      scan_can_authorize_physical_delete: false,
      scan_can_claim_default_caller_cutover: false,
      scan_can_claim_visual_ready: false,
      scan_can_claim_domain_ready: false,
      scan_can_claim_production_ready: false,
    },
  };
}

function applyDefaultCallerTailContractOverlay(physicalPolicy) {
  const contractPolicy = readJson('contracts/physical_source_morphology_policy.json');
  const contractGate = contractPolicy.default_caller_tail_thinning_gate || {};
  const physicalGate = physicalPolicy.default_caller_tail_thinning_gate || {};
  return {
    ...physicalPolicy,
    default_caller_tail_thinning_gate: {
      ...physicalGate,
      current_role_guard: {
        ...(physicalGate.current_role_guard || {}),
        ...(contractGate.current_role_guard || {}),
      },
      active_source_resurrection_scan_policy: {
        ...(physicalGate.active_source_resurrection_scan_policy || {}),
        ...(contractGate.active_source_resurrection_scan_policy || {}),
        forbidden_true_claim_keys: [
          ...new Set([
            ...((physicalGate.active_source_resurrection_scan_policy || {}).forbidden_true_claim_keys || []),
            ...((contractGate.active_source_resurrection_scan_policy || {}).forbidden_true_claim_keys || []),
            ...DEFAULT_CALLER_TAIL_EXTRA_FORBIDDEN_TRUE_CLAIM_KEYS,
          ]),
        ],
      },
    },
  };
}

function defaultCallerTailCountZeroGuard() {
  return {
    guard_id: 'rca.source_morphology.empty_default_caller_tail_not_delete_authority.v1',
    state: 'tail_worklist_empty_current_surfaces_still_guarded',
    interpretation:
      'tail_surface_count_zero_and_cleanup_candidate_count_zero_mean_no_current_cleanup_candidate_not_physical_delete_authority',
    protected_counts: [
      'tail_surface_count',
      'cleanup_candidate_count',
    ],
    false_ready_guard: {
      empty_tail_worklist_can_claim_cleanup_complete: false,
      empty_tail_worklist_can_authorize_physical_delete: false,
      empty_tail_worklist_can_claim_default_caller_cutover_complete: false,
      empty_tail_worklist_can_claim_visual_ready: false,
      empty_tail_worklist_can_claim_domain_ready: false,
      empty_tail_worklist_can_claim_production_ready: false,
      cleanup_candidate_count_zero_can_authorize_physical_delete: false,
      cleanup_candidate_count_zero_can_claim_cleanup_complete: false,
    },
  };
}

function enrichDefaultCallerTailCompactSummary(compactSummary) {
  return {
    ...compactSummary,
    cleanup_candidate_count_semantics:
      'zero_means_no_current_cleanup_candidate_not_physical_delete_authority',
    count_zero_guard: defaultCallerTailCountZeroGuard(),
  };
}

function collectDefaultCallerTailCountZeroGuardFailures(compactSummary, failures) {
  if (compactSummary.cleanup_candidate_count_semantics !== 'zero_means_no_current_cleanup_candidate_not_physical_delete_authority') {
    failures.push({
      check_id: 'default_caller_tail_cleanup_candidate_count_semantics',
      state: 'failed',
      value: compactSummary.cleanup_candidate_count_semantics,
    });
  }
  const countZeroGuard = compactSummary.count_zero_guard || {};
  if (countZeroGuard.guard_id !== 'rca.source_morphology.empty_default_caller_tail_not_delete_authority.v1') {
    failures.push({
      check_id: 'default_caller_tail_count_zero_guard',
      state: 'missing',
      guard_id: countZeroGuard.guard_id,
    });
  }
  for (const [key, value] of Object.entries(countZeroGuard.false_ready_guard || {})) {
    if (value !== false) {
      failures.push({
        check_id: 'default_caller_tail_count_zero_false_ready_guard',
        key,
        value,
      });
    }
  }
}

function collectFailures({ audit, physicalPolicy, runtimeWatchBoundary, blockedActions, forbiddenWrites, activeSourceScan }) {
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
  if (closure.evidence_gap_class !== 'production_live_soak_evidence_only') {
    failures.push({
      check_id: 'evidence_gap_boundary',
      state: 'failed',
      evidence_gap_class: closure.evidence_gap_class,
    });
  }
  for (const [key, value] of Object.entries(audit.forbidden_generic_owner_flags || {})) {
    if (value !== false) {
      failures.push({ check_id: 'forbidden_generic_owner_flag', key, value });
    }
  }
  const deletionGuard = audit.physical_deletion_guard || {};
  if (deletionGuard.physical_delete_authorization_ref !== null) {
    failures.push({
      check_id: 'physical_delete_authorization_ref',
      state: 'failed',
      value: deletionGuard.physical_delete_authorization_ref,
    });
  }
  if ((deletionGuard.physical_delete_authorization_refs || []).length !== 0) {
    failures.push({
      check_id: 'physical_delete_authorization_refs',
      state: 'failed',
      value: deletionGuard.physical_delete_authorization_refs,
    });
  }
  const roleGuard = audit.closed_retirement_summary?.current_role_guard
    || deletionGuard.current_role_guard
    || {};
  for (const [key, value] of Object.entries(roleGuard.forbidden_owner_flags || {})) {
    if (value !== false) {
      failures.push({
        check_id: 'current_role_guard_forbidden_owner_flag',
        state: 'failed',
        key,
        value,
      });
    }
  }
  if (roleGuard.compatibility_alias_allowed !== false) {
    failures.push({
      check_id: 'current_role_guard_compatibility_alias',
      state: 'failed',
      value: roleGuard.compatibility_alias_allowed,
    });
  }
  if (audit.closed_retirement_summary?.closed_retirement_count !== deletionGuard.closed_retirement_count) {
    failures.push({
      check_id: 'closed_retirement_count_consistency',
      state: 'failed',
      summary_count: audit.closed_retirement_summary?.closed_retirement_count,
      deletion_guard_count: deletionGuard.closed_retirement_count,
    });
  }
  const sourceRefGate = physicalPolicy.source_ref_integrity_gate || {};
  if (sourceRefGate.state !== 'repo_local_source_refs_declared_no_second_truth') {
    failures.push({
      check_id: 'source_ref_integrity_gate',
      state: sourceRefGate.state,
    });
  }
  for (const [key, value] of Object.entries(sourceRefGate.authority_boundary || {})) {
    if (value !== false) {
      failures.push({ check_id: 'source_ref_integrity_authority_boundary', key, value });
    }
  }
  const tailGuard = physicalPolicy.default_caller_tail_readback?.false_ready_guard || {};
  for (const [key, value] of Object.entries(tailGuard)) {
    if (value !== false) {
      failures.push({ check_id: 'default_caller_tail_false_ready_guard', key, value });
    }
  }
  const compactSummary = enrichDefaultCallerTailCompactSummary(
    physicalPolicy.default_caller_tail_readback?.compact_retirement_summary || {},
  );
  for (const key of [
    'can_apply_cleanup',
    'can_authorize_physical_delete',
    'can_claim_default_caller_cutover_complete',
    'can_claim_visual_ready',
    'can_claim_domain_ready',
    'can_claim_production_ready',
  ]) {
    if (compactSummary[key] !== false) {
      failures.push({ check_id: 'default_caller_tail_compact_summary_false_ready_guard', key, value: compactSummary[key] });
    }
  }
  if (compactSummary.cleanup_candidate_count !== 0) {
    failures.push({
      check_id: 'default_caller_tail_compact_cleanup_candidate_count',
      state: 'failed',
      cleanup_candidate_count: compactSummary.cleanup_candidate_count,
    });
  }
  collectDefaultCallerTailCountZeroGuardFailures(compactSummary, failures);
  const tailSurfaceCount = physicalPolicy.default_caller_tail_readback?.tail_surface_count ?? 0;
  if (compactSummary.owner_delta_required !== (tailSurfaceCount > 0)) {
    failures.push({
      check_id: 'default_caller_tail_compact_owner_delta_required',
      state: 'failed',
      owner_delta_required: compactSummary.owner_delta_required,
      tail_surface_count: tailSurfaceCount,
    });
  }
  if (runtimeWatchBoundary.refs_only !== true || runtimeWatchBoundary.read_only !== true) {
    failures.push({
      check_id: 'runtime_watch_refs_only_boundary',
      state: 'failed',
      refs_only: runtimeWatchBoundary.refs_only,
      read_only: runtimeWatchBoundary.read_only,
    });
  }
  for (const [key, value] of Object.entries(runtimeWatchBoundary.no_resurrection_gate || {})) {
    if (value !== false) {
      failures.push({ check_id: 'runtime_watch_no_resurrection_gate', key, value });
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
  if (activeSourceScan.state !== 'passed_active_source_no_resurrection_scan') {
    failures.push({
      check_id: 'active_source_resurrection_scan',
      state: activeSourceScan.state,
      violation_count: activeSourceScan.violation_count,
    });
  }
  return failures;
}

function buildRuntimeWatchBoundaryReadback(physicalPolicy) {
  const runtimeWatchSurface = (physicalPolicy.active_surface_classifications || [])
    .find((entry) => entry.surface_id === 'runtime_watch_projection');
  if (!runtimeWatchSurface) {
    return {
      surface_kind: 'rca_runtime_watch_boundary_readback',
      state: 'missing_runtime_watch_projection',
      refs_only: false,
      read_only: false,
      no_resurrection_gate: {},
    };
  }
  return {
    surface_kind: 'rca_runtime_watch_boundary_readback',
    boundary_contract_id: 'rca.runtime_watch_refs_only_projection.v1',
    owner: physicalPolicy.owner,
    consumer: physicalPolicy.consumer,
    role: runtimeWatchSurface.current_rca_role,
    classification: runtimeWatchSurface.classification,
    refs_only: [
      'refs_only_read_model',
      'retained_current_refs_only_boundary',
    ].includes(runtimeWatchSurface.classification),
    read_only: true,
    source_refs: [...(runtimeWatchSurface.source_refs || [])],
    machine_boundary_refs: [...(runtimeWatchSurface.machine_boundary_refs || [])],
    no_resurrection_gate: { ...(runtimeWatchSurface.no_resurrection_gate || {}) },
    forbidden_generic_owner_flags: { ...(runtimeWatchSurface.forbidden_generic_owner_flags || {}) },
  };
}

function collectDefaultCallerTailFailures(tailReadback, compactSummary) {
  const failures = [];
  if (!tailReadback || typeof tailReadback !== 'object') {
    failures.push({
      check_id: 'default_caller_tail_readback',
      state: 'missing',
    });
    return failures;
  }
  const falseReadyGuard = tailReadback.false_ready_guard || {};
  for (const [key, value] of Object.entries(falseReadyGuard)) {
    if (value !== false) {
      failures.push({ check_id: 'default_caller_tail_false_ready_guard', key, value });
    }
  }
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
  if (compactSummary.cleanup_candidate_count !== 0) {
    failures.push({
      check_id: 'default_caller_tail_compact_cleanup_candidate_count',
      state: 'failed',
      cleanup_candidate_count: compactSummary.cleanup_candidate_count,
    });
  }
  collectDefaultCallerTailCountZeroGuardFailures(compactSummary, failures);
  if (compactSummary.owner_delta_required !== (tailReadback.tail_surface_count > 0)) {
    failures.push({
      check_id: 'default_caller_tail_compact_owner_delta_required',
      state: 'failed',
      owner_delta_required: compactSummary.owner_delta_required,
      tail_surface_count: tailReadback.tail_surface_count,
    });
  }
  const workOrderPack = compactSummary.owner_delta_work_order_pack || {};
  if (workOrderPack.owner_delta_route_count !== tailReadback.tail_surface_count) {
    failures.push({
      check_id: 'default_caller_tail_owner_delta_work_order_route_count',
      state: 'failed',
      owner_delta_route_count: workOrderPack.owner_delta_route_count,
      tail_surface_count: tailReadback.tail_surface_count,
    });
  }
  const workOrderBoundary = workOrderPack.authority_boundary || {};
  for (const [key, value] of Object.entries(workOrderBoundary)) {
    if (value !== false) {
      failures.push({
        check_id: 'default_caller_tail_owner_delta_work_order_authority_boundary',
        key,
        value,
      });
    }
  }
  for (const classification of tailReadback.tail_classifications || []) {
    const route = classification.owner_delta_route || {};
    if (!route.typed_blocker_ref_shape) {
      failures.push({
        check_id: 'default_caller_tail_typed_blocker_ref_shape',
        state: 'missing',
        surface_id: classification.surface_id,
      });
    }
    for (const [key, value] of Object.entries(classification.no_resurrection_gate || {})) {
      if (value !== false) {
        failures.push({
          check_id: 'default_caller_tail_no_resurrection_gate',
          surface_id: classification.surface_id,
          key,
          value,
        });
      }
    }
  }
  return failures;
}

export function buildDefaultCallerTailOwnerDeltaReadback() {
  const physicalPolicy = applyDefaultCallerTailContractOverlay(buildPhysicalSourceMorphologyPolicy());
  const tailReadback = physicalPolicy.default_caller_tail_readback ?? null;
  const compactSummary = enrichDefaultCallerTailCompactSummary(
    tailReadback?.compact_retirement_summary ?? {},
  );
  const ownerDeltaWorkOrderPack = compactSummary.owner_delta_work_order_pack ?? null;
  const tailClassifications = tailReadback?.tail_classifications ?? [];
  const failures = collectDefaultCallerTailFailures(tailReadback, compactSummary);

  return {
    surface_kind: 'rca_default_caller_tail_owner_delta_readback',
    schema_version: 1,
    target_domain_id: 'redcube-ai',
    state: failures.length === 0 ? 'passed_repo_source_guard_only' : 'failed',
    failed_checks: failures,
    default_caller_tail_readback: tailReadback,
    compact_retirement_summary: compactSummary,
    owner_delta_work_order_pack: ownerDeltaWorkOrderPack,
    owner_delta_routes: tailClassifications.map((classification) => ({
      surface_id: classification.surface_id,
      owner_delta_route: classification.owner_delta_route ?? null,
    })),
    typed_blocker_ref_shapes: tailClassifications.map((classification) => ({
      surface_id: classification.surface_id,
      typed_blocker_ref_shape: classification.owner_delta_route?.typed_blocker_ref_shape ?? null,
    })),
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

export function buildPrivatePlatformRetirementReadback() {
  const audit = buildPrivatizedFunctionalModuleAuditProjection();
  const physicalPolicy = applyDefaultCallerTailContractOverlay(buildPhysicalSourceMorphologyPolicy());
  const runtimeWatchBoundary = buildRuntimeWatchBoundaryReadback(physicalPolicy);
  const activeSourceScan = buildActiveSourceResurrectionScanReadback(physicalPolicy);
  const blockedActions = listDomainActionAdapterBlockedActions();
  const forbiddenWrites = listDomainActionAdapterForbiddenWrites();
  const contractAudit = readJson('contracts/functional_privatization_audit.json');
  const failures = collectFailures({
    audit,
    physicalPolicy,
    runtimeWatchBoundary,
    blockedActions,
    forbiddenWrites,
    activeSourceScan,
  });
  if (JSON.stringify(contractAudit) !== JSON.stringify(audit)) {
    failures.push({
      check_id: 'current_program_audit_readback_sync',
      state: 'failed',
    });
  }
  return {
    surface_kind: 'rca_private_platform_retirement_strict_readback',
    schema_version: 1,
    target_domain_id: 'redcube-ai',
    state: failures.length === 0 ? 'passed_repo_source_guard_only' : 'failed',
    failed_checks: failures,
    functional_privatization_audit: audit,
    physical_source_morphology_policy: physicalPolicy,
    active_source_resurrection_scan: activeSourceScan,
    default_caller_tail_compact_retirement_summary:
      enrichDefaultCallerTailCompactSummary(
        physicalPolicy.default_caller_tail_readback?.compact_retirement_summary ?? {},
      ),
    runtime_watch_boundary: runtimeWatchBoundary,
    domain_action_adapter_boundary: {
      blocked_actions: blockedActions,
      forbidden_writes: forbiddenWrites,
    },
    allowed_outputs: [
      'retired_surface_tombstone_status',
      'refs_only_runtime_watch_boundary',
      'missing_evidence_worklist',
      'owner_delta_route',
      'typed_blocker_ref_shape',
      'source_ref_integrity_status',
    ],
    forbidden_outputs: [
      'visual_truth_write',
      'artifact_blob_write',
      'memory_body_write',
      'review_or_export_verdict',
      'owner_receipt_signature',
      'physical_delete_operation',
      'default_caller_cutover_claim',
      'visual_ready_or_exportable_claim',
      'production_ready_claim',
    ],
    authority_boundary: {
      readback_can_write_visual_truth: false,
      readback_can_write_artifact_blob: false,
      readback_can_write_memory_body: false,
      readback_can_issue_review_or_export_verdict: false,
      readback_can_sign_owner_receipt: false,
      readback_can_authorize_physical_delete: false,
      readback_can_claim_generic_runtime_owner: false,
      readback_can_claim_default_caller_cutover: false,
      readback_can_claim_visual_ready: false,
      readback_can_claim_exportable: false,
      readback_can_claim_handoffable: false,
      readback_can_claim_production_ready: false,
    },
  };
}

function parseArgs(argv) {
  const formatIndex = argv.indexOf('--format');
  const format = formatIndex >= 0 ? argv[formatIndex + 1] : 'text';
  if (!['json', 'text'].includes(format)) {
    throw new Error('--format must be json or text');
  }
  const scopeIndex = argv.indexOf('--scope');
  const scope = scopeIndex >= 0 ? argv[scopeIndex + 1] : 'private-platform';
  if (!['private-platform', 'default-caller-tail'].includes(scope)) {
    throw new Error('--scope must be private-platform or default-caller-tail');
  }
  return { format, scope };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const payload = args.scope === 'default-caller-tail'
      ? buildDefaultCallerTailOwnerDeltaReadback()
      : buildPrivatePlatformRetirementReadback();
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
