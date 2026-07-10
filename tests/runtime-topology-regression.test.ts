// @ts-nocheck
import {
  test,
  assert,
  os,
  path,
  existsSync,
  mkdtempSync,
  createDeliverable,
  runDeliverableRoute,
  withMockCodexRuntime,
} from './runtime-deliverable-route-cases/shared.ts';

test('completed deliverable routes keep Codex runtime topology and OPL attempt refs', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-topology-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.runtime_topology.runtime_substrate_owner, 'Codex CLI');
    assert.equal(result.run.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
    assert.equal(result.run.runtime_topology.generic_executor_adapter_owner, 'one-person-lab');
    assert.equal(result.run.runtime_topology.domain_authority_owner, 'redcube_ai');
    assert.equal(result.run.runtime_topology.rca_owns_generic_runtime, false);
    assert.equal(result.run.runtime_topology.deployment_host_status, 'active_primary');
    assert.equal(
      result.run.runtime_topology.domain_entry_protocol_role,
      'visual_deliverable_domain_entry_protocol_boundary',
    );
    assert.equal('gateway_role' in result.run.runtime_topology, false);
    assert.equal(result.run.route_execution_ref_boundary.generic_attempt_ledger_owner, 'one-person-lab');
    assert.equal(result.run.route_execution_ref_boundary.rca_owns_generic_runtime_record_store, false);
    assert.equal(result.run.route_execution_ref_boundary.rca_owns_generic_event_log, false);
    assert.equal('route_run_record_boundary' in result.run, false);
    assert.equal(result.events[0].type, 'codex_route_started');
    assert.equal(result.events.at(-1).type, 'run_completed');
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
  });
});
