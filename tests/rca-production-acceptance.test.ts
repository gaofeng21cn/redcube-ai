// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const acceptancePath = 'contracts/production_acceptance/rca-production-acceptance.json';
const evidenceFixturePath = 'contracts/production_acceptance/rca-evidence-receipt-fixture.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function collectKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectKeys(entry, `${prefix}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, entry]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return [current, ...collectKeys(entry, current)];
  });
}

function assertRefString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
  assert.equal(value.startsWith('/'), false, `${label} must be a portable ref, not an absolute path`);
  assert.equal(value.includes('\n'), false, label);
}

function assertRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  for (const [index, value] of values.entries()) {
    assertRefString(value, `${label}[${index}]`);
  }
}

test('RCA production acceptance surface exists and records domain-owned scope', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, acceptancePath)), true);
  const acceptance = readJson(acceptancePath);

  assert.equal(acceptance.surface_kind, 'rca_domain_owned_visual_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'redcube_ai');
  assert.equal(acceptance.owner, 'redcube_ai');
  assert.equal(acceptance.acceptance_scope, 'domain_owned_visual_export_acceptance_evidence');
  assert.equal(acceptance.repository_boundary.repo_tracks_acceptance_surface, true);
  assert.equal(acceptance.repository_boundary.repo_tracks_evidence_refs_only, true);
  assert.equal(acceptance.repository_boundary.repo_tracks_visual_artifact_blobs, false);
  assert.equal(acceptance.repository_boundary.repo_tracks_export_artifact_blobs, false);
  assert.equal(acceptance.repository_boundary.repo_tracks_live_receipt_instances, false);
});

test('RCA production acceptance records conformance as passed without authorizing visual readiness', () => {
  const acceptance = readJson(acceptancePath);
  const conformance = acceptance.structural_conformance;

  assert.equal(conformance.opl_family_structural_conformance_status, 'passed');
  assert.equal(conformance.physical_source_morphology_status, 'passed');
  assert.equal(conformance.structural_conformance_claimed, true);
  assert.equal(conformance.physical_conformance_claimed, true);
  assert.equal(conformance.visual_or_export_ready_claimed_by_conformance, false);
  assert.equal(conformance.domain_ready_claimed_by_conformance, false);
  assertRefArray(conformance.conformance_refs, 'structural_conformance.conformance_refs');
});

test('OPL and provider completion cannot authorize RCA visual, export, or domain ready', () => {
  const acceptance = readJson(acceptancePath);
  const boundary = acceptance.authority_boundary;
  const forbidden = acceptance.forbidden_claims;

  assert.equal(boundary.visual_export_readiness_owner, 'redcube_ai');
  assert.equal(boundary.domain_ready_owner, 'redcube_ai');
  assert.equal(boundary.opl_role, 'generated_hosted_shell_and_refs_only_projection_consumer');
  assert.equal(boundary.provider_role, 'stage_attempt_executor_or_runtime_substrate');
  for (const key of [
    'opl_can_authorize_visual_ready',
    'opl_can_authorize_exportable',
    'opl_can_authorize_handoffable',
    'opl_can_authorize_domain_ready',
    'provider_completion_is_visual_ready',
    'provider_completion_is_exportable',
    'provider_completion_is_domain_ready',
    'conformance_pass_is_visual_ready',
    'conformance_pass_is_exportable',
    'conformance_pass_is_domain_ready',
  ]) {
    assert.equal(boundary[key], false, key);
  }
  for (const [key, value] of Object.entries(forbidden)) {
    assert.equal(value, false, key);
  }
});

test('RCA acceptance chain is refs-only and requires owner, artifact, and review/export refs', () => {
  const acceptance = readJson(acceptancePath);
  const chain = acceptance.visual_artifact_receipt_chain;

  assert.equal(chain.chain_status, 'present_refs_only');
  assert.equal(chain.chain_kind, 'visual_artifact_producing_receipt_chain');
  assert.deepEqual(chain.required_ref_groups, [
    'visual_owner_receipt_refs',
    'artifact_receipt_refs',
    'review_export_gate_refs',
    'workspace_receipt_scaleout_refs',
    'visual_memory_body_reuse_refs',
    'repeated_no_regression_evidence_refs',
    'naming_tombstone_follow_through_refs',
  ]);
  assertRefArray(chain.visual_owner_receipt_refs, 'visual_owner_receipt_refs');
  assertRefString(chain.evidence_receipt_fixture_ref, 'evidence_receipt_fixture_ref');
  assert.equal(fs.existsSync(path.join(repoRoot, chain.evidence_receipt_fixture_ref)), true);
  assertRefArray(chain.artifact_receipt_refs, 'artifact_receipt_refs');
  assertRefArray(chain.review_export_gate_refs, 'review_export_gate_refs');
  assertRefArray(chain.memory_and_lifecycle_receipt_refs, 'memory_and_lifecycle_receipt_refs');
  assertRefArray(chain.provider_attempt_refs, 'provider_attempt_refs');
  assert.equal(chain.chain_is_artifact_producing, true);
  assert.equal(chain.chain_contains_artifact_blob, false);
  assert.equal(chain.chain_declares_visual_ready, false);
  assert.equal(chain.chain_declares_exportable, false);
  assert.equal(chain.chain_declares_handoffable, false);

  const serialized = JSON.stringify(chain);
  for (const forbiddenToken of [
    'canonical_artifact_blob',
    'artifact_body',
    'visual_truth_body',
    'review_export_verdict_body',
  ]) {
    assert.equal(serialized.includes(forbiddenToken), false, forbiddenToken);
  }
});

