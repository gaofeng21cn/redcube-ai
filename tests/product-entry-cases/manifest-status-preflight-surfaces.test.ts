// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  assertFamilyOrchestrationCompanion,
  execFileSync,
  getProductEntryManifest,
  getProductStatus,
  getProductPreflight,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../product-domain-action-case-shared.ts';

test('product status, preflight, and CLI manifest stay aligned with the product-entry manifest projection', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });

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
    assert.deepEqual(
      status.workspace_receipt_inventory_projection,
      manifest.workspace_receipt_inventory_projection,
    );
    assert.deepEqual(
      status.operator_evidence_readiness_projection,
      manifest.operator_evidence_readiness_projection,
    );
    assert.equal(status.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(status.runtime_loop_closure.source_linkage.current_source, 'product_entry_overview');
    assert.equal(status.runtime_loop_closure.source_linkage.entry_mode, 'product_entry_overview_projection');
    assert.equal(
      status.product_entry_overview.resume_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(status.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(status.product_entry_readiness.verdict, 'service_surface_ready_not_end_user_shell');
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
