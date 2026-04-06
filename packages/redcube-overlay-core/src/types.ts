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
