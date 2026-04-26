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
    file: 'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
  },
  {
    label: 'xiaohongshu',
    file: 'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/shared.js',
  },
  {
    label: 'poster_onepager',
    file: 'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/review-helpers.js',
  },
];

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
  const nextMatch = rest.match(/\n\s*(?:export\s+)?function\s+\w+/);
  const next = nextMatch ? start + 1 + nextMatch.index : -1;
  return source.slice(start, next === -1 ? undefined : next);
}

function loadHelpers(file, extraNames = []) {
  const source = readFileSync(file, 'utf-8');
  const extractConstExpression = (name, fallback) => {
    const match = source.match(new RegExp(`const ${name} = ([^;]+);`));
    return match ? match[1] : fallback;
  };
  const functionCode = [...HELPER_NAMES, ...extraNames].map((name) => extractFunction(source, name)).join('\n\n');
  return new Function(`
    const HARD_SCREENSHOT_BLOCKING_ISSUES = ${extractConstExpression('HARD_SCREENSHOT_BLOCKING_ISSUES', "new Set(['overflow_detected'])")};
    const PAGE_FIX_ROUTE = ${extractConstExpression('PAGE_FIX_ROUTE', "'fix_html'")};
    const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = ${extractConstExpression('TARGETED_SCREENSHOT_MECHANICAL_ISSUES', "new Set(['overflow_detected', 'occlusion_detected', 'visual_density_out_of_range', 'block_content_overflow_detected'])")};
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

for (const family of FAMILY_FILES) {
  test(`${family.label} screenshot_review keeps auxiliary mechanical warnings blocking even if AI passes`, () => {
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
    assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'occlusion_free'), false);
    assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'visual_density_ok'), false);
    assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'speaker_fit_ok'), false);
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

  test(`${family.label} screenshot_review treats weak judgements as advisory pass`, () => {
    const helpers = loadHelpers(family.file);
    assert.equal(helpers.normalizeAiVisualJudgement('weak'), 'pass');
    assert.equal(helpers.normalizeAiVisualJudgement('minor'), 'pass');
  });

  test(`${family.label} screenshot_review treats surfaced block content overflow as targeted page repair`, () => {
    const helpers = loadHelpers(family.file, ['slideNeedsTargetedRevision']);
    assert.equal(
      helpers.slideNeedsTargetedRevision({
        slide_id: family.label === 'xiaohongshu' ? 'N03' : 'S03',
        status: 'pass',
        issues: [],
        mechanical_issues: ['block_content_overflow_detected'],
        ai_review: { judgement: 'pass', recommended_fix: '放宽文本容器。' },
      }),
      true,
    );
  });

  if (family.label === 'ppt') {
    test(`${family.label} screenshot_review routes page-level occlusion and density failures back to fix_html`, () => {
      const helpers = loadHelpers(family.file, RERUN_HELPER_NAMES);
      const rerunStage = helpers.deriveScreenshotReviewRerunStage(
        {
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
            },
          },
        },
        ['ai_review_passed', 'occlusion_free', 'visual_density_ok'],
        [
          {
            slide_id: 'S05',
            status: 'pass',
            issues: [],
            mechanical_issues: ['occlusion_detected', 'visual_density_out_of_range'],
            ai_review: { judgement: 'pass', recommended_fix: '恢复组件间留白。' },
          },
        ],
      );

      assert.equal(rerunStage, 'fix_html');
    });

    test(`${family.label} screenshot_review treats edge clearance and title typography drift as fix_html page fixes`, () => {
      const helpers = loadHelpers(family.file, RERUN_HELPER_NAMES);
      const reviewed = helpers.buildAiFirstVisualSlideReview(
        {
          slide_id: 'S08',
          issues: ['edge_clearance_out_of_range', 'title_typography_inconsistent'],
          checks: {
            overflow_free: true,
            occlusion_free: true,
            visual_density_ok: true,
            speaker_fit_ok: true,
            edge_clearance_ok: false,
            title_typography_ok: false,
          },
        },
        {
          judgement: 'pass',
        },
      );

      assert.equal(reviewed.status, 'pass');
      assert.deepEqual(reviewed.mechanical_issues, ['edge_clearance_out_of_range', 'title_typography_inconsistent']);
      assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'edge_clearance_ok'), false);
      assert.equal(helpers.aiFirstMechanicalCheckValue([reviewed], 'title_typography_ok'), false);

      const rerunStage = helpers.deriveScreenshotReviewRerunStage(
        {
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
            },
          },
        },
        ['edge_clearance_ok', 'title_typography_ok'],
        [reviewed],
      );

      assert.equal(rerunStage, 'fix_html');
    });

    test(`${family.label} screenshot_review still routes speaker fit failures back to slide_blueprint`, () => {
      const helpers = loadHelpers(family.file, RERUN_HELPER_NAMES);
      const rerunStage = helpers.deriveScreenshotReviewRerunStage(
        {
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
            },
          },
        },
        ['speaker_fit_ok'],
        [
          {
            slide_id: 'S03',
            status: 'pass',
            issues: [],
            mechanical_issues: ['speaker_fit_out_of_range'],
            ai_review: { judgement: 'pass' },
          },
        ],
      );

      assert.equal(rerunStage, 'slide_blueprint');
    });
  }

  if (family.label === 'xiaohongshu') {
    test(`${family.label} screenshot_review routes page-level card failures back to fix_html`, () => {
      const helpers = loadHelpers(family.file, RERUN_HELPER_NAMES);
      const rerunStage = helpers.deriveScreenshotReviewRerunStage(
        {
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
        },
        ['ai_review_passed', 'occlusion_free', 'visual_density_ok'],
        [
          {
            slide_id: 'N03',
            status: 'pass',
            issues: [],
            mechanical_issues: ['occlusion_detected', 'visual_density_out_of_range'],
            ai_review: { judgement: 'pass', recommended_fix: '重排卡片层级并恢复留白。' },
          },
        ],
      );

      assert.equal(rerunStage, 'fix_html');
    });

    test(`${family.label} screenshot_review routes cover density failures to fix_html`, () => {
      const helpers = loadHelpers(family.file, RERUN_HELPER_NAMES);
      const rerunStage = helpers.deriveScreenshotReviewRerunStage(
        {
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
        },
        ['cover_density_ok'],
        [
          {
            slide_id: 'N01',
            status: 'pass',
            issues: [],
            mechanical_issues: [],
            ai_review: { judgement: 'pass' },
          },
        ],
      );

      assert.equal(rerunStage, 'fix_html');
    });
  }
}
