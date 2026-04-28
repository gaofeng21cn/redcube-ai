import type {
  DeliverableRequest,
  OverlayRequest,
  SurfaceBase,
  WorkspaceRootRequest,
} from './foundation.js';

export interface ManagedRunProjection {
  current_stage: string | null;
  latest_events: Array<{
    at: string;
    stage_id: string | null;
    kind: string;
    summary: string;
  }>;
  current_blockers: string[];
  next_system_action: string | null;
  needs_user_decision: boolean;
  final_artifact_refs: string[];
  content_status: 'running' | 'completed' | 'paused_for_user_request' | 'blocked_by_runtime' | 'blocked_requires_human';
  completed_stages: string[];
  remaining_stages: string[];
  last_completed_stage: string | null;
  last_completed_at: string | null;
  human_report: {
    reported_at: string | null;
    recent_completion: string;
    mainline_status: string;
    runtime_health: string;
    current_blockers: string;
    next_system_action: string;
    needs_human_intervention: boolean;
  };
}

export interface ManagedRuntimeSupervision {
  schema_version: 1;
  recorded_at: string;
  managed_run_id: string;
  overlay: string;
  topic_id: string;
  deliverable_id: string;
  health_status: 'live' | 'recovering' | 'degraded' | 'paused' | 'completed' | 'escalated';
  runtime_liveness_audit: {
    status: 'live' | 'none';
    checked_at: string | null;
    reason_code: string;
  };
  worker_running: boolean;
  active_run_id: string | null;
  current_stage: string | null;
  content_status: ManagedRunProjection['content_status'];
  current_blockers: string[];
  needs_human_intervention: boolean;
  summary: string;
  next_action: string | null;
  last_transition: string;
  recovery_attempt_count: number;
  consecutive_failure_count: number;
  refs: {
    managed_run_path: string;
    progress_projection_path: string;
    runtime_supervision_path: string;
    escalation_record_path: string;
  };
}

export interface ManagedEscalationRecord {
  schema_version: 1;
  recorded_at: string;
  managed_run_id: string;
  escalation_status: 'none' | 'escalated';
  reason_code: string | null;
  severity: 'none' | 'managed_runtime';
  recommended_actions: string[];
  evidence_refs: string[];
  runtime_context_refs: Record<string, string>;
  requires_human_intervention: boolean;
}

export interface ManagedRunResponse extends SurfaceBase<'managed_run'> {
  managed_run: Record<string, unknown>;
  progress_projection: ManagedRunProjection;
  runtime_supervision: ManagedRuntimeSupervision;
  escalation_record: ManagedEscalationRecord;
  summary: {
    managed_run_id: string | null;
    status: string | null;
    current_stage: string | null;
  };
}

export interface ManagedRunRecordResponse extends SurfaceBase<'managed_run_record'> {
  managed_run: ManagedRunResponse['managed_run'];
  progress_projection: ManagedRunProjection;
  runtime_supervision: ManagedRuntimeSupervision;
  escalation_record: ManagedEscalationRecord;
  summary: ManagedRunResponse['summary'];
}

export interface ManagedSupervisionResponse extends SurfaceBase<'managed_supervision'> {
  managed_run: ManagedRunResponse['managed_run'];
  progress_projection: ManagedRunProjection;
  runtime_supervision: ManagedRuntimeSupervision;
  escalation_record: ManagedEscalationRecord;
  summary: ManagedRunResponse['summary'];
}

export interface RunManagedDeliverableRequest extends DeliverableRequest, OverlayRequest {
  adapter?: string;
  userIntent?: string;
  stopAfterStage?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface SuperviseManagedRunRequest extends WorkspaceRootRequest {
  managedRunId: string;
}
