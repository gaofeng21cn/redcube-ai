import {
  SERIAL_ENV_TEST,
  assert,
  buildOplGeneratedProductSessionForTest,
  buildOplRouteAttemptIndexForTest,
  existsSync,
  getProductEntrySession,
  invokeProductEntry,
  path,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from './product-domain-action-case-shared.ts';

const RUNTIME_OWNER = 'configured_family_runtime_provider';

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

test('getProductEntrySession consumes the pinned OPL generated session surface', async () => {
  const handoffRefs = {
    surface_kind: 'rca_product_entry_session_handoff_refs',
    entry_session_id: 'session-generated-only',
    previous_domain_snapshot_ref: null,
    domain_snapshot_ref: 'domain-snapshot:rca/product-entry/session-generated-only/plan-1',
    delivery_locator_refs: {
      workspace_ref: '/workspace/rca',
      deliverable_family: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: 'deck-a',
      profile_id: 'lecture_student',
    },
    currentness_refs: {
      domain_snapshot_ref: 'domain-snapshot:rca/product-entry/session-generated-only/plan-1',
      latest_surface_kind: 'opl_stage_execution_plan',
      latest_stage_execution_plan_ref: 'opl-stage-execution-plan:plan-1',
      latest_visual_run_ref: null,
      provider_attempt_ref: null,
      provider_attempt_ledger_ref: null,
      cross_provider_attempt_index: null,
      typed_blocker_ref: null,
      next_forced_delta_refs: [],
    },
    stage_folder_locator_refs: ['opl-stage-folder:rca/deck-a/source-intake/attempt-1'],
    artifact_authority_refs: ['artifact:deck-a/storyline'],
    authority_refs: {},
  };
  const generatedSession = buildOplGeneratedProductSessionForTest({
    entrySessionId: 'session-generated-only',
    handoffRefs,
  });

  await assert.rejects(
    () => getProductEntrySession({ entry_session_id: 'session-generated-only' }),
    /opl_generated_session_surface/,
  );
  await assert.rejects(
    () => getProductEntrySession({
      entry_session_id: 'session-generated-only',
      opl_generated_session_surface: {
        ...generatedSession,
        surface_kind: 'opl_product_session_envelope',
      },
    }),
    /opl_generated_product_entry_session_surface/,
  );
  await assert.rejects(
    () => getProductEntrySession({
      entry_session_id: 'session-generated-only',
      opl_generated_session_surface: {
        ...generatedSession,
        version: 'forged-generated-session.v1',
      },
    }),
    /version must be opl-generated-product-entry-session\.v1/,
  );
  await assert.rejects(
    () => getProductEntrySession({
      entry_session_id: 'session-generated-only',
      opl_generated_session_surface: {
        ...generatedSession,
        authority_boundary: {
          ...generatedSession.authority_boundary,
          can_write_domain_truth: true,
        },
      },
    }),
    /authority_boundary\.can_write_domain_truth must be false/,
  );

  const session = await getProductEntrySession({
    entry_session_id: 'session-generated-only',
    opl_generated_session_surface: generatedSession,
  });

  assert.equal(session.surface_kind, 'product_entry_session');
  assert.equal(session.projection_kind, 'rca_product_entry_session_domain_snapshot_refs');
  assert.equal(session.entry_session_ref.entry_session_id, 'session-generated-only');
  assert.equal(
    session.entry_session_ref.generated_session_surface_kind,
    'opl_generated_product_entry_session_surface',
  );
  assert.equal(session.entry_session_ref.domain_snapshot_ref, handoffRefs.domain_snapshot_ref);
  assert.equal(session.entry_session_ref.runtime_owner, RUNTIME_OWNER);
  assert.deepEqual(session.delivery_locator_refs, handoffRefs.delivery_locator_refs);
  assert.equal(
    session.currentness_refs.latest_stage_execution_plan_ref,
    handoffRefs.currentness_refs.latest_stage_execution_plan_ref,
  );
  assert.deepEqual(session.stage_folder_locator_refs, handoffRefs.stage_folder_locator_refs);
  assert.deepEqual(session.artifact_authority_refs, handoffRefs.artifact_authority_refs);
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

test('continuation identity must be re-supplied by an OPL generated session surface', SERIAL_ENV_TEST, async () => {
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

    const generatedSession = buildOplGeneratedProductSessionForTest({
      entrySessionId: 'session-opl-continuation',
      handoffRefs: first.session_handoff_refs,
    });
    assert.equal(first.session_handoff_refs.currentness_refs.provider_attempt_ref, null);
    assert.equal(first.session_handoff_refs.currentness_refs.provider_attempt_ledger_ref, null);
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-opl-continuation',
          provider_attempt_ref: 'opl-provider-attempt:forged',
          provider_attempt_ledger_ref: 'opl-attempt-ledger:forged',
          opl_generated_session_surface: generatedSession,
        },
        delivery_request: {},
      }),
      /provider_attempt_ref does not match the OPL generated session/,
    );
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-opl-continuation',
          opl_generated_session_surface: generatedSession,
        },
        delivery_request: {
          cross_provider_attempt_index: buildOplRouteAttemptIndexForTest({
            route: 'storyline',
            runId: 'forged-null-currentness/storyline',
            topicId: 'topic-a',
            deliverableId: 'deck-opl-continuation',
          }),
        },
      }),
      /cross_provider_attempt_index does not match the OPL generated session currentness/,
    );
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-opl-continuation',
          opl_generated_session_surface: {
            ...generatedSession,
            delivery_identity: {
              ...generatedSession.delivery_identity,
              deliverable_family: 'xiaohongshu',
            },
          },
        },
        delivery_request: {
          stop_after_stage: 'detailed_outline',
        },
      }),
      /delivery_identity\.deliverable_family does not match domain_projection/,
    );
    const continued = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: {
        entry_session_id: 'session-opl-continuation',
        opl_generated_session_surface: generatedSession,
      },
      delivery_request: {
        user_intent: '继续到详细大纲',
        stop_after_stage: 'detailed_outline',
      },
    });

    assert.equal(continued.ok, true);
    assert.equal(continued.session_handoff_refs.delivery_locator_refs.deliverable_id, 'deck-opl-continuation');
    assert.equal(continued.session_handoff_refs.previous_domain_snapshot_ref, first.session_handoff_refs.domain_snapshot_ref);
    assert.deepEqual(
      continued.session_handoff_refs.stage_folder_locator_refs,
      first.session_handoff_refs.stage_folder_locator_refs,
    );
    assertNoGenericSessionShell(continued);
    assert.equal(existsSync(path.join(runtimeStateRoot, 'product-entry-sessions')), false);
  });
});

