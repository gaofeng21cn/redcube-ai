// @ts-nocheck
import {
  GATEWAY_PACKAGE_JSON,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  getProductEntryManifest,
  getProductStatus,
  getProductStart,
  exportProductSidecar,
  dispatchProductSidecar,
  importGatewaySharedModule,
  invokeProductEntry,
  getProductEntrySession,
  readJson,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../gateway-case-shared.ts';


test('product sidecar export and dispatch preserve RCA authority while allowing guarded control-plane actions', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const sidecar = await exportProductSidecar({
      workspace_root: workspaceRoot,
    });

    assert.equal(sidecar.ok, true);
    assert.equal(sidecar.surface_kind, 'product_sidecar_export');
    assert.equal(sidecar.runtime_framework.runtime_owner, 'configured_family_runtime_provider');
    assert.equal(sidecar.runtime_framework.provider_transport_owner, 'opl_family_runtime_provider');
    assert.equal(sidecar.runtime_framework.managed_by, 'opl_runtime_manager');
    assert.equal(sidecar.runtime_framework.queue_owner, 'opl');
    assert.equal(sidecar.owner_boundary.provider_owns_visual_truth, false);
    assert.equal(sidecar.owner_boundary.opl_owns_review_verdict, false);
    assert.equal(sidecar.owner_boundary.opl_owns_publication_gate, false);
    assert.equal(sidecar.owner_boundary.rca_owns_visual_truth, true);
    assert.equal(sidecar.owner_boundary.rca_owns_review_publication_projection, true);
    assert.equal(sidecar.mapped_surfaces.standard_domain_agent_skeleton.ref, '/standard_domain_agent_skeleton');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.ref, '/artifact_locator_contract');
    assert.equal(sidecar.mapped_surfaces.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
    assert.equal(sidecar.mapped_surfaces.receipt_refs.ref, '/product_sidecar_receipt_refs');
    assert.equal(sidecar.mapped_surfaces.receipt_refs.forbidden_receipt_fields.includes('export_verdict'), true);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.descriptor_ref, '/domain_memory_descriptor_locator');
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.proposal_generator_ref,
      '/domain_memory_descriptor_locator/writeback_proposal_generator',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.accept_reject_command_ref,
      '/domain_memory_descriptor_locator/accept_reject_command',
    );
    assert.equal(
      sidecar.mapped_surfaces.visual_pattern_memory_writeback.operator_receipt_projection_ref,
      '/domain_memory_descriptor_locator/operator_receipt_projection',
    );
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_generate_memory_content, false);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_accept_or_reject, false);
    assert.equal(sidecar.mapped_surfaces.visual_pattern_memory_writeback.opl_can_write_receipt_instance, false);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.ref, '/controlled_visual_stage_attempt');
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.opl_consumes_descriptor_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.opl_consumes_quality_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.direct_and_opl_share_descriptor_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.direct_and_opl_share_sidecar_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.direct_and_opl_share_quality_refs, true);
    assert.equal(sidecar.mapped_surfaces.controlled_visual_stage_attempt.opl_holds_visual_or_export_verdict, false);
    assert.equal(sidecar.source_manifest_refs.standard_domain_agent_skeleton_ref, '/standard_domain_agent_skeleton');
    assert.equal(sidecar.source_manifest_refs.artifact_locator_contract_ref, '/artifact_locator_contract');
    assert.equal(sidecar.source_manifest_refs.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
    assert.equal(sidecar.source_manifest_refs.product_sidecar_receipt_refs_ref, '/product_sidecar_receipt_refs');
    assert.deepEqual(
      sidecar.guarded_actions.map((entry) => entry.action),
      [
        'runtime_watch',
        'supervise_managed_run',
        'product_entry_continuation',
        'notification_receipt',
      ],
    );
    assert.deepEqual(sidecar.blocked_actions, [
      'write_visual_truth',
      'write_canonical_artifacts',
      'write_review_verdict',
      'write_publication_gate',
      'mutate_review_state',
      'publish_export_bundle',
    ]);

    const receipt = await dispatchProductSidecar({
      task: {
        action: 'notification_receipt',
        notification_id: 'notice-1',
      },
    });
    assert.equal(receipt.ok, true);
    assert.equal(receipt.surface_kind, 'product_sidecar_dispatch');
    assert.equal(receipt.result_surface.surface_kind, 'notification_receipt');
    assert.equal(receipt.sidecar_policy.writes_visual_truth, false);
    assert.equal(receipt.sidecar_policy.writes_review_verdict, false);
    assert.equal(receipt.sidecar_policy.writes_publication_gate, false);

    await assert.rejects(
      () => dispatchProductSidecar({
        task: {
          action: 'write_publication_gate',
          workspace_root: workspaceRoot,
        },
      }),
      /product sidecar action 不允许/,
    );
  });
});

