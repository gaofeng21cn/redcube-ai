import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const FAMILY_VALIDATORS = [
  {
    label: 'ppt',
    file: 'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
    validator: 'validateRenderedSlideContent',
    slideId: 'S01',
  },
  {
    label: 'xiaohongshu',
    file: 'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime-family-parts/support.js',
    validator: 'validateRenderedSlideContent',
    slideId: 'P01',
  },
  {
    label: 'poster_onepager',
    file: 'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/authoring.js',
    validator: 'validateRenderedPosterHtml',
    slideId: 'P01',
  },
];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) {
    throw new Error(`Missing function ${name}`);
  }
  const rest = source.slice(start + 1);
  const nextMatch = rest.search(/\n\s*(?:export\s+)?function\s+/);
  const next = nextMatch === -1 ? -1 : start + 1 + nextMatch;
  return source.slice(start, next === -1 ? undefined : next);
}

function loadValidator(file, validatorName) {
  return loadFunction(file, validatorName);
}

function loadFunction(file, functionName) {
  const source = readFileSync(file, 'utf-8');
  const functionCode = extractFunction(source, functionName);
  return new Function(`
    function safeText(value, fallback = '') {
      const text = String(value ?? '').replace(/\\uFFFD+/g, '').trim();
      return text || fallback;
    }
    function safeArray(value) {
      return Array.isArray(value) ? value : [];
    }
    function requireText(value, label) {
      const text = safeText(value);
      if (!text) {
        throw new Error(\`Missing \${label} in upstream generation output\`);
      }
      return text;
    }
    ${functionCode}
    return ${functionName};
  `)();
}

function buildMinimalSlideHtml(slideId, withStyleTag = false) {
  return [
    `<div data-slide-root="true" data-slide-id="${slideId}">`,
    withStyleTag ? '<style>.leak{color:red;}</style>' : '',
    '<section data-qa-block="hero" data-primary-point="true">核心信息</section>',
    '<section data-qa-block="support">补充信息</section>',
    '</div>',
  ].join('');
}

for (const family of FAMILY_VALIDATORS) {
  test(`${family.label} render_html accepts normal audience-facing markup`, () => {
    const validate = loadValidator(family.file, family.validator);
    const html = buildMinimalSlideHtml(family.slideId, false);
    assert.equal(validate(html, family.slideId), html);
  });

  test(`${family.label} render_html rejects leaked style blocks`, () => {
    const validate = loadValidator(family.file, family.validator);
    assert.throws(
      () => validate(buildMinimalSlideHtml(family.slideId, true), family.slideId),
      /style/i,
    );
  });
}

test('ppt render_html rejects audience-visible authoring metadata and source identifiers', () => {
  const validate = loadValidator(
    'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
    'validateRenderedSlideContent',
  );
  const leakedHtml = [
    '<div data-slide-root="true" data-slide-id="S01">',
    '<section data-qa-block="hero" data-primary-point="true">第二篇研究结论</section>',
    '<section data-qa-block="support">speaker_notes: 这一页提醒讲者怎么讲；来源 MAT-003 / SRC-FILE-2。</section>',
    '</div>',
  ].join('');

  assert.throws(
    () => validate(leakedHtml, 'S01'),
    /authoring metadata/i,
  );
});

test('ppt render_html rejects internal paper IDs and talk-track meta-language', () => {
  const validate = loadValidator(
    'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
    'validateRenderedSlideContent',
  );
  const leakedHtml = [
    '<div data-slide-root="true" data-slide-id="S01">',
    '<section data-qa-block="hero" data-primary-point="true">Paper 003 · 发表表达边界</section>',
    '<section data-qa-block="support">建议表达：本页强调评分可解释性；来源口径：Paper 003 稿件。</section>',
    '</div>',
  ].join('');

  assert.throws(
    () => validate(leakedHtml, 'S01'),
    /authoring metadata/i,
  );
});

test('ppt authoring page budget honors explicit source page ranges', () => {
  const pageBudget = loadFunction(
    'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
    'pageBudget',
  );
  const contract = {
    goal: '制作科室内部汇报，幻灯片不超过30页。',
    shared_source_truth: {
      extracted_materials: {
        materials: [
          {
            content_text: '页数：不超过 30 页，建议 16-22 页。',
          },
        ],
      },
    },
  };

  assert.deepEqual(pageBudget('lecture_peer', contract), {
    min_slides: 16,
    max_slides: 22,
    source: 'explicit_request',
  });
});
