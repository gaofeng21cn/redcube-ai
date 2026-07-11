import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAiSlide,
  materializerPayload,
  runNativePlanValidation,
} from './helpers/ppt-native-python-layout-fixtures.js';

test('native PPTX one-slide sample rejects forbidden general board archetypes', () => {
  const slide = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '一份资料，三条生成路径，一个闭环判断',
    core: '判断交付闭环，要同时看同一输入、三条路径执行，以及三项交付门是否全部通过。',
    slotCount: 3,
  });
  slide.template_layout_binding = {
    ...slide.template_layout_binding,
    selected_archetype: 'executive_status_board',
  };
  const payload = materializerPayload([slide]);
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
  };
  const rejected = runNativePlanValidation(payload);
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_native_sample_forbidden_general_archetype/);
});
