// @ts-nocheck
import {
  buildOplProductEntryLifecycleAdapterSurface,
} from 'opl-framework-shared/product-entry-companions';
import { safeText } from './action-utils.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deltaPayload(value, domainAlias) {
  if (isPlainObject(value)) {
    return {
      count: Number.isFinite(Number(value.count)) ? Number(value.count) : 0,
      refs: safeArray(value.refs).filter((ref) => safeText(ref)),
      domain_alias: safeText(value.domain_alias, domainAlias),
    };
  }
  const count = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  return {
    count,
    refs: [],
    domain_alias: domainAlias,
  };
}

function nextForcedDeltaPayload(progressDelta, projection) {
  if (isPlainObject(progressDelta?.next_forced_delta)) {
    return progressDelta.next_forced_delta;
  }
  const contentStatus = safeText(projection?.content_status);
  if (contentStatus === 'blocked_missing_provider_attempt_ledger') {
    return {
      surface_kind: 'next_forced_delta',
      domain_alias: 'provider_ledger_closeout_binding_delta',
      delta_kind: 'provider_ledger_closeout_binding',
      required_output_kind: 'provider_attempt_ledger_binding',
      owner: 'one-person-lab',
      next_required_owner_action: 'resolve_provider_attempt_ledger',
      refs: [],
    };
  }
  if (safeText(projection?.typed_blocker_ref) || contentStatus === 'blocked_pending_closeout') {
    return {
      surface_kind: 'next_forced_delta',
      domain_alias: 'operator_typed_blocker_delta',
      delta_kind: 'operator_typed_blocker',
      required_output_kind: 'typed_blocker_resolution',
      owner: REDCUBE_LOOP_OWNER,
      next_required_owner_action: 'consume_route_closeout',
      refs: safeText(projection?.typed_blocker_ref) ? [safeText(projection.typed_blocker_ref)] : [],
    };
  }
  return {
    surface_kind: 'next_forced_delta',
    domain_alias: 'visual_deliverable_delta',
    delta_kind: 'visual_deliverable_delta',
    required_output_kind: 'visual_deliverable_delta',
    owner: REDCUBE_LOOP_OWNER,
    next_required_owner_action: contentStatus === 'completed'
      ? 'pick_up_artifacts'
      : 'continue_autonomous_run',
    refs: [],
  };
}

const PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE = 'opl_generated:product_session --entry-session-id <entry-session-id>';
const REDCUBE_LOOP_OWNER = 'redcube_ai';
const REDCUBE_OPERATOR_REVIEW_GATE_ID = 'redcube_operator_review_gate';
const DEFAULT_INTERRUPT_POLICY = 'continue_autonomously_until_runtime_gate';
const REVIEW_INTERRUPT_POLICY = 'human_gate_required_before_continuation';

const SESSION_REFS_ADAPTER_EXPORTS = Object.freeze([
  'entry_session_id',
  'topic_deliverable_run_locator_refs',
  'latest_visual_run_ref',
  'domain_snapshot_ref',
]);

const SESSION_REFS_ADAPTER_RETAINED_RCA_AUTHORITY = Object.freeze([
  'entry_session_domain_refs',
  'deliverable_locator_refs',
  'latest_visual_run_ref',
]);

function buildGeneratedSessionShellBoundary() {
  return {
    surface_kind: 'generated_session_shell_boundary',
    surface_id: 'product_entry_continuity_refs_adapter',
    generated_session_shell_owner: 'one-person-lab',
    generated_session_command: 'opl_generated:product_session',
    generated_session_command_template: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
    rca_role: 'entry_session_domain_snapshot_refs_only_adapter',
    classification: 'refs_only_read_model',
    generic_session_shell_owner: 'one-person-lab',
    generic_workbench_owner: 'one-person-lab',
    rca_owns_generic_session_shell: false,
    rca_owns_generic_workbench: false,
    rca_owns_generated_wrapper: false,
    default_caller_status: 'opl_generated_session_shell_domain_refs',
    rca_projection_mode: 'entry_session_domain_snapshot_refs_only',
    rca_exports_only: [...SESSION_REFS_ADAPTER_EXPORTS],
    retained_rca_authority: [...SESSION_REFS_ADAPTER_RETAINED_RCA_AUTHORITY],
    physical_delete_authorized_now: false,
    physical_delete_requires_owner_receipt_ref: 'rca-typed-blocker:private-platform-retirement:product-entry-continuity-refs-adapter:physical-delete-requires-explicit-owner-receipt',
    no_forbidden_write_ref: 'no-forbidden-write:rca/default-caller-deletion/product_entry_continuity_refs_adapter/refs-only-boundary',
    forbidden_writes: [
      'visual_truth_body',
      'artifact_body',
      'visual_memory_body',
      'review_export_verdict_body',
      'owner_receipt_body',
      'generic_session_store_state',
      'generic_workbench_state',
    ],
  };
}

