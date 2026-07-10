// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  assertFamilyOrchestrationCompanion,
  assertRuntimeLoopClosureShape,
  existsSync,
  getProductEntrySession,
  importDomainEntrySharedModule,
  invokeOplHostedProductEntry,
  invokeProductEntry,
  readJson,
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
  source,
  entryMode = 'redcube_product_entry',
}) {
  assert.equal(surface.ok, true);
  assert.equal(surface.surface_kind, surfaceKind);
  assert.equal(surface.entry_session.entry_session_id, entrySessionId);
  assert.equal(surface.delivery_identity.deliverable_id, deliverableId);
  assert.equal(surface.summary.latest_handle, surface.summary.target_handle);
  assert.equal(surface.continuation_snapshot.latest_stage_execution_plan_ref, surface.summary.target_handle);
  assert.equal(surface.session_continuity.entry_session_id, entrySessionId);
  assert.equal(surface.session_continuity.restore_point.latest_handle, surface.summary.target_handle);
  assert.equal(surface.progress_projection.projection.projection_kind, 'opl_stage_execution_plan_projection');
  assert.equal(surface.artifact_inventory.summary.latest_handle, surface.summary.target_handle);
  assert.equal(surface.review_state.surface_kind, 'review_state');
  assert.equal(surface.publication_projection.surface_kind, 'publication_projection');
  assert.equal(surface.opl_family_lifecycle_adapter.discovery.adoption_state, 'hydrated_session_projection');
  assert.equal(surface.opl_family_lifecycle_adapter.authority_boundary.owns_domain_truth, false);
  assert.equal(surface.opl_family_lifecycle_adapter.authority_boundary.owns_publication_projection, false);
  assertRuntimeLoopClosureShape(surface, { source, entryMode });
  assertFamilyOrchestrationCompanion(surface, {
    sessionLocatorField: 'entry_session.entry_session_id',
  });
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
    assert.equal(response.summary.approval_required, true);
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

test('invokeProductEntry creates a deliverable, delegates to the service-safe domain entry, and persists session continuity', SERIAL_ENV_TEST, async () => {
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
      source: 'direct',
    });

    assert.equal(existsSync(response.entry_session.session_file), true);
    const storedSession = readJson(response.entry_session.session_file);
    assert.equal(storedSession.entry_session_id, 'session-a');
    assert.equal(storedSession.deliverable_family, 'ppt_deck');
    assert.equal(storedSession.topic_id, 'topic-a');
    assert.equal(storedSession.deliverable_id, 'deck-a');
    assert.equal(storedSession.latest_stage_execution_plan_ref, response.summary.target_handle);
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

test('invokeProductEntry can continue the same deliverable from the persisted entry session without respecifying delivery identity', SERIAL_ENV_TEST, async () => {
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

    const continued = await invokeProductEntry(productEntryRequest(
      workspaceRoot,
      'session-a',
      {
        user_intent: '继续推进到最终 PPT',
        stop_after_stage: 'visual_direction',
      },
    ));

    assertProductEntryProjection(continued, {
      entrySessionId: 'session-a',
      deliverableId: 'deck-a',
      source: 'direct',
    });
    assert.equal(continued.entry_session.resumed_from_session, true);
    assert.notEqual(
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
      first.continuation_snapshot.latest_stage_execution_plan_ref,
    );

    const session = await getProductEntrySession({ entry_session_id: 'session-a' });
    assert.equal(session.ok, true);
    assert.equal(session.surface_kind, 'product_entry_session');
    assert.equal(session.projection_kind, 'rca_product_entry_session_domain_snapshot_refs');
    assert.equal(session.entry_session_ref.entry_session_id, 'session-a');
    assert.equal(
      session.entry_session_ref.domain_snapshot_ref,
      'domain-snapshot:rca/product-entry-session/session-a',
    );
    assert.equal(session.delivery_locator_refs.deliverable_id, 'deck-a');
    assert.equal(
      session.currentness_refs.latest_stage_execution_plan_ref,
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
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
    assert.equal(response.opl_family_lifecycle_adapter.owner_route_discovery.current_source, 'opl_hosted');
    assertProductEntryProjection(response.product_entry_surface, {
      entrySessionId: 'session-oplHosted',
      deliverableId: 'deck-fed',
      source: 'opl_hosted',
      entryMode: 'opl_hosted',
    });
    assertRuntimeLoopClosureShape(response, {
      source: 'opl_hosted',
      entryMode: 'opl_hosted',
      runtimeOwner: 'configured_family_runtime_provider',
    });
    assertFamilyOrchestrationCompanion(response, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
  });
});

test('domain-entry shared family orchestration surface exposes the product-entry preset builder', async () => {
  const familyOrchestration = await importDomainEntrySharedModule('opl-framework-shared/family-orchestration');

  assert.equal(
    typeof familyOrchestration.buildFamilyProductEntryPresetOrchestration,
    'function',
  );
});

test('session continuation family orchestration companion uses the shared continuation refs', async () => {
  const companionModule = await import('../../packages/redcube-domain-entry/dist/actions/family-orchestration-companion.js');
  const buildSessionContinuationFamilyOrchestration = companionModule.buildSessionContinuationFamilyOrchestration;
  assert.equal(typeof buildSessionContinuationFamilyOrchestration, 'function');

  const requested = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot: {
      runtime_progress_projection: {
        needs_user_decision: true,
      },
    },
  });
  assert.equal(requested.human_gates[0].status, 'requested');
  assert.deepEqual(requested.human_gates[0].review_surface, {
    ref_kind: 'json_pointer',
    ref: '/review_state',
    label: 'current review state surface',
  });
  assert.deepEqual(requested.event_envelope_surface, {
    ref_kind: 'json_pointer',
    ref: '/continuation_snapshot/stage_execution_plan/stage_attempts',
    label: 'OPL stage execution plan companion',
  });
  assert.deepEqual(requested.checkpoint_lineage_surface, {
    ref_kind: 'json_pointer',
    ref: '/continuation_snapshot/latest_stage_execution_plan_ref',
    label: 'latest OPL stage execution plan locator',
  });

  const approved = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot: {
      runtime_progress_projection: {
        needs_user_decision: false,
      },
    },
    sessionLocatorField: 'entry_session_contract.entry_session_id',
  });
  assert.equal(approved.human_gates[0].status, 'approved');
  assert.equal(
    approved.resume_contract.session_locator_field,
    'entry_session_contract.entry_session_id',
  );
});
