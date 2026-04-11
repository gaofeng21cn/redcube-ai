export function buildDeliverableRecord({
  topicId,
  deliverableId,
  overlay,
  kind,
  title,
}) {
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
];

export const REQUIRED_GOVERNANCE_SUMMARIES = [
  'source_readiness_summary',
  'gate_summary',
  'operator_handoff',
  'lifecycle_stage_summary',
];

function buildGovernanceFamilyBoundary(contract = {}) {
  const overlay = String(contract?.overlay || '').trim();
  const profileId = String(contract?.profile_id || '').trim();
  const projectionModel = String(contract?.delivery_contract?.projection_model || '').trim();
  const humanPublication = projectionModel === 'human_publication';
  const guardedKnowledgePoster = overlay === 'poster_onepager' && profileId === 'knowledge_poster';

  return {
    overlay,
    profile_id: profileId,
    family_kind: guardedKnowledgePoster
      ? 'guarded_knowledge_poster'
      : (humanPublication ? 'human_publication' : 'direct_delivery_capable'),
    direct_delivery_capable: !humanPublication,
    guarded_knowledge_poster: guardedKnowledgePoster,
    human_publication: humanPublication,
  };
}

export function buildGovernanceSurfaceContract(contract = {}) {
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
  };
}

export function validateGovernanceSurfaceContract(content) {
  const familyBoundary = content?.family_boundary || {};
  const surfaces = Array.isArray(content?.shared_governance_surfaces)
    ? content.shared_governance_surfaces
    : [];
  const requiredSummaries = Array.isArray(content?.required_summaries)
    ? content.required_summaries
    : [];
  const supportedProtocolLayer = Array.isArray(content?.formal_entry?.supported_protocol_layer)
    ? content.formal_entry.supported_protocol_layer
    : [];

  return content?.schema_version === 1
    && SHARED_GOVERNANCE_SURFACES.every((surface) => surfaces.includes(surface))
    && REQUIRED_GOVERNANCE_SUMMARIES.every((summary) => requiredSummaries.includes(summary))
    && Array.isArray(content?.authoritative_audit_surfaces)
    && content.authoritative_audit_surfaces.includes('auditDeliverable')
    && content.authoritative_audit_surfaces.includes('runtimeWatch')
    && Array.isArray(content?.authoritative_review_surfaces)
    && content.authoritative_review_surfaces.includes('getReviewState')
    && content.authoritative_review_surfaces.includes('getPublicationProjection')
    && typeof familyBoundary?.family_kind === 'string'
    && typeof familyBoundary?.overlay === 'string'
    && typeof familyBoundary?.profile_id === 'string'
    && typeof familyBoundary?.direct_delivery_capable === 'boolean'
    && typeof familyBoundary?.guarded_knowledge_poster === 'boolean'
    && typeof familyBoundary?.human_publication === 'boolean'
    && content?.formal_entry?.default_formal_entry === 'CLI'
    && supportedProtocolLayer.length === 1
    && supportedProtocolLayer[0] === 'MCP'
    && content?.formal_entry?.internal_controller_surface === 'controller'
    && content?.formal_entry?.controller_repo_verified === false;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function mergeContractLayers(base, override) {
  if (!isPlainObject(base)) {
    return structuredClone(override);
  }
  if (!isPlainObject(override)) {
    return structuredClone(base);
  }

  const merged = structuredClone(base);
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeContractLayers(merged[key], value);
      continue;
    }

    merged[key] = structuredClone(value);
  }

  return merged;
}

function requireText(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`Missing deliverable field: ${name}`);
  }
  return text;
}

export function hydrateDeliverableContract(registry, request = {}) {
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