test('default product-entry path stays on codex_cli without requiring Hermes API server', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    assert.equal(Boolean(process.env.REDCUBE_HERMES_AGENT_API_BASE_URL), false);
    assert.equal(Boolean(process.env.REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND), false);

    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    assert.equal(manifest.runtime.runtime_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.executor_owner, 'codex_cli');
    assert.equal(manifest.managed_runtime_contract.runtime_owner, 'codex_cli');
    assert.equal(manifest.managed_runtime_contract.executor_owner, 'codex_cli');
    assert.equal(manifest.route_equivalence.downstream_runtime_truth.runtime_owner, 'codex_cli');
    assert.equal(manifest.route_equivalence.downstream_runtime_truth.executor_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.substrate, 'codex_cli_runtime');
    assert.equal(
      manifest.skill_catalog.skills[0].domain_projection.runtime_continuity.runtime_owner,
      'codex_cli',
    );

    const status = await getProductStatus({
      workspace_root: workspaceRoot,
    });
    assert.equal(status.runtime.runtime_owner, 'codex_cli');
    assert.equal(status.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');

    const start = await getProductStart({
      workspace_root: workspaceRoot,
    });
    assert.equal(start.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');

    const invoked = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-codex-default',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-codex-default',
        profile_id: 'lecture_student',
        title: 'Codex default product entry proof',
        goal: '验证未配置 Hermes 时默认 product-entry 只走 Codex CLI',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });
    assert.equal(invoked.entry_session.runtime_owner, 'codex_cli');
    assert.equal(invoked.session_continuity.runtime_owner, 'codex_cli');
    assert.equal(invoked.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');
    assert.equal(invoked.domain_entry_surface.runtime_session_contract.runtime_owner, 'codex_cli');
    assert.equal(invoked.domain_entry_surface.runtime_session_contract.adapter_surface, '@redcube/codex-cli-client');
    assert.equal(invoked.domain_entry_surface.result_surface.managed_run.adapter, 'codex_cli');
    assert.equal(invoked.domain_entry_surface.result_surface.managed_run.runtime_bridge.owner, 'codex_cli');

    const session = await getProductEntrySession({
      entry_session_id: 'session-codex-default',
    });
    assert.equal(session.entry_session.runtime_owner, 'codex_cli');
    assert.equal(session.session_continuity.runtime_owner, 'codex_cli');
    assert.equal(session.runtime_loop_closure.loop_owner.runtime_owner, 'codex_cli');
  });
});

test('product status exposes overlay stage sequence for ppt_deck callers', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const status = await getProductStatus({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
    });

    assert.deepEqual(
      status.overlay_stage_sequences.ppt_deck.protected_stage_sequence,
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
    assert.equal(status.overlay_stage_sequences.ppt_deck.default_visual_route, 'author_image_pages');
    assert.equal(status.overlay_stage_sequences.ppt_deck.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
    assert.equal(status.ppt_deck_visual_route_truth.default_visual_route, 'author_image_pages');
    assert.equal(status.overlay_stage_sequences.ppt_deck.route_gate_policy, 'fail_closed_against_overlay_stage_sequence');
    assert.deepEqual(
      status.overlay_stage_sequences.xiaohongshu.protected_stage_sequence,
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
    assert.equal(status.overlay_stage_sequences.xiaohongshu.default_visual_route, 'author_image_pages');
    assert.equal(status.overlay_stage_sequences.xiaohongshu.default_visual_policy, 'image_first');
    assert.equal(status.overlay_stage_sequences.xiaohongshu.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
  });
});

test('invokeProductEntry rejects route and stop_after_stage outside hydrated stage sequence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
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
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const start = await getProductStart({
      workspace_root: workspaceRoot,
    });

    assert.equal(start.ok, true);
    assert.equal(start.surface_kind, 'product_entry_start');
    assert.equal(start.recommended_mode_id, 'open_status');
    assert.deepEqual(
      start.modes.map((mode) => mode.mode_id),
      ['open_status', 'start_direct_session', 'opl_hosted_handoff', 'resume_session'],
    );
    assert.equal(
      start.modes[0].command,
      `redcube product status --workspace-root ${workspaceRoot}`,
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
    gatewayPackage.dependencies['opl-framework-shared'],
    /^git\+https:\/\/github\.com\/gaofeng21cn\/one-person-lab\.git#[0-9a-f]{40}$/,
  );
  const companions = await importGatewaySharedModule(PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER);
  assert.equal(typeof companions.buildProductEntryPreflight, 'function');
  assert.equal(typeof companions.buildProgramCheck, 'function');
});
