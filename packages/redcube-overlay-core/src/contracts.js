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
