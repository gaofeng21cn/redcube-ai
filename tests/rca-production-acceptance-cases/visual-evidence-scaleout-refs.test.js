import assert from 'node:assert/strict';
import test from 'node:test';
import {
  acceptancePath,
  assertRefArray,
  assertRefString,
  evidenceFixturePath,
  readJson,
  realNoRegressionRefs,
} from '../rca-production-acceptance-shared.js';

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
    route_ref: 'contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json#/route_family_summary',
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
  assert.equal('legacy_payload_field_aliases' in scaleout, false);
  assert.equal(scaleout.owner_payload_item_summary.surface_kind, 'rca_owner_payload_item_summary');
  assert.equal(scaleout.owner_payload_item_summary.payload_kind, 'domain_owner_receipt_or_typed_blocker_refs');
  assert.equal(scaleout.owner_payload_item_summary.payload_body_allowed, false);
  assert.equal(scaleout.owner_payload_item_summary.empty_payload_template_is_success_evidence, false);
  assert.deepEqual(scaleout.owner_payload_item_summary.required_operator_payload_refs, [
    'domain_owner_receipt_refs',
    'no_regression_evidence_refs',
    'owner_chain_refs',
    'typed_blocker_refs',
  ]);
  assert.equal(
    scaleout.owner_payload_item_summary.accepted_payload_paths_ref,
    'contracts/production_acceptance/rca-production-acceptance.json#/production_evidence_scaleout_refs/accepted_payload_paths',
  );
  assert.deepEqual(
    scaleout.owner_payload_item_summary.work_items.map((item) => item.item_id),
    [
      'owner_chain_apply',
      'memory_lifecycle_receipt_scaleout',
      'temporal_controlled_visual_stage_long_soak',
      'cross_family_repeated_no_regression',
    ],
  );
  assert.deepEqual(
    scaleout.owner_payload_item_summary.work_items[0].current_payload_template,
    {
      domain_owner_receipt_refs: [],
      no_regression_evidence_refs: [],
      owner_chain_refs: [],
      typed_blocker_refs: [],
    },
  );
  assert.deepEqual(
    scaleout.owner_payload_item_summary.work_items[1].typed_blocker_path_payload,
    {
      typed_blocker_refs: ['rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending'],
    },
  );
  const temporalLongSoakSummary = scaleout.owner_payload_item_summary.work_items[2];
  assert.deepEqual(
    temporalLongSoakSummary.expected_output_refs,
    [
      'rca-long-soak:visual-stage:<soak-id>',
      'workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:<soak-id>',
    ],
  );
  assert.equal(
    temporalLongSoakSummary.temporal_readiness_refs.long_soak_evidence_action,
    'emit_temporal_controlled_visual_stage_long_soak_evidence',
  );
  assert.equal(
    temporalLongSoakSummary.temporal_readiness_refs.production_visual_stage_long_soak_complete,
    false,
  );
  assert.equal(
    scaleout.owner_payload_item_summary.work_items.every((item) => (
      item.operator_payload_submitted === false
      && item.recommended_current_payload_path === 'typed_blocker_path'
      && item.success_refs_visible_is_completion === false
      && item.payload_body_allowed === false
      && item.domain_readiness_claimed === false
      && item.production_soak_complete_claimed === false
    )),
    true,
  );
  assert.equal(scaleout.owner_payload_item_summary.authority_boundary.can_write_domain_truth, false);
  assert.equal(scaleout.owner_payload_item_summary.authority_boundary.can_create_owner_receipt, false);
  assert.equal(scaleout.owner_payload_item_summary.authority_boundary.refs_only, true);

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
  for (const evidenceRef of realNoRegressionRefs) {
    assert.equal(scaleout.repeated_no_regression_evidence_refs.evidence_refs.includes(evidenceRef), true);
  }
  assert.deepEqual(scaleout.repeated_no_regression_evidence_refs.real_runtime_evidence_refs, realNoRegressionRefs);
  assert.equal(scaleout.repeated_no_regression_evidence_refs.real_runtime_evidence_ref_count, 7);
  assert.equal(
    scaleout.repeated_no_regression_evidence_refs.opl_external_evidence_receipt_ref,
    'opl://external-evidence/redcube_ai/rca-cross-family-repeated-no-regression-20260530-6-refs',
  );
  assert.deepEqual(
    scaleout.repeated_no_regression_evidence_refs.real_runtime_evidence_provenance.map(
      (evidence) => evidence.evidence_ref,
    ),
    realNoRegressionRefs,
  );
  assert.deepEqual(scaleout.repeated_no_regression_evidence_refs.deliverable_family_refs, [
    'ppt_deck',
    'xiaohongshu',
  ]);
  assert.equal(
    scaleout.repeated_no_regression_evidence_refs.evidence_cadence,
    'cross_route_cross_window_repeated_refs_only',
  );
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
