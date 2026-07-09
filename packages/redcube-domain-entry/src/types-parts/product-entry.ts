import type {
  FamilySharedHandoffSurface,
  UserInteractionContractSurface,
} from 'opl-framework-shared/family-entry-contracts';
import type {
  FamilyProductEntrySurfaces,
  FamilyOrchestrationCompanion as SharedFamilyOrchestrationCompanion,
  FamilyOrchestrationGatePreview as SharedFamilyOrchestrationGatePreview,
  FamilyOrchestrationReferenceRef as SharedFamilyOrchestrationReferenceRef,
  ProductEntryResumeContract as SharedProductEntryResumeContract,
} from 'opl-framework-shared/product-entry-companions';

import type {
  DomainEntryContractSurface,
  PublicationProjectionResponse,
  ReviewStateResponse,
  RouteRunResponse,
  RuntimeProgressProjection,
  RuntimeProjection,
  StageExecutionResponse,
  SurfaceBase,
  SurfaceSummary,
} from './foundation.js';

interface DomainEntryRequest extends Record<string, unknown> {
  target_domain_id: string;
  task_intent: 'run_opl_stage_execution_plan' | 'run_deliverable_route' | string;
  entry_mode: string;
  workspace_locator: {
    workspace_root: string;
  };
  runtime_session_contract: {
    runtime_owner: string;
    adapter_surface?: string;
    session_mode?: string;
  };
  return_surface_contract: {
    surface_kind: string;
  };
  domain_payload: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    route?: string;
    adapter?: string;
    user_intent?: string;
    lifecycle_policy?: string;
    stop_after_stage?: string;
    mode?: string;
    baseline_deliverable_id?: string;
    constraints?: Record<string, unknown>;
  };
}

export interface DomainEntryResponse extends SurfaceBase<'domain_entry'> {
  entry_contract_id: string;
  target_domain_id: string;
  task_intent: string;
  entry_mode: string;
  runtime_session_contract: Record<string, unknown>;
  return_surface_contract: Record<string, unknown>;
  domain_payload: Record<string, unknown>;
  result_surface: StageExecutionResponse | RouteRunResponse;
  summary: {
    task_intent: string;
    actual_surface_kind: string;
    target_handle: string | null;
  };
}

export interface ProductEntryRequest extends Record<string, unknown> {
  workspace_locator: {
    workspace_root: string;
  };
  entry_session_contract: {
    entry_session_id: string;
  };
  task_intent?: 'run_opl_stage_execution_plan' | 'run_deliverable_route' | string;
  entry_mode?: string;
  delivery_request: {
    deliverable_family?: string;
    topic_id?: string;
    deliverable_id?: string;
    profile_id?: string;
    title?: string;
    goal?: string;
    route?: string;
    adapter?: string;
    user_intent?: string;
    lifecycle_policy?: string;
    stop_after_stage?: string;
    mode?: string;
    baseline_deliverable_id?: string;
    constraints?: Record<string, unknown>;
  };
}

type FamilyOrchestrationReferenceRef = SharedFamilyOrchestrationReferenceRef;

type FamilyOrchestrationGatePreview = SharedFamilyOrchestrationGatePreview;

export type FamilyOrchestrationResumeContract = SharedProductEntryResumeContract;

export type FamilyOrchestrationCompanion = SharedFamilyOrchestrationCompanion;

export interface ProductEntryQuickstartStep {
  step_id: string;
  title?: string;
  command: string;
  surface_kind: string;
  summary?: string;
  requires?: string[];
}

export interface ProductEntryQuickstartCompanion {
  surface_kind: 'product_entry_quickstart' | string;
  recommended_step_id: string;
  summary?: string;
  steps: ProductEntryQuickstartStep[];
  resume_contract?: FamilyOrchestrationResumeContract;
  human_gate_ids?: string[];
}

export interface ProductEntryStartMode {
  mode_id: string;
  title?: string;
  command: string;
  surface_kind: string;
  summary?: string;
  requires?: string[];
}

export interface ProductEntryStartCompanion {
  ok: boolean;
  surface_kind: 'product_entry_start' | string;
  target_domain_id?: string;
  workspace_locator?: {
    workspace_surface_kind: string;
    workspace_root: string;
  };
  summary: string;
  recommended_mode_id: string;
  modes: ProductEntryStartMode[];
  resume_surface: {
    surface_kind: string;
    command: string;
    session_locator_field?: string;
    checkpoint_locator_field?: string;
  };
  human_gate_ids: string[];
}

