// @ts-nocheck
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { getProductEntrySession } from './get-product-entry-session.js';
import { invokeProductEntry } from './invoke-product-entry.js';
import {
  buildFamilySchedulerReplacementProjection,
  buildOplGenericPrimitiveConsumptionProjection,
  buildOplStabilityReadModelConsumptionProjection,
  listProductSidecarBlockedActions,
  listProductSidecarGuardedActions,
  productSidecarGuardedActionSet,
} from './product-sidecar-guarded-actions.js';
import { runtimeWatch } from './runtime-watch.js';
import { superviseManagedRun } from './supervise-managed-run.js';
import { emitWorkspaceReceiptProof as emitWorkspaceReceiptProofPack } from './product-sidecar-parts/workspace-receipt-proof.js';
export {
  assertReceiptOnlyHostedAttemptProjection,
  buildHostedAttemptBridgeFixture,
  isReceiptOnlyHostedAttemptProjection,
  reconcileHostedAttemptReceipt,
} from './product-sidecar-parts/hosted-attempt-reconciliation.js';

const SIDECAR_ID = 'redcube_product_sidecar_adapter.v1';
const DOMAIN_ID = 'redcube_ai';
const OPL_RUNTIME_OWNER = 'configured_family_runtime_provider';
const OPL_PROVIDER_TRANSPORT = 'opl_family_runtime_provider';
const GUARDED_ACTIONS = productSidecarGuardedActionSet();

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot,
  );
}

function readTaskPayload(request) {
  const payload = request?.task && typeof request.task === 'object'
    ? request.task
    : null;
  if (payload) {
    return payload;
  }

  const taskFile = requireField('task', request?.task_file || request?.taskFile);
  return JSON.parse(readFileSync(taskFile, 'utf-8'));
}

function buildOwnerBoundary() {
  return {
    provider_role: 'stage_attempt_queue_wakeup_transport_only',
    opl_role: 'typed_family_queue_and_control_plane',
    rca_role: 'visual_domain_truth_review_artifact_owner',
    rca_surface_role: 'visual_domain_authority_pack_plus_thin_program_surface',
    provider_owns_visual_truth: false,
    opl_owns_visual_truth: false,
    provider_owns_review_verdict: false,
    opl_owns_review_verdict: false,
    provider_owns_publication_gate: false,
    opl_owns_publication_gate: false,
    rca_owns_functional_harness: false,
    rca_owns_generic_runtime: false,
    rca_owns_generic_scheduler: false,
    rca_owns_generic_daemon: false,
    rca_owns_generic_lifecycle: false,
    rca_owns_generic_queue: false,
    rca_owns_stage_attempt_orchestrator: false,
    rca_owns_generic_attempt_ledger: false,
    rca_owns_typed_closeout_transport: false,
    rca_owns_generic_runner: false,
    rca_owns_generic_transition_runner: false,
    rca_owns_generic_workbench: false,
    rca_owns_visual_truth: true,
    rca_owns_review_publication_projection: true,
    rca_owns_artifacts: true,
    rca_owns_visual_memory_body: true,
    rca_owns_owner_receipt: true,
    rca_owns_native_helper_implementation: true,
    rca_owns_memory_transport: false,
    rca_owns_memory_refs_only_writeback_chain: false,
    rca_owns_artifact_lifecycle: false,
    rca_owns_review_repair_transport: false,
    rca_owns_restart_dead_letter_repair_human_gate_state_chain: false,
    rca_owns_native_helper_generic_envelope: false,
  };
}

