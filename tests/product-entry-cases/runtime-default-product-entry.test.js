import {
  DOMAIN_ENTRY_PACKAGE_JSON,
  PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  buildOplGeneratedProductSessionForTest,
  getProductEntryManifest,
  getProductEntrySession,
  getProductStatus,
  importDomainEntrySharedModule,
  invokeProductEntry,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { assertPathValues, list } from './surface-fixture-assertions.js';

const RUNTIME_OWNER = 'configured_family_runtime_provider';
const EXECUTOR_OWNER = 'configured_by_opl_runtime_provider';

test('default product-entry path returns an OPL stage execution plan without requiring Hermes API server', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    assert.equal(Boolean(process.env.REDCUBE_HERMES_AGENT_API_BASE_URL), false);
    assert.equal(Boolean(process.env.REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND), false);

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
      surface_kind: 'opl_generated_product_entry_domain_surface',
      generated_interface_owner: 'one-person-lab',
      'authority_boundary.generated_surface_only': true,
    });
    assert.equal(status.runtime_loop_closure, undefined);

    const invoked = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: { entry_session_id: 'session-codex-default' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-codex-default',
        profile_id: 'lecture_student',
        title: 'OPL default product entry proof',
        goal: '验证未配置 Hermes 时默认 product-entry 生成 OPL stage execution plan',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });
    assertPathValues(invoked, {
      'session_handoff_refs.entry_session_id': 'session-codex-default',
      'session_handoff_refs.delivery_locator_refs.deliverable_id': 'deck-codex-default',
      'authority_boundary.generic_session_runtime_owner': 'one-person-lab',
      'authority_boundary.rca_owns_generic_session_runtime': false,
      'domain_entry_surface.runtime_session_contract.runtime_owner': RUNTIME_OWNER,
      'domain_entry_surface.runtime_session_contract.adapter_surface': 'opl_codex_executor',
      'domain_entry_surface.result_surface.surface_kind': 'opl_stage_execution_plan',
      'domain_entry_surface.result_surface.owner': 'one-person-lab',
      'domain_entry_surface.result_surface.execution_model.repo_local_stage_runner_active_caller': false,
      'domain_entry_surface.result_surface.adapter_boundary.executor_selection_owner': 'one-person-lab',
    });

    const handoff = invoked.session_handoff_refs;
    const session = await getProductEntrySession({
      entry_session_id: 'session-codex-default',
      opl_generated_session_surface: buildOplGeneratedProductSessionForTest({
        entrySessionId: 'session-codex-default',
        handoffRefs: handoff,
      }),
    });
    assertPathValues(session, {
      projection_kind: 'rca_product_entry_session_domain_snapshot_refs',
      'entry_session_ref.runtime_owner': RUNTIME_OWNER,
      'entry_session_ref.entry_session_id': 'session-codex-default',
      'operator_navigation_refs.generated_session_surface_ref': 'opl_generated:product_session',
      'authority_boundary.refs_only': true,
      'authority_boundary.rca_owns_generic_session_shell': false,
    });
    assert.equal(session.session_continuity, undefined);
    assert.equal(session.runtime_loop_closure, undefined);
    assert.equal(session.artifact_inventory, undefined);
  });
});

test('product status keeps overlay stage sequences behind the generated manifest and domain ref', async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const status = await getProductStatus({ workspace_locator: { workspace_root: workspaceRoot } });

    assertPathValues(status, {
      'domain_projection.overlay_stage_sequences_ref': '/deliverable_facade/family_route_policy',
      'domain_projection.ppt_deck_visual_route_truth_ref': '/ppt_deck_visual_route_truth',
      'product_entry_manifest.deliverable_facade.family_route_policy.ppt_deck.protected_stage_sequence': list('storyline detailed_outline slide_blueprint visual_direction author_image_pages visual_director_review screenshot_review repair_image_pages export_pptx'),
      'product_entry_manifest.deliverable_facade.family_route_policy.ppt_deck.default_visual_route': 'author_image_pages',
      'product_entry_manifest.deliverable_facade.family_route_policy.xiaohongshu.protected_stage_sequence': list('research storyline single_note_plan visual_direction author_image_pages visual_director_review screenshot_review repair_image_pages publish_copy export_bundle'),
    });
    assert.equal(status.overlay_stage_sequences, undefined);
    assert.equal(status.ppt_deck_visual_route_truth, undefined);
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

test('product preflight consumes OPL shared builders from latest-stable with an exact lock receipt', async () => {
  const domainEntryPackage = readJson(DOMAIN_ENTRY_PACKAGE_JSON);
  assert.equal(
    domainEntryPackage.dependencies['opl-framework-shared'],
    'git+https://github.com/gaofeng21cn/one-person-lab.git#latest-stable',
  );
  const packageLock = readJson(new URL('../../package-lock.json', import.meta.url));
  assert.match(
    packageLock.packages['node_modules/opl-framework-shared'].resolved,
    /#[0-9a-f]{40}$/,
  );
  const companions = await importDomainEntrySharedModule(PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER);
  assert.equal(typeof companions.buildProductEntryPreflight, 'function');
  assert.equal(typeof companions.buildProgramCheck, 'function');
});
