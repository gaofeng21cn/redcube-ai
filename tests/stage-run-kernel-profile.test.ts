// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

const requiredStrategyTraceKeys = [
  'candidate_generation',
  'grounded_reflection',
  'comparative_selection',
  'evolution_and_revision',
  'meta_review_learning',
  'independent_quality_gate',
];

const expectedRoleArtifactRefKeys = [
  'candidate_pool_ref',
  'reflection_review_ref',
  'ranking_selection_ref',
  'revision_lineage_ref',
  'meta_review_ref',
  'independent_gate_ref',
];

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
}

function assertRefs(value, label) {
  assert.equal(Array.isArray(value), true, label);
  assert.equal(value.length > 0, true, label);
  for (const [index, ref] of value.entries()) {
    assertNonEmptyString(ref, `${label}[${index}]`);
  }
}

function assertNoForbiddenBodyFields(value, label = 'evidence') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenBodyFields(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const forbiddenBodyFieldNames = new Set([
    'artifact_body',
    'artifact_blob',
    'visual_truth_body',
    'review_verdict_body',
    'export_verdict_body',
    'owner_receipt_body',
    'typed_blocker_body',
    'memory_body',
  ]);
  for (const key of Object.keys(value)) {
    assert.equal(forbiddenBodyFieldNames.has(key), false, `${label}.${key}`);
    assertNoForbiddenBodyFields(value[key], `${label}.${key}`);
  }
}

