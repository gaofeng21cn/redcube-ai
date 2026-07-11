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

function assertNoActiveBridgeContractWording(surface) {
  assert.equal(surface === undefined || surface === null, false);
  const text = JSON.stringify(surface);
  assert.equal(text.includes('bridge contract'), false);
  assert.equal(text.includes('单独的 bridge'), false);
}

test('product status, preflight, and CLI manifest stay aligned with the product-entry manifest projection', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });

    const status = await getProductStatus({
      workspace_root: workspaceRoot,
    });
    assert.equal(status.ok, undefined);
    assert.equal(status.surface_kind, 'opl_generated_product_entry_domain_surface');
    assert.equal(status.generated_surface_kind, 'product_entry_surface');
    assert.equal(status.generated_interface_owner, 'one-person-lab');
    assert.equal(status.generated_for_domain_id, 'redcube_ai');
    assert.equal(status.domain_owner, 'redcube_ai');
    assertNoActiveBridgeContractWording(status.product_entry_surface);
    assertNoActiveBridgeContractWording(status.entry_surfaces.status);
    assert.match(
      status.product_entry_surface.summary,
      /OPL generated product-entry overview\/status shell/,
    );
    assertNoActiveBridgeContractWording(manifest.entry_status_surface);
    assertNoActiveBridgeContractWording(manifest.product_entry_shell.status);
    assert.equal(status.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(status.product_entry_overview.progress_surface.surface_kind, 'product_entry_session');
    assert.equal(status.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(status.product_entry_start.recommended_mode_id, 'direct');
    assert.deepEqual(
      status.product_entry_start.modes.map((mode) => mode.mode_id),
      ['direct', 'opl_hosted', 'session'],
    );
    assert.deepEqual(status.product_entry_start, manifest.product_entry_start);
    assert.equal(status.native_ppt_operator_ux, undefined);
    assert.equal(status.workspace_receipt_inventory_projection, undefined);
    assert.equal(status.operator_evidence_readiness_projection, undefined);
    assert.equal(status.runtime_loop_closure, undefined);
    assert.equal(status.domain_projection.native_ppt_helper_descriptor_ref, '/native_ppt_operator_ux');
    assert.equal(
      status.domain_projection.workspace_receipt_inventory_ref,
      '/workspace_receipt_inventory_projection',
    );
    assert.equal(status.authority_boundary.generated_surface_only, true);
    assert.equal(status.authority_boundary.can_write_domain_truth, false);
    assert.equal(status.authority_boundary.can_create_typed_blocker, false);
    assert.equal(
      status.product_entry_overview.resume_surface.command,
      'opl_generated:product_session --entry-session-id <entry-session-id>',
    );
    assert.equal(status.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(status.product_entry_readiness.verdict, 'service_surface_ready_not_end_user_shell');
    assert.equal(status.product_entry_readiness.usable_now, true);
    assert.equal(status.product_entry_readiness.good_to_use_now, false);
    assert.equal(status.product_entry_readiness.recommended_start_command, 'redcube product invoke');
    assert.equal(status.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(status.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      status.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(status.product_entry_preflight, manifest.product_entry_preflight);
    assert.match(status.product_entry_quickstart.summary, /generated entry/);
    assert.match(status.product_entry_quickstart.steps[1].summary, /generated session and progress projection/);
    assert.equal(status.product_entry_quickstart.recommended_step_id, 'continue_current_loop');
    assert.equal(status.product_entry_quickstart.steps[1].step_id, 'inspect_current_progress');
    assert.equal(status.product_entry_quickstart.steps[1].surface_kind, 'product_entry_session');
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
    assert.equal(preflight.runtime_loop_closure, undefined);
    assert.equal(
      preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      preflight.recommended_start_command,
      `redcube product invoke --workspace-root ${workspaceRoot} --entry-session-id <entry-session-id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`,
    );
    assert.deepEqual(preflight.blocking_check_ids, []);
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure, undefined);

    try {
      execFileSync(
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
      );
      assert.fail('repo-local product manifest CLI wrapper must fail closed');
    } catch (error) {
      const failure = JSON.parse(error.stdout);
      assert.equal(failure.ok, false);
      assert.equal(failure.error_kind, 'cli_usage_error');
      assert.match(failure.error, /product 命令仅保留 invoke domain handler target/);
      assert.match(failure.error, /generated\/default wrapper 由 OPL 持有/);
    }
  });
});
