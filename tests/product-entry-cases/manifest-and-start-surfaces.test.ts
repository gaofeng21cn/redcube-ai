// @ts-nocheck
import {
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  assertFamilyOrchestrationCompanion,
  assertRuntimeLoopClosureShape,
  execFileSync,
  getProductEntryManifest,
  getProductStatus,
  getProductPreflight,
  importGatewaySharedModule,
  test,
  withMockHermesAndRuntimeState,
  prepareProductEntryWorkspace,
} from '../gateway-case-shared.ts';


test('getProductEntryManifest projects the current direct-entry shell and shared OPL handoff truth', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async ({ runtimeStateRoot }) => {
    const sharedCompanions = await importGatewaySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();

    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });

    assert.equal(manifest.ok, true);
    assert.equal(manifest.surface_kind, 'product_entry_manifest');
    assert.equal(manifest.manifest_version, 2);
    assert.equal(manifest.manifest_kind, 'redcube_product_entry_manifest');
    assert.equal(manifest.target_domain_id, 'redcube_ai');
    assert.equal(manifest.formal_entry.default, 'CLI');
    assert.deepEqual(manifest.formal_entry.supported_protocols, ['MCP']);
    assert.equal(manifest.workspace_locator.workspace_surface_kind, 'redcube_workspace');
    assert.equal(manifest.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(manifest.recommended_shell, 'direct');
    assert.equal(manifest.recommended_command, 'redcube product invoke');
    assert.equal(manifest.entry_status_surface.shell_key, 'status');
    assert.equal(manifest.entry_status_surface.command, 'redcube product status');
    assert.equal(manifest.entry_status_surface.surface_kind, 'product_status');
    assert.match(manifest.entry_status_surface.summary, /product-entry overview/i);
    assert.deepEqual(manifest.product_entry_surface, manifest.entry_status_surface);
    assert.equal(manifest.operator_loop_surface.shell_key, 'direct');
    assert.equal(manifest.operator_loop_surface.command, 'redcube product invoke');
    assert.equal(manifest.operator_loop_surface.surface_kind, 'product_entry');
    assert.equal(manifest.operator_loop_surface.continuation_shell_key, 'session');
    assert.equal(manifest.operator_loop_surface.continuation_command, 'redcube product session');
    assert.match(manifest.operator_loop_surface.summary, /entry_session_id/);
    assert.equal(manifest.operator_loop_actions.start_deliverable.command, 'redcube product invoke');
    assert.equal(manifest.operator_loop_actions.start_deliverable.surface_kind, 'product_entry');
    assert.deepEqual(manifest.operator_loop_actions.start_deliverable.requires, ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id']);
    assert.equal(manifest.operator_loop_actions.continue_session.command, 'redcube product session');
    assert.deepEqual(manifest.operator_loop_actions.continue_session.requires, ['entry_session_id']);
    assert.equal(manifest.operator_loop_actions.opl_hosted_handoff.command, 'opl_framework:hosted_product_entry');
    assert.equal(manifest.product_entry_quickstart.surface_kind, 'product_entry_quickstart');
    assert.equal(manifest.product_entry_quickstart.recommended_step_id, 'open_status');
    assert.deepEqual(manifest.product_entry_quickstart.human_gate_ids, ['redcube_operator_review_gate']);
    assert.deepEqual(
      manifest.product_entry_quickstart.steps.map((step) => step.step_id),
      ['open_status', 'continue_current_loop', 'inspect_current_progress', 'default_image_ppt_proof', 'optional_native_ppt_proof'],
    );
    assert.equal(
      manifest.product_entry_quickstart.steps[0].command,
      `redcube product status --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      manifest.product_entry_quickstart.steps[1].command,
      `redcube product invoke --workspace-root ${workspaceRoot} --entry-session-id <entry-session-id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`,
    );
    assert.deepEqual(manifest.product_entry_quickstart.steps[2].requires, ['entry_session_id']);
    assert.equal(manifest.product_entry_quickstart.steps[3].surface_kind, 'image_ppt_product_entry_proof');
    assert.match(manifest.product_entry_quickstart.steps[3].command, /redcube image-ppt proof/);
    assert.equal(manifest.product_entry_quickstart.steps[4].surface_kind, 'native_ppt_product_entry_proof');
    assert.match(manifest.product_entry_quickstart.steps[4].command, /redcube native-ppt proof/);
    assert.equal(manifest.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(
      manifest.product_entry_overview.summary,
      'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`status` 是当前 product overview 命令，成熟终端用户前台壳与 managed web productization 仍未 landed。',
    );
    assert.equal(manifest.product_entry_overview.product_entry_command, 'redcube product status');
    assert.equal(manifest.product_entry_overview.entry_status_command, 'redcube product status');
    assert.equal(manifest.product_entry_overview.recommended_command, 'redcube product invoke');
    assert.equal(manifest.product_entry_overview.operator_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_overview.progress_surface, {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      step_id: 'inspect_current_progress',
    });
    assert.deepEqual(manifest.product_entry_overview.resume_surface, {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    });
    assert.equal(manifest.product_entry_overview.recommended_step_id, 'open_status');
    assert.deepEqual(manifest.product_entry_overview.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(manifest.product_entry_start.recommended_mode_id, 'open_status');
    assert.deepEqual(
      manifest.product_entry_start.modes.map((mode) => mode.mode_id),
      ['open_status', 'start_direct_session', 'opl_hosted_handoff', 'resume_session'],
    );
    assert.equal(
      manifest.product_entry_start.modes[0].command,
      `redcube product status --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(
      manifest.product_entry_start.modes[1].requires,
      ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    );
    assert.equal(manifest.product_entry_start.modes[2].surface_kind, 'opl_hosted_product_entry');
    assert.equal(manifest.product_entry_start.modes[3].surface_kind, 'product_entry_session');
    assert.deepEqual(manifest.product_entry_start.resume_surface, {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    });
    assert.deepEqual(manifest.product_entry_start.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(
      manifest.product_entry_preflight.summary,
      'Current product-entry preflight passed; inspect the workspace doctor output and then read the RedCube product-entry overview via the `status` command.',
    );
    assert.equal(manifest.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      manifest.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      manifest.product_entry_preflight.recommended_start_command,
      `redcube product status --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(manifest.product_entry_preflight.blocking_check_ids, []);
    assert.deepEqual(
      manifest.product_entry_preflight.checks.map((check) => check.check_id),
      [
        'workspace_root_resolved',
        'workspace_contract_present',
        'runtime_state_root_ready',
        'product_entry_overview_contract_landed',
      ],
    );
    assert.equal(manifest.product_entry_preflight.checks[0].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[1].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[2].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[3].status, 'pass');
    assert.equal(manifest.repo_mainline.program_id, 'redcube-runtime-program');
    assert.equal(manifest.repo_mainline.phase_id, 'repo_verified_product_entry_and_opl_hosted_handoff');
    assert.equal(manifest.repo_mainline.active_baton_id, 'managed_product_entry_hardening');
    assert.equal(
      manifest.product_entry_status.summary,
      'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`status` 是当前 product overview 命令，成熟终端用户前台壳与 managed web productization 仍未 landed。',
    );
    assert.equal(manifest.product_entry_status.remaining_gaps_count, 2);
    assert.deepEqual(manifest.product_entry_status.next_focus, [
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
      '继续把 OPL-hosted stage runtime handoff 与同一 downstream product-entry contract 对齐。',
    ]);
    assert.equal(manifest.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(manifest.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(manifest.product_entry_readiness.usable_now, true);
    assert.equal(manifest.product_entry_readiness.good_to_use_now, false);
    assert.equal(manifest.product_entry_readiness.fully_automatic, false);
    assert.equal(manifest.product_entry_readiness.recommended_start_surface, 'product_status');
    assert.equal(manifest.product_entry_readiness.recommended_start_command, 'redcube product status');
    assert.equal(manifest.product_entry_readiness.recommended_loop_surface, 'product_entry');
    assert.equal(manifest.product_entry_readiness.recommended_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_readiness.blocking_gaps, [
      '成熟的最终用户前台壳仍未 landed。',
      'managed web productization 仍未 landed。',
    ]);
    assert.equal(manifest.runtime.runtime_owner, 'codex_cli');
    assert.equal(manifest.runtime.runtime_state_root, runtimeStateRoot);
    assert.deepEqual(manifest.managed_runtime_contract, {
      shared_contract_ref: 'contracts/opl-framework/managed-runtime-three-layer-contract.json',
      runtime_owner: 'codex_cli',
      domain_owner: 'redcube_ai',
      executor_owner: 'codex_cli',
      supervision_status_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      attention_queue_surface: {
        surface_kind: 'product_status',
        owner: 'redcube_ai',
      },
      recovery_contract_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      fail_closed_rules: [
        'domain_supervision_cannot_bypass_runtime',
        'executor_cannot_declare_global_gate_clear',
        'runtime_cannot_invent_domain_publishability_truth',
      ],
    });
    assert.equal(manifest.runtime_inventory.surface_kind, 'runtime_inventory');
    assert.equal(manifest.runtime_inventory.runtime_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.domain_owner, 'redcube_ai');
    assert.equal(manifest.runtime_inventory.executor_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.status_surface.ref, '/product_entry_preflight');
    assert.equal(manifest.runtime_inventory.attention_surface.ref, '/status_surface');
    assert.equal(manifest.runtime_inventory.recovery_surface.ref, '/operator_loop_actions/continue_session');
    assert.equal(manifest.runtime_inventory.workspace_binding.workspace_root, workspaceRoot);
    assert.equal(manifest.runtime_inventory.workspace_binding.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.runtime_inventory.workspace_binding.session_store_root, manifest.runtime.session_store_root);
    assert.equal(manifest.task_lifecycle.surface_kind, 'task_lifecycle');
    assert.equal(manifest.task_lifecycle.task_kind, 'visual_deliverable_loop');
    assert.equal(manifest.task_lifecycle.task_id, 'managed_product_entry_hardening');
    assert.equal(manifest.task_lifecycle.status, 'resumable');
    assert.equal(
      manifest.task_lifecycle.progress_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(
      manifest.task_lifecycle.resume_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(manifest.task_lifecycle.checkpoint_summary.surface_kind, 'checkpoint_summary');
    assert.equal(manifest.task_lifecycle.checkpoint_summary.status, 'operator_review_required');
    assert.deepEqual(manifest.task_lifecycle.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.persistence_policy.surface_kind, 'family_persistence_policy');
    assert.equal(manifest.persistence_policy.policy_id, 'redcube_product_entry_persistence_policy');
    assert.equal(manifest.persistence_policy.authority_surfaces[0].storage_role, 'file_authority');
    assert.equal(manifest.lifecycle_ledger.surface_kind, 'family_lifecycle_ledger');
    assert.equal(manifest.lifecycle_ledger.actions[0].action_id, 'verify_redcube_product_entry_manifest');
    assert.equal(manifest.owner_route.surface_kind, 'family_owner_route');
    assert.equal(manifest.owner_route.next_owner, 'redcube_ai');
    assert.equal(manifest.family_action_catalog.surface_kind, 'family_action_catalog');
    assert.equal(manifest.family_action_catalog.version, 'family-action-catalog.v1');
    assert.equal(manifest.family_action_catalog.catalog_id, 'redcube_product_entry_action_catalog');
    assert.equal(manifest.family_action_catalog.target_domain_id, 'redcube_ai');
    assert.equal(manifest.family_action_catalog.owner, 'redcube_ai');
    assert.deepEqual(manifest.family_action_catalog.authority_boundary, {
      domain_truth_owner: 'redcube_ai',
      opl_role: 'projection_consumer_only',
      write_policy: 'no_domain_truth_writes',
    });
    assert.deepEqual(
      manifest.family_action_catalog.actions.map((action) => action.action_id),
      [
        'get_product_status',
        'get_product_start',
        'get_product_preflight',
        'invoke_product_entry',
        'get_product_entry_session',
        'get_product_entry_manifest',
        'export_product_sidecar',
        'dispatch_product_sidecar',
        'run_image_ppt_proof',
        'run_native_ppt_proof',
        'invoke_domain_entry',
      ],
    );
    assert.deepEqual(
      manifest.family_action_catalog.actions
        .filter((action) => action.supported_surfaces.skill)
        .map((action) => action.source_command.command),
      [
        'redcube product status',
        'redcube product invoke',
        'redcube product session',
        'redcube image-ppt proof',
        'redcube native-ppt proof',
      ],
    );
    assert.equal(manifest.family_action_catalog_parity.surface_kind, 'family_action_catalog_parity');
    assert.equal(manifest.family_action_catalog_parity.status, 'aligned');
    assert.deepEqual(manifest.family_action_catalog_parity.issues, []);
    assert.equal(manifest.family_stage_control_plane.surface_kind, 'family_stage_control_plane');
    assert.equal(manifest.family_stage_control_plane.version, 'family-stage-control-plane.v1');
    assert.equal(manifest.family_stage_control_plane.plane_id, 'redcube_ai_stage_control_plane');
    assert.equal(manifest.family_stage_control_plane.target_domain_id, 'redcube_ai');
    assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_role, 'projection_consumer_only');
    assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_visual_truth, true);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_review_publication_projection, true);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_artifact_authority, true);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_schedule_stage, false);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_visual_truth, false);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_review_truth, false);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_publication_projection, false);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.default_ppt_route_changed, false);
    assert.equal(manifest.family_stage_control_plane.authority_boundary.managed_deliverable_runtime_changed, false);
    assert.equal(manifest.family_stage_control_plane.freshness.status, 'current');
    assert.equal(manifest.family_stage_control_plane.freshness.checked_at, 'manifest_build');
    assert.equal(manifest.family_stage_control_plane.stage_action_parity.status, 'aligned');
    assert.deepEqual(manifest.family_stage_control_plane.stage_action_parity.missing_action_refs, []);
    assert.equal(
      manifest.family_stage_control_plane.source_refs.some((sourceRef) => sourceRef.ref === '/family_action_catalog'),
      true,
    );
    assert.deepEqual(
      manifest.family_stage_control_plane.stages.map((stage) => stage.stage_id),
      [
        'source_intake',
        'communication_strategy',
        'visual_direction',
        'artifact_creation',
        'review_and_revision',
        'package_and_handoff',
      ],
    );
    const catalogActionIds = new Set(manifest.family_action_catalog.actions.map((action) => action.action_id));
    for (const stage of manifest.family_stage_control_plane.stages) {
      assert.equal(stage.owner, 'redcube_ai');
      assert.equal(typeof stage.goal, 'string');
      assert.equal(stage.goal.length > 20, true);
      assert.equal(stage.skills.some((skill) => skill.ref === 'redcube-ai'), true);
      assert.equal(stage.source_refs.some((sourceRef) => sourceRef.ref === '/family_action_catalog'), true);
      assert.equal(stage.source_refs.some((sourceRef) => sourceRef.ref === '/review_state'), true);
      assert.equal(stage.source_refs.some((sourceRef) => sourceRef.ref === '/publication_projection'), true);
      assert.equal(stage.freshness.status, 'current');
      assert.equal(stage.freshness.checked_at, 'manifest_build');
      assert.equal(stage.action_parity.status, 'aligned');
      assert.deepEqual(stage.action_parity.missing_action_refs, []);
      for (const actionRef of stage.allowed_action_refs) {
        assert.equal(catalogActionIds.has(actionRef), true);
      }
      assert.equal(stage.handoff.next_owner, 'redcube_ai');
      assert.equal(stage.handoff.resume_surface_ref, '/session_continuity');
      assert.equal(stage.handoff.artifact_surface_ref, '/artifact_inventory');
      assert.equal(stage.authority_boundary.domain_truth_owner, 'redcube_ai');
      assert.equal(stage.authority_boundary.visual_truth_owner, 'redcube_ai');
      assert.equal(stage.authority_boundary.artifact_authority_owner, 'redcube_ai');
      assert.equal(stage.authority_boundary.review_publication_projection_owner, 'redcube_ai');
      assert.equal(stage.authority_boundary.opl_role, 'projection_consumer_only');
      assert.equal(stage.authority_boundary.opl_can_schedule_stage, false);
      assert.equal(stage.authority_boundary.opl_can_write_visual_truth, false);
      assert.equal(stage.authority_boundary.opl_can_write_review_truth, false);
      assert.equal(stage.authority_boundary.opl_can_write_publication_projection, false);
      assert.equal(stage.authority_boundary.default_ppt_route_changed, false);
      assert.equal(stage.authority_boundary.managed_deliverable_runtime_changed, false);
    }
    const artifactStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'artifact_creation');
    assert.deepEqual(artifactStage.domain_stage_refs, ['author_image_pages', 'render_html', 'author_pptx_native']);
    assert.deepEqual(artifactStage.allowed_action_refs, ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof']);
    assert.equal(artifactStage.authority_boundary.default_ppt_route_changed, false);
    assert.equal(artifactStage.authority_boundary.managed_deliverable_runtime_changed, false);
    assert.equal(manifest.domain_agent_skeleton_adapter.surface_kind, 'domain_agent_skeleton_adapter');
    assert.equal(manifest.domain_agent_skeleton_adapter.adapter_id, 'rca.domain-agent.skeleton.adapter.v1');
    assert.equal(manifest.domain_agent_skeleton_adapter.mapping_model, 'manifest_descriptor_mapping_only');
    assert.equal(manifest.domain_agent_skeleton_adapter.repo_source_boundary.physical_relayout_required_now, false);
    assert.deepEqual(
      manifest.domain_agent_skeleton_adapter.repo_source_boundary.allowed_roots.map((root) => root.boundary_id),
      ['agent', 'contracts', 'runtime', 'docs'],
    );
    assert.equal(manifest.domain_agent_skeleton_adapter.repo_source_boundary.repo_tracks_runtime_artifact_blobs, false);
    assert.deepEqual(manifest.domain_agent_skeleton_adapter.runtime_declarations.declares_only, [
      'product_sidecar_adapter',
      'projection_builder',
      'lifecycle_adapter',
      'domain_memory_descriptor_locator',
    ]);
    assert.equal(manifest.domain_agent_skeleton_adapter.runtime_declarations.sidecar_adapter_ref, '/product_entry_shell/sidecar');
    assert.equal(manifest.domain_agent_skeleton_adapter.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
    assert.equal(manifest.domain_agent_skeleton_adapter.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
    assert.equal(manifest.domain_agent_skeleton_adapter.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
    assert.equal(manifest.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
    assert.equal(manifest.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
    assert.equal(manifest.artifact_locator_contract.workspace_runtime_artifact_root.workspace_root, workspaceRoot);
    assert.equal(manifest.artifact_locator_contract.workspace_runtime_artifact_root.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.artifact_locator_contract.workspace_runtime_artifact_root.session_store_root, manifest.runtime.session_store_root);
    assert.equal(manifest.artifact_locator_contract.repo_source_boundary.repo_tracks_visual_or_export_artifact_blobs, false);
    assert.equal(manifest.artifact_locator_contract.opl_consumption_policy.forbidden.includes('declare_visual_export_verdict'), true);
    assert.equal(manifest.domain_memory_descriptor_locator.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
    assert.equal(manifest.domain_memory_descriptor_locator.locator_id, 'rca.visual_pattern_memory.locator.v1');
    assert.equal(manifest.domain_memory_descriptor_locator.memory_family, 'visual_pattern_memory');
    assert.equal(manifest.domain_memory_descriptor_locator.memory_model, 'natural_language_pattern_cards');
    assert.equal(manifest.domain_memory_descriptor_locator.policy_ref.ref_kind, 'human_doc');
    assert.equal(manifest.domain_memory_descriptor_locator.policy_ref.ref, 'human_doc:visual_pattern_memory_policy');
    assert.equal(manifest.domain_memory_descriptor_locator.human_doc_ref.ref_kind, 'human_doc');
    assert.equal(manifest.domain_memory_descriptor_locator.human_doc_ref.ref, 'human_doc:domain_memory_descriptor_locator');
    assert.deepEqual(manifest.domain_memory_descriptor_locator.memory_locator.opl_consumable_fields, [
      'memory_id',
      'stage_scope',
      'deliverable_family',
      'provenance_refs',
      'content_ref',
      'writeback_receipt_ref',
    ]);
    assert.deepEqual(manifest.domain_memory_descriptor_locator.writeback_receipt_contract.forbidden_receipt_fields, [
      'memory_content_body',
      'visual_verdict',
      'export_verdict',
      'review_verdict',
      'canonical_artifact_blob',
    ]);
    assert.equal(manifest.domain_memory_descriptor_locator.migration_plan.plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
    assert.equal(
      manifest.domain_memory_descriptor_locator.migration_plan.state,
      'repo_source_contract_landed_runtime_migration_pending',
    );
    assert.deepEqual(manifest.domain_memory_descriptor_locator.migration_plan.repository_boundary, {
      repo_tracks_migration_plan: true,
      repo_tracks_seed_locator_contract: true,
      repo_tracks_memory_entries: false,
      repo_tracks_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      visual_truth_changed: false,
      route_truth_changed: false,
    });
    assert.deepEqual(manifest.domain_memory_descriptor_locator.seed_fixture_locator.required_locator_fields, [
      'seed_id',
      'source_review_ref',
      'stage_scope',
      'deliverable_family',
      'reusable_lesson_ref',
      'provenance_refs',
      'migration_status',
    ]);
    assert.equal(
      manifest.domain_memory_descriptor_locator.seed_fixture_locator.forbidden_seed_fields.includes('memory_content_body'),
      true,
    );
    assert.equal(
      manifest.domain_memory_descriptor_locator.seed_fixture_locator.forbidden_seed_fields.includes('canonical_artifact_blob'),
      true,
    );
    assert.equal(
      manifest.domain_memory_descriptor_locator.writeback_receipt_locator.locator_id,
      'rca.visual_pattern_memory.writeback_receipt_locator.v1',
    );
    assert.equal(
      manifest.domain_memory_descriptor_locator.writeback_receipt_locator.repo_tracks_receipt_instances,
      false,
    );
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.memory_content_owner, 'redcube_ai');
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.route_truth_owner, 'redcube_ai');
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.review_export_verdict_owner, 'redcube_ai');
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.artifact_authority_owner, 'redcube_ai');
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.opl_role, 'locator_ref_receipt_consumer_only');
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.opl_can_hold_memory_content, false);
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.opl_can_choose_visual_route, false);
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.opl_can_issue_review_or_export_verdict, false);
    assert.equal(manifest.domain_memory_descriptor_locator.authority_boundary.opl_can_mutate_canonical_artifacts, false);
    assert.equal(manifest.product_sidecar_receipt_refs.receipt_contract_id, 'rca.product_sidecar.receipt_refs.v1');
    assert.equal(manifest.product_sidecar_receipt_refs.forbidden_receipt_fields.includes('visual_verdict'), true);
    assert.equal(manifest.product_sidecar_receipt_refs.forbidden_receipt_fields.includes('artifact_blob'), true);
    assert.equal(manifest.controlled_visual_stage_attempt.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
    assert.equal(manifest.controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_descriptor_refs, true);
    assert.equal(manifest.controlled_visual_stage_attempt.opl_policy_proof.opl_consumes_artifact_refs, true);
    assert.equal(manifest.controlled_visual_stage_attempt.opl_policy_proof.opl_holds_visual_verdict, false);
    assert.equal(manifest.controlled_visual_stage_attempt.opl_policy_proof.opl_holds_export_verdict, false);
    assert.equal(manifest.controlled_visual_stage_attempt.projection_only_result.visual_export_verdict, null);
    assert.equal(manifest.opl_family_lifecycle_adapter.persistence.artifact_locator_contract_ref.ref, '/artifact_locator_contract');
    assert.deepEqual(
      manifest.action_metadata.product_entry.map((entry) => [entry.action_key, entry.command, entry.surface_kind]),
      [
        ['get_product_status', 'redcube product status', 'product_status'],
        ['get_product_start', 'redcube product start', 'product_entry_start'],
        ['get_product_preflight', 'redcube product preflight', 'product_entry_preflight'],
        ['start_deliverable', 'redcube product invoke', 'product_entry'],
        ['continue_session', 'redcube product session', 'product_entry_session'],
        ['get_product_entry_manifest', 'redcube product manifest', 'product_entry_manifest'],
        ['export_product_sidecar', 'redcube product sidecar export', 'product_sidecar_export'],
        ['dispatch_product_sidecar', 'redcube product sidecar dispatch', 'product_sidecar_dispatch'],
        ['run_image_ppt_proof', 'redcube image-ppt proof', 'image_ppt_product_entry_proof'],
        ['run_native_ppt_proof', 'redcube native-ppt proof', 'native_ppt_product_entry_proof'],
        ['invoke_domain_entry', 'redcube service-safe domain entry', 'domain_entry'],
      ],
    );
    assert.equal(manifest.skill_catalog.surface_kind, 'skill_catalog');
    assert.equal(manifest.skill_catalog.skills.length, 1); assert.equal(manifest.skill_catalog.skills.some((skill) => skill.skill_id === 'ui-ux-pro-max'), false);
    assert.deepEqual(manifest.skill_catalog.supported_commands, [
      'redcube product status',
      'redcube product invoke',
      'redcube product session',
      'redcube image-ppt proof',
      'redcube native-ppt proof',
    ]);
    assert.equal(manifest.skill_catalog.command_contracts.length, 5);
    assert.deepEqual(
      manifest.skill_catalog.command_contracts.map((contract) => [
        contract.action_id,
        contract.command,
        contract.target_surface_kind,
      ]),
      [
        ['get_product_status', 'redcube product status', 'product_status'],
        ['invoke_product_entry', 'redcube product invoke', 'product_entry'],
        ['get_product_entry_session', 'redcube product session', 'product_entry_session'],
        ['run_image_ppt_proof', 'redcube image-ppt proof', 'image_ppt_product_entry_proof'],
        ['run_native_ppt_proof', 'redcube native-ppt proof', 'native_ppt_product_entry_proof'],
      ],
    );
    assert.equal(manifest.skill_catalog.skills[0].skill_id, 'redcube-ai');
    assert.equal(manifest.skill_catalog.skills[0].title, 'RedCube AI');
    assert.equal(manifest.skill_catalog.skills[0].command, 'redcube product status');
    assert.equal(manifest.skill_catalog.skills[0].target_surface_kind, 'product_status');
    assert.deepEqual(manifest.skill_catalog.skills[0].tags, ['domain-app', 'product-entry', 'visual-deliverables']);
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.domain_memory_descriptor_locator_ref,
      {
        ref_kind: 'json_pointer',
        ref: '/domain_memory_descriptor_locator',
        label: 'RCA visual pattern memory descriptor locator',
      },
    );
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.skill_activation,
      {
        plugin_name: 'redcube-ai',
        skill_semantics: 'single_domain_app_skill',
        canonical_entry_semantics: 'agent_facing_product_entry_overview',
        entry_shell_key: 'status',
        entry_command: 'redcube product status',
        supporting_shell_keys: ['direct', 'session'],
        shell_commands: {
          status: {
            command: 'redcube product status',
            target_surface_kind: 'product_status',
          },
          direct: {
            command: 'redcube product invoke',
            target_surface_kind: 'product_entry',
          },
          session: {
            command: 'redcube product session',
            target_surface_kind: 'product_entry_session',
          },
          image_ppt_proof: {
            command: 'redcube image-ppt proof',
            target_surface_kind: 'image_ppt_product_entry_proof',
            role: 'controlled_operator_helper',
          },
          native_ppt_proof: {
            command: 'redcube native-ppt proof',
            target_surface_kind: 'native_ppt_product_entry_proof',
            role: 'controlled_operator_helper',
          },
        },
      },
    );
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.runtime_continuity,
      {
        surface_kind: 'skill_runtime_continuity',
        runtime_owner: 'codex_cli',
        domain_owner: 'redcube_ai',
        executor_owner: 'codex_cli',
        session_locator_field: 'entry_session_contract.entry_session_id',
        session_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/entry_session',
          label: 'entry session surface',
        },
        progress_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/progress_projection',
          label: 'progress projection surface',
        },
        artifact_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/artifact_inventory',
          label: 'artifact inventory surface',
        },
        restore_point_surface_ref: {
          ref_kind: 'json_pointer',
          ref: '/session_continuity/restore_point',
          label: 'restore point surface',
        },
        recommended_resume_command: 'redcube product session --entry-session-id <entry-session-id>',
        recommended_progress_command: 'redcube product session --entry-session-id <entry-session-id>',
        recommended_artifact_command: 'redcube product session --entry-session-id <entry-session-id>',
      },
    );
    assert.equal(manifest.automation.surface_kind, 'automation');
    assert.equal(manifest.automation.automations.length, 2);
    assert.equal(manifest.automation.automations[0].automation_id, 'redcube_autopilot_continuation_board');
    assert.equal(manifest.automation.automations[0].trigger_kind, 'continuation_board');
    assert.equal(manifest.automation.automations[0].readiness_status, 'tracked_follow_on');
    assert.equal(manifest.automation.automations[0].gate_policy, 'operator_review_gated');
    assert.equal(manifest.automation.automations[1].automation_id, 'redcube_operator_review_gate');
    assert.equal(manifest.automation.automations[1].trigger_kind, 'operator_review_gate');
    assert.equal(manifest.automation.automations[1].readiness_status, 'repo_tracked');
    assert.equal(manifest.automation.automations[1].gate_policy, 'human_gate_required');
    assert.equal(manifest.product_entry_shell.status.command, 'redcube product status');
    assert.equal(manifest.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifest.product_entry_shell.opl_hosted.command, 'opl_framework:hosted_product_entry');
    assert.equal(manifest.product_entry_shell.session.command, 'redcube product session');
    assert.equal(manifest.product_entry_shell.sidecar.command, 'redcube product sidecar');
    assert.equal(manifest.product_entry_shell.sidecar.runtime_owner, 'configured_family_runtime_provider');
    assert.equal(manifest.product_entry_shell.sidecar.provider_transport_owner, 'opl_family_runtime_provider');
    assert.equal(manifest.product_entry_shell.sidecar.control_plane_owner, 'opl');
    assert.deepEqual(manifest.product_entry_shell.sidecar.allowed_actions, [
      'runtime_watch',
      'supervise_managed_run',
      'product_entry_continuation',
      'notification_receipt',
    ]);
    assert.match(manifest.product_entry_shell.status.purpose, /product-entry overview/i);
    assert.equal(
      manifest.product_entry_shell.status.canonical_entry_semantics,
      'agent_facing_product_entry_overview',
    );
    assert.equal(manifest.product_entry_shell.status.command_key, 'status');
    assert.equal(manifest.product_entry_shell.status.claims_gui_shell, false);
    assert.match(manifest.product_entry_shell.direct.purpose, /deliverable loop/i);
    assert.equal(manifest.route_equivalence.surface_kind, 'route_equivalence_contract');
    assert.equal(manifest.route_equivalence.public_skill_policy.skill_count, 1);
    assert.deepEqual(manifest.route_equivalence.public_skill_policy.skill_ids, ['redcube-ai']);
    assert.deepEqual(
      manifest.route_equivalence.equivalent_routes.map((route) => route.route_id),
      ['product_status', 'product_invoke', 'session_continuation', 'opl_hosted_stage_runtime'],
    );
    assert.deepEqual(
      manifest.route_equivalence.shared_truth_surfaces,
      [
        'domain_entry_surface',
        'session_continuity',
        'progress_projection',
        'artifact_inventory',
        'runtime_loop_closure',
        'review_state',
        'publication_projection',
      ],
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.entry_surface_kind,
      'domain_entry',
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.runtime_owner,
      'codex_cli',
    );
    assert.equal(manifest.deliverable_facade.surface_kind, 'deliverable_facade_contract');
    assert.deepEqual(manifest.deliverable_facade.covered_families, ['ppt_deck', 'xiaohongshu']);
    assert.deepEqual(manifest.deliverable_facade.facade_truth_surfaces, [
      'createDeliverable',
      'runManagedDeliverable',
      'runDeliverableRoute',
      'auditDeliverable',
      'runtimeWatch',
      'getReviewState',
      'getPublicationProjection',
    ]);
    assert.equal(manifest.deliverable_facade.public_entry_policy.new_public_entry_allowed, false);
    assert.equal(manifest.deliverable_facade.public_entry_policy.canonical_skill_id, 'redcube-ai');
    assert.deepEqual(
      manifest.deliverable_facade.family_route_policy.ppt_deck.protected_stage_sequence,
      [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'export_pptx',
      ],
    );
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.default_visual_route, 'author_image_pages');
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.default_visual_policy, 'image_first');
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
    assert.deepEqual(manifest.deliverable_facade.family_route_policy.ppt_deck.route_selection_policy.explicit_selection_required_for, ['render_html', 'fix_html', 'author_pptx_native', 'repair_pptx_native']);
    for (const family of ['ppt_deck', 'xiaohongshu']) { const companion = manifest.deliverable_facade.family_route_policy[family].html_design_companion; assert.equal(companion.source_skill_id, 'ui-ux-pro-max'); assert.equal(companion.activation_surface, 'internal_stage_context'); assert.equal(companion.public_skill_policy, 'do_not_register_as_public_redcube_skill'); }
    assert.equal(manifest.deliverable_facade.family_route_policy.ppt_deck.default_run_mode, 'auto_to_terminal');
    assert.equal(
      manifest.deliverable_facade.family_route_policy.ppt_deck.stop_policy,
      'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
    );
    assert.equal(
      manifest.deliverable_facade.family_route_policy.ppt_deck.bypass_policy,
      'forbid_generic_presentation_or_native_pptx_bypass_unless_user_explicitly_selects_html_or_native_route',
    );
    assert.equal(manifest.shared_handoff.opl_return_surface.surface_kind, 'product_entry');
    assert.equal(manifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(manifest.domain_entry_contract.service_safe_surface_kind, 'domain_entry');
    assert.equal(manifest.domain_entry_contract.product_entry_builder_command, 'redcube product manifest');
    assert.deepEqual(manifest.domain_entry_contract.supported_entry_modes, ['direct', 'opl_hosted', 'session']);
    assert.deepEqual(manifest.domain_entry_contract.supported_commands, [
      'redcube product manifest',
      'redcube product status',
      'redcube product start',
      'redcube product invoke',
      'redcube product session',
    ]);
    assert.equal(manifest.domain_entry_contract.command_contracts.length, 5);
    assert.equal(manifest.domain_entry_contract.command_contracts[0].command, 'redcube product manifest');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[0].required_fields, ['workspace_root']);
    assert.equal(manifest.domain_entry_contract.command_contracts[3].command, 'redcube product invoke');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[3].required_fields, [
      'workspace_root',
      'entry_session_id',
      'overlay',
      'topic_id',
      'deliverable_id',
    ]);
    assert.equal(manifest.domain_entry_contract.command_contracts[4].command, 'redcube product session');
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.surface_kind,
      'domain_agent_entry_spec',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.agent_id,
      'rca',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.default_engine,
      'codex',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.workspace_requirement,
      'required',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.codex_entry_strategy,
      'domain_agent_entry',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.artifact_conventions,
      'deck_and_visual_delivery',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.progress_conventions,
      'deliverable_build_narration',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.entry_command,
      'redcube product status',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.manifest_command,
      'redcube product manifest',
    );
    assert.deepEqual(
      manifest.domain_entry_contract.domain_agent_entry_spec.locator_schema,
      {
        required_fields: ['workspace_root'],
        optional_fields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
    );
    assert.equal(manifest.user_interaction_contract.surface_kind, 'user_interaction_contract');
    assert.equal(manifest.user_interaction_contract.entry_owner, 'redcube_agent_entry_shell');
    assert.equal(manifest.user_interaction_contract.user_interaction_mode, 'agent_facing_product_entry_overview');
	    assert.equal(manifest.user_interaction_contract.user_commands_required, false);
	    assert.equal(manifest.user_interaction_contract.command_surfaces_for_agent_consumption_only, true);
	    assert.equal(manifest.user_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assert.deepEqual(manifest.user_interaction_contract.shared_handoff_envelope, [
      'target_domain_id',
      'task_intent',
      'entry_mode',
      'workspace_locator',
      'runtime_session_contract',
      'return_surface_contract',
      'entry_session_contract',
      'delivery_request',
	    ]);
	    assert.equal(manifest.current_truth.product_entry_contract, 'contracts/runtime-program/redcube-product-entry-mvp.json');
      assert.equal(manifest.native_ppt_operator_ux.surface_kind, 'native_ppt_operator_ux');
      assert.equal(manifest.native_ppt_operator_ux.route_selection.default_visual_route, 'author_image_pages');
      assert.equal(manifest.native_ppt_operator_ux.route_selection.style_reference_dir_input, 'delivery_request.style_reference_dir');
      assert.equal(manifest.native_ppt_operator_ux.image_provider_diagnostics.surface_kind, 'image_provider_diagnostics');
      assert.equal(manifest.ppt_deck_visual_route_truth.default_visual_route, 'author_image_pages');
      assert.equal(manifest.native_ppt_operator_ux.proof_runner.helper_command, 'redcube native-ppt proof');
      assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.helper_command, 'redcube image-ppt proof');
      assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.downstream_gateway_action, 'repo_owned_image_ppt_proof_runner');
      assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.delegates_to, 'tools/image-ppt-proof/run.sh');
      assert.doesNotMatch(manifest.native_ppt_operator_ux.image_proof_runner.command_template, /--workspace-root/);
      assert.equal(manifest.native_ppt_operator_ux.proof_runner.public_skill_policy, 'do_not_register_as_second_public_skill');
      assert.equal(manifest.native_ppt_operator_ux.dependency_diagnostics.checks[2].check_id, 'libreoffice_headless');
	    assert.equal(manifest.session_continuity.surface_kind, 'session_continuity');
	    assert.equal(manifest.session_continuity.owner, 'redcube_ai');
	    assert.equal(manifest.session_continuity.status, 'repo_tracked');
	    assert.equal(manifest.session_continuity.session_command_template, 'redcube product session --entry-session-id <entry-session-id>');
	    assert.equal(manifest.session_continuity.restore_point_surface_ref.ref, '/session_continuity/restore_point');
	    assert.equal(manifest.session_continuity.progress_surface_ref.ref, '/progress_projection');
	    assert.equal(manifest.session_continuity.artifact_surface_ref.ref, '/artifact_inventory');
	    assert.deepEqual(
	      manifest.session_continuity.truth_surfaces.map((surface) => surface.surface_kind),
	      ['product_entry', 'product_entry_session'],
	    );
	    assert.equal(manifest.progress_projection.surface_kind, 'progress_projection');
	    assert.equal(manifest.progress_projection.owner, 'redcube_ai');
	    assert.equal(manifest.progress_projection.status, 'repo_tracked');
	    assert.equal(manifest.progress_projection.projection_field_ref.ref, '/progress_projection/projection');
	    assert.equal(manifest.progress_projection.fallback_projection_ref.ref, '/continuation_snapshot/managed_progress_projection');
	    assert.equal(manifest.artifact_inventory.surface_kind, 'artifact_inventory');
	    assert.equal(manifest.artifact_inventory.owner, 'redcube_ai');
	    assert.equal(manifest.artifact_inventory.status, 'repo_tracked');
	    assert.equal(manifest.artifact_inventory.artifact_refs_ref.ref, '/artifact_inventory/artifact_refs');
	    assert.equal(
	      manifest.artifact_inventory.artifact_refs_fallback_ref.ref,
	      '/continuation_snapshot/managed_progress_projection/final_artifact_refs',
	    );
      assert.equal(manifest.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
      assert.equal(manifest.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');
      assert.equal(manifest.runtime_loop_closure.loop_owner.domain_owner, 'redcube_ai');
      assert.equal(manifest.runtime_loop_closure.loop_owner.product_entry_owner, 'redcube_ai');
      assert.equal(
        manifest.runtime_loop_closure.resume_point.resume_command_template,
        'redcube product session --entry-session-id <entry-session-id>',
      );
      assert.equal(manifest.runtime_loop_closure.continuity_cursor.surface_ref, '/session_continuity');
      assert.equal(manifest.runtime_loop_closure.progress_cursor.surface_ref, '/progress_projection');
      assert.equal(manifest.runtime_loop_closure.artifact_pickup.surface_ref, '/artifact_inventory');
      assert.equal(manifest.runtime_loop_closure.control_policy.approval_gate_id, 'redcube_operator_review_gate');
      assert.equal(manifest.runtime_loop_closure.control_policy.default_run_mode, 'auto_to_terminal');
      assert.equal(
        manifest.runtime_loop_closure.control_policy.stop_policy,
        'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
      );
      assert.equal(manifest.runtime_loop_closure.control_policy.approval_required, false);
      assert.equal(manifest.runtime_loop_closure.control_policy.gate_status, 'approved');
      assert.equal(manifest.runtime_loop_closure.control_policy.interrupt_policy, 'continue_autonomously_until_runtime_gate');
      assert.equal(manifest.runtime_loop_closure.control_policy.recommended_action, 'invoke_product_entry_auto_to_terminal');
      assert.equal(manifest.runtime_loop_closure.source_linkage.current_source, 'manifest');
      assert.equal(manifest.runtime_loop_closure.source_linkage.entry_mode, 'manifest_projection');
      assert.equal(manifest.runtime_loop_closure.source_linkage.direct_surface_kind, 'product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.opl_hosted_surface_kind, 'opl_hosted_product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
      assert.equal(manifest.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
      assert.equal(manifest.opl_family_lifecycle_adapter.surface_kind, 'opl_family_lifecycle_adapter');
      assert.equal(manifest.opl_family_lifecycle_adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
      assert.equal(manifest.opl_family_lifecycle_adapter.discovery.adoption_state, 'discoverable_manifest_projection');
      assert.equal(manifest.opl_family_lifecycle_adapter.persistence.sqlite.status, 'deferred_for_rca');
      assert.equal(manifest.opl_family_lifecycle_adapter.persistence.authority_model, 'file_authority_plus_rebuildable_artifact_indexes');
      assert.deepEqual(
        manifest.opl_family_lifecycle_adapter.discovery.owner_split,
        {
          family_persistence_owner: 'redcube_ai',
          lifecycle_projection_owner: 'redcube_ai',
          domain_truth_owner: 'redcube_ai',
          review_publication_owner: 'redcube_ai',
          runtime_manager_consumer: 'opl_runtime_manager',
          executor_owner: 'codex_cli',
        },
      );
      assert.deepEqual(
        manifest.opl_family_lifecycle_adapter.discovery.route_surfaces.map((surface) => surface.surface_id),
        [
          'product_entry_registration',
          'opl_hosted_stage_runtime',
          'product_entry_session',
          'managed_run_store',
          'review_state',
          'publication_projection',
        ],
      );
      assert.equal(
        manifest.opl_family_lifecycle_adapter.adoption.required_input_fields.includes('entry_session_id'),
        true,
      );
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_visual_truth, false);
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_canonical_artifacts, false);
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_review_truth, false);
      assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_publication_projection, false);
	    const validatedManifest = sharedCompanions.validateFamilyProductEntryManifest(manifest, {
	      requireRuntimeCompanions: true,
	    });
    assert.equal(validatedManifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(validatedManifest.user_interaction_contract.entry_owner, 'redcube_agent_entry_shell');
    assertFamilyOrchestrationCompanion(manifest, {
      sessionLocatorField: 'entry_session_contract.entry_session_id',
    });
    assert.equal(manifest.family_orchestration.action_graph.edges.length, 4);
    assert.deepEqual(manifest.family_orchestration.action_graph.human_gates, [
      {
        gate_id: 'redcube_operator_review_gate',
        trigger_nodes: ['step:inspect_current_progress'],
        blocking: true,
      },
    ]);

    const status = await getProductStatus({
      workspace_root: workspaceRoot,
    });
    assert.equal(status.ok, true);
    assert.equal(status.surface_kind, 'product_status');
    assert.equal(status.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(status.product_entry_overview.progress_surface.surface_kind, 'product_entry_session');
    assert.equal(status.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(status.product_entry_start.recommended_mode_id, 'open_status');
    assert.equal(status.product_entry_start.modes[2].mode_id, 'opl_hosted_handoff');
    assert.equal(status.product_entry_start.modes[3].mode_id, 'resume_session');
    assert.deepEqual(status.product_entry_start, manifest.product_entry_start);
    assert.deepEqual(status.native_ppt_operator_ux, manifest.native_ppt_operator_ux);
    assert.equal(status.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(status.runtime_loop_closure.source_linkage.current_source, 'product_entry_overview');
    assert.equal(status.runtime_loop_closure.source_linkage.entry_mode, 'product_entry_overview_projection');
    assert.equal(
      status.product_entry_overview.resume_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(status.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(status.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(status.product_entry_readiness.usable_now, true);
    assert.equal(status.product_entry_readiness.good_to_use_now, false);
    assert.equal(status.product_entry_readiness.recommended_start_command, 'redcube product status');
    assert.equal(status.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(status.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      status.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(status.product_entry_preflight, manifest.product_entry_preflight);
    assert.match(status.product_entry_quickstart.summary, /operator_review_after_plan/);
    assert.match(status.product_entry_quickstart.steps[1].summary, /operator_review_after_plan/);
    assert.equal(status.product_entry_quickstart.recommended_step_id, 'open_status');
    assert.equal(status.product_entry_quickstart.steps[2].step_id, 'inspect_current_progress');
    assert.equal(status.product_entry_quickstart.steps[2].surface_kind, 'product_entry_session');
    assert.equal(status.schema_ref, manifest.schema_ref);
    assert.deepEqual(status.domain_entry_contract, manifest.domain_entry_contract);
    assert.deepEqual(status.user_interaction_contract, manifest.user_interaction_contract);
    assert.equal(status.extra_payload, undefined);
    assert.equal(status.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(status.user_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assertFamilyOrchestrationCompanion(status, {
      sessionLocatorField: 'entry_session_contract.entry_session_id',
    });

    const preflight = await getProductPreflight({
      workspace_root: workspaceRoot,
    });
    assert.equal(preflight.ok, true);
    assert.equal(preflight.surface_kind, 'product_entry_preflight');
    assert.equal(preflight.target_domain_id, 'redcube_ai');
    assert.equal(preflight.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(preflight.ready_to_try_now, true);
    assert.equal(preflight.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(preflight.runtime_loop_closure.source_linkage.current_source, 'preflight');
    assert.equal(preflight.runtime_loop_closure.source_linkage.entry_mode, 'preflight_projection');
    assert.equal(
      preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      preflight.recommended_start_command,
      `redcube product status --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(preflight.blocking_check_ids, []);
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure.source_linkage.current_source, 'preflight');

    const cliManifest = JSON.parse(execFileSync(
      process.execPath,
      ['apps/redcube-cli/dist/cli.js', 'product', 'manifest', '--workspace-root', workspaceRoot, '--json'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    ));
    assert.equal(cliManifest.ok, true);
    assert.equal(cliManifest.family_stage_control_plane.surface_kind, 'family_stage_control_plane');
    assert.deepEqual(
      cliManifest.family_stage_control_plane.stages.map((stage) => stage.stage_id),
      manifest.family_stage_control_plane.stages.map((stage) => stage.stage_id),
    );
    assert.equal(cliManifest.family_stage_control_plane.stage_action_parity.status, 'aligned');
    assert.deepEqual(cliManifest.family_stage_control_plane.stage_action_parity.missing_action_refs, []);
    assert.equal(
      cliManifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'artifact_creation')
        .authority_boundary.default_ppt_route_changed,
      false,
    );
  });
});