function buildSidecarProjection({ workspaceRoot, manifest }) {
  const sessionSurface = manifest.product_entry_shell?.session || {};
  const familySchedulerReplacement = manifest.family_scheduler_replacement || buildFamilySchedulerReplacementProjection();
  const oplGenericPrimitiveConsumption = (
    manifest.opl_generic_primitive_consumption
    || buildOplGenericPrimitiveConsumptionProjection()
  );
  const oplStabilityReadModelConsumption = (
    manifest.opl_stability_read_model_consumption
    || buildOplStabilityReadModelConsumptionProjection()
  );
  return {
    ok: true,
    surface_kind: 'product_sidecar_export',
    adapter_id: SIDECAR_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    runtime_framework: {
      runtime_owner: OPL_RUNTIME_OWNER,
      provider_transport_owner: OPL_PROVIDER_TRANSPORT,
      managed_by: 'opl_runtime_manager',
      queue_owner: 'opl',
      online_wakeup_owner: OPL_PROVIDER_TRANSPORT,
      family_scheduler_replacement: familySchedulerReplacement,
      default_executor_policy: {
        selected_by: 'codex_or_domain_selected_executor',
        domain_default_executor_owner: manifest.managed_runtime_contract?.executor_owner || 'codex_cli',
        executor_truth_owner: DOMAIN_ID,
      },
      rca_thin_surface_policy: {
        projection_scope: familySchedulerReplacement.projection_scope || 'consumer_projection_and_visual_domain_authority_refs_only',
        managed_dag_scheduler_scope: familySchedulerReplacement.managed_dag_scheduler_scope,
        generic_surfaces_owner: 'opl',
        opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
        opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
        rca_is_functional_harness_owner: false,
        rca_is_generic_runtime_owner: false,
        rca_is_generic_scheduler_owner: false,
        rca_is_generic_daemon_owner: false,
        rca_is_generic_lifecycle_owner: false,
        rca_is_generic_queue_owner: false,
        rca_is_stage_attempt_orchestrator_owner: false,
        rca_is_generic_attempt_ledger_owner: false,
        rca_is_typed_closeout_transport_owner: false,
        rca_is_generic_runner_owner: false,
        rca_is_generic_transition_runner_owner: false,
        rca_is_generic_workbench_owner: false,
        rca_is_memory_transport_owner: false,
        rca_is_memory_refs_only_writeback_chain_owner: false,
        rca_is_artifact_lifecycle_owner: false,
        rca_is_review_repair_transport_owner: false,
        rca_is_restart_dead_letter_repair_human_gate_state_chain_owner: false,
        rca_is_native_helper_generic_envelope_owner: false,
      },
    },
    owner_boundary: buildOwnerBoundary(),
    mapped_surfaces: {
      product_entry_session: {
        command: sessionSurface.command || 'redcube product session',
        command_template: sessionSurface.command_template || 'redcube product session --entry-session-id <entry-session-id>',
        ref: '/product_entry_shell/session',
        owner: DOMAIN_ID,
      },
      runtime_watch: {
        command: 'redcube review watch',
        api_surface: 'runtimeWatch',
        owner: DOMAIN_ID,
      },
      supervise_managed_run: {
        command: 'redcube managed supervise',
        api_surface: 'superviseManagedRun',
        owner: DOMAIN_ID,
      },
      review_projection: {
        review_state_ref: '/review_state',
        publication_projection_ref: '/publication_projection',
        operator_handoff_ref: '/operator_handoff',
        owner: DOMAIN_ID,
        writable_by_sidecar: false,
        transport_owner: 'opl',
        rca_retained_authority: [
          'review_export_verdict',
          'repair_decision',
          'visual_quality_facts',
        ],
      },
      operator_handoff: {
        source_refs: [
          '/product_entry_session',
          '/runtime_loop_closure',
          '/review_state',
          '/publication_projection',
        ],
        owner: DOMAIN_ID,
        writable_by_sidecar: false,
      },
      standard_domain_agent_skeleton: {
        ref: '/standard_domain_agent_skeleton',
        owner: DOMAIN_ID,
        mapping_model: manifest.standard_domain_agent_skeleton?.mapping_model || 'manifest_descriptor_mapping_only',
        repo_source_layout_audit_ref: '/standard_domain_agent_skeleton/repo_source_boundary/audit_surface',
        repo_source_layout_audit_status: manifest.standard_domain_agent_skeleton?.repo_source_boundary?.audit_surface?.status || 'unknown',
      },
      artifact_locator_contract: {
        ref: '/artifact_locator_contract',
        owner: DOMAIN_ID,
        locator_model: manifest.artifact_locator_contract?.locator_model || 'workspace_runtime_artifact_root_refs_only',
        writable_by_sidecar: false,
        lifecycle_transport_owner: 'opl',
        rca_retained_authority: ['artifact_authority'],
      },
      receipt_refs: {
        ref: '/product_sidecar_receipt_refs',
        owner: DOMAIN_ID,
        writable_by_sidecar: false,
        forbidden_receipt_fields: manifest.product_sidecar_receipt_refs?.forbidden_receipt_fields || [],
      },
      visual_pattern_memory_writeback: {
        descriptor_ref: '/domain_memory_descriptor_locator',
        proposal_generator_ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
        accept_reject_command_ref: '/domain_memory_descriptor_locator/accept_reject_command',
        writeback_receipt_locator_ref: '/domain_memory_descriptor_locator/writeback_receipt_locator',
        operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
        runtime_receipt_instances_ref: '/controlled_memory_apply_proof/runtime_receipt_instances',
        owner: DOMAIN_ID,
        transport_owner: 'opl',
        writable_by_sidecar: false,
        controlled_apply_proof_ref: '/controlled_memory_apply_proof',
        opl_can_generate_memory_content: false,
        opl_can_accept_or_reject: false,
        opl_can_write_receipt_instance: false,
        opl_can_write_visual_truth: false,
        opl_can_write_artifact_blob: false,
        rca_retained_authority: ['visual_memory_body'],
      },
      native_helper_implementation: {
        ref: '/native_ppt_operator_ux',
        owner: DOMAIN_ID,
        generic_envelope_owner: 'opl',
        helper_catalog_ref: 'contracts/runtime-program/python-native-helper-catalog.json',
        implementation_owner: DOMAIN_ID,
        package_module_only: true,
        writable_by_sidecar: false,
      },
      controlled_visual_stage_attempt: {
        ref: '/controlled_visual_stage_attempt',
        owner: DOMAIN_ID,
        controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
        apply_proof_state: manifest.controlled_visual_stage_attempt?.apply_proof_state || null,
        opl_consumes_descriptor_refs: true,
        opl_consumes_quality_refs: true,
        opl_holds_visual_or_export_verdict: false,
        direct_and_opl_share_descriptor_refs: true,
        direct_and_opl_share_sidecar_refs: true,
        direct_and_opl_share_quality_refs: true,
      },
      controlled_soak_no_regression_attempt: {
        ref: '/controlled_soak_no_regression_attempt',
        owner: DOMAIN_ID,
        state: manifest.controlled_soak_no_regression_attempt?.state || 'deferred_typed_blocker',
        source_contract: (
          manifest.controlled_soak_no_regression_attempt
            ?.deferred_blocker
            ?.source_contract || 'opl_temporal_controlled_visual_stage_attempt_apply_contract'
        ),
        required_return_shapes: manifest.controlled_soak_no_regression_attempt
          ?.deferred_blocker
          ?.required_return_shapes || [
            'domain_owner_receipt_ref',
            'typed_blocker',
            'no_regression_evidence_ref',
        ],
        evidence_action: 'emit_no_regression_evidence',
        evidence_surface_kind: 'no_regression_evidence',
        writable_by_sidecar: false,
      },
      owner_receipt_contract: {
        ref: '/domain_owner_receipt_contract',
        owner: DOMAIN_ID,
        allowed_return_shapes: manifest.domain_owner_receipt_contract?.allowed_return_shapes || [],
        writable_by_sidecar: true,
        guarded_action: 'emit_domain_owner_receipt',
        receipt_root_model: '<workspace-root>/.redcube/runtime/receipts/domain-owner/<receipt-id>.json',
      },
      no_regression_owner_receipt_opl_consumption_proof: {
        ref: '/no_regression_owner_receipt_opl_consumption_proof',
        owner: DOMAIN_ID,
        status: manifest.no_regression_owner_receipt_opl_consumption_proof?.status || 'unknown',
        proof_model: manifest.no_regression_owner_receipt_opl_consumption_proof?.proof_model || null,
        guarded_actions: manifest.no_regression_owner_receipt_opl_consumption_proof?.guarded_actions || [],
        opl_consumption_policy: manifest.no_regression_owner_receipt_opl_consumption_proof?.opl_consumption_policy || {},
        writable_by_sidecar: true,
      },
      lifecycle_guarded_apply: {
        ref: '/lifecycle_guarded_apply_proof',
        owner: DOMAIN_ID,
        operations: (manifest.lifecycle_guarded_apply_proof?.operations || []).map((operation) => operation.operation),
        opl_can_apply_domain_artifact_mutation: false,
        domain_receipt_required: true,
        writable_by_sidecar: false,
        guarded_action: 'apply_visual_workspace_lifecycle',
        receipt_root_model: '<workspace-root>/.redcube/runtime/receipts/lifecycle/<operation>/<receipt-id>.json',
      },
      visual_transition_spec: {
        ref: '/visual_transition_spec',
        owner: DOMAIN_ID,
        spec_id: manifest.visual_transition_spec?.spec_id || 'rca.visual_transition_spec.v1',
        status: manifest.visual_transition_spec?.status || 'contract_landed_runner_integration_pending',
        transition_count: manifest.visual_transition_spec?.transition_table?.length || 0,
        oracle_fixture_id: manifest.visual_transition_spec?.oracle_fixture?.fixture_id || null,
        opl_can_execute_transition_spec: true,
        opl_can_declare_visual_ready: false,
        opl_can_declare_exportable: false,
        writable_by_sidecar: false,
      },
      family_scheduler_replacement: familySchedulerReplacement,
      opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
      opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
    },
    guarded_actions: listProductSidecarGuardedActions(),
    blocked_actions: listProductSidecarBlockedActions(),
    source_manifest_refs: {
      manifest_kind: manifest.manifest_kind,
      manifest_version: manifest.manifest_version,
      product_entry_manifest_ref: '/product_entry_manifest',
      opl_family_lifecycle_adapter_ref: '/opl_family_lifecycle_adapter',
      family_action_catalog_ref: '/family_action_catalog',
      standard_domain_agent_skeleton_ref: '/standard_domain_agent_skeleton',
      artifact_locator_contract_ref: '/artifact_locator_contract',
      domain_memory_descriptor_locator_ref: '/domain_memory_descriptor_locator',
      product_sidecar_receipt_refs_ref: '/product_sidecar_receipt_refs',
      controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
      controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
      controlled_soak_no_regression_attempt_ref: '/controlled_soak_no_regression_attempt',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
      visual_transition_spec_ref: '/visual_transition_spec',
      family_scheduler_replacement_ref: '/family_scheduler_replacement',
      opl_generic_primitive_consumption_ref: '/opl_generic_primitive_consumption',
      opl_stability_read_model_consumption_ref: '/opl_stability_read_model_consumption',
    },
    runtime_residue_retirement: manifest.runtime_residue_retirement,
    summary: {
      runtime_owner: OPL_RUNTIME_OWNER,
      provider_transport_owner: OPL_PROVIDER_TRANSPORT,
      control_plane_owner: 'opl',
      domain_truth_owner: DOMAIN_ID,
      guarded_action_count: GUARDED_ACTIONS.size,
    },
  };
}

