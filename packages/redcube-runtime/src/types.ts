export interface RuntimeRunRecord {
  run_id: string;
  route: string;
  scope: string;
  target: string;
  overlay: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  current_stage: string | null;
  stage_results: unknown[];
  artifact_refs: string[];
  error: { message: string } | null;
  executor?: Record<string, unknown>;
}

export interface RuntimeCreativeOwnershipLifecycleFamilyMapping {
  source_readiness: string[];
  story_architecture: string[];
  visual_authorship: string[];
  delivery_packaging: string[];
  review_overlay: string[];
}

export interface RuntimeCreativeOwnershipResearchOwnershipContract {
  semantic_role?: 'shared_source_readiness_augmentation';
  positioning?: 'shared_source_readiness_optional_augmentation';
  trigger_conditions: string[];
}

export interface RuntimeCreativeOwnershipReviewOverlayContract {
  shared_layers: string[];
  family_mapping?: {
    xiaohongshu: string[];
    ppt_deck: string[];
  };
  xiaohongshu?: {
    status: 'active' | 'inactive';
    layers?: string[];
  };
  ppt_deck?: {
    status: 'active' | 'inactive';
    layers?: string[];
  };
}

export interface RuntimeCreativeOwnershipExecutionContract {
  program: 'P19';
  milestone: 'P19.A';
  tracking_model: 'unified_lifecycle';
  primary_executor: {
    adapter: 'host_agent';
    runtime: 'codex_native_host_agent';
    status: 'formal_primary_executor';
  };
  adapter_roles: {
    host_agent: 'formal_primary_executor';
    external_llm: 'optional_compatibility_adapter';
  };
  optional_compatibility_adapters: string[];
  protected_creative_routes: {
    xiaohongshu: RuntimeCreativeOwnershipLifecycleFamilyMapping;
    ppt_deck: RuntimeCreativeOwnershipLifecycleFamilyMapping;
  };
  primary_creative_routes: {
    xiaohongshu: string[];
    ppt_deck: string[];
  };
  unified_lifecycle: RuntimeCreativeOwnershipLifecycleContract;
  review_overlay: RuntimeCreativeOwnershipReviewOverlayContract;
  research_ownership: RuntimeCreativeOwnershipResearchOwnershipContract;
  mainline_topology: string[];
}

export interface RuntimeCreativeOwnershipLifecycleContract {
  tracking_model: 'unified_lifecycle';
  macro_lifecycle: Array<
    'source_readiness'
    | 'story_architecture'
    | 'visual_authorship'
    | 'delivery_packaging'
  >;
  review_overlay: string[];
  research_ownership: RuntimeCreativeOwnershipResearchOwnershipContract;
  stages: Array<
    'source_readiness'
    | 'story_architecture'
    | 'visual_authorship'
    | 'delivery_packaging'
  >;
  family_mapping: {
    xiaohongshu: RuntimeCreativeOwnershipLifecycleFamilyMapping;
    ppt_deck: RuntimeCreativeOwnershipLifecycleFamilyMapping;
  };
}

export interface RuntimeCreativeOwnershipForbiddenBoundaries {
  allowed_code_responsibilities: string[];
  forbidden_code_authorship: {
    xiaohongshu: string[];
    ppt_deck: string[];
  };
  fake_progress_conditions: string[];
}

export interface RuntimeCreativeOwnershipViolation {
  violation_id: string;
  stage: string;
  protected_surface: string;
  file: string;
  evidence_patterns: string[];
  why_blocked: string;
  status: 'present' | 'cleared';
}

export interface RuntimeCreativeOwnershipAudit {
  program: 'P19';
  milestone: 'P19.D';
  macro_lifecycle_stage: 'cross_lifecycle_closeout';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  tracking_model: 'unified_lifecycle';
  shared_execution_contract: {
    primary_adapter: 'host_agent';
    primary_runtime: 'codex_native_host_agent';
    external_llm_status: 'optional_compatibility_adapter';
    freeze_origin_milestone: 'P19.A';
    mainline_topology: string[];
  };
  unified_lifecycle: RuntimeCreativeOwnershipLifecycleContract;
  research_ownership: RuntimeCreativeOwnershipResearchOwnershipContract;
  review_overlay: RuntimeCreativeOwnershipReviewOverlayContract;
  shared_closeout: {
    story_architecture: 'cleared_across_families';
    visual_authorship: 'cleared_across_families';
    delivery_packaging: 'no_creative_residue_priority_deferred';
    review_overlay: 'dual_layer_active_across_families';
    remaining_shared_closeout: string[];
  };
  families: {
    xiaohongshu: {
      status: 'present' | 'cleared';
      protected_routes: string[];
      lifecycle_residue: Record<string, { status: 'present' | 'cleared'; violations: RuntimeCreativeOwnershipViolation[] }>;
      violations: RuntimeCreativeOwnershipViolation[];
    };
    ppt_deck: {
      status: 'present' | 'cleared';
      protected_routes: string[];
      lifecycle_residue: Record<string, { status: 'present' | 'cleared'; violations: RuntimeCreativeOwnershipViolation[] }>;
      violations: RuntimeCreativeOwnershipViolation[];
    };
  };
}

