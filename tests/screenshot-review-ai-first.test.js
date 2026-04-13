import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const HELPER_NAMES = [
  'safeText',
  'safeArray',
  'normalizeAiVisualJudgement',
  'hasAiVisualPass',
  'hasAiVisualBlock',
  'buildAiFirstVisualSlideReview',
  'aiFirstMechanicalCheckValue',
];

const FAMILY_FILES = [
  {
    label: 'ppt',
    file: 'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js',
  },
  {
    label: 'xiaohongshu',
    file: 'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js',
  },
  {
    label: 'poster_onepager',
    file: 'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime.js',
  },
];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) {
    throw new Error(`Missing function ${name}`);
  }
  const next = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

function loadHelpers(file) {
  const source = readFileSync(file, 'utf-8');
  const functionCode = HELPER_NAMES.map((name) => extractFunction(source, name)).join('\n\n');
  return new Function(`
    const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
    ${functionCode}
    return {
      buildAiFirstVisualSlideReview,
      aiFirstMechanicalCheckValue,
    };
  `)();
}

for (const family of FAMILY_FILES) {
  test(`${family.label} screenshot_review lets AI pass override auxiliary script warnings`, () => {
    const helpers = loadHelpers(family.file);
    const reviewed = helpers.buildAiFirstVisualSlideReview(
      {
        slide_id: 'S01',
        issues: ['occlusion_detected', 'visual_density_out_of_range', 'speaker_fit_out_of_range'],
        checks: {
          overflow_free: true,
          occlusion_free: false,
          visual_density_ok: false,
          speaker_fit_ok: false,
        },
      },
      {
        judgement: 'pass',
      },
    );

    assert.equal(reviewed.status, 'pass');
    assert.deepEqual(reviewed.issues, []);
    assert.deepEqual(reviewed.mechanical_issues, ['occlusion_detected', 'visual_density_out_of_range', 'speaker_fit_out_of_range']);
    assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'occlusion_free'), true);
    assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'visual_density_ok'), true);
  });

  test(`${family.label} screenshot_review still blocks hard overflow even if AI passes`, () => {
    const helpers = loadHelpers(family.file);
    const reviewed = helpers.buildAiFirstVisualSlideReview(
      {
        slide_id: 'S01',
        issues: ['overflow_detected'],
        checks: {
          overflow_free: false,
          occlusion_free: true,
          visual_density_ok: true,
          speaker_fit_ok: true,
        },
      },
      {
        judgement: 'pass',
      },
    );

    assert.equal(reviewed.status, 'block');
    assert.deepEqual(reviewed.issues, ['overflow_detected']);
  });

  test(`${family.label} screenshot_review blocks on AI visual fail even when mechanics are clean`, () => {
    const helpers = loadHelpers(family.file);
    const reviewed = helpers.buildAiFirstVisualSlideReview(
      {
        slide_id: 'S01',
        issues: [],
        checks: {
          overflow_free: true,
          occlusion_free: true,
          visual_density_ok: true,
          speaker_fit_ok: true,
        },
      },
      {
        judgement: 'block',
      },
    );

    assert.equal(reviewed.status, 'block');
    assert.deepEqual(reviewed.issues, ['ai_visual_risk']);
    assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'occlusion_free'), true);
  });

  test(`${family.label} screenshot_review normalizes fail-like judgements into block`, () => {
    const helpers = loadHelpers(family.file);
    const reviewed = helpers.buildAiFirstVisualSlideReview(
      {
        slide_id: 'S01',
        issues: [],
        checks: {
          overflow_free: true,
          occlusion_free: true,
          visual_density_ok: true,
          speaker_fit_ok: true,
        },
      },
      {
        judgement: 'fail',
      },
    );

    assert.equal(reviewed.status, 'block');
    assert.deepEqual(reviewed.issues, ['ai_visual_risk']);
  });
}