export async function exportProductSidecar(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  return buildSidecarProjection({ workspaceRoot, manifest });
}

function normalizeAction(task) {
  return safeText(task?.action || task?.action_id || task?.task_intent || task?.kind);
}

function workspaceRootFromTask(task) {
  return requireField(
    'workspace_root',
    task?.workspace_root
      || task?.workspaceRoot
      || task?.workspace_locator?.workspace_root
      || task?.workspaceLocator?.workspaceRoot,
  );
}

function normalizeDeliveryRequest(task) {
  const delivery = task?.delivery_request || task?.deliveryRequest || {};
  return {
    deliverable_family: safeText(delivery.deliverable_family || delivery.deliverableFamily || delivery.overlay),
    topic_id: safeText(delivery.topic_id || delivery.topicId || task.topic_id || task.topicId),
    deliverable_id: safeText(delivery.deliverable_id || delivery.deliverableId || task.deliverable_id || task.deliverableId),
    profile_id: safeText(delivery.profile_id || delivery.profileId),
    title: safeText(delivery.title),
    goal: safeText(delivery.goal),
    route: safeText(delivery.route),
    adapter: safeText(delivery.adapter),
    user_intent: safeText(delivery.user_intent || delivery.userIntent || task.user_intent || task.userIntent),
    lifecycle_policy: safeText(delivery.lifecycle_policy || delivery.lifecyclePolicy),
    stop_after_stage: safeText(delivery.stop_after_stage || delivery.stopAfterStage),
    mode: safeText(delivery.mode, 'draft_new'),
    baseline_deliverable_id: safeText(delivery.baseline_deliverable_id || delivery.baselineDeliverableId),
  };
}

