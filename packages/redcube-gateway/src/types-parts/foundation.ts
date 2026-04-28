import type { GovernanceSurfaceContract } from '@redcube/overlay-core';
import type { WorkspaceContract } from '@redcube/runtime-protocol';
import type { FamilyDomainEntryContractSurface } from 'opl-gateway-shared/family-entry-contracts';

import type {
  ApprovalThroughputSummary,
  CostSummary,
  ErrorTaxonomySummary,
  MetricExtensionSummary,
  QualityDriftSummary,
  RerunAnalyticsSummary,
  RunTelemetrySummary,
} from './telemetry.js';

export interface WorkspaceRootRequest {
  workspaceRoot: string;
}

export interface TopicRequest extends WorkspaceRootRequest {
  topicId: string;
}

export interface DeliverableRequest extends TopicRequest {
  deliverableId: string;
}

export interface OverlayRequest {
  overlay: string;
}

export interface SurfaceSummary extends Record<string, unknown> {}

export interface OverlayCatalogEntry {
  overlay_id: string;
  default_profile_id: string | null;
  profiles: string[];
  route_sequence?: string[];
  deliverable_kind?: string;
  prompt_pack_id?: string;
  packages?: Record<string, string>;
}

export interface SurfaceBase<TKind extends string> {
  ok: boolean;
  surface_kind: TKind;
  recommended_action?: string | null;
  summary?: SurfaceSummary | string;
}

export interface DomainAgentEntrySpec {
  surface_kind: 'domain_agent_entry_spec' | string;
  agent_id: string;
  title: string;
  description: string;
  default_engine: string;
  workspace_requirement: 'required' | string;
  locator_schema: {
    required_fields: string[];
    optional_fields: string[];
  };
  codex_entry_strategy: 'domain_agent_entry' | string;
  artifact_conventions: string;
  progress_conventions: string;
  entry_command: string;
  manifest_command: string;
}

export type DomainEntryContractSurface = FamilyDomainEntryContractSurface & {
  domain_agent_entry_spec?: DomainAgentEntrySpec;
};

export interface WorkspaceDoctorResponse extends SurfaceBase<'workspace_doctor'> {
  workspaceRoot: string;
  workspaceFileExists: boolean;
  contract: WorkspaceContract;
  summary: {
    workspace_file_exists: boolean;
    canonical_topics_dir: string;
    canonical_runs_dir: string;
  };
}

export interface TopicCatalogResponse extends SurfaceBase<'topic_catalog'> {
  workspaceRoot: string;
  total: number;
  topics: Array<Record<string, unknown>>;
  summary: {
    total_topics: number;
  };
}

export interface OverlayCatalogResponse extends SurfaceBase<'overlay_catalog'> {
  overlays: OverlayCatalogEntry[];
  summary: {
    total_overlays: number;
    total_profiles: number;
  };
}

export interface CreateDeliverableRequest extends DeliverableRequest, OverlayRequest {
  profileId: string;
  title: string;
  goal: string;
}

export interface DeliverableCreateResponse extends SurfaceBase<'deliverable_create'> {
  deliverableFile: string;
  deliverable: Record<string, unknown>;
  surfaceFiles: string[];
  hydratedContract: Record<string, unknown>;
  governance_surface: GovernanceSurfaceContract;
  summary: {
    overlay: string;
    deliverable_id: string;
    surface_file_count: number;
  };
}

export interface DeliverableRecordResponse extends SurfaceBase<'deliverable_record'> {
  deliverable: Record<string, unknown>;
  governance_surface: GovernanceSurfaceContract;
  summary: {
    deliverable_id: string;
    overlay: string;
    profile_id?: string;
  };
}

export interface PublicationProjectionResponse extends SurfaceBase<'publication_projection'> {
  topic_id: string;
  state_type: 'projection';
  projection_file: string;
  publication: Record<string, unknown>;
  canonical_source: {
    kind: string;
  };
}

export interface RunRecordResponse extends SurfaceBase<'run_record'> {
  run: Record<string, unknown>;
  run_telemetry: RunTelemetrySummary;
  error_taxonomy: ErrorTaxonomySummary;
  rerun_analytics: RerunAnalyticsSummary;
  cost_summary: CostSummary;
  quality_drift_summary: QualityDriftSummary;
  approval_throughput_summary: ApprovalThroughputSummary;
  metric_extensions: MetricExtensionSummary[];
  summary: {
    run_id: string;
    status: string;
    current_stage: string | null;
  };
}

export interface RouteRunResponse extends SurfaceBase<'route_run'> {
  run: Record<string, unknown>;
  events: unknown[];
  artifactFile?: string;
  execution_proof?: Record<string, unknown>;
  error?: unknown;
  error_kind: string | null;
  governance_surface: GovernanceSurfaceContract;
  summary: {
    route: string;
    run_id: string | null;
    status: string | null;
  };
}

export interface RunDeliverableRouteRequest extends DeliverableRequest, OverlayRequest {
  route: string;
  adapter?: string;
  executorBackend?: 'codex_cli' | 'hermes_agent';
  executor_backend?: 'codex_cli' | 'hermes_agent';
  oplDefaultExecutorBackend?: 'codex_cli' | 'hermes_agent';
  opl_default_executor_backend?: 'codex_cli' | 'hermes_agent';
  userIntent?: string;
  managedRunId?: string | null;
  stopAfterStage?: string;
}
