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
