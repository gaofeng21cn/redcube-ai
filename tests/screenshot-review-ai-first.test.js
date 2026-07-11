import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPosterOnepagerReviewHelpers } from '../packages/redcube-runtime/dist/families/poster-onepager/poster-onepager-runtime-parts/review-helpers.js';

const HELPER_NAMES = [
  'safeText',
  'safeArray',
  'normalizeAiVisualJudgement',
  'hasAiVisualPass',
  'hasAiVisualBlock',
  'buildAiFirstVisualSlideReview',
  'aiFirstMechanicalCheckValue',
];

const RERUN_HELPER_NAMES = [
  'stageOrder',
  'rerunStageFromReviewSurface',
  'slideNeedsTargetedRevision',
  'collectSlidesNeedingTargetedRevision',
  'deriveScreenshotReviewRerunStage',
];

const FAMILY_FILES = [
  {
    label: 'ppt',
    file: 'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core.ts',
  },
  {
    label: 'xiaohongshu',
    file: 'packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime-family-parts/shared.ts',
  },
  {
    label: 'poster_onepager',
    file: 'packages/redcube-runtime/src/families/poster-onepager/poster-onepager-runtime-parts/review-helpers.ts',
  },
];

const SCREENSHOT_REVIEW_EVIDENCE_POLICY = Object.freeze({
  required_render_evidence_refs: Object.freeze([
    'rendered_page_refs',
    'page_manifest_ref',
    'non_empty_page_evidence_ref',
    'page_count_or_aspect_ratio_ref',
    'duplicate_or_hash_signal_ref',
    'crop_or_overflow_risk_ref',
    'field_leakage_signal_ref',
    'text_readability_signal_ref',
    'material_status_ref',
  ]),
  allowed_mechanical_outputs: Object.freeze([
    'typed_blocker',
    'repair_target_refs',
    'preserved_page_refs',
    'evidence_refs',
    'inventory_refs',
    'no_regression_refs',
  ]),
  forbidden_mechanical_outputs: Object.freeze([
    'visual_ready_verdict',
    'exportable_verdict',
    'handoffable_verdict',
    'publication_ready_verdict',
    'review_pass_verdict',
    'source_ready_verdict',
  ]),
});

const POSTER_HELPERS = createPosterOnepagerReviewHelpers({
  safeText: (value, fallback = '') => {
    const text = String(value || '').trim();
    return text || fallback;
  },
  safeArray: (value) => Array.isArray(value) ? value : [],
  sourceTruth: () => null,
  sourceMaterials: () => [],
  hardScreenshotBlockingIssues: new Set(['overflow_detected']),
  targetedScreenshotMechanicalIssues: new Set([
    'overflow_detected',
    'occlusion_detected',
    'visual_density_out_of_range',
    'block_content_overflow_detected',
  ]),
});

test('screenshot_review evidence policy keeps render QA refs-only and non-verdict', () => {
  assert.deepEqual(SCREENSHOT_REVIEW_EVIDENCE_POLICY.required_render_evidence_refs, [
    'rendered_page_refs',
    'page_manifest_ref',
    'non_empty_page_evidence_ref',
    'page_count_or_aspect_ratio_ref',
    'duplicate_or_hash_signal_ref',
    'crop_or_overflow_risk_ref',
    'field_leakage_signal_ref',
    'text_readability_signal_ref',
    'material_status_ref',
  ]);
  assert.equal(SCREENSHOT_REVIEW_EVIDENCE_POLICY.allowed_mechanical_outputs.includes('typed_blocker'), true);
  assert.equal(SCREENSHOT_REVIEW_EVIDENCE_POLICY.allowed_mechanical_outputs.includes('repair_target_refs'), true);
  assert.equal(SCREENSHOT_REVIEW_EVIDENCE_POLICY.allowed_mechanical_outputs.includes('preserved_page_refs'), true);
  assert.equal(SCREENSHOT_REVIEW_EVIDENCE_POLICY.allowed_mechanical_outputs.includes('no_regression_refs'), true);
  for (const forbidden of SCREENSHOT_REVIEW_EVIDENCE_POLICY.forbidden_mechanical_outputs) {
    assert.equal(
      SCREENSHOT_REVIEW_EVIDENCE_POLICY.allowed_mechanical_outputs.includes(forbidden),
      false,
      forbidden,
    );
  }
});

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) {
    if (name === 'safeText') {
      return "function safeText(value, fallback = '') { const text = String(value || '').trim(); return text || fallback; }";
    }
    if (name === 'safeArray') {
      return 'function safeArray(value) { return Array.isArray(value) ? value : []; }';
    }
    throw new Error(`Missing function ${name}`);
  }
  const rest = source.slice(start + 1);
  const nextMatch = rest.match(/\n\s*(?:(?:export\s+)?function\s+\w+|const\s+buildRenderReviewMachineGate\b)/);
  const next = nextMatch ? start + 1 + nextMatch.index : -1;
  return source.slice(start, next === -1 ? undefined : next);
}