function buildControlPolicy({ projection, typedBlocker = null, manifestProjection = false }) {
  const needsUserDecision = Boolean(projection?.needs_user_decision);
  const contentStatus = safeText(projection?.content_status);
  const closeoutBlocked = safeText(projection?.content_status) === 'blocked_pending_closeout'
    || Boolean(projection?.typed_blocker_ref);
  const typedBlockerAction = safeText(
    typedBlocker?.recommended_action
      || typedBlocker?.next_required_owner_action
      || projection?.typed_blocker?.recommended_action
      || projection?.typed_blocker?.next_required_owner_action,
  );
  const completed = contentStatus === 'completed';
  const gateStatus = needsUserDecision || closeoutBlocked ? 'requested' : 'approved';
  return {
    approval_gate_id: REDCUBE_OPERATOR_REVIEW_GATE_ID,
    approval_required: needsUserDecision || closeoutBlocked,
    gate_status: gateStatus,
    default_run_mode: 'auto_to_terminal',
    stop_policy: 'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
    interrupt_policy: needsUserDecision || closeoutBlocked ? REVIEW_INTERRUPT_POLICY : DEFAULT_INTERRUPT_POLICY,
    recommended_action: closeoutBlocked
      ? (typedBlockerAction || 'consume_route_closeout')
      : (needsUserDecision
      ? 'resolve_review_gate'
      : (completed ? 'pick_up_artifacts' : 'continue_autonomous_run')),
    continue_action: {
      command: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
      surface_kind: 'product_entry_session',
    },
    human_gate_ids: manifestProjection || needsUserDecision ? [REDCUBE_OPERATOR_REVIEW_GATE_ID] : [],
  };
}

function buildRestorePoint({ continuationSnapshot }) {
  const latestStageExecutionPlanRef = continuationSnapshot?.latest_stage_execution_plan_ref || null;
  const latestRunId = continuationSnapshot?.latest_run_id || null;
  return {
    latest_handle: latestStageExecutionPlanRef || latestRunId || null,
    latest_stage_execution_plan_ref: latestStageExecutionPlanRef,
    latest_run_id: latestRunId,
  };
}

function projectionFromStageExecutionPlan(stageExecutionPlan) {
  if (!stageExecutionPlan) return null;
  const summary = stageExecutionPlan.summary || {};
  return {
    projection_kind: 'opl_stage_execution_plan_projection',
    content_status: 'planned_for_opl_stage_execution',
    current_stage: summary.first_stage || null,
    terminal_stage: summary.terminal_stage || null,
    planned_stage_count: summary.planned_stage_count || 0,
    needs_user_decision: Boolean(stageExecutionPlan.control_policy?.approval_required),
    completed_stages: [],
    remaining_stages: safeArray(stageExecutionPlan.stage_attempts).map((stage) => stage.stage_id).filter(Boolean),
    final_artifact_refs: [],
  };
}

