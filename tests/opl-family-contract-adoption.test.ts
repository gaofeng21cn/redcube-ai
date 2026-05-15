// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const CONTRACT_PATH = 'contracts/runtime-program/opl-family-contract-adoption.json';
const CURRENT_PROGRAM_PATH = 'contracts/runtime-program/current-program.json';
const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function contract() {
  return JSON.parse(read(CONTRACT_PATH));
}

function currentProgram() {
  return JSON.parse(read(CURRENT_PROGRAM_PATH));
}

test('RCA declares thin OPL family contract adoption', () => {
  const payload = contract();

  assert.equal(payload.contract_kind, 'rca_opl_family_contract_adoption.v1');
  assert.equal(payload.domain_id, 'redcube-ai');
  assert.equal(payload.opl_role, 'family-level projection consumer only');
});

test('RCA runtime projection maps to visual deliverable runtime surfaces', () => {
  const payload = contract();
  const attempt = payload.attempt_projection;

  for (const surface of ['product-entry session', 'runtimeWatch', 'artifact inventory', 'runtime health']) {
    assert.ok(attempt.source_surfaces.includes(surface));
  }
  assert.equal(attempt.maps_to_opl_contract, 'opl_family_runtime_attempt_contract.v1');
  assert.match(attempt.owner_boundary, /RCA owns visual deliverable runtime/);
});

test('RCA quality projection keeps visual proof owner and excludes other domain gates', () => {
  const payload = contract();
  const quality = payload.quality_projection;

  for (const surface of [
    'content-fit review',
    'visual_director_review',
    'screenshot_review',
    'render proof',
    'export proof',
    'getReviewState',
    'getPublicationProjection',
  ]) {
    assert.ok(quality.source_surfaces.includes(surface));
  }
  assert.equal(quality.maps_to_opl_contract, 'opl_family_domain_quality_projection_contract.v1');
  assert.equal(quality.claim_only_ready_forbidden, true);
});

test('RCA operator and incident projection require source refs and RCA closure', () => {
  const payload = contract();
  const incident = payload.incident_projection;
  const operator = payload.operator_projection;

  assert.equal(incident.maps_to_opl_contract, 'opl_family_incident_learning_loop.v1');
  assert.match(incident.closure_rule, /RCA-owned closure ref/);
  for (const field of ['source_refs', 'freshness', 'owner_split', 'next_surface_ref', 'human_gate_reason']) {
    assert.ok(operator.required_fields.includes(field));
  }
  for (const nonGoal of [
    'OPL owns RedCube visual truth',
    'OPL owns canonical artifacts',
    'OPL owns review/export judgment',
    'medical publication gate',
    'grant fundability gate',
  ]) {
    assert.ok(payload.non_goals.includes(nonGoal));
  }
});

test('RCA exposes a thick OPL family lifecycle adapter while keeping SQLite deferred', () => {
  const payload = contract();
  const adapter = payload.lifecycle_adapter_surface;

  assert.equal(adapter.surface_kind, 'opl_family_lifecycle_adapter');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca');
  assert.equal(adapter.authority_model, 'file_authority_plus_rebuildable_artifact_indexes');
  for (const surface of [
    'managed-runs',
    'product-entry sessions',
    'review state',
    'publication projection',
  ]) {
    assert.ok(adapter.source_surfaces.includes(surface));
  }
  assert.deepEqual(adapter.adoption_state_values, [
    'discoverable_manifest_projection',
    'hydrated_session_projection',
  ]);
  assert.ok(adapter.exposed_on.includes('oplHosted product entry response'));
});

