import test from 'node:test';
import assert from 'node:assert/strict';

import { deriveNoteWorkflow } from '../packages/redcube-agent/src/workbench-workflow.js';

function buildFixtureNote(overrides = {}) {
  return {
    slug: 'Note_01_第一篇',
    stageFiles: {
      planning: { fileName: '01_单篇策划.md' },
      infographicOutline: { fileName: '02_信息图大纲.md' },
      visualDirection: { fileName: '02A_视觉导演稿.md' },
      htmlGeneration: { fileName: '03_HTML生成说明.md' },
      publishCopy: null,
      visualReview: null,
      ...overrides.stageFiles,
    },
    artifacts: {
      html: { fileName: 'note_01_demo.html' },
      publishCopy: null,
      slides: [{ fileName: 'slide_01.png' }],
      ...overrides.artifacts,
    },
  };
}

test('deriveNoteWorkflow marks html stage done when html file exists', () => {
  const workflow = deriveNoteWorkflow(buildFixtureNote(), {});

  assert.equal(workflow.stages.find((stage) => stage.id === 'html_generation').status, 'done');
  assert.equal(workflow.stages.find((stage) => stage.id === 'publish_copy').status, 'pending');
  assert.equal(workflow.nextAction.stageId, 'publish_copy');
});

test('deriveNoteWorkflow marks downstream stages blocked when dependencies are missing', () => {
  const workflow = deriveNoteWorkflow(buildFixtureNote({
    stageFiles: {
      visualDirection: null,
      htmlGeneration: null,
    },
    artifacts: {
      html: null,
      slides: [],
    },
  }), {});

  assert.equal(workflow.stages.find((stage) => stage.id === 'visual_direction').status, 'pending');
  assert.equal(workflow.stages.find((stage) => stage.id === 'html_generation').status, 'blocked');
  assert.equal(workflow.stages.find((stage) => stage.id === 'visual_review').status, 'blocked');
  assert.equal(workflow.nextAction.stageId, 'visual_direction');
});