function loadHelpers(file, extraNames = []) {
  if (file.includes('poster-onepager-runtime-parts/review-helpers.ts')) {
    return POSTER_HELPERS;
  }
  const source = file.includes('ppt-deck-runtime-family-parts/core.ts')
    ? `${readFileSync('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core-constants.ts', 'utf-8')}\n${readFileSync(file, 'utf-8')}`
    : readFileSync(file, 'utf-8');
  const extractConstExpression = (name, fallback) => {
    const match = source.match(new RegExp(`const ${name} = ([^;]+);`));
    return match ? match[1] : fallback;
  };
  const functionCode = [...HELPER_NAMES, ...extraNames].map((name) => extractFunction(source, name)).join('\n\n');
  return new Function(`
    const PAGE_FIX_ROUTE = ${extractConstExpression('PAGE_FIX_ROUTE', "'fix_html'")};
    const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = ${extractConstExpression('TARGETED_SCREENSHOT_MECHANICAL_ISSUES', "new Set(['overflow_detected', 'occlusion_detected', 'visual_density_out_of_range', 'block_content_overflow_detected'])")};
    const HARD_SCREENSHOT_BLOCKING_ISSUES = ${extractConstExpression('HARD_SCREENSHOT_BLOCKING_ISSUES', "new Set(['overflow_detected'])")};
    const TARGETED_SCREENSHOT_RERUN_CHECKS = ${extractConstExpression('TARGETED_SCREENSHOT_RERUN_CHECKS', "new Set(['ai_review_passed', 'overflow_free', 'occlusion_free', 'visual_density_ok'])")};
    const hardScreenshotBlockingIssues = HARD_SCREENSHOT_BLOCKING_ISSUES;
    const targetedScreenshotMechanicalIssues = TARGETED_SCREENSHOT_MECHANICAL_ISSUES;
    ${functionCode}
    return {
      normalizeAiVisualJudgement,
      buildAiFirstVisualSlideReview,
      aiFirstMechanicalCheckValue,
      ${extraNames.includes('slideNeedsTargetedRevision') ? 'slideNeedsTargetedRevision,' : ''}
      ${extraNames.includes('deriveScreenshotReviewRerunStage') ? 'deriveScreenshotReviewRerunStage,' : ''}
    };
  `)();
}

function baseSlide(overrides = {}) {
  return {
    slide_id: 'S01',
    issues: [],
    checks: {
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: true,
      ...overrides.checks,
    },
    ...overrides,
  };
}

for (const family of FAMILY_FILES) {
  test(`${family.label} screenshot_review keeps AI visual verdict authoritative without hiding mechanical evidence`, () => {
    const helpers = loadHelpers(family.file);
    const advisoryMechanical = helpers.buildAiFirstVisualSlideReview(
      baseSlide({
        issues: ['occlusion_detected', 'visual_density_out_of_range', 'speaker_fit_out_of_range'],
        checks: { occlusion_free: false, visual_density_ok: false, speaker_fit_ok: false },
      }),
      { judgement: 'pass' },
    );
    const hardOverflow = helpers.buildAiFirstVisualSlideReview(
      baseSlide({ issues: ['overflow_detected'], checks: { overflow_free: false } }),
      { judgement: 'pass' },
    );
    const aiBlock = helpers.buildAiFirstVisualSlideReview(baseSlide(), { judgement: 'fail' });

    assert.deepEqual(advisoryMechanical.mechanical_issues, [
      'occlusion_detected',
      'visual_density_out_of_range',
      'speaker_fit_out_of_range',
    ]);
    assert.equal(advisoryMechanical.status, family.label === 'ppt' ? 'block' : 'pass');
    assert.equal(hardOverflow.status, 'block');
    assert.deepEqual(hardOverflow.issues, ['overflow_detected']);
    assert.equal(aiBlock.status, 'block');
    assert.deepEqual(aiBlock.issues, ['ai_visual_risk']);
    assert.equal(helpers.aiFirstMechanicalCheckValue([advisoryMechanical], 'occlusion_free'), false);
    assert.equal(helpers.normalizeAiVisualJudgement('weak'), 'pass');
  });

  test(`${family.label} screenshot_review treats surfaced block content overflow as targeted page repair`, () => {
    const helpers = loadHelpers(family.file, ['slideNeedsTargetedRevision']);
    assert.equal(helpers.slideNeedsTargetedRevision({
      slide_id: family.label === 'xiaohongshu' ? 'N03' : 'S03',
      status: 'pass',
      issues: [],
      mechanical_issues: ['block_content_overflow_detected'],
      ai_review: { judgement: 'pass', recommended_fix: '放宽文本容器。' },
    }), true);
  });
}