test('RCA stage control projection maps route stages without owning runtime control', () => {
  const payload = contract();
  const projection = payload.stage_control_projection;

  assert.equal(projection.surface_kind, 'opl_family_stage_control_projection');
  assert.equal(projection.projection_id, 'rca.opl.family.stage-control.projection.v1');
  assert.equal(projection.adapter_model, 'descriptor_read_only');
  assert.equal(projection.maps_to_opl_contract, 'opl_family_stage_control_plane.v1');
  assert.deepEqual(projection.covered_families, [
    'ppt_deck',
    'xiaohongshu',
    'poster_onepager',
  ]);
  assert.deepEqual(projection.family_stage_kinds, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.deepEqual(projection.route_stage_projection.ppt_deck.artifact_creation, [
    'author_image_pages',
    'render_html',
    'author_pptx_native',
  ]);
  assert.deepEqual(projection.route_stage_projection.xiaohongshu.package_and_handoff, [
    'publish_copy',
    'export_bundle',
  ]);
  assert.deepEqual(projection.route_stage_projection.poster_onepager.communication_strategy, [
    'poster_blueprint',
  ]);
  assert.deepEqual(projection.authority_boundary, {
    rca_owns_visual_truth: true,
    rca_owns_review_publication_projection: true,
    rca_owns_artifact_authority: true,
    opl_role: 'read_only_stage_projection_consumer',
    default_ppt_route_changed: false,
    managed_deliverable_runtime_changed: false,
  });
});

test('RCA standard domain-agent skeleton keeps repo source and runtime artifacts separate', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.surface_kind, 'standard_domain_agent_skeleton');
  assert.equal(skeleton.skeleton_id, 'rca.standard_domain_agent_skeleton.v1');
  assert.equal(skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
  assert.deepEqual(skeleton.repo_source_boundary.allowed_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_runtime_artifact_blobs, false);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_receipt_instances, false);
  assert.equal(skeleton.repo_source_boundary.audit_surface.status, 'pass');
  assert.deepEqual(skeleton.repo_source_boundary.audit_surface.expected_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.deepEqual(skeleton.repo_source_boundary.audit_surface.missing_roots, []);
  for (const root of skeleton.repo_source_boundary.allowed_roots) {
    assert.equal(fs.existsSync(path.join(repoRoot, root)), true);
  }
  assert.ok(skeleton.repo_source_boundary.audit_surface.forbidden_repo_writes.includes('canonical_artifact_blob'));
  assert.deepEqual(skeleton.runtime_declarations.declares_only, [
    'product_sidecar_adapter',
    'projection_builder',
    'lifecycle_adapter',
    'visual_transition_spec',
    'domain_memory_descriptor_locator',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
  ]);
  assert.equal(skeleton.runtime_declarations.sidecar_adapter_ref, '/product_entry_shell/sidecar');
  assert.equal(skeleton.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
  assert.equal(skeleton.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
  assert.equal(skeleton.runtime_declarations.visual_transition_spec_ref, '/visual_transition_spec');
  assert.equal(skeleton.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
  assert.equal(skeleton.runtime_declarations.domain_owner_receipt_contract_ref, '/domain_owner_receipt_contract');
  assert.equal(skeleton.runtime_declarations.lifecycle_guarded_apply_proof_ref, '/lifecycle_guarded_apply_proof');
});

test('RCA controlled soak remains deferred without descriptor index skeleton regression', () => {
  const payload = contract();
  const controlledSoak = payload.standard_domain_agent_skeleton.controlled_soak;

  assert.equal(controlledSoak.state, 'deferred');
  assert.equal(controlledSoak.required_opl_substrate, 'Temporal production online runtime');
  assert.deepEqual(controlledSoak.owner_runtime_receipt_actions, {
    state: 'runtime_receipt_refs_available',
    domain_owner_receipt_action: 'emit_domain_owner_receipt',
    visual_memory_writeback_action: 'apply_visual_memory_writeback',
    workspace_lifecycle_action: 'apply_visual_workspace_lifecycle',
    workspace_receipt_root: '<workspace-root>/.redcube/runtime/receipts/',
    typed_blocker_on_missing_required_refs: true,
    visual_ready_claimed: false,
    repo_tracks_live_receipt_instances: false,
    opl_consumes_locator_and_receipt_refs_only: true,
  });
  assert.deepEqual(controlledSoak.no_regression_surfaces, [
    'family_action_catalog',
    'stage_control_projection',
    'route_equivalence',
    'standard_domain_agent_skeleton',
    'artifact_locator_contract',
    'product_sidecar_receipt_refs',
    'domain_memory_descriptor',
    'domain_memory_descriptor_locator',
    'controlled_visual_stage_attempt',
    'controlled_memory_apply_proof',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
    'visual_transition_spec',
    'physical_skeleton_follow_through',
    'review_helper_baseline_follow_through',
  ]);
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('provider_hosted_controlled_visual_stage_soak_completed'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('real_visual_memory_body_repo_tracked'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('accepted_or_rejected_receipt_instance_repo_tracked'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('OPL_holds_visual_or_export_verdict'));
});

test('RCA artifact locator and sidecar receipts expose refs without OPL visual verdict ownership', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
  assert.equal(skeleton.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
  assert.equal(skeleton.artifact_locator_contract.repo_tracks_visual_or_export_artifact_blobs, false);
  for (const forbidden of [
    'store_png_pptx_pdf_blob',
    'declare_visual_export_verdict',
    'rewrite_canonical_artifact',
    'mutate_review_state',
  ]) {
    assert.ok(skeleton.artifact_locator_contract.opl_forbidden.includes(forbidden));
  }
  assert.equal(skeleton.product_sidecar_receipt_refs.receipt_contract_id, 'rca.product_sidecar.receipt_refs.v1');
  for (const field of ['visual_verdict', 'export_verdict', 'review_verdict', 'publication_gate_verdict', 'artifact_blob']) {
    assert.ok(skeleton.product_sidecar_receipt_refs.forbidden_receipt_fields.includes(field));
  }
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
  assert.equal(
    skeleton.controlled_visual_stage_attempt_fixture.proof_model,
    'consumed_memory_writeback_receipt_descriptor_sidecar_quality_ref_equivalence_only',
  );
  assert.deepEqual(skeleton.controlled_visual_stage_attempt_fixture.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.deepEqual(skeleton.controlled_visual_stage_attempt_fixture.route_stage_refs, [
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_artifact_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_quality_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_sidecar_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_quality_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_visual_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_canonical_artifact_content, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_visual_truth, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_review_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_artifact_blob, false);
});

test('RCA domain memory descriptor exposes locator and receipts without moving visual authority to OPL', () => {
  const payload = contract();
  const descriptor = payload.domain_memory_descriptor;
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;

  assert.equal(descriptor.surface_kind, 'family_domain_memory_ref');
  assert.equal(descriptor.version, 'family-domain-memory-ref.v1');
  assert.equal(descriptor.memory_ref_id, 'rca_visual_pattern_memory');
  assert.equal(descriptor.target_domain_id, 'redcube_ai');
  assert.equal(descriptor.owner, 'redcube_ai');
  assert.equal(descriptor.memory_family, 'visual_pattern_memory');
  assert.deepEqual(descriptor.memory_pack_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator',
    role: 'domain_owned_memory_pack_descriptor',
    label: 'RCA visual pattern memory descriptor locator',
  });
  assert.deepEqual(descriptor.stage_applicability, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.deepEqual(descriptor.retrieval_contract_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/memory_locator',
    role: 'locator_only_retrieval_contract',
    label: 'RCA visual pattern memory locator',
  });
  assert.deepEqual(descriptor.writeback_contract_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
    role: 'domain_owned_writeback_proposal_contract',
    label: 'RCA visual pattern memory writeback proposal generator',
  });
  assert.deepEqual(descriptor.receipt_contract_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/writeback_receipt_contract',
    role: 'locator_only_writeback_receipt_contract',
    label: 'RCA visual pattern memory writeback receipt refs',
  });
  assert.deepEqual(descriptor.recall_projection_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
    role: 'operator_recall_receipt_projection',
    label: 'RCA visual pattern memory operator receipt projection',
  });
  assert.deepEqual(descriptor.migration_plan_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/migration_plan',
    role: 'domain_owned_migration_plan',
    label: 'RCA visual pattern memory migration plan',
  });
  assert.deepEqual(descriptor.seed_corpus_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/seed_fixture_locator',
    role: 'domain_owned_seed_locator',
    label: 'RCA visual pattern memory seed fixture locator',
  });
  assert.deepEqual(descriptor.writeback_receipt_locator_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/writeback_receipt_locator',
    role: 'domain_owned_writeback_receipt_locator',
    label: 'RCA visual pattern memory writeback receipt locator',
  });
  assert.equal(descriptor.freshness.source, 'contract_manifest_projection');
  assert.equal(descriptor.migration_readiness.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.migration_readiness.migration_state, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.migration_readiness.descriptor_proof_contract_state, 'landed');
  assert.equal(descriptor.migration_readiness.runtime_writeback_state, 'pending');
  assert.equal(descriptor.migration_readiness.memory_body_migration, 'domain_owned_runtime_apply_required');
  assert.equal(descriptor.migration_readiness.opl_apply_allowed, false);
  assert.equal(descriptor.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.authority_boundary.opl_role, 'locator_projection_owner');
  assert.equal(descriptor.authority_boundary.domain_memory_owner, 'redcube_ai');
  assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('memory_store_owner'));
  assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('visual_route_owner'));
  assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('accept_reject_owner'));
  assert.equal(descriptor.authority_boundary.can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.can_authorize_quality_verdict, false);
  assert.equal(descriptor.authority_boundary.can_write_artifacts, false);
  assert.equal(descriptor.authority_boundary.can_choose_visual_route, false);
  assert.equal(descriptor.authority_boundary.can_accept_or_reject_memory_writeback, false);
  assert.equal(descriptor.authority_boundary.can_issue_review_or_export_verdict, false);

  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.memory_family, 'visual_pattern_memory');
  assert.equal(memory.memory_model, 'natural_language_pattern_cards');
  assert.equal(memory.descriptor_model, 'repo_tracked_descriptor_refs_only');
  assert.equal(memory.locator_model, 'rca_owned_memory_ref_locator');
  assert.equal(memory.policy_ref, 'human_doc:visual_pattern_memory_policy');
  assert.equal(memory.human_doc_ref, 'human_doc:domain_memory_descriptor_locator');
  assert.deepEqual(memory.opl_consumes, [
    'memory locator refs',
    'memory provenance refs',
    'writeback receipt refs',
  ]);
  for (const forbidden of [
    'own_memory_content',
    'choose_visual_route',
    'issue_review_or_export_verdict',
    'mutate_canonical_artifacts',
  ]) {
    assert.ok(memory.opl_forbidden.includes(forbidden));
  }
  assert.deepEqual(memory.authority_boundary, {
    memory_content_owner: 'redcube_ai',
    route_truth_owner: 'redcube_ai',
    review_export_verdict_owner: 'redcube_ai',
    artifact_authority_owner: 'redcube_ai',
    opl_role: 'locator_ref_receipt_consumer_only',
    opl_can_accept_or_reject_memory_writeback: false,
  });
});