test('StageRun Kernel profile keeps RCA visual authority separate from OPL runtime refs', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const oplRefs = profile.opl_contract_refs;
  const canary = profile.visual_stage_run_canary;
  const overclaimBoundary = profile.overclaim_boundary;
  const residueGuard = profile.legacy_runtime_residue_guard;
  const operatorSummary = profile.controlled_canary_operator_summary;

  assert.equal(profile.surface_kind, 'opl_stage_run_kernel_profile');
  assert.equal(profile.domain_id, 'redcube-ai');
  assert.equal(profile.kernel_role, 'minimal_state_shell_not_domain_controller_system');
  assert.deepEqual(profile.stage_native_unit, [
    'stage_folder',
    'stage_manifest',
    'role_artifacts',
    'owner_receipt_or_typed_blocker',
  ]);
  assert.deepEqual(profile.required_object_models, [
    'StageRun',
    'RoleArtifactRef',
    'OwnerReceipt',
    'TypedBlocker',
    'ReadModel',
  ]);

  assert.equal(profile.stage_run_state_machine.provider_completion_counts_as_domain_accepted, false);
  assert.equal(profile.stage_run_state_machine.file_presence_counts_as_stage_complete, false);
  assert.equal(profile.stage_run_state_machine.latest_json_counts_as_domain_accepted, false);
  assert.equal(profile.stage_run_state_machine.read_model_counts_as_transition_authority, false);

  assert.equal(oplRefs.owner, 'one-person-lab');
  assert.equal(oplRefs.domain_repo_role, 'consumer_profile_ref_only');
  assert.equal(oplRefs.repo_local_file_required, false);
  assert.equal(oplRefs.local_resolution_policy, 'do_not_copy_opl_framework_contracts_into_domain_repo');
  assert.deepEqual(oplRefs.refs, [
    'contracts/opl-framework/stage-run-kernel-contract.json',
    'contracts/opl-framework/stage-manifest.schema.json',
    'contracts/opl-framework/role-artifact-ref.schema.json',
    'contracts/opl-framework/stage-owner-receipt.schema.json',
    'contracts/opl-framework/stage-typed-blocker.schema.json',
  ]);

  assert.deepEqual(profile.domain_authority_retained, [
    'visual_truth',
    'layout_review_verdict',
    'export_verdict',
    'artifact_mutation_authority',
    'visual_memory_accept_reject',
    'owner_receipt',
    'typed_blocker',
  ]);
  assert.equal(profile.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(profile.authority_boundary.opl_can_mutate_artifact_body, false);
  assert.equal(profile.authority_boundary.opl_can_sign_domain_owner_receipt, false);
  assert.equal(profile.authority_boundary.opl_can_create_typed_blocker, false);
  assert.equal(profile.authority_boundary.opl_can_authorize_quality_or_export, false);

  assert.equal(overclaimBoundary.boundary_id, 'rca_stage_run_overclaim_boundary.v1');
  assert.equal(overclaimBoundary.controlled_canary_evidence_scope, 'controlled_fixture_not_live_domain_progress');
  assert.deepEqual(overclaimBoundary.claims_allowed, [
    'controlled_fixture_trace_shape_present',
    'refs_only_stage_run_assets_followable',
    'owner_receipt_or_typed_blocker_closeout_shape_present',
    'legacy_runtime_residue_guard_declared',
  ]);
  assert.deepEqual(overclaimBoundary.claims_forbidden, [
    'live_domain_progress',
    'visual_ready',
    'exportable',
    'handoffable',
    'domain_ready',
    'production_ready',
    'production_visual_stage_long_soak_complete',
  ]);
  assert.equal(overclaimBoundary.provider_completion_counts_as_claim, false);
  assert.equal(overclaimBoundary.render_success_counts_as_claim, false);
  assert.equal(overclaimBoundary.conformance_pass_counts_as_claim, false);
  assert.equal(overclaimBoundary.operator_summary_can_upgrade_claims, false);
  assert.equal(overclaimBoundary.docs_or_readme_can_upgrade_claims, false);

  assert.equal(canary.canary_id, 'rca_visual_stage_run_canary.v1');
  assert.equal(canary.controlled_evidence_ref, 'contracts/stage_run_canary_evidence.json');
  assert.deepEqual(canary.ordered_domain_events, [
    'visual_direction_candidates',
    'grounded_reflection',
    'comparative_selection',
    'evolution_and_revision',
    'meta_review_learning',
    'independent_quality_gate',
    'owner_receipt_or_typed_blocker_closeout',
  ]);
  assert.deepEqual(canary.required_role_artifacts, expectedRoleArtifactRefKeys);
  assert.deepEqual(canary.closure_policy.success_requires, [
    'rca_owner_receipt_ref',
    'independent_quality_gate_ref',
    'export_gate_ref',
  ]);
  assert.equal(canary.closure_policy.provider_completion_counts_as_success, false);
  assert.equal(canary.closure_policy.render_success_counts_as_visual_verdict, false);
  assert.equal(canary.closure_policy.wrapper_currentness_counts_as_stage_progress, false);
  assert.equal(canary.closure_policy.conformance_pass_counts_as_closeout, false);
  assert.equal(canary.tool_and_render_boundary.tool_refs_are_affordances, true);
  assert.equal(canary.tool_and_render_boundary.render_refs_are_affordances, true);
  assert.equal(canary.tool_and_render_boundary.hardcoded_workflow_from_tool_catalog_allowed, false);

  assert.equal(residueGuard.guard_id, 'rca_stage_run_legacy_runtime_residue_guard.v1');
  assert.equal(residueGuard.state, 'active_guard');
  assert.deepEqual(residueGuard.guard_scope, [
    'repo_local_sidecar_owner',
    'repo_local_session_supervision_owner',
    'repo_local_runner_owner',
    'repo_local_session_store_owner',
    'repo_local_status_shell_owner',
    'repo_local_workbench_wrapper_owner',
  ]);
  assert.equal(residueGuard.default_runtime_owner, 'one-person-lab');
  assert.equal(residueGuard.repo_local_stage_run_runtime_owner_allowed, false);
  assert.equal(residueGuard.repo_local_session_store_owner_allowed, false);
  assert.equal(residueGuard.repo_local_status_workbench_owner_allowed, false);
  assert.equal(residueGuard.artifact_gallery_owner_allowed, false);
  assert.equal(residueGuard.review_repair_transport_owner_allowed, false);

  assert.equal(operatorSummary.summary_ref, 'operator-summary-ref:controlled-canary:rca:visual_direction:attempt-001');
  assert.equal(operatorSummary.summary_subject_ref, canary.controlled_evidence_ref);
  assert.equal(operatorSummary.summary_scope, 'stage_run_asset_refs_and_closeout_shape_only');
  assert.deepEqual(operatorSummary.must_say, [
    'controlled_fixture_not_live_domain_progress',
    'owner_receipt_or_typed_blocker_closeout_required',
    'tool_and_render_refs_are_affordance_or_evidence_refs',
    'legacy_runtime_residue_is_not_active_runtime_owner',
  ]);
  assert.deepEqual(operatorSummary.must_not_say, overclaimBoundary.claims_forbidden);
  assert.equal(operatorSummary.operator_can_follow_assets, true);
  assert.equal(operatorSummary.operator_can_infer_live_progress, false);
  assert.equal(operatorSummary.operator_can_upgrade_claims, false);
});

