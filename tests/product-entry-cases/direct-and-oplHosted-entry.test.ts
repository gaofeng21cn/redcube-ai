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
  path,
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  readJson,
  test,
  withMockCodexRuntimeState,
  prepareProductEntryWorkspace,
} from '../product-domain-action-case-shared.ts';


test('invokeProductEntry converts review-first deck intent into a stop-after-outline lifecycle gate', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-review-first',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-review-first',
        profile_id: 'lecture_student',
        title: 'OPL 系列项目介绍',
        goal: '介绍 OPL 系列项目和 Med Auto Science 自动科研，面向医生专家，20 分钟以上',
        user_intent: '不要一次性生成，先做到故事主线给我看看，我审阅之后再继续往下做',
        lifecycle_policy: 'operator_review_after_plan',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(response.domain_entry_surface.result_surface.control_policy.mode, 'stop_after_stage');
    assert.equal(response.domain_entry_surface.result_surface.control_policy.requested_stop_after_stage, 'detailed_outline');
    assert.equal(response.domain_entry_surface.result_surface.owner, 'one-person-lab');
    assert.equal(response.domain_entry_surface.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
    assert.equal(response.runtime_loop_closure.control_policy.approval_required, true);
    assert.equal(response.summary.approval_required, true);
  });
});

test('invokeProductEntry creates a deliverable, delegates to the service-safe domain entry, and persists session continuity', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const sharedCompanions = await importDomainEntrySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-a',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
        title: 'Product entry proof',
        goal: '验证 direct product entry',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.surface_kind, 'product_entry');
    assert.equal(response.product_entry_contract_id, 'redcube_product_entry');
    assert.deepEqual(
      response.entry_session,
      sharedCompanions.buildEntrySessionSurface({
        entry_session_id: 'session-a',
        session_file: path.join(runtimeStateRoot, 'product-entry-sessions', 'session-a.json'),
        runtime_owner: 'configured_family_runtime_provider',
        resumed_from_session: false,
        created_deliverable: true,
      }),
    );
    assert.deepEqual(
      response.delivery_identity,
      sharedCompanions.buildDeliveryIdentitySurface({
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
      }),
    );
    assert.equal(response.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.deepEqual(
      response.continuation_snapshot,
      sharedCompanions.buildProductEntryContinuationSnapshot({
        latest_run_id: null,
        extra_payload: {
          latest_stage_execution_plan_ref: response.domain_entry_surface.summary.target_handle,
          stage_execution_plan: response.domain_entry_surface.result_surface,
          runtime_progress_projection: response.continuation_snapshot.runtime_progress_projection,
          runtime_projection: response.continuation_snapshot.runtime_projection,
          domain_authority_refs: response.domain_entry_surface.result_surface.authority_refs,
          latest_surface_kind: 'opl_stage_execution_plan',
        },
      }),
    );
    assert.equal(response.session_continuity.surface_kind, 'session_continuity');
    assert.equal(response.session_continuity.entry_session_id, 'session-a');
    assert.equal(response.summary.latest_handle, response.summary.target_handle);
    assert.equal(
      response.summary.approval_required,
      response.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(
      response.summary.gate_status,
      response.runtime_loop_closure.control_policy.gate_status,
    );
    assert.equal(
      response.summary.resume_command,
      response.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      response.summary.session_locator_field,
      response.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      response.summary.checkpoint_locator_field,
      response.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.equal(response.session_continuity.restore_point.latest_handle, response.summary.target_handle);
    assert.equal(
      response.session_continuity.restore_point.latest_stage_execution_plan_ref,
      response.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(response.progress_projection.surface_kind, 'progress_projection');
    assert.equal(response.progress_projection.stage_execution_plan_ref, response.summary.target_handle);
    assert.equal(response.progress_projection.projection.projection_kind, 'opl_stage_execution_plan_projection');
    assert.equal(response.artifact_inventory.surface_kind, 'artifact_inventory');
    assert.equal(response.artifact_inventory.summary.latest_handle, response.summary.target_handle);
    assert.deepEqual(response.artifact_inventory.artifact_refs, []);
    assert.deepEqual(
      response.domain_entry_surface.runtime_session_contract,
      sharedCompanions.buildRuntimeSessionContract({
        runtime_owner: 'configured_family_runtime_provider',
        expected_runtime_owner: 'configured_family_runtime_provider',
        adapter_surface: '@redcube/codex-cli-client',
        session_mode: 'entry_session',
      }),
    );
    assert.deepEqual(
      response.domain_entry_surface.return_surface_contract,
      sharedCompanions.buildReturnSurfaceContract({
        requested_surface_kind: 'opl_stage_execution_plan',
        expected_surface_kind: 'opl_stage_execution_plan',
        actual_surface_kind: 'opl_stage_execution_plan',
        durable_truth_surfaces: [
          'runtimeWatch',
          'getReviewState',
          'getPublicationProjection',
          'auditDeliverable',
        ],
      }),
    );
    assert.equal(response.review_state.surface_kind, 'review_state');
    assert.equal(response.publication_projection.surface_kind, 'publication_projection');
    assert.equal(response.opl_family_lifecycle_adapter.surface_kind, 'opl_family_lifecycle_adapter');
    assert.equal(response.opl_family_lifecycle_adapter.discovery.adoption_state, 'hydrated_session_projection');
    assert.equal(response.opl_family_lifecycle_adapter.persistence.session.entry_session_id, 'session-a');
    assert.equal(
      response.opl_family_lifecycle_adapter.persistence.stage_execution_plan.plan_ref,
      response.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(response.opl_family_lifecycle_adapter.lifecycle.current_stage, response.progress_projection.projection.current_stage);
    assert.equal(response.opl_family_lifecycle_adapter.lifecycle.content_status, response.progress_projection.projection.content_status);
    assert.equal(response.opl_family_lifecycle_adapter.lifecycle.review_publication.review_state_ref.surface_kind, 'review_state');
    assert.equal(response.opl_family_lifecycle_adapter.lifecycle.review_publication.publication_projection_ref.surface_kind, 'publication_projection');
    assert.equal(response.opl_family_lifecycle_adapter.owner_route_discovery.recommended_owner_route, 'resolve_review_gate');
    assert.equal(response.opl_family_lifecycle_adapter.adoption.resume_surface.command, 'opl_generated:product_session --entry-session-id <entry-session-id>');
    assert.equal(response.opl_family_lifecycle_adapter.authority_boundary.owns_domain_truth, false);
    assert.equal(response.opl_family_lifecycle_adapter.authority_boundary.owns_publication_projection, false);
    assertRuntimeLoopClosureShape(response, {
      source: 'direct',
      entryMode: 'redcube_product_entry',
    });
    assertFamilyOrchestrationCompanion(response, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });

    const sessionFile = path.join(runtimeStateRoot, 'product-entry-sessions', 'session-a.json');
    assert.equal(existsSync(sessionFile), true);
    const storedSession = readJson(sessionFile);
    assert.equal(storedSession.entry_session_id, 'session-a');
    assert.equal(storedSession.deliverable_family, 'ppt_deck');
    assert.equal(storedSession.topic_id, 'topic-a');
    assert.equal(storedSession.deliverable_id, 'deck-a');
    assert.equal(storedSession.latest_stage_execution_plan_ref, response.continuation_snapshot.latest_stage_execution_plan_ref);
    assert.equal('latest_stage_execution_plan_ref' in storedSession, true);
  });
});