test('RCA domain memory migration plan is locator-only and acceptance-gated', () => {
  const payload = contract();
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
  const plan = memory.migration_plan;

  assert.equal(plan.plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
  assert.equal(plan.state, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(plan.descriptor_proof_contract_state, 'landed');
  assert.equal(plan.runtime_writeback_state, 'pending');
  assert.deepEqual(plan.source_surfaces, [
    'workspace_runtime_root',
    'product_entry_session',
    'visual_director_review',
    'screenshot_review',
    'export_closeout',
    'human_doc_reference',
  ]);
  assert.deepEqual(plan.migration_steps, [
    'discover_candidate_lessons',
    'extract_reusable_pattern_card_candidate',
    'record_seed_fixture_locator_ref',
    'generate_writeback_proposal_locator',
    'domain_review_accept_or_reject',
    'publish_memory_locator_ref',
    'emit_writeback_receipt_ref',
    'project_operator_receipt_status',
  ]);
  for (const gate of [
    'candidate_excludes_current_deliverable_content',
    'candidate_excludes_review_export_verdict',
    'candidate_excludes_canonical_artifact_blob',
    'proposal_is_locator_only',
    'decision_is_rca_owned_accept_or_reject',
    'writeback_receipt_is_locator_only',
    'operator_receipt_projection_is_locator_only',
  ]) {
    assert.ok(plan.acceptance_gates.includes(gate));
  }
  assert.deepEqual(plan.repository_boundary, {
    repo_tracks_migration_plan: true,
    repo_tracks_seed_locator_contract: true,
    repo_tracks_memory_entries: false,
    repo_tracks_receipt_instances: false,
    repo_tracks_visual_or_export_artifacts: false,
    visual_truth_changed: false,
    route_truth_changed: false,
  });
});

test('RCA visual pattern memory seed and receipt surfaces do not carry memory content or artifacts', () => {
  const payload = contract();
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
  const seed = memory.seed_fixture_locator;
  const receipt = memory.writeback_receipt_locator;

  assert.equal(seed.fixture_id, 'rca.visual_pattern_memory.seed_fixture_locator.v1');
  assert.equal(seed.fixture_model, 'locator_only_no_memory_content');
  assert.deepEqual(seed.required_locator_fields, [
    'seed_id',
    'source_review_ref',
    'stage_scope',
    'deliverable_family',
    'reusable_lesson_ref',
    'provenance_refs',
    'migration_status',
  ]);
  for (const forbidden of [
    'memory_content_body',
    'slide_or_page_content',
    'visual_verdict',
    'export_verdict',
    'canonical_artifact_blob',
  ]) {
    assert.ok(seed.forbidden_seed_fields.includes(forbidden));
  }
  assert.equal(receipt.locator_id, 'rca.visual_pattern_memory.writeback_receipt_locator.v1');
  assert.equal(receipt.receipt_contract_id, 'rca.visual_pattern_memory.writeback_receipt_refs.v1');
  assert.equal(receipt.receipt_model, 'locator_only_no_receipt_instance');
  assert.equal(receipt.runtime_writeback_state, 'pending');
  assert.equal(receipt.repo_tracks_receipt_instances, false);
  assert.deepEqual(receipt.locator_fields, [
    'receipt_id',
    'proposal_id',
    'source_review_ref',
    'candidate_memory_ref',
    'writeback_status',
    'memory_locator_ref',
    'operator_receipt_projection_ref',
    'owner',
    'created_at',
  ]);
});

test('RCA visual pattern memory proposal, accept/reject, and operator receipt projection stay locator-only', () => {
  const payload = contract();
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
  const proposal = memory.writeback_proposal_generator;
  const decision = memory.accept_reject_command;
  const projection = memory.operator_receipt_projection;

  assert.equal(proposal.generator_id, 'rca.visual_pattern_memory.writeback_proposal_generator.v1');
  assert.equal(proposal.generator_model, 'locator_only_candidate_projection');
  assert.deepEqual(proposal.proposal_contract.required_fields, [
    'proposal_id',
    'seed_fixture_ref',
    'source_review_ref',
    'stage_scope',
    'deliverable_family',
    'candidate_memory_ref',
    'provenance_refs',
    'recommended_decision',
  ]);
  for (const field of ['memory_content_body', 'visual_verdict', 'export_verdict', 'canonical_artifact_blob']) {
    assert.ok(proposal.proposal_contract.forbidden_fields.includes(field));
  }
  assert.equal(proposal.repository_boundary.repo_tracks_proposal_instances, false);

  assert.equal(decision.command_id, 'rca.visual_pattern_memory.accept_reject.v1');
  assert.deepEqual(decision.allowed_decisions, ['accepted', 'rejected']);
  assert.deepEqual(decision.output_refs, [
    'memory_locator_ref',
    'writeback_receipt_ref',
    'operator_receipt_projection_ref',
  ]);
  assert.equal(decision.side_effect_boundary.writes_domain_memory_outside_repo, true);
  assert.equal(decision.side_effect_boundary.writes_repo_memory_entry, false);
  assert.equal(decision.side_effect_boundary.writes_review_export_verdict, false);

  assert.equal(projection.projection_id, 'rca.visual_pattern_memory.operator_receipt_projection.v1');
  assert.deepEqual(projection.visible_fields, [
    'receipt_id',
    'proposal_id',
    'writeback_status',
    'memory_locator_ref',
    'source_review_ref',
    'operator_message_ref',
  ]);
  assert.ok(projection.forbidden_projection_fields.includes('memory_content_body'));
  assert.ok(projection.forbidden_projection_fields.includes('artifact_blob'));
  assert.equal(projection.opl_consumption_policy.opl_can_surface_projection, true);
  assert.equal(projection.opl_consumption_policy.opl_can_store_memory_content, false);
  assert.equal(projection.opl_consumption_policy.opl_can_issue_decision, false);
});

test('current runtime program points OPL Runtime Manager at the RCA lifecycle adapter projection', () => {
  const payload = currentProgram();
  const managerBoundary = payload.longrun_goal.runtime_manager_boundary;
  const persistence = payload.current_state.runtime_persistence_strategy;
  const adapter = payload.current_state.active_baton.scope.opl_family_lifecycle_adapter;
  const stageProjection = payload.current_state.active_baton.scope.opl_family_stage_control_projection;
  const memory = payload.current_state.active_baton.scope.domain_memory_descriptor_locator;
  const applyProof = payload.current_state.active_baton.scope.controlled_memory_apply_proof;
  const skeletonLayout = payload.current_state.active_baton.scope.standard_domain_agent_skeleton_repo_source_layout;
  const residueRetirement = payload.current_state.active_baton.scope.runtime_residue_retirement;

  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_lifecycle_adapter'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_stage_control_projection'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('domain_memory_descriptor_locator'));
  assert.ok(managerBoundary.does_not_own.includes('domain memory content or verdicts'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_lifecycle_adapter projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_stage_control_projection projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('domain_memory_descriptor_locator projection'));
  assert.equal(adapter.status, 'repo_tracked_projection_contract');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca');
  assert.deepEqual(adapter.exposes, [
    'family persistence',
    'lifecycle projection',
    'owner-route discovery',
    'adoption surface',
  ]);
  assert.equal(stageProjection.status, 'repo_tracked_projection_contract');
  assert.equal(stageProjection.adapter_model, 'descriptor_read_only');
  assert.equal(stageProjection.default_ppt_route_changed, false);
  assert.equal(stageProjection.managed_deliverable_runtime_changed, false);
  const attempt = payload.current_state.active_baton.scope.controlled_visual_stage_attempt;

  assert.equal(memory.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.migration_plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
  assert.equal(memory.seed_fixture_locator_id, 'rca.visual_pattern_memory.seed_fixture_locator.v1');
  assert.equal(memory.writeback_receipt_locator_id, 'rca.visual_pattern_memory.writeback_receipt_locator.v1');
  assert.equal(memory.writeback_proposal_generator_id, 'rca.visual_pattern_memory.writeback_proposal_generator.v1');
  assert.equal(memory.accept_reject_command_id, 'rca.visual_pattern_memory.accept_reject.v1');
  assert.equal(memory.operator_receipt_projection_id, 'rca.visual_pattern_memory.operator_receipt_projection.v1');
  assert.equal(
    memory.migration_state,
    DOMAIN_MEMORY_ADOPTION_STATE,
  );
  assert.equal(memory.descriptor_proof_contract_state, 'landed');
  assert.equal(memory.runtime_writeback_state, 'pending');
  assert.equal(memory.controlled_apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(memory.controlled_memory_apply_proof_ref, 'redcube product manifest#/controlled_memory_apply_proof');
  assert.equal(memory.memory_content_owner, 'redcube_ai');
  assert.equal(memory.route_truth_owner, 'redcube_ai');
  assert.equal(memory.review_export_verdict_owner, 'redcube_ai');
  assert.equal(memory.artifact_authority_owner, 'redcube_ai');
  assert.equal(memory.opl_role, 'locator_ref_receipt_consumer_only');
  assert.equal(memory.repo_tracks_memory_entries, false);
  assert.equal(memory.repo_tracks_proposal_instances, false);
  assert.equal(memory.repo_tracks_receipt_instances, false);
  assert.equal(memory.repo_tracks_visual_or_export_artifacts, false);
  assert.equal(memory.visual_truth_changed, false);
  assert.equal(memory.route_truth_changed, false);
  assert.equal(memory.operator_receipt_projection_ready, true);
  assert.equal(memory.opl_can_accept_or_reject_memory_writeback, false);
  assert.equal(attempt.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(attempt.proof_contract_state, 'landed');
  assert.equal(attempt.runtime_writeback_state, 'pending');
  assert.equal(attempt.apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(attempt.controlled_memory_apply_proof_ref, 'redcube product manifest#/controlled_memory_apply_proof');
  assert.deepEqual(attempt.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.equal(attempt.direct_and_opl_share_descriptor_refs, true);
  assert.equal(attempt.direct_and_opl_share_sidecar_refs, true);
  assert.equal(attempt.direct_and_opl_share_quality_refs, true);
  assert.equal(attempt.opl_writes_visual_truth, false);
  assert.equal(attempt.opl_writes_review_export_verdict, false);
  assert.equal(attempt.opl_writes_artifact_blob, false);

  assert.equal(applyProof.status, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(applyProof.proof_id, 'rca.visual_pattern_memory.controlled_apply_proof.v1');
  assert.equal(applyProof.consumes_visual_pattern_memory_refs, true);
  assert.equal(applyProof.projects_writeback_proposal_ref, true);
  assert.deepEqual(applyProof.projects_accept_reject_receipt_cases, ['accepted', 'rejected']);
  assert.equal(
    applyProof.runtime_receipt_instances_ref,
    'redcube product manifest#/controlled_memory_apply_proof/runtime_receipt_instances',
  );
  assert.deepEqual(applyProof.projects_runtime_receipt_statuses, ['accepted', 'rejected']);
  assert.equal(applyProof.writes_visual_truth, false);
  assert.equal(applyProof.writes_review_verdict, false);
  assert.equal(applyProof.writes_export_verdict, false);
  assert.equal(applyProof.writes_artifact_blob, false);
  assert.equal(applyProof.repo_tracks_memory_content_body, false);
  assert.equal(applyProof.repo_tracks_receipt_instances, false);

  assert.equal(skeletonLayout.status, 'audit_surface_landed');
  assert.equal(skeletonLayout.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
  assert.deepEqual(skeletonLayout.expected_roots, ['agent', 'contracts', 'runtime', 'docs']);
  assert.deepEqual(skeletonLayout.missing_roots, []);
  assert.ok(skeletonLayout.forbidden_repo_writes.includes('memory_content_body'));

  const ownerReceipt = payload.current_state.active_baton.scope.domain_owner_receipt_contract;
  assert.equal(ownerReceipt.status, 'contract_landed_runtime_no_regression_evidence_ref_available');
  assert.equal(ownerReceipt.contract_id, 'rca.domain_owner_receipt.v1');
  assert.deepEqual(ownerReceipt.allowed_return_shapes, ['domain_receipt', 'typed_blocker', 'no_regression_evidence']);
  assert.equal(ownerReceipt.opl_can_store_receipt_refs, true);
  assert.equal(ownerReceipt.opl_can_store_visual_truth, false);
  assert.equal(ownerReceipt.opl_can_store_review_export_verdict, false);
  assert.equal(ownerReceipt.opl_can_store_canonical_artifact_blob, false);

  const lifecycleApply = payload.current_state.active_baton.scope.lifecycle_guarded_apply_proof;
  assert.equal(lifecycleApply.status, 'guarded_apply_proof_landed_domain_artifact_mutation_requires_receipt');
  assert.deepEqual(lifecycleApply.operations, ['cleanup', 'restore', 'retention']);
  assert.equal(lifecycleApply.domain_artifact_mutation_requires_domain_receipt, true);
  assert.equal(lifecycleApply.opl_can_apply_domain_artifact_mutation, false);

  const transitionSpec = payload.current_state.active_baton.scope.visual_transition_spec;
  assert.equal(transitionSpec.status, 'contract_landed_runner_integration_pending');
  assert.equal(transitionSpec.spec_id, 'rca.visual_transition_spec.v1');
  assert.equal(transitionSpec.transition_count, 5);
  assert.equal(transitionSpec.opl_can_execute_transition_spec, true);
  assert.equal(transitionSpec.opl_can_declare_visual_ready, false);
  assert.equal(transitionSpec.opl_can_declare_exportable, false);
  assert.equal(transitionSpec.repo_tracks_runner_state, false);

  const physicalFollowThrough = payload.current_state.active_baton.scope.physical_skeleton_follow_through;
  assert.equal(physicalFollowThrough.status, 'low_risk_repo_source_follow_through_landed');
  assert.deepEqual(physicalFollowThrough.physical_roots, ['agent', 'contracts', 'runtime', 'docs']);

  const reviewHelper = payload.current_state.active_baton.scope.review_helper_baseline_follow_through;
  assert.equal(reviewHelper.status, 'summary_and_geometry_split_landed_baseline_removed');
  assert.equal(reviewHelper.helper_path, 'python/redcube_ai/native_helpers/ppt_deck/review.py');
  assert.deepEqual(reviewHelper.split_plan_module_boundaries, [
    'screenshot_capture_remaining',
    'geometry_audit_landed',
    'markdown_report_landed',
    'summary_projection_landed',
  ]);
  assert.deepEqual(reviewHelper.landed_modules, [
    'python/redcube_ai/native_helpers/ppt_deck/review_geometry.py',
    'python/redcube_ai/native_helpers/ppt_deck/review_summary.py',
  ]);

  assert.equal(residueRetirement.status, 'active_path_retired');
  assert.deepEqual(residueRetirement.retired_default_surfaces, [
    'hermes_first_default_runtime',
    'gateway_first_public_entry',
    'repo_local_manager_default',
  ]);
  assert.deepEqual(residueRetirement.allowed_remaining_roles, [
    'explicit_proof_backend',
    'provenance',
    'history',
  ]);
});
