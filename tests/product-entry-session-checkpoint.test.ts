// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  existsSync,
  getProductEntrySession,
  invokeProductEntry,
  path,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

const RUNTIME_OWNER = 'configured_family_runtime_provider';

function oplSessionEnvelope({
  entrySessionId,
  workspaceRoot,
  deliverableId,
  handoffRefs = {},
}) {
  return {
    surface_kind: 'opl_product_session_envelope',
    owner: 'one-person-lab',
    runtime_owner: RUNTIME_OWNER,
    session_ref: `opl-session:${entrySessionId}`,
    entry_session_id: entrySessionId,
    domain_snapshot_ref:
      handoffRefs.domain_snapshot_ref
      || `domain-snapshot:rca/product-entry/${entrySessionId}/plan-1`,
    delivery_locator_refs: handoffRefs.delivery_locator_refs || {
      workspace_ref: workspaceRoot,
      deliverable_family: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: deliverableId,
      profile_id: 'lecture_student',
    },
    currentness_refs: handoffRefs.currentness_refs || {
      latest_surface_kind: 'opl_stage_execution_plan',
      latest_stage_execution_plan_ref: 'opl-stage-execution-plan:plan-1',
      latest_visual_run_ref: null,
      provider_attempt_ref: 'opl-provider-attempt:rca/plan-1',
      provider_attempt_ledger_ref: 'opl-attempt-ledger:rca/plan-1',
      typed_blocker_ref: null,
      next_forced_delta_refs: [],
    },
    stage_folder_locator_refs: handoffRefs.stage_folder_locator_refs || [
      'opl-stage-folder:rca/deck-a/source-intake/attempt-1',
    ],
    artifact_authority_refs: handoffRefs.artifact_authority_refs || [],
  };
}

function assertNoGenericSessionShell(surface) {
  for (const field of [
    'entry_session',
    'continuation_snapshot',
    'session_continuity',
    'progress_projection',
    'artifact_inventory',
    'runtime_loop_closure',
    'opl_family_lifecycle_adapter',
    'family_orchestration',
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(surface, field), false, field);
  }
}

test('getProductEntrySession is a pure OPL-envelope to RCA domain-ref projection', async () => {
  const envelope = oplSessionEnvelope({
    entrySessionId: 'session-envelope-only',
    workspaceRoot: '/workspace/rca',
    deliverableId: 'deck-a',
  });

  await assert.rejects(
    () => getProductEntrySession({ entry_session_id: 'session-envelope-only' }),
    /opl_session_envelope/,
  );
  await assert.rejects(
    () => getProductEntrySession({
      entry_session_id: 'session-envelope-only',
      opl_session_envelope: {
        ...envelope,
        resumed_from_session: true,
      },
    }),
    /resumed_from_session/,
  );

  const session = await getProductEntrySession({
    entry_session_id: 'session-envelope-only',
    opl_session_envelope: envelope,
  });

  assert.equal(session.surface_kind, 'product_entry_session');
  assert.equal(session.projection_kind, 'rca_product_entry_session_domain_snapshot_refs');
  assert.equal(session.entry_session_ref.entry_session_id, 'session-envelope-only');
  assert.equal(session.entry_session_ref.opl_session_ref, 'opl-session:session-envelope-only');
  assert.equal(session.entry_session_ref.domain_snapshot_ref, envelope.domain_snapshot_ref);
  assert.equal(session.entry_session_ref.runtime_owner, RUNTIME_OWNER);
  assert.deepEqual(session.delivery_locator_refs, envelope.delivery_locator_refs);
  assert.deepEqual(session.currentness_refs, {
    domain_snapshot_ref: envelope.domain_snapshot_ref,
    ...envelope.currentness_refs,
  });
  assert.deepEqual(session.stage_folder_locator_refs, envelope.stage_folder_locator_refs);
  assert.equal(session.authority_boundary.refs_only, true);
  assert.equal(session.authority_boundary.rca_owns_generic_session_shell, false);
  assert.equal(session.authority_boundary.rca_owns_generic_workbench, false);
  assert.equal('session_file_ref' in session.entry_session_ref, false);
  assertNoGenericSessionShell(session);
});

test('invokeProductEntry returns domain handoff refs without writing a RCA session store', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const first = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: { entry_session_id: 'session-no-local-store' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-no-local-store',
        profile_id: 'lecture_student',
        title: 'OPL-owned product session',
        goal: '验证 RCA 只返回 domain result refs',
        stop_after_stage: 'storyline',
      },
    });

    assert.equal(first.ok, true);
    assert.equal(first.surface_kind, 'product_entry');
    assert.equal(first.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(first.session_handoff_refs.entry_session_id, 'session-no-local-store');
    assert.equal(first.session_handoff_refs.delivery_locator_refs.deliverable_id, 'deck-no-local-store');
    assert.equal(
      first.session_handoff_refs.currentness_refs.latest_stage_execution_plan_ref,
      first.summary.target_handle,
    );
    assert.equal(first.session_handoff_refs.domain_snapshot_ref.startsWith('domain-snapshot:rca/'), true);
    assert.equal(Array.isArray(first.session_handoff_refs.stage_folder_locator_refs), true);
    assert.equal(Array.isArray(first.session_handoff_refs.artifact_authority_refs), true);
    assertNoGenericSessionShell(first);
    assert.equal(existsSync(path.join(runtimeStateRoot, 'product-entry-sessions')), false);
  });
});

test('continuation identity must be re-supplied by an OPL-owned session envelope', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const first = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: { entry_session_id: 'session-opl-continuation' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-opl-continuation',
        profile_id: 'lecture_student',
        title: 'OPL envelope continuation',
        goal: '验证 continuation identity 归 OPL envelope',
        stop_after_stage: 'storyline',
      },
    });

    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: { entry_session_id: 'session-opl-continuation' },
        delivery_request: { stop_after_stage: 'detailed_outline' },
      }),
      /delivery_request\.deliverable_family/,
    );

    const envelope = oplSessionEnvelope({
      entrySessionId: 'session-opl-continuation',
      workspaceRoot,
      deliverableId: 'deck-opl-continuation',
      handoffRefs: first.session_handoff_refs,
    });
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-opl-continuation',
          opl_session_envelope: {
            ...envelope,
            delivery_locator_refs: {
              ...envelope.delivery_locator_refs,
              deliverable_family: 'xiaohongshu',
            },
          },
        },
        delivery_request: {
          stop_after_stage: 'detailed_outline',
        },
      }),
      /deliverable_family does not match the RCA deliverable record/,
    );
    const continued = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: {
        entry_session_id: 'session-opl-continuation',
        opl_session_envelope: envelope,
      },
      delivery_request: {
        user_intent: '继续到详细大纲',
        stop_after_stage: 'detailed_outline',
      },
    });

    assert.equal(continued.ok, true);
    assert.equal(continued.session_handoff_refs.delivery_locator_refs.deliverable_id, 'deck-opl-continuation');
    assert.equal(continued.session_handoff_refs.opl_session_ref, envelope.session_ref);
    assert.equal(continued.session_handoff_refs.previous_domain_snapshot_ref, envelope.domain_snapshot_ref);
    assert.equal(
      continued.session_handoff_refs.currentness_refs.provider_attempt_ref,
      envelope.currentness_refs.provider_attempt_ref,
    );
    assert.deepEqual(
      continued.session_handoff_refs.stage_folder_locator_refs,
      envelope.stage_folder_locator_refs,
    );
    assertNoGenericSessionShell(continued);
    assert.equal(existsSync(path.join(runtimeStateRoot, 'product-entry-sessions')), false);
  });
});
