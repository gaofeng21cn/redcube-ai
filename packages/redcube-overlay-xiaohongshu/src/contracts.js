export function buildTopicRecord({ topicId, title }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    status: 'draft',
    routes: ['research', 'storyline', 'note'],
  };
}