export interface ProductEntryOverviewCompanion {
  surface_kind: 'product_entry_overview' | string;
  summary: string;
  product_entry_command: string;
  recommended_command: string;
  operator_loop_command: string;
  entry_status_command?: string;
  progress_surface?: {
    surface_kind: string;
    command: string;
    step_id?: string;
  };
  resume_surface?: {
    surface_kind: string;
    command: string;
    session_locator_field?: string;
    checkpoint_locator_field?: string;
  };
  recommended_step_id?: string;
  next_focus: string[];
  remaining_gaps_count: number;
  human_gate_ids?: string[];
}

export interface ProductEntryReadinessCompanion {
  surface_kind: 'product_entry_readiness' | string;
  verdict: string;
  usable_now: boolean;
  good_to_use_now: boolean;
  fully_automatic: boolean;
  summary: string;
  recommended_start_surface: string;
  recommended_start_command: string;
  recommended_loop_surface: string;
  recommended_loop_command: string;
  blocking_gaps: string[];
}

export interface ProductEntryPreflightCheck {
  check_id: string;
  title: string;
  status: 'pass' | 'warn' | 'fail' | string;
  blocking: boolean;
  summary: string;
  command: string;
}

export interface ProductEntryPreflightCompanion {
  surface_kind: 'product_entry_preflight';
  summary?: SurfaceSummary | string;
  ready_to_try_now: boolean;
  recommended_check_command: string;
  recommended_start_command: string;
  blocking_check_ids: string[];
  checks: ProductEntryPreflightCheck[];
}

export interface ProductEntryRestorePoint {
  latest_handle: string | null;
  latest_stage_execution_plan_ref: string | null;
  latest_run_id: string | null;
}

export interface SessionContinuitySurface {
  surface_kind: 'session_continuity';
  entry_session_id: string;
  session_file: string;
  runtime_owner: string;
  delivery_identity: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    profile_id: string | null;
  };
  restore_point: ProductEntryRestorePoint;
  summary: {
    entry_session_id: string;
    latest_handle: string | null;
  };
}

export interface ProgressProjectionSurface {
  surface_kind: 'progress_projection';
  stage_execution_plan_ref: string | null;
  projection: RuntimeProgressProjection;
  refs: RuntimeProjection['refs'] | null;
  summary: {
    current_stage: string | null;
    content_status: RuntimeProgressProjection['content_status'] | null;
    needs_user_decision: boolean;
  };
}

export interface ArtifactInventorySurface {
  surface_kind: 'artifact_inventory';
  entry_session_id: string;
  session_file: string;
  restore_point: ProductEntryRestorePoint;
  artifact_refs: string[];
  refs: RuntimeProjection['refs'] | null;
  summary: {
    latest_handle: string | null;
    artifact_ref_count: number;
  };
}

export interface RuntimeLoopClosureSurface {
  surface_kind: 'runtime_loop_closure';
  loop_owner: {
    runtime_owner: string;
    domain_owner: string;
    product_entry_owner: string;
  };
  resume_point: {
    entry_session_id: string | null;
    session_file: string | null;
    latest_stage_execution_plan_ref: string | null;
    latest_run_id: string | null;
    latest_handle: string | null;
    resume_command_template: string;
    checkpoint_locator_field: string;
  };
  progress_cursor: {
    surface_kind: 'progress_projection';
    surface_ref: string;
    stage_execution_plan_ref: string | null;
    current_stage: string | null;
    content_status: RuntimeProgressProjection['content_status'] | null;
    needs_user_decision: boolean;
  };
  artifact_pickup: {
    surface_kind: 'artifact_inventory';
    surface_ref: string;
    deliverable_family: string | null;
    topic_id: string | null;
    deliverable_id: string | null;
    artifact_refs: string[];
    artifact_ref_count: number;
  };
  control_policy: {
    approval_gate_id: string;
    approval_required: boolean;
    interrupt_policy: string;
    continue_action: {
      command: string;
      surface_kind: 'product_entry_session';
    };
    human_gate_ids: string[];
  };
  source_linkage: {
    current_source: string;
    entry_mode: string | null;
    direct_surface_kind: 'product_entry';
    opl_hosted_surface_kind: 'opl_hosted_product_entry';
    session_surface_kind: 'product_entry_session';
    downstream_entry_surface_kind: 'domain_entry';
  };
}