test('controlled visual StageRun canary evidence locks refs-only closeout shape', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const evidence = readJson(profile.visual_stage_run_canary.controlled_evidence_ref);

  assert.equal(evidence.surface_kind, 'opl_stage_run_controlled_canary_evidence');
  assert.equal(evidence.version, 'stage-run-controlled-canary.v1');
  assert.equal(evidence.domain_id, 'redcube-ai');
  assert.equal(evidence.canary_id, profile.visual_stage_run_canary.canary_id);
  assert.equal(evidence.stage_id, 'visual_direction');
  assert.equal(evidence.evidence_scope, 'controlled_fixture_not_live_domain_progress');
  assertNonEmptyString(evidence.stage_run_ref, 'stage_run_ref');
  assertNonEmptyString(evidence.stage_manifest_ref, 'stage_manifest_ref');
  assertNonEmptyString(evidence.current_pointer_ref, 'current_pointer_ref');

  assert.deepEqual(Object.keys(evidence.strategy_trace), requiredStrategyTraceKeys);
  for (const key of requiredStrategyTraceKeys) {
    assertRefs(evidence.strategy_trace[key].refs, `strategy_trace.${key}.refs`);
  }

  assert.deepEqual(Object.keys(evidence.role_artifact_refs), expectedRoleArtifactRefKeys);
  for (const key of expectedRoleArtifactRefKeys) {
    assertNonEmptyString(evidence.role_artifact_refs[key], `role_artifact_refs.${key}`);
  }

  assert.equal(evidence.asset_follow_audit.audit_id, 'rca_visual_stage_run_canary_asset_follow_audit.v1');
  assert.equal(
    evidence.asset_follow_audit.operator_summary_ref,
    'operator-summary-ref:controlled-canary:rca:visual_direction:attempt-001',
  );
  assert.equal(evidence.asset_follow_audit.summary_scope, 'stage_run_asset_refs_and_closeout_shape_only');
  assert.deepEqual(evidence.asset_follow_audit.required_followable_refs, [
    'stage_run_ref',
    'stage_manifest_ref',
    'current_pointer_ref',
    'candidate_pool_ref',
    'reflection_review_ref',
    'ranking_selection_ref',
    'revision_lineage_ref',
    'meta_review_ref',
    'independent_gate_ref',
    'owner_receipt_or_typed_blocker_ref',
  ]);
  assert.equal(evidence.asset_follow_audit.asset_body_included, false);
  assert.equal(evidence.asset_follow_audit.artifact_body_included, false);
  assert.equal(evidence.asset_follow_audit.visual_truth_body_included, false);
  assert.equal(evidence.asset_follow_audit.review_verdict_body_included, false);
  assert.equal(evidence.asset_follow_audit.export_verdict_body_included, false);
  assert.equal(evidence.asset_follow_audit.owner_receipt_body_included, false);
  assert.equal(evidence.asset_follow_audit.typed_blocker_body_included, false);
  assert.equal(evidence.asset_follow_audit.operator_can_follow_asset_refs, true);
  assert.equal(evidence.asset_follow_audit.operator_summary_can_claim_live_progress, false);
  assert.equal(evidence.asset_follow_audit.operator_summary_can_claim_visual_ready, false);
  assert.equal(evidence.asset_follow_audit.operator_summary_can_claim_exportable, false);

  assert.equal(
    evidence.strategy_trace.candidate_generation.refs.includes(evidence.role_artifact_refs.candidate_pool_ref),
    true,
  );
  assert.equal(
    evidence.strategy_trace.grounded_reflection.refs.includes(evidence.role_artifact_refs.reflection_review_ref),
    true,
  );
  assert.equal(
    evidence.strategy_trace.comparative_selection.refs.includes(evidence.role_artifact_refs.ranking_selection_ref),
    true,
  );
  assert.equal(
    evidence.strategy_trace.evolution_and_revision.refs.includes(evidence.role_artifact_refs.revision_lineage_ref),
    true,
  );
  assert.equal(
    evidence.strategy_trace.meta_review_learning.refs.includes(evidence.role_artifact_refs.meta_review_ref),
    true,
  );
  assert.equal(
    evidence.strategy_trace.independent_quality_gate.refs.includes(evidence.role_artifact_refs.independent_gate_ref),
    true,
  );

  assert.equal(['owner_receipt', 'typed_blocker'].includes(evidence.closeout.terminal_outcome), true);
  assert.equal(
    Boolean(evidence.closeout.owner_receipt_ref || evidence.closeout.typed_blocker_ref),
    true,
  );
  assert.equal(evidence.closeout.same_attempt_self_review, false);

  assert.deepEqual(evidence.authority_boundary, {
    refs_only: true,
    controlled_canary_claims_live_domain_progress: false,
    provider_completion_counts_as_closeout: false,
    file_presence_counts_as_closeout: false,
    read_model_counts_as_closeout: false,
    conformance_pass_counts_as_closeout: false,
    opl_can_write_domain_truth: false,
    opl_can_mutate_artifact_body: false,
    opl_can_sign_owner_receipt: false,
    opl_can_create_typed_blocker: false,
    opl_can_authorize_quality_or_export: false,
  });
  assert.equal(evidence.tool_and_render_boundary.tool_refs_are_affordance_refs, true);
  assert.equal(evidence.tool_and_render_boundary.render_refs_are_evidence_refs, true);
  assert.equal(evidence.tool_and_render_boundary.render_refs_can_authorize_visual_quality, false);
  assert.equal(evidence.tool_and_render_boundary.export_gate_ref_can_authorize_export, false);
  assert.deepEqual(evidence.overclaim_boundary.claims_allowed, [
    'controlled_fixture_trace_shape_present',
    'refs_only_asset_follow_audit_present',
    'owner_receipt_or_typed_blocker_closeout_shape_present',
  ]);
  assert.deepEqual(evidence.overclaim_boundary.claims_forbidden, [
    'live_domain_progress',
    'visual_ready',
    'exportable',
    'handoffable',
    'domain_ready',
    'production_ready',
    'production_visual_stage_long_soak_complete',
  ]);
  assert.equal(evidence.overclaim_boundary.provider_completion_counts_as_claim, false);
  assert.equal(evidence.overclaim_boundary.render_success_counts_as_claim, false);
  assert.equal(evidence.overclaim_boundary.conformance_pass_counts_as_claim, false);
  assert.equal(evidence.overclaim_boundary.operator_summary_can_upgrade_claims, false);
  assertNoForbiddenBodyFields(evidence);
});

