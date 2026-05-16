// @ts-nocheck
import {
  GATEWAY_PACKAGE_JSON,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  getProductEntryManifest,
  getProductEntrySession,
  getProductStart,
  getProductStatus,
  importGatewaySharedModule,
  invokeProductEntry,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

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
