import { runFamilyTransition } from 'opl-framework/family-transition-runner';

import {
  SERIAL_ENV_TEST,
  assert,
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

test('OPL transition runner and RCA domain adapter exchange refs without sharing authority', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });
    const transition = manifest.visual_transition_spec.transition_table.find(
      (entry) => entry.transition_id === 'review_ready_to_package',
    );

    assert.equal(
      adapter.domain_authority_refs.visual_transition_spec_ref,
      'opl_generated:product_entry_manifest#/visual_transition_spec',
    );
    assert.ok(transition);

    const guards = Object.fromEntries(transition.required_guard_refs.map((guardId) => [guardId, {}]));
    const result = runFamilyTransition({
      spec: {
        surface_kind: 'family_transition_spec',
        version: 'family-transition-runner.v1',
        spec_id: manifest.visual_transition_spec.spec_id,
        target_domain_id: 'redcube_ai',
        owner: 'redcube_ai',
        authority_boundary: {
          opl_can_write_visual_truth: false,
          opl_can_authorize_visual_ready: false,
          opl_can_authorize_exportable: false,
          opl_can_authorize_handoffable: false,
        },
        guards,
        transitions: [{
          transition_id: transition.transition_id,
          current_state: transition.from_stage,
          event: 'domain_tick',
          required_guards: transition.required_guard_refs,
          next_state: transition.to_stage,
          next_work_unit: null,
          owner_route: {
            owner: 'redcube_ai',
            route_ref: `rca-visual-transition:${transition.transition_id}`,
            action_refs: [transition.owner_action],
          },
          receipt: {
            receipt_refs: [`family-transition-receipt:${transition.transition_id}`],
          },
        }],
      },
      domain_id: 'redcube_ai',
      current_state: transition.from_stage,
      event: 'domain_tick',
      guards: Object.fromEntries(transition.required_guard_refs.map((guardId) => [guardId, true])),
      context: { attempt_id: 'fixture-review-ready' },
    });

    assert.equal(result.status, 'transition_applied');
    assert.equal(result.next_state, transition.to_stage);
    assert.deepEqual(result.owner_route.action_refs, [transition.owner_action]);
    assert.deepEqual(result.receipt.context_refs, ['stage_attempt:fixture-review-ready']);
    assert.deepEqual(result.receipt.receipt_refs, [`family-transition-receipt:${transition.transition_id}`]);
    assert.equal(result.projection.domain_ready_claimed, false);
    assert.equal(result.projection.production_ready_claimed, false);

    const domainReceipt = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'transition-hosted-domain-receipt',
        attempt_ref: result.receipt.context_refs[0],
        artifact_locator_ref: '/artifact_locator_contract',
        memory_receipt_ref: 'rca-memory-receipt:visual-pattern:transition-accepted',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:retention:transition-retention',
        review_export_ref: 'workspace-runtime-ref:review-export:transition-run',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
      },
    });
    assert.equal(domainReceipt.result_surface.return_shape, 'domain_receipt');
    assert.equal(
      domainReceipt.result_surface.receipt_ref,
      'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
    );

    const blockedReceipt = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'transition-hosted-blocker',
        attempt_ref: result.receipt.context_refs[0],
      },
    });
    assert.equal(blockedReceipt.result_surface.return_shape, 'typed_blocker');
    assert.equal(blockedReceipt.result_surface.owner, 'redcube_ai');

    const noRegression = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_no_regression_evidence',
        workspace_root: workspaceRoot,
        evidence_id: 'transition-hosted-no-regression',
      },
    });
    assert.equal(noRegression.result_surface.return_shape, 'no_regression_evidence');
    assert.equal(
      noRegression.result_surface.evidence_ref,
      'rca-no-regression:visual-stage:transition-hosted-no-regression',
    );
  });
});
