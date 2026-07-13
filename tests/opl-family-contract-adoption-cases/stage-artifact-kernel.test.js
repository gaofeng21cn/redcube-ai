import {
  assert,
  currentProgram,
  GENERATED_STAGE_CONTROL_PLANE_REF,
  stageArtifactKernelAdoption,
  STAGE_ARTIFACT_KERNEL_ADOPTION_PATH,
  test,
} from './shared.js';

test('RCA exposes a root Stage Artifact Kernel adoption conformance entrypoint', () => {
  const adoption = stageArtifactKernelAdoption();
  const current = currentProgram();

  assert.equal(adoption.surface_kind, 'opl_stage_artifact_kernel_adoption');
  assert.equal(adoption.version, 'opl-stage-artifact-kernel-adoption.v1');
  assert.equal(adoption.owner, 'redcube_ai');
  assert.equal(adoption.domain_id, 'redcube_ai');
  assert.equal(adoption.package_id, 'rca');
  assert.equal(adoption.conformance_entrypoint, STAGE_ARTIFACT_KERNEL_ADOPTION_PATH);
  assert.equal(adoption.stage_control_plane_ref, GENERATED_STAGE_CONTROL_PLANE_REF);
  assert.equal(adoption.artifact_locator_contract_ref, 'contracts/artifact_locator_contract.json#/primary_artifact_truth');
  assert.equal(adoption.owner_receipt_contract_ref, 'contracts/owner_receipt_contract.json');
  assert.equal(adoption.conformance_validator.surface_kind, 'rca_stage_artifact_kernel_adoption_conformance_validator');
  assert.equal(adoption.conformance_validator.validator_ref, 'tests/opl-family-contract-adoption.test.js');
  assert.ok(adoption.conformance_validator.validates.includes('stage_output_role_interface'));
  assert.ok(adoption.conformance_validator.validates.includes('native_helper_manifest'));
  assert.equal(adoption.conformance_gate.surface_kind, 'opl_stage_artifact_runtime_conformance');
  assert.equal(adoption.conformance_gate.strict_units.includes('role_manifest'), true);
  assert.equal(adoption.conformance_gate.strict_units.includes('stage_receipts'), true);
  assert.equal(adoption.conformance_gate.strict_units.includes('helper_output_refs'), true);
  assert.equal(adoption.conformance_gate.fails_on.includes('missing_required_output_role'), true);
  assert.equal(adoption.conformance_gate.fails_on.includes('missing_owner_receipt_or_typed_blocker_ref'), true);
  assert.equal(adoption.conformance_gate.domain_readiness_claim, false);
  assert.equal(adoption.conformance_entrypoint, STAGE_ARTIFACT_KERNEL_ADOPTION_PATH);
  assert.equal(
    `${adoption.conformance_entrypoint}#/opl_state_index_kernel_adoption`,
    `${STAGE_ARTIFACT_KERNEL_ADOPTION_PATH}#/opl_state_index_kernel_adoption`,
  );
  assert.deepEqual(adoption.stage_folder_unit, [
    'Stage Folder',
    'Manifest',
    'Receipt',
    'current pointer',
  ]);
  assert.deepEqual(adoption.stage_output_role_interface.canonical_roles, [
    'source_truth_pack',
    'material_inventory',
    'strategy_brief',
    'visual_direction',
    'render_manifest',
    'review_verdict',
    'export_bundle',
    'handoff_manifest',
  ]);
  assert.equal(adoption.stage_output_role_interface.file_name_is_interface, false);
  assert.equal(adoption.stage_output_role_interface.role_manifest_receipt_is_interface, true);
  assert.equal(adoption.review_repair_export_receipts.required, true);
  assert.deepEqual(adoption.review_repair_export_receipts.routes, [
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
  assert.equal(
    adoption.stage_folder_writer_closeout_authority.closeout_ref_signer,
    'redcube_ai_domain_family_runtime',
  );
  assert.equal(adoption.stage_folder_writer_closeout_authority.domain_family_runtime_may_issue_owner_receipt_refs, true);
  assert.equal(adoption.stage_folder_writer_closeout_authority.domain_family_runtime_may_issue_typed_blocker_refs, true);
  assert.equal(adoption.stage_folder_writer_closeout_authority.writer_may_synthesize_owner_receipt_refs, false);
  assert.equal(adoption.stage_folder_writer_closeout_authority.writer_may_synthesize_typed_blocker_refs, false);
  assert.equal(adoption.stage_folder_writer_closeout_authority.route_helper_may_synthesize_owner_receipt_refs, false);
  assert.equal(adoption.stage_folder_writer_closeout_authority.route_helper_may_synthesize_typed_blocker_refs, false);
  assert.equal(adoption.native_helper_manifest.required_for_canonical_current_or_ready_claim, true);
  assert.equal(adoption.native_helper_manifest.required_for_progress, false);
  assert.equal(
    adoption.native_helper_manifest.failure_shape,
    'quality_debt_or_hard_stop_only_when_no_readable_artifact',
  );
  assert.equal(adoption.artifact_gallery_handoff_shell.owner, 'one-person-lab');
  assert.equal(adoption.artifact_gallery_handoff_shell.rca_role, 'artifact_authority_and_export_authorization_refs');
  assert.equal(adoption.kernel_refs.physical_stage_folder_source_of_truth, true);
  assert.equal(adoption.kernel_refs.derived_index_rebuildable, true);
  assert.equal(adoption.kernel_refs.manifest_receipt_hash_required, true);
  assert.equal(adoption.kernel_refs.status_source_of_truth, 'physical_stage_folder');
  assert.equal(adoption.kernel_refs.orphan_artifact_is_completion, false);
  assert.equal(adoption.kernel_refs.readable_orphan_artifact_is_progress_input, true);
  assert.equal(adoption.kernel_refs.conformance_failure_blocks_stage_progress, false);
  assert.equal(adoption.opl_state_index_kernel_adoption.surface_kind, 'opl_state_index_kernel_sidecar_adoption');
  assert.equal(adoption.opl_state_index_kernel_adoption.owner, 'one-person-lab');
  assert.equal(adoption.opl_state_index_kernel_adoption.consumer, 'redcube_ai');
  assert.equal(adoption.opl_state_index_kernel_adoption.adoption_status, 'deferred_until_measured_trigger');
  assert.equal(adoption.opl_state_index_kernel_adoption.sqlite_enabled_now, false);
  assert.equal(adoption.opl_state_index_kernel_adoption.index_backend, 'sqlite_sidecar_index');
  assert.equal(adoption.opl_state_index_kernel_adoption.sidecar_owner, 'one-person-lab');
  assert.equal(adoption.opl_state_index_kernel_adoption.sidecar_is_domain_runtime, false);
  assert.deepEqual(adoption.opl_state_index_kernel_adoption.allowed_index_entities, [
    'session',
    'deliverable',
    'route',
    'artifact',
    'review',
    'export',
  ]);
  assert.deepEqual(adoption.opl_state_index_kernel_adoption.allowed_payload_classes, [
    'locator',
    'hash',
    'provenance',
    'manifest_ref',
    'receipt_ref',
    'route_ref',
    'lineage_ref',
  ]);
  assert.deepEqual(adoption.opl_state_index_kernel_adoption.rebuild_policy, {
    rebuildable: true,
    delete_safe: true,
    source_of_rebuild: 'RCA file authority plus Stage Folder manifests and artifact refs',
    git_tracked: false,
  });
  for (const forbidden of [
    'PNG body',
    'PPTX body',
    'PDF body',
    'visual artifact blob',
    'canonical artifact truth',
    'visual-domain truth',
    'review/export judgment',
    'owner receipt body',
    'visual memory body',
  ]) {
    assert.ok(adoption.opl_state_index_kernel_adoption.forbidden_storage.includes(forbidden));
  }
  assert.deepEqual(adoption.opl_state_index_kernel_adoption.authority_boundary, {
    opl_owns_state_index_kernel: true,
    opl_can_store_refs_hashes_provenance: true,
    opl_can_rebuild_sidecar_index: true,
    rca_owns_file_authority: true,
    rca_owns_artifact_index_truth: true,
    rca_owns_visual_truth: true,
    rca_owns_review_export_verdict: true,
    rca_owns_artifact_authority: true,
    sqlite_can_be_truth_source: false,
    sqlite_can_store_visual_artifact_body: false,
    sqlite_can_store_review_export_judgment: false,
  });
  assert.equal(adoption.stage_artifact_runtime_ref, 'contracts/artifact_locator_contract.json#/primary_artifact_truth');
  assert.equal(adoption.stage_artifact_runtime_contract_id, adoption.stage_artifact_runtime_ref);
  assert.deepEqual(adoption.authority_boundary, {
    opl_can_index_refs: true,
    opl_can_rebuild_projection: true,
    opl_can_provide_gallery_handoff_shell: true,
    opl_can_create_domain_owner_receipt: false,
    opl_can_create_rca_owner_receipt: false,
    opl_can_write_domain_truth: false,
    opl_can_write_rca_visual_truth: false,
    opl_can_write_memory_body: false,
    opl_can_mutate_domain_artifact_body: false,
    opl_can_mutate_rca_artifact_body: false,
    opl_can_authorize_quality_or_export: false,
    opl_can_declare_visual_or_quality_verdict: false,
  });
  assert.equal(adoption.visual_ready_claimed, false);
  assert.equal(adoption.exportable_claimed, false);
  assert.equal(adoption.handoffable_claimed, false);
  assert.equal(adoption.domain_ready_claimed, false);
  assert.equal(adoption.production_ready_claimed, false);
  assert.equal(
    current.product_release_metadata.stage_artifact_kernel_adoption.contract_ref,
    STAGE_ARTIFACT_KERNEL_ADOPTION_PATH,
  );
  assert.equal(
    current.product_release_metadata.stage_artifact_kernel_adoption.opl_state_index_kernel_adoption_ref,
    `${STAGE_ARTIFACT_KERNEL_ADOPTION_PATH}#/opl_state_index_kernel_adoption`,
  );
  assert.equal(
    current.product_release_metadata.stage_artifact_kernel_adoption.opl_state_index_kernel_adoption.sqlite_enabled_now,
    false,
  );
  assert.equal(
    current.product_release_metadata.stage_artifact_kernel_adoption.opl_state_index_kernel_adoption.sqlite_can_store_visual_artifact_body,
    false,
  );
  assert.equal(
    current.current_state.stage_artifact_kernel_adoption.contract_ref,
    STAGE_ARTIFACT_KERNEL_ADOPTION_PATH,
  );
  assert.equal(
    current.current_state.stage_artifact_kernel_adoption.opl_state_index_kernel_adoption.sqlite_can_store_review_export_judgment,
    false,
  );
  assert.equal(
    current.current_state.active_baton.scope.stage_artifact_kernel_adoption.contract_ref,
    STAGE_ARTIFACT_KERNEL_ADOPTION_PATH,
  );
  assert.equal(
    current.current_state.active_baton.scope.stage_artifact_kernel_adoption.opl_state_index_kernel_adoption.sqlite_can_be_truth_source,
    false,
  );
});
