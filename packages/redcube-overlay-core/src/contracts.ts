import { buildCodexRuntimeTopology } from '@redcube/hermes-substrate';

import type {
  DeliverableRecord,
  DeliverableRecordInput,
  GovernanceSurfaceContract,
  GovernanceSurfaceFamilyBoundary,
  GovernanceSurfaceKind,
  HydratedDeliverableContract,
  HydrateDeliverableContractRequest,
  JsonObject,
  JsonValue,
  OverlayRegistry,
} from './types.js';

export function buildDeliverableRecord({
  topicId,
  deliverableId,
  overlay,
  kind,
  title,
}: DeliverableRecordInput): DeliverableRecord {
  const fields = {
    topicId: String(topicId || '').trim(),
    deliverableId: String(deliverableId || '').trim(),
    overlay: String(overlay || '').trim(),
    kind: String(kind || '').trim(),
    title: String(title || '').trim(),
  };

  for (const [fieldName, value] of Object.entries(fields)) {
    if (!value) {
      throw new Error(`Missing deliverable field: ${fieldName}`);
    }
  }

  return {
    topic_id: fields.topicId,
    deliverable_id: fields.deliverableId,
    overlay: fields.overlay,
    kind: fields.kind,
    title: fields.title,
    status: 'draft',
  };
}

export const SHARED_GOVERNANCE_SURFACES = [
  'deliverable create',
  'deliverable audit',
  'deliverable run',
  'review watch',
  'auditDeliverable',
  'runtimeWatch',
  'getReviewState',
  'getPublicationProjection',
] as const;

export const REQUIRED_GOVERNANCE_SUMMARIES = [
  'source_readiness_summary',
  'gate_summary',
  'operator_handoff',
  'lifecycle_stage_summary',
] as const;

function textValue(value: JsonValue | undefined): string {
  return String(value || '').trim();
}

function isPlainObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function objectValue(value: JsonValue | undefined): JsonObject {
  return isPlainObject(value) ? value : {};
}

function stringArray(value: JsonValue | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function buildGovernanceFamilyBoundary(contract: JsonObject = {}): GovernanceSurfaceFamilyBoundary {
  const overlay = textValue(contract.overlay);
  const profileId = textValue(contract.profile_id);
  const deliveryContract = objectValue(contract.delivery_contract);
  const projectionModel = textValue(deliveryContract.projection_model);
  const humanPublication = projectionModel === 'human_publication';
  const guardedKnowledgePoster = overlay === 'poster_onepager' && profileId === 'knowledge_poster';
  const familyKind: GovernanceSurfaceKind = guardedKnowledgePoster
    ? 'guarded_knowledge_poster'
    : (humanPublication ? 'human_publication' : 'direct_delivery_capable');

  return {
    overlay,
    profile_id: profileId,
    family_kind: familyKind,
    direct_delivery_capable: !humanPublication,
    guarded_knowledge_poster: guardedKnowledgePoster,
    human_publication: humanPublication,
  };
}

export function buildGovernanceSurfaceContract(contract: JsonObject = {}): GovernanceSurfaceContract {
  return {
    schema_version: 1,
    shared_governance_surfaces: [...SHARED_GOVERNANCE_SURFACES],
    required_summaries: [...REQUIRED_GOVERNANCE_SUMMARIES],
    authoritative_audit_surfaces: ['auditDeliverable', 'runtimeWatch'],
    authoritative_review_surfaces: ['getReviewState', 'getPublicationProjection'],
    family_boundary: buildGovernanceFamilyBoundary(contract),
    formal_entry: {
      default_formal_entry: 'CLI',
      supported_protocol_layer: ['MCP'],
      internal_controller_surface: 'controller',
      controller_repo_verified: false,
    },
    runtime_topology: buildCodexRuntimeTopology() as GovernanceSurfaceContract['runtime_topology'],
  };
}

export function validateGovernanceSurfaceContract(content: JsonObject): boolean {
  const familyBoundary = objectValue(content.family_boundary);
  const formalEntry = objectValue(content.formal_entry);
  const runtimeTopology = objectValue(content.runtime_topology);
  const surfaces = stringArray(content.shared_governance_surfaces);
  const requiredSummaries = stringArray(content.required_summaries);
  const supportedProtocolLayer = stringArray(formalEntry.supported_protocol_layer);
  const runtimeSupportedProtocolLayer = stringArray(runtimeTopology.supported_protocol_layer);

  return content.schema_version === 1
    && SHARED_GOVERNANCE_SURFACES.every((surface) => surfaces.includes(surface))
    && REQUIRED_GOVERNANCE_SUMMARIES.every((summary) => requiredSummaries.includes(summary))
    && stringArray(content.authoritative_audit_surfaces).includes('auditDeliverable')
    && stringArray(content.authoritative_audit_surfaces).includes('runtimeWatch')
    && stringArray(content.authoritative_review_surfaces).includes('getReviewState')
    && stringArray(content.authoritative_review_surfaces).includes('getPublicationProjection')
    && typeof familyBoundary.family_kind === 'string'
    && typeof familyBoundary.overlay === 'string'
    && typeof familyBoundary.profile_id === 'string'
    && typeof familyBoundary.direct_delivery_capable === 'boolean'
    && typeof familyBoundary.guarded_knowledge_poster === 'boolean'
    && typeof familyBoundary.human_publication === 'boolean'
    && formalEntry.default_formal_entry === 'CLI'
    && supportedProtocolLayer.length === 1
    && supportedProtocolLayer[0] === 'MCP'
    && formalEntry.internal_controller_surface === 'controller'
    && formalEntry.controller_repo_verified === false
    && runtimeTopology.runtime_substrate_owner === 'Codex CLI'
    && runtimeTopology.runtime_substrate_surface === 'codex_native_host_agent'
    && runtimeTopology.deployment_host === 'codex_local_operator_host'
    && runtimeTopology.deployment_host_status === 'active_primary'
    && runtimeTopology.default_formal_entry === 'CLI'
    && runtimeSupportedProtocolLayer.length === 1
    && runtimeSupportedProtocolLayer[0] === 'MCP'
    && runtimeTopology.internal_controller_surface === 'controller'
    && runtimeTopology.controller_repo_verified === false;
}

export function mergeContractLayers(base: JsonObject, override: JsonObject): JsonObject {
  if (!isPlainObject(base)) {
    return structuredClone(override) as JsonObject;
  }
  if (!isPlainObject(override)) {
    return structuredClone(base) as JsonObject;
  }

  const merged = structuredClone(base) as JsonObject;
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeContractLayers(merged[key], value);
      continue;
    }

    merged[key] = structuredClone(value) as JsonValue;
  }

  return merged;
}

function requireText(name: string, value: unknown): string {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`Missing deliverable field: ${name}`);
  }
  return text;
}

export function hydrateDeliverableContract(
  registry: OverlayRegistry,
  request: HydrateDeliverableContractRequest = {},
): HydratedDeliverableContract {
  const overlayId = requireText('overlay', request.overlay);
  const overlay = registry.getOverlay(overlayId);
  const profileId = requireText(
    'profileId',
    request.profileId || overlay.defaultProfileId || '',
  );

  if (!overlay.profiles?.[profileId]) {
    throw new Error(`Unknown profile_id for overlay ${overlayId}: ${profileId}`);
  }
  if (typeof overlay.hydrateDeliverableContract !== 'function') {
    throw new Error(`Overlay ${overlayId} cannot hydrate deliverable contracts`);
  }

  return overlay.hydrateDeliverableContract({
    ...request,
    overlay: overlayId,
    profileId,
  });
}
