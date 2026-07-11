import {
  SERIAL_ENV_TEST,
  assert,
  buildOplGeneratedProductSessionForTest,
  getProductEntrySession,
  importDomainEntrySharedModule,
  invokeOplHostedProductEntry,
  invokeProductEntry,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../product-domain-action-case-shared.ts';

function deckDeliveryRequest(overrides = {}) {
  return {
    deliverable_family: 'ppt_deck',
    topic_id: 'topic-a',
    profile_id: 'lecture_student',
    ...overrides,
  };
}

function productEntryRequest(workspaceRoot, entrySessionId, deliveryRequest, overrides = {}) {
  return {
    ...overrides,
    workspace_locator: { workspace_root: workspaceRoot },
    entry_session_contract: { entry_session_id: entrySessionId },
    delivery_request: deliveryRequest,
  };
}

function assertProductEntryProjection(surface, {
  surfaceKind = 'product_entry',
  entrySessionId,
  deliverableId,
}) {
  assert.equal(surface.ok, true);
  assert.equal(surface.surface_kind, surfaceKind);
  assert.equal(surface.session_handoff_refs.entry_session_id, entrySessionId);
  assert.equal(surface.session_handoff_refs.delivery_locator_refs.deliverable_id, deliverableId);
  assert.equal(
    surface.session_handoff_refs.currentness_refs.latest_stage_execution_plan_ref,
    surface.summary.target_handle,
  );
  assert.equal(surface.summary.latest_handle, surface.summary.target_handle);
  assert.equal(surface.review_state.surface_kind, 'review_state');
  assert.equal(surface.publication_projection.surface_kind, 'publication_projection');
  assert.equal(surface.authority_boundary.generic_session_runtime_owner, 'one-person-lab');
  assert.equal(surface.authority_boundary.rca_owns_generic_session_runtime, false);
  for (const retiredField of [
    'entry_session',
    'continuation_snapshot',
    'session_continuity',
    'progress_projection',
    'artifact_inventory',
    'runtime_loop_closure',
    'family_orchestration',
  ]) {
    assert.equal(retiredField in surface, false, retiredField);
  }
}

test('invokeProductEntry converts review-first deck intent into a stop-after-outline lifecycle gate', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(productEntryRequest(
      workspaceRoot,
      'session-review-first',
      deckDeliveryRequest({
        deliverable_id: 'deck-review-first',
        title: 'OPL 系列项目介绍',
        goal: '介绍 OPL 系列项目和 Med Auto Science 自动科研，面向医生专家，20 分钟以上',
        user_intent: '不要一次性生成，先做到故事主线给我看看，我审阅之后再继续往下做',
        lifecycle_policy: 'operator_review_after_plan',
      }),
    ));

    assert.equal(response.ok, true);
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(response.domain_entry_surface.result_surface.control_policy.mode, 'stop_after_stage');
    assert.equal(response.domain_entry_surface.result_surface.control_policy.requested_stop_after_stage, 'detailed_outline');
    assert.equal(response.domain_entry_surface.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
    assert.equal(response.session_handoff_refs.entry_session_id, 'session-review-first');
  });
});

test('invokeProductEntry treats route as a StageRun stop target unless route handler intent is explicit', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(productEntryRequest(
      workspaceRoot,
      'session-route-defaults-to-stagerun',
      deckDeliveryRequest({
        deliverable_id: 'deck-route-defaults-to-stagerun',
        title: 'Route defaults to StageRun',
        goal: '验证 route 默认进入 OPL StageRun plan',
        route: 'storyline',
      }),
    ));

    assert.equal(response.ok, true);
    assert.equal(response.summary.task_intent, 'run_opl_stage_execution_plan');
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(response.domain_entry_surface.result_surface.delivery_identity.route, 'storyline');
    assert.equal(response.domain_entry_surface.result_surface.control_policy.requested_stop_after_stage, 'storyline');
  });
});

test('invokeProductEntry fails closed when stop_after_stage precedes route on the declared path', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    await assert.rejects(
      () => invokeProductEntry(productEntryRequest(
        workspaceRoot,
        'session-reversed-route-stop',
        deckDeliveryRequest({
          deliverable_id: 'deck-reversed-route-stop',
          title: 'Reversed route stop',
          goal: '验证 route 和 stop 的顺序门',
          route: 'visual_direction',
          stop_after_stage: 'storyline',
        }),
      )),
      /stop_after_stage=storyline precedes route=visual_direction on the declared ordered path/,
    );
  });
});

test('invokeProductEntry accepts an alternate route and later stop on one declared path', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(productEntryRequest(
      workspaceRoot,
      'session-alternate-route-stop',
      deckDeliveryRequest({
        deliverable_id: 'deck-alternate-route-stop',
        title: 'Alternate route stop',
        goal: '验证 alternate route 和 stop 共用有序路径',
        route: 'render_html',
        stop_after_stage: 'screenshot_review',
      }),
    ));

    assert.equal(response.ok, true);
    assert.equal(response.domain_entry_surface.result_surface.delivery_identity.route, 'render_html');
    assert.equal(
      response.domain_entry_surface.result_surface.control_policy.requested_stop_after_stage,
      'screenshot_review',
    );
  });
});

test('invokeProductEntry creates a deliverable and returns OPL-owned session handoff refs', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const response = await invokeProductEntry(productEntryRequest(
      workspaceRoot,
      'session-a',
      deckDeliveryRequest({
        deliverable_id: 'deck-a',
        title: 'Product entry proof',
        goal: '验证 direct product entry',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      }),
    ));

    assert.equal(response.product_entry_contract_id, 'redcube_product_entry');
    assert.equal(response.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(response.domain_entry_surface.runtime_session_contract.adapter_surface, 'opl_codex_executor');
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assertProductEntryProjection(response, {
      entrySessionId: 'session-a',
      deliverableId: 'deck-a',
    });
  });
});

