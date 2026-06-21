// @ts-nocheck
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  buildPhysicalSourceMorphologyPolicy,
  buildPrivatizedFunctionalModuleAuditProjection,
  listDomainActionAdapterBlockedActions,
  listDomainActionAdapterForbiddenWrites,
} from '../packages/redcube-domain-entry/dist/index.js';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(REPO_ROOT, relativePath), 'utf-8'));
}

function collectFailures({ audit, physicalPolicy, runtimeWatchBoundary, blockedActions, forbiddenWrites }) {
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
  for (const entry of audit.retired_no_resurrection_guards || []) {
    if (
      entry.active_default_caller !== false
      || entry.active_caller !== false
      || entry.compatibility_alias_allowed !== false
      || entry.resurrection_policy !== 'forbidden'
    ) {
      failures.push({
        check_id: 'retired_no_resurrection_guard',
        state: 'failed',
        surface_id: entry.surface_id,
      });
    }
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
  const compactSummary = physicalPolicy.default_caller_tail_readback?.compact_retirement_summary || {};
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
  if (compactSummary.owner_delta_required !== true) {
    failures.push({
      check_id: 'default_caller_tail_compact_owner_delta_required',
      state: 'failed',
      owner_delta_required: compactSummary.owner_delta_required,
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
    refs_only: runtimeWatchSurface.classification === 'refs_only_read_model',
    read_only: true,
    source_refs: [...(runtimeWatchSurface.source_refs || [])],
    machine_boundary_refs: [...(runtimeWatchSurface.machine_boundary_refs || [])],
    no_resurrection_gate: { ...(runtimeWatchSurface.no_resurrection_gate || {}) },
    forbidden_generic_owner_flags: { ...(runtimeWatchSurface.forbidden_generic_owner_flags || {}) },
  };
}

export function buildPrivatePlatformRetirementReadback() {
  const audit = buildPrivatizedFunctionalModuleAuditProjection();
  const physicalPolicy = buildPhysicalSourceMorphologyPolicy();
  const runtimeWatchBoundary = buildRuntimeWatchBoundaryReadback(physicalPolicy);
  const blockedActions = listDomainActionAdapterBlockedActions();
  const forbiddenWrites = listDomainActionAdapterForbiddenWrites();
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
  const contractAudit = currentProgram.product_release_metadata.privatized_functional_module_audit;
  const failures = collectFailures({
    audit,
    physicalPolicy,
    runtimeWatchBoundary,
    blockedActions,
    forbiddenWrites,
  });
  if (JSON.stringify(contractAudit.functional_structure_gap_closure)
    !== JSON.stringify(audit.functional_structure_gap_closure)) {
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
    default_caller_tail_compact_retirement_summary:
      physicalPolicy.default_caller_tail_readback?.compact_retirement_summary ?? null,
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
  return { format };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const payload = buildPrivatePlatformRetirementReadback();
    if (args.format === 'json') {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`${payload.surface_kind}: ${payload.state} (${payload.failed_checks.length} failed checks)\n`);
    }
    process.exit(payload.state === 'passed_repo_source_guard_only' ? 0 : 1);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
