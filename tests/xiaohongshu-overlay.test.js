import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTopicRecord,
  evaluateStorylineGate,
} from '../packages/redcube-overlay-xiaohongshu/src/index.js';

test('buildTopicRecord emits canonical xiaohongshu topic metadata', () => {
  const topic = buildTopicRecord({ topicId: 'topic-a', title: '甲状腺科普系列' });

  assert.equal(topic.topic_id, 'topic-a');
  assert.equal(topic.overlay, 'xiaohongshu');
  assert.equal(topic.status, 'draft');
  assert.deepEqual(topic.routes, ['research', 'storyline', 'note']);
});

test('evaluateStorylineGate blocks empty storyline content', () => {
  const report = evaluateStorylineGate({ storylineText: '' });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['storyline_empty']);
});

test('evaluateStorylineGate passes well-formed storyline content', () => {
  const report = evaluateStorylineGate({
    storylineText: '# 叙事逻辑\n\n## 核心冲突\n\n围绕误区到行动组织内容。',
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.blockers, []);
});