test('invokeProductEntry rejects retired deliverable task intent without compatibility alias', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const retiredManagedDeliverableIntent = ['run', 'managed', 'deliverable'].join('_');

    await assert.rejects(
      () => invokeProductEntry({
        task_intent: retiredManagedDeliverableIntent,
        workspace_locator: {
          workspace_root: workspaceRoot,
        },
        entry_session_contract: {
          entry_session_id: 'session-retired-managed-intent',
        },
        delivery_request: {
          deliverable_family: 'ppt_deck',
          topic_id: 'topic-a',
          deliverable_id: 'deck-retired-managed-intent',
        },
      }),
      new RegExp(`Unsupported task_intent: ${retiredManagedDeliverableIntent}`),
    );
  });
});

test('invokeProductEntry can continue the same deliverable from the persisted entry session without respecifying delivery identity', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const sharedCompanions = await importDomainEntrySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-a',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
        title: 'Product entry proof',
        goal: '验证 session continuity',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });

    const continued = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-a',
      },
      delivery_request: {
        user_intent: '继续推进到最终 PPT',
        stop_after_stage: 'visual_direction',
      },
    });

    assert.equal(first.ok, true);
    assert.equal(continued.ok, true);
    assert.equal(continued.surface_kind, 'product_entry');
    assert.deepEqual(
      continued.entry_session,
      sharedCompanions.buildEntrySessionSurface({
        entry_session_id: 'session-a',
        session_file: continued.entry_session.session_file,
        runtime_owner: 'configured_family_runtime_provider',
        resumed_from_session: true,
        created_deliverable: false,
      }),
    );
    assert.deepEqual(
      continued.delivery_identity,
      sharedCompanions.buildDeliveryIdentitySurface({
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
      }),
    );
    assert.equal(continued.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(continued.domain_entry_surface.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(
      continued.continuation_snapshot.latest_stage_execution_plan_ref !== first.continuation_snapshot.latest_stage_execution_plan_ref,
      true,
    );

    const session = await getProductEntrySession({
      entry_session_id: 'session-a',
    });

    assert.equal(session.ok, true);
    assert.equal(session.surface_kind, 'product_entry_session');
    assert.deepEqual(
      session.entry_session,
      sharedCompanions.buildEntrySessionSurface({
        entry_session_id: 'session-a',
        session_file: session.entry_session.session_file,
        runtime_owner: 'configured_family_runtime_provider',
      }),
    );
    assert.deepEqual(
      session.delivery_identity,
      sharedCompanions.buildDeliveryIdentitySurface({
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
      }),
    );
    assert.deepEqual(
      session.continuation_snapshot,
      sharedCompanions.buildProductEntryContinuationSnapshot({
        latest_run_id: continued.continuation_snapshot.latest_run_id,
        extra_payload: {
          latest_stage_execution_plan_ref: continued.continuation_snapshot.latest_stage_execution_plan_ref,
          stage_execution_plan: session.continuation_snapshot.stage_execution_plan,
          runtime_progress_projection: session.continuation_snapshot.runtime_progress_projection,
          runtime_projection: session.continuation_snapshot.runtime_projection,
          closeout_first_blocker: null,
          progress_delta: null,
          stall_lineage: null,
          latest_surface_kind: 'opl_stage_execution_plan',
        },
      }),
    );
    assert.equal(session.session_continuity.surface_kind, 'session_continuity');
    assert.equal(session.session_continuity.entry_session_id, 'session-a');
    assert.deepEqual(session.session_continuity.generated_session_shell_boundary, {
      surface_kind: 'generated_session_shell_boundary',
      surface_id: 'product_entry_continuity_refs_adapter',
      generated_session_shell_owner: 'one-person-lab',
      generated_session_command: 'opl_generated:product_session',
      generated_session_command_template: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      rca_role: 'entry_session_domain_snapshot_refs_only_adapter',
      classification: 'refs_only_read_model',
      default_caller_status: 'opl_generated_session_shell_domain_refs',
      rca_projection_mode: 'entry_session_domain_snapshot_refs_only',
      rca_exports_only: [
        'entry_session_id',
        'topic_deliverable_run_locator_refs',
        'latest_visual_run_ref',
        'domain_snapshot_ref',
      ],
      retained_rca_authority: [
        'entry_session_domain_refs',
        'deliverable_locator_refs',
        'latest_visual_run_ref',
      ],
      rca_owns_generic_session_shell: false,
      rca_owns_generic_workbench: false,
      rca_owns_generated_wrapper: false,
      physical_delete_authorized_now: false,
      physical_delete_requires_owner_receipt_ref:
        'rca-typed-blocker:private-platform-retirement:product-entry-continuity-refs-adapter:physical-delete-requires-explicit-owner-receipt',
      no_forbidden_write_ref:
        'no-forbidden-write:rca/default-caller-deletion/product_entry_continuity_refs_adapter/refs-only-boundary',
      forbidden_writes: [
        'visual_truth_body',
        'artifact_body',
        'visual_memory_body',
        'review_export_verdict_body',
        'owner_receipt_body',
        'generic_session_store_state',
        'generic_workbench_state',
      ],
    });
    assert.equal(session.session_continuity.summary.default_caller, 'opl_generated:product_session');
    assert.equal(session.summary.target_handle, session.summary.latest_handle);
    assert.equal(session.ppt_deck_visual_route_session.default_visual_route, 'author_image_pages');
    assert.equal(session.ppt_deck_visual_route_session.route_selection_policy.style_reference_dir_input, 'delivery_request.style_reference_dir');
    assert.equal(
      session.summary.approval_required,
      session.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(
      session.summary.gate_status,
      session.runtime_loop_closure.control_policy.gate_status,
    );
    assert.equal(
      session.summary.resume_command,
      session.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      session.summary.session_locator_field,
      session.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      session.summary.checkpoint_locator_field,
      session.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.equal(session.session_continuity.restore_point.latest_handle, continued.summary.target_handle);
    assert.equal(session.session_continuity.restore_point.latest_stage_execution_plan_ref, continued.summary.target_handle);
    assert.deepEqual(session.artifact_inventory.restore_point, session.session_continuity.restore_point);
    assert.equal(session.progress_projection.surface_kind, 'progress_projection');
    assert.equal(session.progress_projection.projection.projection_kind, 'opl_stage_execution_plan_projection');
    assert.deepEqual(session.artifact_inventory.artifact_refs, []);
    assert.equal(session.review_state.surface_kind, 'review_state');
    assert.equal(session.publication_projection.surface_kind, 'publication_projection');
    assert.equal(session.opl_family_lifecycle_adapter.surface_kind, 'opl_family_lifecycle_adapter');
    assert.equal(session.opl_family_lifecycle_adapter.discovery.adoption_state, 'hydrated_session_projection');
    assert.equal(session.opl_family_lifecycle_adapter.persistence.session.entry_session_id, 'session-a');
    assert.equal(
      session.opl_family_lifecycle_adapter.persistence.stage_execution_plan.plan_ref,
      session.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(session.opl_family_lifecycle_adapter.lifecycle.content_status, session.progress_projection.projection.content_status);
    assert.equal(session.opl_family_lifecycle_adapter.owner_route_discovery.candidate_routes[0].route_id, 'product_entry_session');
    assert.equal(session.opl_family_lifecycle_adapter.adoption.adoption_command, 'opl_generated:product_session --entry-session-id <entry-session-id>');
    assert.equal(session.opl_family_lifecycle_adapter.persistence.sqlite.status, 'not_domain_owned_generic_persistence');
    assertRuntimeLoopClosureShape(continued, {
      source: 'direct',
      entryMode: 'redcube_product_entry',
    });
    assertRuntimeLoopClosureShape(session, {
      source: 'session',
      entryMode: 'redcube_product_entry',
    });
    assertFamilyOrchestrationCompanion(continued, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
    assertFamilyOrchestrationCompanion(session, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
  });
});

test('invokeOplHostedProductEntry validates the OPL envelope and converges onto the same downstream product-entry surface', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const sharedCompanions = await importDomainEntrySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeOplHostedProductEntry({
      target_domain_id: 'redcube_ai',
      task_intent: 'run_opl_stage_execution_plan',
      entry_mode: 'opl_hosted',
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      runtime_session_contract: {
        runtime_owner: 'configured_family_runtime_provider',
      },
      return_surface_contract: {
        surface_kind: 'product_entry',
      },
      entry_session_contract: {
        entry_session_id: 'session-oplHosted',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-fed',
        profile_id: 'lecture_student',
        title: 'OplHosted product entry proof',
        goal: '验证 OPL-hosted stage runtime handoff',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.surface_kind, 'opl_hosted_product_entry');
    assert.equal(response.opl_hosted_product_entry_contract_id, 'opl_framework_hosted_product_entry');
    assert.equal(response.target_domain_id, 'redcube_ai');
    assert.equal(response.entry_mode, 'opl_hosted');
    assert.deepEqual(
      response.runtime_session_contract,
      sharedCompanions.buildRuntimeSessionContract({
        runtime_owner: 'configured_family_runtime_provider',
        expected_runtime_owner: 'configured_family_runtime_provider',
      }),
    );
    assert.deepEqual(
      response.return_surface_contract,
      sharedCompanions.buildReturnSurfaceContract({
        requested_surface_kind: 'product_entry',
        expected_surface_kind: 'product_entry',
        actual_surface_kind: 'product_entry',
      }),
    );
    assert.equal(response.product_entry_surface.surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.entry_session.entry_session_id, 'session-oplHosted');
    assert.deepEqual(response.entry_session, response.product_entry_surface.entry_session);
    assert.deepEqual(response.delivery_identity, response.product_entry_surface.delivery_identity);
    assert.deepEqual(response.continuation_snapshot, response.product_entry_surface.continuation_snapshot);
    assert.deepEqual(response.review_state, response.product_entry_surface.review_state);
    assert.deepEqual(response.publication_projection, response.product_entry_surface.publication_projection);
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_mode, 'opl_hosted');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.summary.latest_handle, response.summary.target_handle);
    assert.equal(
      response.summary.approval_required,
      response.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(
      response.summary.gate_status,
      response.runtime_loop_closure.control_policy.gate_status,
    );
    assert.equal(
      response.summary.resume_command,
      response.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      response.summary.session_locator_field,
      response.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      response.summary.checkpoint_locator_field,
      response.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.equal(response.product_entry_surface.continuation_snapshot.latest_stage_execution_plan_ref, response.summary.target_handle);
    assert.equal(response.session_continuity.entry_session_id, 'session-oplHosted');
    assert.deepEqual(response.session_continuity, response.product_entry_surface.session_continuity);
    assert.deepEqual(response.progress_projection, response.product_entry_surface.progress_projection);
    assert.deepEqual(response.artifact_inventory, response.product_entry_surface.artifact_inventory);
    assert.deepEqual(response.opl_family_lifecycle_adapter, response.product_entry_surface.opl_family_lifecycle_adapter);
    assert.equal(response.opl_family_lifecycle_adapter.owner_route_discovery.current_source, 'opl_hosted');
    assert.equal(response.opl_family_lifecycle_adapter.discovery.adoption_state, 'hydrated_session_projection');
    assert.equal(response.product_entry_surface.session_continuity.entry_session_id, 'session-oplHosted');
    assert.equal(response.product_entry_surface.session_continuity.restore_point.latest_handle, response.summary.target_handle);
    assertRuntimeLoopClosureShape(response.product_entry_surface, {
      source: 'opl_hosted',
      entryMode: 'opl_hosted',
      runtimeOwner: 'configured_family_runtime_provider',
    });
    assert.equal(response.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(response.runtime_loop_closure.source_linkage.current_source, 'opl_hosted');
    assert.equal(response.runtime_loop_closure.source_linkage.entry_mode, 'opl_hosted');
    assert.deepEqual(
      response.runtime_loop_closure.loop_owner,
      response.product_entry_surface.runtime_loop_closure.loop_owner,
    );
    assertFamilyOrchestrationCompanion(response, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
    assertFamilyOrchestrationCompanion(response.product_entry_surface, {
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