test('RCA owner-chain live progress evidence exposes accepted refs without readiness overclaim', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const evidence = readJson('contracts/owner_chain_live_progress_evidence.json');
  const liveProgress = readJson('contracts/live_stage_run_progress_evidence.json');

  assert.equal(profile.owner_chain_live_progress_evidence_ref, 'contracts/owner_chain_live_progress_evidence.json');
  assert.equal(profile.live_stage_run_progress_evidence_ref, 'contracts/live_stage_run_progress_evidence.json');
  assert.equal(evidence.surface_kind, 'rca_owner_chain_live_progress_evidence');
  assert.equal(evidence.version, 'owner-chain-live-progress-evidence.v1');
  assert.equal(evidence.domain_id, 'redcube-ai');
  assert.equal(evidence.owner, 'redcube_ai');
  assert.equal(evidence.evidence_scope, 'live_owner_chain_progress_refs_only');
  assert.equal(evidence.controlled_fixture_ref, profile.visual_stage_run_canary.controlled_evidence_ref);
  assert.equal(evidence.controlled_fixture_is_live_progress, false);
  assert.equal(evidence.repository_boundary.repo_tracks_live_artifacts, false);
  assert.equal(evidence.repository_boundary.repo_tracks_live_receipt_instances, false);
  assert.equal(evidence.repository_boundary.repo_tracks_evidence_ref_shapes, true);

  assert.deepEqual(evidence.owner_chain_stages.map((stage) => stage.stage_id), [
    'visual_direction',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
    'no_regression_closeout',
  ]);
  assert.deepEqual(evidence.accepted_ref_shapes.required_ref_groups, [
    'domain_owner_receipt_refs',
    'typed_blocker_refs',
    'review_export_receipt_refs',
    'no_regression_evidence_refs',
  ]);
  assert.equal(liveProgress.surface_kind, 'rca_live_stage_run_progress_evidence');
  assert.equal(liveProgress.version, 'live-stage-run-progress-evidence.v1');
  assert.equal(liveProgress.source_contract_refs.owner_chain_input_ref, profile.owner_chain_live_progress_evidence_ref);
  assert.deepEqual(Object.keys(liveProgress.refs), [
    'owner_receipt_refs',
    'typed_blocker_refs',
    'human_gate_refs',
    'quality_or_export_receipt_refs',
    'no_regression_refs',
    'long_soak_refs',
  ]);
  assert.equal(liveProgress.refs.typed_blocker_refs.includes('rca-typed-blocker:review-export:human-ready-export-handoff-pending'), true);
  assert.equal(liveProgress.refs.human_gate_refs.includes('human_gate:redcube_operator_review_gate'), true);
  assert.equal(liveProgress.refs.quality_or_export_receipt_refs.includes('rca-review-export:ppt_deck:export_pptx:deck-owner-chain'), true);
  assert.equal(liveProgress.refs.long_soak_refs.includes('rca-typed-blocker:controlled-soak:temporal-long-soak-pending'), true);
  assert.equal(liveProgress.progress_entries.some((entry) => (
    entry.entry_id === 'human_ready_export_handoff'
    && entry.status === 'blocked_by_domain_owned_typed_blocker'
    && entry.refs.typed_blocker_refs.includes('rca-typed-blocker:review-export:human-ready-export-handoff-pending')
  )), true);
  assert.equal(liveProgress.authority_boundary.opl_can_issue_rca_owner_receipt, false);
  assert.equal(liveProgress.authority_boundary.opl_can_create_rca_typed_blocker, false);
  assert.equal(liveProgress.authority_boundary.opl_can_authorize_review_export, false);
  assert.equal(liveProgress.authority_boundary.declares_visual_ready, false);
  assert.equal(liveProgress.authority_boundary.declares_exportable, false);
  assert.equal(liveProgress.authority_boundary.declares_handoffable, false);
  assert.equal(liveProgress.authority_boundary.declares_production_visual_stage_long_soak_complete, false);
  assertNoForbiddenBodyFields(liveProgress);
  assert.deepEqual(evidence.accepted_ref_shapes.domain_owner_receipt_refs, [
    'rca-owner-receipt:visual-stage:<receipt-id>',
    'rca-owner-receipt:review-export:<family>:<route-stage-id>:<deliverable-id>',
  ]);
  assert.deepEqual(evidence.accepted_ref_shapes.typed_blocker_refs, [
    'rca-typed-blocker:review-export:<family>:<route-stage-id>:<deliverable-id>',
    'rca-typed-blocker:controlled-soak:<blocker-id>',
  ]);
  assert.deepEqual(evidence.accepted_ref_shapes.review_export_receipt_refs, [
    'rca-review-export:<family>:visual_director_review:<deliverable-id>',
    'rca-review-export:<family>:screenshot_review:<deliverable-id>',
    'rca-review-export:<family>:export_pptx:<deliverable-id>',
  ]);
  assert.deepEqual(evidence.accepted_ref_shapes.no_regression_evidence_refs, [
    'rca-no-regression:visual-stage:<evidence-id>',
    'rca-no-regression:external-work-order:<work-order-id>',
  ]);

  assert.deepEqual(evidence.accepted_return_shapes, [
    'domain_receipt',
    'typed_blocker',
    'no_regression_evidence',
  ]);
  assert.equal(
    evidence.progress_readout.current_status,
    'mock_safe_visual_owner_chain_canary_recorded_live_provider_evidence_open',
  );
  assert.equal(evidence.progress_readout.live_progress_claimed, true);
  assert.equal(evidence.progress_readout.artifact_generation_run, true);
  assert.equal(evidence.progress_readout.mock_safe_artifact_generation_run, true);
  assert.equal(evidence.progress_readout.image_api_called, false);
  assert.equal(evidence.progress_readout.repo_tracks_workspace_artifacts, false);
  assert.equal(evidence.progress_readout.visual_ready_claimed, false);
  assert.equal(evidence.progress_readout.production_ready_claimed, false);

  assert.deepEqual(evidence.false_authority_flags, {
    declares_visual_ready: false,
    declares_exportable: false,
    declares_handoffable: false,
    declares_domain_ready: false,
    declares_production_ready: false,
    declares_production_visual_stage_long_soak_complete: false,
    provider_completion_counts_as_visual_progress: false,
    conformance_pass_counts_as_live_progress: false,
    controlled_canary_counts_as_live_progress: false,
    mock_safe_canary_counts_as_production_progress: false,
    writes_visual_truth: false,
    writes_artifact_body: false,
    writes_memory_body: false,
    writes_review_export_verdict_body: false,
  });
  assert.equal(evidence.opl_hosted_path_boundary.opl_can_store_owner_chain_refs, true);
  assert.equal(evidence.opl_hosted_path_boundary.opl_can_write_rca_visual_truth, false);
  assert.equal(evidence.opl_hosted_path_boundary.opl_can_issue_rca_owner_receipt, false);
  assert.equal(evidence.opl_hosted_path_boundary.opl_can_authorize_review_export, false);
  assert.equal(evidence.opl_hosted_path_boundary.opl_can_claim_visual_or_production_ready, false);
  assertNoForbiddenBodyFields(evidence);
});