export interface OplFamilyLifecycleAdapterSurface {
  surface_kind: 'opl_family_lifecycle_adapter';
  adapter_id: string;
  version: string;
  domain_id: string;
  domain_owner: string;
  discovery: {
    adoption_state: string;
    owner_split: Record<string, string>;
    route_surfaces: Array<Record<string, unknown>>;
    delivery_identity: {
      deliverable_family: string | null;
      topic_id: string | null;
      deliverable_id: string | null;
      profile_id: string | null;
    };
  };
  persistence: Record<string, unknown>;
  lifecycle: Record<string, unknown>;
  owner_route_discovery: Record<string, unknown>;
  adoption: Record<string, unknown>;
  authority_boundary: {
    owns_domain_truth: boolean;
    owns_canonical_artifacts: boolean;
    owns_review_truth: boolean;
    owns_publication_projection: boolean;
    owns_concrete_executor: boolean;
    allowed_authority: string[];
  };
  non_goals: string[];
}

export interface ProductEntryResponse extends SurfaceBase<'product_entry'> {
  product_entry_contract_id: string;
  entry_session: {
    entry_session_id: string;
    session_file: string;
    resumed_from_session: boolean;
    created_deliverable: boolean;
    runtime_owner: string;
  };
  delivery_identity: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    profile_id: string | null;
  };
  domain_entry_surface: DomainEntryResponse;
  continuation_snapshot: {
    latest_stage_execution_plan_ref: string | null;
    latest_run_id: string | null;
    runtime_progress_projection: RuntimeProgressProjection | null;
    runtime_projection: RuntimeProjection | null;
  };
  session_continuity: SessionContinuitySurface;
  progress_projection: ProgressProjectionSurface | null;
  artifact_inventory: ArtifactInventorySurface;
  runtime_loop_closure: RuntimeLoopClosureSurface;
  review_state: ReviewStateResponse;
  publication_projection: PublicationProjectionResponse;
  opl_family_lifecycle_adapter: OplFamilyLifecycleAdapterSurface;
  family_orchestration: FamilyOrchestrationCompanion;
  summary: {
    entry_session_id: string;
    task_intent: string;
    actual_surface_kind: string | null;
    target_handle: string | null;
  };
}

interface OplHostedProductEntryRequest extends Record<string, unknown> {
  target_domain_id: string;
  task_intent: 'run_opl_stage_execution_plan' | 'run_deliverable_route' | string;
  entry_mode: string;
  workspace_locator: {
    workspace_root: string;
  };
  runtime_session_contract: {
    runtime_owner: string;
  };
  return_surface_contract: {
    surface_kind: string;
  };
  entry_session_contract: ProductEntryRequest['entry_session_contract'];
  delivery_request: ProductEntryRequest['delivery_request'];
}

interface OplHostedProductEntryResponse extends SurfaceBase<'opl_hosted_product_entry'> {
  opl_hosted_product_entry_contract_id: string;
  target_domain_id: string;
  entry_mode: string;
  runtime_session_contract: Record<string, unknown>;
  return_surface_contract: {
    requested_surface_kind: string;
    actual_surface_kind: string;
  };
  family_orchestration: FamilyOrchestrationCompanion;
  product_entry_surface: ProductEntryResponse;
  runtime_loop_closure: RuntimeLoopClosureSurface;
  opl_family_lifecycle_adapter: OplFamilyLifecycleAdapterSurface;
  summary: {
    entry_session_id: string | null;
    actual_surface_kind: string;
    target_handle: string | null;
  };
}

