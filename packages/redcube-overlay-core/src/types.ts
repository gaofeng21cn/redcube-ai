export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface DeliverableRecordInput {
  topicId: string;
  deliverableId: string;
  overlay: string;
  kind: string;
  title: string;
}

export interface DeliverableRecord {
  topic_id: string;
  deliverable_id: string;
  overlay: string;
  kind: string;
  title: string;
  status: 'draft';
}

export interface HydrateDeliverableContractRequest {
  overlay?: string;
  profileId?: string;
  topicId?: string;
  deliverableId?: string;
  title?: string;
  goal?: string;
}

export interface HydratedDeliverableContract extends JsonObject {
  overlay: string;
  profile_id: string;
  deliverable_kind: string;
  topic_id: string;
  deliverable_id: string;
  title: string;
  goal: string;
}

export type GovernanceSurfaceKind =
  | 'direct_delivery_capable'
  | 'guarded_knowledge_poster'
  | 'human_publication';

export interface GovernanceSurfaceFamilyBoundary extends JsonObject {
  overlay: string;
  profile_id: string;
  family_kind: GovernanceSurfaceKind;
  direct_delivery_capable: boolean;
  guarded_knowledge_poster: boolean;
  human_publication: boolean;
}

export interface GovernanceSurfaceFormalEntry extends JsonObject {
  default_formal_entry: 'CLI';
  supported_protocol_layer: ['MCP'];
  internal_controller_surface: 'controller';
  controller_repo_verified: false;
}

export interface GovernanceSurfaceRuntimeTopology extends JsonObject {
  schema_version: 1;
  runtime_substrate_owner: 'Codex CLI';
  runtime_substrate_surface: 'codex_native_host_agent';
  deployment_host: 'codex_local_operator_host';
  deployment_host_status: 'active_primary';
  gateway_role: 'visual_deliverable_domain_gateway';
  domain_harness_os: 'RedCube Domain Harness OS';
  family_pack_boundary: 'family_profile_pack_harness_execution';
  product_mode: 'auto_only';
  default_formal_entry: 'CLI';
  supported_protocol_layer: ['MCP'];
  internal_controller_surface: 'controller';
  controller_repo_verified: false;
}

export interface GovernanceSurfaceContract extends JsonObject {
  schema_version: 1;
  shared_governance_surfaces: string[];
  required_summaries: string[];
  authoritative_audit_surfaces: string[];
  authoritative_review_surfaces: string[];
  family_boundary: GovernanceSurfaceFamilyBoundary;
  formal_entry: GovernanceSurfaceFormalEntry;
  runtime_topology: GovernanceSurfaceRuntimeTopology;
}

export interface OverlayProfileDefinition {
  profile_id: string;
}

export interface OverlayCatalogEntry {
  overlay_id: string;
  default_profile_id: string | null;
  profiles: string[];
  route_sequence?: string[];
  deliverable_kind?: string;
  prompt_pack_id?: string;
  packages?: {
    overlay?: string;
    runtime_family?: string;
    pack?: string;
  };
}

export interface OverlayDefinition {
  overlayId: string;
  defaultProfileId?: string | null;
  profiles: Record<string, OverlayProfileDefinition>;
  buildDeliverableRecord?: (input: DeliverableRecordInput) => DeliverableRecord;
  hydrateDeliverableContract?: (request: HydrateDeliverableContractRequest) => HydratedDeliverableContract;
  describeOverlay?: () => OverlayCatalogEntry;
}

export interface OverlayRegistry {
  getOverlay(overlayId: string): OverlayDefinition;
  describeOverlay(overlayId: string): OverlayCatalogEntry;
  listOverlays(): string[];
  listOverlayCatalog(): OverlayCatalogEntry[];
  listProfiles(overlayId: string): string[];
}