test('RCA production acceptance records visual evidence scaleout refs without moving verdict authority to OPL', () => {
  const acceptance = readJson(acceptancePath);
  const scaleout = acceptance.production_evidence_scaleout_refs;

  assert.equal(scaleout.surface_kind, 'rca_visual_production_evidence_scaleout_refs');
  assert.equal(scaleout.owner, 'redcube_ai');
  assert.equal(scaleout.status, 'refs_landed_scaleout_runtime_evidence_pending');
  assert.equal(scaleout.evidence_model, 'refs_only_no_visual_truth_artifact_blob_or_memory_body');
  assert.equal(scaleout.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.deepEqual(scaleout.selected_artifact_producing_visual_route, {
    deliverable_family: 'ppt_deck',
    route_id: 'ppt_deck.image_first.artifact_producing.v1',
    route_ref: 'redcube product manifest#/ppt_deck_visual_route_truth',
    route_kind: 'image_first_ppt_artifact_route',
    stage_sequence_refs: [
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ],
    produces_artifact_refs: true,
    selected_for_evidence_scaleout: true,
    html_or_native_route_selected: false,
    visual_verdict_owner: 'redcube_ai',
    artifact_authority_owner: 'redcube_ai',
  });
  assert.deepEqual(scaleout.required_evidence_ref_groups, [
    'artifact_producing_owner_receipt',
    'workspace_receipt_scaleout',
    'visual_memory_body_reuse',
    'repeated_no_regression_evidence',
    'naming_tombstone_follow_through',
  ]);

  assert.equal(scaleout.owner_receipt_refs.status, 'artifact_producing_owner_receipt_ref_closed');
  assertRefString(scaleout.owner_receipt_refs.receipt_ref, 'production_evidence_scaleout_refs.owner_receipt_refs.receipt_ref');
  assertRefString(scaleout.owner_receipt_refs.actual_workspace_receipt_ref, 'production_evidence_scaleout_refs.owner_receipt_refs.actual_workspace_receipt_ref');
  assertRefString(scaleout.owner_receipt_refs.contract_ref, 'production_evidence_scaleout_refs.owner_receipt_refs.contract_ref');
  assert.equal(scaleout.owner_receipt_refs.visual_readiness_claimed, false);
  assert.equal(scaleout.owner_receipt_refs.export_readiness_claimed, false);
  assert.deepEqual(scaleout.domain_owner_receipt_refs, [
    'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
    'rca-owner-receipt:visual-stage:production-evidence-tail-ppt-image-first-domain-owner',
  ]);
  assert.deepEqual(scaleout.domain_receipt_refs, scaleout.domain_owner_receipt_refs);
  assert.deepEqual(scaleout.no_regression_evidence_refs, scaleout.repeated_no_regression_evidence_refs.evidence_refs);
  assert.deepEqual(scaleout.no_regression_refs, scaleout.no_regression_evidence_refs);
  assert.deepEqual(scaleout.typed_blocker_refs, [
    'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
    'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
    'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
  ]);
  assert.equal(scaleout.owner_chain_refs.includes(evidenceFixturePath), true);
  assert.deepEqual(scaleout.required_return_shapes, [
    'domain_owner_receipt_ref',
    'no_regression_evidence_ref',
    'owner_chain_ref',
    'typed_blocker_ref',
  ]);
  assert.equal(
    scaleout.payload_path_policy,
    'operator_must_choose_success_refs_path_or_domain_owned_typed_blocker_path_empty_template_blocks',
  );
  assert.deepEqual(
    scaleout.accepted_payload_paths.success_refs_path.required_any_operator_payload_refs,
    [
      'domain_owner_receipt_refs',
      'no_regression_evidence_refs',
      'owner_chain_refs',
    ],
  );
  assert.equal(scaleout.accepted_payload_paths.success_refs_path.closes_domain_ready, false);
  assert.deepEqual(
    scaleout.accepted_payload_paths.typed_blocker_path.required_operator_payload_refs,
    ['typed_blocker_refs'],
  );
  assert.equal(scaleout.accepted_payload_paths.typed_blocker_path.success_claimed, false);
  assert.deepEqual(scaleout.legacy_payload_field_aliases, {
    domain_receipt_refs: 'domain_owner_receipt_refs',
    no_regression_refs: 'no_regression_evidence_refs',
  });

  assert.equal(
    scaleout.workspace_receipt_scaleout_refs.status,
    'scaleout_ref_model_landed_more_workspaces_pending',
  );
  assertRefString(
    scaleout.workspace_receipt_scaleout_refs.workspace_receipt_inventory_ref,
    'workspace_receipt_scaleout_refs.workspace_receipt_inventory_ref',
  );
  assert.equal(scaleout.workspace_receipt_scaleout_refs.workspace_receipt_proof_action, 'emit_workspace_receipt_proof');
  assert.equal(
    scaleout.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.route_id,
    'ppt_deck.image_first.artifact_producing.v1',
  );
  assertRefString(
    scaleout.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.artifact_producing_owner_receipt_ref,
    'workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.artifact_producing_owner_receipt_ref',
  );
  assertRefString(
    scaleout.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.review_export_verdict_ref,
    'workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.review_export_verdict_ref',
  );
  assertRefArray(
    scaleout.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.memory_lifecycle_receipt_refs,
    'workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.memory_lifecycle_receipt_refs',
  );
  assert.equal(scaleout.workspace_receipt_scaleout_refs.required_workspace_count_for_scaleout, 2);
  assert.equal(scaleout.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed, false);
  assert.equal(scaleout.workspace_receipt_scaleout_refs.emits_owner_receipt_ref, true);
  assert.equal(scaleout.workspace_receipt_scaleout_refs.emits_memory_receipt_refs, true);
  assert.equal(scaleout.workspace_receipt_scaleout_refs.emits_no_regression_evidence_ref, true);
  assert.equal(scaleout.workspace_receipt_scaleout_refs.declares_production_soak_complete, false);

  assert.equal(scaleout.visual_memory_body_reuse_refs.status, 'body_external_reuse_ref_landed');
  assertRefString(scaleout.visual_memory_body_reuse_refs.memory_locator_ref, 'visual_memory_body_reuse_refs.memory_locator_ref');
  assertRefString(scaleout.visual_memory_body_reuse_refs.consumed_memory_ref, 'visual_memory_body_reuse_refs.consumed_memory_ref');
  assertRefString(scaleout.visual_memory_body_reuse_refs.memory_content_body_ref, 'visual_memory_body_reuse_refs.memory_content_body_ref');
  assert.equal(scaleout.visual_memory_body_reuse_refs.memory_body_projected_to_opl, false);
  assert.equal(scaleout.visual_memory_body_reuse_refs.contains_memory_body, false);
  assert.equal(
    scaleout.visual_memory_body_reuse_refs.reuse_ref_scope,
    'visual_pattern_memory_locator_and_content_ref_only',
  );

  assert.equal(scaleout.repeated_no_regression_evidence_refs.status, 'repeated_refs_available_not_production_soak');
  assert.equal(scaleout.repeated_no_regression_evidence_refs.generator_action, 'emit_no_regression_evidence');
  assertRefArray(scaleout.repeated_no_regression_evidence_refs.evidence_refs, 'repeated_no_regression_evidence_refs.evidence_refs');
  assert.equal(scaleout.repeated_no_regression_evidence_refs.evidence_refs.length >= 2, true);
  assert.deepEqual(scaleout.repeated_no_regression_evidence_refs.deliverable_family_refs, [
    'ppt_deck',
    'xiaohongshu',
  ]);
  assert.equal(scaleout.repeated_no_regression_evidence_refs.evidence_cadence, 'repeated_family_refs_only');
  assert.equal(scaleout.repeated_no_regression_evidence_refs.repeated_no_regression_claimed_as_soak, false);

  assert.equal(scaleout.review_export_verdict_refs.status, 'review_export_refs_routed_through_artifact_producing_route');
  assert.equal(scaleout.review_export_verdict_refs.route_id, 'ppt_deck.image_first.artifact_producing.v1');
  assertRefString(scaleout.review_export_verdict_refs.actual_workspace_review_export_ref, 'review_export_verdict_refs.actual_workspace_review_export_ref');
  assert.equal(scaleout.review_export_verdict_refs.verdict_body_projected_to_opl, false);

  assert.equal(
    scaleout.naming_tombstone_follow_through_refs.status,
    'tombstone_follow_through_refs_landed_no_compatibility_alias',
  );
  assert.equal(scaleout.naming_tombstone_follow_through_refs.active_caller_compatibility_alias_restored, false);
  assertRefArray(scaleout.naming_tombstone_follow_through_refs.tombstone_refs, 'naming_tombstone_follow_through_refs.tombstone_refs');
  assert.equal(
    scaleout.naming_tombstone_follow_through_refs.forbidden_active_occurrence_classes.includes('compatibility_alias'),
    true,
  );

  assert.equal(scaleout.authority_boundary.opl_can_store_projection_refs, true);
  assert.equal(scaleout.authority_boundary.opl_can_write_rca_visual_truth, false);
  assert.equal(scaleout.authority_boundary.opl_can_store_artifact_blob, false);
  assert.equal(scaleout.authority_boundary.opl_can_store_memory_body, false);
  assert.equal(scaleout.authority_boundary.opl_can_authorize_review_export_verdict, false);
  assert.equal(scaleout.authority_boundary.opl_can_claim_production_soak_complete, false);
});

test('RCA production acceptance exposes body-free OPL expected receipt and monitor freshness refs', () => {
  const acceptance = readJson(acceptancePath);
  const handoff = acceptance.opl_expected_receipt_monitor_freshness_handoff;

  assert.equal(handoff.surface_kind, 'rca_opl_expected_receipt_monitor_freshness_handoff');
  assert.equal(handoff.owner, 'redcube_ai');
  assert.equal(handoff.consumer, 'one_person_lab');
  assert.equal(handoff.status, 'body_free_refs_ready_for_opl_workorder');
  assert.equal(handoff.handoff_scope, 'opl_expected_receipt_and_monitor_freshness_backfill');
  assert.equal(handoff.evidence_model, 'refs_only_no_visual_truth_artifact_blob_memory_body_or_review_verdict_body');
  assert.equal(handoff.evidence_receipt_fixture_ref, evidenceFixturePath);
  assertRefString(
    handoff.source_projection_refs.operator_evidence_readiness_projection_ref,
    'handoff.source_projection_refs.operator_evidence_readiness_projection_ref',
  );
  assertRefString(
    handoff.source_projection_refs.production_evidence_scaleout_refs_ref,
    'handoff.source_projection_refs.production_evidence_scaleout_refs_ref',
  );

  assert.equal(handoff.body_free_owner_receipt_ref.expected_receipt_slot, 'artifact_producing_owner_receipt');
  assert.equal(handoff.body_free_owner_receipt_ref.receipt_ref, acceptance.production_evidence_scaleout_refs.owner_receipt_refs.receipt_ref);
  assert.equal(handoff.body_free_owner_receipt_ref.payload_body_included, false);
  assert.equal(handoff.body_free_owner_receipt_ref.visual_readiness_claimed, false);
  assert.equal(handoff.body_free_owner_receipt_ref.export_readiness_claimed, false);

  assert.equal(handoff.body_free_workspace_receipt_ref.expected_receipt_slot, 'workspace_receipt');
  assert.equal(handoff.body_free_workspace_receipt_ref.workspace_receipt_proof_action, 'emit_workspace_receipt_proof');
  assert.equal(handoff.body_free_workspace_receipt_ref.workspace_receipt_scaleout_claimed, false);
  assertRefString(
    handoff.body_free_workspace_receipt_ref.workspace_receipt_proof_ref_model,
    'body_free_workspace_receipt_ref.workspace_receipt_proof_ref_model',
  );

  assert.equal(handoff.body_free_visual_memory_reuse_ref.expected_receipt_slot, 'visual_memory_reuse_ref');
  assertRefString(handoff.body_free_visual_memory_reuse_ref.memory_locator_ref, 'body_free_visual_memory_reuse_ref.memory_locator_ref');
  assertRefString(handoff.body_free_visual_memory_reuse_ref.consumed_memory_ref, 'body_free_visual_memory_reuse_ref.consumed_memory_ref');
  assertRefString(handoff.body_free_visual_memory_reuse_ref.memory_content_body_ref, 'body_free_visual_memory_reuse_ref.memory_content_body_ref');
  assert.equal(handoff.body_free_visual_memory_reuse_ref.memory_body_projected_to_opl, false);
  assert.equal(handoff.body_free_visual_memory_reuse_ref.payload_body_included, false);

  assert.equal(handoff.body_free_repeated_no_regression_refs.expected_receipt_slot, 'repeated_no_regression_evidence');
  assertRefArray(handoff.body_free_repeated_no_regression_refs.evidence_refs, 'body_free_repeated_no_regression_refs.evidence_refs');
  assert.deepEqual(handoff.body_free_repeated_no_regression_refs.deliverable_family_refs, ['ppt_deck', 'xiaohongshu']);
  assert.equal(handoff.body_free_repeated_no_regression_refs.repeated_no_regression_claimed_as_soak, false);

  assert.equal(handoff.monitor_freshness_backfill_refs.monitor_surface_ref, 'redcube product manifest#/workspace_receipt_inventory_projection');
  assert.equal(handoff.monitor_freshness_backfill_refs.monitor_freshness_payload_body_required, false);
  assert.equal(handoff.monitor_freshness_backfill_refs.production_soak_claimed, false);

  assert.deepEqual(handoff.typed_blocker_backfill_refs.blocker_refs, [
    'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
    'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
    'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
  ]);
  assert.equal(handoff.typed_blocker_backfill_refs.blocker_owner, 'redcube_ai');
  assert.equal(handoff.typed_blocker_backfill_refs.payload_body_included, false);

  assert.equal(handoff.opl_payload_policy.payload_kind, 'stage_production_evidence_receipt_record_body_free_refs');
  assert.equal(handoff.opl_payload_policy.payload_body_required, false);
  assert.equal(handoff.opl_payload_policy.payload_body_allowed, false);
  assert.deepEqual(handoff.opl_payload_policy.allowed_payload_ref_groups, [
    'body_free_owner_receipt_ref',
    'body_free_workspace_receipt_ref',
    'body_free_visual_memory_reuse_ref',
    'body_free_repeated_no_regression_refs',
    'typed_blocker_backfill_refs',
  ]);

  assert.equal(handoff.authority_boundary.opl_can_store_handoff_refs, true);
  assert.equal(handoff.authority_boundary.opl_can_record_expected_receipt_refs, true);
  assert.equal(handoff.authority_boundary.opl_can_record_monitor_freshness_refs, true);
  assert.equal(handoff.authority_boundary.opl_can_write_rca_visual_truth, false);
  assert.equal(handoff.authority_boundary.opl_can_store_artifact_payload, false);
  assert.equal(handoff.authority_boundary.opl_can_store_memory_body, false);
  assert.equal(handoff.authority_boundary.opl_can_authorize_review_export_verdict, false);
  assert.equal(handoff.authority_boundary.opl_can_claim_visual_stage_soak_complete, false);
});

test('RCA production acceptance exposes Agent Lab efficiency handoff refs without moving authority', () => {
  const acceptance = readJson(acceptancePath);
  const handoff = acceptance.efficiency_handoff_projection_refs;

  assert.equal(handoff.surface_kind, 'rca_production_acceptance_efficiency_handoff_projection_refs');
  assert.equal(handoff.work_order_ref, 'oma_developer_patch_work_order_5a1b68cacbd4');
  assert.equal(handoff.owner, 'redcube_ai');
  assert.equal(handoff.consumer, 'opl_agent_lab');
  assert.equal(handoff.projection_ref, 'redcube product manifest#/rca_efficiency_handoff_projection');
  assert.equal(
    handoff.domain_action_adapter_projection_ref,
    'redcube product domain_action_adapter#/mapped_surfaces/rca_efficiency_handoff_projection',
  );
  assert.equal(handoff.contract_ref, 'contracts/production_acceptance/rca-efficiency-handoff-projection.json');
  assert.equal(
    handoff.external_work_order_owner_closeout_ref,
    'redcube product manifest#/domain_owner_receipt_contract/external_work_order_owner_closeout',
  );
  assert.equal(handoff.external_work_order_owner_closeout_action, 'emit_external_work_order_owner_closeout');
  assertRefArray(handoff.runtime_consumption_refs, 'efficiency_handoff_projection_refs.runtime_consumption_refs');
  assert.equal(
    handoff.runtime_consumption_refs.includes('redcube product domain_action_adapter#/mapped_surfaces/external_work_order_owner_closeout'),
    true,
  );
  assertRefArray(handoff.quality_floor_refs, 'efficiency_handoff_projection_refs.quality_floor_refs');
  assert.deepEqual(handoff.target_verification_refs, [
    'target_runtime_consumption_verification_receipt',
    'target_workspace_environment_consumption_receipt',
    'workspace-runtime-ref:review-export:<run-id>',
    'workspace-runtime-ref:export-result:<run-id>',
    'target-verification:redcube-ai/product-manifest-read',
    'target-verification:redcube-ai/domain-action-adapter-export-read',
    'target-verification:redcube-ai/typecheck',
    'target-verification:redcube-ai/test-fast',
    'target-verification:redcube-ai/targeted-efficiency-tests',
  ]);
  assert.equal(handoff.refs_only, true);
  assert.equal(handoff.read_only, true);
  assert.equal(handoff.visual_readiness_claimed, false);
  assert.equal(handoff.export_readiness_claimed, false);
  assert.equal(handoff.handoff_readiness_claimed, false);
  assert.equal(handoff.production_soak_complete_claimed, false);
  assert.equal(handoff.writes_visual_truth, false);
  assert.equal(handoff.writes_artifact_body, false);
  assert.equal(handoff.writes_memory_body, false);
  assert.equal(handoff.authorizes_quality_or_export, false);
});

test('RCA evidence tail is closed only by domain receipt or by typed blocker with next verification refs', () => {
  const acceptance = readJson(acceptancePath);
  const tail = acceptance.evidence_tail;

  assert.deepEqual(tail.allowed_status_values, [
    'closed_by_domain_owned_acceptance_receipt',
    'domain_owned_typed_blocker_with_next_verification_ref',
  ]);
  assert.equal(tail.allowed_status_values.includes(tail.status), true);
  assert.equal(tail.production_live_soak_not_claimed_by_conformance, false);
  assert.equal(tail.domain_ready_not_claimed_by_conformance, false);
  assertRefArray(acceptance.next_verification_command_refs.map((entry) => entry.ref), 'next_verification_command_refs');

  if (tail.status === 'closed_by_domain_owned_acceptance_receipt') {
    assert.equal(tail.typed_blocker, null);
    assert.equal(tail.closure_receipt.owner, 'redcube_ai');
    assert.equal(tail.closure_receipt.return_shape, 'domain_receipt');
    for (const key of [
      'receipt_ref',
      'attempt_ref',
      'artifact_locator_ref',
      'review_export_ref',
      'memory_receipt_ref',
      'lifecycle_receipt_ref',
      'forbidden_write_proof_ref',
      'evidence_receipt_fixture_ref',
    ]) {
      assertRefString(tail.closure_receipt[key], `closure_receipt.${key}`);
    }
    assertRefArray(tail.closure_receipt.artifact_receipt_refs, 'closure_receipt.artifact_receipt_refs');
    return;
  }

  assert.equal(tail.status, 'domain_owned_typed_blocker_with_next_verification_ref');
  assert.equal(tail.closure_receipt, null);
  assert.equal(tail.typed_blocker.owner, 'redcube_ai');
  for (const key of tail.typed_blocker_policy.required_fields) {
    assert.ok(key in tail.typed_blocker, key);
  }
  assertRefArray(tail.typed_blocker.next_verification_command_refs, 'typed_blocker.next_verification_command_refs');
});

test('RCA production acceptance exposes default Temporal-hosted autonomy without claiming long soak', () => {
  const acceptance = readJson(acceptancePath);
  const readiness = acceptance.temporal_autonomy_readiness;

  assert.equal(readiness.surface_kind, 'temporal_autonomy_readiness');
  assert.equal(readiness.readiness_ref, 'redcube product manifest#/temporal_autonomy_readiness');
  assert.equal(readiness.status, 'standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending');
  assert.equal(readiness.provider_owner, 'one-person-lab');
  assert.equal(readiness.provider_kind_required_for_production, 'temporal');
  assert.equal(readiness.can_be_opl_temporal_hosted, true);
  assert.equal(readiness.default_opl_temporal_hosted_autonomy_enabled, true);
  assert.equal(readiness.task_start_handoff_is_persistent_opl_temporal_scheduling, true);
  assert.equal(readiness.codex_app_outer_loop_required_after_task_start, false);
  assert.equal(readiness.long_time_autonomy_claimed, true);
  assert.equal(readiness.production_visual_stage_long_soak_complete, false);
  assert.equal(readiness.rca_owns_generic_daemon_scheduler_attempt_loop, false);
  assert.deepEqual(readiness.required_success_evidence, [
    'temporal_provider_production_residency',
    'provider_hosted_visual_stage_attempt',
    'worker_restart_requery_resume',
    'retry_dead_letter_repair_projection',
    'artifact_producing_owner_receipt',
    'cross_family_no_regression',
  ]);
  assert.equal(
    readiness.remaining_typed_blocker_ref,
    'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
  );
  assert.equal(
    readiness.focused_test_ref,
    'tests/product-entry-cases/temporal-autonomy-readiness.test.ts',
  );
});

test('RCA evidence receipt fixture records artifact receipt refs, memory workspace refs, and a controlled soak blocker', () => {
  const acceptance = readJson(acceptancePath);
  const fixture = readJson(evidenceFixturePath);

  assert.equal(acceptance.visual_artifact_receipt_chain.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.equal(acceptance.evidence_tail.closure_receipt.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.equal(acceptance.controlled_visual_soak.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.equal(acceptance.controlled_visual_soak.production_soak_complete, false);
  assert.equal(acceptance.remaining_evidence_gate_blockers.status, 'domain_owned_typed_blockers_reported');
  assert.equal(acceptance.remaining_evidence_gate_blockers.production_evidence_success_claimed, false);
  assert.equal(acceptance.remaining_evidence_gate_blockers.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.deepEqual(
    acceptance.remaining_evidence_gate_blockers.blockers.map((blocker) => blocker.remaining_gap_id),
    [
      'opl_hosted_controlled_visual_stage_long_soak',
      'real_memory_lifecycle_receipt_instances',
      'cross_family_repeated_no_regression_evidence',
    ],
  );
  for (const blocker of acceptance.remaining_evidence_gate_blockers.blockers) {
    assertRefString(blocker.typed_blocker_ref, `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.typed_blocker_ref`);
    assertRefString(blocker.typed_blocker_kind, `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.typed_blocker_kind`);
    assert.equal(typeof blocker.reason, 'string', `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.reason`);
    assert.notEqual(blocker.reason.trim(), '', `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.reason`);
    assertRefArray(
      blocker.next_verification_command_refs,
      `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.next_verification_command_refs`,
    );
  }

  assert.equal(fixture.surface_kind, 'rca_evidence_receipt_fixture');
  assert.equal(fixture.owner, 'redcube_ai');
  assert.equal(
    fixture.fixture_scope,
    'artifact_producing_owner_receipt_memory_workspace_refs_and_controlled_soak_blocker',
  );
  assert.equal(fixture.repository_boundary.repo_tracks_receipt_fixture, true);
  assert.equal(fixture.repository_boundary.repo_tracks_live_receipt_instances, false);
  assert.equal(fixture.repository_boundary.repo_tracks_artifact_body, false);
  assert.equal(fixture.repository_boundary.repo_tracks_memory_body, false);
  assert.equal(fixture.repository_boundary.repo_tracks_scaleout_receipt_refs, true);

  const receipt = fixture.artifact_producing_owner_receipt;
  assert.equal(receipt.return_shape, 'domain_receipt');
  assert.equal(receipt.owner, 'redcube_ai');
  assert.equal(receipt.artifact_producing_receipt, true);
  assert.equal(receipt.contains_artifact_blob, false);
  assert.equal(receipt.declares_visual_ready, false);
  assert.equal(receipt.declares_exportable, false);
  assert.equal(receipt.declares_handoffable, false);
  assert.equal(receipt.declares_domain_ready, false);
  for (const key of [
    'receipt_ref',
    'actual_workspace_receipt_ref',
    'attempt_ref',
    'artifact_locator_ref',
    'review_export_ref',
    'actual_workspace_review_export_ref',
    'forbidden_write_proof_ref',
  ]) {
    assertRefString(receipt[key], `artifact_producing_owner_receipt.${key}`);
  }
  assertRefArray(receipt.artifact_receipt_refs, 'artifact_producing_owner_receipt.artifact_receipt_refs');
  assertRefArray(receipt.artifact_stage_refs, 'artifact_producing_owner_receipt.artifact_stage_refs');

  const memoryWorkspace = fixture.visual_memory_workspace_evidence;
  assert.equal(memoryWorkspace.evidence_model, 'runtime_receipt_refs_only');
  assertRefArray(memoryWorkspace.memory_receipt_refs, 'visual_memory_workspace_evidence.memory_receipt_refs');
  assert.equal(memoryWorkspace.memory_receipt_refs.some((ref) => ref.includes('transition-accepted')), true);
  assert.equal(memoryWorkspace.memory_receipt_refs.some((ref) => ref.includes('transition-rejected')), true);
  assertRefString(memoryWorkspace.workspace_receipt_inventory_ref, 'workspace_receipt_inventory_ref');
  assertRefString(memoryWorkspace.runtime_receipt_instances_ref, 'runtime_receipt_instances_ref');
  assert.deepEqual(memoryWorkspace.required_workspace_receipt_kinds, [
    'domain_owner',
    'accepted_memory',
    'rejected_memory',
    'lifecycle_cleanup',
    'lifecycle_restore',
    'lifecycle_retention',
  ]);
  assert.equal(memoryWorkspace.workspace_receipt_scaleout_claimed, false);
  assert.equal(memoryWorkspace.contains_memory_body, false);
  assert.equal(memoryWorkspace.contains_receipt_instance_body, false);
  assert.equal(memoryWorkspace.contains_artifact_blob, false);

  const scaleoutFixture = fixture.production_evidence_scaleout_refs;
  assert.equal(scaleoutFixture.surface_kind, 'rca_visual_production_evidence_scaleout_fixture_refs');
  assert.equal(scaleoutFixture.owner, 'redcube_ai');
  assert.equal(scaleoutFixture.evidence_model, 'refs_only_no_payload_body');
  assert.deepEqual(scaleoutFixture.selected_artifact_producing_visual_route.stage_sequence_refs, [
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assert.equal(scaleoutFixture.selected_artifact_producing_visual_route.produces_artifact_refs, true);
  assert.equal(scaleoutFixture.selected_artifact_producing_visual_route.html_or_native_route_selected, false);
  assert.equal(scaleoutFixture.selected_artifact_producing_visual_route.visual_verdict_owner, 'redcube_ai');
  assert.equal(scaleoutFixture.selected_artifact_producing_visual_route.artifact_authority_owner, 'redcube_ai');
  assertRefString(scaleoutFixture.artifact_producing_owner_receipt_ref, 'artifact_producing_owner_receipt_ref');
  assert.equal(scaleoutFixture.workspace_receipt_scaleout_refs.scaleout_claimed, false);
  assert.equal(
    scaleoutFixture.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.route_id,
    'ppt_deck.image_first.artifact_producing.v1',
  );
  assertRefString(
    scaleoutFixture.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.workspace_receipt_proof_ref,
    'production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.actual_workspace_receipt_refs.workspace_receipt_proof_ref',
  );
  assert.equal(scaleoutFixture.workspace_receipt_scaleout_refs.required_workspace_count_for_scaleout, 2);
  assert.equal(scaleoutFixture.workspace_receipt_scaleout_refs.emits_owner_receipt_ref, true);
  assert.equal(scaleoutFixture.workspace_receipt_scaleout_refs.emits_memory_receipt_refs, true);
  assert.equal(scaleoutFixture.workspace_receipt_scaleout_refs.emits_no_regression_evidence_ref, true);
  assert.equal(scaleoutFixture.workspace_receipt_scaleout_refs.declares_production_soak_complete, false);
  assert.equal(scaleoutFixture.visual_memory_body_reuse_refs.body_owner, 'redcube_ai');
  assert.equal(scaleoutFixture.visual_memory_body_reuse_refs.projected_body_to_opl, false);
  assert.equal(scaleoutFixture.visual_memory_body_reuse_refs.contains_memory_body, false);
  assert.equal(
    scaleoutFixture.visual_memory_body_reuse_refs.reuse_ref_scope,
    'visual_pattern_memory_locator_and_content_ref_only',
  );
  assert.equal(scaleoutFixture.repeated_no_regression_evidence_refs.minimum_ref_count, 2);
  assertRefArray(
    scaleoutFixture.repeated_no_regression_evidence_refs.evidence_refs,
    'production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs',
  );
  assert.equal(scaleoutFixture.repeated_no_regression_evidence_refs.evidence_cadence, 'repeated_family_refs_only');
  assert.equal(scaleoutFixture.repeated_no_regression_evidence_refs.declares_production_soak_complete, false);
  assert.equal(scaleoutFixture.review_export_verdict_refs.verdict_body_projected_to_opl, false);
  assert.equal(scaleoutFixture.naming_tombstone_follow_through.active_caller_compatibility_alias_restored, false);

  const oplHandoff = fixture.opl_expected_receipt_monitor_freshness_handoff;
  assert.equal(oplHandoff.surface_kind, 'rca_opl_expected_receipt_monitor_freshness_handoff_fixture_refs');
  assert.equal(oplHandoff.status, 'body_free_refs_ready_for_opl_workorder');
  assert.equal(oplHandoff.evidence_model, 'refs_only_no_payload_body');
  assert.equal(oplHandoff.body_free_owner_receipt_ref.payload_body_included, false);
  assert.equal(oplHandoff.body_free_workspace_receipt_ref.workspace_receipt_scaleout_claimed, false);
  assert.equal(oplHandoff.body_free_visual_memory_reuse_ref.payload_body_included, false);
  assert.equal(oplHandoff.body_free_repeated_no_regression_refs.repeated_no_regression_claimed_as_soak, false);
  assert.equal(oplHandoff.monitor_freshness_backfill_refs.monitor_freshness_payload_body_required, false);
  assert.equal(oplHandoff.monitor_freshness_backfill_refs.production_soak_claimed, false);
  assert.equal(oplHandoff.typed_blocker_backfill_refs.blocker_owner, 'redcube_ai');
  assert.equal(oplHandoff.typed_blocker_backfill_refs.payload_body_included, false);
  assert.equal(oplHandoff.opl_payload_policy.payload_body_allowed, false);
  assert.equal(oplHandoff.authority_boundary.opl_can_record_expected_receipt_refs, true);
  assert.equal(oplHandoff.authority_boundary.opl_can_record_monitor_freshness_refs, true);
  assert.equal(oplHandoff.authority_boundary.opl_can_write_rca_visual_truth, false);
  assert.equal(oplHandoff.authority_boundary.opl_can_store_artifact_payload, false);
  assert.equal(oplHandoff.authority_boundary.opl_can_store_memory_body, false);
  assert.equal(oplHandoff.authority_boundary.opl_can_authorize_review_export_verdict, false);
  assert.equal(oplHandoff.authority_boundary.opl_can_claim_visual_stage_soak_complete, false);

  const temporalReadinessFixture = fixture.temporal_autonomy_readiness;
  assert.equal(temporalReadinessFixture.surface_kind, 'temporal_autonomy_readiness_fixture_refs');
  assert.equal(temporalReadinessFixture.readiness_ref, 'redcube product manifest#/temporal_autonomy_readiness');
  assert.equal(temporalReadinessFixture.status, 'standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending');
  assert.equal(temporalReadinessFixture.provider_owner, 'one-person-lab');
  assert.equal(temporalReadinessFixture.provider_kind_required_for_production, 'temporal');
  assert.equal(temporalReadinessFixture.can_be_opl_temporal_hosted, true);
  assert.equal(temporalReadinessFixture.default_opl_temporal_hosted_autonomy_enabled, true);
  assert.equal(temporalReadinessFixture.task_start_handoff_is_persistent_opl_temporal_scheduling, true);
  assert.equal(temporalReadinessFixture.codex_app_outer_loop_required_after_task_start, false);
  assert.equal(temporalReadinessFixture.long_time_autonomy_claimed, true);
  assert.equal(temporalReadinessFixture.production_visual_stage_long_soak_complete, false);
  assert.equal(temporalReadinessFixture.rca_owns_generic_daemon_scheduler_attempt_loop, false);
  assert.deepEqual(temporalReadinessFixture.capability_gate_refs, [
    'provider_online_management',
    'stage_descriptor_handoff',
    'queue_wakeup_handoff',
    'progress_requery',
    'restart_resume_recovery',
    'retry_dead_letter_repair',
    'domain_closeout_receipts',
  ]);
  assert.equal(
    temporalReadinessFixture.remaining_typed_blocker_ref,
    'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
  );
  assert.equal(
    temporalReadinessFixture.authority_boundary.opl_can_write_rca_visual_truth,
    false,
  );
  assert.equal(
    temporalReadinessFixture.authority_boundary.opl_can_authorize_review_export_verdict,
    false,
  );
  assert.equal(
    temporalReadinessFixture.authority_boundary.provider_completion_is_production_soak_complete,
    false,
  );

  const soak = fixture.controlled_visual_soak_closeout;
  assert.equal(soak.state, 'domain_owned_typed_blocker_with_next_verification_ref');
  assert.equal(soak.production_soak_complete, false);
  assert.equal(soak.provider_restart_requery_retry_dead_letter_proven, false);
  assert.equal(soak.typed_blocker.owner, 'redcube_ai');
  assert.equal(soak.typed_blocker.blocker_kind, 'controlled_visual_soak_runtime_evidence_pending');
  assertRefString(soak.typed_blocker.blocker_ref, 'controlled_visual_soak_closeout.typed_blocker.blocker_ref');
  assertRefArray(
    soak.typed_blocker.next_verification_command_refs,
    'controlled_visual_soak_closeout.typed_blocker.next_verification_command_refs',
  );

  const gateBlockers = fixture.remaining_evidence_gate_blockers;
  assert.equal(gateBlockers.state, 'domain_owned_typed_blockers_with_next_verification_refs');
  assert.equal(gateBlockers.production_evidence_success_claimed, false);
  assert.deepEqual(
    gateBlockers.blockers.map((blocker) => blocker.remaining_gap_id),
    [
      'opl_hosted_controlled_visual_stage_long_soak',
      'real_memory_lifecycle_receipt_instances',
      'cross_family_repeated_no_regression_evidence',
    ],
  );
  for (const blocker of gateBlockers.blockers) {
    assertRefString(blocker.typed_blocker_ref, `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.typed_blocker_ref`);
    assertRefString(blocker.typed_blocker_kind, `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.typed_blocker_kind`);
    assertRefArray(
      blocker.next_verification_command_refs,
      `remaining_evidence_gate_blockers.${blocker.remaining_gap_id}.next_verification_command_refs`,
    );
  }

  assert.equal(fixture.legacy_managed_naming_policy.active_caller_compatibility_alias_restored, false);
  assert.deepEqual(fixture.legacy_managed_naming_policy.allowed_managed_occurrence_classes, [
    'provenance',
    'semantic_id',
    'tombstone',
    'negative_guard_payload_field',
  ]);
  assert.equal(
    fixture.legacy_managed_naming_policy.forbidden_active_occurrence_classes.includes('compatibility_alias'),
    true,
  );
  assert.equal(fixture.forbidden_payload_fields.includes('artifact_blob'), true);
  assert.equal(fixture.forbidden_payload_fields.includes('generic_runtime_state'), true);
  assert.equal(fixture.forbidden_payload_fields.includes('managed_runtime_compatibility_alias'), true);
});

test('RCA production evidence tail workorder keeps evidence-after-contract refs open and body-free', () => {
  const acceptance = readJson(acceptancePath);
  const fixture = readJson(evidenceFixturePath);
  const workorder = acceptance.production_evidence_tail_workorder;

  assert.equal(workorder.surface_kind, 'rca_production_evidence_tail_workorder');
  assert.equal(workorder.workorder_id, 'rca.production_evidence_tail_workorder.v1');
  assert.equal(workorder.owner, 'redcube_ai');
  assert.equal(workorder.consumer, 'one_person_lab');
  assert.equal(workorder.status, 'open_typed_blocker_workorder');
  assert.equal(workorder.workorder_scope, 'production_evidence_tail_after_contract');
  assert.equal(workorder.refs_only, true);
  assert.equal(workorder.read_only, true);
  assert.equal(workorder.payload_body_required, false);
  assert.equal(workorder.payload_body_allowed, false);
  assert.equal(workorder.evidence_after_contract_required, true);
  assertRefString(
    workorder.source_projection_refs.production_evidence_scaleout_refs_ref,
    'production_evidence_tail_workorder.source_projection_refs.production_evidence_scaleout_refs_ref',
  );
  assertRefString(
    workorder.source_projection_refs.remaining_evidence_gate_blockers_contract_ref,
    'production_evidence_tail_workorder.source_projection_refs.remaining_evidence_gate_blockers_contract_ref',
  );
  assert.deepEqual(workorder.work_items.map((item) => item.item_id), [
    'owner_chain_apply',
    'memory_lifecycle_receipt_scaleout',
    'temporal_controlled_visual_stage_long_soak',
    'cross_family_repeated_no_regression',
  ]);
  assert.deepEqual(workorder.work_items.map((item) => item.sequence), [1, 2, 3, 4]);
  assert.deepEqual(workorder.work_items.map((item) => item.typed_blocker_ref), [
    'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
    'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
    'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
    'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
  ]);
  for (const item of workorder.work_items) {
    assertRefArray(item.required_input_refs, `production_evidence_tail_workorder.${item.item_id}.required_input_refs`);
    assertRefArray(item.expected_output_refs, `production_evidence_tail_workorder.${item.item_id}.expected_output_refs`);
    assertRefArray(
      item.next_verification_command_refs,
      `production_evidence_tail_workorder.${item.item_id}.next_verification_command_refs`,
    );
    assert.equal(item.success_claims_allowed, false, item.item_id);
    assert.equal(item.payload_body_allowed, false, item.item_id);
    assert.equal(item.visual_readiness_claimed, false, item.item_id);
    assert.equal(item.export_readiness_claimed, false, item.item_id);
    assert.equal(item.handoff_readiness_claimed, false, item.item_id);
    assert.equal(item.domain_readiness_claimed, false, item.item_id);
    assert.equal(item.production_soak_complete_claimed, false, item.item_id);
  }
  assert.deepEqual(workorder.forbidden_payload_classes, [
    'visual_truth_body',
    'review_export_verdict_body',
    'export_verdict_body',
    'artifact_blob',
    'artifact_body',
    'visual_memory_body',
    'memory_body',
    'generic_runtime_state',
    'generic_attempt_ledger_record',
    'runtime_queue_state',
  ]);
  assert.equal(workorder.authority_boundary.opl_can_store_workorder_refs, true);
  assert.equal(workorder.authority_boundary.opl_can_write_rca_visual_truth, false);
  assert.equal(workorder.authority_boundary.opl_can_store_artifact_blob, false);
  assert.equal(workorder.authority_boundary.opl_can_store_memory_body, false);
  assert.equal(workorder.authority_boundary.opl_can_authorize_review_export_verdict, false);
  assert.equal(workorder.authority_boundary.opl_can_claim_visual_stage_soak_complete, false);
  assert.equal(workorder.success_boundary.owner_chain_closed_by_workorder, false);
  assert.equal(workorder.success_boundary.production_soak_complete_claimed, false);

  const fixtureWorkorder = fixture.production_evidence_tail_workorder;
  assert.equal(fixtureWorkorder.surface_kind, 'rca_production_evidence_tail_workorder_fixture_refs');
  assert.deepEqual(fixtureWorkorder.work_item_ids, workorder.work_items.map((item) => item.item_id));
  assert.equal(fixtureWorkorder.payload_body_allowed, false);
  assert.equal(fixtureWorkorder.declares_visual_ready, false);
  assert.equal(fixtureWorkorder.declares_exportable, false);
  assert.equal(fixtureWorkorder.declares_handoffable, false);
  assert.equal(fixtureWorkorder.declares_domain_ready, false);
  assert.equal(fixtureWorkorder.declares_production_soak_complete, false);
  assert.deepEqual(fixtureWorkorder.forbidden_payload_classes, workorder.forbidden_payload_classes);
});

test('RCA production acceptance surface does not introduce ready-claim keys or blob fields', () => {
  const acceptance = readJson(acceptancePath);
  const keys = collectKeys(acceptance);
  const forbiddenReadyClaims = keys.filter((key) =>
    /(?:visual_ready|exportable|handoffable|domain_ready)$/.test(key)
    && !(
      key.startsWith('authority_boundary.')
      || key.startsWith('forbidden_claims.')
      || key.startsWith('structural_conformance.')
      || key.startsWith('visual_artifact_receipt_chain.chain_declares_')
      || key.startsWith('production_evidence_scaleout_refs.accepted_payload_paths.')
    )
  );

  assert.deepEqual(forbiddenReadyClaims, []);
  assert.equal(JSON.stringify(acceptance).includes('canonical_artifact_blob'), false);
  assert.equal(acceptance.repository_boundary.repo_tracks_visual_truth_body, false);
  assert.equal(acceptance.repository_boundary.repo_tracks_review_export_verdict_body, false);
});