function buildDispatchEnvelope({ task, result, action }) {
  return {
    ok: true,
    surface_kind: 'product_sidecar_dispatch',
    adapter_id: SIDECAR_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    action,
    sidecar_policy: {
      allowed: true,
      writes_visual_truth: false,
      writes_review_verdict: false,
      writes_publication_gate: false,
      writes_canonical_artifacts: false,
    },
    owner_boundary: buildOwnerBoundary(),
    task_id: task.task_id || task.id || null,
    result_surface: result,
    summary: {
      action,
      result_surface_kind: result?.surface_kind || null,
      provider_role: 'wakeup_transport_only',
      opl_role: 'typed_family_control_plane',
      rca_role: 'domain_truth_owner',
    },
  };
}

function slugId(value, fallback) {
  return safeText(value, fallback).replace(/[^A-Za-z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

function noRegressionEvidenceId(task) {
  const provided = task.evidence_id || task.evidenceId || task.no_regression_evidence_id || task.noRegressionEvidenceId;
  if (safeText(provided)) {
    return slugId(provided, 'evidence');
  }
  const seed = [
    task.task_id || task.id || '',
    task.entry_session_id || task.entrySessionId || '',
    task.topic_id || task.topicId || '',
    task.deliverable_id || task.deliverableId || '',
  ].join(':');
  const digest = createHash('sha256').update(seed || new Date(0).toISOString()).digest('hex').slice(0, 12);
  return `evidence-${digest}`;
}

function receiptId(task, fieldName, fallbackPrefix) {
  const provided = task[fieldName]
    || task[`${fieldName}_id`]
    || task.receipt_id
    || task.receiptId
    || task.id;
  if (safeText(provided)) {
    return slugId(provided, fallbackPrefix);
  }
  const seed = [
    task.task_id || task.taskId || '',
    task.entry_session_id || task.entrySessionId || '',
    task.topic_id || task.topicId || '',
    task.deliverable_id || task.deliverableId || '',
    task.run_id || task.runId || '',
    fallbackPrefix,
  ].join(':');
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return `${fallbackPrefix}-${digest}`;
}

function taskValue(task, snake, camel = null) {
  return task?.[snake] ?? (camel ? task?.[camel] : undefined);
}

function optionalArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function missingFields(task, fields) {
  return fields.filter((field) => !safeText(taskValue(task, field, field.replace(/_([a-z])/g, (_, char) => char.toUpperCase()))));
}

function buildTypedBlocker({
  blockerKind,
  blockerId,
  missing = [],
  sourceContract,
  nextRequiredOwnerAction,
  workspaceRoot = null,
  details = {},
}) {
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: `rca-typed-blocker:${blockerKind}:${slugId(blockerId, 'blocker')}`,
    blocker_kind: blockerKind,
    owner: DOMAIN_ID,
    source_contract: sourceContract,
    next_required_owner_action: nextRequiredOwnerAction,
    missing_required_fields: missing,
    workspace_locator: workspaceRoot ? { workspace_root: workspaceRoot } : null,
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
    writes_visual_truth: false,
    writes_review_export_verdict: false,
    writes_canonical_artifact_blob: false,
    ...details,
  };
}

function writeRuntimeJson({ workspaceRoot, parts, fileName, payload }) {
  const dir = path.join(workspaceRoot, '.redcube', 'runtime', ...parts);
  const file = path.join(dir, fileName);
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const payloadWithDigest = { ...payload, sha256: digest };
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(payloadWithDigest, null, 2)}\n`, 'utf-8');
  return { file, payload: payloadWithDigest };
}

function compactManifestNoRegressionSources(manifest) {
  const controlledSoak = manifest.controlled_soak_no_regression_attempt || {};
  const skeletonAudit = manifest.standard_domain_agent_skeleton?.repo_source_boundary?.audit_surface || {};
  const runtimeResidue = manifest.runtime_residue_retirement || {};
  return {
    controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
    controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
    artifact_locator_contract_ref: '/artifact_locator_contract',
    runtime_residue_retirement_ref: '/runtime_residue_retirement',
    domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
    lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
    physical_skeleton_follow_through_ref: '/physical_skeleton_follow_through',
    review_helper_baseline_follow_through_ref: '/review_helper_baseline_follow_through',
    controlled_soak_state: controlledSoak.state || 'deferred_typed_blocker',
    skeleton_repo_source_layout_audit_status: skeletonAudit.status || 'unknown',
    runtime_residue_retirement_status: runtimeResidue.status || 'unknown',
  };
}

async function emitDomainOwnerReceipt(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const required = [
    'attempt_ref',
    'artifact_locator_ref',
    'memory_receipt_ref',
    'lifecycle_receipt_ref',
    'review_export_ref',
    'forbidden_write_proof_ref',
  ];
  const missing = missingFields(task, required);
  const id = receiptId(task, 'domain_owner_receipt', 'domain-receipt');
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'domain_owner_receipt_missing_required_refs',
      blockerId: id,
      missing,
      sourceContract: 'rca.domain_owner_receipt.v1',
      nextRequiredOwnerAction: 'provide_rca_owned_attempt_artifact_memory_lifecycle_review_and_forbidden_write_refs',
      workspaceRoot,
    });
  }

  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const receipt = {
    ok: true,
    surface_kind: 'domain_owner_receipt',
    return_shape: 'domain_receipt',
    receipt_id: id,
    receipt_ref: `rca-owner-receipt:visual-stage:${id}`,
    runtime_locator_ref: `workspace-runtime-ref:domain-owner-receipt:${id}`,
    owner: DOMAIN_ID,
    contract_ref: '/domain_owner_receipt_contract',
    generated_by_action: 'emit_domain_owner_receipt',
    workspace_locator: { workspace_root: workspaceRoot },
    required_refs: {
      attempt_ref: safeText(taskValue(task, 'attempt_ref', 'attemptRef')),
      artifact_locator_ref: safeText(taskValue(task, 'artifact_locator_ref', 'artifactLocatorRef')),
      memory_receipt_ref: safeText(taskValue(task, 'memory_receipt_ref', 'memoryReceiptRef')),
      lifecycle_receipt_ref: safeText(taskValue(task, 'lifecycle_receipt_ref', 'lifecycleReceiptRef')),
      review_export_ref: safeText(taskValue(task, 'review_export_ref', 'reviewExportRef')),
      forbidden_write_proof_ref: safeText(taskValue(task, 'forbidden_write_proof_ref', 'forbiddenWriteProofRef')),
    },
    artifact_delta: {
      artifact_refs: optionalArray(task.artifact_refs || task.artifactRefs),
      repair_target_refs: optionalArray(task.repair_target_refs || task.repairTargetRefs),
      export_proof_refs: optionalArray(task.export_proof_refs || task.exportProofRefs),
      handoff_packet_ref: safeText(task.handoff_packet_ref || task.handoffPacketRef),
      residual_risk_refs: optionalArray(task.residual_risk_refs || task.residualRiskRefs),
    },
    source_manifest_refs: {
      controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
      artifact_locator_contract_ref: '/artifact_locator_contract',
      controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
      lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
      review_state_ref: '/review_state',
      publication_projection_ref: '/publication_projection',
      forbidden_write_audit_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
    },
    coverage: {
      domain_owner_receipt_shape: 'domain_receipt',
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      opl_completion_promoted_to_visual_ready: false,
      visual_artifact_blob_written: false,
      review_export_verdict_written: false,
      memory_content_body_written: false,
      receipt_instance_written_to_repo: false,
      required_refs_present: true,
    },
    authority_boundary: {
      rca_owns_receipt_ref: true,
      opl_can_store_receipt_ref: true,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
      opl_can_mutate_domain_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_contract_and_fixture_refs: true,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_review_export_verdict: false,
      repo_tracks_canonical_artifact_blob: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/receipts/domain-owner/<receipt-id>.json',
    },
    contract_allowed_return_shapes: manifest.domain_owner_receipt_contract?.allowed_return_shapes || [],
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['receipts', 'domain-owner'],
    fileName: `${id}.json`,
    payload: receipt,
  });
  return { ...written.payload, receipt_file: written.file };
}

async function emitNoRegressionEvidence(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const evidenceId = noRegressionEvidenceId(task);
  const evidenceDir = path.join(workspaceRoot, '.redcube', 'runtime', 'evidence', 'no-regression');
  const evidenceFile = path.join(evidenceDir, `${evidenceId}.json`);
  const sourceRefs = compactManifestNoRegressionSources(manifest);
  const evidence = {
    ok: true,
    surface_kind: 'no_regression_evidence',
    evidence_id: evidenceId,
    evidence_ref: `rca-no-regression:visual-stage:${evidenceId}`,
    runtime_locator_ref: `workspace-runtime-ref:no-regression-evidence:${evidenceId}`,
    return_shape: 'no_regression_evidence',
    owner: DOMAIN_ID,
    generated_by_action: 'emit_no_regression_evidence',
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    source_manifest_refs: sourceRefs,
    coverage: {
      verifies_descriptor_and_runtime_refs: true,
      verifies_standard_skeleton_physical_anchor: true,
      verifies_legacy_default_active_path_retired: sourceRefs.runtime_residue_retirement_status === 'active_path_retired',
      verifies_review_helper_line_budget_guard: true,
      long_visual_soak_claimed: false,
      visual_artifact_blob_written: false,
      review_export_verdict_written: false,
      memory_content_body_written: false,
      receipt_instance_written_to_repo: false,
    },
    authority_boundary: {
      rca_owns_evidence_ref: true,
      opl_can_store_no_regression_evidence_ref: true,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
    },
    repository_boundary: {
      repo_tracks_evidence_contract: true,
      repo_tracks_runtime_evidence_instance: false,
      repo_tracks_visual_or_export_artifacts: false,
      evidence_instance_path_model: '<workspace-root>/.redcube/runtime/evidence/no-regression/<evidence-id>.json',
    },
  };
  const digest = createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
  const evidenceWithDigest = {
    ...evidence,
    sha256: digest,
  };
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(evidenceFile, `${JSON.stringify(evidenceWithDigest, null, 2)}\n`, 'utf-8');
  return {
    ...evidenceWithDigest,
    evidence_file: evidenceFile,
  };
}

function normalizeMemoryDecision(task) {
  const decision = safeText(task.decision || task.writeback_status || task.writebackStatus).toLowerCase();
  return decision;
}

async function applyVisualMemoryWriteback(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const decision = normalizeMemoryDecision(task);
  const decisionOwner = safeText(task.decision_owner || task.decisionOwner);
  const idBase = `${slugId(task.proposal_id || task.proposalId, 'proposal')}-${decision || 'decision'}`;
  if (!['accepted', 'rejected'].includes(decision)) {
    return buildTypedBlocker({
      blockerKind: 'visual_memory_writeback_invalid_decision',
      blockerId: idBase,
      sourceContract: 'rca.visual_pattern_memory.accept_reject.v1',
      nextRequiredOwnerAction: 'provide_accepted_or_rejected_decision',
      workspaceRoot,
      details: { allowed_decisions: ['accepted', 'rejected'] },
    });
  }
  if (decisionOwner !== DOMAIN_ID) {
    return buildTypedBlocker({
      blockerKind: 'visual_memory_writeback_owner_required',
      blockerId: idBase,
      sourceContract: 'rca.visual_pattern_memory.accept_reject.v1',
      nextRequiredOwnerAction: 'route_memory_decision_to_rca_owner',
      workspaceRoot,
      details: {
        decision_owner: decisionOwner || null,
        required_decision_owner: DOMAIN_ID,
      },
    });
  }
  const required = [
    'proposal_id',
    'source_review_ref',
    'candidate_memory_ref',
  ];
  const missing = missingFields(task, required);
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'visual_memory_writeback_missing_required_refs',
      blockerId: idBase,
      missing,
      sourceContract: 'rca.visual_pattern_memory.accept_reject.v1',
      nextRequiredOwnerAction: 'provide_locator_only_memory_writeback_refs',
      workspaceRoot,
    });
  }
  const proposalId = slugId(task.proposal_id || task.proposalId, 'proposal');
  const receiptId = `${proposalId}-${decision}`;
  const candidateMemoryRef = safeText(task.candidate_memory_ref || task.candidateMemoryRef);
  const memoryLocatorRef = safeText(task.memory_locator_ref || task.memoryLocatorRef, candidateMemoryRef);
  const receipt = {
    ok: true,
    surface_kind: 'visual_pattern_memory_writeback_receipt',
    return_shape: 'domain_memory_receipt',
    receipt_id: receiptId,
    receipt_ref: `rca-memory-receipt:visual-pattern:${receiptId}`,
    runtime_locator_ref: `workspace-runtime-ref:memory-receipt:${receiptId}`,
    owner: DOMAIN_ID,
    generated_by_action: 'apply_visual_memory_writeback',
    proposal_id: proposalId,
    proposal_ref: `rca-memory-proposal:visual-pattern:${proposalId}`,
    writeback_status: decision,
    source_review_ref: safeText(task.source_review_ref || task.sourceReviewRef),
    candidate_memory_ref: candidateMemoryRef,
    memory_locator_ref: memoryLocatorRef,
    memory_content_body_ref: safeText(
      task.memory_content_body_ref || task.memoryContentBodyRef,
      `rca-memory-content-ref:visual-pattern:${slugId(memoryLocatorRef, 'memory')}`,
    ),
    operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
    provenance_refs: optionalArray(task.provenance_refs || task.provenanceRefs),
    coverage: {
      memory_content_body_written_to_repo: false,
      visual_truth_written: false,
      review_export_verdict_written: false,
      canonical_artifact_blob_written: false,
      opl_decision_owner: false,
    },
    repository_boundary: {
      repo_tracks_generator_contract: true,
      repo_tracks_receipt_instance: false,
      repo_tracks_memory_content_body: false,
      repo_tracks_visual_or_export_artifacts: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/receipts/memory/visual-pattern/<receipt-id>.json',
    },
    authority_boundary: {
      memory_content_owner: DOMAIN_ID,
      accept_reject_owner: DOMAIN_ID,
      opl_can_store_projection_ref: true,
      opl_can_store_memory_content: false,
      opl_can_issue_decision: false,
      opl_can_write_receipt_instance: false,
    },
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['receipts', 'memory', 'visual-pattern'],
    fileName: `${receiptId}.json`,
    payload: receipt,
  });
  return { ...written.payload, receipt_file: written.file };
}

async function applyVisualWorkspaceLifecycle(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const operation = safeText(task.operation).toLowerCase();
  const receiptBase = receiptId(task, 'lifecycle_receipt', `${operation || 'lifecycle'}-receipt`);
  if (!['cleanup', 'restore', 'retention'].includes(operation)) {
    return buildTypedBlocker({
      blockerKind: 'lifecycle_invalid_operation',
      blockerId: receiptBase,
      sourceContract: 'rca.lifecycle_guarded_apply_proof.v1',
      nextRequiredOwnerAction: 'choose_cleanup_restore_or_retention',
      workspaceRoot,
      details: { allowed_operations: ['cleanup', 'restore', 'retention'] },
    });
  }
  const required = ['domain_receipt_ref', 'artifact_locator_ref'];
  const missing = missingFields(task, required);
  if (missing.length > 0 || task.requested_artifact_mutation === true || task.requestedArtifactMutation === true) {
    return buildTypedBlocker({
      blockerKind: 'lifecycle_domain_receipt_required',
      blockerId: receiptBase,
      missing,
      sourceContract: 'rca.lifecycle_guarded_apply_proof.v1',
      nextRequiredOwnerAction: 'provide_domain_receipt_ref_before_any_artifact_mutation',
      workspaceRoot,
      details: {
        requested_artifact_mutation: Boolean(task.requested_artifact_mutation || task.requestedArtifactMutation),
        opl_can_apply_domain_artifact_mutation: false,
      },
    });
  }
  const receipt = {
    ok: true,
    surface_kind: 'visual_workspace_lifecycle_receipt',
    return_shape: 'lifecycle_receipt',
    operation,
    receipt_id: receiptBase,
    receipt_ref: `rca-lifecycle-receipt:${operation}:${receiptBase}`,
    runtime_locator_ref: `workspace-runtime-ref:lifecycle-receipt:${operation}:${receiptBase}`,
    owner: DOMAIN_ID,
    generated_by_action: 'apply_visual_workspace_lifecycle',
    workspace_locator: { workspace_root: workspaceRoot },
    domain_receipt_ref: safeText(task.domain_receipt_ref || task.domainReceiptRef),
    artifact_locator_ref: safeText(task.artifact_locator_ref || task.artifactLocatorRef),
    artifact_refs: optionalArray(task.artifact_refs || task.artifactRefs),
    retention_policy_ref: safeText(task.retention_policy_ref || task.retentionPolicyRef),
    restore_proof_ref: safeText(task.restore_proof_ref || task.restoreProofRef),
    artifact_mutation_applied: false,
    visual_truth_written: false,
    review_export_verdict_written: false,
    canonical_artifact_blob_written: false,
    repository_boundary: {
      repo_tracks_lifecycle_contract: true,
      repo_tracks_lifecycle_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/receipts/lifecycle/<operation>/<receipt-id>.json',
    },
    authority_boundary: {
      opl_can_apply_opl_owned_locator_metadata: true,
      opl_can_request_domain_receipt: true,
      opl_can_delete_or_rewrite_domain_artifact: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_review_export_verdict: false,
    },
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['receipts', 'lifecycle', operation],
    fileName: `${receiptBase}.json`,
    payload: receipt,
  });
  return { ...written.payload, receipt_file: written.file };
}

export async function dispatchProductSidecar(request) {
  const task = readTaskPayload(request);
  const action = normalizeAction(task);
  if (!GUARDED_ACTIONS.has(action)) {
    throw new Error(`product sidecar action 不允许: ${action || '<empty>'}`);
  }

  if (action === 'runtime_watch') {
    const result = await runtimeWatch({
      workspaceRoot: workspaceRootFromTask(task),
      topicId: requireField('topic_id', task.topic_id || task.topicId),
      deliverableId: requireField('deliverable_id', task.deliverable_id || task.deliverableId),
      runId: requireField('run_id', task.run_id || task.runId),
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'supervise_managed_run') {
    const result = await superviseManagedRun({
      workspaceRoot: workspaceRootFromTask(task),
      managedRunId: requireField('managed_run_id', task.managed_run_id || task.managedRunId),
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'product_entry_continuation') {
    const result = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRootFromTask(task),
      },
      entry_session_contract: {
        entry_session_id: requireField('entry_session_id', task.entry_session_id || task.entrySessionId),
      },
      task_intent: safeText(task.task_intent || task.taskIntent, 'run_managed_deliverable'),
      entry_mode: safeText(task.entry_mode || task.entryMode, 'opl_sidecar'),
      delivery_request: normalizeDeliveryRequest(task),
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'emit_no_regression_evidence') {
    const result = await emitNoRegressionEvidence(task);
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'emit_domain_owner_receipt') {
    const result = await emitDomainOwnerReceipt(task);
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'apply_visual_memory_writeback') {
    const result = await applyVisualMemoryWriteback(task);
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'apply_visual_workspace_lifecycle') {
    const result = await applyVisualWorkspaceLifecycle(task);
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'emit_workspace_receipt_proof') {
    const result = await emitWorkspaceReceiptProofPack({
      task,
      workspaceRoot: workspaceRootFromTask(task),
      buildTypedBlocker,
      applyVisualMemoryWriteback,
      applyVisualWorkspaceLifecycle,
      emitNoRegressionEvidence,
      emitDomainOwnerReceipt,
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  const result = {
    ok: true,
    surface_kind: 'notification_receipt',
    notification_id: requireField('notification_id', task.notification_id || task.notificationId),
    receipt_status: 'accepted',
    writes_domain_truth: false,
    summary: {
      notification_id: task.notification_id || task.notificationId,
      action: 'record_control_plane_receipt_only',
    },
  };
  return buildDispatchEnvelope({ task, result, action });
}
