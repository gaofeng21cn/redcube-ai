import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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
  const source = readImplementation(file);
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

function readImplementation(file) {
  const source = readFileSync(file, 'utf-8');
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? readFileSync(path.join(path.dirname(file), shell[1]), 'utf-8') : source;
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
    source: 'explicit_request_range',
  });
});

test('ppt authoring page budget derives from explicit slide plans independent of profile', () => {
  const pageBudget = loadFunction(
    'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
    'pageBudget',
  );
  const slidePlan = Array.from({ length: 21 }, (_, index) => {
    const pageNo = index + 1;
    return `${pageNo}. 第${pageNo}页：科室汇报逐页结构，覆盖封面、论文结果、方法边界或总结。`;
  }).join('\n');
  const contract = {
    goal: '制作科室内部汇报，幻灯片不超过30页。',
    shared_source_truth: {
      source_brief: {
        brief_text: `建议逐页结构如下：\n${slidePlan}`,
      },
    },
  };

  const peerBudget = pageBudget('lecture_peer', contract);
  assert.deepEqual(peerBudget, {
    min_slides: 21,
    max_slides: 21,
    source: 'source_slide_plan_count',
  });
  assert.deepEqual(pageBudget('executive_briefing', contract), peerBudget);
});

test('ppt authoring page budget derives per-paper minimums from task evidence', () => {
  const pageBudget = loadFunction(
    'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.js',
    'pageBudget',
  );
  const contract = {
    goal: '三篇论文科室汇报，不超过30页。每篇至少4页：临床问题与终点、方法或模型策略、关键数字结果、解释与边界。',
    shared_source_truth: {
      source_brief: {
        brief_text: [
          '第一篇：术前 early non-GTR 风险分层。',
          '第二篇：术后 3 个月内分泌负担随访分层。',
          '第三篇：侵袭表型结构与 Knosp 边界。',
        ].join('\n'),
      },
    },
  };

  assert.deepEqual(pageBudget('lecture_peer', contract), {
    min_slides: 16,
    max_slides: 20,
    source: 'per_item_minimum_request',
  });
});
