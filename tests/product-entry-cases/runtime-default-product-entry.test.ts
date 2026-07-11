// @ts-nocheck
import {
  DOMAIN_ENTRY_PACKAGE_JSON,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  getProductEntryManifest,
  getProductEntrySession,
  getProductStart,
  getProductStatus,
  importDomainEntrySharedModule,
  invokeProductEntry,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { assertPathValues, list } from './surface-fixture-assertions.ts';

const RUNTIME_OWNER = 'configured_family_runtime_provider';
const EXECUTOR_OWNER = 'configured_by_opl_runtime_provider';

test('default product-entry path returns an OPL stage execution plan with Codex as the RCA-local executor', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    assertPathValues(manifest, {
      'runtime.runtime_owner': RUNTIME_OWNER,
      'runtime_inventory.executor_owner': EXECUTOR_OWNER,
      'opl_provider_runtime_contract.runtime_owner': RUNTIME_OWNER,
      'opl_provider_runtime_contract.executor_owner': EXECUTOR_OWNER,
      'route_equivalence.downstream_runtime_truth.runtime_owner': RUNTIME_OWNER,
      'route_equivalence.downstream_runtime_truth.executor_owner': EXECUTOR_OWNER,
      'runtime_inventory.substrate': 'opl_provider_backed_stage_attempt_runtime',
      'skill_catalog.skills.0.domain_projection.runtime_continuity.runtime_owner': RUNTIME_OWNER,
    });

    const status = await getProductStatus({ workspace_root: workspaceRoot });
    assertPathValues(status, {
      'runtime.runtime_owner': RUNTIME_OWNER,
      'runtime_loop_closure.loop_owner.runtime_owner': RUNTIME_OWNER,
    });

    const start = await getProductStart({ workspace_root: workspaceRoot });
    assert.equal(start.runtime_loop_closure.loop_owner.runtime_owner, RUNTIME_OWNER);

    const invoked = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: { entry_session_id: 'session-codex-default' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-codex-default',
        profile_id: 'lecture_student',
        title: 'OPL default product entry proof',
        goal: '验证默认 product-entry 生成 OPL stage execution plan',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });
    assertPathValues(invoked, {
      'entry_session.runtime_owner': RUNTIME_OWNER,
      'session_continuity.runtime_owner': RUNTIME_OWNER,
      'runtime_loop_closure.loop_owner.runtime_owner': RUNTIME_OWNER,
      'domain_entry_surface.runtime_session_contract.runtime_owner': RUNTIME_OWNER,
      'domain_entry_surface.runtime_session_contract.adapter_surface': 'opl_codex_executor',
      'domain_entry_surface.result_surface.surface_kind': 'opl_stage_execution_plan',
      'domain_entry_surface.result_surface.owner': 'one-person-lab',
      'domain_entry_surface.result_surface.execution_model.repo_local_stage_runner_active_caller': false,
      'domain_entry_surface.result_surface.adapter_boundary.executor_selection_owner': 'one-person-lab',
    });

    const session = await getProductEntrySession({ entry_session_id: 'session-codex-default' });
    assertPathValues(session, {
      'entry_session.runtime_owner': RUNTIME_OWNER,
      'session_continuity.runtime_owner': RUNTIME_OWNER,
      'runtime_loop_closure.loop_owner.runtime_owner': RUNTIME_OWNER,
    });
  });
});

test('product status exposes overlay stage sequence for ppt_deck callers', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const status = await getProductStatus({ workspace_locator: { workspace_root: workspaceRoot } });

    assertPathValues(status, {
      'overlay_stage_sequences.ppt_deck.protected_stage_sequence': list('storyline detailed_outline slide_blueprint visual_direction author_image_pages visual_director_review screenshot_review repair_image_pages export_pptx'),
      'overlay_stage_sequences.ppt_deck.default_visual_route': 'author_image_pages',
      'overlay_stage_sequences.ppt_deck.route_selection_policy.style_reference_dir_input': 'delivery_request.style_reference_dir',
      'ppt_deck_visual_route_truth.default_visual_route': 'author_image_pages',
      'overlay_stage_sequences.ppt_deck.route_gate_policy': 'fail_closed_against_overlay_stage_sequence',
      'overlay_stage_sequences.xiaohongshu.protected_stage_sequence': list('research storyline single_note_plan visual_direction author_image_pages visual_director_review screenshot_review repair_image_pages publish_copy export_bundle'),
      'overlay_stage_sequences.xiaohongshu.default_visual_route': 'author_image_pages',
      'overlay_stage_sequences.xiaohongshu.default_visual_policy': 'image_first',
      'overlay_stage_sequences.xiaohongshu.route_selection_policy.style_reference_dir_input': 'delivery_request.style_reference_dir',
    });
  });
});

test('invokeProductEntry rejects route and stop_after_stage outside hydrated stage sequence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: { entry_session_id: 'session-invalid-stage' },
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
    const start = await getProductStart({ workspace_root: workspaceRoot });

    assertPathValues(start, {
      ok: true,
      surface_kind: 'product_entry_start',
      recommended_mode_id: 'start_direct_session',
      'modes.0.mode_id': 'start_direct_session',
      'modes.1.mode_id': 'opl_hosted_handoff',
      'modes.2.mode_id': 'resume_session',
      'runtime_loop_closure.surface_kind': 'runtime_loop_closure',
      'runtime_loop_closure.source_linkage.current_source': 'start',
      'runtime_loop_closure.source_linkage.entry_mode': 'start_projection',
      'resume_surface.surface_kind': 'product_entry_session',
      human_gate_ids: ['redcube_operator_review_gate'],
    });
    assert.match(start.modes[0].command, /redcube product invoke/);
  });
});

test('product preflight consumes OPL shared program builders from the pinned owner commit', async () => {
  const domainEntryPackage = readJson(DOMAIN_ENTRY_PACKAGE_JSON);
  assert.match(
    domainEntryPackage.dependencies['opl-framework-shared'],
    /^git\+https:\/\/github\.com\/gaofeng21cn\/one-person-lab\.git#[0-9a-f]{40}$/,
  );
  const companions = await importDomainEntrySharedModule(PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER);
  assert.equal(typeof companions.buildProductEntryPreflight, 'function');
  assert.equal(typeof companions.buildProgramCheck, 'function');
});