export interface RuntimeCreativeOwnershipCloseoutAuditFinding {
  file: string;
  protected_output: string;
  residue_kind: string;
  evidence_patterns: string[];
  summary: string;
}

export interface RuntimeCreativeOwnershipCloseoutAudit {
  milestone: 'P19.D';
  phase: 'shared_execution_and_audit_closeout';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  execution_model: {
    mainline_adapter: 'host_agent';
    primary_surface: 'codex_native_host_agent';
    adapter_role: 'primary_creative_executor';
    agent_first_requires_external_llm: false;
    external_llm_role: 'optional_compatibility_adapter';
    freeze_origin_milestone: 'P19.A';
  };
  unified_lifecycle: {
    stages: RuntimeCreativeOwnershipLifecycleContract['macro_lifecycle'];
    family_mapping: RuntimeCreativeOwnershipLifecycleContract['family_mapping'];
  };
  research_ownership: {
    positioning: 'shared_source_readiness_optional_augmentation';
    trigger_conditions: string[];
  };
  review_overlay: {
    shared_layers: string[];
    xiaohongshu: {
      status: 'active';
    };
    ppt_deck: {
      status: 'active' | 'missing_visual_director_review_contract';
    };
  };
  creative_ownership_boundary: {
    code_allowed_responsibilities: string[];
    code_forbidden_outputs: string[];
  };
  residue: {
    xiaohongshu: {
      status: 'open' | 'cleared';
      findings: RuntimeCreativeOwnershipCloseoutAuditFinding[];
    };
    ppt_deck: {
      status: 'open' | 'cleared';
      findings: RuntimeCreativeOwnershipCloseoutAuditFinding[];
    };
  };
  closeout_scope: {
    story_architecture: 'cleared_across_families';
    visual_authorship: 'cleared_across_families';
    delivery_packaging: 'no_creative_residue_priority_deferred';
    review_overlay: 'dual_layer_active_across_families';
    remaining_shared_closeout: string[];
  };
  team_lane_contract: {
    tracking_model: 'unified_lifecycle';
    lanes: Array<{
      lane_id: string;
      lifecycle_focus: string[];
      write_scopes: string[];
      verification_commands: string[];
    }>;
    overlapping_write_scopes: Array<{
      scope: string;
      lanes: string[];
    }>;
    final_convergence_order: string[];
  };
  team_gate: {
    shared_contract_frozen: boolean;
    shared_lifecycle_contract_frozen: boolean;
    research_ownership_frozen: boolean;
    lifecycle_alignment_red_tests_written: boolean;
    ppt_visual_director_review_contract_frozen: boolean;
    lane_write_scopes_by_shared_lifecycle: boolean;
    independent_verification_defined: boolean;
    final_convergence_order_defined: boolean;
    missing_gates: string[];
  };
}

export interface RuntimeCreativeOwnershipProgramStatus {
  program: 'P19';
  current_milestone: 'P19.D';
  completed_milestones: Array<'P19.A' | 'P19.B' | 'P19.C'>;
  closeout_ready: true;
  current_mode: string;
  macro_lifecycle_stage: 'cross_lifecycle_closeout';
  shared_execution_contract: RuntimeCreativeOwnershipAudit['shared_execution_contract'];
  unified_lifecycle: RuntimeCreativeOwnershipLifecycleContract;
  residue_by_family: RuntimeCreativeOwnershipAudit['families'];
  shared_closeout: RuntimeCreativeOwnershipCloseoutAudit['closeout_scope'];
  team_lane_contract: RuntimeCreativeOwnershipCloseoutAudit['team_lane_contract'];
  team_gate: {
    satisfied: boolean;
    missing_gates: string[];
  };
}

export interface RuntimeRunRouteRequest {
  workspaceRoot: string;
  overlay: string;
  topicId: string;
  deliverableId: string;
  route: string;
  adapter?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface RuntimeRunRouteResponse {
  ok: boolean;
  run: RuntimeRunRecord;
  events: unknown[];
  artifactFile?: string;
  error?: unknown;
}

export interface RuntimeRunLookupRequest {
  workspaceRoot: string;
  runId: string;
}

export interface RuntimeEventRecord extends Record<string, unknown> {}

export interface RuntimeStartRunRequest {
  workspaceRoot: string;
  route: string;
  overlay: string;
  scope?: string;
  target: string;
  executor: Record<string, unknown>;
}

export interface RuntimeCompleteRunRequest {
  workspaceRoot: string;
  runId: string;
  currentStage: string;
  stageResults: unknown[];
  artifactRefs: string[];
  executor: Record<string, unknown>;
}

export interface RuntimeFailRunRequest {
  workspaceRoot: string;
  runId: string;
  currentStage: string;
  error: unknown;
  executor: Record<string, unknown>;
}

export interface RuntimeSourceIntakeResponse {
  ok: boolean;
  topicId: string;
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
}

export interface RuntimeSourceIntakeRequest {
  workspaceRoot: string;
  topicId: string;
  title?: string;
  brief?: string;
  keywords?: string[] | string;
  sourceFiles?: string[] | string;
  modeHint?: string;
}