test('route-run handoff preserves real Stage Folder and artifact authority refs', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const attemptIndex = buildOplRouteAttemptIndexForTest({
      route: 'storyline',
      runId: 'session-route-refs/storyline',
      topicId: 'topic-a',
      deliverableId: 'deck-route-refs',
    });
    const response = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: { entry_session_id: 'session-route-refs' },
      task_intent: 'run_deliverable_route',
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-route-refs',
        profile_id: 'lecture_student',
        title: 'Route refs',
        goal: 'Preserve real route artifacts in the OPL handoff',
        route: 'storyline',
        cross_provider_attempt_index: attemptIndex,
      },
    });
    const route = response.domain_entry_surface.result_surface;

    assert.equal(route.surface_kind, 'route_run');
    assert.equal(route.ok, true);
    assert.equal(route.run.artifact_refs.includes(route.artifactFile), true);
    assert.deepEqual(response.session_handoff_refs.artifact_authority_refs, route.run.artifact_refs);
    for (const suffix of [
      '/deliverable.json',
      '/stage.json',
      '/attempt.json',
      '/manifest.json',
      '/current.json',
      '/latest.json',
      '/latest',
    ]) {
      assert.equal(
        response.session_handoff_refs.stage_folder_locator_refs.some((ref) => ref.endsWith(suffix)),
        true,
        suffix,
      );
    }
    assert.equal(
      response.session_handoff_refs.stage_folder_locator_refs.some((ref) => (
        ref.includes('/outputs/') || ref.includes('/receipts/')
      )),
      false,
    );
    assert.deepEqual(
      response.session_handoff_refs.currentness_refs.cross_provider_attempt_index,
      route.run.cross_provider_attempt_index,
    );

    const generatedSession = buildOplGeneratedProductSessionForTest({
      entrySessionId: 'session-route-refs',
      handoffRefs: response.session_handoff_refs,
    });
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-route-refs',
          provider_attempt_ref: 'opl-provider-attempt:spoofed',
          provider_attempt_ledger_ref: attemptIndex.provider_attempt_ledger_ref,
          opl_generated_session_surface: generatedSession,
        },
        delivery_request: {
          route: 'storyline',
        },
      }),
      /provider_attempt_ref does not match the OPL generated session/,
    );
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-route-refs',
          opl_generated_session_surface: generatedSession,
        },
        task_intent: 'run_deliverable_route',
        delivery_request: {
          route: 'storyline',
          cross_provider_attempt_index: {
            ...attemptIndex,
            provider_attempt_ref: 'opl-provider-attempt:spoofed',
          },
        },
      }),
      /cross_provider_attempt_index\.provider_attempt_ref does not match the OPL generated session/,
    );
    await assert.rejects(
      () => invokeProductEntry({
        workspace_locator: { workspace_root: workspaceRoot },
        entry_session_contract: {
          entry_session_id: 'session-route-refs',
          opl_generated_session_surface: generatedSession,
        },
        task_intent: 'run_deliverable_route',
        delivery_request: {
          route: 'storyline',
          cross_provider_attempt_index: {
            ...generatedSession.domain_projection.currentness_refs.cross_provider_attempt_index,
            stage_attempt_ref: 'opl-stage-attempt:spoofed',
          },
        },
      }),
      /cross_provider_attempt_index\.stage_attempt_ref does not match the OPL generated session/,
    );
  });
});
