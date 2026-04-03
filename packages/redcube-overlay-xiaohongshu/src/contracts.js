export function buildTopicRecord({ topicId, title }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    status: 'draft',
    routes: ['research', 'storyline', 'note'],
  };
}
