import test from 'node:test';
import assert from 'node:assert/strict';

import { createNativePptPlanPreflightParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-plan-preflight.js';

function preflightParts() {
  return createNativePptPlanPreflightParts({
    nativeShapePlanOutputContract: () => ({ editable_shape_plan: {} }),
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
  });
}

test('native PPT retry feedback preserves prior fixes and emits executable shape repairs', () => {
  const parts = preflightParts();
  const firstFeedback = parts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [{
            reason: 'ai_first_text_box_height_below_readability_floor',
            shape_id: 'S01-evidence-text',
            role: 'evidence_item',
            minimum_height_in: 0.84,
          }],
        }],
      },
    },
    attemptIndex: 1,
    attemptArtifactRefs: ['attempt-01-validation.json'],
  });
  const secondFeedback = parts.buildNativeValidationFeedback({
    validation: {
      payload: {
        failures: [{
          slide_id: 'S01',
          failures: [
            {
              reason: 'ai_first_structural_text_collision',
              shape_id: 'S01-point-2-text',
              other_shape_id: 'S01-flow-rail',
              role: 'point_text',
            },
            {
              reason: 'ai_first_shape_outside_template_layout_zone',
              shape_id: 'S01-core',
              role: 'core_sentence',
              layout_zone_id: 'claim_zone',
              zone_bounds: { left_in: 0.78, top_in: 1.62, width_in: 14.44, height_in: 1.18 },
              zone_safe_bounds: { left_in: 0.8, top_in: 1.64, right_in: 15.2, bottom_in: 2.78 },
              required_delta_in: { left: 0, top: 0, right: 0.61, bottom: 0.04 },
            },
          ],
        }],
      },
    },
    attemptIndex: 2,
    attemptArtifactRefs: ['attempt-02-validation.json'],
    previousValidationFeedback: firstFeedback,
  });
  const fixIds = secondFeedback.required_shape_fixes.map((fix) => fix.shape_id);
  assert.equal(fixIds.includes('S01-evidence-text'), true);
  assert.equal(fixIds.includes('S01-point-2-text'), true);
  assert.equal(fixIds.includes('S01-core'), true);
  const outputContract = parts.nativeShapePlanOutputContractForAttempt('author_pptx_native', secondFeedback);
  const serialized = JSON.stringify(outputContract);
  assert.equal(serialized.includes('required_inside_zone'), true);
  assert.equal(serialized.includes('required_delta_in'), true);
});