test('invokeProductEntry rejects retired deliverable task intent without compatibility alias', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const retiredManagedDeliverableIntent = ['run', 'managed', 'deliverable'].join('_');
    await assert.rejects(
      () => invokeProductEntry(productEntryRequest(
        workspaceRoot,
        'session-retired-managed-intent',
        {
          deliverable_family: 'ppt_deck',
          topic_id: 'topic-a',
          deliverable_id: 'deck-retired-managed-intent',
        },
        { task_intent: retiredManagedDeliverableIntent },
      )),
      new RegExp(`Unsupported task_intent: ${retiredManagedDeliverableIntent}`),
    );
  });
});

test('invokeProductEntry continues only from the OPL generated session surface', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await invokeProductEntry(productEntryRequest(
      workspaceRoot,
      'session-a',
      deckDeliveryRequest({
        deliverable_id: 'deck-a',
        title: 'Product entry proof',
        goal: '验证 session continuity',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      }),
    ));

    const firstGeneratedSession = buildOplGeneratedProductSessionForTest({
      entrySessionId: 'session-a',
      handoffRefs: first.session_handoff_refs,
    });
    const continued = await invokeProductEntry({
      workspace_locator: { workspace_root: workspaceRoot },
      entry_session_contract: {
        entry_session_id: 'session-a',
        opl_generated_session_surface: firstGeneratedSession,
      },
      delivery_request: {
        user_intent: '继续推进到最终 PPT',
        stop_after_stage: 'visual_direction',
      },
    });

    assertProductEntryProjection(continued, {
      entrySessionId: 'session-a',
      deliverableId: 'deck-a',
    });
    assert.equal(
      continued.session_handoff_refs.previous_domain_snapshot_ref,
      first.session_handoff_refs.domain_snapshot_ref,
    );
    assert.notEqual(
      continued.session_handoff_refs.currentness_refs.latest_stage_execution_plan_ref,
      first.session_handoff_refs.currentness_refs.latest_stage_execution_plan_ref,
    );

    const session = await getProductEntrySession({
      entry_session_id: 'session-a',
      opl_generated_session_surface: buildOplGeneratedProductSessionForTest({
        entrySessionId: 'session-a',
        handoffRefs: continued.session_handoff_refs,
      }),
    });
    assert.equal(session.ok, true);
    assert.equal(session.surface_kind, 'product_entry_session');
    assert.equal(session.projection_kind, 'rca_product_entry_session_domain_snapshot_refs');
    assert.equal(session.entry_session_ref.entry_session_id, 'session-a');
    assert.equal(
      session.entry_session_ref.domain_snapshot_ref,
      continued.session_handoff_refs.domain_snapshot_ref,
    );
    assert.equal(session.delivery_locator_refs.deliverable_id, 'deck-a');
    assert.equal(
      session.currentness_refs.latest_stage_execution_plan_ref,
      continued.session_handoff_refs.currentness_refs.latest_stage_execution_plan_ref,
    );
    assert.equal(session.operator_navigation_refs.generated_session_surface_ref, 'opl_generated:product_session');
    assert.equal(session.authority_refs.review_state_ref, 'domain-handler:getReviewState');
    assert.equal(session.authority_boundary.refs_only, true);
    assert.equal(session.authority_boundary.rca_owns_generic_session_shell, false);
    assert.equal(session.authority_boundary.rca_owns_generic_workbench, false);
  });
});

test('invokeOplHostedProductEntry validates the OPL envelope and converges onto the same downstream product-entry surface', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeOplHostedProductEntry({
      target_domain_id: 'redcube_ai',
      task_intent: 'run_opl_stage_execution_plan',
      entry_mode: 'opl_hosted',
      workspace_locator: { workspace_root: workspaceRoot },
      runtime_session_contract: {
        runtime_owner: 'configured_family_runtime_provider',
      },
      return_surface_contract: {
        surface_kind: 'product_entry',
      },
      entry_session_contract: { entry_session_id: 'session-oplHosted' },
      delivery_request: deckDeliveryRequest({
        deliverable_id: 'deck-fed',
        title: 'OplHosted product entry proof',
        goal: '验证 OPL-hosted stage runtime handoff',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      }),
    });

    assert.equal(response.ok, true);
    assert.equal(response.surface_kind, 'opl_hosted_product_entry');
    assert.equal(response.opl_hosted_product_entry_contract_id, 'opl_framework_hosted_product_entry');
    assert.equal(response.target_domain_id, 'redcube_ai');
    assert.equal(response.entry_mode, 'opl_hosted');
    assert.equal(response.return_surface_contract.actual_surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_mode, 'opl_hosted');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assertProductEntryProjection(response.product_entry_surface, {
      entrySessionId: 'session-oplHosted',
      deliverableId: 'deck-fed',
    });
    assert.deepEqual(response.session_handoff_refs, response.product_entry_surface.session_handoff_refs);
    assert.equal(response.authority_boundary.rca_owns_generic_session_runtime, false);
  });
});

test('domain-entry shared family orchestration surface exposes the product-entry preset builder', async () => {
  const familyOrchestration = await importDomainEntrySharedModule('opl-framework/family-orchestration');

  assert.equal(
    typeof familyOrchestration.buildFamilyProductEntryPresetOrchestration,
    'function',
  );
});
