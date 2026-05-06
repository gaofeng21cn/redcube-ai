// @ts-nocheck
import {
  GATEWAY_PACKAGE_JSON,
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  assertFamilyOrchestrationCompanion,
  assertRuntimeLoopClosureShape,
  getProductEntryManifest,
  getProductFrontdesk,
  getProductPreflight,
  getProductStart,
  importGatewaySharedModule,
  invokeProductEntry,
  readJson,
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
    assert.equal(manifest.frontdesk_surface.shell_key, 'frontdesk');
    assert.equal(manifest.frontdesk_surface.command, 'redcube product frontdesk');
    assert.equal(manifest.frontdesk_surface.surface_kind, 'product_frontdesk');
    assert.match(manifest.frontdesk_surface.summary, /product-entry overview/i);
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
    assert.equal(manifest.operator_loop_actions.opl_bridge_handoff.command, 'redcube product federate');
    assert.equal(manifest.product_entry_quickstart.surface_kind, 'product_entry_quickstart');
    assert.equal(manifest.product_entry_quickstart.recommended_step_id, 'open_frontdesk');
    assert.deepEqual(manifest.product_entry_quickstart.human_gate_ids, ['redcube_operator_review_gate']);
    assert.deepEqual(
      manifest.product_entry_quickstart.steps.map((step) => step.step_id),
      ['open_frontdesk', 'continue_current_loop', 'inspect_current_progress', 'default_image_ppt_proof', 'optional_native_ppt_proof'],
    );
    assert.equal(
      manifest.product_entry_quickstart.steps[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
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
      'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`frontdesk` 仅作为兼容命令键保留，成熟终端用户前台壳与 managed web productization 仍未 landed。',
    );
    assert.equal(manifest.product_entry_overview.frontdesk_command, 'redcube product frontdesk');
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
    assert.equal(manifest.product_entry_overview.recommended_step_id, 'open_frontdesk');
    assert.deepEqual(manifest.product_entry_overview.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(manifest.product_entry_start.recommended_mode_id, 'open_frontdesk');
    assert.deepEqual(
      manifest.product_entry_start.modes.map((mode) => mode.mode_id),
      ['open_frontdesk', 'start_direct_session', 'opl_bridge_handoff', 'resume_session'],
    );
    assert.equal(
      manifest.product_entry_start.modes[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(
      manifest.product_entry_start.modes[1].requires,
      ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    );
    assert.equal(manifest.product_entry_start.modes[2].surface_kind, 'federated_product_entry');
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
      'Current product-entry preflight passed; inspect the workspace doctor output and then read the RedCube product-entry overview via the `frontdesk` compatibility command.',
    );
    assert.equal(manifest.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      manifest.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      manifest.product_entry_preflight.recommended_start_command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
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
    assert.equal(manifest.repo_mainline.phase_id, 'repo_verified_product_entry_and_opl_federation');
    assert.equal(manifest.repo_mainline.active_baton_id, 'managed_product_entry_hardening');
    assert.equal(
      manifest.product_entry_status.summary,
      'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`frontdesk` 仅作为兼容命令键保留，成熟终端用户前台壳与 managed web productization 仍未 landed。',
    );
    assert.equal(manifest.product_entry_status.remaining_gaps_count, 2);
    assert.deepEqual(manifest.product_entry_status.next_focus, [
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
      '继续把 internal OPL bridge 与同一 downstream product-entry contract 对齐。',
    ]);
    assert.equal(manifest.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(manifest.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(manifest.product_entry_readiness.usable_now, true);
    assert.equal(manifest.product_entry_readiness.good_to_use_now, false);
    assert.equal(manifest.product_entry_readiness.fully_automatic, false);
    assert.equal(manifest.product_entry_readiness.recommended_start_surface, 'product_frontdesk');
    assert.equal(manifest.product_entry_readiness.recommended_start_command, 'redcube product frontdesk');
    assert.equal(manifest.product_entry_readiness.recommended_loop_surface, 'product_entry');
    assert.equal(manifest.product_entry_readiness.recommended_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_readiness.blocking_gaps, [
      '成熟的最终用户前台壳仍未 landed。',
      'managed web productization 仍未 landed。',
    ]);
    assert.equal(manifest.runtime.runtime_owner, 'upstream_hermes_agent');
    assert.equal(manifest.runtime.runtime_state_root, runtimeStateRoot);
    assert.deepEqual(manifest.managed_runtime_contract, {
      shared_contract_ref: 'contracts/opl-gateway/managed-runtime-three-layer-contract.json',
      runtime_owner: 'upstream_hermes_agent',
      domain_owner: 'redcube_ai',
      executor_owner: 'codex_cli',
      supervision_status_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      attention_queue_surface: {
        surface_kind: 'product_frontdesk',
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
    assert.equal(manifest.runtime_inventory.runtime_owner, 'upstream_hermes_agent');
    assert.equal(manifest.runtime_inventory.domain_owner, 'redcube_ai');
    assert.equal(manifest.runtime_inventory.executor_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.status_surface.ref, '/product_entry_preflight');
    assert.equal(manifest.runtime_inventory.attention_surface.ref, '/frontdesk_surface');
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
    assert.equal(manifest.skill_catalog.surface_kind, 'skill_catalog');
    assert.equal(manifest.skill_catalog.skills.length, 1); assert.equal(manifest.skill_catalog.skills.some((skill) => skill.skill_id === 'ui-ux-pro-max'), false);
    assert.deepEqual(manifest.skill_catalog.supported_commands, [
      'redcube product frontdesk',
      'redcube product invoke',
      'redcube product session',
      'redcube image-ppt proof',
      'redcube native-ppt proof',
    ]);
    assert.equal(manifest.skill_catalog.command_contracts.length, 5);
    assert.equal(manifest.skill_catalog.skills[0].skill_id, 'redcube-ai');
    assert.equal(manifest.skill_catalog.skills[0].title, 'RedCube AI');
    assert.equal(manifest.skill_catalog.skills[0].command, 'redcube product frontdesk');
    assert.equal(manifest.skill_catalog.skills[0].target_surface_kind, 'product_frontdesk');
    assert.deepEqual(manifest.skill_catalog.skills[0].tags, ['domain-app', 'product-entry', 'visual-deliverables']);
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.skill_activation,
      {
        plugin_name: 'redcube-ai',
        skill_semantics: 'single_domain_app_skill',
        canonical_entry_semantics: 'agent_facing_product_entry_overview',
        entry_shell_key: 'frontdesk',
        entry_command: 'redcube product frontdesk',
        supporting_shell_keys: ['direct', 'session'],
        shell_commands: {
          frontdesk: {
            command: 'redcube product frontdesk',
            target_surface_kind: 'product_frontdesk',
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
        runtime_owner: 'upstream_hermes_agent',
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
    assert.equal(manifest.product_entry_shell.frontdesk.command, 'redcube product frontdesk');
    assert.equal(manifest.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifest.product_entry_shell.opl_bridge.command, 'redcube product federate');
    assert.equal(manifest.product_entry_shell.session.command, 'redcube product session');
    assert.match(manifest.product_entry_shell.frontdesk.purpose, /product-entry overview/i);
    assert.equal(
      manifest.product_entry_shell.frontdesk.canonical_entry_semantics,
      'agent_facing_product_entry_overview',
    );
    assert.equal(manifest.product_entry_shell.frontdesk.legacy_command_key, 'frontdesk');
    assert.equal(manifest.product_entry_shell.frontdesk.claims_gui_shell, false);
    assert.match(manifest.product_entry_shell.direct.purpose, /deliverable loop/i);
    assert.equal(manifest.route_equivalence.surface_kind, 'route_equivalence_contract');
    assert.equal(manifest.route_equivalence.public_skill_policy.skill_count, 1);
    assert.deepEqual(manifest.route_equivalence.public_skill_policy.skill_ids, ['redcube-ai']);
    assert.deepEqual(
      manifest.route_equivalence.equivalent_routes.map((route) => route.route_id),
      ['product_frontdesk', 'product_invoke', 'session_continuation', 'internal_opl_bridge'],
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
      'upstream_hermes_agent',
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
    assert.deepEqual(manifest.domain_entry_contract.supported_entry_modes, ['direct', 'opl_gateway', 'session']);
    assert.deepEqual(manifest.domain_entry_contract.supported_commands, [
      'redcube product manifest',
      'redcube product frontdesk',
      'redcube product start',
      'redcube product invoke',
      'redcube product federate',
      'redcube product session',
    ]);
    assert.equal(manifest.domain_entry_contract.command_contracts.length, 6);
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
    assert.equal(manifest.domain_entry_contract.command_contracts[4].command, 'redcube product federate');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[4].required_fields, [
      'workspace_root',
      'entry_session_id',
      'target_domain_id',
      'entry_mode',
      'return_surface_kind',
      'overlay',
      'topic_id',
      'deliverable_id',
    ]);
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
      'redcube product frontdesk',
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
    assert.equal(manifest.gateway_interaction_contract.surface_kind, 'gateway_interaction_contract');
    assert.equal(manifest.gateway_interaction_contract.frontdoor_owner, 'redcube_agent_entry_shell');
    assert.equal(manifest.gateway_interaction_contract.user_interaction_mode, 'agent_facing_product_entry_overview');
	    assert.equal(manifest.gateway_interaction_contract.user_commands_required, false);
	    assert.equal(manifest.gateway_interaction_contract.command_surfaces_for_agent_consumption_only, true);
	    assert.equal(manifest.gateway_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assert.deepEqual(manifest.gateway_interaction_contract.shared_handoff_envelope, [
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
      assert.equal(manifest.runtime_loop_closure.loop_owner.runtime_owner, 'upstream_hermes_agent');
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
      assert.equal(manifest.runtime_loop_closure.source_linkage.federated_surface_kind, 'federated_product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
      assert.equal(manifest.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
	    const validatedManifest = sharedCompanions.validateFamilyProductEntryManifest(manifest, {
	      requireRuntimeCompanions: true,
	    });
    assert.equal(validatedManifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(validatedManifest.gateway_interaction_contract.frontdoor_owner, 'redcube_agent_entry_shell');
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

    const frontdesk = await getProductFrontdesk({
      workspace_root: workspaceRoot,
    });
    assert.equal(frontdesk.ok, true);
    assert.equal(frontdesk.surface_kind, 'product_frontdesk');
    assert.equal(frontdesk.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(frontdesk.product_entry_overview.progress_surface.surface_kind, 'product_entry_session');
    assert.equal(frontdesk.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(frontdesk.product_entry_start.recommended_mode_id, 'open_frontdesk');
    assert.equal(frontdesk.product_entry_start.modes[2].mode_id, 'opl_bridge_handoff');
    assert.equal(frontdesk.product_entry_start.modes[3].mode_id, 'resume_session');
    assert.deepEqual(frontdesk.product_entry_start, manifest.product_entry_start);
    assert.deepEqual(frontdesk.native_ppt_operator_ux, manifest.native_ppt_operator_ux);
    assert.equal(frontdesk.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(frontdesk.runtime_loop_closure.source_linkage.current_source, 'product_entry_overview');
    assert.equal(frontdesk.runtime_loop_closure.source_linkage.entry_mode, 'product_entry_overview_projection');
    assert.equal(
      frontdesk.product_entry_overview.resume_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(frontdesk.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(frontdesk.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(frontdesk.product_entry_readiness.usable_now, true);
    assert.equal(frontdesk.product_entry_readiness.good_to_use_now, false);
    assert.equal(frontdesk.product_entry_readiness.recommended_start_command, 'redcube product frontdesk');
    assert.equal(frontdesk.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(frontdesk.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      frontdesk.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(frontdesk.product_entry_preflight, manifest.product_entry_preflight);
    assert.match(frontdesk.product_entry_quickstart.summary, /operator_review_after_plan/);
    assert.match(frontdesk.product_entry_quickstart.steps[1].summary, /operator_review_after_plan/);
    assert.equal(frontdesk.product_entry_quickstart.recommended_step_id, 'open_frontdesk');
    assert.equal(frontdesk.product_entry_quickstart.steps[2].step_id, 'inspect_current_progress');
    assert.equal(frontdesk.product_entry_quickstart.steps[2].surface_kind, 'product_entry_session');
    assert.equal(frontdesk.schema_ref, manifest.schema_ref);
    assert.deepEqual(frontdesk.domain_entry_contract, manifest.domain_entry_contract);
    assert.deepEqual(frontdesk.gateway_interaction_contract, manifest.gateway_interaction_contract);
    assert.equal(frontdesk.extra_payload, undefined);
    assert.equal(frontdesk.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(frontdesk.gateway_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assertFamilyOrchestrationCompanion(frontdesk, {
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
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(preflight.blocking_check_ids, []);
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure.source_linkage.current_source, 'preflight');
  });
});

test('product frontdesk exposes overlay stage sequence for ppt_deck callers', async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const frontdesk = await getProductFrontdesk({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
    });

    assert.deepEqual(
      frontdesk.overlay_stage_sequences.ppt_deck.protected_stage_sequence,
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
    assert.equal(frontdesk.overlay_stage_sequences.ppt_deck.default_visual_route, 'author_image_pages');
    assert.equal(frontdesk.overlay_stage_sequences.ppt_deck.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
    assert.equal(frontdesk.ppt_deck_visual_route_truth.default_visual_route, 'author_image_pages');
    assert.equal(frontdesk.overlay_stage_sequences.ppt_deck.route_gate_policy, 'fail_closed_against_overlay_stage_sequence');
    assert.deepEqual(
      frontdesk.overlay_stage_sequences.xiaohongshu.protected_stage_sequence,
      [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'publish_copy',
        'export_bundle',
      ],
    );
    assert.equal(frontdesk.overlay_stage_sequences.xiaohongshu.default_visual_route, 'author_image_pages');
    assert.equal(frontdesk.overlay_stage_sequences.xiaohongshu.default_visual_policy, 'image_first');
    assert.equal(frontdesk.overlay_stage_sequences.xiaohongshu.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
  });
});

test('invokeProductEntry rejects route and stop_after_stage outside hydrated stage sequence', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: {
          workspace_root: workspaceRoot,
        },
        entry_session_contract: {
          entry_session_id: 'session-invalid-stage',
        },
        delivery_request: {
          deliverable_family: 'ppt_deck',
          topic_id: 'topic-invalid-stage',
          deliverable_id: 'deck-invalid-stage',
          profile_id: 'lecture_student',
          title: 'Invalid stage proof',
          goal: '校验 product-entry fail closed',
          stop_after_stage: 'native_pptx',
        },
      }),
      /delivery_request\.stop_after_stage=native_pptx is not allowed by the hydrated overlay stage_sequence/,
    );
  });
});

test('getProductStart exposes the same direct-entry start companion as the manifest', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const start = await getProductStart({
      workspace_root: workspaceRoot,
    });

    assert.equal(start.ok, true);
    assert.equal(start.surface_kind, 'product_entry_start');
    assert.equal(start.recommended_mode_id, 'open_frontdesk');
    assert.deepEqual(
      start.modes.map((mode) => mode.mode_id),
      ['open_frontdesk', 'start_direct_session', 'opl_bridge_handoff', 'resume_session'],
    );
    assert.equal(
      start.modes[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.equal(start.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(start.runtime_loop_closure.source_linkage.current_source, 'start');
    assert.equal(start.runtime_loop_closure.source_linkage.entry_mode, 'start_projection');
    assert.equal(start.resume_surface.surface_kind, 'product_entry_session');
    assert.deepEqual(start.human_gate_ids, ['redcube_operator_review_gate']);
  });
});

test('product preflight consumes OPL shared program builders from the pinned owner commit', async () => {
  const gatewayPackage = readJson(GATEWAY_PACKAGE_JSON);
  assert.match(
    gatewayPackage.dependencies['opl-gateway-shared'],
    /^git\+https:\/\/github\.com\/gaofeng21cn\/one-person-lab\.git#[0-9a-f]{40}$/,
  );
  const companions = await importGatewaySharedModule(PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER);
  assert.equal(typeof companions.buildProductEntryPreflight, 'function');
  assert.equal(typeof companions.buildProgramCheck, 'function');
});