export interface ProductEntrySessionResponse extends SurfaceBase<'product_entry_session'> {
  product_entry_contract_id: string;
  entry_session: {
    entry_session_id: string;
    session_file: string;
    runtime_owner: string;
  };
  delivery_identity: {
    deliverable_family: string;
    topic_id: string;
    deliverable_id: string;
    profile_id: string | null;
  };
  continuation_snapshot: {
    latest_stage_execution_plan_ref: string | null;
    latest_run_id: string | null;
    runtime_progress_projection: RuntimeProgressProjection | null;
    runtime_projection: RuntimeProjection | null;
  };
  session_continuity: SessionContinuitySurface;
  progress_projection: ProgressProjectionSurface | null;
  artifact_inventory: ArtifactInventorySurface;
  runtime_loop_closure: RuntimeLoopClosureSurface;
  review_state: ReviewStateResponse;
  publication_projection: PublicationProjectionResponse;
  opl_family_lifecycle_adapter: OplFamilyLifecycleAdapterSurface;
  family_orchestration: FamilyOrchestrationCompanion;
  summary: {
    entry_session_id: string;
    deliverable_id: string;
    latest_handle: string | null;
  };
}

export interface ProductEntryManifestResponse extends SurfaceBase<'product_entry_manifest'> {
  manifest_version: 2 | number;
  manifest_kind: string;
  target_domain_id: string;
  formal_entry: {
    default: 'CLI' | string;
    supported_protocols: string[];
    internal_surface: string;
    internal_surface_role?: string;
    retired_internal_surface_ids?: string[];
    retired_internal_surface_policy?: {
      surface_kind: 'retired_internal_surface_policy' | string;
      semantic_id_required: boolean;
      required_id_prefix: string;
      legacy_raw_surface_ids_forbidden: string[];
      legacy_terms_allowed_only_inside_retired_semantic_ids: boolean;
      compatibility_alias_allowed: boolean;
      callable_alias_allowed: boolean;
      active_caller_allowed: boolean;
      production_readiness_claim_allowed: boolean;
    };
    compatibility_alias_allowed?: boolean;
  };
  workspace_locator: {
    workspace_surface_kind: string;
    workspace_root: string;
  };
  recommended_shell: 'direct' | 'opl_hosted_handoff' | 'session' | string;
  recommended_command: string;
  entry_status_surface: {
    shell_key: 'status' | string;
    command: string;
    surface_kind: string;
    summary: string;
  };
  status_surface: {
    shell_key: 'status' | string;
    command: string;
    surface_kind: string;
    summary: string;
  };
  operator_loop_surface: {
    shell_key: 'direct' | 'opl_hosted_handoff' | 'session' | string;
    command: string;
    surface_kind: string;
    summary: string;
    continuation_shell_key?: 'direct' | 'opl_hosted_handoff' | 'session' | string;
    continuation_command?: string;
  };
  operator_loop_actions: Record<string, {
    command: string;
    surface_kind: string;
    summary: string;
    requires: string[];
  }>;
  product_entry_status: {
    summary: string;
    next_focus: string[];
    remaining_gaps_count: number;
  };
  runtime: {
    runtime_owner: string;
    runtime_state_root: string;
    session_continuity_root: string;
  };
  opl_provider_runtime_contract: {
    shared_contract_ref: string;
    runtime_owner: string;
    domain_owner: string;
    executor_owner: string;
    supervision_status_surface: {
      surface_kind: string;
      owner: string;
    };
    attention_queue_surface: {
      surface_kind: string;
      owner: string;
    };
    recovery_contract_surface: {
      surface_kind: string;
      owner: string;
    };
    fail_closed_rules: string[];
  };
  runtime_inventory?: Record<string, unknown>;
  task_lifecycle?: Record<string, unknown>;
  persistence_policy?: Record<string, unknown>;
  lifecycle_ledger?: Record<string, unknown>;
  owner_route?: Record<string, unknown>;
  skill_catalog?: Record<string, unknown>;
  automation?: Record<string, unknown>;
  product_entry_shell: {
    status: {
      command: string;
      command_template: string;
      surface_kind: 'product_status' | string;
    };
    direct: {
      command: string;
      command_template: string;
      surface_kind: 'product_entry';
    };
    opl_hosted_handoff: {
      command: string;
      action_ref?: string;
      command_template?: string;
      surface_kind: 'opl_hosted_product_entry';
    };
    session: {
      command: string;
      command_template: string;
      surface_kind: 'product_entry_session';
    };
  };
  shared_handoff: FamilySharedHandoffSurface & {
    opl_return_surface: {
      surface_kind: 'product_entry';
      target_domain_id: string;
    };
  };
  domain_entry_contract: DomainEntryContractSurface;
  user_interaction_contract: UserInteractionContractSurface;
  product_entry_start: ProductEntryStartCompanion;
  product_entry_overview: ProductEntryOverviewCompanion;
  product_entry_preflight: ProductEntryPreflightCompanion;
  product_entry_readiness: ProductEntryReadinessCompanion;
  product_entry_quickstart: ProductEntryQuickstartCompanion;
  family_orchestration: FamilyOrchestrationCompanion;
  current_truth: {
    product_entry_contract: string;
    opl_hosted_product_entry_contract: string;
    session_continuity_provenance_contract: string;
  };
  session_continuity: {
    surface_kind: 'session_continuity';
    owner: string;
    status: string;
    summary: string;
    progress_surface_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    artifact_surface_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    restore_point_surface_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    restore_point_field_refs: Array<{
      ref_kind: string;
      ref: string;
      label?: string;
    }>;
    session_surface_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    session_file_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    session_command_template: string;
    truth_surfaces: Array<{
      surface_kind: string;
      ref_kind: string;
      ref: string;
      label?: string;
    }>;
  };
  progress_projection: {
    surface_kind: 'progress_projection';
    owner: string;
    status: string;
    summary: string;
    projection_field_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    runtime_refs_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    fallback_projection_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    fallback_runtime_refs_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    truth_surfaces: Array<{
      surface_kind: string;
      ref_kind: string;
      ref: string;
      label?: string;
    }>;
  };
  artifact_inventory: {
    surface_kind: 'artifact_inventory';
    owner: string;
    status: string;
    summary: string;
    artifact_refs_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    artifact_ref_count_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    restore_point_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    artifact_refs_fallback_ref: {
      ref_kind: string;
      ref: string;
      label?: string;
    };
    restore_point_field_refs: Array<{
      ref_kind: string;
      ref: string;
      label?: string;
    }>;
    session_command_template: string;
    truth_surfaces: Array<{
      surface_kind: string;
      ref_kind: string;
      ref: string;
      label?: string;
    }>;
  };
  runtime_loop_closure: RuntimeLoopClosureSurface;
  opl_family_lifecycle_adapter: OplFamilyLifecycleAdapterSurface;
  notes: string[];
}