const PPT_STAGE_SEQUENCE = {
  stage_sequence: {
    stages: [
      { stage_id: 'storyline' },
      { stage_id: 'detailed_outline' },
      { stage_id: 'slide_blueprint' },
      { stage_id: 'visual_direction' },
      { stage_id: 'render_html' },
      { stage_id: 'fix_html' },
      { stage_id: 'visual_director_review' },
      { stage_id: 'screenshot_review' },
    ],
  },
  review_surface: {
    rerun_from_stage: {
      ai_review_passed: 'fix_html',
      occlusion_free: 'fix_html',
      visual_density_ok: 'visual_direction',
      speaker_fit_ok: 'slide_blueprint',
      edge_clearance_ok: 'fix_html',
      title_typography_ok: 'fix_html',
      page_number_consistency_ok: 'fix_html',
    },
  },
};

test('ppt screenshot_review routes page-local mechanical failures to the earliest safe repair stage', () => {
  const helpers = loadHelpers(
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core.ts',
    RERUN_HELPER_NAMES,
  );
  const cases = [
    {
      failedChecks: ['ai_review_passed', 'occlusion_free', 'visual_density_ok'],
      issues: ['occlusion_detected', 'visual_density_out_of_range'],
      expected: 'fix_html',
    },
    {
      failedChecks: ['edge_clearance_ok', 'title_typography_ok'],
      issues: ['edge_clearance_out_of_range', 'title_typography_inconsistent'],
      expected: 'fix_html',
    },
    {
      failedChecks: ['page_number_consistency_ok'],
      issues: ['page_number_consistency_failed'],
      expected: 'fix_html',
    },
    {
      failedChecks: ['speaker_fit_ok'],
      issues: ['speaker_fit_out_of_range'],
      expected: 'slide_blueprint',
    },
  ];

  for (const item of cases) {
    const reviewed = helpers.buildAiFirstVisualSlideReview(
      baseSlide({ slide_id: 'S05', issues: item.issues }),
      { judgement: 'pass', recommended_fix: '恢复组件间留白。' },
    );
    assert.equal(helpers.deriveScreenshotReviewRerunStage(PPT_STAGE_SEQUENCE, item.failedChecks, [reviewed]), item.expected);
  }
});

test('xiaohongshu screenshot_review keeps local card and cover density failures on fix_html', () => {
  const helpers = loadHelpers(
    'packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime-family-parts/shared.ts',
    RERUN_HELPER_NAMES,
  );
  const contract = {
    stage_sequence: {
      stages: [
        { stage_id: 'research' },
        { stage_id: 'storyline' },
        { stage_id: 'single_note_plan' },
        { stage_id: 'visual_direction' },
        { stage_id: 'render_html' },
        { stage_id: 'fix_html' },
        { stage_id: 'visual_director_review' },
        { stage_id: 'screenshot_review' },
      ],
    },
    review_surface: {
      rerun_from_stage: {
        overflow_free: 'fix_html',
        occlusion_free: 'fix_html',
        visual_density_ok: 'visual_direction',
        cover_density_ok: 'single_note_plan',
      },
    },
  };

  for (const failedChecks of [['ai_review_passed', 'occlusion_free', 'visual_density_ok'], ['cover_density_ok']]) {
    const rerunStage = helpers.deriveScreenshotReviewRerunStage(contract, failedChecks, [{
      slide_id: 'N03',
      status: 'pass',
      issues: [],
      mechanical_issues: ['occlusion_detected', 'visual_density_out_of_range'],
      ai_review: { judgement: 'pass', recommended_fix: '重排卡片层级并恢复留白。' },
    }]);
    assert.equal(rerunStage, 'fix_html');
  }
});
