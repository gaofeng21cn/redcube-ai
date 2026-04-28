import type {
  DeliverableCreateResponse,
  OverlayRequest,
  SurfaceBase,
  TopicRequest,
} from './foundation.js';
import type { ManagedRunResponse } from './managed.js';

export interface SourceIntakeResponse extends SurfaceBase<'source_intake'> {
  artifactFiles: Record<string, string>;
  audit: Record<string, unknown>;
  augmentation: Record<string, unknown>;
  summary: {
    topic_id: string;
    audit_status: string | null;
    blocking_reason_count: number;
  };
}

export interface SourceResearchResponse extends SurfaceBase<'source_research'> {
  artifactFiles: Record<string, string>;
  stage: string;
  planningReady: boolean;
  report: Record<string, unknown>;
  intake: Record<string, unknown>;
  augmentation?: Record<string, unknown>;
  resultPreparation?: Record<string, unknown>;
  resultWrite?: Record<string, unknown>;
  execution?: Record<string, unknown>;
  summary: {
    topic_id: string;
    stage: string | null;
    planning_ready: boolean;
  };
}

export interface SourceAugmentationResponse extends SurfaceBase<'source_augmentation'> {
  artifactFiles: Record<string, string>;
  augmentation: Record<string, unknown>;
  summary: {
    topic_id: string;
    status: string | null;
    readiness_target: string | null;
  };
}

export interface SourceAugmentationResultPreparationResponse extends SurfaceBase<'source_augmentation_result_preparation'> {
  artifactFiles: Record<string, string>;
  request: Record<string, unknown>;
  resultDraft: Record<string, unknown>;
  summary: {
    topic_id: string;
    readiness_target: string | null;
    evidence_gap_count: number;
  };
}

export interface SourceAugmentationResultWriteResponse extends SurfaceBase<'source_augmentation_result_write'> {
  artifactFiles: Record<string, string>;
  resultContract: Record<string, unknown>;
  summary: {
    topic_id: string;
    readiness_target: string | null;
    reference_source_count: number;
    fact_group_count: number;
  };
}

export interface SourceAugmentationExecutionResponse extends SurfaceBase<'source_augmentation_execution'> {
  artifactFiles: Record<string, string>;
  report: Record<string, unknown>;
  summary: {
    topic_id: string;
    status: string | null;
    readiness_target: string | null;
  };
}

export interface SourceFirstFanoutDeliverableRequest extends OverlayRequest {
  deliverableId: string;
  profileId: string;
  title: string;
  goal: string;
  userIntent?: string;
  adapter?: string;
  stopAfterStage?: string;
  mode?: string;
  baselineDeliverableId?: string;
}

export interface RunSourceFirstFanoutRequest extends TopicRequest {
  title?: string;
  brief?: string;
  keywords?: string[];
  sourceFiles?: string[];
  operatorFiles?: string[];
  deliverables: SourceFirstFanoutDeliverableRequest[];
}

export interface SourceFirstFanoutResponse extends SurfaceBase<'source_first_fanout'> {
  source_barrier: SourceResearchResponse;
  source_pack_federation?: Record<string, unknown>;
  source_pack_manifest?: Record<string, unknown>;
  planner?: Record<string, unknown>;
  created_deliverables?: DeliverableCreateResponse[];
  managed_runs?: ManagedRunResponse[];
  summary: {
    topic_id: string;
    source_barrier_status: string;
    deliverable_count: number;
    managed_run_count: number;
    parallel_family_ready?: boolean;
    max_parallel_width?: number;
  };
}