export interface ProductStatusResponse extends SurfaceBase<'product_status'> {
  target_domain_id: string;
  schema_ref?: string;
  entry_status_surface: ProductEntryManifestResponse['entry_status_surface'];
  status_surface: ProductEntryManifestResponse['status_surface'];
  workspace_locator: ProductEntryManifestResponse['workspace_locator'];
  runtime: ProductEntryManifestResponse['runtime'];
  product_entry_status: ProductEntryManifestResponse['product_entry_status'];
  operator_loop_surface: ProductEntryManifestResponse['operator_loop_surface'];
  operator_loop_actions: ProductEntryManifestResponse['operator_loop_actions'];
  product_entry_start: ProductEntryManifestResponse['product_entry_start'];
  product_entry_overview: ProductEntryManifestResponse['product_entry_overview'];
  product_entry_preflight: ProductEntryManifestResponse['product_entry_preflight'];
  product_entry_readiness: ProductEntryManifestResponse['product_entry_readiness'];
  product_entry_quickstart: ProductEntryManifestResponse['product_entry_quickstart'];
  family_orchestration: ProductEntryManifestResponse['family_orchestration'];
  product_entry_manifest: ProductEntryManifestResponse;
  entry_surfaces: FamilyProductEntrySurfaces & {
    direct: ProductEntryManifestResponse['product_entry_shell']['direct'];
    opl_hosted_handoff: ProductEntryManifestResponse['product_entry_shell']['opl_hosted_handoff'];
    session: ProductEntryManifestResponse['product_entry_shell']['session'];
  };
  domain_entry_contract: ProductEntryManifestResponse['domain_entry_contract'];
  user_interaction_contract: ProductEntryManifestResponse['user_interaction_contract'];
  summary: {
    product_entry_command: string | null;
    recommended_command: string;
    operator_loop_command: string | null;
  };
  notes: string[];
}

interface ProductPreflightResponse extends SurfaceBase<'product_entry_preflight'>, ProductEntryPreflightCompanion {
  target_domain_id: string;
  workspace_locator: ProductEntryManifestResponse['workspace_locator'];
}