export function buildSessionContinuitySurface({
  entrySessionId,
  sessionFile,
  runtimeOwner,
  deliveryIdentity,
  continuationSnapshot,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  return {
    surface_kind: 'session_continuity',
    entry_session_id: entrySessionId,
    session_file: sessionFile,
    runtime_owner: runtimeOwner,
    delivery_identity: {
      deliverable_family: safeText(deliveryIdentity?.deliverable_family),
      topic_id: safeText(deliveryIdentity?.topic_id),
      deliverable_id: safeText(deliveryIdentity?.deliverable_id),
      profile_id: deliveryIdentity?.profile_id ?? null,
    },
    restore_point: restorePoint,
    generated_session_shell_boundary: buildGeneratedSessionShellBoundary(),
    summary: {
      entry_session_id: entrySessionId,
      latest_handle: restorePoint.latest_handle,
      default_caller: 'opl_generated:product_session',
    },
  };
}

export function buildProgressProjectionSurface({ continuationSnapshot }) {
  const projection = continuationSnapshot?.runtime_progress_projection
    || projectionFromStageExecutionPlan(continuationSnapshot?.stage_execution_plan)
    || null;
  if (!projection) {
    return null;
  }

  const refs = continuationSnapshot?.runtime_projection?.refs || null;
  const progressDelta = continuationSnapshot?.progress_delta || {};
  const deliverableProgressDelta = deltaPayload(progressDelta.deliverable_progress_delta, 'visual_deliverable_delta');
  const platformRepairDelta = deltaPayload(progressDelta.platform_repair_delta, 'platform_interface_repair_delta');
  const nextForcedDelta = nextForcedDeltaPayload(progressDelta, projection);
  return {
    surface_kind: 'progress_projection',
    stage_execution_plan_ref: continuationSnapshot?.latest_stage_execution_plan_ref || null,
    projection,
    refs,
    deliverable_progress_delta: deliverableProgressDelta,
    platform_repair_delta: platformRepairDelta,
    next_forced_delta: nextForcedDelta,
    progress_delta_classification: safeText(progressDelta.progress_delta_classification, 'unknown'),
    typed_blocker: continuationSnapshot?.closeout_first_blocker || null,
    stall_lineage: continuationSnapshot?.stall_lineage || null,
    summary: {
      current_stage: projection.current_stage ?? null,
      content_status: projection.content_status ?? null,
      needs_user_decision: Boolean(projection.needs_user_decision),
      progress_delta_classification: safeText(progressDelta.progress_delta_classification, 'unknown'),
    },
  };
}

export function buildArtifactInventorySurface({
  entrySessionId,
  sessionFile,
  continuationSnapshot,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  const projection = continuationSnapshot?.runtime_progress_projection
    || projectionFromStageExecutionPlan(continuationSnapshot?.stage_execution_plan)
    || null;
  const artifactRefs = Array.isArray(projection?.final_artifact_refs)
    ? projection.final_artifact_refs
    : [];

  return {
    surface_kind: 'artifact_inventory',
    entry_session_id: entrySessionId,
    session_file: sessionFile,
    restore_point: restorePoint,
    artifact_refs: artifactRefs,
    refs: continuationSnapshot?.runtime_projection?.refs || null,
    summary: {
      latest_handle: restorePoint.latest_handle,
      artifact_ref_count: artifactRefs.length,
    },
  };
}

function buildLoopOwner(runtimeOwner) {
  return {
    runtime_owner: safeText(runtimeOwner),
    domain_owner: REDCUBE_LOOP_OWNER,
    product_entry_owner: REDCUBE_LOOP_OWNER,
  };
}

export function buildRuntimeLoopClosureSurface({
  entrySessionId,
  sessionFile,
  runtimeOwner,
  deliveryIdentity,
  continuationSnapshot,
  source,
  entryMode,
}) {
  const restorePoint = buildRestorePoint({ continuationSnapshot });
  const projection = continuationSnapshot?.runtime_progress_projection
    || projectionFromStageExecutionPlan(continuationSnapshot?.stage_execution_plan)
    || null;
  const artifactRefs = Array.isArray(projection?.final_artifact_refs)
    ? projection.final_artifact_refs
    : [];
  const nextForcedDelta = nextForcedDeltaPayload(continuationSnapshot?.progress_delta || {}, projection);
  return {
    surface_kind: 'runtime_loop_closure',
    loop_owner: buildLoopOwner(runtimeOwner),
    resume_point: {
      entry_session_id: safeText(entrySessionId) || null,
      session_file: safeText(sessionFile) || null,
      latest_stage_execution_plan_ref: restorePoint.latest_stage_execution_plan_ref,
      latest_run_id: restorePoint.latest_run_id,
      latest_handle: restorePoint.latest_handle,
      resume_command_template: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
      checkpoint_locator_field: 'continuation_snapshot.latest_stage_execution_plan_ref',
    },
    continuity_cursor: {
      surface_kind: 'session_continuity',
      surface_ref: '/session_continuity',
      entry_session_id: safeText(entrySessionId) || null,
      latest_handle: restorePoint.latest_handle,
    },
    progress_cursor: {
      surface_kind: 'progress_projection',
      surface_ref: '/progress_projection',
      stage_execution_plan_ref: continuationSnapshot?.latest_stage_execution_plan_ref || null,
      current_stage: projection?.current_stage ?? null,
      content_status: projection?.content_status ?? null,
      needs_user_decision: Boolean(projection?.needs_user_decision),
    },
    artifact_pickup: {
      surface_kind: 'artifact_inventory',
      surface_ref: '/artifact_inventory',
      deliverable_family: safeText(deliveryIdentity?.deliverable_family),
      topic_id: safeText(deliveryIdentity?.topic_id),
      deliverable_id: safeText(deliveryIdentity?.deliverable_id),
      artifact_refs: artifactRefs,
      artifact_ref_count: artifactRefs.length,
    },
    control_policy: buildControlPolicy({
      projection,
      typedBlocker: continuationSnapshot?.closeout_first_blocker || null,
    }),
    typed_blocker: continuationSnapshot?.closeout_first_blocker || null,
    deliverable_progress_delta: deltaPayload(
      continuationSnapshot?.progress_delta?.deliverable_progress_delta,
      'visual_deliverable_delta',
    ),
    platform_repair_delta: deltaPayload(
      continuationSnapshot?.progress_delta?.platform_repair_delta,
      'platform_interface_repair_delta',
    ),
    next_forced_delta: nextForcedDelta,
    progress_delta_classification: safeText(
      continuationSnapshot?.progress_delta?.progress_delta_classification,
      'unknown',
    ),
    stall_lineage: continuationSnapshot?.stall_lineage || null,
    source_linkage: {
      current_source: safeText(source),
      entry_mode: safeText(entryMode) || null,
      direct_surface_kind: 'product_entry',
      opl_hosted_surface_kind: 'opl_hosted_product_entry',
      session_surface_kind: 'product_entry_session',
      downstream_entry_surface_kind: 'domain_entry',
    },
  };
}

export function buildRuntimeLoopClosureManifestSurface({
  runtimeOwner,
  source = 'manifest',
  entryMode = 'manifest_projection',
}) {
  return {
    surface_kind: 'runtime_loop_closure',
    loop_owner: buildLoopOwner(runtimeOwner),
    resume_point: {
      entry_session_id: null,
      session_file: null,
      latest_stage_execution_plan_ref: null,
      latest_run_id: null,
      latest_handle: null,
      resume_command_template: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
      checkpoint_locator_field: 'continuation_snapshot.latest_stage_execution_plan_ref',
    },
    continuity_cursor: {
      surface_kind: 'session_continuity',
      surface_ref: '/session_continuity',
      entry_session_id: null,
      latest_handle: null,
    },
    progress_cursor: {
      surface_kind: 'progress_projection',
      surface_ref: '/progress_projection',
      stage_execution_plan_ref: null,
      current_stage: null,
      content_status: null,
      needs_user_decision: false,
    },
    artifact_pickup: {
      surface_kind: 'artifact_inventory',
      surface_ref: '/artifact_inventory',
      deliverable_family: null,
      topic_id: null,
      deliverable_id: null,
      artifact_refs: [],
      artifact_ref_count: 0,
    },
    control_policy: {
      ...buildControlPolicy({ projection: null, manifestProjection: true }),
      approval_required: false,
      gate_status: 'approved',
      recommended_action: 'invoke_product_entry_auto_to_terminal',
    },
    source_linkage: {
      current_source: safeText(source, 'manifest'),
      entry_mode: safeText(entryMode, 'manifest_projection'),
      direct_surface_kind: 'product_entry',
      opl_hosted_surface_kind: 'opl_hosted_product_entry',
      session_surface_kind: 'product_entry_session',
      downstream_entry_surface_kind: 'domain_entry',
    },
  };
}

export function buildOplFamilyLifecycleAdapterSurface({
  runtimeOwner,
  entrySessionId = null,
  sessionFile = null,
  deliveryIdentity = null,
  continuationSnapshot = null,
  runtimeLoopClosure = null,
  reviewState = null,
  publicationProjection = null,
  artifactLocatorContract = null,
  source = 'manifest',
  entryMode = 'manifest_projection',
  manifestProjection = false,
}) {
  return buildOplProductEntryLifecycleAdapterSurface({
    domain_id: REDCUBE_LOOP_OWNER,
    domain_owner: REDCUBE_LOOP_OWNER,
    runtime_owner: runtimeOwner,
    entry_session_id: entrySessionId,
    session_file: sessionFile,
    delivery_identity: deliveryIdentity,
    continuation_snapshot: continuationSnapshot,
    runtime_loop_closure: runtimeLoopClosure,
    review_projection: reviewState,
    publication_projection: publicationProjection,
    artifact_locator_contract: artifactLocatorContract,
    source,
    entry_mode: entryMode,
    manifest_projection: manifestProjection,
    product_entry_session_command_template: PRODUCT_ENTRY_SESSION_COMMAND_TEMPLATE,
    direct_product_entry_command: 'redcube product invoke',
    opl_hosted_handoff_ref: OPL_HOSTED_HANDOFF_REF,
    adapter_id: 'rca.opl.family.lifecycle.adapter.v1',
    version: 'v1',
    owner_overrides: {
      lifecycle_projection_owner: REDCUBE_LOOP_OWNER,
      domain_truth_owner: REDCUBE_LOOP_OWNER,
      review_publication_owner: REDCUBE_LOOP_OWNER,
    },
    route_equivalence_ref: '/route_equivalence',
    non_goals: [
      'not_a_visual_domain_truth_owner',
      'not_a_canonical_artifact_owner',
      'not_a_review_or_publication_projection_owner',
      'not_a_concrete_executor',
      'not_a_private_sqlite_authority',
    ],
    allowed_authority: [
      'discover_product_entry_registration',
      'read_product_entry_session',
      'read_runtime_progress_projection',
      'read_artifact_inventory',
      'read_review_publication_projection_refs',
      'adopt_session_resume_cursor',
    ],
  });
}

const PRODUCT_MANIFEST_COMMAND = 'opl_generated:product_entry_manifest';
const PRODUCT_STATUS_COMMAND = 'opl_generated:product_status';
const OPL_HOSTED_HANDOFF_REF = 'opl_framework:hosted_product_entry';

export function buildOplRuntimeManagerRegistration({
  runtimeContinuityEnvelope,
  productEntrySessionCommand,
  standardDomainAgentSkeleton = null,
}) {
  const skeletonRef = standardDomainAgentSkeleton ? '/standard_domain_agent_skeleton' : null;
  return {
    surface_kind: 'opl_runtime_manager_domain_registration',
    version: 'v1',
    registration_id: 'rca.opl_runtime_manager.registration.v1',
    manager_surface_id: 'opl_runtime_manager',
    domain_id: 'redcube',
    domain_owner: 'redcube_ai',
    runtime_owner: runtimeContinuityEnvelope.runtime_owner,
    executor_owner: runtimeContinuityEnvelope.executor_owner,
    domain_entry_surface: {
      surface_kind: 'product_entry',
      command: 'redcube product invoke',
      manifest_command: PRODUCT_MANIFEST_COMMAND,
    },
    registration_surface: {
      surface_kind: 'skill_catalog',
      ref: '/skill_catalog/skills/0/domain_projection/opl_runtime_manager_registration',
      command: PRODUCT_MANIFEST_COMMAND,
    },
    indexable_surfaces: [{ surface_id: 'product_entry_registration', surface_kind: 'skill_catalog', ref: '/skill_catalog/skills/0/domain_projection/opl_runtime_manager_registration' }, { surface_id: 'opl_hosted_stage_runtime', surface_kind: 'opl_hosted_product_entry', ref: '/product_entry_shell/opl_hosted' }, { surface_id: 'session_continuity', surface_kind: 'session_continuity', ref: '/session_continuity' }, { surface_id: 'artifact_inventory', surface_kind: 'artifact_inventory', ref: '/artifact_inventory' }, { surface_id: 'runtime_health', surface_kind: 'runtime_inventory', ref: '/runtime_inventory' }, { surface_id: 'review_publication_projection_refs', surface_kind: 'review_publication_refs', refs: ['/review_state', '/publication_projection'] }, { surface_id: 'opl_family_lifecycle_adapter', surface_kind: 'opl_family_lifecycle_adapter', ref: '/opl_family_lifecycle_adapter' }, { surface_id: 'standard_domain_agent_skeleton', surface_kind: 'standard_domain_agent_skeleton', ref: '/standard_domain_agent_skeleton' }, { surface_id: 'artifact_locator_contract', surface_kind: 'artifact_locator_contract', ref: '/artifact_locator_contract' }, { surface_id: 'domain_memory_descriptor_locator', surface_kind: 'domain_memory_descriptor_locator', ref: '/domain_memory_descriptor_locator' }, { surface_id: 'domain_action_adapter_receipt_refs', surface_kind: 'domain_action_adapter_receipt_refs', ref: '/domain_action_adapter_receipt_refs' }],
    consumable_projection_refs: ['/skill_catalog/skills/0/domain_projection/runtime_continuity', '/product_entry_shell/opl_hosted', '/session_continuity', '/artifact_inventory', '/runtime_inventory', '/review_state', '/publication_projection', '/opl_family_lifecycle_adapter', '/standard_domain_agent_skeleton', '/artifact_locator_contract', '/domain_memory_descriptor_locator', '/domain_action_adapter_receipt_refs'],
    state_index_inputs: {
      workspace_registry_index: '/workspace_locator',
      session_continuity_ledger_index: '/session_continuity',
      artifact_projection_index: '/artifact_inventory',
      attention_queue_index: '/automation/automations/0',
      runtime_health_snapshot_index: '/runtime_inventory',
    },
    resume_contract: {
      session_locator_field: runtimeContinuityEnvelope.session_locator_field,
      recommended_resume_command: runtimeContinuityEnvelope.recommended_resume_command,
      recommended_progress_command: runtimeContinuityEnvelope.recommended_progress_command,
      session_command_template: productEntrySessionCommand,
    },
    opl_hosted_handoff_surface: {
      surface_kind: 'opl_hosted_product_entry',
      action_ref: OPL_HOSTED_HANDOFF_REF,
      ref: '/product_entry_shell/opl_hosted',
    },
    review_publication_truth: {
      review_state_ref: '/review_state',
      publication_projection_ref: '/publication_projection',
      route_rule: 'must_use_redcube_product_entry_and_review_export_gates',
    },
    standard_domain_agent_skeleton: {
      ref: skeletonRef || '/standard_domain_agent_skeleton',
      skeleton_id: standardDomainAgentSkeleton?.skeleton_id || 'rca.standard_domain_agent_skeleton.v1',
      mapping_model: standardDomainAgentSkeleton?.mapping_model || 'manifest_descriptor_mapping_only',
      runtime_declares_only: standardDomainAgentSkeleton?.runtime_declarations?.declares_only || [
        'domain_handler_target',
        'projection_builder',
        'lifecycle_adapter',
      ],
    },
    domain_memory_descriptor_locator: {
      ref: '/domain_memory_descriptor_locator',
      descriptor_id: standardDomainAgentSkeleton?.domain_memory_descriptor_locator?.descriptor_id || 'rca.visual_pattern_memory.descriptor.v1',
      locator_id: standardDomainAgentSkeleton?.domain_memory_descriptor_locator?.locator_id || 'rca.visual_pattern_memory.locator.v1',
      memory_family: 'visual_pattern_memory',
      opl_role: 'locator_ref_receipt_consumer_only',
      opl_can_hold_memory_content: false,
      opl_can_issue_review_or_export_verdict: false,
    },
    route_equivalence: { ref: '/route_equivalence', downstream_domain_entry_ref: '/route_equivalence/downstream_runtime_truth', rule: 'direct_product_entry_and_opl_hosted_stage_runtime_share_the_same_downstream_domain_entry' },
    native_helper_index_consumption: { surface_kind: 'native_helper_index_consumption_proof', consumption_mode: 'index_only', input_refs: ['/runtime_inventory', '/artifact_inventory', '/skill_catalog/skills/0/domain_projection/runtime_continuity'], proof_summary: 'OPL Runtime Manager may index RCA native/helper availability and artifact pickup refs without writing RedCube visual truth, canonical artifacts, review/publication truth, or executor state.', writes_visual_truth: false, owns_canonical_artifacts: false, owns_executor: false },
    authority_boundary: { owns_visual_truth: false, owns_canonical_artifacts: false, owns_review_truth: false, owns_publication_projection: false, owns_concrete_executor: false, owns_domain_memory_content: false, allowed_authority: ['read_product_entry_registration_index', 'read_opl_hosted_stage_runtime_index', 'read_session_continuity_index', 'read_artifact_inventory_index', 'read_runtime_health_index', 'read_review_publication_projection_refs', 'read_domain_memory_locator_refs'] },
    non_goals: ['not_a_visual_domain_truth_owner', 'not_a_canonical_artifact_owner', 'not_a_review_or_publication_projection_owner', 'not_a_concrete_executor'],
  };
}
